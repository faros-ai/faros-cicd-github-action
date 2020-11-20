## Faros Emit CI/CD information for builds and deployments Action for GitHub Actions

Emits CI/CD information for builds and deployments from Github workflow
context variables to Faros API

## Usage

```yaml
- name: Emit build info to Faros
  uses: faros-ai/faros-emit-cicd-info@v1
  with:
    apiKey: apiKey
    startedAt: 1594938057000
    endedAt: 1594948057000
```

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

## Authentication

> :clipboard: NOTE: Running the action requires a valid Faros account and
> apiKey. To setup Faros see the [getting started guide](https://docs.faros.ai/#/?id=installation)

## License Summary

This code is made available under the MIT license.
