import * as core from '@actions/core';
import {Emit, Build} from './emit';
import {camelCase, startCase} from 'lodash';

const BUILD = 'build';
const DEPLOYMENT = 'deployment';
const MODEL_TYPES = [BUILD, DEPLOYMENT];

async function run(): Promise<void> {
  try {
    const apiKey = core.getInput('apiKey', {required: true});
    const startedAt = BigInt(core.getInput('startedAt', {required: true}));
    const endedAt = BigInt(core.getInput('endedAt'));
    const status = core.getInput('status', {required: true});
    const url = core.getInput('serverUrl')
      ? core.getInput('serverUrl')
      : 'https://api.faros.ai/v1';

    const model = core.getInput('model', {required: true});
    if (!MODEL_TYPES.includes(model)) {
      throw new Error(
        `Unsupported model type: ${model}. Supported models are:
          ${MODEL_TYPES.join(',')}`
      );
    }
    const emit = new Emit(apiKey, url);
    if (model == BUILD) {
      const build = makeBuildInfo(startedAt, endedAt, status);
      await emit.build(build);
    } else {
      const deployId = core.getInput('deploy-id', {required: true});
      const appName = core.getInput('deploy-app-name', {required: true});
      const appPlatform = core.getInput('deploy-app-platform', {
        required: true
      });
      const source = core.getInput('deploy-platform', {
        required: true
      });
      const buildID = getEnvVar('GITHUB_RUN_ID');
      await emit.deployment({
        uid: deployId,
        appName,
        appPlatform,
        startedAt,
        status,
        buildID,
        source
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

function makeBuildInfo(
  startedAt: BigInt,
  endedAt: BigInt,
  status: string
): Build {
  const repoName = getEnvVar('GITHUB_REPOSITORY');
  const splitRepo = repoName.split('/');
  const org = splitRepo[0];
  const repo = splitRepo[1];
  const id = getEnvVar('GITHUB_RUN_ID');
  const number = parseInt(getEnvVar('GITHUB_RUN_NUMBER'));
  const workflow = getEnvVar('GITHUB_WORKFLOW');
  const name = `${repoName}_${workflow}`;
  const sha = getEnvVar('GITHUB_SHA');
  let jobStatus;
  if (status === 'cancelled') jobStatus = 'Canceled';
  else if (status === 'failure') jobStatus = 'Failed';
  else jobStatus = startCase(camelCase(status));

  return {
    uid: id,
    number,
    name,
    org,
    repo,
    sha,
    startedAt,
    endedAt,
    status: jobStatus
  };
}

export function getEnvVar(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(
      `Failed to load required property ${name} from workflow environment variables.`
    );
  }
  return val;
}

run();
