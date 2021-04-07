import * as core from '@actions/core';
import axios from 'axios';
import * as cp from 'child_process';
import JSONbigNative from 'json-bigint';
import * as path from 'path';
import * as process from 'process';
import {mocked} from 'ts-jest/utils';

JSONbigNative({useNativeBigInt: true});

import {Emit} from '../src/emit';

jest.mock('axios');
jest.mock('@actions/core');

describe('Emit to Faros action', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('emits build info to faros', async () => {
    mocked(axios.request).mockResolvedValue({data: {revision: {uid: 1}}});
    const emit = new Emit('apiKey', 'apiUrl', 'default');
    await emit.build({
      uid: 'randomId',
      number: 100,
      org: 'faros-ai',
      repo: 'faros-cicd-github-action',
      name: 'faros-cicd-github-action-build-100',
      sha: 'sha',
      startedAt: BigInt(1594938057000),
      endedAt: BigInt(1594939057000),
      status: {category: 'Failed', detail: 'failure'},
      pipelineName: 'TestAction',
      pipelineId: 'faros-ai/emitter/testaction',
      serverUrl: 'https://github.com'
    });

    const data = {
      origin: 'faros-cicd-github-action',
      entries: [
        {
          cicd_Organization: {
            uid: 'faros-ai',
            source: 'GitHub',
            name: 'faros-ai',
            url: 'https://github.com/faros-ai'
          }
        },
        {
          cicd_BuildCommitAssociation: {
            build: {
              uid: 'randomId',
              pipeline: {
                uid: 'faros-ai/emitter/testaction',
                organization: {uid: 'faros-ai', source: 'GitHub'}
              }
            },
            commit: {
              sha: 'sha',
              repository: {
                name: 'faros-cicd-github-action',
                organization: {uid: 'faros-ai', source: 'GitHub'}
              }
            }
          }
        },
        {
          cicd_Build: {
            uid: 'randomId',
            pipeline: {
              uid: 'faros-ai/emitter/testaction',
              organization: {uid: 'faros-ai', source: 'GitHub'}
            },
            number: 100,
            name: 'faros-cicd-github-action-build-100',
            startedAt: BigInt(1594938057000),
            endedAt: BigInt(1594939057000),
            status: {category: 'Failed', detail: 'failure'},
            url:
              'https://github.com/repos/faros-ai/repo/faros-cicd-github-action/actions/runs/randomId'
          }
        },
        {
          cicd_Pipeline: {
            uid: 'faros-ai/emitter/testaction',
            organization: {uid: 'faros-ai', source: 'GitHub'},
            name: 'TestAction'
          }
        }
      ]
    };
    expect(axios.request).toBeCalledTimes(1);
    expect(axios.request).toHaveBeenNthCalledWith(1, {
      method: 'post',
      url: `apiUrl/graphs/default/revisions`,
      headers: {
        Authorization: 'apiKey',
        'Content-Type': 'application/json'
      },
      data: JSONbigNative.stringify(data)
    });
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'pipeline-id', 'faros-ai/emitter/testaction');
    expect(core.setOutput).toHaveBeenNthCalledWith(2, 'build-id', 'randomId');
    expect(core.setOutput).toHaveBeenNthCalledWith(3, 'org-id', 'faros-ai')
    expect(core.setOutput).toHaveBeenNthCalledWith(4, 'org-source', 'GitHub')
    expect(core.setOutput).toHaveBeenNthCalledWith(5  , 'revision-id', 1);
  });

  test('emits deployment info to faros', async () => {
    mocked(axios.request).mockResolvedValue({data: {revision: {uid: 2}}});
    const emit = new Emit('apiKey', 'apiUrl', 'default');
    await emit.deployment({
      uid: 'deployment1',
      appName: 'emitter',
      appPlatform: 'ECS',
      deployPlatform: 'Spinnaker',
      buildId: 'buildID1',
      buildOrgId: 'faros-ai',
      buildPipelineId: 'emit-action-flow',
      buildPlatform: 'GitHub',
      status: {category: 'Queued', detail: 'Created'},
      startedAt: BigInt(1594938057000)
    });
    expect(axios.request).toBeCalledTimes(1);
    const data = {
      origin: 'faros-cicd-github-action',
      entries: [
        {
          cicd_Deployment: {
            uid: 'deployment1',
            application: {name: 'emitter', platform: 'ECS'},
            startedAt: BigInt(1594938057000),
            status: {category: 'Queued', detail: 'Created'},
            build: {
              uid: 'buildID1',
              pipeline: {
                uid: 'emit-action-flow',
                organization: {uid: 'faros-ai', source: 'GitHub'}
              }
            },
            source: 'Spinnaker'
          }
        },
        {
          compute_Application: {name: 'emitter', platform: 'ECS'}
        }
      ]
    };
    expect(axios.request).toHaveBeenNthCalledWith(1, {
      method: 'post',
      url: `apiUrl/graphs/default/revisions`,
      headers: {
        Authorization: 'apiKey',
        'Content-Type': 'application/json'
      },
      data: JSONbigNative.stringify(data)
    });
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'revision-id', 2);
  });

  // For local testing only shows how the runner will run a javascript action.
  // Update with correct values for apiKey and apiUrl
  test.skip('test run emit build', () => {
    process.env['INPUT_API-KEY'] = 'apiKey';
    process.env['INPUT_API-URL'] = 'apiUrl';
    process.env['INPUT_STARTED-AT'] = '1594938057000';
    process.env['INPUT_ENDED-AT'] = '1605748281000';
    process.env['INPUT_GRAPH'] = 'unit-test';
    process.env['INPUT_MODEL'] = 'build';
    process.env['INPUT_STATUS'] = 'Success';
    process.env['GITHUB_REPOSITORY'] = 'faros-ai/faros-cicd-github-action';
    process.env['GITHUB_RUN_ID'] = '71882192';
    process.env['GITHUB_RUN_NUMBER'] = '10';
    process.env['GITHUB_WORKFLOW'] = 'CI/CD';
    process.env['GITHUB_SERVER_URL'] = 'https://github.com';
    process.env['GITHUB_SHA'] = 'f4c36eb0687e45f22b1e8b3044bf0cae7b8349fe';

    const np = process.execPath;
    const ip = path.join(__dirname, '..', 'lib', 'main.js');
    const options: cp.ExecFileSyncOptions = {
      env: process.env
    };
    console.log(cp.execFileSync(np, [ip], options).toString());
  });

  // For local testing only shows how the runner will run a javascript action.
  // Update with correct values for apiKey and apiUrl
  test.skip('test run emit deployment', () => {
    process.env['INPUT_API-KEY'] = 'apiKey';
    process.env['INPUT_API-URL'] = 'apiUrl';
    process.env['INPUT_DEPLOY-ID'] = 'deployID';
    process.env['INPUT_DEPLOY-APP-NAME'] = 'emitter';
    process.env['INPUT_DEPLOY-APP-PLATFORM'] = 'ECS';
    process.env['INPUT_DEPLOY-PLATFORM'] = 'Spinnaker';
    process.env['INPUT_BUILD-ID'] = '71882192';
    process.env['INPUT_BUILD-PIPELINE-ID'] = 'CI/CD';
    process.env['INPUT_BUILD-ORG-ID'] = 'faros-ai';
    process.env['INPUT_BUILD-PLATFORM'] = 'GitHub';
    process.env['INPUT_STARTED-AT'] = '1594938057000';
    process.env['INPUT_ENDED-AT'] = '1605748281000';
    process.env['INPUT_GRAPH'] = 'unit-test';
    process.env['INPUT_MODEL'] = 'deployment';
    process.env['INPUT_STATUS'] = 'Success';
    process.env['GITHUB_REPOSITORY'] = 'faros-ai/faros-cicd-github-action';
    process.env['GITHUB_WORKFLOW'] = 'CI/CD';

    const np = process.execPath;
    const ip = path.join(__dirname, '..', 'lib', 'main.js');
    const options: cp.ExecFileSyncOptions = {
      env: process.env
    };
    console.log(cp.execFileSync(np, [ip], options).toString());
  });
});
