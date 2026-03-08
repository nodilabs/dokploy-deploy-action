import * as core from '@actions/core';
import axios from 'axios';
import { jest } from '@jest/globals';
import { run } from './index';

jest.mock('@actions/core');
jest.mock('axios');

const mockedCore = core as jest.Mocked<typeof core>;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DokPloy Deploy Action', () => {
  const mockConfig = {
    apiKey: 'test-api-key',
    serverUrl: 'https://test-server.com',
    applicationIds: ['app-1', 'app-2']
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockedCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'dokploy_api_key':
          return mockConfig.apiKey;
        case 'dokploy_server_url':
          return mockConfig.serverUrl;
        case 'application_ids':
          return mockConfig.applicationIds.join(',');
        case 'image_tag':
          return 'latest';
        default:
          return '';
      }
    });
  });

  it('should update Docker provider and deploy applications', async () => {
    mockedAxios.post.mockResolvedValue({ status: 200 });

    await run();

    // Verify Docker provider updates
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${mockConfig.serverUrl}/api/application.saveDockerProvider`,
      {
        applicationId: mockConfig.applicationIds[0],
        imageTag: 'latest'
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': mockConfig.apiKey
        }
      }
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${mockConfig.serverUrl}/api/application.saveDockerProvider`,
      {
        applicationId: mockConfig.applicationIds[1],
        imageTag: 'latest'
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': mockConfig.apiKey
        }
      }
    );

    // Verify deployments
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${mockConfig.serverUrl}/api/application.deploy`,
      {
        applicationId: mockConfig.applicationIds[0]
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': mockConfig.apiKey
        }
      }
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      `${mockConfig.serverUrl}/api/application.deploy`,
      {
        applicationId: mockConfig.applicationIds[1]
      },
      {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': mockConfig.apiKey
        }
      }
    );

    expect(mockedCore.setFailed).not.toHaveBeenCalled();
  });

  it('should handle errors during Docker provider update', async () => {
    const errorMessage = 'Failed to update Docker provider';
    mockedAxios.post.mockRejectedValue(new Error(errorMessage));

    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith(
      expect.stringContaining(errorMessage)
    );
  });

  it('should handle errors during deployment', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ status: 200 }) // First Docker provider update succeeds
      .mockRejectedValueOnce(new Error('Failed to deploy')); // Deployment fails

    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Failed to deploy')
    );
  });

  it('should handle non-200 response from Docker provider update', async () => {
    mockedAxios.post.mockResolvedValue({ status: 400 });

    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Failed to update Docker provider')
    );
  });

  it('should handle non-200 response from deployment', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ status: 200 }) // Docker provider update succeeds
      .mockResolvedValueOnce({ status: 400 }); // Deployment fails

    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('Failed to deploy')
    );
  });

  it('should handle non-Error objects during Docker provider update', async () => {
    mockedAxios.post.mockRejectedValue('Some string error');

    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith('An unexpected error occurred');
  });

  it('should handle non-Error objects during deployment', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ status: 200 }) // Docker provider update succeeds
      .mockRejectedValueOnce('Some string error'); // Deployment fails with non-Error

    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith('An unexpected error occurred');
  });

  it('should handle missing required inputs', async () => {
    mockedCore.getInput.mockImplementation(() => {
      throw new Error('Required input missing');
    });

    await run();

    expect(mockedCore.setFailed).toHaveBeenCalledWith('Required input missing');
  });
});
