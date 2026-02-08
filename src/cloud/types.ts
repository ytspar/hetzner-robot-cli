// ============================================================================
// Hetzner Cloud API Types
// Based on: https://docs.hetzner.cloud/
// ============================================================================

// Common types
export type Labels = Record<string, string>;

export interface CloudAction {
  id: number;
  command: string;
  status: 'running' | 'success' | 'error';
  progress: number;
  started: string;
  finished: string | null;
  resources: { id: number; type: string }[];
  error: { code: string; message: string } | null;
}

export interface PaginationMeta {
  pagination: {
    page: number;
    per_page: number;
    previous_page: number | null;
    next_page: number | null;
    last_page: number;
    total_entries: number;
  };
}

export interface CloudApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Protection
export interface Protection {
  delete: boolean;
  rebuild?: boolean;
}

// Datacenter
export interface Datacenter {
  id: number;
  name: string;
  description: string;
  location: Location;
  server_types: {
    supported: number[];
    available: number[];
    available_for_migration: number[];
  };
}

// Location
export interface Location {
  id: number;
  name: string;
  description: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  network_zone: string;
}

// Server Type
export interface ServerType {
  id: number;
  name: string;
  description: string;
  cores: number;
  memory: number;
  disk: number;
  storage_type: 'local' | 'network';
  cpu_type: 'shared' | 'dedicated';
  architecture: 'x86' | 'arm';
  deprecated: boolean;
  deprecation?: {
    announced: string;
    unavailable_after: string;
  } | null;
  prices: ServerTypePrice[];
}

export interface ServerTypePrice {
  location: string;
  price_hourly: { net: string; gross: string };
  price_monthly: { net: string; gross: string };
  included_traffic: number;
}

// ISO
export interface ISO {
  id: number;
  name: string;
  description: string;
  type: 'public' | 'private';
  deprecation?: {
    announced: string;
    unavailable_after: string;
  } | null;
  architecture: 'x86' | 'arm' | null;
}

// Image
export interface Image {
  id: number;
  type: 'system' | 'snapshot' | 'backup' | 'app';
  status: 'available' | 'creating' | 'unavailable';
  name: string | null;
  description: string;
  image_size: number | null;
  disk_size: number;
  created: string;
  created_from: { id: number; name: string } | null;
  bound_to: number | null;
  os_flavor: string;
  os_version: string | null;
  architecture: 'x86' | 'arm';
  rapid_deploy: boolean;
  protection: Protection;
  deprecated: string | null;
  deleted: string | null;
  labels: Labels;
}

// SSH Key (Cloud)
export interface CloudSshKey {
  id: number;
  name: string;
  fingerprint: string;
  public_key: string;
  labels: Labels;
  created: string;
}

// Server
export interface CloudServer {
  id: number;
  name: string;
  status: 'running' | 'initializing' | 'starting' | 'stopping' | 'off' | 'deleting' | 'migrating' | 'rebuilding' | 'unknown';
  public_net: {
    ipv4: { ip: string; dns_ptr: string; blocked: boolean } | null;
    ipv6: { ip: string; dns_ptr: { ip: string; dns_ptr: string }[]; blocked: boolean } | null;
    floating_ips: number[];
    firewalls: { id: number; status: 'applied' | 'pending' }[];
  };
  private_net: { network: number; ip: string; alias_ips: string[]; mac_address: string }[];
  server_type: ServerType;
  datacenter: Datacenter;
  image: Image | null;
  iso: ISO | null;
  rescue_enabled: boolean;
  locked: boolean;
  backup_window: string | null;
  outgoing_traffic: number | null;
  ingoing_traffic: number | null;
  included_traffic: number;
  protection: Protection;
  labels: Labels;
  volumes: number[];
  load_balancers: number[];
  primary_disk_size: number;
  created: string;
  placement_group?: { id: number; name: string; type: string } | null;
}

// Network
export interface Network {
  id: number;
  name: string;
  ip_range: string;
  subnets: NetworkSubnet[];
  routes: NetworkRoute[];
  servers: number[];
  load_balancers: number[];
  protection: Protection;
  labels: Labels;
  created: string;
  expose_routes_to_vswitch: boolean;
}

export interface NetworkSubnet {
  type: 'cloud' | 'server' | 'vswitch';
  ip_range: string;
  network_zone: string;
  gateway: string;
  vswitch_id?: number | null;
}

export interface NetworkRoute {
  destination: string;
  gateway: string;
}

// Cloud Firewall
export interface CloudFirewall {
  id: number;
  name: string;
  labels: Labels;
  rules: CloudFirewallRule[];
  applied_to: CloudFirewallAppliedTo[];
  created: string;
}

export interface CloudFirewallRule {
  direction: 'in' | 'out';
  protocol: 'tcp' | 'udp' | 'icmp' | 'esp' | 'gre';
  port: string | null;
  source_ips: string[];
  destination_ips: string[];
  description: string | null;
}

export interface CloudFirewallAppliedTo {
  type: 'server' | 'label_selector';
  server?: { id: number };
  label_selector?: { selector: string };
}

// Floating IP
export interface FloatingIp {
  id: number;
  name: string;
  description: string;
  ip: string;
  type: 'ipv4' | 'ipv6';
  server: number | null;
  dns_ptr: { ip: string; dns_ptr: string }[];
  home_location: Location;
  blocked: boolean;
  protection: Protection;
  labels: Labels;
  created: string;
}

// Primary IP
export interface PrimaryIp {
  id: number;
  name: string;
  ip: string;
  type: 'ipv4' | 'ipv6';
  assignee_id: number | null;
  assignee_type: 'server';
  auto_delete: boolean;
  blocked: boolean;
  datacenter: Datacenter;
  dns_ptr: { ip: string; dns_ptr: string }[];
  labels: Labels;
  protection: Protection;
  created: string;
}

// Volume
export interface Volume {
  id: number;
  name: string;
  server: number | null;
  status: 'creating' | 'available' | 'attached';
  location: Location;
  size: number;
  linux_device: string | null;
  protection: Protection;
  labels: Labels;
  created: string;
  format: string | null;
}

// Load Balancer
export interface LoadBalancer {
  id: number;
  name: string;
  public_net: {
    enabled: boolean;
    ipv4: { ip: string; dns_ptr: string };
    ipv6: { ip: string; dns_ptr: string };
  };
  private_net: { network: number; ip: string }[];
  location: Location;
  load_balancer_type: LoadBalancerType;
  protection: Protection;
  labels: Labels;
  targets: LoadBalancerTarget[];
  services: LoadBalancerService[];
  algorithm: { type: 'round_robin' | 'least_connections' };
  outgoing_traffic: number | null;
  ingoing_traffic: number | null;
  included_traffic: number;
  created: string;
}

export interface LoadBalancerType {
  id: number;
  name: string;
  description: string;
  max_connections: number;
  max_services: number;
  max_targets: number;
  max_assigned_certificates: number;
  deprecated: string | null;
  prices: ServerTypePrice[];
}

export interface LoadBalancerTarget {
  type: 'server' | 'label_selector' | 'ip';
  server?: { id: number };
  label_selector?: { selector: string };
  ip?: { ip: string };
  health_status: { listen_port: number; status: 'healthy' | 'unhealthy' | 'unknown' }[];
  use_private_ip: boolean;
}

export interface LoadBalancerService {
  protocol: 'tcp' | 'http' | 'https';
  listen_port: number;
  destination_port: number;
  proxyprotocol: boolean;
  health_check: {
    protocol: 'tcp' | 'http' | 'https';
    port: number;
    interval: number;
    timeout: number;
    retries: number;
    http?: {
      domain: string | null;
      path: string;
      response: string | null;
      status_codes: string[];
      tls: boolean;
    };
  };
  http?: {
    cookie_name: string;
    cookie_lifetime: number;
    certificates: number[];
    redirect_http: boolean;
    sticky_sessions: boolean;
  };
}

// Certificate
export interface Certificate {
  id: number;
  name: string;
  labels: Labels;
  type: 'uploaded' | 'managed';
  certificate: string | null;
  created: string;
  not_valid_before: string;
  not_valid_after: string;
  domain_names: string[];
  fingerprint: string | null;
  status: {
    issuance: 'pending' | 'completed' | 'failed';
    renewal: 'scheduled' | 'pending' | 'failed' | 'unavailable';
    error?: { code: string; message: string } | null;
  } | null;
  used_by: { id: number; type: string }[];
}

// Placement Group
export interface PlacementGroup {
  id: number;
  name: string;
  labels: Labels;
  type: 'spread';
  servers: number[];
  created: string;
}
