import * as core from '@actions/core';
import axios, {AxiosInstance} from 'axios';
// import {loadModelsSync} from 'faros-canonical-models';
import fs from 'fs-extra';
import JSONbigNative from 'json-bigint';
import path from 'path';

JSONbigNative({useNativeBigInt: true});

const REVISION_ORIGIN = 'faros-cicd-github-action';
const BUILD_SOURCE = 'GitHub';
const canonicalPath = path.dirname(require.resolve('faros-canonical-models'));
const RESOURCES_PATH = path.join(canonicalPath, '..', 'resources');
const scalarspath = path.join(RESOURCES_PATH, '..', 'resources', 'scalars.gql');

const scalars = fs.readFileSync(scalarspath, 'utf-8');
const NAMESPACES_PATH = path.join(RESOURCES_PATH, 'models');
// const models = ['cicd', 'cicd-vcs', 'compute', 'vcs'];

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
  readonly buildSource: string;
  readonly deployPlatform: string;
  readonly startedAt: BigInt;
  readonly endedAt?: BigInt;
  readonly status: Status;
}

export class Emit {
  private readonly client: AxiosInstance;
  constructor(
    private readonly apiKey: string,
    private readonly apiUrl: string,
    private readonly graph: string
  ) {
    this.client = axios.create({
      baseURL: `${this.apiUrl}/graphs/${this.graph}`,
      headers: {authorization: this.apiKey}
    });
  }
  private async emit(data: any): Promise<void> {
    await this.uploadModels();
    const {data: result} = await this.client.request({
      method: 'post',
      url: `/revisions`,
      headers: {
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
            endedAt: data.endedAt,
            status: data.status,
            build: {
              uid: data.buildId,
              pipeline: {
                uid: data.buildPipelineId,
                organization: {uid: data.buildOrgId, source: data.buildSource}
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

  /**
   * Creates the graph if it doesn't exist and imports the CI/CD models
   */
  private async uploadModels(): Promise<void> {
    const testFile = fs.readFileSync(
      path.join(__dirname, '..', 'resources', 'lpl.gql'),
      'utf-8'
    );
    console.log(testFile);
    console.log(scalars);
    console.log(NAMESPACES_PATH);
    // Create graph if it doesn't exist
    await this.client.put('/');
    // Create or update models
    await this.client.request({
      method: 'post',
      url: '/models',
      headers: {'content-type': 'application/graphql'},
      data: testFile
    });
  }
}
