import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

// Mock fs and os modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('os', () => ({
  homedir: vi.fn(() => '/home/testuser'),
}));

// Mock inquirer prompts
vi.mock('@inquirer/prompts', () => ({
  input: vi.fn(),
  password: vi.fn(),
  confirm: vi.fn(),
}));

// Mock keytar
vi.mock('keytar', () => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  deletePassword: vi.fn(),
}));

// Import after mocks are set up
import {
  loadConfig,
  saveConfig,
  clearConfig,
  clearConfigFile,
  getCredentials,
  getCredentialsFromEnv,
  getCredentialsFromFile,
  hasCredentials,
  hasCredentialsSync,
  promptLogin,
  hasKeychainSupport,
  getKeychainCredentials,
  saveToKeychain,
  clearKeychain,
} from './config.js';

import { input, password, confirm } from '@inquirer/prompts';
import * as keytar from 'keytar';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockInput = vi.mocked(input);
const mockPassword = vi.mocked(password);
const mockConfirm = vi.mocked(confirm);
const mockKeytarGetPassword = vi.mocked(keytar.getPassword);
const mockKeytarSetPassword = vi.mocked(keytar.setPassword);
const mockKeytarDeletePassword = vi.mocked(keytar.deletePassword);

describe('Config Module', () => {
  const configDir = '/home/testuser/.hetzner-cli';
  const configFile = '/home/testuser/.hetzner-cli/config.json';

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear environment variables
    delete process.env.HETZNER_ROBOT_USER;
    delete process.env.HETZNER_ROBOT_PASSWORD;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should return empty object when config file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const result = loadConfig();

      expect(result).toEqual({});
      expect(mockExistsSync).toHaveBeenCalledWith(configFile);
    });

    it('should return parsed config when file exists', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ user: 'testuser', password: 'testpass' }));

      const result = loadConfig();

      expect(result).toEqual({ user: 'testuser', password: 'testpass' });
      expect(mockReadFileSync).toHaveBeenCalledWith(configFile, 'utf-8');
    });

    it('should return empty object when config file is invalid JSON', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid json');

      const result = loadConfig();

      expect(result).toEqual({});
    });
  });

  describe('saveConfig', () => {
    it('should create config directory if it does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      saveConfig({ user: 'testuser', password: 'testpass' });

      expect(mockMkdirSync).toHaveBeenCalledWith(configDir, { recursive: true, mode: 0o700 });
    });

    it('should write config file with correct permissions', () => {
      mockExistsSync.mockReturnValue(true);

      saveConfig({ user: 'testuser', password: 'testpass' });

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        configFile,
        JSON.stringify({ user: 'testuser', password: 'testpass' }, null, 2),
        { mode: 0o600 }
      );
    });
  });

  describe('clearConfigFile', () => {
    it('should write empty object when config file exists', () => {
      mockExistsSync.mockReturnValue(true);

      clearConfigFile();

      expect(mockWriteFileSync).toHaveBeenCalledWith(configFile, '{}', { mode: 0o600 });
    });

    it('should do nothing when config file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      clearConfigFile();

      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });
  });

  describe('clearConfig', () => {
    it('should clear both keychain and file', async () => {
      mockExistsSync.mockReturnValue(true);
      mockKeytarDeletePassword.mockResolvedValue(true);

      await clearConfig();

      expect(mockKeytarDeletePassword).toHaveBeenCalledWith('hetzner-cli', 'robot-api');
      expect(mockWriteFileSync).toHaveBeenCalledWith(configFile, '{}', { mode: 0o600 });
    });
  });

  describe('getCredentialsFromEnv', () => {
    it('should return credentials from environment variables', () => {
      process.env.HETZNER_ROBOT_USER = 'envuser';
      process.env.HETZNER_ROBOT_PASSWORD = 'envpass';

      const result = getCredentialsFromEnv();

      expect(result).toEqual({ user: 'envuser', password: 'envpass' });
    });

    it('should return null when env vars not set', () => {
      const result = getCredentialsFromEnv();

      expect(result).toBeNull();
    });

    it('should return null when only user is set', () => {
      process.env.HETZNER_ROBOT_USER = 'envuser';

      const result = getCredentialsFromEnv();

      expect(result).toBeNull();
    });
  });

  describe('getCredentialsFromFile', () => {
    it('should return credentials from config file', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ user: 'fileuser', password: 'filepass' }));

      const result = getCredentialsFromFile();

      expect(result).toEqual({ user: 'fileuser', password: 'filepass' });
    });

    it('should return null when config file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const result = getCredentialsFromFile();

      expect(result).toBeNull();
    });
  });

  describe('Keychain Functions', () => {
    describe('hasKeychainSupport', () => {
      it('should return true when keytar works', async () => {
        mockKeytarGetPassword.mockResolvedValue(null);

        const result = await hasKeychainSupport();

        expect(result).toBe(true);
      });

      it('should return false when keytar throws', async () => {
        mockKeytarGetPassword.mockRejectedValue(new Error('Keychain locked'));

        const result = await hasKeychainSupport();

        expect(result).toBe(false);
      });
    });

    describe('getKeychainCredentials', () => {
      it('should return credentials from keychain', async () => {
        mockKeytarGetPassword.mockResolvedValue(JSON.stringify({ user: 'keychainuser', password: 'keychainpass' }));

        const result = await getKeychainCredentials();

        expect(result).toEqual({ user: 'keychainuser', password: 'keychainpass' });
        expect(mockKeytarGetPassword).toHaveBeenCalledWith('hetzner-cli', 'robot-api');
      });

      it('should return null when no keychain entry exists', async () => {
        mockKeytarGetPassword.mockResolvedValue(null);

        const result = await getKeychainCredentials();

        expect(result).toBeNull();
      });

      it('should return null when keychain entry is invalid JSON', async () => {
        mockKeytarGetPassword.mockResolvedValue('invalid json');

        const result = await getKeychainCredentials();

        expect(result).toBeNull();
      });

      it('should return null when keychain entry is missing fields', async () => {
        mockKeytarGetPassword.mockResolvedValue(JSON.stringify({ user: 'onlyuser' }));

        const result = await getKeychainCredentials();

        expect(result).toBeNull();
      });
    });

    describe('saveToKeychain', () => {
      it('should save credentials to keychain', async () => {
        mockKeytarSetPassword.mockResolvedValue();

        const result = await saveToKeychain('testuser', 'testpass');

        expect(result).toBe(true);
        expect(mockKeytarSetPassword).toHaveBeenCalledWith(
          'hetzner-cli',
          'robot-api',
          JSON.stringify({ user: 'testuser', password: 'testpass' })
        );
      });

      it('should return false when keytar fails', async () => {
        mockKeytarSetPassword.mockRejectedValue(new Error('Keychain locked'));

        const result = await saveToKeychain('testuser', 'testpass');

        expect(result).toBe(false);
      });
    });

    describe('clearKeychain', () => {
      it('should delete keychain entry', async () => {
        mockKeytarDeletePassword.mockResolvedValue(true);

        await clearKeychain();

        expect(mockKeytarDeletePassword).toHaveBeenCalledWith('hetzner-cli', 'robot-api');
      });

      it('should not throw when delete fails', async () => {
        mockKeytarDeletePassword.mockRejectedValue(new Error('Not found'));

        await expect(clearKeychain()).resolves.toBeUndefined();
      });
    });
  });

  describe('getCredentials', () => {
    it('should return credentials from environment variables first', async () => {
      process.env.HETZNER_ROBOT_USER = 'envuser';
      process.env.HETZNER_ROBOT_PASSWORD = 'envpass';

      const result = await getCredentials();

      expect(result).toEqual({ user: 'envuser', password: 'envpass', source: 'environment' });
    });

    it('should return credentials from keychain when env vars not set', async () => {
      mockKeytarGetPassword.mockResolvedValue(JSON.stringify({ user: 'keychainuser', password: 'keychainpass' }));

      const result = await getCredentials();

      expect(result).toEqual({ user: 'keychainuser', password: 'keychainpass', source: 'keychain' });
    });

    it('should return credentials from config file when keychain empty', async () => {
      mockKeytarGetPassword.mockResolvedValue(null);
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ user: 'configuser', password: 'configpass' }));

      const result = await getCredentials();

      expect(result).toEqual({ user: 'configuser', password: 'configpass', source: 'file' });
    });

    it('should return null when no credentials available', async () => {
      mockKeytarGetPassword.mockResolvedValue(null);
      mockExistsSync.mockReturnValue(false);

      const result = await getCredentials();

      expect(result).toBeNull();
    });

    it('should prioritize env vars over keychain', async () => {
      process.env.HETZNER_ROBOT_USER = 'envuser';
      process.env.HETZNER_ROBOT_PASSWORD = 'envpass';
      mockKeytarGetPassword.mockResolvedValue(JSON.stringify({ user: 'keychainuser', password: 'keychainpass' }));

      const result = await getCredentials();

      expect(result).toEqual({ user: 'envuser', password: 'envpass', source: 'environment' });
    });

    it('should prioritize keychain over config file', async () => {
      mockKeytarGetPassword.mockResolvedValue(JSON.stringify({ user: 'keychainuser', password: 'keychainpass' }));
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ user: 'configuser', password: 'configpass' }));

      const result = await getCredentials();

      expect(result).toEqual({ user: 'keychainuser', password: 'keychainpass', source: 'keychain' });
    });
  });

  describe('hasCredentials', () => {
    it('should return true when credentials are available via env', async () => {
      process.env.HETZNER_ROBOT_USER = 'user';
      process.env.HETZNER_ROBOT_PASSWORD = 'pass';

      expect(await hasCredentials()).toBe(true);
    });

    it('should return true when credentials are available via keychain', async () => {
      mockKeytarGetPassword.mockResolvedValue(JSON.stringify({ user: 'user', password: 'pass' }));

      expect(await hasCredentials()).toBe(true);
    });

    it('should return false when no credentials available', async () => {
      mockExistsSync.mockReturnValue(false);
      mockKeytarGetPassword.mockResolvedValue(null);

      expect(await hasCredentials()).toBe(false);
    });
  });

  describe('hasCredentialsSync', () => {
    it('should return true when env credentials available', () => {
      process.env.HETZNER_ROBOT_USER = 'user';
      process.env.HETZNER_ROBOT_PASSWORD = 'pass';

      expect(hasCredentialsSync()).toBe(true);
    });

    it('should return true when file credentials available', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ user: 'user', password: 'pass' }));

      expect(hasCredentialsSync()).toBe(true);
    });

    it('should return false when only keychain credentials (not checked sync)', () => {
      mockExistsSync.mockReturnValue(false);
      // hasCredentialsSync doesn't check keychain

      expect(hasCredentialsSync()).toBe(false);
    });
  });

  describe('requireCredentials', () => {
    it('should return existing credentials when available', async () => {
      process.env.HETZNER_ROBOT_USER = 'envuser';
      process.env.HETZNER_ROBOT_PASSWORD = 'envpass';

      const { requireCredentials } = await import('./config.js');
      const result = await requireCredentials();

      expect(result).toEqual({ user: 'envuser', password: 'envpass' });
    });
  });

  describe('promptLogin', () => {
    it('should prompt for credentials and save to keychain when available', async () => {
      mockInput.mockResolvedValue('promptuser');
      mockPassword.mockResolvedValue('promptpass');
      mockConfirm.mockResolvedValue(true);
      mockKeytarGetPassword.mockResolvedValue(null);
      mockKeytarSetPassword.mockResolvedValue();
      mockExistsSync.mockReturnValue(false);

      const result = await promptLogin();

      expect(result).toEqual({ user: 'promptuser', password: 'promptpass' });
      expect(mockKeytarSetPassword).toHaveBeenCalledWith(
        'hetzner-cli',
        'robot-api',
        JSON.stringify({ user: 'promptuser', password: 'promptpass' })
      );
    });

    it('should fall back to file storage when keychain fails', async () => {
      mockInput.mockResolvedValue('promptuser');
      mockPassword.mockResolvedValue('promptpass');
      mockConfirm.mockResolvedValue(true);
      mockKeytarGetPassword.mockRejectedValue(new Error('Keychain unavailable'));
      mockKeytarSetPassword.mockRejectedValue(new Error('Keychain unavailable'));
      mockExistsSync.mockReturnValue(false);

      const result = await promptLogin();

      expect(result).toEqual({ user: 'promptuser', password: 'promptpass' });
      expect(mockWriteFileSync).toHaveBeenCalled();
    });

    it('should not save credentials when declined', async () => {
      mockInput.mockResolvedValue('promptuser');
      mockPassword.mockResolvedValue('promptpass');
      mockConfirm.mockResolvedValue(false);
      mockKeytarGetPassword.mockResolvedValue(null);
      mockExistsSync.mockReturnValue(false);

      const result = await promptLogin();

      expect(result).toEqual({ user: 'promptuser', password: 'promptpass' });
      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(mockKeytarSetPassword).not.toHaveBeenCalled();
    });

    it('should offer migration when file credentials exist and keychain available', async () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({ user: 'fileuser', password: 'filepass' }));
      mockKeytarGetPassword.mockResolvedValue(null);
      mockKeytarSetPassword.mockResolvedValue();
      mockConfirm.mockResolvedValue(true);

      const result = await promptLogin();

      expect(result).toEqual({ user: 'fileuser', password: 'filepass' });
      expect(mockKeytarSetPassword).toHaveBeenCalledWith(
        'hetzner-cli',
        'robot-api',
        JSON.stringify({ user: 'fileuser', password: 'filepass' })
      );
      // Should clear the file after migration
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/home/testuser/.hetzner-cli/config.json',
        '{}',
        { mode: 0o600 }
      );
    });
  });
});
