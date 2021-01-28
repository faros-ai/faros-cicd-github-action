import * as core from '@actions/core';
import axios from 'axios';
import * as cp from 'child_process';
import * as path from 'path';
import * as process from 'process';
import {mocked} from 'ts-jest/utils';

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
      repo: 'emitter',
      name: 'emit-action-flow',
      sha: 'sha',
      startedAt: BigInt(1594938057000),
      endedAt: BigInt(1594939057000),
      status: 'Failed'
    });
    expect(axios.request).toBeCalledTimes(1);
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'revision-id', 1);
  });

  test('emits deployment info to faros', async () => {
    mocked(axios.request).mockResolvedValue({data: {revision: {uid: 2}}});
    const emit = new Emit('apiKey', 'apiUrl', 'default');
    await emit.deployment({
      uid: 'deployment1',
      buildID: 'buildID1',
      appName: 'emitter',
      appPlatform: 'ECS',
      source: 'Spinnaker',
      status: 'Created',
      startedAt: BigInt(1594938057000)
    });
    expect(axios.request).toBeCalledTimes(1);
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'revision-id', 2);
  });
  // For local testing only shows how the runner will run a javascript action. Update with correct values
  test.skip('test runs', () => {
    process.env['INPUT_APIKEY'] = 'apiKey';
    process.env['INPUT_STARTEDAT'] = '1594938057000';
    process.env['INPUT_ENDEDAT'] = '1605748281000';
    process.env['INPUT_MODEL'] = 'build';
    process.env['GITHUB_REPOSITORY'] = 'faros-ai/emit-cicd-info-to-faros';
    process.env['GITHUB_RUN_ID'] = '71882192';
    process.env['GITHUB_RUN_NUMBER'] = '10';
    process.env['GITHUB_WORKFLOW'] = 'CI/CD Pipeline';
    process.env['GITHUB_SHA'] = 'f4c36eb0687e45f22b1e8b3044bf0cae7b8349fe';
    process.env['JOB_STATUS'] = 'Success';
    const ip = path.join(__dirname, '..', 'lib', 'main.js');
    const options: cp.ExecSyncOptions = {
      env: process.env
    };
    console.log(cp.execSync(`node ${ip}`, options).toString());
  });
});
