import { confirm } from '@inquirer/prompts';
import * as fmt from '../shared/formatter.js';
import { HetznerCloudClient } from './client.js';
import { resolveToken } from './context.js';

export interface CloudActionOptions {
  token?: string;
  json?: boolean;
  yes?: boolean;
}

/**
 * Wrap a cloud API action with token resolution and error handling.
 */
export function cloudAction<T extends unknown[]>(
  fn: (client: HetznerCloudClient, ...args: T) => Promise<void>
): (...args: [...T, CloudActionOptions]) => Promise<void> {
  return async (...args) => {
    const options = args[args.length - 1] as CloudActionOptions;
    try {
      const token = await resolveToken(options.token);
      const client = new HetznerCloudClient(token);
      await fn(client, ...(args.slice(0, -1) as unknown as T));
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
export function cloudOutput<T>(data: T, formatter: (data: T) => string, options: CloudActionOptions): void {
  console.log(options.json ? fmt.formatJson(data) : formatter(data));
}

/**
 * Confirm destructive action unless --yes flag is set.
 */
export async function cloudConfirm(
  message: string,
  options: CloudActionOptions,
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
