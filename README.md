## Faros CI/CD Github Action

A GitHub Action to report CI/CD information for builds and deployments from a GitHub Action workflows to [Faros](https://www.faros.ai).

## Usage

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

### Report a Build Event To Faros CI/CD Build Model

To report a build event to Faros specify build in the `model` parameter and the build details.

```yaml
- name: Report build info to Faros
  id: emit-build-info
  uses: faros-ai/faros-cicd-github-action@main
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    api-url: ${{ env.FAROS_API_URL }}
    model: build
    build-pipeline-id: build-deploy-workflow # unique id to identify the workflow running the build
    status: Success                          # possible values - Success, Failure, Cancelled otherwise defaults to Custom
    started-at: 1594938057000
    ended-at: 1594948069000
```

> :clipboard: Note: Whilst the `build-pipeline-id` is optional, it is recommended to provide one to uniquely identify this workflow in Faros since multiple GitHub workflows can have the same name. If the `build-pipeline-id` is not provided it will be generated from the workflow name in the lowercase format `GITHUB_ORG/REPO/GITHUB_WORKFLOW_NAME`, e.g `my-org/my-repo/deployment`.

### Report a Deployment Event To Faros CI/CD Deployment Model

To report a build event to Faros specify `deploy` in the `model` parameter and the deployment details. To ensure the build is correctly linked to the build, provide the build model keys, i.e. `build-id`, `build-pipeline-id`, `build-org-id`, `build-source`.

```yaml
- name: Report deployment info to Faros
  id: emit-deployment-info
  uses: faros-ai/faros-cicd-github-action@main
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    api-url: ${{ env.FAROS_API_URL }}
    model: deploy
    deploy-id: deploymentId
    deploy-app-name: MyService               # name of the application being deployed
    deploy-app-platform: ECS                 # platform application is deployed on
    deploy-platform: CodeDeploy              # system used to orchestrate the deployment
    build-id: build-id
    build-pipeline-id: build-deploy-workflow
    build-org-id: my-org
    build-source: GitHub
    started-at: 1594938057000
    status: Queued                           # possible values - Canceled, Failed, Queued, Running, Success
```

> :clipboard: Note: If you have both the report build and report deployment steps in the same workflow you can use the outputs from the report build step as the inputs for the deployment step build parameters, e.g. `${{ steps.emit-build-info.outputs.build-id }}`

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
