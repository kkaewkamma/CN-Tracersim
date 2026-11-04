import { NetworkDevice, NetworkCable } from '../types';
import { IpMath } from './ip-math';

export const OspfEngine = {
  /**
   * Computes OSPF Interface Cost according to Cisco reference bandwidth: Cost = 100,000,000 / Bandwidth
   */
  getInterfaceCost(device: NetworkDevice, portName: string): number {
    const port = device.ports[portName];
    if (!port) return 10;
    if (port.ospfCost && port.ospfCost > 0) return port.ospfCost;

    const lower = portName.toLowerCase();
    if (lower.startsWith('gig') || lower.startsWith('g')) return 1;    // 1 Gbps = Cost 1
    if (lower.startsWith('fa') || lower.startsWith('f')) return 10;    // 100 Mbps = Cost 10
    if (lower.startsWith('ser') || lower.startsWith('s')) return 64;   // 1.544 Mbps Serial = Cost 64
    return 10;
  },

  /**
   * Checks if an interface on a router participates in OSPF and returns its Area ID
   */
  isInterfaceInOspf(router: any, portName: string): { enabled: boolean; areaId?: number; processId?: number } {
    if (!router.ospf || !router.ospf.networks || router.ospf.networks.length === 0) {
      return { enabled: false };
    }

    const port = router.ports[portName];
    if (!port || !port.ip || !port.up) return { enabled: false };

    const ipInt = IpMath.ipToInt(port.ip);

    for (const netConfig of router.ospf.networks) {
      const netInt = IpMath.ipToInt(netConfig.network);
      const wildInt = IpMath.ipToInt(netConfig.wildcard || '0.0.0.0');
      const careMask = (~wildInt) >>> 0;

      if (((ipInt & careMask) >>> 0) === ((netInt & careMask) >>> 0)) {
        const areaId = netConfig.areaId !== undefined ? netConfig.areaId : (netConfig.area ?? 0);
        return { enabled: true, areaId, processId: router.ospf.processId || 1 };
      }
    }

    return { enabled: false };
  },

  /**
   * Discovers valid OSPF Neighbors across physical/logical cables with Area ID matching
   */
  getOspfNeighbors(
    router: any,
    allDevices: NetworkDevice[],
    allCables: NetworkCable[]
  ): Array<{ neighborId: string; neighborIp: string; localPort: string; neighborPort: string; areaId: number; state: string; cost: number }> {
    const neighbors: any[] = [];
    if (!router.ospf || !router.ospf.networks || router.ospf.networks.length === 0) return neighbors;

    for (const [pName, pObj] of Object.entries(router.ports as Record<string, any>)) {
      if (!pObj.up || !pObj.ip) continue;
      const localOspf = this.isInterfaceInOspf(router, pName);
      if (!localOspf.enabled) continue;

      // Find connected cables
      const connectedCables = allCables.filter(c =>
        (c.from === router.id && c.fromPort === pName) ||
        (c.to === router.id && c.toPort === pName)
      );

      for (const cable of connectedCables) {
        const isFrom = cable.from === router.id;
        const otherDevId = isFrom ? cable.to : cable.from;
        const otherPortName = isFrom ? cable.toPort : cable.fromPort;
        const otherDev = allDevices.find(d => d.id === otherDevId);

        if (!otherDev || otherDev.type !== 'router') continue;
        const otherRouter = otherDev as any;
        const otherPort = otherRouter.ports[otherPortName];

        if (!otherPort || !otherPort.up || !otherPort.ip) continue;

        // Check if other router has OSPF in the EXACT SAME Area ID
        const remoteOspf = this.isInterfaceInOspf(otherRouter, otherPortName);
        if (remoteOspf.enabled && remoteOspf.areaId === localOspf.areaId) {
          // Check common subnet
          const commonMask = pObj.mask || otherPort.mask || '255.255.255.0';
          if (IpMath.isSameSubnet(pObj.ip, otherPort.ip, commonMask)) {
            const cost = this.getInterfaceCost(router, pName);
            neighbors.push({
              neighborId: otherRouter.ospf?.routerId || otherPort.ip,
              neighborIp: otherPort.ip,
              localPort: pName,
              neighborPort: otherPortName,
              areaId: localOspf.areaId!,
              state: 'FULL/DR',
              cost
            });
          }
        }
      }
    }

    return neighbors;
  },

  /**
   * Computes dynamic OSPF routes learned from adjacent neighbors
   */
  computeOspfRoutes(router: any, allDevices: NetworkDevice[], allCables: NetworkCable[]): any[] {
    const ospfRoutes: any[] = [];
    const neighbors = this.getOspfNeighbors(router, allDevices, allCables);

    for (const neig of neighbors) {
      const neighborDev = allDevices.find(d => Object.values(d.ports).some(p => p.ip === neig.neighborIp));
      if (!neighborDev) continue;

      // Collect directly connected networks of neighbor that are advertised in OSPF
      for (const [remotePortName, remotePort] of Object.entries(neighborDev.ports)) {
        if (!remotePort.up || !remotePort.ip || !remotePort.mask) continue;
        const remoteOspf = this.isInterfaceInOspf(neighborDev, remotePortName);

        if (remoteOspf.enabled && remoteOspf.areaId === neig.areaId) {
          const remoteNet = IpMath.getNetworkAddress(remotePort.ip, remotePort.mask);

          // Skip networks directly connected to local router
          const isLocal = Object.values(router.ports).some((lp: any) =>
            lp.ip && lp.mask && IpMath.getNetworkAddress(lp.ip, lp.mask) === remoteNet
          );
          if (isLocal) continue;

          const totalCost = neig.cost + this.getInterfaceCost(neighborDev, remotePortName);
          ospfRoutes.push({
            network: remoteNet,
            mask: remotePort.mask,
            nextHop: neig.neighborIp,
            interfaceName: neig.localPort,
            type: 'ospf',
            ad: 110,
            metric: totalCost
          });
        }
      }
    }

    return ospfRoutes;
  }
};

