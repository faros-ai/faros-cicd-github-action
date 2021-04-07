## Faros CI/CD Github Action

A GitHub Action to emit CI/CD information for builds and deployments from a GitHub workflow
context variables to Faros API.

## Usage

```yaml
- name: Emit build info to Faros
  uses: faros-ai/faros-cicd-github-action@v1
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    model: build
    status: success
    started-at: 1594938057000
    ended-at: 1594948057000
    build-pipeline-id: faros-cicd-github-action-build-deploy
```

## Usage

```yaml
- name: Emit build info to Faros
  uses: faros-ai/faros-cicd-github-action@v1
  with:
    api-key: ${{ secrets.FAROS_API_KEY }}
    model: deploy
    started-at: 1594938057000
    ended-at: 1594948057000
    build-id: buildId
    build-pipeline-id: faros-cicd-github-action-build-deploy
    build-org-id: faros-ai
    build-platform: GitHub
```

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

## Authentication

> :clipboard: NOTE: Running the action requires a valid Faros account and
> API key. To setup Faros see the [getting started guide.](https://docs.faros.ai/#/?id=installation)

## License Summary

This code is made available under the MIT license.
