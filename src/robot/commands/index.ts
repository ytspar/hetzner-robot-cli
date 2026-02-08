import type { Command } from 'commander';
import { registerAuthCommands } from './auth.js';
import { registerServerCommands } from './server.js';
import { registerResetCommands } from './reset.js';
import { registerBootCommands } from './boot.js';
import { registerIpCommands } from './ip.js';
import { registerSubnetCommands } from './subnet.js';
import { registerFailoverCommands } from './failover.js';
import { registerRdnsCommands } from './rdns.js';
import { registerKeyCommands } from './key.js';
import { registerFirewallCommands } from './firewall.js';
import { registerVSwitchCommands } from './vswitch.js';
import { registerStorageBoxCommands } from './storagebox.js';
import { registerTrafficCommands } from './traffic.js';
import { registerWolCommands } from './wol.js';
import { registerCancelCommands } from './cancel.js';
import { registerOrderCommands } from './order.js';
import { registerInteractiveCommands } from './interactive.js';

export function registerRobotCommands(parent: Command): void {
  registerAuthCommands(parent);
  registerServerCommands(parent);
  registerResetCommands(parent);
  registerBootCommands(parent);
  registerIpCommands(parent);
  registerSubnetCommands(parent);
  registerFailoverCommands(parent);
  registerRdnsCommands(parent);
  registerKeyCommands(parent);
  registerFirewallCommands(parent);
  registerVSwitchCommands(parent);
  registerStorageBoxCommands(parent);
  registerTrafficCommands(parent);
  registerWolCommands(parent);
  registerCancelCommands(parent);
  registerOrderCommands(parent);
  registerInteractiveCommands(parent);
}
