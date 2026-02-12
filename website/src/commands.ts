import { formatTable, formatDetail, formatJson, formatError, formatInfo } from "./formatter.ts";
import {
  getAuctionServers,
  getAuctionServerById,
  type AuctionServer,
} from "./data/auction.ts";
import {
  getCloudServers,
  getCloudServerByNameOrId,
  getCloudNetworks,
  getCloudNetworkById,
  getCloudFirewalls,
  getCloudFirewallById,
  getCloudVolumes,
  getCloudVolumeById,
} from "./data/cloud.ts";
import {
  getRobotServers,
  getRobotServerById,
  getSshKeys,
} from "./data/robot.ts";
import {
  getMainHelp,
  getAuctionHelp,
  getAuctionListHelp,
  getCloudHelp,
  getCloudServerHelp,
  getCloudNetworkHelp,
  getCloudFirewallHelp,
  getCloudVolumeHelp,
  getServerHelp,
  getKeyHelp,
} from "./help.ts";

interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(input: string): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  const tokens = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = tokens[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next.replace(/^"|"$/g, "");
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(token.replace(/^"|"$/g, ""));
    }
  }

  return { positional, flags };
}

function relativeTime(timestamp: number): string {
  if (timestamp === 0) return "—";
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  if (diff <= 0) return "expired";
  const hours = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// ---- Auction Commands ----

function auctionList(flags: Record<string, string | boolean>): string {
  if (flags["help"]) return getAuctionListHelp();

  let servers = getAuctionServers();

  // Filters
  if (flags["min-price"])
    servers = servers.filter(
      (s) => s.price >= Number(flags["min-price"])
    );
  if (flags["max-price"])
    servers = servers.filter(
      (s) => s.price <= Number(flags["max-price"])
    );
  if (flags["min-ram"])
    servers = servers.filter(
      (s) => s.ram_size >= Number(flags["min-ram"])
    );
  if (flags["max-ram"])
    servers = servers.filter(
      (s) => s.ram_size <= Number(flags["max-ram"])
    );
  if (flags["cpu"]) {
    const cpu = String(flags["cpu"]).toLowerCase();
    servers = servers.filter((s) =>
      s.cpu.toLowerCase().includes(cpu)
    );
  }
  if (flags["datacenter"]) {
    const dc = String(flags["datacenter"]).toLowerCase();
    servers = servers.filter((s) =>
      s.datacenter.toLowerCase().includes(dc)
    );
  }
  if (flags["disk-type"]) {
    const dt = String(flags["disk-type"]).toLowerCase();
    servers = servers.filter((s) =>
      s.disk_type.toLowerCase().includes(dt)
    );
  }
  if (flags["search"]) {
    const search = String(flags["search"]).toLowerCase();
    servers = servers.filter(
      (s) =>
        s.cpu.toLowerCase().includes(search) ||
        s.datacenter.toLowerCase().includes(search) ||
        s.hdd_text.toLowerCase().includes(search) ||
        s.disk_type.toLowerCase().includes(search) ||
        String(s.id).includes(search) ||
        s.name.toLowerCase().includes(search)
    );
  }
  if (flags["ecc"]) servers = servers.filter((s) => s.ecc);
  if (flags["gpu"]) servers = servers.filter((s) => s.gpu);
  if (flags["inic"]) servers = servers.filter((s) => s.inic);
  if (flags["fixed-price"])
    servers = servers.filter((s) => s.fixed_price);
  if (flags["auction-only"])
    servers = servers.filter((s) => !s.fixed_price);
  if (flags["no-setup-fee"])
    servers = servers.filter((s) => s.setup_price === 0);

  // Sort
  if (flags["sort"]) {
    const field = String(flags["sort"]).toLowerCase();
    const sortFn = getSortFn(field);
    if (sortFn) servers = [...servers].sort(sortFn);
    if (flags["desc"]) servers = servers.reverse();
  }

  // Limit
  if (flags["limit"]) {
    servers = servers.slice(0, Number(flags["limit"]));
  }

  // JSON output
  if (flags["json"]) {
    return formatJson(servers);
  }

  if (servers.length === 0) {
    return formatInfo("No servers match the specified filters.");
  }

  const rows = servers.map((s) => ({
    id: s.id,
    cpu: truncate(s.cpu, 26),
    ram: `${s.ram_size} GB`,
    disk: truncate(s.hdd_text, 24),
    dc: s.datacenter,
    price: `€${s.price}`,
    type: s.fixed_price ? "fixed" : "auction",
    reduce: s.fixed_price ? "—" : relativeTime(s.next_reduce_timestamp),
    specials: s.specials.join(", "),
  }));

  return formatTable(
    [
      { key: "id", label: "ID", align: "right" },
      { key: "cpu", label: "CPU" },
      { key: "ram", label: "RAM", align: "right" },
      { key: "disk", label: "Disks" },
      { key: "dc", label: "Datacenter" },
      { key: "price", label: "Price", align: "right", color: "c-green" },
      { key: "type", label: "Type" },
      { key: "reduce", label: "Next Reduce" },
      { key: "specials", label: "Specials" },
    ],
    rows,
    `${servers.length} server${servers.length === 1 ? "" : "s"} found`
  );
}

function getSortFn(field: string): ((a: AuctionServer, b: AuctionServer) => number) | null {
  switch (field) {
    case "price":
      return (a, b) => a.price - b.price;
    case "ram":
      return (a, b) => a.ram_size - b.ram_size;
    case "cpu":
      return (a, b) => a.cpu.localeCompare(b.cpu);
    case "datacenter":
    case "dc":
      return (a, b) => a.datacenter.localeCompare(b.datacenter);
    case "id":
      return (a, b) => a.id - b.id;
    case "benchmark":
      return (a, b) => a.cpu_benchmark - b.cpu_benchmark;
    default:
      return null;
  }
}

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + "…";
}

function auctionShow(idStr: string): string {
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return formatError("Please provide a valid server ID.");

  const s = getAuctionServerById(id);
  if (!s) return formatError(`Server with ID ${id} not found.`);

  return formatDetail(`Auction Server #${s.id}`, [
    ["ID", String(s.id)],
    ["Name", s.name],
    ["CPU", s.cpu],
    ["CPU Benchmark", String(s.cpu_benchmark)],
    ["CPU Count", `${s.cpu_count} cores`],
    ["RAM", `${s.ram_size} GB`],
    ["RAM Details", s.ram.join(", ")],
    ["Disks", s.hdd_text],
    ["Disk Type", s.disk_type],
    ["Datacenter", s.datacenter],
    ["Price", `€${s.price}/month`, "c-green"],
    ["Setup Fee", s.setup_price > 0 ? `€${s.setup_price}` : "None", s.setup_price > 0 ? "c-yellow" : "c-green"],
    ["Type", s.fixed_price ? "Fixed Price" : "Auction"],
    ["Next Reduce", s.fixed_price ? "—" : relativeTime(s.next_reduce_timestamp)],
    ["ECC", s.ecc ? "Yes" : "No", s.ecc ? "c-green" : "c-dim"],
    ["GPU", s.gpu ? "Yes" : "No", s.gpu ? "c-green" : "c-dim"],
    ["iNIC", s.inic ? "Yes" : "No", s.inic ? "c-green" : "c-dim"],
    ["IPv4", s.ipv4 ? "Yes" : "No", s.ipv4 ? "c-green" : "c-dim"],
    ["Traffic", s.traffic],
    ["Bandwidth", `${s.bandwidth} Mbit/s`],
  ]);
}

// ---- Cloud Commands ----

function cloudServerList(): string {
  const servers = getCloudServers();
  const rows = servers.map((s) => ({
    id: s.id,
    name: s.name,
    status: s.status,
    type: s.server_type,
    dc: s.datacenter,
    ipv4: s.public_ipv4,
    image: s.image,
  }));

  return formatTable(
    [
      { key: "id", label: "ID", align: "right" },
      { key: "name", label: "Name", color: "c-cyan" },
      { key: "status", label: "Status", color: "c-green" },
      { key: "type", label: "Type" },
      { key: "dc", label: "Datacenter" },
      { key: "ipv4", label: "IPv4" },
      { key: "image", label: "Image" },
    ],
    rows,
    `${servers.length} server${servers.length === 1 ? "" : "s"}`
  );
}

function cloudServerDescribe(nameOrId: string): string {
  const s = getCloudServerByNameOrId(nameOrId);
  if (!s) return formatError(`Server "${nameOrId}" not found.`);

  const labels = Object.entries(s.labels)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return formatDetail(`Cloud Server: ${s.name}`, [
    ["ID", String(s.id)],
    ["Name", s.name, "c-cyan"],
    ["Status", s.status, s.status === "running" ? "c-green" : "c-yellow"],
    ["Server Type", s.server_type],
    ["Datacenter", s.datacenter],
    ["Public IPv4", s.public_ipv4],
    ["Public IPv6", s.public_ipv6],
    ["Private IP", s.private_ip || "—"],
    ["Image", s.image],
    ["Created", s.created],
    ["Labels", labels || "—"],
    ["Volumes", s.volumes.length > 0 ? s.volumes.join(", ") : "—"],
  ]);
}

function cloudNetworkList(): string {
  const networks = getCloudNetworks();
  const rows = networks.map((n) => ({
    id: n.id,
    name: n.name,
    ip_range: n.ip_range,
    subnets: n.subnets.length,
    servers: n.servers.length,
  }));

  return formatTable(
    [
      { key: "id", label: "ID", align: "right" },
      { key: "name", label: "Name", color: "c-cyan" },
      { key: "ip_range", label: "IP Range" },
      { key: "subnets", label: "Subnets", align: "right" },
      { key: "servers", label: "Servers", align: "right" },
    ],
    rows,
    `${networks.length} network${networks.length === 1 ? "" : "s"}`
  );
}

function cloudNetworkDescribe(idStr: string): string {
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return formatError("Please provide a valid network ID.");
  const n = getCloudNetworkById(id);
  if (!n) return formatError(`Network ${id} not found.`);

  const labels = Object.entries(n.labels)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  const subnets = n.subnets
    .map((s) => `${s.ip_range} (${s.network_zone})`)
    .join(", ");

  return formatDetail(`Network: ${n.name}`, [
    ["ID", String(n.id)],
    ["Name", n.name, "c-cyan"],
    ["IP Range", n.ip_range],
    ["Subnets", subnets],
    ["Servers", n.servers.join(", ") || "—"],
    ["Created", n.created],
    ["Labels", labels || "—"],
  ]);
}

function cloudFirewallList(): string {
  const firewalls = getCloudFirewalls();
  const rows = firewalls.map((f) => ({
    id: f.id,
    name: f.name,
    rules: f.rules.length,
    applied: f.applied_to.length,
  }));

  return formatTable(
    [
      { key: "id", label: "ID", align: "right" },
      { key: "name", label: "Name", color: "c-cyan" },
      { key: "rules", label: "Rules", align: "right" },
      { key: "applied", label: "Applied To", align: "right" },
    ],
    rows,
    `${firewalls.length} firewall${firewalls.length === 1 ? "" : "s"}`
  );
}

function cloudFirewallDescribe(idStr: string): string {
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return formatError("Please provide a valid firewall ID.");
  const f = getCloudFirewallById(id);
  if (!f) return formatError(`Firewall ${id} not found.`);

  const labels = Object.entries(f.labels)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");
  const appliedTo = f.applied_to
    .map((a) => `server:${a.server.id}`)
    .join(", ");

  const props: [string, string, string?][] = [
    ["ID", String(f.id)],
    ["Name", f.name, "c-cyan"],
    ["Applied To", appliedTo || "—"],
    ["Created", f.created],
    ["Labels", labels || "—"],
    ["", ""],
    ["Rules", ""],
  ];

  for (const rule of f.rules) {
    props.push([
      `  ${rule.direction.toUpperCase()} ${rule.protocol}/${rule.port}`,
      `${rule.source_ips.join(", ")} — ${rule.description}`,
      "c-dim",
    ]);
  }

  return formatDetail(`Firewall: ${f.name}`, props);
}

function cloudVolumeList(): string {
  const volumes = getCloudVolumes();
  const rows = volumes.map((v) => ({
    id: v.id,
    name: v.name,
    size: `${v.size} GB`,
    server: v.server || "—",
    location: v.location,
    format: v.format,
    status: v.status,
  }));

  return formatTable(
    [
      { key: "id", label: "ID", align: "right" },
      { key: "name", label: "Name", color: "c-cyan" },
      { key: "size", label: "Size", align: "right" },
      { key: "server", label: "Server", align: "right" },
      { key: "location", label: "Location" },
      { key: "format", label: "Format" },
      { key: "status", label: "Status", color: "c-green" },
    ],
    rows,
    `${volumes.length} volume${volumes.length === 1 ? "" : "s"}`
  );
}

function cloudVolumeDescribe(idStr: string): string {
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return formatError("Please provide a valid volume ID.");
  const v = getCloudVolumeById(id);
  if (!v) return formatError(`Volume ${id} not found.`);

  const labels = Object.entries(v.labels)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return formatDetail(`Volume: ${v.name}`, [
    ["ID", String(v.id)],
    ["Name", v.name, "c-cyan"],
    ["Size", `${v.size} GB`],
    ["Server", v.server ? String(v.server) : "Not attached"],
    ["Location", v.location],
    ["Format", v.format],
    ["Status", v.status, v.status === "available" ? "c-green" : "c-yellow"],
    ["Linux Device", v.linux_device],
    ["Created", v.created],
    ["Labels", labels || "—"],
  ]);
}

// ---- Robot Commands ----

function robotServerList(): string {
  const servers = getRobotServers();
  const rows = servers.map((s) => ({
    id: s.server_number,
    name: s.server_name,
    product: s.product,
    dc: s.dc,
    ip: s.server_ip,
    status: s.status,
    paid_until: s.paid_until,
  }));

  return formatTable(
    [
      { key: "id", label: "ID", align: "right" },
      { key: "name", label: "Name", color: "c-cyan" },
      { key: "product", label: "Product" },
      { key: "dc", label: "Datacenter" },
      { key: "ip", label: "IP" },
      { key: "status", label: "Status", color: "c-green" },
      { key: "paid_until", label: "Paid Until" },
    ],
    rows,
    `${servers.length} server${servers.length === 1 ? "" : "s"}`
  );
}

function robotServerGet(idStr: string): string {
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return formatError("Please provide a valid server number.");
  const s = getRobotServerById(id);
  if (!s) return formatError(`Server ${id} not found.`);

  return formatDetail(`Dedicated Server #${s.server_number}`, [
    ["Server Number", String(s.server_number)],
    ["Name", s.server_name, "c-cyan"],
    ["Product", s.product],
    ["Datacenter", s.dc],
    ["Status", s.status, s.status === "ready" ? "c-green" : "c-yellow"],
    ["IPv4", s.server_ip],
    ["IPv6", s.server_ipv6_net],
    ["Traffic", s.traffic],
    ["Cancelled", s.cancelled ? "Yes" : "No", s.cancelled ? "c-red" : "c-green"],
    ["Paid Until", s.paid_until],
  ]);
}

function robotKeyList(): string {
  const keys = getSshKeys();
  const rows = keys.map((k) => ({
    name: k.name,
    type: k.type,
    size: k.size,
    fingerprint: k.fingerprint,
  }));

  return formatTable(
    [
      { key: "name", label: "Name", color: "c-cyan" },
      { key: "type", label: "Type" },
      { key: "size", label: "Size", align: "right" },
      { key: "fingerprint", label: "Fingerprint" },
    ],
    rows,
    `${keys.length} key${keys.length === 1 ? "" : "s"}`
  );
}

// ---- Command Dispatcher ----

export function executeCommand(input: string): string {
  const { positional, flags } = parseArgs(input);

  if (positional.length === 0 || flags["help"] === true && positional.length === 0) {
    return getMainHelp();
  }

  if (flags["version"] || (positional.length === 1 && positional[0] === "version")) {
    return formatInfo("hetzner-cli v2.2.0");
  }

  const cmd = positional[0];

  switch (cmd) {
    case "help":
      return getMainHelp();

    case "version":
      return formatInfo("hetzner-cli v2.2.0");

    case "auction": {
      if (positional.length < 2 || flags["help"] === true && positional.length === 1) {
        return getAuctionHelp();
      }
      const sub = positional[1];
      if (sub === "list" || sub === "ls") {
        return auctionList(flags);
      }
      if (sub === "show") {
        if (!positional[2]) return formatError("Usage: auction show <id>");
        return auctionShow(positional[2]);
      }
      return formatError(`Unknown auction command: ${sub}. Run "auction --help" for usage.`);
    }

    case "cloud": {
      if (positional.length < 2 || (flags["help"] === true && positional.length === 1)) {
        return getCloudHelp();
      }
      const resource = positional[1];
      const action = positional[2];

      if (resource === "server") {
        if (!action || flags["help"] === true) return getCloudServerHelp();
        if (action === "list" || action === "ls") return cloudServerList();
        if (action === "describe" || action === "get" || action === "show") {
          if (!positional[3]) return formatError("Usage: cloud server describe <name|id>");
          return cloudServerDescribe(positional[3]);
        }
        return formatError(`Unknown action: ${action}. Run "cloud server --help" for usage.`);
      }
      if (resource === "network") {
        if (!action || flags["help"] === true) return getCloudNetworkHelp();
        if (action === "list" || action === "ls") return cloudNetworkList();
        if (action === "describe" || action === "get" || action === "show") {
          if (!positional[3]) return formatError("Usage: cloud network describe <id>");
          return cloudNetworkDescribe(positional[3]);
        }
        return formatError(`Unknown action: ${action}`);
      }
      if (resource === "firewall") {
        if (!action || flags["help"] === true) return getCloudFirewallHelp();
        if (action === "list" || action === "ls") return cloudFirewallList();
        if (action === "describe" || action === "get" || action === "show") {
          if (!positional[3]) return formatError("Usage: cloud firewall describe <id>");
          return cloudFirewallDescribe(positional[3]);
        }
        return formatError(`Unknown action: ${action}`);
      }
      if (resource === "volume") {
        if (!action || flags["help"] === true) return getCloudVolumeHelp();
        if (action === "list" || action === "ls") return cloudVolumeList();
        if (action === "describe" || action === "get" || action === "show") {
          if (!positional[3]) return formatError("Usage: cloud volume describe <id>");
          return cloudVolumeDescribe(positional[3]);
        }
        return formatError(`Unknown action: ${action}`);
      }
      return formatError(`Unknown cloud resource: ${resource}. Run "cloud --help" for usage.`);
    }

    case "server": {
      if (positional.length < 2 || flags["help"] === true) return getServerHelp();
      const sub = positional[1];
      if (sub === "list" || sub === "ls") return robotServerList();
      if (sub === "get" || sub === "show") {
        if (!positional[2]) return formatError("Usage: server get <id>");
        return robotServerGet(positional[2]);
      }
      return formatError(`Unknown server command: ${sub}`);
    }

    case "key": {
      if (positional.length < 2 || flags["help"] === true) return getKeyHelp();
      const sub = positional[1];
      if (sub === "list" || sub === "ls") return robotKeyList();
      return formatError(`Unknown key command: ${sub}`);
    }

    default:
      return formatError(
        `Unknown command: "${cmd}". Run "help" for available commands.`
      );
  }
}
