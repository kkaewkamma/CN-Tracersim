import { describe, it, expect } from 'vitest';
import { AclEngine } from '../../src/core/engine/acl-engine';
import { NatEngine } from '../../src/core/engine/nat-engine';
import { OspfEngine } from '../../src/core/engine/ospf-engine';
import { DhcpEngine } from '../../src/core/engine/dhcp-engine';
import { AccessControlList } from '../../src/core/types';

describe('Core Engine: ACL, NAT, OSPF & DHCP Protocols', () => {
  // 1. ACL Engine Tests
  describe('ACL Engine', () => {
    it('enforces Top-Down rule execution and Cisco Implicit Deny', () => {
      const acl: AccessControlList = {
        id: 100,
        type: 'extended',
        rules: [
          {
            id: 10,
            action: 'deny',
            protocol: 'icmp',
            src: '192.168.10.50',
            srcWildcard: '0.0.0.0',
            dst: '203.0.113.8',
            dstWildcard: '0.0.0.0',
            hits: 0
          },
          {
            id: 20,
            action: 'permit',
            protocol: 'tcp',
            src: 'any',
            srcWildcard: '255.255.255.255',
            dst: 'any',
            dstWildcard: '255.255.255.255',
            dstPort: 80,
            hits: 0
          }
        ]
      };

      // Matched Rule 10 (Deny ICMP from 192.168.10.50)
      const res1 = AclEngine.evaluatePacket(acl, '192.168.10.50', '203.0.113.8', 'icmp');
      expect(res1.action).toBe('deny');
      expect(res1.matchedRuleIndex).toBe(0);

      // Matched Rule 20 (Permit TCP Port 80)
      const res2 = AclEngine.evaluatePacket(acl, '192.168.10.50', '203.0.113.8', 'tcp', 80);
      expect(res2.action).toBe('permit');
      expect(res2.matchedRuleIndex).toBe(1);

      // Unmatched packet -> Must hit Implicit Deny Any
      const res3 = AclEngine.evaluatePacket(acl, '192.168.10.99', '203.0.113.8', 'icmp');
      expect(res3.action).toBe('deny');
      expect(res3.implicitDeny).toBe(true);
    });
  });

  // 2. NAT Engine Tests
  describe('NAT Engine', () => {
    it('translates Inside Local to Inside Global and maintains stateful return path', () => {
      const router: any = {
        name: 'R1-NAT',
        natEnabled: true,
        natRule: { aclId: 1, outInterface: 'Gig0/1', overload: true },
        acls: [{ id: 1, type: 'standard', rules: [{ id: 10, action: 'permit', protocol: 'ip', src: '192.168.10.0', srcWildcard: '0.0.0.255', dst: 'any', dstWildcard: '255.255.255.255', hits: 0 }] }],
        ports: {
          'Gig0/0': { ip: '192.168.10.1', mask: '255.255.255.0', up: true, nat: 'inside' },
          'Gig0/1': { ip: '203.0.113.1', mask: '255.255.255.0', up: true, nat: 'outside' }
        },
        natTranslations: []
      };

      const out = NatEngine.processOutboundTranslation(router, 'Gig0/0', 'Gig0/1', '192.168.10.25', 50000, 'tcp');
      expect(out.translated).toBe(true);
      expect(out.translatedIp).toBe('203.0.113.1');
      expect(out.translatedPort).toBe(50000);

      // Reverse NAT on Return Path
      const ret = NatEngine.processInboundReverseTranslation(router, 'Gig0/1', 'Gig0/0', '203.0.113.1', 50000, 'tcp');
      expect(ret.unTranslated).toBe(true);
      expect(ret.originalIp).toBe('192.168.10.25');
      expect(ret.originalPort).toBe(50000);
    });
  });

  // 3. OSPF Engine Tests
  describe('OSPF Engine', () => {
    it('discovers neighbors only when Area ID matches exactly', () => {
      const r1: any = {
        id: 'r1',
        name: 'R1',
        type: 'router',
        ospf: { processId: 1, networks: [{ network: '10.0.0.0', wildcard: '0.0.0.3', areaId: 0 }] },
        ports: { 'Gig0/0': { ip: '10.0.0.1', mask: '255.255.255.252', up: true } }
      };

      const r2Matching: any = {
        id: 'r2',
        name: 'R2',
        type: 'router',
        ospf: { processId: 1, networks: [{ network: '10.0.0.0', wildcard: '0.0.0.3', areaId: 0 }] },
        ports: { 'Gig0/0': { ip: '10.0.0.2', mask: '255.255.255.252', up: true } }
      };

      const cable = [{ id: 'c1', from: 'r1', fromPort: 'Gig0/0', to: 'r2', toPort: 'Gig0/0' }];

      const neighbors = OspfEngine.getOspfNeighbors(r1, [r1, r2Matching], cable);
      expect(neighbors.length).toBe(1);
      expect(neighbors[0].state).toBe('FULL/DR');

      // Area Mismatch (Area 0 vs Area 1) -> No Neighbor!
      r2Matching.ospf.networks[0].areaId = 1;
      const mismatched = OspfEngine.getOspfNeighbors(r1, [r1, r2Matching], cable);
      expect(mismatched.length).toBe(0);
    });
  });

  // 4. DHCP Engine Tests
  describe('DHCP Engine', () => {
    it('assigns unique IP skipping excluded addresses via full DORA', () => {
      const rDhcp: any = {
        id: 'r1',
        name: 'R1-DHCP',
        type: 'router',
        ports: { 'Gig0/0': { ip: '192.168.10.1', mask: '255.255.255.0', up: true } },
        dhcpExcluded: [{ low: '192.168.10.1', high: '192.168.10.9' }],
        dhcpPools: [{ name: 'LAN_POOL', network: '192.168.10.0', mask: '255.255.255.0', defaultRouter: '192.168.10.1', dnsServer: '8.8.8.8' }]
      };

      const pc1: any = { id: 'pc1', name: 'PC1', type: 'pc', ports: { 'Eth0': { ip: '', mask: '', up: true } } };
      const pc2: any = { id: 'pc2', name: 'PC2', type: 'pc', ports: { 'Eth0': { ip: '', mask: '', up: true } } };

      const cables = [
        { id: 'c1', from: 'r1', fromPort: 'Gig0/0', to: 'pc1', toPort: 'Eth0' },
        { id: 'c2', from: 'r1', fromPort: 'Gig0/0', to: 'pc2', toPort: 'Eth0' }
      ];

      const lease1 = DhcpEngine.requestDhcpLease(pc1, [rDhcp, pc1, pc2], cables);
      expect(lease1.success).toBe(true);
      expect(lease1.ip).toBe('192.168.10.10'); // Skipped excluded .1 - .9
      expect(lease1.doraSteps.length).toBe(4);

      const lease2 = DhcpEngine.requestDhcpLease(pc2, [rDhcp, pc1, pc2], cables);
      expect(lease2.success).toBe(true);
      expect(lease2.ip).toBe('192.168.10.11');
      expect(lease1.ip).not.toBe(lease2.ip); // No duplicate IP
    });
  });
});

