import { NetworkDevice, NetworkCable, DhcpLeaseResult, DhcpDoraStep } from '../types';
import { IpMath } from './ip-math';

export const DhcpEngine = {
  /**
   * Executes full 4-step DHCP DORA process (Discover, Offer, Request, ACK)
   * Guaranteed duplicate IP prevention and excluded range adherence.
   */
  requestDhcpLease(
    clientDevice: NetworkDevice,
    allDevices: NetworkDevice[],
    allCables: NetworkCable[]
  ): DhcpLeaseResult {
    const doraSteps: DhcpDoraStep[] = [];

    // Find client's first available port
    const clientPortName = Object.keys(clientDevice.ports)[0] || 'Eth0';
    const clientPort = clientDevice.ports[clientPortName];

    // Find accessible DHCP Server in topology
    const dhcpRouters = allDevices.filter(d =>
      d.type === 'router' &&
      (d as any).dhcpPools &&
      (d as any).dhcpPools.length > 0
    );

    if (dhcpRouters.length === 0) {
      return { success: false, reason: 'ไม่พบ DHCP Server ในเครือข่าย', doraSteps, poolExhausted: false };
    }

    const dhcpRouter = dhcpRouters[0] as any;
    const pool = dhcpRouter.dhcpPools[0];
    if (!pool) {
      return { success: false, reason: 'ไม่พบ DHCP Pool ที่กำหนดบน Router', doraSteps, poolExhausted: false };
    }

    // 1. DHCP Discover (Client Broadcast)
    doraSteps.push({
      stepName: 'DISCOVER',
      device: clientDevice.name,
      details: `${clientDevice.name} ส่ง DHCP Discover (Broadcast 255.255.255.255) ค้นหา DHCP Server`
    });

    const netInt = IpMath.ipToInt(pool.network);
    const mask = pool.mask || '255.255.255.0';
    const maskInt = IpMath.ipToInt(mask);
    const hostBits = 32 - IpMath.maskToCidr(mask);
    const totalHosts = Math.pow(2, hostBits);

    // Collect all allocated IPs in this subnet across all devices in topology
    const usedIps = new Set<string>();
    for (const dev of allDevices) {
      for (const p of Object.values(dev.ports)) {
        if (p.ip && IpMath.isSameSubnet(p.ip, pool.network, mask)) {
          usedIps.add(p.ip);
        }
      }
    }

    // Add excluded ranges
    const excluded = dhcpRouter.dhcpExcluded || [];
    const isExcluded = (checkIp: string) => {
      const checkInt = IpMath.ipToInt(checkIp);
      for (const ex of excluded) {
        const lowInt = IpMath.ipToInt(ex.low);
        const highInt = IpMath.ipToInt(ex.high || ex.low);
        if (checkInt >= lowInt && checkInt <= highInt) return true;
      }
      return false;
    };

    // Find first available IP in pool
    let candidateIp: string | null = null;
    for (let i = 1; i < totalHosts - 1; i++) {
      const testIp = IpMath.intToIp(netInt + i);
      if (!usedIps.has(testIp) && !isExcluded(testIp)) {
        candidateIp = testIp;
        break;
      }
    }

    if (!candidateIp) {
      return {
        success: false,
        reason: 'DHCP Pool Exhausted: ไม่มี IP ว่างเหลือสำหรับแจกใน Pool นี้',
        poolExhausted: true,
        doraSteps
      };
    }

    const serverIp = pool.defaultRouter || Object.values(dhcpRouter.ports).find((p: any) => p.ip)?.ip || '192.168.10.1';

    // 2. DHCP Offer (Server Unicast/Broadcast)
    doraSteps.push({
      stepName: 'OFFER',
      device: dhcpRouter.name,
      serverIp,
      assignedIp: candidateIp,
      details: `${dhcpRouter.name} เสนอ IP ${candidateIp} ให้แก่ ${clientDevice.name}`
    });

    // 3. DHCP Request (Client asks to lease offered IP)
    doraSteps.push({
      stepName: 'REQUEST',
      device: clientDevice.name,
      assignedIp: candidateIp,
      details: `${clientDevice.name} ยืนยันขอเช่า IP ${candidateIp} จาก Server ${serverIp}`
    });

    // 4. DHCP ACK (Server confirms lease)
    doraSteps.push({
      stepName: 'ACK',
      device: dhcpRouter.name,
      serverIp,
      assignedIp: candidateIp,
      details: `${dhcpRouter.name} อนุมัติการเช่า IP (DHCP ACK) สำเร็จ`
    });

    // Apply leased settings to client port
    if (clientPort) {
      clientPort.ip = candidateIp;
      clientPort.mask = mask;
      clientDevice.gateway = pool.defaultRouter || serverIp;
    }

    return {
      success: true,
      ip: candidateIp,
      mask,
      gateway: pool.defaultRouter || serverIp,
      dns: pool.dnsServer || '8.8.8.8',
      poolExhausted: false,
      doraSteps
    };
  }
};

