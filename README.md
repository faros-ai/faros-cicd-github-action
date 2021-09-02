# Faros CI/CD GitHub Action

A GitHub Action to report CI/CD information for code builds and deployments from a GitHub Action workflows to [Faros](https://www.faros.ai).

## Usage

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

### Report a CI Event To Faros

To report a code build to Faros specify `CI` in the `event` parameter and the build details.

```yaml
- name: Report code build to Faros
  id: send-ci-event
  uses: faros-ai/faros-cicd-github-action@main
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    api-url: ${{ env.FAROS_API_URL }}
    event: CI
    pipeline-id: MyService-build
    artifact: Docker://my-org/my-repo/artifact-id
    run-status: Success                          # possible values - Success, Failure, Cancelled otherwise defaults to Custom
    run-started-at: 1594938057000
    run-ended-at: 1594948069000
```

> :clipboard: Note: Whilst the `pipeline-id` is optional, it is recommended to provide one to uniquely identify this workflow in Faros since multiple GitHub workflows can have the same name. If the `pipeline-id` is not provided it will be generated from the workflow name in lowercase format `<GITHUB_ORG>_<REPO>_<GITHUB_WORKFLOW_NAME>`, e.g `my-org_my-repo_deployment`.

### Report a CD Event To Faros

To report a deployment to Faros specify `CD` in the `event` parameter and include the `CD` required fields.

```yaml
- name: Report deployment to Faros
  id: send-cd-event
  uses: faros-ai/faros-cicd-github-action@main
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    api-url: ${{ env.FAROS_API_URL }}
    event: CD
    deploy: CodeDeploy://MyService/Dev/deploymentId
    deploy-app-platform: ECS                 # platform application is deployed on
    pipeline-id: MyService-deploy-dev
    deploy-started-at: 1594938057000
    deploy-status: Queued                           # possible values - Canceled, Failed, Queued, Running, Success
```

## Authentication

Running the action requires a valid [Faros](https://www.faros.ai) account and [API key](https://docs.faros.ai/#/api).

## Developing

```sh
$ npm i
```

## Releasing

Actions are run from GitHub repos so add the dist folder to the commit:

```
$ npm run package
$ git add dist
```

Push the changes to a branch and open a PR.

## License Summary

This code is made available under the MIT license.
