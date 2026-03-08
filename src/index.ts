import * as core from '@actions/core';
import axios from 'axios';

interface DokPloyConfig {
  apiKey: string;
  serverUrl: string;
  applicationIds: string[];
  imageTag: string;
}

async function updateDockerProvider(config: DokPloyConfig, applicationId: string): Promise<void> {
  try {
    const response = await axios.post(
      `${config.serverUrl}/api/application.saveDockerProvider`,
      {
        applicationId,
        dockerImage: config.imageTag
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': `${config.apiKey}`
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to update Docker provider for application ${applicationId}`);
    }

    core.info(`Successfully updated Docker provider for application ${applicationId} with image tag ${config.imageTag}`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error updating Docker provider for application ${applicationId}: ${error.message}`);
    }
    throw error;
  }
}

async function deployApplication(config: DokPloyConfig, applicationId: string): Promise<void> {
  try {
    const response = await axios.post(
      `${config.serverUrl}/api/application.deploy`,
      {
        applicationId
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': `${config.apiKey}`
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to deploy application ${applicationId}`);
    }

    core.info(`Successfully triggered deployment for application ${applicationId}`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error deploying application ${applicationId}: ${error.message}`);
    }
    throw error;
  }
}

export async function run(): Promise<void> {
  try {
    const config: DokPloyConfig = {
      apiKey: core.getInput('dokploy_api_key', { required: true }),
      serverUrl: core.getInput('dokploy_server_url', { required: true }),
      applicationIds: core.getInput('application_ids', { required: true }).split(',').map(id => id.trim()),
      imageTag: core.getInput('image_tag', { required: true })
    };

    core.info('Starting DokPloy deployment process...');

    for (const applicationId of config.applicationIds) {
      core.info(`Processing application ${applicationId}...`);

      // First update the Docker provider
      await updateDockerProvider(config, applicationId);

      // Then trigger the deployment
      await deployApplication(config, applicationId);

      core.info(`Successfully processed application ${applicationId}`);
    }

    core.info('DokPloy deployment process completed successfully');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

// Only run if this is the main module (not imported for testing)
if (require.main === module) {
  run();
}
