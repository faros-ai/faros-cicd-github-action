import * as core from '@actions/core';
import axios from 'axios';
import JSONbigNative from 'json-bigint';

JSONbigNative({useNativeBigInt: true});

const REVISION_ORIGIN = 'faros-cicd-github-action';
const BUILD_SOURCE = 'GitHub';

export interface Status {
  category: string;
  detail: string;
}

export interface Build {
  readonly uid: string;
  readonly number: number;
  readonly name: string;
  readonly org: string;
  readonly repo: string;
  readonly sha: string;
  readonly startedAt: BigInt;
  readonly endedAt: BigInt;
  readonly status: Status;
  readonly pipelineId: string;
  readonly pipelineName: string;
  readonly serverUrl: string;
}

export interface Deployment {
  readonly uid: string;
  readonly appName: string;
  readonly appPlatform: string;
  readonly buildId: string;
  readonly buildPipelineId: string;
  readonly buildOrgId: string;
  readonly buildPlatform: string;
  readonly deployPlatform: string;
  readonly startedAt: BigInt;
  readonly status: Status;
}

export class Emit {
  constructor(
    private readonly apiKey: string,
    private readonly apiUrl: string,
    private readonly graph: string
  ) {}
  private async emit(data: any): Promise<void> {
    const {data: result} = await axios.request({
      method: 'post',
      url: `${this.apiUrl}/graphs/${this.graph}/revisions`,
      headers: {
        Authorization: this.apiKey,
        'Content-Type': 'application/json'
      },
      data: JSONbigNative.stringify(data)
    });
    const revId = result.revision.uid;
    core.info(`Uploaded data in revision ${revId}...`);
    core.setOutput('revision-id', revId);
  }

  async build(build: Build): Promise<void> {
    const orgKey = {uid: build.org.toLowerCase(), source: BUILD_SOURCE};
    const pipelineKey = {uid: build.pipelineId, organization: orgKey};
    const buildKey = {uid: build.uid, pipeline: pipelineKey};
    const commitKey = {
      sha: build.sha,
      repository: {name: build.repo.toLowerCase(), organization: orgKey}
    };
    const revisionEntries = {
      origin: REVISION_ORIGIN,
      entries: [
        {
          cicd_Organization: {
            ...orgKey,
            name: build.org,
            url: `${build.serverUrl}/${build.org}`
          }
        },
        {
          cicd_BuildCommitAssociation: {build: buildKey, commit: commitKey}
        },
        {
          cicd_Build: {
            ...buildKey,
            number: build.number,
            name: build.name,
            startedAt: build.startedAt,
            endedAt: build.endedAt,
            status: build.status,
            url: `${build.serverUrl}/repos/${build.org}/repo/${build.repo}/actions/runs/${build.uid}`
          }
        },
        {
          cicd_Pipeline: {
            ...pipelineKey,
            name: build.pipelineName
            // url: 'get workflow url', // todo - get from workflowID
          }
        }
      ]
    };
    core.setOutput('pipeline-id', pipelineKey.uid);
    core.setOutput('build-id', buildKey.uid);
    core.setOutput('org-id', orgKey.uid);
    core.setOutput('org-source', orgKey.source);
    await this.emit(revisionEntries);
  }

  async deployment(data: Deployment): Promise<void> {
    const revisionEntries = {
      origin: REVISION_ORIGIN,
      entries: [
        {
          cicd_Deployment: {
            uid: data.uid,
            application: {name: data.appName, platform: data.appPlatform},
            startedAt: data.startedAt,
            status: data.status,
            build: {
              uid: data.buildId,
              pipeline: {
                uid: data.buildPipelineId,
                organization: {uid: data.buildOrgId, source: data.buildPlatform}
              }
            },
            source: data.deployPlatform
          }
        },
        {
          compute_Application: {name: data.appName, platform: data.appPlatform}
        }
      ]
    };
    await this.emit(revisionEntries);
  }
}
