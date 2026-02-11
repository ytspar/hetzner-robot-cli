import { readFileSync } from 'node:fs';
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
 * Parse a comma-separated "key=value,key2=value2" string into a labels object.
 */
export function parseLabels(val: string): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const pair of val.split(',')) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      labels[trimmed] = '';
    } else {
      labels[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
  }
  return labels;
}

/**
 * Read and parse a JSON file, returning the parsed content.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function readJsonFile<T = unknown>(path: string): T {
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Resolve a numeric ID string or a resource name to a numeric ID.
 * If the input is purely digits, returns it directly without any API call.
 * Otherwise, calls the resolver to look up the name and expects exactly one match.
 */
export async function resolveIdOrName(
  idOrName: string,
  resourceType: string,
  resolver: (name: string) => Promise<{ id: number; name: string | null }[]>
): Promise<number> {
  if (/^\d+$/.test(idOrName)) return parseInt(idOrName, 10);
  const matches = await resolver(idOrName);
  if (matches.length === 0) throw new Error(`${resourceType} '${idOrName}' not found`);
  if (matches.length > 1) throw new Error(`Multiple ${resourceType}s match '${idOrName}' (IDs: ${matches.map(m => m.id).join(', ')}). Use numeric ID instead.`);
  return matches[0].id;
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
