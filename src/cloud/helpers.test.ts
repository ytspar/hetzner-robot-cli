import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';

vi.mock('./context.js', () => ({
  resolveToken: vi.fn(),
}));

vi.mock('./client.js', () => ({
  HetznerCloudClient: vi.fn(),
}));

vi.mock('@inquirer/prompts', () => ({
  confirm: vi.fn(),
}));

vi.mock('../shared/formatter.js', () => ({
  error: vi.fn((msg: string) => `ERROR: ${msg}`),
  formatJson: vi.fn((data: unknown) => JSON.stringify(data, null, 2)),
}));

import { cloudAction, cloudOutput, cloudConfirm } from './helpers.js';
import { resolveToken } from './context.js';
import { HetznerCloudClient } from './client.js';
import { confirm } from '@inquirer/prompts';

const mockResolveToken = vi.mocked(resolveToken);
const mockConfirm = vi.mocked(confirm);
const mockHetznerCloudClient = vi.mocked(HetznerCloudClient);

describe('helpers', () => {
  let mockExit: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cloudAction', () => {
    it('should resolve token and create client', async () => {
      mockResolveToken.mockResolvedValue('test-token');
      const mockClient = {} as HetznerCloudClient;
      mockHetznerCloudClient.mockReturnValue(mockClient);

      const fn = vi.fn().mockResolvedValue(undefined);
      const action = cloudAction(fn);
      await action({ token: 'flag-token' });

      expect(mockResolveToken).toHaveBeenCalledWith('flag-token');
      expect(mockHetznerCloudClient).toHaveBeenCalledWith('test-token');
      expect(fn).toHaveBeenCalledWith(mockClient);
    });

    it('should pass through additional arguments before options', async () => {
      mockResolveToken.mockResolvedValue('test-token');
      const mockClient = {} as HetznerCloudClient;
      mockHetznerCloudClient.mockReturnValue(mockClient);

      const fn = vi.fn().mockResolvedValue(undefined);
      const action = cloudAction<[string, number]>(fn);
      await action('arg1', 42, { token: 'tok' });

      expect(fn).toHaveBeenCalledWith(mockClient, 'arg1', 42);
    });

    it('should handle Error and call process.exit(1)', async () => {
      mockResolveToken.mockRejectedValue(new Error('Token not found'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

      const action = cloudAction(vi.fn());
      await action({});

      expect(consoleSpy).toHaveBeenCalledWith('ERROR: Token not found');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle ExitPromptError and exit with 0', async () => {
      mockResolveToken.mockResolvedValue('tok');
      mockHetznerCloudClient.mockReturnValue({} as HetznerCloudClient);

      const exitErr = new Error('ExitPromptError');
      exitErr.name = 'ExitPromptError';
      const action = cloudAction(vi.fn().mockRejectedValue(exitErr));
      await action({});

      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('should handle unknown error type', async () => {
      mockResolveToken.mockRejectedValue('string error');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

      const action = cloudAction(vi.fn());
      await action({});

      expect(consoleSpy).toHaveBeenCalledWith('ERROR: An unknown error occurred');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('cloudOutput', () => {
    it('should output JSON when json option is true', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
      const formatter = vi.fn(() => 'formatted');

      cloudOutput({ id: 1 }, formatter, { json: true });

      expect(consoleSpy).toHaveBeenCalledWith(JSON.stringify({ id: 1 }, null, 2));
      expect(formatter).not.toHaveBeenCalled();
    });

    it('should use formatter when json option is false', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
      const formatter = vi.fn(() => 'formatted output');

      cloudOutput({ id: 1 }, formatter, { json: false });

      expect(formatter).toHaveBeenCalledWith({ id: 1 });
      expect(consoleSpy).toHaveBeenCalledWith('formatted output');
    });

    it('should use formatter when json option is undefined', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
      const formatter = vi.fn(() => 'table');

      cloudOutput('data', formatter, {});

      expect(formatter).toHaveBeenCalledWith('data');
      expect(consoleSpy).toHaveBeenCalledWith('table');
    });
  });

  describe('cloudConfirm', () => {
    it('should return true immediately when --yes is set', async () => {
      const result = await cloudConfirm('Delete?', { yes: true });

      expect(result).toBe(true);
      expect(mockConfirm).not.toHaveBeenCalled();
    });

    it('should prompt and return true when confirmed', async () => {
      mockConfirm.mockResolvedValue(true);

      const result = await cloudConfirm('Delete?', {});

      expect(mockConfirm).toHaveBeenCalledWith({ message: 'Delete?', default: false });
      expect(result).toBe(true);
    });

    it('should prompt, log Aborted, and return false when not confirmed', async () => {
      mockConfirm.mockResolvedValue(false);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());

      const result = await cloudConfirm('Delete?', {});

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Aborted.');
    });

    it('should pass custom default value to confirm', async () => {
      mockConfirm.mockResolvedValue(true);

      await cloudConfirm('Proceed?', {}, true);

      expect(mockConfirm).toHaveBeenCalledWith({ message: 'Proceed?', default: true });
    });
  });
});
