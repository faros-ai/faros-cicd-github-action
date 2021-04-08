import * as core from '@actions/core';

import {Build, Deployment, Emit, Status} from './emit';

const BUILD = 'build';
const DEPLOYMENT = 'deployment';
const MODEL_TYPES = [BUILD, DEPLOYMENT];

async function run(): Promise<void> {
  try {
    const apiKey = core.getInput('api-key', {required: true});
    const url = core.getInput('api-url', {required: true});
    const startedAt = BigInt(core.getInput('started-at', {required: true}));
    const endedAt = BigInt(core.getInput('ended-at'));
    const status = core.getInput('status', {required: true});
    const pipelineId = core.getInput('build-pipeline-id');

    const model = core.getInput('model', {required: true});
    if (!MODEL_TYPES.includes(model)) {
      throw new Error(
        `Unsupported model type: ${model}. Supported models are:
          ${MODEL_TYPES.join(',')}`
      );
    }
    const graph = core.getInput('graph') || 'default';

    const emit = new Emit(apiKey, url, graph);
    if (model === BUILD) {
      const build = makeBuildInfo(startedAt, endedAt, status, pipelineId);
      await emit.build(build);
    } else {
      const deployment = makeDeploymentInfo(startedAt, status, endedAt);
      await emit.deployment(deployment);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

function makeBuildInfo(
  startedAt: BigInt,
  endedAt: BigInt,
  status: string,
  pipelineId?: string
): Build {
  const repoName = getEnvVar('GITHUB_REPOSITORY');
  const splitRepo = repoName.split('/');
  const org = splitRepo[0];
  const repo = splitRepo[1];
  const id = getEnvVar('GITHUB_RUN_ID');
  const number = parseInt(getEnvVar('GITHUB_RUN_NUMBER'));
  const workflowName = getEnvVar('GITHUB_WORKFLOW');
  const pipeline = pipelineId
    ? pipelineId
    : `${org}/${repo}/${workflowName}`.toLowerCase();

  const serverUrl = getEnvVar('GITHUB_SERVER_URL');
  const name = `${repoName}_${workflowName}`;
  const sha = getEnvVar('GITHUB_SHA');

  return {
    uid: id,
    number,
    name,
    org,
    repo,
    sha,
    startedAt,
    endedAt,
    status: toBuildStatus(status),
    pipelineName: workflowName,
    pipelineId: pipeline,
    serverUrl
  };
}

function makeDeploymentInfo(
  startedAt: BigInt,
  status: string,
  endedAt?: BigInt
): Deployment {
  const deployId = core.getInput('deploy-id', {required: true});
  const appName = core.getInput('deploy-app-name', {required: true});
  const appPlatform = core.getInput('deploy-app-platform', {
    required: true
  });
  const deployPlatform = core.getInput('deploy-platform', {
    required: true
  });
  const buildOrgId = core.getInput('build-org-id', {
    required: true
  });
  const pipelineId = core.getInput('build-pipeline-id', {
    required: true
  });

  const buildPlatform = core.getInput('build-platform', {
    required: true
  });
  const buildId = core.getInput('build-id', {
    required: true
  });
  return {
    uid: deployId,
    buildOrgId,
    appName,
    appPlatform,
    startedAt,
    endedAt,
    status: {category: status, detail: status},
    buildId,
    buildPipelineId: pipelineId,
    buildPlatform,
    deployPlatform
  };
}

function toBuildStatus(status: string): Status {
  if (!status) {
    return {category: 'Unknown', detail: 'undefined'};
  }
  switch (status.toLowerCase()) {
    case 'cancelled':
      return {category: 'Canceled', detail: status};
    case 'failure':
      return {category: 'Failed', detail: status};
    case 'success':
      return {category: 'Success', detail: status};
    default:
      return {category: 'Custom', detail: status};
  }
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
