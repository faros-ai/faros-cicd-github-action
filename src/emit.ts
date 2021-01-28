import * as core from '@actions/core';
import axios from 'axios';
import JSONbigNative from 'json-bigint';

JSONbigNative({useNativeBigInt: true});

const REVISION_ORIGIN = 'faros-cicd-github-action';

export interface Build {
  readonly uid: string;
  readonly number: number;
  readonly name: string;
  readonly org: string;
  readonly repo: string;
  readonly startedAt: BigInt;
  readonly endedAt: BigInt;
  readonly status: string;
}

export interface Deployment {
  readonly uid: string;
  readonly appName: string;
  readonly appPlatform: string;
  readonly startedAt: BigInt;
  readonly status: string;
  readonly buildID: string;
  readonly source: string;
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

  async build(data: Build): Promise<void> {
    const job = {uid: data.uid, source: 'GitHub'};
    const buildKey = {uid: data.uid, job};
    const revisionEntries = {
      origin: REVISION_ORIGIN,
      entries: [
        {
          cicd_BuildCommitAssociation: {build: buildKey, commit: null}
        },
        {
          cicd_Build: {
            ...buildKey,
            number: data.number,
            name: data.name,
            startedAt: data.startedAt,
            endedAt: data.endedAt,
            status: data.status
          }
        }
      ]
    };
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
              uid: data.buildID,
              job: {uid: data.buildID, source: 'GitHub'}
            },
            source: data.source
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
