## Faros CI/CD Github Action

A GitHub Action to emit CI/CD information for builds and deployments from a GitHub workflow
context variables to Faros API.

## Usage

### Emit a Build Event To Faros CI/CD Build Model

```yaml
- name: Emit build info to Faros
  uses: faros-ai/faros-cicd-github-action@v1
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    model: build
    status: success
    started-at: 1594938057000
    ended-at: 1594948057000
    build-pipeline-id: build-deploy-workflow
```

> :clipboard: Note: Whilst the build-pipeline-id is optional, it is recommended to provide one to uniquely identify this workflow in Faros since multiple GitHub workflows can have the same name. If the build-pipeline-id is not provided it will be generated from the workflow name in the lowercase format GITHUB_ORG/REPO/GITHUB_WORKFLOW_NAME.

### Emit a Deployment Event To Faros CI/CD Deployment Model

```yaml
- name: Emit deployment info to Faros
  uses: faros-ai/faros-cicd-github-action@v1
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    model: deploy
    started-at: 1594938057000
    ended-at: 1594948057000
    build-id: buildId
    build-pipeline-id: build-deploy-workflow
    build-org-id: faros-ai
    build-platform: GitHub
```

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

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

Then check-in the changes to

## License Summary

This code is made available under the MIT license.
