import * as core from '@actions/core';
import axios from 'axios';
import JSONbigNative from 'json-bigint';

JSONbigNative({useNativeBigInt: true});

export interface Build {
  readonly uid: string;
  readonly number: number;
  readonly name: string;
  readonly org: string;
  readonly repo: string;
  readonly sha: string;
  readonly startedAt: BigInt;
  readonly endedAt: BigInt;
  readonly status: string;
}

export interface Deployment {
  readonly uid: string;
  readonly appName: string;
  readonly appPlatform: string;
  readonly startedAt: BigInt;
  readonly buildID: string;
  readonly source: string;
}

export class Emit {
  constructor(
    private readonly apiKey: string,
    private readonly serverUrl: string
  ) {}
  private async emit(data: any): Promise<void> {
    const {data: result} = await axios.request({
      method: 'post',
      url: this.serverUrl + '/revisions',
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
    const revisionEntries = {
      revisionEntries: [
        {
          cicd_Build: {
            uid: data.uid,
            number: data.number,
            name: data.name,
            commit: {
              repository: {
                name: data.repo,
                organization: {uid: data.org, source: 'GitHub'}
              },
              sha: data.sha
            },
            startedAt: data.startedAt,
            endedAt: data.endedAt,
            status: data.status,
            source: 'GitHub'
          }
        }
      ]
    };
    await this.emit(revisionEntries);
  }

  async deployment(data: Deployment): Promise<void> {
    const revisionEntries = {
      revisionEntries: [
        {
          cicd_Deployment: {
            uid: data.uid,
            application: {name: data.appName, platform: data.appPlatform},
            startedAt: data.startedAt,
            status: 'Queued',
            build: {
              uid: data.buildID,
              source: 'GitHub'
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
