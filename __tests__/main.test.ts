import * as cp from 'child_process';
import * as path from 'path';
import * as process from 'process';

describe('Emit to Faros action', () => {
  // For local testing only shows how the runner will run a javascript action.
  // Update with correct values for apiKey and apiUrl
  test('test run CI event', () => {
    process.env['INPUT_API-KEY'] = 'apiKey';
    process.env['INPUT_API-URL'] = 'http://localhost:8080';
    process.env['INPUT_RUN-STARTED-AT'] = '1594938057000';
    process.env['INPUT_RUN-ENDED-AT'] = '1605748281000';
    process.env['INPUT_GRAPH'] = 'unit-test';
    process.env['INPUT_EVENT'] = 'CI';
    process.env['INPUT_RUN-STATUS'] = 'Success';
    process.env['INPUT_RUN-STATUS-DETAILS'] = 'Everything is fine';
    process.env['INPUT_NO-ARTIFACT'] = 'true';
    process.env['INPUT_DEBUG'] = 'true';
    process.env['GITHUB_REPOSITORY'] = 'faros-ai/faros-cicd-github-action';
    process.env['GITHUB_RUN_ID'] = '71882192';
    process.env['GITHUB_RUN_NUMBER'] = '10';
    process.env['GITHUB_WORKFLOW'] = 'CI-CD';
    process.env['GITHUB_SERVER_URL'] = 'https://github.com';
    process.env['GITHUB_SHA'] = 'f4c36eb0687e45f22b1e8b3044bf0cae7b8349fe';
    process.env['FAROS_DRY_RUN'] = '1';

    const np = process.execPath;
    const ip = path.join(__dirname, '..', 'lib', 'main.js');
    const options: cp.ExecFileSyncOptions = {
      env: process.env,
      stdio: 'inherit'
    };
    cp.execFileSync(np, [ip], options);
  });

  // For local testing only shows how the runner will run a javascript action.
  // Update with correct values for apiKey and apiUrl
  test('test run CD event', () => {
    process.env['INPUT_API-KEY'] = 'apiKey';
    process.env['INPUT_API-URL'] = 'http://localhost:8080';
    process.env['INPUT_DEPLOY'] = 'Spinnaker://emitter/Dev/deployId';
    process.env['INPUT_DEPLOY-APP-PLATFORM'] = 'ECS';
    process.env['INPUT_DEPLOY-ENV-DETAILS'] = 'AWS us-east-1';
    process.env['INPUT_DEPLOY-STATUS-DETAILS'] = 'Everything is fine';
    process.env['INPUT_DEPLOY_STARTED-AT'] = '1594938057000';
    process.env['INPUT_DEPLOY_ENDED-AT'] = '1605748281000';
    process.env['INPUT_DEPLOY_TAGS'] = 'tag1:value1,tag2:value2';
    process.env['INPUT_GRAPH'] = 'unit-test';
    process.env['INPUT_EVENT'] = 'CD';
    process.env['INPUT_DEPLOY-STATUS'] = 'Success';
    process.env['INPUT_PIPELINE-ID'] = 'test-pipeline';
    process.env['INPUT_DEBUG'] = 'true';
    process.env['GITHUB_REPOSITORY'] = 'faros-ai/faros-cicd-github-action';
    process.env['GITHUB_WORKFLOW'] = 'CI-CD';
    process.env['GITHUB_SHA'] = 'f4c36eb0687e45f22b1e8b3044bf0cae7b8349fe';
    process.env['FAROS_DRY_RUN'] = '1';

    const np = process.execPath;
    const ip = path.join(__dirname, '..', 'lib', 'main.js');
    const options: cp.ExecFileSyncOptions = {
      env: process.env,
      stdio: 'inherit'
    };
    cp.execFileSync(np, [ip], options);
  });
});
