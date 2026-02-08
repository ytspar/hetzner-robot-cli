#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';

import { registerRobotCommands } from './robot/commands/index.js';
import { registerCloudCommands } from './cloud/commands/index.js';
import { registerAuctionCommands } from './auction/commands.js';

config();

const program = new Command();

program
  .name('hetzner')
  .description('Unified CLI for Hetzner Robot API (dedicated servers) and Cloud API')
  .version('2.0.0')
  .option('-u, --user <username>', 'Hetzner Robot web service username')
  .option('-p, --password <password>', 'Hetzner Robot web service password (use - to read from stdin)')
  .option('--json', 'Output raw JSON instead of formatted tables');

// Register all robot commands directly on program (backward compat)
registerRobotCommands(program);

// Register cloud commands under 'hetzner cloud ...'
registerCloudCommands(program);

// Register auction commands (public API, no auth required)
registerAuctionCommands(program);

program.parse();
