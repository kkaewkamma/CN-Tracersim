import { NetworkDevice, NetworkCable } from '../types';

export const L2SwitchingEngine = {
  /**
   * Evaluates Switch Port Security violation (Maximum MAC, Sticky MAC, Violation Modes)
   */
  checkSwitchPortSecurity(
    swDev: any,
    portName: string,
    srcMac: string
  ): { permitted: boolean; reason?: string; violation?: boolean; actionTaken?: string } {
    const port = swDev.ports[portName];
    if (!port || !port.portSecurity || !port.portSecurity.enabled) {
      return { permitted: true };
    }

    const sec = port.portSecurity;
    if (!sec.secureMacs) sec.secureMacs = [];
    const max = sec.maximum || 1;

    // Already secure MAC
    if (sec.secureMacs.includes(srcMac)) {
      return { permitted: true };
    }

    // Sticky MAC Learning under maximum
    if (sec.secureMacs.length < max) {
      if (sec.sticky) {
        sec.secureMacs.push(srcMac);
      }
      return { permitted: true };
    }

    // Violation!
    sec.violationCount = (sec.violationCount || 0) + 1;
    const mode = sec.violation || 'shutdown';

    if (mode === 'shutdown') {
      port.errDisabled = true;
      port.up = false;
      return {
        permitted: false,
        violation: true,
        actionTaken: 'shutdown',
        reason: `พอร์ต ${portName} บนสวิตช์ ${swDev.name} เกิด Security Violation (MAC แปลกปลอม: ${srcMac}) ➔ ถูกสั่ง shutdown เข้าสู่สถานะ err-disabled`
      };
    } else if (mode === 'restrict') {
      return {
        permitted: false,
        violation: true,
        actionTaken: 'restrict',
        reason: `พอร์ต ${portName} บนสวิตช์ ${swDev.name} ปฏิเสธเฟรมจาก MAC แปลกปลอม (${srcMac}) พร้อมบันทึก Violation Count = ${sec.violationCount}`
      };
    } else {
      // Protect mode: drop silently
      return {
        permitted: false,
        violation: true,
        actionTaken: 'protect',
        reason: `พอร์ต ${portName} บนสวิตช์ ${swDev.name} ทิ้งเฟรมจาก MAC แปลกปลอมเงียบๆ (Protect Mode)`
      };
    }
  },

  /**
   * Spanning Tree Protocol (IEEE 802.1D / Rapid-PVST) Root Bridge Election & Loop Prevention
   */
  computeStpBlockedPorts(
    allDevices: NetworkDevice[],
    allCables: NetworkCable[],
    _vlanId: number = 1
  ): Set<string> {
    const blockedPorts = new Set<string>();
    const switches = allDevices.filter(d => d.type === 'switch') as any[];
    if (switches.length < 2) return blockedPorts;

    // 1. Elect Root Bridge: lowest (stpPriority << 48) + MAC
    let rootBridge = switches[0];
    let bestBridgeId = (rootBridge.stpPriority ?? 32768);

    for (const sw of switches) {
      const prio = (sw.stpPriority ?? 32768);
      if (prio < bestBridgeId) {
        bestBridgeId = prio;
        rootBridge = sw;
      }
    }

    // 2. Identify redundant parallel links between switch pairs
    for (let i = 0; i < switches.length; i++) {
      for (let j = i + 1; j < switches.length; j++) {
        const swA = switches[i];
        const swB = switches[j];

        const links = allCables.filter(c =>
          (c.from === swA.id && c.to === swB.id) ||
          (c.from === swB.id && c.to === swA.id)
        );

        if (links.length > 1) {
          // If links are bundled into EtherChannel, STP treats them as 1 logical link (no blocking)
          for (let k = 1; k < links.length; k++) {
            const cable = links[k];
            const portNameA = cable.from === swA.id ? cable.fromPort : cable.toPort;
            const portNameB = cable.from === swB.id ? cable.fromPort : cable.toPort;

            const pA = swA.ports[portNameA];
            const pB = swB.ports[portNameB];
            const isEtherChannel = pA?.channelGroup && pB?.channelGroup && pA.channelGroup.id === pB.channelGroup.id;

            if (!isEtherChannel) {
              // Block non-root bridge side port
              const nonRootSw = (swA.id === rootBridge.id) ? swB : swA;
              const blockedPortName = (nonRootSw.id === swA.id) ? portNameA : portNameB;
              blockedPorts.add(`${nonRootSw.id}:${blockedPortName}`);
            }
          }
        }
      }
    }

    return blockedPorts;
  }
};

