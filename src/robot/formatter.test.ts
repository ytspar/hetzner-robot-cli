import { describe, it, expect } from 'vitest';
import {
  colors,
  colorize,
  success,
  error,
  warning,
  info,
  heading,
  formatStatus,
  formatBytes,
  formatDate,
  formatDateTime,
  formatJson,
} from '../shared/formatter.js';
import {
  formatServerList,
  formatServerDetails,
  formatResetOptions,
  formatResetResult,
  formatBootConfig,
  formatRescueActivation,
  formatLinuxActivation,
  formatIpList,
  formatIpDetails,
  formatSubnetList,
  formatFailoverList,
  formatFailoverSwitch,
  formatRdnsList,
  formatSshKeyList,
  formatSshKeyDetails,
  formatFirewall,
  formatFirewallTemplateList,
  formatVSwitchList,
  formatVSwitchDetails,
  formatStorageBoxList,
  formatStorageBoxDetails,
  formatStorageBoxSnapshots,
  formatStorageBoxSubaccounts,
  formatTraffic,
  formatWolResult,
  formatServerProductList,
  formatServerMarketProductList,
  formatTransactionList,
  formatCancellation,
} from './formatter.js';

describe('Formatter Module', () => {
  describe('colorize', () => {
    it('should wrap text with ANSI color codes', () => {
      const result = colorize('test', 'red');
      expect(result).toBe('\x1b[31mtest\x1b[0m');
    });

    it('should work with different colors', () => {
      expect(colorize('green', 'green')).toContain('\x1b[32m');
      expect(colorize('blue', 'blue')).toContain('\x1b[34m');
      expect(colorize('yellow', 'yellow')).toContain('\x1b[33m');
    });
  });

  describe('status indicators', () => {
    it('should format success message', () => {
      const result = success('Operation completed');
      expect(result).toContain('✓');
      expect(result).toContain('Operation completed');
      expect(result).toContain(colors.green);
    });

    it('should format error message', () => {
      const result = error('Something failed');
      expect(result).toContain('✗');
      expect(result).toContain('Something failed');
      expect(result).toContain(colors.red);
    });

    it('should format warning message', () => {
      const result = warning('Be careful');
      expect(result).toContain('⚠');
      expect(result).toContain('Be careful');
      expect(result).toContain(colors.yellow);
    });

    it('should format info message', () => {
      const result = info('For your information');
      expect(result).toContain('ℹ');
      expect(result).toContain('For your information');
      expect(result).toContain(colors.blue);
    });
  });

  describe('heading', () => {
    it('should format heading with underline', () => {
      const result = heading('Test Heading');
      expect(result).toContain('Test Heading');
      expect(result).toContain('─'.repeat('Test Heading'.length));
      expect(result).toContain(colors.bold);
      expect(result).toContain(colors.cyan);
    });
  });

  describe('formatStatus', () => {
    it('should color ready status green', () => {
      const result = formatStatus('ready');
      expect(result).toContain(colors.green);
    });

    it('should color active status green', () => {
      const result = formatStatus('active');
      expect(result).toContain(colors.green);
    });

    it('should color installing status yellow', () => {
      const result = formatStatus('installing');
      expect(result).toContain(colors.yellow);
    });

    it('should color in process status yellow', () => {
      const result = formatStatus('in process');
      expect(result).toContain(colors.yellow);
    });

    it('should color maintenance status red', () => {
      const result = formatStatus('maintenance');
      expect(result).toContain(colors.red);
    });

    it('should color failed status red', () => {
      const result = formatStatus('failed');
      expect(result).toContain(colors.red);
    });

    it('should return unknown status as-is', () => {
      const result = formatStatus('unknown');
      expect(result).toBe('unknown');
    });
  });

  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should format terabytes', () => {
      expect(formatBytes(1099511627776)).toBe('1 TB');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-06-15');
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should return dash for empty date', () => {
      expect(formatDate('')).toBe('-');
    });
  });

  describe('formatDateTime', () => {
    it('should format datetime string', () => {
      const result = formatDateTime('2024-06-15T14:30:00Z');
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('should return dash for empty datetime', () => {
      expect(formatDateTime('')).toBe('-');
    });
  });

  describe('formatServerList', () => {
    it('should format empty server list', () => {
      const result = formatServerList([]);
      expect(result).toContain('No servers found');
    });

    it('should format server list', () => {
      const servers = [
        {
          server: {
            server_ip: '1.2.3.4',
            server_ipv6_net: '2001:db8::/64',
            server_number: 123,
            server_name: 'my-server',
            product: 'AX41',
            dc: 'FSN1-DC14',
            traffic: 'unlimited',
            status: 'ready' as const,
            cancelled: false,
            paid_until: '2024-12-31',
            ip: [],
            subnet: [],
          },
        },
      ];

      const result = formatServerList(servers);

      expect(result).toContain('123');
      expect(result).toContain('1.2.3.4');
      expect(result).toContain('my-server');
      expect(result).toContain('AX41');
      expect(result).toContain('FSN1-DC14');
    });

    it('should show cancelled status', () => {
      const servers = [
        {
          server: {
            server_ip: '1.2.3.4',
            server_ipv6_net: '',
            server_number: 123,
            server_name: '',
            product: 'AX41',
            dc: 'FSN1',
            traffic: 'unlimited',
            status: 'ready' as const,
            cancelled: true,
            paid_until: '2024-12-31',
            ip: [],
            subnet: [],
          },
        },
      ];

      const result = formatServerList(servers);
      expect(result).toContain('Cancelled');
    });
  });

  describe('formatServerDetails', () => {
    it('should format server details', () => {
      const server = {
        server_ip: '1.2.3.4',
        server_ipv6_net: '2001:db8::/64',
        server_number: 123,
        server_name: 'my-server',
        product: 'AX41',
        dc: 'FSN1-DC14',
        traffic: 'unlimited',
        status: 'ready' as const,
        cancelled: false,
        paid_until: '2024-12-31',
        ip: ['5.6.7.8'],
        subnet: [{ ip: '10.0.0.0', mask: '24' }],
        reset: true,
        rescue: true,
        vnc: false,
        windows: false,
        plesk: false,
        cpanel: false,
        wol: true,
        hot_swap: false,
      };

      const result = formatServerDetails(server);

      expect(result).toContain('Server 123');
      expect(result).toContain('1.2.3.4');
      expect(result).toContain('my-server');
      expect(result).toContain('Features');
      expect(result).toContain('Reset');
      expect(result).toContain('Rescue');
      expect(result).toContain('WoL');
      expect(result).toContain('Additional IPs');
      expect(result).toContain('5.6.7.8');
      expect(result).toContain('Subnets');
      expect(result).toContain('10.0.0.0/24');
    });
  });

  describe('formatResetOptions', () => {
    it('should format reset options', () => {
      const reset = {
        server_ip: '1.2.3.4',
        server_ipv6_net: '',
        server_number: 123,
        type: ['sw', 'hw', 'man'] as ('sw' | 'hw' | 'man')[],
        operating_status: 'ready',
      };

      const result = formatResetOptions(reset);

      expect(result).toContain('Reset Options');
      expect(result).toContain('123');
      expect(result).toContain('sw, hw, man');
      expect(result).toContain('Software reset');
      expect(result).toContain('Hardware reset');
    });
  });

  describe('formatResetResult', () => {
    it('should format reset result', () => {
      const reset = {
        server_ip: '1.2.3.4',
        server_ipv6_net: '',
        server_number: 123,
        type: ['sw'] as ('sw')[],
        operating_status: 'ready',
      };

      const result = formatResetResult(reset, 'sw');

      expect(result).toContain('✓');
      expect(result).toContain('123');
      expect(result).toContain('sw');
    });
  });

  describe('formatBootConfig', () => {
    it('should format boot config', () => {
      const config = {
        rescue: {
          server_ip: '1.2.3.4',
          server_ipv6_net: '',
          server_number: 123,
          os: ['linux', 'linuxold'],
          arch: [64, 32],
          active: false,
          password: null,
          authorized_key: [],
          host_key: [],
        },
        linux: {
          server_ip: '1.2.3.4',
          server_ipv6_net: '',
          server_number: 123,
          dist: ['Debian-12', 'Ubuntu-22.04'],
          arch: [64],
          lang: ['en'],
          active: false,
          password: null,
          authorized_key: [],
          host_key: [],
        },
        vnc: null,
        windows: null,
        plesk: null,
        cpanel: null,
      };

      const result = formatBootConfig(config, 123);

      expect(result).toContain('Boot Configuration');
      expect(result).toContain('Rescue System');
      expect(result).toContain('linux, linuxold');
      expect(result).toContain('Linux Install');
    });
  });

  describe('formatRescueActivation', () => {
    it('should format rescue activation', () => {
      const rescue = {
        server_ip: '1.2.3.4',
        server_ipv6_net: '',
        server_number: 123,
        os: ['linux'],
        arch: [64],
        active: true,
        password: 'secret123',
        authorized_key: [],
        host_key: [],
      };

      const result = formatRescueActivation(rescue);

      expect(result).toContain('Rescue system activated');
      expect(result).toContain('1.2.3.4');
      expect(result).toContain('secret123');
      expect(result).toContain('Reboot');
    });
  });

  describe('formatIpList', () => {
    it('should format empty IP list', () => {
      const result = formatIpList([]);
      expect(result).toContain('No IPs found');
    });

    it('should format IP list', () => {
      const ips = [
        {
          ip: {
            ip: '1.2.3.4',
            server_ip: '5.6.7.8',
            server_number: 123,
            locked: false,
            separate_mac: null,
            traffic_warnings: true,
            traffic_hourly: 100,
            traffic_daily: 1000,
            traffic_monthly: 10000,
          },
        },
      ];

      const result = formatIpList(ips);

      expect(result).toContain('1.2.3.4');
      expect(result).toContain('5.6.7.8');
      expect(result).toContain('123');
    });
  });

  describe('formatIpDetails', () => {
    it('should format IP details', () => {
      const ip = {
        ip: '1.2.3.4',
        server_ip: '5.6.7.8',
        server_number: 123,
        locked: false,
        separate_mac: 'aa:bb:cc:dd:ee:ff',
        traffic_warnings: true,
        traffic_hourly: 100,
        traffic_daily: 1000,
        traffic_monthly: 10000,
      };

      const result = formatIpDetails(ip);

      expect(result).toContain('1.2.3.4');
      expect(result).toContain('aa:bb:cc:dd:ee:ff');
      expect(result).toContain('Enabled');
    });
  });

  describe('formatSubnetList', () => {
    it('should format empty subnet list', () => {
      const result = formatSubnetList([]);
      expect(result).toContain('No subnets found');
    });

    it('should format subnet list', () => {
      const subnets = [
        {
          subnet: {
            ip: '10.0.0.0',
            mask: '24',
            gateway: '10.0.0.1',
            server_ip: '1.2.3.4',
            server_number: 123,
            failover: false,
            locked: false,
            traffic_warnings: false,
            traffic_hourly: 0,
            traffic_daily: 0,
            traffic_monthly: 0,
          },
        },
      ];

      const result = formatSubnetList(subnets);

      expect(result).toContain('10.0.0.0/24');
      expect(result).toContain('10.0.0.1');
    });
  });

  describe('formatFailoverList', () => {
    it('should format empty failover list', () => {
      const result = formatFailoverList([]);
      expect(result).toContain('No failover IPs found');
    });

    it('should format failover list', () => {
      const failovers = [
        {
          failover: {
            ip: '1.2.3.4',
            netmask: '255.255.255.255',
            server_ip: '5.6.7.8',
            server_number: 123,
            active_server_ip: '5.6.7.8',
          },
        },
      ];

      const result = formatFailoverList(failovers);

      expect(result).toContain('1.2.3.4');
      expect(result).toContain('5.6.7.8');
    });
  });

  describe('formatFailoverSwitch', () => {
    it('should format failover switch result', () => {
      const failover = {
        ip: '1.2.3.4',
        netmask: '255.255.255.255',
        server_ip: '5.6.7.8',
        server_number: 123,
        active_server_ip: '9.10.11.12',
      };

      const result = formatFailoverSwitch(failover);

      expect(result).toContain('✓');
      expect(result).toContain('1.2.3.4');
      expect(result).toContain('9.10.11.12');
    });
  });

  describe('formatRdnsList', () => {
    it('should format empty RDNS list', () => {
      const result = formatRdnsList([]);
      expect(result).toContain('No reverse DNS entries found');
    });

    it('should format RDNS list', () => {
      const entries = [
        { rdns: { ip: '1.2.3.4', ptr: 'host.example.com' } },
      ];

      const result = formatRdnsList(entries);

      expect(result).toContain('1.2.3.4');
      expect(result).toContain('host.example.com');
    });
  });

  describe('formatSshKeyList', () => {
    it('should format empty SSH key list', () => {
      const result = formatSshKeyList([]);
      expect(result).toContain('No SSH keys found');
    });

    it('should format SSH key list', () => {
      const keys = [
        {
          key: {
            name: 'my-key',
            fingerprint: 'ab:cd:ef:12:34:56',
            type: 'rsa',
            size: 4096,
            data: 'ssh-rsa AAAA...',
          },
        },
      ];

      const result = formatSshKeyList(keys);

      expect(result).toContain('my-key');
      expect(result).toContain('ab:cd:ef:12:34:56');
      expect(result).toContain('RSA');
      expect(result).toContain('4096');
    });
  });

  describe('formatSshKeyDetails', () => {
    it('should format SSH key details', () => {
      const key = {
        name: 'my-key',
        fingerprint: 'ab:cd:ef:12:34:56',
        type: 'rsa',
        size: 4096,
        data: 'ssh-rsa AAAA...',
      };

      const result = formatSshKeyDetails(key);

      expect(result).toContain('SSH Key: my-key');
      expect(result).toContain('ab:cd:ef:12:34:56');
      expect(result).toContain('ssh-rsa AAAA...');
    });
  });

  describe('formatFirewall', () => {
    it('should format firewall', () => {
      const firewall = {
        server_ip: '1.2.3.4',
        server_number: 123,
        status: 'active' as const,
        filter_ipv6: true,
        whitelist_hos: false,
        port: 'main' as const,
        rules: {
          input: [
            {
              ip_version: 'ipv4',
              name: 'Allow SSH',
              dst_ip: null,
              dst_port: '22',
              src_ip: null,
              src_port: null,
              protocol: 'tcp',
              tcp_flags: null,
              action: 'accept' as const,
            },
          ],
        },
      };

      const result = formatFirewall(firewall);

      expect(result).toContain('Firewall');
      expect(result).toContain('123');
      expect(result).toContain('active');
      expect(result).toContain('Allow SSH');
      expect(result).toContain('accept');
    });
  });

  describe('formatFirewallTemplateList', () => {
    it('should format empty template list', () => {
      const result = formatFirewallTemplateList([]);
      expect(result).toContain('No firewall templates found');
    });

    it('should format firewall template list', () => {
      const templates = [
        {
          firewall_template: {
            id: 1,
            name: 'my-template',
            filter_ipv6: true,
            whitelist_hos: false,
            is_default: true,
            rules: { input: [] },
          },
        },
      ];

      const result = formatFirewallTemplateList(templates);

      expect(result).toContain('1');
      expect(result).toContain('my-template');
    });
  });

  describe('formatVSwitchList', () => {
    it('should format empty vSwitch list', () => {
      const result = formatVSwitchList([]);
      expect(result).toContain('No vSwitches found');
    });

    it('should format vSwitch list', () => {
      const vswitches = [
        {
          vswitch: {
            id: 1,
            name: 'my-vswitch',
            vlan: 4000,
            cancelled: false,
            server: [],
            subnet: [],
            cloud_network: [],
          },
        },
      ];

      const result = formatVSwitchList(vswitches);

      expect(result).toContain('1');
      expect(result).toContain('my-vswitch');
      expect(result).toContain('4000');
    });
  });

  describe('formatVSwitchDetails', () => {
    it('should format vSwitch details', () => {
      const vswitch = {
        id: 1,
        name: 'my-vswitch',
        vlan: 4000,
        cancelled: false,
        server: [
          {
            server_ip: '1.2.3.4',
            server_ipv6_net: '',
            server_number: 123,
            status: 'ready' as const,
          },
        ],
        subnet: [{ ip: '10.0.0.0', mask: 24, gateway: '10.0.0.1' }],
        cloud_network: [],
      };

      const result = formatVSwitchDetails(vswitch);

      expect(result).toContain('vSwitch 1');
      expect(result).toContain('my-vswitch');
      expect(result).toContain('Connected Servers');
      expect(result).toContain('1.2.3.4');
      expect(result).toContain('Subnets');
      expect(result).toContain('10.0.0.0/24');
    });
  });

  describe('formatStorageBoxList', () => {
    it('should format empty storage box list', () => {
      const result = formatStorageBoxList([]);
      expect(result).toContain('No storage boxes found');
    });

    it('should format storage box list', () => {
      const boxes = [
        {
          storagebox: {
            id: 1,
            login: 'u123456',
            name: 'my-box',
            product: 'BX11',
            cancelled: false,
            locked: false,
            location: 'FSN1',
            linked_server: null,
            paid_until: '2024-12-31',
            disk_quota: 1073741824,
            disk_usage: 536870912,
            disk_usage_data: 500000000,
            disk_usage_snapshots: 36870912,
            webdav: true,
            samba: true,
            ssh: true,
            external_reachability: true,
            zfs: false,
            server: 'u123456.your-storagebox.de',
            host_system: 'fsn1-storagebox1',
          },
        },
      ];

      const result = formatStorageBoxList(boxes);

      expect(result).toContain('1');
      expect(result).toContain('my-box');
      expect(result).toContain('BX11');
      expect(result).toContain('FSN1');
    });
  });

  describe('formatStorageBoxDetails', () => {
    it('should format storage box details', () => {
      const box = {
        id: 1,
        login: 'u123456',
        name: 'my-box',
        product: 'BX11',
        cancelled: false,
        locked: false,
        location: 'FSN1',
        linked_server: null,
        paid_until: '2024-12-31',
        disk_quota: 1073741824,
        disk_usage: 536870912,
        disk_usage_data: 500000000,
        disk_usage_snapshots: 36870912,
        webdav: true,
        samba: true,
        ssh: true,
        external_reachability: true,
        zfs: false,
        server: 'u123456.your-storagebox.de',
        host_system: 'fsn1-storagebox1',
      };

      const result = formatStorageBoxDetails(box);

      expect(result).toContain('Storage Box 1');
      expect(result).toContain('u123456');
      expect(result).toContain('Features');
      expect(result).toContain('WebDAV');
      expect(result).toContain('Enabled');
    });
  });

  describe('formatStorageBoxSnapshots', () => {
    it('should format empty snapshot list', () => {
      const result = formatStorageBoxSnapshots([]);
      expect(result).toContain('No snapshots found');
    });

    it('should format snapshot list', () => {
      const snapshots = [
        {
          snapshot: {
            name: '2024-01-15T12:00:00',
            timestamp: '2024-01-15T12:00:00Z',
            size: 1073741824,
            size_formatted: '1 GB',
          },
        },
      ];

      const result = formatStorageBoxSnapshots(snapshots);

      expect(result).toContain('2024-01-15T12:00:00');
      expect(result).toContain('1 GB');
    });
  });

  describe('formatStorageBoxSubaccounts', () => {
    it('should format empty subaccount list', () => {
      const result = formatStorageBoxSubaccounts([]);
      expect(result).toContain('No subaccounts found');
    });

    it('should format subaccount list', () => {
      const subaccounts = [
        {
          subaccount: {
            username: 'sub1',
            accountid: 'u123456-sub1',
            server: 'u123456.your-storagebox.de',
            homedirectory: '/home/sub1',
            samba: true,
            ssh: true,
            external_reachability: false,
            webdav: false,
            readonly: false,
            createtime: '2024-01-15T12:00:00Z',
            comment: 'Test subaccount',
          },
        },
      ];

      const result = formatStorageBoxSubaccounts(subaccounts);

      expect(result).toContain('sub1');
      expect(result).toContain('/home/sub1');
    });
  });

  describe('formatTraffic', () => {
    it('should format traffic data', () => {
      const traffic = {
        ip: '1.2.3.4',
        type: 'month' as const,
        from: '2024-01-01',
        to: '2024-01-31',
        data: [
          { in: 1073741824, out: 536870912, sum: 1610612736, date: '2024-01' },
        ],
      };

      const result = formatTraffic(traffic);

      expect(result).toContain('Traffic for 1.2.3.4');
      expect(result).toContain('2024-01');
      expect(result).toContain('1 GB');
    });
  });

  describe('formatWolResult', () => {
    it('should format WoL result', () => {
      const wol = {
        server_ip: '1.2.3.4',
        server_ipv6_net: '',
        server_number: 123,
      };

      const result = formatWolResult(wol);

      expect(result).toContain('✓');
      expect(result).toContain('Wake-on-LAN');
      expect(result).toContain('123');
    });
  });

  describe('formatServerProductList', () => {
    it('should format empty product list', () => {
      const result = formatServerProductList([]);
      expect(result).toContain('No products found');
    });

    it('should format product list', () => {
      const products = [
        {
          product: {
            id: 'AX41',
            name: 'AX41',
            description: ['AMD Ryzen 5 3600'],
            traffic: 'unlimited',
            dist: ['Debian'],
            arch: [64],
            lang: ['en'],
            location: ['FSN1', 'NBG1'],
            prices: [],
            orderable_addons: [],
          },
        },
      ];

      const result = formatServerProductList(products);

      expect(result).toContain('AX41');
      expect(result).toContain('unlimited');
      expect(result).toContain('FSN1');
    });
  });

  describe('formatServerMarketProductList', () => {
    it('should format empty market product list', () => {
      const result = formatServerMarketProductList([]);
      expect(result).toContain('No market products available');
    });

    it('should format market product list', () => {
      const products = [
        {
          product: {
            id: 12345,
            name: 'SB123',
            description: ['Intel Core i7'],
            traffic: 'unlimited',
            dist: ['Debian'],
            arch: [64],
            lang: ['en'],
            cpu: 'Intel Core i7-6700',
            cpu_benchmark: 8500,
            memory_size: 32,
            hdd_size: 512,
            hdd_text: '2x 256GB NVMe',
            hdd_count: 2,
            datacenter: 'FSN1-DC14',
            network_speed: '1 Gbit/s',
            price: '29.00',
            price_setup: '0.00',
            fixed_price: true,
            next_reduce: 0,
            next_reduce_date: '',
            orderable_addons: [],
          },
        },
      ];

      const result = formatServerMarketProductList(products);

      expect(result).toContain('12345');
      expect(result).toContain('Intel Core i7-6700');
      expect(result).toContain('32 GB');
      expect(result).toContain('€29.00');
    });
  });

  describe('formatTransactionList', () => {
    it('should format empty transaction list', () => {
      const result = formatTransactionList([]);
      expect(result).toContain('No transactions found');
    });

    it('should format transaction list', () => {
      const transactions = [
        {
          transaction: {
            id: 'TX-12345',
            date: '2024-01-15',
            status: 'ready' as const,
            server_number: 123,
            server_ip: '1.2.3.4',
            authorized_key: [],
            host_key: [],
            comment: '',
            product: {
              id: 'AX41',
              name: 'AX41',
              description: [],
              traffic: 'unlimited',
              dist: 'Debian',
              arch: 64,
              lang: 'en',
              location: 'FSN1',
            },
          },
        },
      ];

      const result = formatTransactionList(transactions);

      expect(result).toContain('TX-12345');
      expect(result).toContain('AX41');
    });
  });

  describe('formatCancellation', () => {
    it('should format cancellation status', () => {
      const cancellation = {
        server_ip: '1.2.3.4',
        server_ipv6_net: '',
        server_number: 123,
        server_name: 'my-server',
        earliest_cancellation_date: '2024-02-01',
        cancelled: false,
        cancellation_date: null,
        cancellation_reason: null,
      };

      const result = formatCancellation(cancellation);

      expect(result).toContain('Cancellation');
      expect(result).toContain('123');
      expect(result).toContain('my-server');
      expect(result).toContain('No');
    });

    it('should format cancelled server', () => {
      const cancellation = {
        server_ip: '1.2.3.4',
        server_ipv6_net: '',
        server_number: 123,
        server_name: 'my-server',
        earliest_cancellation_date: '2024-02-01',
        cancelled: true,
        cancellation_date: '2024-03-31',
        cancellation_reason: ['price', 'service'],
      };

      const result = formatCancellation(cancellation);

      expect(result).toContain('Yes');
      expect(result).toContain('price, service');
    });
  });

  describe('formatJson', () => {
    it('should format object as JSON', () => {
      const data = { key: 'value', nested: { a: 1 } };
      const result = formatJson(data);

      expect(result).toBe(JSON.stringify(data, null, 2));
    });

    it('should format array as JSON', () => {
      const data = [1, 2, 3];
      const result = formatJson(data);

      expect(result).toBe(JSON.stringify(data, null, 2));
    });
  });

  describe('formatBootConfig edge cases', () => {
    it('should show active rescue with password', () => {
      const config = {
        rescue: {
          server_ip: '1.2.3.4',
          server_ipv6_net: '',
          server_number: 123,
          os: ['linux'],
          arch: [64],
          active: true,
          password: 'secret',
          authorized_key: [],
          host_key: [],
        },
        linux: null,
        vnc: {
          server_ip: '1.2.3.4',
          server_ipv6_net: '',
          server_number: 123,
          dist: ['Debian'],
          arch: [64],
          lang: ['en'],
          active: true,
          password: 'vncpass',
        },
        windows: {
          server_ip: '1.2.3.4',
          server_ipv6_net: '',
          server_number: 123,
          dist: ['standard'],
          lang: ['en'],
          active: false,
          password: null,
        },
        plesk: null,
        cpanel: null,
      };

      const result = formatBootConfig(config, 123);

      expect(result).toContain('Rescue System');
      expect(result).toContain('Yes'); // active
      expect(result).toContain('secret');
      expect(result).toContain('VNC Install');
      expect(result).toContain('vncpass');
      expect(result).toContain('Windows Install');
    });
  });

  describe('formatServerDetails edge cases', () => {
    it('should handle server with no features', () => {
      const server = {
        server_ip: '1.2.3.4',
        server_ipv6_net: '',
        server_number: 123,
        server_name: '',
        product: 'AX41',
        dc: 'FSN1',
        traffic: 'unlimited',
        status: 'ready' as const,
        cancelled: true,
        paid_until: '2024-12-31',
        ip: [],
        subnet: [],
        reset: false,
        rescue: false,
        vnc: false,
        windows: false,
        plesk: false,
        cpanel: false,
        wol: false,
        hot_swap: false,
      };

      const result = formatServerDetails(server);

      expect(result).toContain('None'); // No features
      expect(result).toContain('Yes'); // Cancelled
      expect(result).not.toContain('Additional IPs');
      expect(result).not.toContain('Subnets');
    });
  });

  describe('formatLinuxActivation', () => {
    it('should format linux activation', () => {
      const linux = {
        server_ip: '1.2.3.4',
        server_ipv6_net: '',
        server_number: 123,
        dist: ['Debian-12'],
        arch: [64],
        lang: ['en'],
        active: true,
        password: 'linux-pass',
        authorized_key: [],
        host_key: [],
      };

      const result = formatLinuxActivation(linux);

      expect(result).toContain('Linux installation activated');
      expect(result).toContain('1.2.3.4');
      expect(result).toContain('linux-pass');
    });
  });

  describe('formatIpDetails edge cases', () => {
    it('should handle locked IP without MAC', () => {
      const ip = {
        ip: '1.2.3.4',
        server_ip: '5.6.7.8',
        server_number: 123,
        locked: true,
        separate_mac: null,
        traffic_warnings: false,
        traffic_hourly: 0,
        traffic_daily: 0,
        traffic_monthly: 0,
      };

      const result = formatIpDetails(ip);

      expect(result).toContain('Yes'); // Locked
      expect(result).toContain('Disabled'); // Traffic warnings
    });
  });

  describe('formatRescueActivation without password', () => {
    it('should format rescue without password', () => {
      const rescue = {
        server_ip: '1.2.3.4',
        server_ipv6_net: '',
        server_number: 123,
        os: ['linux'],
        arch: [64],
        active: true,
        password: null,
        authorized_key: [],
        host_key: [],
      };

      const result = formatRescueActivation(rescue);

      expect(result).toContain('Rescue system activated');
      expect(result).not.toContain('Password:');
    });
  });

  describe('formatVSwitchDetails without servers/subnets', () => {
    it('should format vSwitch without servers or subnets', () => {
      const vswitch = {
        id: 1,
        name: 'empty-vswitch',
        vlan: 4000,
        cancelled: true,
        server: [],
        subnet: [],
        cloud_network: [],
      };

      const result = formatVSwitchDetails(vswitch);

      expect(result).toContain('empty-vswitch');
      expect(result).toContain('Yes'); // Cancelled
      expect(result).not.toContain('Connected Servers');
      expect(result).not.toContain('Subnets:');
    });
  });

  describe('formatStorageBoxSnapshots with size', () => {
    it('should format snapshot with numeric size', () => {
      const snapshots = [
        {
          snapshot: {
            name: 'snap1',
            timestamp: '2024-01-15T12:00:00Z',
            size: 1073741824,
            size_formatted: '',
          },
        },
      ];

      const result = formatStorageBoxSnapshots(snapshots);

      expect(result).toContain('1 GB');
    });
  });

  describe('formatTraffic with no date', () => {
    it('should format traffic data without date', () => {
      const traffic = {
        ip: '1.2.3.4',
        type: 'month' as const,
        from: '2024-01-01',
        to: '2024-01-31',
        data: [
          { in: 1073741824, out: 536870912, sum: 1610612736 },
        ],
      };

      const result = formatTraffic(traffic);

      expect(result).toContain('-'); // No date
    });
  });
});
