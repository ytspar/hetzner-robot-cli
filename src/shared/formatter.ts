import Table from 'cli-table3';

export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

export function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

export function success(message: string): string {
  return `${colors.green}✓${colors.reset} ${message}`;
}

export function error(message: string): string {
  return `${colors.red}✗${colors.reset} ${message}`;
}

export function warning(message: string): string {
  return `${colors.yellow}⚠${colors.reset} ${message}`;
}

export function info(message: string): string {
  return `${colors.blue}ℹ${colors.reset} ${message}`;
}

export function heading(text: string): string {
  return `\n${colors.bold}${colors.cyan}${text}${colors.reset}\n${'─'.repeat(text.length)}`;
}

export function formatStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'ready':
    case 'active':
    case 'enabled':
    case 'success':
      return colorize(status, 'green');
    case 'installing':
    case 'in process':
    case 'running':
      return colorize(status, 'yellow');
    case 'maintenance':
    case 'disabled':
    case 'failed':
    case 'cancelled':
      return colorize(status, 'red');
    default:
      return status;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function createTable(head: string[], colWidths?: number[]): Table.Table {
  const options: Table.TableConstructorOptions = {
    head: head.map((h) => colorize(h, 'cyan')),
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
    style: {
      'padding-left': 1,
      'padding-right': 1,
    },
  };

  if (colWidths) {
    options.colWidths = colWidths;
  }

  return new Table(options);
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
