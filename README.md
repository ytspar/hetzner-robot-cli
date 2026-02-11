<p align="center">
  <img src="logo.svg" alt="hetzner-cli logo" width="128" height="128">
</p>

# hetzner-cli

[![npm version](https://badge.fury.io/js/hetzner-cli.svg)](https://www.npmjs.com/package/hetzner-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Note:** This is an unofficial, community-built CLI. The official Hetzner Cloud CLI is [`hcloud`](https://github.com/hetznercloud/cli). See [how they differ](#comparison-with-official-cli).

Unified CLI and Node.js library for Hetzner's three APIs:

- **Robot API** — dedicated server management (servers, IPs, firewall, storage boxes, etc.)
- **Cloud API** — cloud infrastructure (servers, networks, volumes, load balancers, etc.)
- **Auction API** — public server auction browser with rich filtering (no auth required)

---

## Table of Contents

- [Comparison with Official CLI](#comparison-with-official-cli)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
  - [Robot API Credentials](#robot-api-credentials)
  - [Cloud API Token](#cloud-api-token)
  - [Auction API](#auction-api-no-auth)
- [CLI Reference](#cli-reference)
  - [Global Options](#global-options)
  - [Robot Commands](#robot-commands)
  - [Cloud Commands](#cloud-commands)
  - [Auction Commands](#auction-commands)
  - [Built-in Reference](#built-in-reference)
- [Library Usage](#library-usage)
  - [Robot Client](#robot-client)
  - [Cloud Client](#cloud-client)
  - [Auction Client](#auction-client)
  - [Type Exports](#type-exports)
- [API Reference](#api-reference)
- [Configuration Files](#configuration-files)
- [Development](#development)
- [License](#license)

---

## Comparison with Official CLI

Hetzner maintains an official Cloud CLI called [`hcloud`](https://github.com/hetznercloud/cli), written in Go. This project (`hetzner-cli`) is a separate, community-built tool. Here's how they compare:

| | [`hcloud`](https://github.com/hetznercloud/cli) (official) | `hetzner-cli` (this project) |
|---|---|---|
| **API coverage** | Cloud only | Cloud + Robot + Server Auction |
| **Language** | Go (single binary) | TypeScript / Node.js |
| **Install** | Homebrew, apt, binary download | `npm install -g hetzner-cli` |
| **Library usage** | CLI only | Also usable as a Node.js library (`import { HetznerRobotClient } from 'hetzner-cli'`) |
| **Interactive mode** | No | Yes (`hetzner interactive`) |
| **LLM reference** | No | Yes (`hetzner reference` — structured output for LLM context) |

**When to use `hcloud`:** You only need Cloud API access and prefer a native binary with no runtime dependency.

**When to use `hetzner-cli`:** You manage dedicated servers (Robot), browse the server auction, or want a single tool that covers all three Hetzner APIs. Also useful if you need a Node.js library for automation scripts.

---

## Installation

```bash
# Global CLI
npm install -g hetzner-cli

# Or as a project dependency
npm install hetzner-cli
```

Requires Node.js >= 18.0.0.

---

## Quick Start

```bash
# Set up Robot API credentials (interactive)
hetzner auth login

# List your dedicated servers
hetzner server list

# Set up Cloud API context
hetzner cloud context create production
hetzner cloud context use production

# List your cloud servers
hetzner cloud server list

# Browse the server auction (no login needed)
hetzner auction list --max-price 60 --ecc --disk-type nvme --sort price
```

---

## Authentication

### Robot API Credentials

The Robot API uses a **web service username and password** (separate from your main Hetzner login).

**To create credentials:**

1. Go to [robot.hetzner.com](https://robot.hetzner.com)
2. Navigate to **Settings > Web service settings**
3. Create a new web service user

**Credential resolution order** (first match wins):

| Priority | Method | Details |
|----------|--------|---------|
| 1 | CLI flags | `--user <username> --password <password>` |
| 2 | Environment variables | `HETZNER_ROBOT_USER` and `HETZNER_ROBOT_PASSWORD` |
| 3 | System keychain | Stored by `hetzner auth login` (uses native keytar) |
| 4 | Config file | `~/.hetzner-cli/config.json` |
| 5 | Interactive prompt | Asks for username/password at runtime |

**Secure password passing** (keeps password out of shell history):

```bash
# From stdin
echo "$PASSWORD" | hetzner server list -u myuser -p -

# With 1Password
op read "op://vault/item/password" | hetzner server list -u $(op read "op://vault/item/user") -p -

# From environment
export HETZNER_ROBOT_USER=myuser
export HETZNER_ROBOT_PASSWORD=mypassword
hetzner server list
```

### Cloud API Token

The Cloud API uses a **bearer token** from the Hetzner Cloud Console.

**To create a token:**

1. Go to [console.hetzner.cloud](https://console.hetzner.cloud)
2. Select your project
3. Navigate to **Security > API Tokens**
4. Generate a new token

**Token resolution order:**

| Priority | Method | Details |
|----------|--------|---------|
| 1 | CLI flag | `--token <token>` per command |
| 2 | Environment variable | `HETZNER_CLOUD_TOKEN` |
| 3 | Active context | Set via `hetzner cloud context use <name>` |

```bash
# Set up a named context (saves token)
hetzner cloud context create production -t hcloud_xxxxxx

# Switch contexts
hetzner cloud context use production

# Or use inline
hetzner cloud server list --token hcloud_xxxxxx
```

### Auction API (No Auth)

The auction commands use Hetzner's public JSON endpoint. No credentials required.

```bash
hetzner auction list
```

---

## CLI Reference

### Global Options

```
-u, --user <username>       Robot API username
-p, --password <password>   Robot API password (use "-" to read from stdin)
--json                      Output raw JSON instead of formatted tables
-V, --version               Show version number
-h, --help                  Show help for any command
```

All commands support `--json` for machine-readable output. Pipe to `jq` for filtering:

```bash
hetzner server list --json | jq '.[].server.server_ip'
hetzner auction list --max-price 50 --json | jq '.[].id'
```

### Robot Commands

Commands for managing Hetzner dedicated servers via the Robot API.

#### Authentication

```bash
hetzner auth login           # Interactive credential setup
hetzner auth logout          # Clear saved credentials
hetzner auth status          # Show current auth source
hetzner auth test            # Verify credentials work
```

#### Servers

```bash
hetzner server list                       # List all servers
hetzner server get <server>               # Server details (by ID or IP)
hetzner server rename <server> <name>     # Rename a server
```

#### Reset

```bash
hetzner reset options [server]            # Show available reset types
hetzner reset execute <servers...>        # Reset servers
  -t, --type <type>                       #   sw|hw|man|power|power_long (default: sw)
  -i, --interactive                       #   Select type interactively
  -y, --yes                               #   Skip confirmation
```

#### Boot Configuration

```bash
hetzner boot status <server>              # Show all boot config

# Rescue system
hetzner boot rescue activate <server> [-o linux|linuxold|vkvm] [-a 64|32] [-k <fingerprints...>]
hetzner boot rescue deactivate <server>
hetzner boot rescue last <server>         # Show last rescue (includes password)

# Linux installation
hetzner boot linux options <server>       # Show available distributions
hetzner boot linux activate <server> -d <dist> [-a 64|32] [-l en] [-k <fingerprints...>]
hetzner boot linux deactivate <server>
```

#### IP & Networking

```bash
hetzner ip list                           # List all IPs
hetzner ip get <ip>                       # IP details
hetzner ip update <ip> [--warnings true|false] [--hourly <mb>] [--daily <mb>] [--monthly <gb>]
hetzner ip mac get|generate|delete <ip>   # Separate MAC management

hetzner subnet list                       # List subnets
hetzner subnet get <subnet>

hetzner failover list                     # List failover IPs
hetzner failover get <ip>
hetzner failover switch <failover-ip> <target-server-ip> [-y]
hetzner failover delete <ip> [-y]

hetzner rdns list                         # List reverse DNS entries
hetzner rdns get <ip>
hetzner rdns set <ip> <ptr>               # Create/update
hetzner rdns delete <ip>
```

#### SSH Keys

```bash
hetzner key list                          # List all keys
hetzner key get <fingerprint>
hetzner key add <name> [-f <path>] [-d <data>]
hetzner key rename <fingerprint> <name>
hetzner key delete <fingerprint> [-y]
```

#### Firewall

```bash
hetzner firewall get <server>             # Show config
hetzner firewall enable|disable <server>
hetzner firewall delete <server> [-y]     # Delete all rules

hetzner firewall template list
hetzner firewall template get|delete <id>
```

#### vSwitch

```bash
hetzner vswitch list
hetzner vswitch get <id>
hetzner vswitch create <name> <vlan>
hetzner vswitch update <id> [-n <name>] [-v <vlan>]
hetzner vswitch delete <id> [-y] [--date <YYYY-MM-DD>]
hetzner vswitch add-server <vswitch-id> <server>
hetzner vswitch remove-server <vswitch-id> <server>
```

#### Storage Box

```bash
hetzner storagebox list                   # (alias: storage)
hetzner storagebox get <id>
hetzner storagebox update <id> [-n <name>] [--webdav|--samba|--ssh|--external|--zfs true|false]
hetzner storagebox reset-password <id>

# Snapshots
hetzner storagebox snapshot list|create|delete|revert <box-id> [<name>]

# Subaccounts
hetzner storagebox subaccount list <box-id>
hetzner storagebox subaccount create <box-id> <home-directory> [--samba|--ssh|--webdav|--external|--readonly true|false]
hetzner storagebox subaccount delete <box-id> <username> [-y]
```

#### Traffic, WoL, Cancellation, Ordering

```bash
hetzner traffic query [-i <ips...>] [-s <subnets...>] [--from <date>] [--to <date>] [-t day|month|year]
hetzner wol status|send <server>
hetzner cancel status|request|revoke <server>
hetzner order products|market|transactions
hetzner order transaction <id>
```

#### Interactive Mode

```bash
hetzner interactive   # or: hetzner i
```

Menu-driven interface for common operations (list servers, reset, rescue, failover, SSH keys).

### Cloud Commands

All cloud commands live under `hetzner cloud <resource> <action>`. Add `--token <token>` to any command to override the active context.

#### Context Management

```bash
hetzner cloud context create <name> [-t <token>]
hetzner cloud context use <name>
hetzner cloud context delete <name>
hetzner cloud context list
hetzner cloud context active
```

#### Cloud Servers

```bash
hetzner cloud server list [-l <label-selector>] [-n <name>] [-s <sort>] [--status <status>]
hetzner cloud server describe <id>
hetzner cloud server create --name <name> --type <type> --image <image> [--location <loc>] [--ssh-key <keys...>]
hetzner cloud server delete <id> [-y]
hetzner cloud server update <id> [--name <name>]

# Power management
hetzner cloud server poweron|poweroff|reboot|reset|shutdown <id>

# Maintenance
hetzner cloud server rebuild <id> --image <image>
hetzner cloud server change-type <id> --type <type> [--upgrade-disk]
hetzner cloud server enable-rescue <id> [--type linux64] [--ssh-key <ids...>]
hetzner cloud server disable-rescue <id>
hetzner cloud server enable-backup|disable-backup <id>
hetzner cloud server create-image <id> [--description <desc>]
hetzner cloud server attach-iso|detach-iso <id> [--iso <iso>]
hetzner cloud server reset-password <id>

# Networking
hetzner cloud server set-rdns <id> --ip <ip> --dns-ptr <ptr>
hetzner cloud server attach-to-network <id> --network <id> [--ip <ip>]
hetzner cloud server detach-from-network <id> --network <id>

# Protection & labels
hetzner cloud server enable-protection|disable-protection <id>
hetzner cloud server add-label <id> <key=value>
hetzner cloud server remove-label <id> <key>
hetzner cloud server request-console <id>
```

#### Other Cloud Resources

Each follows the pattern: `hetzner cloud <resource> list|describe|create|delete`

```bash
hetzner cloud network list|describe|create|delete
hetzner cloud firewall list|describe|create|delete
hetzner cloud floating-ip list|describe|create|delete
hetzner cloud primary-ip list|describe|create|delete
hetzner cloud volume list|describe|create|delete
hetzner cloud load-balancer list|describe|create|delete
hetzner cloud image list|describe|update|delete
hetzner cloud ssh-key list|describe|create|delete
hetzner cloud certificate list|describe|create|delete
hetzner cloud placement-group list|describe|create|delete

# Read-only reference data
hetzner cloud datacenter list|describe
hetzner cloud location list|describe
hetzner cloud server-type list|describe
hetzner cloud load-balancer-type list|describe
hetzner cloud iso list|describe
```

### Auction Commands

Browse Hetzner's server auction — no authentication required. Data is fetched from the public endpoint and filtered/sorted client-side.

```bash
hetzner auction list [options]    # List and filter auction servers
hetzner auction show <id>         # Detailed view of a single server
```

#### Auction List — Full Option Reference

**Price filters:**

```bash
--min-price <n>          # Minimum monthly price
--max-price <n>          # Maximum monthly price
--max-hourly-price <n>   # Maximum hourly price
--max-setup-price <n>    # Maximum setup fee
--no-setup-fee           # Only free setup (shorthand for --max-setup-price 0)
--fixed-price            # Only fixed-price servers
--auction-only           # Only auction servers (price decreases over time)
```

**Hardware filters:**

```bash
--cpu <text>             # CPU model substring, case-insensitive (e.g. "Ryzen", "EPYC", "i7-6700")
--min-cpu-count <n>      # Minimum CPU/socket count
--max-cpu-count <n>      # Maximum CPU/socket count
--min-ram <gb>           # Minimum RAM in GB
--max-ram <gb>           # Maximum RAM in GB
--ecc                    # Only ECC RAM servers
```

**Disk filters:**

```bash
--min-disk-size <gb>     # Minimum total disk capacity (sum of all drives)
--max-disk-size <gb>     # Maximum total disk capacity
--min-disk-count <n>     # Minimum number of physical drives
--max-disk-count <n>     # Maximum number of physical drives
--disk-type <type>       # Must have this disk type: nvme, sata, hdd
```

**Network & feature filters:**

```bash
--datacenter <text>      # Datacenter substring, case-insensitive (e.g. "FSN", "HEL1-DC2", "NBG")
--min-bandwidth <mbit>   # Minimum bandwidth in Mbit/s
--gpu                    # Only GPU servers
--inic                   # Only Intel NIC servers
--highio                 # Only high I/O servers
--specials <text>        # Any special feature, substring match (e.g. "GPU", "ECC")
--search <text>          # Free-text search across description
```

**Sorting:**

```bash
--sort <field>           # Sort field (default: price). Choices:
                         #   price, hourly, setup, ram, disk, disk_count,
                         #   cpu, cpu_count, datacenter, bandwidth, next_reduce
--desc                   # Sort descending (default: ascending)
```

**Output:**

```bash
--currency <EUR|USD>     # Price currency (default: EUR)
--limit <n>              # Limit number of results
--json                   # Output raw JSON
```

#### Auction Examples

```bash
# Browse all servers, cheapest first
hetzner auction list

# Cheap AMD EPYC with NVMe + ECC in Helsinki
hetzner auction list --cpu epyc --disk-type nvme --ecc --datacenter HEL --sort price

# GPU servers under 150 EUR
hetzner auction list --gpu --max-price 150

# High-RAM servers with lots of drives
hetzner auction list --min-ram 256 --min-disk-count 4 --sort ram --desc

# Cheapest 10 fixed-price NVMe servers
hetzner auction list --fixed-price --disk-type nvme --sort price --limit 10

# Auction servers about to drop in price
hetzner auction list --auction-only --sort next_reduce --limit 20

# Export to JSON for scripting
hetzner auction list --max-price 60 --ecc --json | jq '.[].id'
```

### Built-in Reference

For a complete, structured reference optimized for LLM context windows:

```bash
hetzner reference         # or: hetzner ref
```

This prints every command, option, and example in a structured plaintext format designed for easy parsing by language models. Pipe it into your LLM context:

```bash
hetzner reference | pbcopy                    # Copy to clipboard (macOS)
hetzner reference > /tmp/hetzner-ref.txt      # Save to file
```

---

## Library Usage

### Robot Client

```typescript
import { HetznerRobotClient } from 'hetzner-cli';

const client = new HetznerRobotClient('username', 'password');

// List servers
const servers = await client.listServers();

// Get server details
const { server } = await client.getServer(123456);
console.log(server.server_name, server.server_ip);

// Reset a server
await client.resetServer(123456, 'sw');

// Activate rescue mode
const rescue = await client.activateRescue(123456, 'linux', 64, ['ssh-fingerprint']);
console.log('Password:', rescue.rescue.password);

// Linux installation
await client.activateLinux(123456, 'Debian-1210-bookworm-amd64-base', 64, 'en', ['ssh-fingerprint']);

// Failover
await client.switchFailover('1.2.3.4', '5.6.7.8');

// SSH keys
const keys = await client.listSshKeys();
await client.createSshKey('my-key', 'ssh-rsa AAAA...');

// Storage box
const boxes = await client.listStorageBoxes();
await client.createStorageBoxSnapshot(123);

// Firewall
const fw = await client.getFirewall(123456);
await client.updateFirewall(123456, 'active');
```

### Cloud Client

```typescript
import { HetznerCloudClient } from 'hetzner-cli';

const client = new HetznerCloudClient('hcloud_xxxxxx');

// List servers
const { servers } = await client.listServers();

// Create a server
const result = await client.createServer({
  name: 'web1',
  server_type: 'cx22',
  image: 'ubuntu-22.04',
  location: 'fsn1',
});

// Networks
const { networks } = await client.listNetworks();
await client.createNetwork({ name: 'my-net', ip_range: '10.0.0.0/16' });

// Volumes
const { volumes } = await client.listVolumes();
await client.createVolume({ name: 'data', size: 50, location: 'fsn1' });

// Load Balancers
const { load_balancers } = await client.listLoadBalancers();

// Firewalls, Floating IPs, SSH Keys, Images, etc.
const { firewalls } = await client.listFirewalls();
const { floating_ips } = await client.listFloatingIps();
const { ssh_keys } = await client.listSshKeys();
```

### Auction Client

```typescript
import { fetchAuctionServers, filterAuctionServers, sortAuctionServers } from 'hetzner-cli';

// Fetch all servers (EUR pricing)
const { server: servers } = await fetchAuctionServers('EUR');

// Filter: cheap ECC NVMe servers in Helsinki
const filtered = filterAuctionServers(servers, {
  maxPrice: 60,
  ecc: true,
  diskType: 'nvme',
  datacenter: 'HEL',
});

// Sort by price ascending
const sorted = sortAuctionServers(filtered, 'price', false);

console.log(`Found ${sorted.length} servers`);
for (const s of sorted) {
  console.log(`${s.id}: ${s.cpu} | ${s.ram_size}GB | €${s.price}/mo | ${s.datacenter}`);
}
```

### Type Exports

```typescript
import type {
  // Robot types
  Server, ServerDetails, Reset, ResetType,
  RescueConfig, LinuxConfig,
  IP, Subnet, Failover, Rdns,
  SshKey, Firewall, FirewallRule,
  VSwitch, StorageBox,
  Traffic, Wol,
  ServerProduct, ServerMarketProduct,

  // Cloud types
  CloudServer, CloudAction, CloudFirewall, CloudFirewallRule,
  CloudSshKey, Network, NetworkSubnet, NetworkRoute,
  FloatingIp, PrimaryIp, Volume, Image,
  LoadBalancer, LoadBalancerType, LoadBalancerTarget, LoadBalancerService,
  Certificate, PlacementGroup, Datacenter, Location,
  ServerType, ISO, Labels,

  // Auction types
  AuctionServer, AuctionDiskData, AuctionIpPrice,
  AuctionFilterOptions, AuctionResponse,
} from 'hetzner-cli';
```

---

## API Reference

### HetznerRobotClient Methods

#### Servers

| Method | Description |
|--------|-------------|
| `listServers()` | List all servers |
| `getServer(id)` | Get server details |
| `updateServerName(id, name)` | Rename server |
| `getCancellation(id)` | Get cancellation status |
| `cancelServer(id, date?, reasons?)` | Cancel server |
| `revokeCancellation(id)` | Revoke cancellation |

#### Reset

| Method | Description |
|--------|-------------|
| `listResetOptions()` | List all reset options |
| `getResetOptions(id)` | Get reset options for server |
| `resetServer(id, type?)` | Reset server (sw/hw/man/power/power_long) |

#### Boot

| Method | Description |
|--------|-------------|
| `getBootConfig(id)` | Get all boot configs |
| `activateRescue(id, os, arch?, keys?)` | Activate rescue |
| `deactivateRescue(id)` | Deactivate rescue |
| `getLastRescue(id)` | Get last rescue activation |
| `getLinux(id)` | Get available Linux distributions |
| `activateLinux(id, dist, arch?, lang?, keys?)` | Activate Linux install |
| `deactivateLinux(id)` | Deactivate Linux |
| `activateVnc(id, dist, arch?, lang?)` | Activate VNC install |
| `activateWindows(id, dist, lang?)` | Activate Windows install |

#### IPs & Networking

| Method | Description |
|--------|-------------|
| `listIps()` | List all IPs |
| `getIp(ip)` | Get IP details |
| `updateIp(ip, warnings?, hourly?, daily?, monthly?)` | Update IP settings |
| `generateIpMac(ip)` | Generate separate MAC |
| `deleteIpMac(ip)` | Delete MAC |
| `listSubnets()` | List subnets |
| `getSubnet(ip)` | Get subnet details |
| `listFailovers()` | List failover IPs |
| `getFailover(ip)` | Get failover details |
| `switchFailover(ip, targetIp)` | Switch routing |
| `deleteFailoverRouting(ip)` | Delete routing |
| `listRdns()` | List reverse DNS |
| `getRdns(ip)` | Get rDNS for IP |
| `createRdns(ip, ptr)` | Create/update rDNS |
| `deleteRdns(ip)` | Delete rDNS |

#### SSH Keys

| Method | Description |
|--------|-------------|
| `listSshKeys()` | List SSH keys |
| `getSshKey(fingerprint)` | Get key details |
| `createSshKey(name, data)` | Add SSH key |
| `updateSshKey(fingerprint, name)` | Rename key |
| `deleteSshKey(fingerprint)` | Delete key |

#### Firewall

| Method | Description |
|--------|-------------|
| `getFirewall(id)` | Get firewall config |
| `updateFirewall(id, status, rules?)` | Update firewall |
| `deleteFirewall(id)` | Delete all rules |
| `listFirewallTemplates()` | List templates |
| `getFirewallTemplate(id)` | Get template |
| `deleteFirewallTemplate(id)` | Delete template |

#### vSwitch

| Method | Description |
|--------|-------------|
| `listVSwitches()` | List vSwitches |
| `getVSwitch(id)` | Get details |
| `createVSwitch(name, vlan)` | Create |
| `updateVSwitch(id, name?, vlan?)` | Update |
| `deleteVSwitch(id, date?)` | Delete |
| `addServerToVSwitch(vswitchId, serverId)` | Add server |
| `removeServerFromVSwitch(vswitchId, serverId)` | Remove server |

#### Storage Box

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
| `listStorageBoxSubaccounts(id)` | List subaccounts |
| `createStorageBoxSubaccount(id, ...)` | Create subaccount |
| `deleteStorageBoxSubaccount(id, username)` | Delete subaccount |

#### Traffic, WoL, Ordering

| Method | Description |
|--------|-------------|
| `getTraffic(ips, subnets, from, to, type)` | Query traffic |
| `getWol(id)` | Get WoL status |
| `sendWol(id)` | Send Wake-on-LAN |
| `listServerProducts()` | List products |
| `listServerMarketProducts()` | List auction servers |
| `getServerTransaction(id)` | Get transaction |
| `listServerTransactions()` | List transactions |

### HetznerCloudClient Methods

#### Context Management

| Function | Description |
|----------|-------------|
| `createContext(name, token)` | Create a named context (stores token) |
| `useContext(name)` | Switch active context |
| `deleteContext(name)` | Delete a context |
| `listContexts()` | List all contexts |
| `getActiveContext()` | Get active context name |
| `resolveToken(opts)` | Resolve token (flag > env > context) |

#### Servers

| Method | Description |
|--------|-------------|
| `listServers(params?)` | List cloud servers |
| `getServer(id)` | Get server details |
| `createServer(data)` | Create a server |
| `deleteServer(id)` | Delete a server |
| `updateServer(id, data)` | Update server name/labels |
| `poweronServer(id)` | Power on |
| `poweroffServer(id)` | Hard power off |
| `rebootServer(id)` | Soft reboot |
| `resetServer(id)` | Hard reset |
| `shutdownServer(id)` | Graceful shutdown |
| `rebuildServer(id, image)` | Rebuild with image |
| `changeServerType(id, type, disk?)` | Resize server |
| `enableRescue(id, type?, keys?)` | Enable rescue mode |
| `disableRescue(id)` | Disable rescue mode |
| `enableBackup(id)` | Enable backups |
| `disableBackup(id)` | Disable backups |
| `createImage(id, desc?, type?)` | Create snapshot |
| `attachIso(id, iso)` | Attach ISO |
| `detachIso(id)` | Detach ISO |
| `resetPassword(id)` | Reset root password |
| `setRdns(id, ip, ptr)` | Set reverse DNS |
| `changeProtection(id, opts)` | Change protection |
| `requestConsole(id)` | Get VNC console URL |
| `attachToNetwork(id, network, ip?)` | Attach to network |
| `detachFromNetwork(id, network)` | Detach from network |

#### Networks

| Method | Description |
|--------|-------------|
| `listNetworks()` | List networks |
| `getNetwork(id)` | Get network details |
| `createNetwork(data)` | Create a network |
| `deleteNetwork(id)` | Delete a network |
| `addSubnet(id, subnet)` | Add subnet |
| `deleteSubnet(id, subnet)` | Delete subnet |
| `addRoute(id, route)` | Add route |
| `deleteRoute(id, route)` | Delete route |
| `changeIpRange(id, range)` | Change IP range |

#### Firewalls, IPs, Volumes, Load Balancers

| Method | Description |
|--------|-------------|
| `listFirewalls()` / `getFirewall(id)` / `createFirewall(data)` / `deleteFirewall(id)` | Firewall CRUD |
| `listFloatingIps()` / `getFloatingIp(id)` / `createFloatingIp(data)` / `deleteFloatingIp(id)` | Floating IP CRUD |
| `listPrimaryIps()` / `getPrimaryIp(id)` / `createPrimaryIp(data)` / `deletePrimaryIp(id)` | Primary IP CRUD |
| `listVolumes()` / `getVolume(id)` / `createVolume(data)` / `deleteVolume(id)` | Volume CRUD |
| `listLoadBalancers()` / `getLoadBalancer(id)` / `createLoadBalancer(data)` / `deleteLoadBalancer(id)` | Load Balancer CRUD |
| `listImages()` / `getImage(id)` / `updateImage(id, data)` / `deleteImage(id)` | Image management |
| `listSshKeys()` / `getSshKey(id)` / `createSshKey(data)` / `deleteSshKey(id)` | SSH key CRUD |
| `listCertificates()` / `getCertificate(id)` / `createCertificate(data)` / `deleteCertificate(id)` | Certificate CRUD |
| `listPlacementGroups()` / `getPlacementGroup(id)` / `createPlacementGroup(data)` / `deletePlacementGroup(id)` | Placement group CRUD |

#### Reference Data (Read-Only)

| Method | Description |
|--------|-------------|
| `listDatacenters()` / `getDatacenter(id)` | Datacenter info |
| `listLocations()` / `getLocation(id)` | Location info |
| `listServerTypes()` / `getServerType(id)` | Server type info |
| `listLoadBalancerTypes()` / `getLoadBalancerType(id)` | LB type info |
| `listIsos(params?)` / `getIso(id)` | ISO image info |

### Auction Functions

| Function | Description |
|----------|-------------|
| `fetchAuctionServers(currency?)` | Fetch all servers from public API (EUR or USD) |
| `filterAuctionServers(servers, filters)` | Apply filter criteria to server array |
| `sortAuctionServers(servers, field, desc)` | Sort servers by field |

---

## Configuration Files

| File | Purpose |
|------|---------|
| `~/.hetzner-cli/config.json` | Robot API credentials (file-based fallback) |
| `~/.hetzner-cli/cloud-contexts.json` | Cloud API contexts and tokens |

System keychain (via keytar):

| Key | Value |
|-----|-------|
| Service | `hetzner-cli` |
| Account | `credentials` |

Environment variables:

| Variable | Purpose |
|----------|---------|
| `HETZNER_ROBOT_USER` | Robot API username |
| `HETZNER_ROBOT_PASSWORD` | Robot API password |
| `HETZNER_CLOUD_TOKEN` | Cloud API token (overrides active context) |

---

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm test             # Run tests (740 tests across 12 suites)
npm run test:coverage  # Run with coverage report
npm run test:watch   # Watch mode
```

### Project Structure

```
src/
├── cli.ts                     # CLI entry point
├── index.ts                   # Library exports
├── shared/
│   ├── config.ts              # Credential management
│   ├── formatter.ts           # Colors, tables, output formatting
│   ├── helpers.ts             # asyncAction, output, confirmAction
│   └── reference.ts           # Built-in reference documentation
├── robot/
│   ├── client.ts              # Robot API client (HetznerRobotClient)
│   ├── types.ts               # Robot type definitions
│   ├── formatter.ts           # Robot-specific formatters
│   └── commands/              # CLI command modules (17 files)
├── cloud/
│   ├── client.ts              # Cloud API client
│   ├── context.ts             # Context/token management
│   ├── types.ts               # Cloud type definitions
│   ├── formatter.ts           # Cloud-specific formatters
│   ├── helpers.ts             # Cloud action wrappers
│   └── commands/              # CLI command modules (17 files)
└── auction/
    ├── client.ts              # Auction fetch/filter/sort
    ├── formatter.ts           # Auction formatters
    └── commands.ts            # Auction CLI commands
```

---

## License

MIT
