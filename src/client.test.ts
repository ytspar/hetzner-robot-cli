import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HetznerRobotClient } from './client.js';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('HetznerRobotClient', () => {
  let client: HetznerRobotClient;

  beforeEach(() => {
    client = new HetznerRobotClient('testuser', 'testpass');
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with credentials', () => {
      const c = new HetznerRobotClient('user', 'pass');
      expect(c).toBeInstanceOf(HetznerRobotClient);
    });

    it('should encode credentials as base64', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      });

      await client.listServers();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Basic ${Buffer.from('testuser:testpass').toString('base64')}`,
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: { code: 'AUTH_ERROR', message: 'Invalid credentials' } }),
      });

      await expect(client.listServers()).rejects.toThrow('AUTH_ERROR: Invalid credentials');
    });

    it('should handle non-JSON error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Not JSON')),
      });

      await expect(client.listServers()).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('No content')),
      });

      // deleteRdns returns void, so we just check it doesn't throw
      await expect(client.deleteRdns('1.2.3.4')).resolves.not.toThrow();
    });
  });

  describe('Server Management', () => {
    it('should list servers', async () => {
      const mockServers = [
        { server: { server_ip: '1.2.3.4', server_number: 123 } },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockServers),
      });

      const result = await client.listServers();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/server',
        expect.any(Object)
      );
      expect(result).toEqual(mockServers);
    });

    it('should get server details', async () => {
      const mockServer = { server: { server_ip: '1.2.3.4', server_number: 123 } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockServer),
      });

      const result = await client.getServer('1.2.3.4');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/server/1.2.3.4',
        expect.any(Object)
      );
      expect(result).toEqual(mockServer);
    });

    it('should get server by number', async () => {
      const mockServer = { server: { server_ip: '1.2.3.4', server_number: 123 } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockServer),
      });

      await client.getServer(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/server/123',
        expect.any(Object)
      );
    });

    it('should update server name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ server: { server_name: 'new-name' } }),
      });

      await client.updateServerName(123, 'new-name');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/server/123',
        expect.objectContaining({
          method: 'POST',
          body: 'server_name=new-name',
        })
      );
    });
  });

  describe('Cancellation', () => {
    it('should get cancellation status', async () => {
      const mockCancellation = { cancellation: { cancelled: false } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCancellation),
      });

      const result = await client.getCancellation(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/server/123/cancellation',
        expect.any(Object)
      );
      expect(result).toEqual(mockCancellation);
    });

    it('should cancel server with date and reasons', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ cancellation: { cancelled: true } }),
      });

      await client.cancelServer(123, '2024-12-31', ['price', 'service']);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cancellation'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('cancellation_date=2024-12-31'),
        })
      );
    });

    it('should revoke cancellation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.revokeCancellation(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/server/123/cancellation',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Reset', () => {
    it('should list reset options', async () => {
      const mockResets = [{ reset: { server_number: 123, type: ['sw', 'hw'] } }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResets),
      });

      const result = await client.listResetOptions();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/reset',
        expect.any(Object)
      );
      expect(result).toEqual(mockResets);
    });

    it('should get reset options for server', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ reset: { type: ['sw', 'hw'] } }),
      });

      await client.getResetOptions(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/reset/123',
        expect.any(Object)
      );
    });

    it('should reset server with default type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ reset: { server_number: 123 } }),
      });

      await client.resetServer(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/reset/123',
        expect.objectContaining({
          method: 'POST',
          body: 'type=sw',
        })
      );
    });

    it('should reset server with specified type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ reset: { server_number: 123 } }),
      });

      await client.resetServer(123, 'hw');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: 'type=hw',
        })
      );
    });
  });

  describe('Boot Configuration', () => {
    it('should get boot config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ boot: { rescue: null, linux: null } }),
      });

      await client.getBootConfig(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123',
        expect.any(Object)
      );
    });

    it('should activate rescue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ rescue: { active: true, password: 'abc123' } }),
      });

      await client.activateRescue(123, 'linux', 64, ['fingerprint1']);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/rescue',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('os=linux'),
        })
      );
    });

    it('should deactivate rescue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ rescue: { active: false } }),
      });

      await client.deactivateRescue(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/rescue',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should get last rescue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ rescue: { password: 'old-pass' } }),
      });

      await client.getLastRescue(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/rescue/last',
        expect.any(Object)
      );
    });

    it('should activate linux', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ linux: { active: true } }),
      });

      await client.activateLinux(123, 'Debian-12', 64, 'en', ['key1']);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/linux',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('dist=Debian-12'),
        })
      );
    });

    it('should deactivate linux', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ linux: { active: false } }),
      });

      await client.deactivateLinux(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/linux',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should activate vnc', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ vnc: { active: true } }),
      });

      await client.activateVnc(123, 'Debian-12', 64, 'en');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/vnc',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should activate windows', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ windows: { active: true } }),
      });

      await client.activateWindows(123, 'standard', 'en');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/windows',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('IP Management', () => {
    it('should list IPs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ ip: { ip: '1.2.3.4' } }]),
      });

      await client.listIps();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/ip',
        expect.any(Object)
      );
    });

    it('should get IP', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ip: { ip: '1.2.3.4' } }),
      });

      await client.getIp('1.2.3.4');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/ip/1.2.3.4',
        expect.any(Object)
      );
    });

    it('should update IP', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ ip: { traffic_warnings: true } }),
      });

      await client.updateIp('1.2.3.4', true, 100, 1000, 10);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/ip/1.2.3.4',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('traffic_warnings=true'),
        })
      );
    });

    it('should generate IP MAC', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ mac: { mac: 'aa:bb:cc:dd:ee:ff' } }),
      });

      await client.generateIpMac('1.2.3.4');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/ip/1.2.3.4/mac',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should delete IP MAC', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteIpMac('1.2.3.4');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/ip/1.2.3.4/mac',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Subnet Management', () => {
    it('should list subnets', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ subnet: { ip: '10.0.0.0' } }]),
      });

      await client.listSubnets();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/subnet',
        expect.any(Object)
      );
    });

    it('should get subnet', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ subnet: { ip: '10.0.0.0' } }),
      });

      await client.getSubnet('10.0.0.0');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/subnet/10.0.0.0',
        expect.any(Object)
      );
    });

    it('should update subnet', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ subnet: {} }),
      });

      await client.updateSubnet('10.0.0.0', true, 100, 1000, 10);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/subnet/10.0.0.0',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should generate subnet MAC', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ mac: { mac: 'aa:bb:cc:dd:ee:ff' } }),
      });

      await client.generateSubnetMac('10.0.0.0');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/subnet/10.0.0.0/mac',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  describe('Failover', () => {
    it('should list failovers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ failover: { ip: '1.2.3.4' } }]),
      });

      await client.listFailovers();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/failover',
        expect.any(Object)
      );
    });

    it('should switch failover', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ failover: { active_server_ip: '5.6.7.8' } }),
      });

      await client.switchFailover('1.2.3.4', '5.6.7.8');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/failover/1.2.3.4',
        expect.objectContaining({
          method: 'POST',
          body: 'active_server_ip=5.6.7.8',
        })
      );
    });

    it('should delete failover routing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteFailoverRouting('1.2.3.4');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/failover/1.2.3.4',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Reverse DNS', () => {
    it('should list RDNS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ rdns: { ip: '1.2.3.4', ptr: 'host.example.com' } }]),
      });

      await client.listRdns();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/rdns',
        expect.any(Object)
      );
    });

    it('should create RDNS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ rdns: { ptr: 'host.example.com' } }),
      });

      await client.createRdns('1.2.3.4', 'host.example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/rdns/1.2.3.4',
        expect.objectContaining({
          method: 'PUT',
          body: 'ptr=host.example.com',
        })
      );
    });

    it('should update RDNS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ rdns: { ptr: 'new.example.com' } }),
      });

      await client.updateRdns('1.2.3.4', 'new.example.com');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/rdns/1.2.3.4',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('SSH Keys', () => {
    it('should list SSH keys', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ key: { fingerprint: 'ab:cd:ef' } }]),
      });

      await client.listSshKeys();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/key',
        expect.any(Object)
      );
    });

    it('should create SSH key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ key: { fingerprint: 'ab:cd:ef' } }),
      });

      await client.createSshKey('my-key', 'ssh-rsa AAAA...');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/key',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('name=my-key'),
        })
      );
    });

    it('should update SSH key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ key: { name: 'new-name' } }),
      });

      await client.updateSshKey('ab:cd:ef', 'new-name');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/key/ab:cd:ef',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should delete SSH key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteSshKey('ab:cd:ef');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/key/ab:cd:ef',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Firewall', () => {
    it('should get firewall', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ firewall: { status: 'active' } }),
      });

      await client.getFirewall(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/firewall/123',
        expect.any(Object)
      );
    });

    it('should update firewall', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ firewall: { status: 'active' } }),
      });

      await client.updateFirewall(123, 'active');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/firewall/123',
        expect.objectContaining({
          method: 'POST',
          body: 'status=active',
        })
      );
    });

    it('should delete firewall', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteFirewall(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/firewall/123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should list firewall templates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ firewall_template: { id: 1 } }]),
      });

      await client.listFirewallTemplates();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/firewall/template',
        expect.any(Object)
      );
    });

    it('should create firewall template', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ firewall_template: { id: 1 } }),
      });

      await client.createFirewallTemplate('my-template', true, false, true);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/firewall/template',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should delete firewall template', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteFirewallTemplate(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/firewall/template/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('vSwitch', () => {
    it('should list vSwitches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ vswitch: { id: 1 } }]),
      });

      await client.listVSwitches();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/vswitch',
        expect.any(Object)
      );
    });

    it('should create vSwitch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ vswitch: { id: 1 } }),
      });

      await client.createVSwitch('my-vswitch', 4000);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/vswitch',
        expect.objectContaining({
          method: 'POST',
          body: 'name=my-vswitch&vlan=4000',
        })
      );
    });

    it('should update vSwitch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ vswitch: { id: 1 } }),
      });

      await client.updateVSwitch(1, 'new-name', 4001);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/vswitch/1',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should delete vSwitch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteVSwitch(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/vswitch/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should add server to vSwitch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ vswitch: { id: 1 } }),
      });

      await client.addServerToVSwitch(1, 123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/vswitch/1/server',
        expect.objectContaining({
          method: 'POST',
          body: 'server=123',
        })
      );
    });

    it('should remove server from vSwitch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.removeServerFromVSwitch(1, 123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/vswitch/1/server',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Storage Box', () => {
    it('should list storage boxes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ storagebox: { id: 1 } }]),
      });

      await client.listStorageBoxes();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox',
        expect.any(Object)
      );
    });

    it('should update storage box', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ storagebox: { id: 1 } }),
      });

      await client.updateStorageBox(1, 'my-box', true, true, true, true, false);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should reset storage box password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ password: 'new-password' }),
      });

      const result = await client.resetStorageBoxPassword(1);

      expect(result.password).toBe('new-password');
    });

    it('should list snapshots', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ snapshot: { name: 'snap1' } }]),
      });

      await client.listStorageBoxSnapshots(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/snapshot',
        expect.any(Object)
      );
    });

    it('should create snapshot', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ snapshot: { name: 'snap1' } }),
      });

      await client.createStorageBoxSnapshot(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/snapshot',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should delete snapshot', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteStorageBoxSnapshot(1, 'snap1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/snapshot/snap1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should revert snapshot', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.revertStorageBoxSnapshot(1, 'snap1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/snapshot/snap1/revert',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should manage subaccounts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ subaccount: { username: 'sub1' } }),
      });

      await client.createStorageBoxSubaccount(1, '/home/user', true, true, true, true, false, 'comment');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/subaccount',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Traffic', () => {
    it('should get traffic', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ traffic: { data: [] } }),
      });

      await client.getTraffic(['1.2.3.4'], ['10.0.0.0'], '2024-01-01', '2024-01-31', 'month');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/traffic',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('type=month'),
        })
      );
    });
  });

  describe('Wake on LAN', () => {
    it('should get WoL status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ wol: { server_number: 123 } }),
      });

      await client.getWol(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/wol/123',
        expect.any(Object)
      );
    });

    it('should send WoL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ wol: { server_number: 123 } }),
      });

      await client.sendWol(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/wol/123',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Ordering', () => {
    it('should list server products', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ product: { id: 'AX41' } }]),
      });

      await client.listServerProducts();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/order/server/product',
        expect.any(Object)
      );
    });

    it('should list market products', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ product: { id: 1 } }]),
      });

      await client.listServerMarketProducts();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/order/server_market/product',
        expect.any(Object)
      );
    });

    it('should list transactions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ transaction: { id: 'TX-1' } }]),
      });

      await client.listServerTransactions();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/order/server/transaction',
        expect.any(Object)
      );
    });

    it('should order server', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ transaction: { id: 'TX-1' } }),
      });

      await client.orderServer('AX41', ['key1'], 'pass', 'Debian', 64, 'en', 'FSN1', ['addon1'], true);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/order/server/transaction',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should order server market product', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ transaction: { id: 'TX-1' } }),
      });

      await client.orderServerMarket(12345, ['key1'], 'pass', 'Debian', 64, 'en', ['addon1'], true);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/order/server_market/transaction',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Storage Box Snapshot Plan', () => {
    it('should get snapshot plan', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ snapshotplan: { status: 'enabled' } }),
      });

      await client.getStorageBoxSnapshotPlan(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/snapshotplan',
        expect.any(Object)
      );
    });

    it('should update snapshot plan', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ snapshotplan: { status: 'enabled' } }),
      });

      await client.updateStorageBoxSnapshotPlan(1, 'enabled', 0, 3, 1, 15, 10);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/snapshotplan',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Storage Box Subaccounts', () => {
    it('should list subaccounts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ subaccount: { username: 'sub1' } }]),
      });

      await client.listStorageBoxSubaccounts(1);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/subaccount',
        expect.any(Object)
      );
    });

    it('should update subaccount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ subaccount: { username: 'sub1' } }),
      });

      await client.updateStorageBoxSubaccount(1, 'sub1', true, true, true, true, false, 'updated');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/subaccount/sub1',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should delete subaccount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteStorageBoxSubaccount(1, 'sub1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/subaccount/sub1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should reset subaccount password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ password: 'new-pass' }),
      });

      const result = await client.resetStorageBoxSubaccountPassword(1, 'sub1');

      expect(result.password).toBe('new-pass');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/storagebox/1/subaccount/sub1/password',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('Additional Boot Methods', () => {
    it('should get rescue config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ rescue: { active: false } }),
      });

      await client.getRescue(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/rescue',
        expect.any(Object)
      );
    });

    it('should get linux config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ linux: { active: false } }),
      });

      await client.getLinux(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/linux',
        expect.any(Object)
      );
    });

    it('should get last linux config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ linux: { password: 'old-pass' } }),
      });

      await client.getLastLinux(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/linux/last',
        expect.any(Object)
      );
    });

    it('should get vnc config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ vnc: { active: false } }),
      });

      await client.getVnc(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/vnc',
        expect.any(Object)
      );
    });

    it('should deactivate vnc', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ vnc: { active: false } }),
      });

      await client.deactivateVnc(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/vnc',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should get windows config', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ windows: { active: false } }),
      });

      await client.getWindows(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/windows',
        expect.any(Object)
      );
    });

    it('should deactivate windows', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ windows: { active: false } }),
      });

      await client.deactivateWindows(123);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/boot/123/windows',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Additional Firewall Methods', () => {
    it('should update firewall template', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ firewall_template: { id: 1 } }),
      });

      await client.updateFirewallTemplate(1, 'new-name', true, false, false);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/firewall/template/1',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('IP Cancellation', () => {
    it('should get IP MAC', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ mac: { ip: '1.2.3.4', mac: 'aa:bb:cc:dd:ee:ff' } }),
      });

      await client.getIpMac('1.2.3.4');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/ip/1.2.3.4/mac',
        expect.any(Object)
      );
    });

    it('should get subnet MAC', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ mac: { mac: 'aa:bb:cc:dd:ee:ff' } }),
      });

      await client.getSubnetMac('10.0.0.0');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/subnet/10.0.0.0/mac',
        expect.any(Object)
      );
    });

    it('should delete subnet MAC', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteSubnetMac('10.0.0.0');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/subnet/10.0.0.0/mac',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Failover Additional Methods', () => {
    it('should get failover', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ failover: { ip: '1.2.3.4' } }),
      });

      await client.getFailover('1.2.3.4');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/failover/1.2.3.4',
        expect.any(Object)
      );
    });
  });

  describe('RDNS Additional Methods', () => {
    it('should get RDNS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ rdns: { ip: '1.2.3.4', ptr: 'host.com' } }),
      });

      await client.getRdns('1.2.3.4');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/rdns/1.2.3.4',
        expect.any(Object)
      );
    });

    it('should delete RDNS', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.deleteRdns('1.2.3.4');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://robot-ws.your-server.de/rdns/1.2.3.4',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
