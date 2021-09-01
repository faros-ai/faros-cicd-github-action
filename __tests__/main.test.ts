import * as cp from 'child_process';
import * as path from 'path';
import * as process from 'process';

describe('Emit to Faros action', () => {
  
  // For local testing only shows how the runner will run a javascript action.
  // Update with correct values for apiKey and apiUrl
  test.skip('test run emit build', () => {
    process.env['INPUT_API-KEY'] = 'apiKey';
    process.env['INPUT_API-URL'] = 'http://localhost:8080';
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
    process.env['INPUT_API-URL'] = 'http://localhost:8080';
    process.env['INPUT_DEPLOY-ID'] = 'deployID';
    process.env['INPUT_DEPLOY-APP-NAME'] = 'emitter';
    process.env['INPUT_DEPLOY-APP-PLATFORM'] = 'ECS';
    process.env['INPUT_DEPLOY-PLATFORM'] = 'Spinnaker';
    process.env['INPUT_BUILD-ID'] = '71882192';
    process.env['INPUT_BUILD-PIPELINE-ID'] =
      'faros-ai/faros-cicd-github-action/ci/cd';
    process.env['INPUT_BUILD-ORG-ID'] = 'faros-ai';
    process.env['INPUT_BUILD-SOURCE'] = 'GitHub';
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
