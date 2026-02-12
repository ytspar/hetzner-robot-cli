export interface RobotServer {
  server_ip: string;
  server_ipv6_net: string;
  server_number: number;
  server_name: string;
  product: string;
  dc: string;
  traffic: string;
  status: string;
  cancelled: boolean;
  paid_until: string;
  ip: string[];
  subnet: { ip: string; mask: string }[];
}

export interface SshKey {
  name: string;
  fingerprint: string;
  type: string;
  size: number;
}

const servers: RobotServer[] = [
  {
    server_ip: "136.243.71.132",
    server_ipv6_net: "2a01:4f8:211:1c84::/64",
    server_number: 1284751,
    server_name: "db-primary",
    product: "AX41-NVMe",
    dc: "FSN1-DC14",
    traffic: "unlimited",
    status: "ready",
    cancelled: false,
    paid_until: "2026-04-01",
    ip: ["136.243.71.132"],
    subnet: [{ ip: "2a01:4f8:211:1c84::", mask: "64" }],
  },
  {
    server_ip: "88.99.214.56",
    server_ipv6_net: "2a01:4f8:10a:39f2::/64",
    server_number: 1298432,
    server_name: "worker-1",
    product: "AX51-NVMe",
    dc: "NBG1-DC3",
    traffic: "unlimited",
    status: "ready",
    cancelled: false,
    paid_until: "2026-05-15",
    ip: ["88.99.214.56"],
    subnet: [{ ip: "2a01:4f8:10a:39f2::", mask: "64" }],
  },
  {
    server_ip: "65.108.92.187",
    server_ipv6_net: "2a01:4f9:4a:2bc7::/64",
    server_number: 1345891,
    server_name: "backup-stor",
    product: "SX134",
    dc: "HEL1-DC2",
    traffic: "unlimited",
    status: "ready",
    cancelled: false,
    paid_until: "2026-03-01",
    ip: ["65.108.92.187"],
    subnet: [{ ip: "2a01:4f9:4a:2bc7::", mask: "64" }],
  },
];

const sshKeys: SshKey[] = [
  {
    name: "deploy-key",
    fingerprint: "56:29:99:a4:5d:ed:ac:40:17:d1:48:b2:0f:59:3e:41",
    type: "ed25519",
    size: 256,
  },
  {
    name: "admin-laptop",
    fingerprint: "e4:1c:82:57:c1:d3:da:0c:58:5b:81:6e:7f:99:0a:23",
    type: "rsa",
    size: 4096,
  },
  {
    name: "ci-runner",
    fingerprint: "a1:b2:c3:d4:e5:f6:78:90:ab:cd:ef:12:34:56:78:90",
    type: "ed25519",
    size: 256,
  },
];

export function getRobotServers(): RobotServer[] {
  return servers;
}

export function getRobotServerById(id: number): RobotServer | undefined {
  return servers.find((s) => s.server_number === id);
}

export function getSshKeys(): SshKey[] {
  return sshKeys;
}
