#!/usr/bin/env node

import { Command, Option } from 'commander';
import { config } from 'dotenv';

import { registerRobotCommands } from './robot/commands/index.js';
import { registerCloudCommands } from './cloud/commands/index.js';
import { registerAuctionCommands } from './auction/commands.js';
import { generateReference, type ReferenceSection } from './shared/reference.js';

config();

const program = new Command();

program
  .name('hetzner')
  .description(
    'Unified CLI for Hetzner Robot API (dedicated servers), Cloud API, and public server auction.\n\n' +
    '  Three APIs, one tool:\n' +
    '    Robot commands   — manage dedicated servers (requires Robot web service credentials)\n' +
    '    Cloud commands   — manage cloud infrastructure under "hetzner cloud ..." (requires Cloud API token)\n' +
    '    Auction commands — browse server auction under "hetzner auction ..." (no auth required)\n\n' +
    '  Run "hetzner reference" for a complete structured reference of all commands and options.\n' +
    '  Run "hetzner <command> --help" for help on a specific command.'
  )
  .version('2.0.0')
  .option('-u, --user <username>', 'Hetzner Robot web service username (or set HETZNER_ROBOT_USER)')
  .option('-p, --password <password>', 'Hetzner Robot web service password (or set HETZNER_ROBOT_PASSWORD; use "-" to read from stdin)')
  .option('--json', 'Output raw JSON instead of formatted tables');

// Register all robot commands directly on program (backward compat)
registerRobotCommands(program);

// Register cloud commands under 'hetzner cloud ...'
registerCloudCommands(program);

// Register auction commands (public API, no auth required)
registerAuctionCommands(program);

// Built-in reference command (structured docs for LLMs and humans)
program
  .command('reference')
  .alias('ref')
  .description('Print complete CLI reference (optimized for LLM context)')
  .addOption(
    new Option('--section <section>', 'Show only a specific section')
      .choices(['robot', 'cloud', 'auction'])
  )
  .action((options: { section?: ReferenceSection }) => {
    console.log(generateReference(options.section));
  });

program.parse();
