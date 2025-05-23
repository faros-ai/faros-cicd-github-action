import * as core from '@actions/core';
import {execSync} from 'child_process';

const FAROS_CLI_VERSION = 'v0.6.12';
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
  readonly pullRequestNumber?: string;
  readonly runSource: string;
  readonly runOrg: string;
  readonly runPipeline: string;
  readonly runId: string;
  readonly runStatus: Status;
  readonly runStartTime?: string;
  readonly runEndTime?: string;
  readonly artifactUri?: string;
  readonly noArtifact?: string;
  readonly debug?: string;
}

interface CDEventInput extends BaseEventInput {
  readonly deployUri: string;
  readonly deployStatus: Status;
  readonly deployEnvDetails: string;
  readonly deployStartTime: string;
  readonly deployEndTime: string;
  readonly deployAppPlatform: string;
  readonly deployTags?: string;
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
  const noArtifact = core.getInput('no-artifact') || 'false';
  const debug = core.getInput('debug') || 'false';

  // Construct commit URI
  const repoName = getEnvVar('GITHUB_REPOSITORY');
  const splitRepo = repoName.split('/');
  const org = splitRepo[0];
  const repo = splitRepo[1];
  const sha = getEnvVar('GITHUB_SHA');
  const commitUri =
    core.getInput('commit-uri') || `GitHub://${org}/${repo}/${sha}`;
  const pullRequestNumber = core.getInput('pull-request-number');

  // Construct run URI
  const workflow = getEnvVar('GITHUB_WORKFLOW');
  const runId = core.getInput('run-id') || getEnvVar('GITHUB_RUN_ID');
  const runOrg = org;
  const runPipeline = core.getInput('pipeline-id') || `${repo}_${workflow}`;
  const runSource = 'GitHub';

  const runStatus = toRunStatus(
    core.getInput('run-status', {required: true}),
    core.getInput('run-status-details')
  );
  const runStartTime = core.getInput('run-started-at');
  const runEndTime = core.getInput('run-ended-at');
  const artifactUri = core.getInput('artifact');

  return {
    apiKey,
    url,
    graph,
    commitUri,
    pullRequestNumber,
    runSource,
    runOrg,
    runPipeline,
    runId,
    runStatus,
    runStartTime,
    runEndTime,
    artifactUri,
    noArtifact,
    debug
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
  const runStartTime = baseInput.runStartTime || 'Now';
  const runEndTime = baseInput.runEndTime || 'Now';

  return {
    ...baseInput,
    runStartTime,
    runEndTime
  };
}

function resolveCDEventInput(baseInput: BaseEventInput): CDEventInput {
  const deployUri = core.getInput('deploy', {required: true});
  const deployStatus = toDeployStatus(
    core.getInput('deploy-status', {required: true}),
    core.getInput('deploy-status-details')
  );
  const deployAppPlatform = core.getInput('deploy-app-platform');
  const deployEnvDetails = core.getInput('deploy-env-details');
  const deployTags = core.getInput('deploy-tags');

  // Default deploy start/end to NOW if not provided
  const deployStartTime = core.getInput('deploy-started-at') || 'Now';
  const deployEndTime = core.getInput('deploy-ended-at') || 'Now';

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
    deployEnvDetails,
    deployTags,
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
    --run_id "${input.runId}" \
    --run_pipeline "${input.runPipeline}" \
    --run_org "${input.runOrg}" \
    --run_source "${input.runSource}" \
    --run_status "${input.runStatus.category}" \
    --run_status_details "${input.runStatus.detail}" \
    --run_start_time "${input.runStartTime}" \
    --run_end_time "${input.runEndTime}"`;

  if (input.artifactUri) {
    command += ` \
      --artifact "${input.artifactUri}"`;
  }
  if (input.pullRequestNumber) {
    command += ` \
      --pull_request_number "${input.pullRequestNumber}"`;
  }
  if (input.noArtifact === 'true') {
    command += ` \
      --no_artifact`;
  }
  if (input.debug === 'true') {
    command += ` \
      --debug`;
  }

  execSync(command, {stdio: 'inherit'});
}

async function sendCDEvent(input: CDEventInput): Promise<void> {
  let command = `./faros_event.sh CD \
    -k "${input.apiKey}" \
    -u "${input.url}" \
    -g "${input.graph}" \
    --deploy "${input.deployUri}" \
    --deploy_status "${input.deployStatus.category}" \
    --deploy_status_details "${input.deployStatus.detail}" \
    --deploy_start_time "${input.deployStartTime}" \
    --deploy_end_time "${input.deployEndTime}" \
    --deploy_app_platform "${input.deployAppPlatform}" \
    --deploy_env_details "${input.deployEnvDetails}" \
    --run_id "${input.runId}" \
    --run_pipeline "${input.runPipeline}" \
    --run_org "${input.runOrg}" \
    --run_source "${input.runSource}" \
    --run_status "${input.runStatus.category}" \
    --run_status_details "${input.runStatus.detail}" \
    --run_start_time "${input.runStartTime}" \
    --run_end_time "${input.runEndTime}"`;

  if (input.deployTags) {
    command += ` \
      --deploy_tags "${input.deployTags}"`;
  }
  if (input.artifactUri) {
    command += ` \
      --artifact "${input.artifactUri}"`;
  } else {
    command += ` \
      --commit "${input.commitUri}"`;
  }
  if (input.pullRequestNumber) {
    command += ` \
      --pull_request_number "${input.pullRequestNumber}"`;
  }
  if (input.noArtifact === 'true') {
    command += ` \
      --no_artifact`;
  }
  if (input.debug === 'true') {
    command += ` \
      --debug`;
  }

  execSync(command, {stdio: 'inherit'});
}

function toRunStatus(status: string, detail: string): Status {
  if (!status) {
    return {category: 'Unknown', detail: detail || 'undefined'};
  }
  switch (status.toLowerCase()) {
    case 'cancelled':
      return {category: 'Canceled', detail: detail || status};
    case 'failure':
      return {category: 'Failed', detail: detail || status};
    case 'success':
      return {category: 'Success', detail: detail || status};
    case 'canceled':
      return {category: 'Canceled', detail: detail || status};
    case 'failed':
      return {category: 'Failed', detail: detail || status};
    default:
      return {category: 'Custom', detail: detail || status};
  }
}

function toDeployStatus(status: string, detail: string): Status {
  if (!status) {
    return {category: 'Custom', detail: detail || 'undefined'};
  }
  switch (status.toLowerCase()) {
    case 'cancelled':
      return {category: 'Canceled', detail: detail || status};
    case 'failure':
      return {category: 'Failed', detail: detail || status};
    case 'success':
      return {category: 'Success', detail: detail || status};
    case 'canceled':
      return {category: 'Canceled', detail: detail || status};
    case 'failed':
      return {category: 'Failed', detail: detail || status};
    default:
      return {category: 'Custom', detail: detail || status};
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
