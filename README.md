## Faros CI/CD Github Action

A GitHub Action to report CI/CD information for builds and deployments from a GitHub workflow
context variables to Faros API.

## Usage

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

### Report a Build Event To Faros CI/CD Build Model

To report a build event to Faros specify build in the `model` parameter and the build details.

```yaml
- name: Emit build info to Faros
  uses: faros-ai/faros-cicd-github-action@v1
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    api-url: ${{ env.FAROS_API_URL }}
    model: build
    build-pipeline-id: build-deploy-workflow
    status: Success
    started-at: 1594938057000
    ended-at: 1594948069000
```

> :clipboard: Note: Whilst the build-pipeline-id is optional, it is recommended to provide one to uniquely identify this workflow in Faros since multiple GitHub workflows can have the same name. If the build-pipeline-id is not provided it will be generated from the workflow name in the lowercase format GITHUB_ORG/REPO/GITHUB_WORKFLOW_NAME.

### Report a Deployment Event To Faros CI/CD Deployment Model

To report a build event to Faros specify `deploy` in the `model` parameter and the deployment details. To ensure the build is correctly linked to the build, provide the build model keys, i.e. `build-id, build-pipeline-id, build-org-id, build-platform`.

```yaml
- name: Emit deployment info to Faros
  uses: faros-ai/faros-cicd-github-action@v1
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    api-url: ${{ env.FAROS_API_URL }}
    model: deploy
    deploy-id: deploymentId
    deploy-app-name: Emitter
    deploy-app-platform: ECS
    deploy-platform: CodeDeploy
    build-id: buildId
    build-pipeline-id: build-deploy-workflow
    build-org-id: faros-ai
    build-platform: GitHub
    started-at: 1594938057000
```

> :clipboard: Note: If you have both the report build and report deployment steps in the same workflow you can use the outputs from the report build step as the inputs for the deployment step build parameters. For example if the build step had an id `report-build-info`

```yaml
- name: Emit deployment info to Faros
  uses: faros-ai/faros-cicd-github-action@v1
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    api-url: ${{ env.FAROS_API_URL }}
    model: deploy
    deploy-id: deploymentId
    deploy-app-name: Emitter
    deploy-app-platform: ECS
    deploy-platform: CodeDeploy
    build-id: ${{ steps.report-build-info.outputs.build-id }}
    build-pipeline-id: ${{ steps.report-build-info.outputs.pipeline-id }}
    build-org-id: ${{ steps.report-build-info.outputs.org-id }}
    build-platform: ${{ steps.report-build-info.outputs.org-source }}
    status: Queued
    started-at: 1594938057000
```

## Authentication

> :clipboard: NOTE: Running the action requires a valid Faros account and
> API key. To setup Faros see the [getting started guide.](https://docs.faros.ai/#/?id=installation)

## Developing

```sh
$ npm i
```

## Releasing

Actions are run from GitHub repos so we will checkin the packed dist folder.

```
$ npm run package
$ git add dist
```

Then commit the changes, and open a PR

## License Summary

This code is made available under the MIT license.
