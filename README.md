# Dokploy Deploy Action

[![CI](https://github.com/nodilabs/dokploy-deploy-action/actions/workflows/ci.yml/badge.svg)](https://github.com/nodilabs/dokploy-deploy-action/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A GitHub Action that automates deployments to [Dokploy](https://dokploy.com) by updating the Docker image tag on one or more applications and triggering their deployments — all in a single step.

## How it works

For each application ID you provide, the action performs two sequential API calls:

1. **Update Docker provider** — sets the Docker image tag on the application via `application.saveDockerProvider`
2. **Trigger deployment** — redeploys the application with the new image via `application.deploy`

If either step fails for any application, the action stops and marks the workflow as failed.

## Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `dokploy_api_key` | API key for authenticating with your Dokploy instance | Yes |
| `dokploy_server_url` | Base URL of your Dokploy server (e.g. `https://dokploy.example.com`) | Yes |
| `application_ids` | Comma-separated list of Dokploy application IDs to deploy | Yes |
| `image_tag` | Docker image tag to deploy (e.g. `latest`, `1.2.3`, a Git SHA) | Yes |

## Getting started

### 1. Find your Dokploy API key

Log in to your Dokploy instance → **Settings** → **API Keys** → generate a new key and copy it.

### 2. Find your application ID

Open the application in Dokploy. The application ID appears in the URL:

```
https://dokploy.example.com/dashboard/project/<project-id>/services/application/<application-id>
```

### 3. Add secrets to GitHub

In your repository go to **Settings → Secrets and variables → Actions** and add:

| Secret name | Value |
|-------------|-------|
| `DOKPLOY_API_KEY` | Your Dokploy API key |
| `DOKPLOY_SERVER_URL` | Your Dokploy server URL |

## Usage

### Basic — deploy a single application

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Dokploy
        uses: nodilabs/dokploy-deploy-action@v1
        with:
          dokploy_api_key: ${{ secrets.DOKPLOY_API_KEY }}
          dokploy_server_url: ${{ vars.DOKPLOY_SERVER_URL }}
          application_ids: ${{ vars.DOKPLOY_APPLICATION_IDS }}
          image_tag: 'latest'
```

### Deploy with a dynamic image tag

A common pattern is to tag images with the Git commit SHA so each deployment is traceable:

```yaml
name: Build & Deploy

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker image
        run: |
          docker build -t ghcr.io/your-org/your-app:${{ github.sha }} .
          docker push ghcr.io/your-org/your-app:${{ github.sha }}

      - name: Deploy to Dokploy
        uses: nodilabs/dokploy-deploy-action@v1
        with:
          dokploy_api_key: ${{ secrets.DOKPLOY_API_KEY }}
          dokploy_server_url: ${{ vars.DOKPLOY_SERVER_URL }}
          application_ids: ${{ vars.DOKPLOY_APPLICATION_IDS }}
          image_tag: 'ghcr.io/your-org/your-app:${{ github.sha }}'
```

### Deploy multiple applications at once

Pass a comma-separated list of application IDs to deploy them all in sequence:

```yaml
- name: Deploy all services to Dokploy
  uses: nodilabs/dokploy-deploy-action@v1
  with:
    dokploy_api_key: ${{ secrets.DOKPLOY_API_KEY }}
    dokploy_server_url: ${{ secrets.DOKPLOY_SERVER_URL }}
    application_ids: 'app-id-frontend,app-id-backend,app-id-worker'
    image_tag: ${{ github.sha }}
```

## Contributing

Contributions are welcome. Please open an issue first to discuss significant changes.

### Development setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build (for local verification)
npm run build

# Build minified distribution (what gets committed for releases)
npm run package
```

### Releasing a new version

1. Update the version in `package.json`
2. Push a tag following the `v*` pattern (e.g. `v1.2.0`):

```bash
git tag v1.2.0
git push origin v1.2.0
```

The [release workflow](.github/workflows/release.yml) will automatically run tests, build the distribution, and publish a GitHub Release.

## License

[MIT](LICENSE)
