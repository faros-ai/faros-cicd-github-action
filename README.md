# Faros CI/CD GitHub Action

A GitHub Action to report CI/CD information for code builds and deployments from a GitHub Action workflows to [Faros](https://www.faros.ai).

## Usage

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

### Report a code build (CI Event) To Faros

To report a code build to Faros specify `CI` in the `event` parameter and include the `CI` required fields.

```yaml
- name: Report code build to Faros
  id: send-ci-event
  uses: faros-ai/faros-cicd-github-action@main
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    api-url: ${{ env.FAROS_API_URL }}
    event: CI
    artifact: Docker://my-org/my-repo/artifactId
    run-status: success                               # possible values - success, failure, cancelled
    run-started-at: 1594938057000
    run-ended-at: 1594948069000
```

### Report a code deployment (CD Event) To Faros

To report an artifact deployment to Faros specify `CD` in the `event` parameter and include the `CD` required fields.

```yaml
- name: Report deployment to Faros
  id: send-cd-event
  uses: faros-ai/faros-cicd-github-action@main
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    api-url: ${{ env.FAROS_API_URL }}
    event: CD
    artifact: Docker://my-org/my-repo/artifactId
    deploy: CodeDeploy://MyService/<env>/deploymentId # possible env values - Dev, Prod, Staging, QA
    deploy-app-platform: ECS                          # platform application is deployed on
    deploy-status: Success                            # possible values - Success, Failed, Canceled
    deploy-started-at: 1594938057000
    deploy-ended-at: 1594938059000
    run-status: Success                               # possible values - success, failure, cancelled
    run-started-at: 1594938057000
    run-ended-at: 1594948069000
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
