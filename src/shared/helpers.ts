import { confirm } from '@inquirer/prompts';
import { readFileSync } from 'node:fs';

import { HetznerRobotClient } from '../robot/client.js';
import { requireCredentials } from './config.js';
import * as fmt from './formatter.js';

export interface ActionOptions {
  user?: string;
  password?: string;
  json?: boolean;
  yes?: boolean;
}

let client: HetznerRobotClient | null = null;

/**
 * Get or create API client with credentials.
 * Credential sources (in order): CLI flags, env vars, config file, interactive prompt.
 */
async function getClient(options: { user?: string; password?: string }): Promise<HetznerRobotClient> {
  if (client) return client;

  const { user } = options;
  let password = options.password;

  if (password === '-') {
    try {
      password = readFileSync(0, 'utf-8').trim();
    } catch {
      throw new Error('Failed to read password from stdin');
    }
  }

  if (user && password) {
    client = new HetznerRobotClient(user, password);
    return client;
  }

  const creds = await requireCredentials();
  client = new HetznerRobotClient(creds.user, creds.password);
  return client;
}

export function asyncAction<T extends unknown[]>(
  fn: (client: HetznerRobotClient, ...args: T) => Promise<void>
): (...args: [...T, ActionOptions]) => Promise<void> {
  return async (...args) => {
    const options = args[args.length - 1] as ActionOptions;
    try {
      const apiClient = await getClient(options);
      await fn(apiClient, ...(args.slice(0, -1) as unknown as T));
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ExitPromptError') || error.name === 'ExitPromptError') {
          process.exit(0);
        }
        console.error(fmt.error(error.message));
      } else {
        console.error(fmt.error('An unknown error occurred'));
      }
      process.exit(1);
    }
  };
}

/**
 * Output data as JSON or formatted table based on options.
 */
export function output<T>(data: T, formatter: (data: T) => string, options: ActionOptions): void {
  console.log(options.json ? fmt.formatJson(data) : formatter(data));
}

/**
 * Confirm destructive action unless --yes flag is set.
 * Returns true if confirmed, false if aborted.
 */
export async function confirmAction(
  message: string,
  options: ActionOptions,
  defaultValue = false
): Promise<boolean> {
  if (options.yes) return true;
  const confirmed = await confirm({ message, default: defaultValue });
  if (!confirmed) {
    console.log('Aborted.');
    return false;
  }
  return true;
}
