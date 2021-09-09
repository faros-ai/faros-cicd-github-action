import * as core from '@actions/core';
import {execSync} from 'child_process';

const FAROS_CLI_VERSION = 'v0.2.1';
const FAROS_SCRIPT_URL = `https://raw.githubusercontent.com/faros-ai/faros-events-cli/${FAROS_CLI_VERSION}/faros_event.sh`;
const FAROS_DEFAULT_URL = 'https://prod.api.faros.ai';
const FAROS_DEFAULT_GRAPH = 'default';

const CI = 'CI';
const CD = 'CD';
const EVENT_TYPES = [CI, CD];

interface Status {
  readonly category: string;
  readonly detail: string;
}

interface BaseEventInput {
  readonly apiKey: string;
  readonly url: string;
  readonly graph: string;
  readonly commitUri: string;
  readonly runUri: string;
  readonly runStatus: Status;
  readonly runStartTime?: bigint;
  readonly runEndTime?: bigint;
  readonly artifactUri?: string;
}

interface CDEventInput extends BaseEventInput {
  readonly deployUri: string;
  readonly deployStatus: string;
  readonly deployStartTime: bigint;
  readonly deployEndTime: bigint;
  readonly deployAppPlatform: string;
}

async function run(): Promise<void> {
  try {
    const event = core.getInput('event', {required: true});
    if (!EVENT_TYPES.includes(event)) {
      throw new Error(
        `Unsupported event type: ${event}. Supported events are:
          ${EVENT_TYPES.join(',')}`
      );
    }

    const baseInput = resolveInput();
    await downloadCLI();

    if (event === CI) {
      const ciInput = resolveCIEventInput(baseInput);
      await sendCIEvent(ciInput);
    } else {
      const cdInput = resolveCDEventInput(baseInput);
      await sendCDEvent(cdInput);
    }
  } catch (error) {
    core.setFailed(error as Error);
  }
}

function resolveInput(): BaseEventInput {
  const apiKey = core.getInput('api-key', {required: true});
  const url = core.getInput('api-url') || FAROS_DEFAULT_URL;
  const graph = core.getInput('graph') || FAROS_DEFAULT_GRAPH;

  // Construct commit URI
  const repoName = getEnvVar('GITHUB_REPOSITORY');
  const splitRepo = repoName.split('/');
  const org = splitRepo[0];
  const repo = splitRepo[1];
  const sha = getEnvVar('GITHUB_SHA');
  const commitUri = `GitHub://${org}/${repo}/${sha}`;

  // Construct run URI
  const runId = core.getInput('run-id') || getEnvVar('GITHUB_RUN_ID');
  const workflow = getEnvVar('GITHUB_WORKFLOW');
  const pipelineId = core.getInput('pipeline-id') || `${repo}_${workflow}`;
  const runUri = `GitHub://${org}/${pipelineId}/${runId}`;

  const runStatus = toRunStatus(core.getInput('run-status', {required: true}));
  const runStartTime = BigInt(core.getInput('run-started-at'));
  const runEndTime = BigInt(core.getInput('run-ended-at'));
  const artifactUri = core.getInput('artifact');

  return {
    apiKey,
    url,
    graph,
    commitUri,
    runUri,
    runStatus,
    runStartTime,
    runEndTime,
    artifactUri
  };
}

async function downloadCLI(): Promise<void> {
  execSync(
    `curl -s ${FAROS_SCRIPT_URL} --output faros_event.sh
    chmod u+x ./faros_event.sh`,
    {stdio: 'inherit'}
  );
}

function resolveCIEventInput(baseInput: BaseEventInput): BaseEventInput {
  // Default run start/end to NOW if not provided
  const runStartTime = baseInput.runStartTime || BigInt(Date.now());
  const runEndTime = baseInput.runEndTime || BigInt(Date.now());

  return {
    ...baseInput,
    runStartTime,
    runEndTime
  };
}

function resolveCDEventInput(baseInput: BaseEventInput): CDEventInput {
  const deployUri = core.getInput('deploy', {required: true});
  const deployStatus = core.getInput('deploy-status', {required: true});
  const deployAppPlatform = core.getInput('deploy-app-platform') || '';

  // Default deploy start/end to NOW if not provided
  const deployStartTime =
    BigInt(core.getInput('deploy-started-at')) || BigInt(Date.now());
  const deployEndTime =
    BigInt(core.getInput('deploy-ended-at')) || BigInt(Date.now());

  // Default run start/end to deploy start/end if not provided
  const runStartTime = baseInput.runStartTime || deployStartTime;
  const runEndTime = baseInput.runEndTime || deployEndTime;

  return {
    ...baseInput,
    deployUri,
    deployStatus,
    deployStartTime,
    deployEndTime,
    deployAppPlatform,
    runStartTime,
    runEndTime
  };
}

async function sendCIEvent(input: BaseEventInput): Promise<void> {
  let command = `./faros_event.sh CI \
    -k "${input.apiKey}" \
    -u "${input.url}" \
    -g "${input.graph}" \
    --commit "${input.commitUri}" \
    --run "${input.runUri}" \
    --run_status "${input.runStatus.category}" \
    --run_status_details "${input.runStatus.detail}" \
    --run_start_time "${input.runStartTime}" \
    --run_end_time "${input.runEndTime}"`;

  if (input.artifactUri) {
    command += ` \
    --artifact "${input.artifactUri}"`;
  }

  execSync(command, {stdio: 'inherit'});
}

async function sendCDEvent(input: CDEventInput): Promise<void> {
  let command = `./faros_event.sh CD \
    -k "${input.apiKey}" \
    -u "${input.url}" \
    -g "${input.graph}" \
    --deploy "${input.deployUri}" \
    --deploy_status "${input.deployStatus}" \
    --deploy_start_time "${input.deployStartTime}" \
    --deploy_end_time "${input.deployEndTime}" \
    --deploy_app_platform "${input.deployAppPlatform}" \
    --run "${input.runUri}" \
    --run_status "${input.runStatus.category}" \
    --run_status_details "${input.runStatus.detail}" \
    --run_start_time "${input.runStartTime}" \
    --run_end_time "${input.runEndTime}"`;

  if (input.artifactUri) {
    command += ` \
      --artifact "${input.artifactUri}"`;
  } else {
    command += ` \
      --commit "${input.commitUri}"`;
  }

  execSync(command, {stdio: 'inherit'});
}

function toRunStatus(status: string): Status {
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
    case 'canceled':
      return {category: 'Canceled', detail: ''};
    case 'failed':
      return {category: 'Failed', detail: ''};
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
