export interface CloudServer {
  id: number;
  name: string;
  status: string;
  server_type: string;
  datacenter: string;
  public_ipv4: string;
  public_ipv6: string;
  private_ip: string | null;
  image: string;
  created: string;
  labels: Record<string, string>;
  volumes: number[];
  load_balancers: number[];
}

export interface CloudNetwork {
  id: number;
  name: string;
  ip_range: string;
  subnets: { type: string; ip_range: string; network_zone: string }[];
  servers: number[];
  created: string;
  labels: Record<string, string>;
}

export interface CloudFirewall {
  id: number;
  name: string;
  rules: {
    direction: string;
    protocol: string;
    port: string;
    source_ips: string[];
    description: string;
  }[];
  applied_to: { type: string; server: { id: number } }[];
  created: string;
  labels: Record<string, string>;
}

export interface CloudVolume {
  id: number;
  name: string;
  size: number;
  server: number | null;
  location: string;
  format: string;
  status: string;
  created: string;
  labels: Record<string, string>;
  linux_device: string;
}

const servers: CloudServer[] = [
  {
    id: 42917324,
    name: "web-prod-1",
    status: "running",
    server_type: "cpx31",
    datacenter: "fsn1-dc14",
    public_ipv4: "78.46.214.71",
    public_ipv6: "2a01:4f8:c012:abc1::1",
    private_ip: "10.0.0.2",
    image: "ubuntu-22.04",
    created: "2025-03-15T08:23:11+00:00",
    labels: { env: "production", role: "web" },
    volumes: [18293745],
    load_balancers: [],
  },
  {
    id: 42917389,
    name: "web-prod-2",
    status: "running",
    server_type: "cpx31",
    datacenter: "fsn1-dc14",
    public_ipv4: "78.46.214.83",
    public_ipv6: "2a01:4f8:c012:abc2::1",
    private_ip: "10.0.0.3",
    image: "ubuntu-22.04",
    created: "2025-03-15T08:25:44+00:00",
    labels: { env: "production", role: "web" },
    volumes: [],
    load_balancers: [],
  },
  {
    id: 43018456,
    name: "db-prod",
    status: "running",
    server_type: "ccx33",
    datacenter: "fsn1-dc14",
    public_ipv4: "78.46.215.12",
    public_ipv6: "2a01:4f8:c012:def1::1",
    private_ip: "10.0.0.10",
    image: "ubuntu-22.04",
    created: "2025-04-02T14:11:08+00:00",
    labels: { env: "production", role: "database" },
    volumes: [18293801, 18293802],
    load_balancers: [],
  },
  {
    id: 43201778,
    name: "staging-app",
    status: "running",
    server_type: "cx22",
    datacenter: "nbg1-dc3",
    public_ipv4: "116.202.33.91",
    public_ipv6: "2a01:4f8:c17:abc1::1",
    private_ip: "10.0.1.2",
    image: "debian-12",
    created: "2025-06-10T09:45:22+00:00",
    labels: { env: "staging", role: "app" },
    volumes: [],
    load_balancers: [],
  },
  {
    id: 43405112,
    name: "ci-runner",
    status: "off",
    server_type: "cx11",
    datacenter: "hel1-dc2",
    public_ipv4: "65.108.71.204",
    public_ipv6: "2a01:4f9:c012:1234::1",
    private_ip: null,
    image: "ubuntu-24.04",
    created: "2025-08-22T17:30:05+00:00",
    labels: { env: "ci", role: "runner" },
    volumes: [],
    load_balancers: [],
  },
];

const networks: CloudNetwork[] = [
  {
    id: 2847391,
    name: "prod-network",
    ip_range: "10.0.0.0/16",
    subnets: [
      { type: "cloud", ip_range: "10.0.0.0/24", network_zone: "eu-central" },
      { type: "cloud", ip_range: "10.0.1.0/24", network_zone: "eu-central" },
    ],
    servers: [42917324, 42917389, 43018456],
    created: "2025-03-14T12:00:00+00:00",
    labels: { env: "production" },
  },
  {
    id: 2847452,
    name: "staging-network",
    ip_range: "10.0.0.0/16",
    subnets: [
      { type: "cloud", ip_range: "10.0.1.0/24", network_zone: "eu-central" },
    ],
    servers: [43201778],
    created: "2025-06-10T09:40:00+00:00",
    labels: { env: "staging" },
  },
];

const firewalls: CloudFirewall[] = [
  {
    id: 891234,
    name: "web-firewall",
    rules: [
      {
        direction: "in",
        protocol: "tcp",
        port: "80",
        source_ips: ["0.0.0.0/0", "::/0"],
        description: "Allow HTTP",
      },
      {
        direction: "in",
        protocol: "tcp",
        port: "443",
        source_ips: ["0.0.0.0/0", "::/0"],
        description: "Allow HTTPS",
      },
      {
        direction: "in",
        protocol: "tcp",
        port: "22",
        source_ips: ["85.214.0.0/16"],
        description: "Allow SSH from office",
      },
    ],
    applied_to: [
      { type: "server", server: { id: 42917324 } },
      { type: "server", server: { id: 42917389 } },
    ],
    created: "2025-03-15T08:20:00+00:00",
    labels: { env: "production" },
  },
  {
    id: 891298,
    name: "db-firewall",
    rules: [
      {
        direction: "in",
        protocol: "tcp",
        port: "5432",
        source_ips: ["10.0.0.0/24"],
        description: "Allow PostgreSQL from prod subnet",
      },
      {
        direction: "in",
        protocol: "tcp",
        port: "22",
        source_ips: ["85.214.0.0/16"],
        description: "Allow SSH from office",
      },
    ],
    applied_to: [{ type: "server", server: { id: 43018456 } }],
    created: "2025-04-02T14:10:00+00:00",
    labels: { env: "production" },
  },
];

const volumes: CloudVolume[] = [
  {
    id: 18293745,
    name: "web-assets",
    size: 50,
    server: 42917324,
    location: "fsn1",
    format: "ext4",
    status: "available",
    created: "2025-03-15T08:30:00+00:00",
    labels: { env: "production", type: "assets" },
    linux_device: "/dev/disk/by-id/scsi-0HC_Volume_18293745",
  },
  {
    id: 18293801,
    name: "db-data",
    size: 200,
    server: 43018456,
    location: "fsn1",
    format: "ext4",
    status: "available",
    created: "2025-04-02T14:15:00+00:00",
    labels: { env: "production", type: "database" },
    linux_device: "/dev/disk/by-id/scsi-0HC_Volume_18293801",
  },
  {
    id: 18293802,
    name: "db-backup",
    size: 500,
    server: 43018456,
    location: "fsn1",
    format: "xfs",
    status: "available",
    created: "2025-04-03T10:00:00+00:00",
    labels: { env: "production", type: "backup" },
    linux_device: "/dev/disk/by-id/scsi-0HC_Volume_18293802",
  },
];

export function getCloudServers(): CloudServer[] {
  return servers;
}

export function getCloudServerByNameOrId(
  nameOrId: string
): CloudServer | undefined {
  const id = parseInt(nameOrId, 10);
  if (!isNaN(id)) return servers.find((s) => s.id === id);
  return servers.find((s) => s.name === nameOrId);
}

export function getCloudNetworks(): CloudNetwork[] {
  return networks;
}

export function getCloudNetworkById(id: number): CloudNetwork | undefined {
  return networks.find((n) => n.id === id);
}

export function getCloudFirewalls(): CloudFirewall[] {
  return firewalls;
}

export function getCloudFirewallById(id: number): CloudFirewall | undefined {
  return firewalls.find((f) => f.id === id);
}

export function getCloudVolumes(): CloudVolume[] {
  return volumes;
}

export function getCloudVolumeById(id: number): CloudVolume | undefined {
  return volumes.find((v) => v.id === id);
}
