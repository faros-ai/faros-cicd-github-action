import * as core from '@actions/core';
import {execSync} from 'child_process';

const FAROS_CLI_VERSION = 'v0.2.0';
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
  readonly commit_uri: string;
  readonly run_uri: string;
  readonly run_status: Status;
  readonly run_start_time?: bigint;
  readonly run_end_time?: bigint;
  readonly pipelineId?: string;
}

interface CIEventInput extends BaseEventInput {
  readonly artifact_uri?: string;
  readonly commit_uri: string;
}

interface CDEventInput extends BaseEventInput {
  readonly deploy_uri: string;
  readonly deployStatus: string;
  readonly deploy_start_time: bigint;
  readonly deploy_end_time: bigint;
  readonly deploy_app_platform: string;
  readonly artifact_uri?: string;
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
    downloadCLI();

    if (event === CI) {
      const ciInput = resolveCIEventInput(baseInput);
      await sendCIEvent(ciInput);
    } else {
      const cdInput = resolveCDEventInput(baseInput);
      await sendCDEvent(cdInput);
    }
  } catch (error) {
    core.setFailed(error.message);
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
  const commit_uri = `GitHub://${org}/${repo}/${sha}`;

  // Construct run URI
  const run_id = core.getInput('run-id') || getEnvVar('GITHUB_RUN_ID');
  const workflow = getEnvVar('GITHUB_WORKFLOW');
  const run_uri = `GitHub://${org}/${repo}_${workflow}/${run_id}`;
  const run_status = toRunStatus(core.getInput('run-status', {required: true}));
  const run_start_time = BigInt(core.getInput('run-started-at'));
  const run_end_time = BigInt(core.getInput('run-ended-at'));

  return {
    apiKey,
    url,
    graph,
    commit_uri,
    run_uri,
    run_status,
    run_start_time,
    run_end_time
  };
}

async function downloadCLI(): Promise<void> {
  execSync(
    `curl -s ${FAROS_SCRIPT_URL} --output faros_event.sh
    chmod u+x ./faros_event.sh`,
    {stdio: 'inherit'}
  );
}

function resolveCIEventInput(baseInput: BaseEventInput): CIEventInput {
  const artifact_uri = core.getInput('artifact');
  // Defualt run start/end to NOW if not provided
  const run_start_time = baseInput.run_start_time || BigInt(Date.now());
  const run_end_time = baseInput.run_end_time || BigInt(Date.now());

  return {
    ...baseInput,
    artifact_uri,
    run_start_time,
    run_end_time
  };
}

async function sendCIEvent(input: CIEventInput): Promise<void> {
  let command = `./faros_event.sh CI \
    -k "${input.apiKey}" \
    -u "${input.url}" \
    -g "${input.graph}" \
    --commit "${input.commit_uri}" \
    --run "${input.run_uri}" \
    --run_status "${input.run_status.category}" \
    --run_status_details "${input.run_status.detail}" \
    --run_start_time "${input.run_start_time}" \
    --run_end_time "${input.run_end_time}"`;

  if (input.artifact_uri) {
    command += ` \
    --artifact "${input.artifact_uri}"`;
  }

  execSync(command, {stdio: 'inherit'});
}

function resolveCDEventInput(baseInput: BaseEventInput): CDEventInput {
  const deploy_uri = core.getInput('deploy', {required: true});
  const deployStatus = core.getInput('deploy-status', {required: true});
  const artifact_uri = core.getInput('artifact');
  const deploy_app_platform = core.getInput('deploy-app-platform') || '';

  // Default deploy start/end to NOW if not provided
  const deploy_start_time =
    BigInt(core.getInput('deploy-started-at')) || BigInt(Date.now());
  const deploy_end_time =
    BigInt(core.getInput('deploy-ended-at')) || BigInt(Date.now());

  // Defualt run start/end to deploy start/end if not provided
  const run_start_time = baseInput.run_start_time || deploy_start_time;
  const run_end_time = baseInput.run_end_time || deploy_end_time;

  return {
    ...baseInput,
    deploy_uri,
    deployStatus,
    deploy_start_time,
    deploy_end_time,
    deploy_app_platform,
    artifact_uri,
    run_start_time,
    run_end_time
  };
}

async function sendCDEvent(input: CDEventInput): Promise<void> {
  let command = `./faros_event.sh CD \
    -k "${input.apiKey}" \
    -u "${input.url}" \
    -g "${input.graph}" \
    --deploy "${input.deploy_uri}" \
    --deploy_status "${input.deployStatus}" \
    --deploy_start_time "${input.deploy_start_time}" \
    --deploy_end_time "${input.deploy_end_time}" \
    --deploy_app_platform "${input.deploy_app_platform}" \
    --run "${input.run_uri}" \
    --run_status "${input.run_status.category}" \
    --run_status_details "${input.run_status.detail}" \
    --run_start_time "${input.run_start_time}" \
    --run_end_time "${input.run_end_time}"`;

  if (input.artifact_uri) {
    command += ` \
      --artifact "${input.artifact_uri}"`;
  } else {
    command += ` \
      --commit "${input.commit_uri}"`;
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
