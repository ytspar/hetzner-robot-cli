<p align="center">
  <img src="logo.svg" alt="hetzner-robot-cli logo" width="128" height="128">
</p>

# hetzner-robot-cli

[![npm version](https://badge.fury.io/js/hetzner-robot-cli.svg)](https://www.npmjs.com/package/hetzner-robot-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Feature-complete CLI and Node.js library for the [Hetzner Robot API](https://robot.hetzner.com/doc/webservice/en.html) (dedicated servers).

## Features

- **Complete API Coverage**: Servers, Reset, Boot (Rescue/Linux/VNC/Windows), IPs, Subnets, Failover, rDNS, SSH Keys, Firewall, vSwitch, Storage Box, Traffic, Wake-on-LAN, Ordering
- **CLI & Library**: Use from command line or import in your Node.js/TypeScript projects
- **TypeScript**: Full type definitions included
- **Secure Auth**: Multiple authentication methods including stdin for secure password passing
- **Interactive Mode**: Menu-driven interface for common operations

## Installation

```bash
# Global CLI installation
npm install -g hetzner-robot-cli

# Project dependency
npm install hetzner-robot-cli
```

## Getting Credentials

1. Go to [robot.hetzner.com](https://robot.hetzner.com)
2. Navigate to: **Settings > Web service settings**
3. Create a new web service user

> **Note:** This is separate from your main Hetzner account login.

---

## Library Usage

### Basic Example

```typescript
import { HetznerRobotClient } from 'hetzner-robot-cli';

const client = new HetznerRobotClient('username', 'password');

// List all servers
const servers = await client.listServers();
console.log(servers);

// Get server details
const server = await client.getServer('123.456.78.90');
console.log(server);

// Reset a server
await client.resetServer(123456, 'sw'); // software reset
```

### Server Management

```typescript
import { HetznerRobotClient } from 'hetzner-robot-cli';

const client = new HetznerRobotClient(
  process.env.HETZNER_USER!,
  process.env.HETZNER_PASSWORD!
);

// List servers
const servers = await client.listServers();

// Get server details
const details = await client.getServer(123456);

// Rename server
await client.updateServerName(123456, 'my-new-name');

// Cancel server
await client.cancelServer(123456, '2024-12-31', ['price']);

// Revoke cancellation
await client.revokeCancellation(123456);
```

### Reset Operations

```typescript
// Get reset options
const options = await client.getResetOptions(123456);
console.log('Available reset types:', options.reset.type);

// Execute reset
// Types: 'sw' (software), 'hw' (hardware), 'man' (manual), 'power', 'power_long'
await client.resetServer(123456, 'sw');
```

### Boot Configuration (Rescue Mode)

```typescript
// Activate rescue system
const rescue = await client.activateRescue(123456, 'linux', 64, ['ssh-key-fingerprint']);
console.log('Rescue password:', rescue.rescue.password);

// Deactivate rescue
await client.deactivateRescue(123456);

// Get last rescue activation
const lastRescue = await client.getLastRescue(123456);
```

### Linux Installation

```typescript
// Get available distributions
const linux = await client.getLinux(123456);
console.log('Available distros:', linux.linux.dist);

// Activate Linux installation
await client.activateLinux(123456, 'Debian-1210-bookworm-amd64-base', 64, 'en', ['ssh-fingerprint']);
```

### Failover IP Management

```typescript
// List failover IPs
const failovers = await client.listFailovers();

// Switch failover to another server
await client.switchFailover('failover-ip', 'target-server-ip');

// Delete failover routing
await client.deleteFailoverRouting('failover-ip');
```

### SSH Key Management

```typescript
// List SSH keys
const keys = await client.listSshKeys();

// Add SSH key
const newKey = await client.createSshKey('my-key', 'ssh-rsa AAAA...');

// Delete SSH key
await client.deleteSshKey('fingerprint');
```

### Storage Box

```typescript
// List storage boxes
const boxes = await client.listStorageBoxes();

// Get storage box details
const box = await client.getStorageBox(123);

// Create snapshot
await client.createStorageBoxSnapshot(123);

// List snapshots
const snapshots = await client.listStorageBoxSnapshots(123);
```

### Firewall

```typescript
// Get firewall config
const firewall = await client.getFirewall(123456);

// Enable/disable firewall
await client.updateFirewall(123456, 'active');
await client.updateFirewall(123456, 'disabled');
```

### Full Type Support

```typescript
import {
  HetznerRobotClient,
  Server,
  ServerDetails,
  Reset,
  ResetType,
  RescueConfig,
  Failover,
  SshKey,
  StorageBox,
} from 'hetzner-robot-cli';

// All responses are fully typed
const servers: { server: Server }[] = await client.listServers();
```

---

## CLI Usage

### Authentication

```bash
# Interactive login (saves to ~/.hetzner-cli/config.json)
hetzner auth login

# Environment variables
export HETZNER_ROBOT_USER=myuser
export HETZNER_ROBOT_PASSWORD=mypassword

# Command-line flags
hetzner server list --user myuser --password mypassword

# Secure: read password from stdin (not in shell history)
echo "$PASSWORD" | hetzner server list --user myuser --password -

# With 1Password
op read "op://vault/item/password" | hetzner server list -u $(op read "op://vault/item/user") -p -
```

### Server Commands

```bash
hetzner server list                    # List all servers
hetzner server get 123456              # Get server details
hetzner server rename 123456 new-name  # Rename server
```

### Reset Commands

```bash
hetzner reset options 123456           # Show reset options
hetzner reset execute 123456           # Software reset (default)
hetzner reset execute 123456 -t hw     # Hardware reset
hetzner reset execute 123456 -i        # Interactive type selection
hetzner reset execute 123 456 789 -y   # Reset multiple, skip confirmation
```

### Boot Commands

```bash
hetzner boot status 123456                           # Show boot config
hetzner boot rescue activate 123456 --os linux       # Activate rescue
hetzner boot rescue deactivate 123456                # Deactivate rescue
hetzner boot linux options 123456                    # Show Linux distros
hetzner boot linux activate 123456 -d Debian-12...  # Install Linux
```

### IP & Network Commands

```bash
hetzner ip list                         # List IPs
hetzner subnet list                     # List subnets
hetzner failover list                   # List failover IPs
hetzner failover switch 1.2.3.4 5.6.7.8 # Switch failover
hetzner rdns list                       # List reverse DNS
hetzner rdns set 1.2.3.4 host.example.com
```

### SSH Key Commands

```bash
hetzner key list                         # List SSH keys
hetzner key add my-key -f ~/.ssh/id_rsa.pub
hetzner key delete ab:cd:ef:12:34:56
```

### Storage Box Commands

```bash
hetzner storagebox list                  # List storage boxes
hetzner storagebox get 123               # Get details
hetzner storagebox snapshot list 123     # List snapshots
hetzner storagebox snapshot create 123   # Create snapshot
```

### Other Commands

```bash
hetzner firewall get 123456              # Get firewall config
hetzner vswitch list                     # List vSwitches
hetzner traffic query --ip 1.2.3.4       # Query traffic
hetzner wol send 123456                  # Wake on LAN
hetzner cancel status 123456             # Cancellation status
hetzner order products                   # List products
hetzner order market                     # Server auction
```

### Interactive Mode

```bash
hetzner interactive
# or
hetzner i
```

### JSON Output

```bash
hetzner server list --json               # Raw JSON output
hetzner server list --json | jq '.[].server.server_ip'
```

---

## API Reference

### HetznerRobotClient

#### Constructor

```typescript
new HetznerRobotClient(username: string, password: string)
```

#### Server Methods

| Method | Description |
|--------|-------------|
| `listServers()` | List all servers |
| `getServer(id)` | Get server details |
| `updateServerName(id, name)` | Rename server |
| `getCancellation(id)` | Get cancellation status |
| `cancelServer(id, date?, reasons?)` | Cancel server |
| `revokeCancellation(id)` | Revoke cancellation |

#### Reset Methods

| Method | Description |
|--------|-------------|
| `listResetOptions()` | List all reset options |
| `getResetOptions(id)` | Get reset options for server |
| `resetServer(id, type?)` | Reset server (sw/hw/man/power/power_long) |

#### Boot Methods

| Method | Description |
|--------|-------------|
| `getBootConfig(id)` | Get all boot configs |
| `activateRescue(id, os, arch?, keys?)` | Activate rescue |
| `deactivateRescue(id)` | Deactivate rescue |
| `activateLinux(id, dist, arch?, lang?, keys?)` | Activate Linux install |
| `deactivateLinux(id)` | Deactivate Linux |
| `activateVnc(id, dist, arch?, lang?)` | Activate VNC install |
| `activateWindows(id, dist, lang?)` | Activate Windows install |

#### IP Methods

| Method | Description |
|--------|-------------|
| `listIps()` | List all IPs |
| `getIp(ip)` | Get IP details |
| `updateIp(ip, warnings?, hourly?, daily?, monthly?)` | Update IP settings |
| `generateIpMac(ip)` | Generate separate MAC |
| `deleteIpMac(ip)` | Delete MAC |

#### Failover Methods

| Method | Description |
|--------|-------------|
| `listFailovers()` | List failover IPs |
| `getFailover(ip)` | Get failover details |
| `switchFailover(ip, targetIp)` | Switch routing |
| `deleteFailoverRouting(ip)` | Delete routing |

#### SSH Key Methods

| Method | Description |
|--------|-------------|
| `listSshKeys()` | List SSH keys |
| `getSshKey(fingerprint)` | Get key details |
| `createSshKey(name, data)` | Add SSH key |
| `updateSshKey(fingerprint, name)` | Rename key |
| `deleteSshKey(fingerprint)` | Delete key |

#### Firewall Methods

| Method | Description |
|--------|-------------|
| `getFirewall(id)` | Get firewall config |
| `updateFirewall(id, status, rules?)` | Update firewall |
| `deleteFirewall(id)` | Delete all rules |
| `listFirewallTemplates()` | List templates |

#### vSwitch Methods

| Method | Description |
|--------|-------------|
| `listVSwitches()` | List vSwitches |
| `getVSwitch(id)` | Get vSwitch details |
| `createVSwitch(name, vlan)` | Create vSwitch |
| `updateVSwitch(id, name?, vlan?)` | Update vSwitch |
| `deleteVSwitch(id, date?)` | Delete vSwitch |
| `addServerToVSwitch(vswitchId, serverId)` | Add server |
| `removeServerFromVSwitch(vswitchId, serverId)` | Remove server |

#### Storage Box Methods

| Method | Description |
|--------|-------------|
| `listStorageBoxes()` | List storage boxes |
| `getStorageBox(id)` | Get details |
| `updateStorageBox(id, ...)` | Update settings |
| `resetStorageBoxPassword(id)` | Reset password |
| `listStorageBoxSnapshots(id)` | List snapshots |
| `createStorageBoxSnapshot(id)` | Create snapshot |
| `deleteStorageBoxSnapshot(id, name)` | Delete snapshot |
| `revertStorageBoxSnapshot(id, name)` | Revert to snapshot |

#### Other Methods

| Method | Description |
|--------|-------------|
| `listRdns()` | List reverse DNS |
| `createRdns(ip, ptr)` | Create rDNS |
| `deleteRdns(ip)` | Delete rDNS |
| `getTraffic(ips, subnets, from, to, type)` | Query traffic |
| `sendWol(id)` | Send Wake-on-LAN |
| `listServerProducts()` | List products |
| `listServerMarketProducts()` | List auction servers |

---

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## License

MIT
