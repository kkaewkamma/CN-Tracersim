/**
 * NetSim Touch v5.1 - Automated Core Network Engine & Cisco IOS CLI Verification Suite
 * Tests all 16 Mandatory Specification Requirements:
 *  1. ACL Permit, Explicit Deny & Implicit Deny
 *  2. ACL Rule Order (Top-Down First-Match)
 *  3. Wildcard Mask Matching
 *  4. NAT when Packet Traverses NAT Router (Inside -> Outside + ACL Check)
 *  5. NAT when NAT Router Exists in Topology but Packet Does Not Traverse It
 *  6. Return Path Failure when Destination Lacks Route Back
 *  7. PAT Port Mapping & Stateful Session Tracking
 *  8. OSPF Area Mismatch (No Neighbor / No Route)
 *  9. OSPF Neighbor & Route Removal when Interface is Down
 * 10. Static Route (AD=1) & Dynamic OSPF Route (AD=110 + Cost Metric)
 * 11. VLAN Isolation (L2 Access VLAN 10 vs VLAN 20)
 * 12. 802.1Q Trunking, Native VLAN & Router-on-a-Stick (ROAS)
 * 13. DHCP DORA 4-Step Process, Excluded Addresses & No Duplicate IPs
 * 14. DHCP Pool Exhaustion when Subnet/Pool is Full
 * 15. Save/Load Topology JSON & Auto-Grader Verification
 * 16. Service Worker (sw.js) & Offline Asset Cache Integrity
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

global.window = global;
require('../js/network-engine.js');
require('../js/cisco-cli.js');

const NetworkEngine = global.NetworkEngine;
const CiscoCLI = global.CiscoCLI;

let passed = 0;
let failed = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}\n     Reason: ${err.message}`);
        failed++;
    }
}

function makeDevice(id, type, name, ports = {}, extra = {}) {
    return Object.assign({
        id,
        type,
        name,
        ports,
        gateway: '',
        routes: [],
        acls: [],
        staticNat: [],
        natTranslations: [],
        vlans: { 1: 'default' },
        ospf: { processId: null, networks: [] },
        dhcpPools: [],
        dhcpExcluded: [],
        dhcpBindings: [],
        arpCache: {},
        macTable: [],
        cliMode: 'privileged',
        cliHistory: ''
    }, extra);
}

console.log('======================================================================');
console.log('🧪 Running NetSim Touch v5.1 Core Engine & CLI Verification Tests');
console.log('======================================================================\n');

// ---------------------------------------------------------------------------
// 1. ACL Deny & Strict Cisco IOS Implicit Deny
// ---------------------------------------------------------------------------
runTest('1. ACL Permit, Explicit Deny & Strict Implicit Deny', () => {
    const r1 = makeDevice('r1', 'router', 'R1', {
        'Gig0/0': { ip: '192.168.1.1', mask: '255.255.255.0', up: true },
        'Gig0/1': { ip: '10.0.0.1', mask: '255.255.255.0', up: true }
    });
    const pc1 = makeDevice('pc1', 'pc', 'PC1', {
        'Eth0': { ip: '192.168.1.10', mask: '255.255.255.0', up: true }
    }, { gateway: '192.168.1.1' });
    const srv1 = makeDevice('srv1', 'server', 'SRV1', {
        'Eth0': { ip: '10.0.0.100', mask: '255.255.255.0', up: true }
    }, { gateway: '10.0.0.1' });
    const cables = [
        { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'r1', toPort: 'Gig0/0' },
        { id: 'c2', from: 'r1', fromPort: 'Gig0/1', to: 'srv1', toPort: 'Eth0' }
    ];
    const devices = [r1, pc1, srv1];

    const cli = new CiscoCLI(r1);
    cli.execute('configure terminal');
    // Only permit TCP to 10.0.0.100; do NOT add an explicit deny for ICMP
    cli.execute('access-list 100 permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.100 eq 80');
    cli.execute('interface Gig0/0');
    cli.execute('ip access-group 100 in');
    cli.execute('end');

    // TCP HTTP (Port 80) must be PERMITTED
    const httpSim = NetworkEngine.simulateHttp(pc1, srv1, devices, cables);
    assert.strictEqual(httpSim.success, true, 'TCP HTTP matching permit rule should succeed');

    // ICMP Ping does not match Rule 1 -> MUST be blocked by Implicit Deny!
    const pingSim = NetworkEngine.simulatePing(pc1, srv1, devices, cables);
    assert.strictEqual(pingSim.success, false, 'ICMP not matching any rule must be blocked by Implicit Deny');
    assert.strictEqual(pingSim.aclBlocked, true, 'aclBlocked flag must be true on Implicit Deny');
    assert.ok(pingSim.reason.includes('Implicit Deny'), 'Reason should mention Implicit Deny');
});

// ---------------------------------------------------------------------------
// 2. ACL Rule Order (Top-Down Evaluation)
// ---------------------------------------------------------------------------
runTest('2. ACL Rule Order (Top-Down First-Match Execution)', () => {
    const r1 = makeDevice('r1', 'router', 'R1', {
        'Gig0/0': { ip: '192.168.1.1', mask: '255.255.255.0', up: true },
        'Gig0/1': { ip: '10.0.0.1', mask: '255.255.255.0', up: true }
    });
    const pc1 = makeDevice('pc1', 'pc', 'PC1', {
        'Eth0': { ip: '192.168.1.10', mask: '255.255.255.0', up: true }
    }, { gateway: '192.168.1.1' });
    const pc2 = makeDevice('pc2', 'pc', 'PC2', {
        'Eth0': { ip: '192.168.1.20', mask: '255.255.255.0', up: true }
    }, { gateway: '192.168.1.1' });
    const srv1 = makeDevice('srv1', 'server', 'SRV1', {
        'Eth0': { ip: '10.0.0.100', mask: '255.255.255.0', up: true }
    }, { gateway: '10.0.0.1' });
    const sw1 = makeDevice('sw1', 'switch', 'SW1', {
        'Fa0/1': { up: true, vlan: 1, mode: 'access' },
        'Fa0/2': { up: true, vlan: 1, mode: 'access' },
        'Fa0/3': { up: true, vlan: 1, mode: 'access' }
    });
    const cables = [
        { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/1' },
        { id: 'c2', from: 'pc2', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/2' },
        { id: 'c3', from: 'sw1', fromPort: 'Fa0/3', to: 'r1', toPort: 'Gig0/0' },
        { id: 'c4', from: 'r1', fromPort: 'Gig0/1', to: 'srv1', toPort: 'Eth0' }
    ];
    const devices = [r1, sw1, pc1, pc2, srv1];

    const cli = new CiscoCLI(r1);
    cli.execute('configure terminal');
    // Rule 10: deny host 192.168.1.10
    cli.execute('access-list 10 deny host 192.168.1.10');
    // Rule 20: permit 192.168.1.0 0.0.0.255
    cli.execute('access-list 10 permit 192.168.1.0 0.0.0.255');
    cli.execute('interface Gig0/0');
    cli.execute('ip access-group 10 in');
    cli.execute('end');

    // PC1 (192.168.1.10) hits Rule 10 first -> DENIED
    const resPc1 = NetworkEngine.simulatePing(pc1, srv1, devices, cables);
    assert.strictEqual(resPc1.success, false, 'PC1 (192.168.1.10) should hit top deny rule first');

    // PC2 (192.168.1.20) skips Rule 10 and hits Rule 20 -> PERMITTED
    const resPc2 = NetworkEngine.simulatePing(pc2, srv1, devices, cables);
    assert.strictEqual(resPc2.success, true, 'PC2 (192.168.1.20) should match second permit rule');
});

// ---------------------------------------------------------------------------
// 3. Wildcard Mask Matching
// ---------------------------------------------------------------------------
runTest('3. Wildcard Mask Matching (0.0.0.0, 0.0.0.15, 0.0.0.255, 255.255.255.255)', () => {
    assert.strictEqual(NetworkEngine.matchesWildcard('192.168.10.5', '192.168.10.5', '0.0.0.0'), true);
    assert.strictEqual(NetworkEngine.matchesWildcard('192.168.10.6', '192.168.10.5', '0.0.0.0'), false);
    assert.strictEqual(NetworkEngine.matchesWildcard('192.168.10.14', '192.168.10.0', '0.0.0.15'), true);
    assert.strictEqual(NetworkEngine.matchesWildcard('192.168.10.16', '192.168.10.0', '0.0.0.15'), false);
    assert.strictEqual(NetworkEngine.matchesWildcard('192.168.10.250', '192.168.10.0', '0.0.0.255'), true);
    assert.strictEqual(NetworkEngine.matchesWildcard('192.168.11.1', '192.168.10.0', '0.0.0.255'), false);
    assert.strictEqual(NetworkEngine.matchesWildcard('8.8.8.8', 'any', '0.0.0.0'), true);
});

// ---------------------------------------------------------------------------
// 4. NAT when Packet Traverses NAT Router (Inside -> Outside + ACL Verification)
// ---------------------------------------------------------------------------
runTest('4. NAT Translation when Packet Traverses NAT Router (Inside -> Outside)', () => {
    const rNat = makeDevice('r1', 'router', 'R-NAT', {
        'Gig0/0': { ip: '192.168.10.1', mask: '255.255.255.0', up: true },
        'Gig0/1': { ip: '203.0.113.1', mask: '255.255.255.0', up: true }
    });
    const pcIn = makeDevice('pc1', 'pc', 'PC-Inside', {
        'Eth0': { ip: '192.168.10.50', mask: '255.255.255.0', up: true }
    }, { gateway: '192.168.10.1' });
    const ispSrv = makeDevice('isp', 'server', 'ISP-Server', {
        'Eth0': { ip: '203.0.113.8', mask: '255.255.255.0', up: true }
    }, { gateway: '203.0.113.1' });
    const cables = [
        { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'r1', toPort: 'Gig0/0' },
        { id: 'c2', from: 'r1', fromPort: 'Gig0/1', to: 'isp', toPort: 'Eth0' }
    ];
    const devices = [rNat, pcIn, ispSrv];

    const cli = new CiscoCLI(rNat);
    cli.execute('configure terminal');
    cli.execute('access-list 1 permit 192.168.10.0 0.0.0.255');
    cli.execute('ip nat inside source list 1 interface Gig0/1 overload');
    cli.execute('interface Gig0/0');
    cli.execute('ip nat inside');
    cli.execute('interface Gig0/1');
    cli.execute('ip nat outside');
    cli.execute('end');

    const sim = NetworkEngine.simulateHttp(pcIn, ispSrv, devices, cables);
    assert.strictEqual(sim.success, true, 'Packet traversing NAT router should succeed');
    assert.strictEqual(sim.natTranslated, true, 'Packet must be marked natTranslated = true');
    assert.strictEqual(sim.translatedSrcIp, '203.0.113.1', 'Inside Local 192.168.10.50 must translate to Inside Global 203.0.113.1');
    assert.ok(rNat.natTranslations.length >= 1, 'NAT Translation Table must record the active session');
});

// ---------------------------------------------------------------------------
// 5. NAT Non-Interference when NAT Router Exists in Topology but Packet Takes Another Path
// ---------------------------------------------------------------------------
runTest('5. NAT Non-Interference when NAT Router is in Topology but Not on Packet Path', () => {
    // R-NAT exists in topology, but PC1 -> R-Internal -> SRV1 does not pass through R-NAT
    const rNat = makeDevice('rnat', 'router', 'R-NAT', {
        'Gig0/0': { ip: '172.16.0.1', mask: '255.255.255.0', up: true, nat: 'inside' },
        'Gig0/1': { ip: '203.0.113.1', mask: '255.255.255.0', up: true, nat: 'outside' }
    }, { natEnabled: true });

    const rInt = makeDevice('rint', 'router', 'R-Internal', {
        'Gig0/0': { ip: '192.168.1.1', mask: '255.255.255.0', up: true },
        'Gig0/1': { ip: '192.168.2.1', mask: '255.255.255.0', up: true }
    });
    const pc1 = makeDevice('pc1', 'pc', 'PC1', {
        'Eth0': { ip: '192.168.1.10', mask: '255.255.255.0', up: true }
    }, { gateway: '192.168.1.1' });
    // SRV1 has NO gateway back to 192.168.1.0/24!
    const srv1 = makeDevice('srv1', 'server', 'SRV1', {
        'Eth0': { ip: '192.168.2.100', mask: '255.255.255.0', up: true }
    }, { gateway: '' });

    const cables = [
        { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'rint', toPort: 'Gig0/0' },
        { id: 'c2', from: 'rint', fromPort: 'Gig0/1', to: 'srv1', toPort: 'Eth0' }
    ];
    const devices = [rNat, rInt, pc1, srv1];

    const sim = NetworkEngine.simulatePing(pc1, srv1, devices, cables);
    assert.strictEqual(sim.natTranslated, false, 'Packet not traversing R-NAT must NOT be NAT translated');
    assert.strictEqual(sim.success, false, 'Return path check must NOT be skipped just because R-NAT exists in topology');
});

// ---------------------------------------------------------------------------
// 6. Return Path Failure when Destination Has No Route Back
// ---------------------------------------------------------------------------
runTest('6. Return Path Verification Fails when Destination Router Lacks Return Route', () => {
    const r1 = makeDevice('r1', 'router', 'R1', {
        'Gig0/0': { ip: '192.168.10.1', mask: '255.255.255.0', up: true },
        'Gig0/1': { ip: '10.0.0.1', mask: '255.255.255.252', up: true }
    }, {
        routes: [{ network: '192.168.20.0', mask: '255.255.255.0', nextHop: '10.0.0.2' }]
    });
    // R2 has NO route back to 192.168.10.0/24!
    const r2 = makeDevice('r2', 'router', 'R2', {
        'Gig0/0': { ip: '192.168.20.1', mask: '255.255.255.0', up: true },
        'Gig0/1': { ip: '10.0.0.2', mask: '255.255.255.252', up: true }
    }, { routes: [] });
    const pc1 = makeDevice('pc1', 'pc', 'PC1', {
        'Eth0': { ip: '192.168.10.10', mask: '255.255.255.0', up: true }
    }, { gateway: '192.168.10.1' });
    const srv1 = makeDevice('srv1', 'server', 'SRV1', {
        'Eth0': { ip: '192.168.20.100', mask: '255.255.255.0', up: true }
    }, { gateway: '192.168.20.1' });

    const cables = [
        { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'r1', toPort: 'Gig0/0' },
        { id: 'c2', from: 'r1', fromPort: 'Gig0/1', to: 'r2', toPort: 'Gig0/1' },
        { id: 'c3', from: 'r2', fromPort: 'Gig0/0', to: 'srv1', toPort: 'Eth0' }
    ];
    const devices = [r1, r2, pc1, srv1];

    const simFail = NetworkEngine.simulatePing(pc1, srv1, devices, cables);
    assert.strictEqual(simFail.success, false, 'Ping must fail when R2 lacks return route to 192.168.10.0/24');
    assert.ok(simFail.reason.includes('ขากลับ'), 'Failure reason must indicate return path routing failure');

    // Now add return route on R2 -> Ping must succeed
    r2.routes.push({ network: '192.168.10.0', mask: '255.255.255.0', nextHop: '10.0.0.1' });
    const simOk = NetworkEngine.simulatePing(pc1, srv1, devices, cables);
    assert.strictEqual(simOk.success, true, 'Ping must succeed once R2 has return route');
});

// ---------------------------------------------------------------------------
// 7. PAT Port Mapping (Unique Port Allocation & Session Tracking)
// ---------------------------------------------------------------------------
runTest('7. PAT Port Mapping & Unique Port Allocation per Host/Session', () => {
    const rNat = makeDevice('r1', 'router', 'R-NAT', {
        'Gig0/0': { ip: '192.168.10.1', mask: '255.255.255.0', up: true, nat: 'inside' },
        'Gig0/1': { ip: '203.0.113.1', mask: '255.255.255.0', up: true, nat: 'outside' }
    }, {
        natEnabled: true,
        natRule: { aclId: 1, outInterface: 'Gig0/1', overload: true },
        acls: [{ id: 1, action: 'permit', protocol: 'ip', src: '192.168.10.0', srcWildcard: '0.0.0.255', dst: 'any', dstWildcard: '255.255.255.255' }]
    });

    const nat1 = NetworkEngine.applyRouterNat(rNat, 'Gig0/0', 'Gig0/1', '192.168.10.10', '203.0.113.8', 'tcp', 51001, 80);
    const nat2 = NetworkEngine.applyRouterNat(rNat, 'Gig0/0', 'Gig0/1', '192.168.10.20', '203.0.113.8', 'tcp', 51001, 80);

    assert.strictEqual(nat1.translated, true);
    assert.strictEqual(nat2.translated, true);
    assert.notStrictEqual(nat1.translatedPort, nat2.translatedPort, 'Two different hosts using same source port must get distinct PAT public ports');

    // Verify Reverse NAT translates back to exact inside local IP
    const rev1 = NetworkEngine.reverseRouterNat(rNat, 'Gig0/1', '203.0.113.8', '203.0.113.1', 'tcp', 80, nat1.translatedPort);
    const rev2 = NetworkEngine.reverseRouterNat(rNat, 'Gig0/1', '203.0.113.8', '203.0.113.1', 'tcp', 80, nat2.translatedPort);
    assert.strictEqual(rev1.originalSrcIp, '192.168.10.10');
    assert.strictEqual(rev2.originalSrcIp, '192.168.10.20');
});

// ---------------------------------------------------------------------------
// 8. OSPF Area Mismatch
// ---------------------------------------------------------------------------
runTest('8. OSPF Area Mismatch Prevents Neighbor Adjacency & Route Learning', () => {
    const r1 = makeDevice('r1', 'router', 'R1', {
        'Gig0/0': { ip: '192.168.10.1', mask: '255.255.255.0', up: true },
        'Gig0/1': { ip: '10.0.0.1', mask: '255.255.255.252', up: true }
    }, {
        ospf: {
            processId: 1,
            networks: [
                { network: '192.168.10.0', wildcard: '0.0.0.255', area: 0 },
                { network: '10.0.0.0', wildcard: '0.0.0.3', area: 0 } // Area 0
            ]
        }
    });
    const r2 = makeDevice('r2', 'router', 'R2', {
        'Gig0/0': { ip: '172.16.1.1', mask: '255.255.255.0', up: true },
        'Gig0/1': { ip: '10.0.0.2', mask: '255.255.255.252', up: true }
    }, {
        ospf: {
            processId: 1,
            networks: [
                { network: '172.16.1.0', wildcard: '0.0.0.255', area: 1 },
                { network: '10.0.0.0', wildcard: '0.0.0.3', area: 1 } // Area 1 (MISMATCH!)
            ]
        }
    });
    const cables = [{ id: 'c1', from: 'r1', fromPort: 'Gig0/1', to: 'r2', toPort: 'Gig0/1' }];
    const devices = [r1, r2];

    const neigsMismatch = NetworkEngine.getOspfNeighbors(r1, devices, cables);
    assert.strictEqual(neigsMismatch.length, 0, 'OSPF neighbors must NOT form when Area IDs do not match (Area 0 vs Area 1)');
    const routesMismatch = NetworkEngine.computeOspfRoutes(r1, devices, cables);
    assert.strictEqual(routesMismatch.length, 0, 'OSPF routes must NOT be learned across mismatched Area link');

    // Fix Area on R2 to Area 0 -> Neighbor & route must appear
    r2.ospf.networks[1].area = 0;
    const neigsFixed = NetworkEngine.getOspfNeighbors(r1, devices, cables);
    assert.strictEqual(neigsFixed.length, 1, 'OSPF neighbor must form once both interfaces are in Area 0');
    const routesFixed = NetworkEngine.computeOspfRoutes(r1, devices, cables);
    assert.strictEqual(routesFixed.length, 1, 'OSPF route to 172.16.1.0/24 must be learned once adjacency forms');
});

// ---------------------------------------------------------------------------
// 9. OSPF Neighbor & Route Removal when Interface is Down
// ---------------------------------------------------------------------------
runTest('9. OSPF Neighbor & Learned Routes Drop Immediately when Interface is Shutdown', () => {
    const r1 = makeDevice('r1', 'router', 'R1', {
        'Gig0/0': { ip: '192.168.10.1', mask: '255.255.255.0', up: true },
        'Gig0/1': { ip: '10.0.0.1', mask: '255.255.255.252', up: true }
    }, {
        ospf: {
            processId: 1,
            networks: [
                { network: '192.168.10.0', wildcard: '0.0.0.255', area: 0 },
                { network: '10.0.0.0', wildcard: '0.0.0.3', area: 0 }
            ]
        }
    });
    const r2 = makeDevice('r2', 'router', 'R2', {
        'Gig0/0': { ip: '172.16.1.1', mask: '255.255.255.0', up: true },
        'Gig0/1': { ip: '10.0.0.2', mask: '255.255.255.252', up: true }
    }, {
        ospf: {
            processId: 1,
            networks: [
                { network: '172.16.1.0', wildcard: '0.0.0.255', area: 0 },
                { network: '10.0.0.0', wildcard: '0.0.0.3', area: 0 }
            ]
        }
    });
    const cables = [{ id: 'c1', from: 'r1', fromPort: 'Gig0/1', to: 'r2', toPort: 'Gig0/1' }];
    const devices = [r1, r2];

    assert.strictEqual(NetworkEngine.getOspfNeighbors(r1, devices, cables).length, 1);

    // Shutdown R2 Gig0/1 via CLI
    const cliR2 = new CiscoCLI(r2);
    cliR2.execute('configure terminal');
    cliR2.execute('interface Gig0/1');
    cliR2.execute('shutdown');
    cliR2.execute('end');

    assert.strictEqual(NetworkEngine.getOspfNeighbors(r1, devices, cables).length, 0, 'OSPF neighbor must drop when peer interface is shutdown');
    assert.strictEqual(NetworkEngine.computeOspfRoutes(r1, devices, cables).length, 0, 'OSPF route must be removed when neighbor interface is down');
});

// ---------------------------------------------------------------------------
// 10. Static Route (AD=1) & Dynamic OSPF Route (AD=110 + Interface Cost Metric)
// ---------------------------------------------------------------------------
runTest('10. Static Route (AD=1) vs OSPF Dynamic Route (AD=110) & Interface Cost Metric', () => {
    const r1 = makeDevice('r1', 'router', 'R1', {
        'Gig0/0': { ip: '10.0.0.1', mask: '255.255.255.252', up: true, ospfCost: 25 }
    }, {
        ospf: { processId: 1, networks: [{ network: '10.0.0.0', wildcard: '0.0.0.3', area: 0 }] }
    });
    const r2 = makeDevice('r2', 'router', 'R2', {
        'Gig0/0': { ip: '10.0.0.2', mask: '255.255.255.252', up: true },
        'Fa0/1': { ip: '172.16.50.1', mask: '255.255.255.0', up: true } // FastEthernet cost = 10
    }, {
        ospf: {
            processId: 1,
            networks: [
                { network: '10.0.0.0', wildcard: '0.0.0.3', area: 0 },
                { network: '172.16.50.0', wildcard: '0.0.0.255', area: 0 }
            ]
        }
    });
    const cables = [{ id: 'c1', from: 'r1', fromPort: 'Gig0/0', to: 'r2', toPort: 'Gig0/0' }];
    const devices = [r1, r2];

    const ospfRoutes = NetworkEngine.computeOspfRoutes(r1, devices, cables);
    assert.strictEqual(ospfRoutes.length, 1);
    assert.strictEqual(ospfRoutes[0].network, '172.16.50.0');
    // Cost = R1 Gig0/0 custom ospfCost (25) + R2 Fa0/1 FastEthernet cost (10) = 35
    assert.strictEqual(ospfRoutes[0].metric, 35, 'OSPF metric should sum egress interface cost (25) + destination interface cost (10) = 35');

    // Lookup route via OSPF
    const routeDynamic = NetworkEngine.lookupRoute(r1, '172.16.50.99', devices, cables);
    assert.strictEqual(routeDynamic.type, 'ospf');
    assert.strictEqual(routeDynamic.ad, 110);

    // Add Static Route -> Static Route (AD=1) takes precedence over OSPF (AD=110)
    r1.routes.push({ network: '172.16.50.0', mask: '255.255.255.0', nextHop: '10.0.0.2' });
    const routeStatic = NetworkEngine.lookupRoute(r1, '172.16.50.99', devices, cables);
    assert.strictEqual(routeStatic.type, 'static', 'Static route (AD=1) must be preferred over OSPF (AD=110)');
});

// ---------------------------------------------------------------------------
// 11. VLAN Isolation (Access Port VLAN 10 vs VLAN 20)
// ---------------------------------------------------------------------------
runTest('11. Layer 2 VLAN Isolation Blocks Traffic Between Different VLANs Without Router', () => {
    const sw1 = makeDevice('sw1', 'switch', 'SW1', {
        'Fa0/1': { up: true, vlan: 10, mode: 'access' },
        'Fa0/2': { up: true, vlan: 20, mode: 'access' },
        'Fa0/3': { up: true, vlan: 10, mode: 'access' }
    });
    const pc1 = makeDevice('pc1', 'pc', 'PC-VLAN10-A', {
        'Eth0': { ip: '192.168.10.10', mask: '255.255.255.0', up: true }
    });
    const pc2 = makeDevice('pc2', 'pc', 'PC-VLAN20', {
        'Eth0': { ip: '192.168.10.20', mask: '255.255.255.0', up: true }
    });
    const pc3 = makeDevice('pc3', 'pc', 'PC-VLAN10-B', {
        'Eth0': { ip: '192.168.10.30', mask: '255.255.255.0', up: true }
    });
    const cables = [
        { id: 'c1', from: 'pc1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/1' },
        { id: 'c2', from: 'pc2', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/2' },
        { id: 'c3', from: 'pc3', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/3' }
    ];
    const devices = [sw1, pc1, pc2, pc3];

    // Same subnet IP, but different Switch Access VLANs (10 vs 20) -> MUST FAIL
    const crossVlan = NetworkEngine.simulatePing(pc1, pc2, devices, cables);
    assert.strictEqual(crossVlan.success, false, 'VLAN 10 and VLAN 20 must be isolated at Layer 2');

    // Same VLAN 10 (PC1 -> PC3) -> MUST SUCCEED and Switch must learn MAC addresses
    const sameVlan = NetworkEngine.simulatePing(pc1, pc3, devices, cables);
    assert.strictEqual(sameVlan.success, true, 'Hosts in same VLAN 10 must communicate');
    assert.ok(sw1.macTable.length >= 1, 'Switch must dynamically learn source MAC address in CAM table');
});

// ---------------------------------------------------------------------------
// 12. 802.1Q Trunking & Router-on-a-Stick (Inter-VLAN Routing)
// ---------------------------------------------------------------------------
runTest('12. 802.1Q Trunking & Router-on-a-Stick (ROAS) Inter-VLAN Routing', () => {
    const r1 = makeDevice('r1', 'router', 'R1-ROAS', {
        'Gig0/0': { ip: '', mask: '255.255.255.0', up: true },
        'Gig0/0.10': { ip: '192.168.10.1', mask: '255.255.255.0', up: true, vlan: 10, isSubIf: true, parentPort: 'Gig0/0' },
        'Gig0/0.20': { ip: '192.168.20.1', mask: '255.255.255.0', up: true, vlan: 20, isSubIf: true, parentPort: 'Gig0/0' }
    });
    const sw1 = makeDevice('sw1', 'switch', 'SW1', {
        'Fa0/1': { up: true, vlan: 1, mode: 'trunk' },
        'Fa0/2': { up: true, vlan: 10, mode: 'access' },
        'Fa0/3': { up: true, vlan: 20, mode: 'access' }
    });
    const pc10 = makeDevice('pc10', 'pc', 'PC-VLAN10', {
        'Eth0': { ip: '192.168.10.10', mask: '255.255.255.0', up: true }
    }, { gateway: '192.168.10.1' });
    const pc20 = makeDevice('pc20', 'pc', 'PC-VLAN20', {
        'Eth0': { ip: '192.168.20.20', mask: '255.255.255.0', up: true }
    }, { gateway: '192.168.20.1' });

    const cables = [
        { id: 'c1', from: 'r1', fromPort: 'Gig0/0', to: 'sw1', toPort: 'Fa0/1' },
        { id: 'c2', from: 'sw1', fromPort: 'Fa0/2', to: 'pc10', toPort: 'Eth0' },
        { id: 'c3', from: 'sw1', fromPort: 'Fa0/3', to: 'pc20', toPort: 'Eth0' }
    ];
    const devices = [r1, sw1, pc10, pc20];

    // With Fa0/1 as Trunk -> Inter-VLAN Ping succeeds with 802.1Q tagging
    const simTrunk = NetworkEngine.simulatePing(pc10, pc20, devices, cables);
    assert.strictEqual(simTrunk.success, true, 'Inter-VLAN routing via 802.1Q Trunk + Sub-interfaces must succeed');
    assert.ok(simTrunk.osiSteps.some(s => s.tagged === true), 'OSI steps must record 802.1Q VLAN tagging on trunk link');

    // Change Fa0/1 to Access VLAN 1 -> 802.1Q sub-interfaces cannot be reached!
    sw1.ports['Fa0/1'].mode = 'access';
    const simNoTrunk = NetworkEngine.simulatePing(pc10, pc20, devices, cables);
    assert.strictEqual(simNoTrunk.success, false, 'ROAS must fail if switch uplink port is not configured as Trunk');
});

// ---------------------------------------------------------------------------
// 13. DHCP DORA Process, Excluded Addresses & No Duplicate IP Allocation
// ---------------------------------------------------------------------------
runTest('13. DHCP DORA 4-Step Process, Excluded Addresses & Duplicate IP Prevention', () => {
    const rDhcp = makeDevice('r1', 'router', 'R-DHCP', {
        'Gig0/0': { ip: '192.168.10.1', mask: '255.255.255.0', up: true }
    });
    const sw1 = makeDevice('sw1', 'switch', 'SW1', {
        'Fa0/1': { up: true, vlan: 1, mode: 'access' },
        'Fa0/2': { up: true, vlan: 1, mode: 'access' },
        'Fa0/3': { up: true, vlan: 1, mode: 'access' }
    });
    const pc1 = makeDevice('pc1', 'pc', 'PC1', { 'Eth0': { ip: '', mask: '255.255.255.0', up: true } });
    const pc2 = makeDevice('pc2', 'pc', 'PC2', { 'Eth0': { ip: '', mask: '255.255.255.0', up: true } });
    const cables = [
        { id: 'c1', from: 'r1', fromPort: 'Gig0/0', to: 'sw1', toPort: 'Fa0/1' },
        { id: 'c2', from: 'sw1', fromPort: 'Fa0/2', to: 'pc1', toPort: 'Eth0' },
        { id: 'c3', from: 'sw1', fromPort: 'Fa0/3', to: 'pc2', toPort: 'Eth0' }
    ];
    const devices = [rDhcp, sw1, pc1, pc2];

    // Configure DHCP Pool and Excluded Addresses (.1 to .15) via Cisco CLI
    const cli = new CiscoCLI(rDhcp);
    cli.execute('configure terminal');
    cli.execute('ip dhcp excluded-address 192.168.10.1 192.168.10.15');
    cli.execute('ip dhcp pool LAN_POOL');
    cli.execute('network 192.168.10.0 255.255.255.0');
    cli.execute('default-router 192.168.10.1');
    cli.execute('dns-server 8.8.8.8');
    cli.execute('end');

    const lease1 = NetworkEngine.requestDhcpLease(pc1, devices, cables);
    const lease2 = NetworkEngine.requestDhcpLease(pc2, devices, cables);

    assert.strictEqual(lease1.success, true);
    assert.strictEqual(lease2.success, true);
    assert.strictEqual(lease1.doraSteps.length, 4, 'DHCP must simulate all 4 DORA steps (Discover, Offer, Request, ACK)');
    assert.strictEqual(lease1.ip, '192.168.10.16', 'First leased IP must skip excluded range .1-.15 and assign .16');
    assert.strictEqual(lease2.ip, '192.168.10.17', 'Second client must receive next unique IP (.17) without duplicates');
    assert.notStrictEqual(lease1.ip, lease2.ip, 'DHCP must never assign duplicate IPs');
});

// ---------------------------------------------------------------------------
// 14. DHCP Pool Exhaustion when Pool is Full
// ---------------------------------------------------------------------------
runTest('14. DHCP Pool Exhaustion Fails Gracefully when All Usable IPs are Taken', () => {
    // Use a /30 subnet (192.168.99.0/30 -> usable hosts are only .1 and .2)
    // Router uses .1, PC1 takes .2 -> PC2 must hit Pool Exhaustion!
    const rDhcp = makeDevice('r1', 'router', 'R-DHCP', {
        'Gig0/0': { ip: '192.168.99.1', mask: '255.255.255.252', up: true }
    });
    const sw1 = makeDevice('sw1', 'switch', 'SW1', {
        'Fa0/1': { up: true, vlan: 1, mode: 'access' },
        'Fa0/2': { up: true, vlan: 1, mode: 'access' },
        'Fa0/3': { up: true, vlan: 1, mode: 'access' }
    });
    const pc1 = makeDevice('pc1', 'pc', 'PC1', { 'Eth0': { ip: '', mask: '255.255.255.252', up: true } });
    const pc2 = makeDevice('pc2', 'pc', 'PC2', { 'Eth0': { ip: '', mask: '255.255.255.252', up: true } });
    const cables = [
        { id: 'c1', from: 'r1', fromPort: 'Gig0/0', to: 'sw1', toPort: 'Fa0/1' },
        { id: 'c2', from: 'sw1', fromPort: 'Fa0/2', to: 'pc1', toPort: 'Eth0' },
        { id: 'c3', from: 'sw1', fromPort: 'Fa0/3', to: 'pc2', toPort: 'Eth0' }
    ];
    const devices = [rDhcp, sw1, pc1, pc2];

    const lease1 = NetworkEngine.requestDhcpLease(pc1, devices, cables);
    assert.strictEqual(lease1.success, true);
    assert.strictEqual(lease1.ip, '192.168.99.2', 'PC1 takes the only remaining host IP in /30');

    const lease2 = NetworkEngine.requestDhcpLease(pc2, devices, cables);
    assert.strictEqual(lease2.success, false, 'PC2 must fail when DHCP pool is full');
    assert.strictEqual(lease2.poolExhausted, true, 'poolExhausted flag must be true');
});

// ---------------------------------------------------------------------------
// 15. Save/Load Topology JSON Integrity & STP Loop Prevention
// ---------------------------------------------------------------------------
runTest('15. Save/Load Topology Serialization & STP Loop Prevention on Redundant Links', () => {
    const sw1 = makeDevice('sw1', 'switch', 'SW1', {
        'Fa0/1': { up: true, vlan: 1, mode: 'trunk' },
        'Fa0/2': { up: true, vlan: 1, mode: 'trunk' },
        'Fa0/3': { up: true, vlan: 1, mode: 'access' }
    });
    const sw2 = makeDevice('sw2', 'switch', 'SW2', {
        'Fa0/1': { up: true, vlan: 1, mode: 'trunk' },
        'Fa0/2': { up: true, vlan: 1, mode: 'trunk' },
        'Fa0/3': { up: true, vlan: 1, mode: 'access' }
    });
    const pc1 = makeDevice('pc1', 'pc', 'PC1', { 'Eth0': { ip: '192.168.1.10', mask: '255.255.255.0', up: true } });
    const pc2 = makeDevice('pc2', 'pc', 'PC2', { 'Eth0': { ip: '192.168.1.20', mask: '255.255.255.0', up: true } });
    // Redundant cables between SW1 and SW2 (Loop!)
    const cables = [
        { id: 'c1', from: 'sw1', fromPort: 'Fa0/1', to: 'sw2', toPort: 'Fa0/1' },
        { id: 'c2', from: 'sw1', fromPort: 'Fa0/2', to: 'sw2', toPort: 'Fa0/2' },
        { id: 'c3', from: 'pc1', fromPort: 'Eth0', to: 'sw1', toPort: 'Fa0/3' },
        { id: 'c4', from: 'pc2', fromPort: 'Eth0', to: 'sw2', toPort: 'Fa0/3' }
    ];
    const devices = [sw1, sw2, pc1, pc2];

    const blocked = NetworkEngine.computeStpBlockedPorts(devices, cables);
    assert.strictEqual(blocked.size, 1, 'STP must block 1 redundant switch-to-switch link to prevent L2 broadcast storm');

    // Serialize & deserialize topology JSON
    const serialized = JSON.stringify({ version: '5.1', devices, cables });
    const restored = JSON.parse(serialized);
    const sim = NetworkEngine.simulatePing(restored.devices[2], restored.devices[3], restored.devices, restored.cables);
    assert.strictEqual(sim.success, true, 'Ping across redundant switches after JSON Save/Load must succeed without looping');
});

// ---------------------------------------------------------------------------
// 16. Service Worker (sw.js) & Offline Asset Cache Integrity
// ---------------------------------------------------------------------------
runTest('16. Service Worker (sw.js) & Offline CSS Fallback Verification', () => {
    const rootDir = path.resolve(__dirname, '..');
    const swContent = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
    const cssContent = fs.readFileSync(path.join(rootDir, 'css', 'style.css'), 'utf8');

    const requiredAssets = [
        './index.html',
        './manifest.json',
        './css/style.css',
        './js/network-engine.js',
        './js/cisco-cli.js',
        './js/academy-tutor.js',
        './js/modals.js',
        './js/canvas-ui.js',
        './js/app.js'
    ];
    for (const asset of requiredAssets) {
        assert.ok(swContent.includes(asset), `sw.js must cache ${asset}`);
        const fullPath = path.join(rootDir, asset);
        assert.ok(fs.existsSync(fullPath), `Cached file ${asset} must exist on disk`);
    }
    assert.ok(cssContent.includes('.hidden { display: none !important; }'), 'style.css must include offline fallback rules');
});

console.log('\n======================================================================');
console.log(`📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed (Total: ${passed + failed})`);
console.log('======================================================================');

if (failed > 0) {
    process.exit(1);
}
