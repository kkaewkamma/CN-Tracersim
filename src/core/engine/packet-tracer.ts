import { NetworkDevice, NetworkCable } from '../types';
import { IpMath } from './ip-math';
import { AclEngine } from './acl-engine';
import { NatEngine } from './nat-engine';

export interface PacketHopTrace {
  device: string;
  ingressPort?: string;
  egressPort?: string;
  action: 'forward' | 'switch' | 'route' | 'nat' | 'drop' | 'deliver';
  layer: 'L2' | 'L3' | 'L4';
  details: string;
}

export interface PacketSimulationResult {
  success: boolean;
  reason: string;
  dropStage?: 'source' | 'l2_vlan' | 'routing' | 'acl' | 'nat' | 'return_path';
  hops: PacketHopTrace[];
  natTranslated?: boolean;
  aclBlocked?: boolean;
}

export class PacketTracer {
  /**
   * Simulates an end-to-end packet transmission between two devices.
   */
  static trace(
    srcDev: NetworkDevice,
    dstDev: NetworkDevice,
    allDevices: NetworkDevice[],
    allCables: NetworkCable[],
    protocol: 'icmp' | 'tcp' | 'udp' = 'icmp',
    dstPort?: number
  ): PacketSimulationResult {
    const hops: PacketHopTrace[] = [];

    if (!srcDev || !dstDev) {
      return { success: false, reason: 'ไม่พบอุปกรณ์ต้นทางหรือปลายทาง', hops };
    }

    if (srcDev.id === dstDev.id) {
      hops.push({
        device: srcDev.name,
        action: 'deliver',
        layer: 'L3',
        details: 'Loopback 127.0.0.1 ส่งและรับบนโฮสต์เดียวกันสำเร็จ'
      });
      return { success: true, reason: 'Loopback transmission successful', hops };
    }

    // 1. Source host interface validation
    const srcPortEntry = Object.entries(srcDev.ports).find(([_p, obj]) => obj.ip && obj.up);
    if (!srcPortEntry) {
      return {
        success: false,
        reason: `${srcDev.name}: ไม่มีพอร์ตที่เปิดใช้งาน (UP) หรือไม่มีการตั้งค่า IP Address`,
        dropStage: 'source',
        hops
      };
    }
    const [srcPortName, srcPortObj] = srcPortEntry;
    const srcIp = srcPortObj.ip;
    const srcMask = srcPortObj.mask || '255.255.255.0';

    // 2. Destination host interface validation
    const dstPortEntry = Object.entries(dstDev.ports).find(([_p, obj]) => obj.ip);
    if (!dstPortEntry) {
      return {
        success: false,
        reason: `${dstDev.name}: ไม่มีการตั้งค่า IP Address ที่ปลายทาง`,
        dropStage: 'source',
        hops
      };
    }
    const [dstPortName, dstPortObj] = dstPortEntry;
    if (!dstPortObj.up) {
      return {
        success: false,
        reason: `${dstDev.name} พอร์ต ${dstPortName} ปลายทางถูก Shutdown (Down)`,
        dropStage: 'source',
        hops
      };
    }
    const dstIp = dstPortObj.ip;

    hops.push({
      device: srcDev.name,
      egressPort: srcPortName,
      action: 'forward',
      layer: 'L3',
      details: `สร้างแพ็กเก็ต ${protocol.toUpperCase()}: ${srcIp} -> ${dstIp}`
    });

    // Check direct subnet match
    const isSameSubnet = IpMath.isSameSubnet(srcIp, dstIp, srcMask);

    // Helper: find connected cables for a device
    const getConnectedCables = (devId: string) => {
      return allCables.filter(c => c.from === devId || c.to === devId);
    };

    const getPeer = (devId: string, portName: string) => {
      const c = allCables.find(
        cable =>
          (cable.from === devId && cable.fromPort === portName) ||
          (cable.to === devId && cable.toPort === portName)
      );
      if (!c) return null;
      const peerId = c.from === devId ? c.to : c.from;
      const peerPort = c.from === devId ? c.toPort : c.fromPort;
      const peerDev = allDevices.find(d => d.id === peerId);
      return peerDev ? { device: peerDev, port: peerPort } : null;
    };

    // 3. Same subnet transmission (L2 Switching only)
    if (isSameSubnet) {
      const peer = getPeer(srcDev.id, srcPortName);
      if (!peer) {
        return {
          success: false,
          reason: `${srcDev.name} พอร์ต ${srcPortName} ไม่ได้ต่อสายสัญญาณเข้ากับอุปกรณ์ใด`,
          dropStage: 'source',
          hops
        };
      }

      // If directly connected to destination host
      if (peer.device.id === dstDev.id) {
        hops.push({
          device: dstDev.name,
          ingressPort: peer.port,
          action: 'deliver',
          layer: 'L2',
          details: `รับแพ็กเก็ตปลายทางสำเร็จผ่านสายตรง`
        });
        return { success: true, reason: 'เชื่อมต่อโดยตรงในวงแลนเดียวกันสำเร็จ', hops };
      }

      // If connected via switch
      if (peer.device.type === 'switch') {
        const sw1 = peer.device;
        const sw1InPort = sw1.ports[peer.port];
        const srcVlan = sw1InPort?.vlan || 1;

        hops.push({
          device: sw1.name,
          ingressPort: peer.port,
          action: 'switch',
          layer: 'L2',
          details: `สวิตช์รับเฟรมบนพอร์ต ${peer.port} (VLAN ${srcVlan})`
        });

        // Find path to dstDev via switch(es)
        // Check destination connection
        const dstCables = getConnectedCables(dstDev.id);
        const dstCable = dstCables.find(c => {
          const p = c.from === dstDev.id ? c.fromPort : c.toPort;
          return p === dstPortName;
        });

        if (!dstCable) {
          return {
            success: false,
            reason: `${dstDev.name} พอร์ต ${dstPortName} ไม่ได้ต่อสายสัญญาณ`,
            dropStage: 'source',
            hops
          };
        }

        const dstSwitchId = dstCable.from === dstDev.id ? dstCable.to : dstCable.from;
        const dstSwitchPort = dstCable.from === dstDev.id ? dstCable.toPort : dstCable.fromPort;
        const dstSwitch = allDevices.find(d => d.id === dstSwitchId);

        if (!dstSwitch) {
          return {
            success: false,
            reason: `ไม่พบอุปกรณ์เชื่อมต่อไปยังปลายทาง`,
            dropStage: 'source',
            hops
          };
        }

        if (dstSwitch.id === sw1.id) {
          // Single switch L2
          const swOutPort = dstSwitch.ports[dstSwitchPort];
          const dstVlan = swOutPort?.vlan || 1;

          if (srcVlan !== dstVlan) {
            hops.push({
              device: sw1.name,
              action: 'drop',
              layer: 'L2',
              details: `ถูกบล็อกโดย VLAN Isolation: พอร์ต ${peer.port} อยู่ VLAN ${srcVlan} แต่พอร์ตปลายทาง ${dstSwitchPort} อยู่ VLAN ${dstVlan}`
            });
            return {
              success: false,
              reason: `VLAN Isolation: ไม่สามารถสื่อสารข้าม VLAN ${srcVlan} -> VLAN ${dstVlan} โดยไม่มีเราเตอร์`,
              dropStage: 'l2_vlan',
              hops
            };
          }

          hops.push({
            device: sw1.name,
            egressPort: dstSwitchPort,
            action: 'forward',
            layer: 'L2',
            details: `ส่งเฟรมออกพอร์ต ${dstSwitchPort} (VLAN ${dstVlan})`
          });

          hops.push({
            device: dstDev.name,
            ingressPort: dstPortName,
            action: 'deliver',
            layer: 'L2',
            details: `ปลายทาง ${dstDev.name} ได้รับแพ็กเก็ตสำเร็จ`
          });

          return { success: true, reason: 'รับส่งข้อมูลในวงแลนและ VLAN เดียวกันสำเร็จ', hops };
        } else {
          // Multi-switch L2 trunking
          const trunkCable = allCables.find(
            c => (c.from === sw1.id && c.to === dstSwitch.id) || (c.from === dstSwitch.id && c.to === sw1.id)
          );

          if (!trunkCable) {
            return {
              success: false,
              reason: `ไม่มีสายสัญญาณเชื่อมต่อระหว่าง ${sw1.name} และ ${dstSwitch.name}`,
              dropStage: 'l2_vlan',
              hops
            };
          }

          const sw1TrunkPort = trunkCable.from === sw1.id ? trunkCable.fromPort : trunkCable.toPort;
          const sw2TrunkPort = trunkCable.from === sw1.id ? trunkCable.toPort : trunkCable.fromPort;

          const isTrunk1 = sw1.ports[sw1TrunkPort]?.mode === 'trunk';
          const isTrunk2 = dstSwitch.ports[sw2TrunkPort]?.mode === 'trunk';

          if (!isTrunk1 || !isTrunk2) {
            hops.push({
              device: sw1.name,
              action: 'drop',
              layer: 'L2',
              details: `สายเชื่อมต่อระหว่างสวิตช์ไม่ได้ตั้งค่า 802.1Q Trunk (SW1=${sw1.ports[sw1TrunkPort]?.mode || 'access'}, SW2=${dstSwitch.ports[sw2TrunkPort]?.mode || 'access'})`
            });
            return {
              success: false,
              reason: `802.1Q Trunk Missing: พอร์ตเชื่อมต่อระหว่างสวิตช์ต้องตั้งเป็น switchport mode trunk`,
              dropStage: 'l2_vlan',
              hops
            };
          }

          const swOutPort = dstSwitch.ports[dstSwitchPort];
          const dstVlan = swOutPort?.vlan || 1;

          if (srcVlan !== dstVlan) {
            hops.push({
              device: dstSwitch.name,
              action: 'drop',
              layer: 'L2',
              details: `VLAN Isolation: ข้าม VLAN ${srcVlan} -> VLAN ${dstVlan} ไม่สำเร็จ`
            });
            return {
              success: false,
              reason: `VLAN Isolation: ข้าม VLAN บนสวิตช์คนละตัวไม่ได้หากไม่มี Inter-VLAN Routing`,
              dropStage: 'l2_vlan',
              hops
            };
          }

          hops.push({
            device: sw1.name,
            egressPort: sw1TrunkPort,
            action: 'forward',
            layer: 'L2',
            details: `แท็ก 802.1Q VLAN ${srcVlan} ส่งข้าม Trunk ไปยัง ${dstSwitch.name}`
          });

          hops.push({
            device: dstSwitch.name,
            ingressPort: sw2TrunkPort,
            egressPort: dstSwitchPort,
            action: 'switch',
            layer: 'L2',
            details: `ถอดแท็ก 802.1Q และส่งออกพอร์ต Access ${dstSwitchPort}`
          });

          hops.push({
            device: dstDev.name,
            ingressPort: dstPortName,
            action: 'deliver',
            layer: 'L2',
            details: `ปลายทาง ${dstDev.name} ได้รับแพ็กเก็ตสำเร็จ`
          });

          return { success: true, reason: 'ส่งผ่าน 802.1Q Trunk ใน VLAN เดียวกันสำเร็จ', hops };
        }
      }
    }

    // 4. Inter-Network / L3 Routing Path
    // Source host requires a Default Gateway
    if (!srcDev.gateway) {
      hops.push({
        device: srcDev.name,
        action: 'drop',
        layer: 'L3',
        details: `ปลายทาง ${dstIp} อยู่นอกวงแลน แต่ ${srcDev.name} ไม่ได้ระบุ Default Gateway`
      });
      return {
        success: false,
        reason: `${srcDev.name}: ปลายทางอยู่นอกวงแลน ต้องระบุ Default Gateway`,
        dropStage: 'routing',
        hops
      };
    }

    // Find Gateway Device
    const gwDevice = allDevices.find(d =>
      Object.values(d.ports).some(p => p.up && p.ip === srcDev.gateway)
    );

    if (!gwDevice) {
      hops.push({
        device: srcDev.name,
        action: 'drop',
        layer: 'L3',
        details: `ARP Timeout: ไม่พบ Default Gateway ${srcDev.gateway} บนโครงข่าย หรือพอร์ต Gateway ถูก Shutdown`
      });
      return {
        success: false,
        reason: `ไม่พบ Default Gateway (${srcDev.gateway}) บนเครือข่าย หรือพอร์ตเกตเวย์ปิดอยู่`,
        dropStage: 'routing',
        hops
      };
    }

    // Trace L2 switch between srcDev and Gateway if present
    const srcPeer = getPeer(srcDev.id, srcPortName);
    if (srcPeer && srcPeer.device.type === 'switch') {
      hops.push({
        device: srcPeer.device.name,
        ingressPort: srcPeer.port,
        action: 'switch',
        layer: 'L2',
        details: `สวิตช์ส่งต่อเฟรม L2 ไปยัง Default Gateway (${gwDevice.name})`
      });
    }

    // Verify destination host also has valid Default Gateway if it's on a different subnet
    const dstSameGwSubnet = Object.values(gwDevice.ports).some(
      p => p.up && p.ip && IpMath.isSameSubnet(dstIp, p.ip, p.mask || '255.255.255.0')
    );

    if (!dstSameGwSubnet && dstDev.type === 'pc' && !dstDev.gateway) {
      hops.push({
        device: dstDev.name,
        action: 'drop',
        layer: 'L3',
        details: `Return Path Failed: ปลายทาง ${dstDev.name} ไม่มี Default Gateway สำหรับส่งแพ็กเก็ตตอบกลับ`
      });
      return {
        success: false,
        reason: `${dstDev.name}: ไม่มี Default Gateway สำหรับส่งทราฟฟิกขากลับ (Return Path Failed)`,
        dropStage: 'return_path',
        hops
      };
    }

    // Route packet through Router(s)
    let currentRouter = gwDevice;
    let currentSrcIp = srcIp;
    let natTranslated = false;
    const visitedRouters = new Set<string>();

    while (currentRouter && currentRouter.type === 'router') {
      if (visitedRouters.has(currentRouter.id)) {
        return {
          success: false,
          reason: `Routing Loop Detected บน ${currentRouter.name}`,
          dropStage: 'routing',
          hops
        };
      }
      visitedRouters.add(currentRouter.id);

      // Check ingress interface on router
      const inPortEntry = Object.entries(currentRouter.ports).find(
        ([_p, obj]) => obj.up && obj.ip && (obj.ip === srcDev.gateway || IpMath.isSameSubnet(currentSrcIp, obj.ip, obj.mask || '255.255.255.0'))
      );
      const ingressPortName = inPortEntry ? inPortEntry[0] : 'Gig0/0';

      // 4A. Check Ingress ACL
      const rAcls = (currentRouter as any).acls || [];
      const inPortObj = currentRouter.ports[ingressPortName];
      const aclInId = inPortObj?.aclIn || (inPortObj as any)?.aclGroup;
      if (aclInId) {
        const acl = rAcls.find((a: any) => a.id == aclInId);
        if (acl) {
          const evalRes = AclEngine.evaluatePacket(acl, currentSrcIp, dstIp, protocol, dstPort);
          if (evalRes.action === 'deny') {
            hops.push({
              device: currentRouter.name,
              ingressPort: ingressPortName,
              action: 'drop',
              layer: 'L3',
              details: `ถูกบล็อกโดย ACL ${aclInId} (${evalRes.implicitDeny ? 'Implicit Deny Any' : 'Explicit Deny Rule'})`
            });
            return {
              success: false,
              reason: `Firewall ACL: แพ็กเก็ตถูกปฏิเสธ (Deny) โดย Access Control List ${aclInId} บน ${currentRouter.name}`,
              dropStage: 'acl',
              aclBlocked: true,
              hops
            };
          }
        }
      }

      // Check if destination is directly connected to this router
      const directConnectedEgress = Object.entries(currentRouter.ports).find(
        ([_p, obj]) => obj.up && obj.ip && IpMath.isSameSubnet(dstIp, obj.ip, obj.mask || '255.255.255.0')
      );

      let egressPortName = directConnectedEgress ? directConnectedEgress[0] : '';

      if (directConnectedEgress) {
        egressPortName = directConnectedEgress[0];
      } else {
        // Look up Routing Table (Static Routes + OSPF)
        const routes = (currentRouter as any).routes || [];
        // Longest Prefix Match
        let matchedRoute: any = null;
        let highestPrefix = -1;

        for (const route of routes) {
          if (IpMath.isIpInSubnet(dstIp, route.network, route.mask)) {
            const prefix = IpMath.maskToCidr(route.mask);
            if (prefix > highestPrefix) {
              highestPrefix = prefix;
              matchedRoute = route;
            }
          }
        }

        // If no static route, check OSPF dynamic routes
        if (!matchedRoute && (currentRouter as any).ospf?.networks?.length > 0) {
          // Check if peer router has announced dst network in same area
          for (const otherDev of allDevices) {
            if (otherDev.id !== currentRouter.id && otherDev.type === 'router') {
              const otherOspf = (otherDev as any).ospf;
              if (otherOspf && otherOspf.networks && otherOspf.networks.length > 0) {
                const isDstAnnounced = otherOspf.networks.some((n: any) =>
                  IpMath.isIpInSubnet(dstIp, n.network, IpMath.wildcardToMask(n.wildcard || '0.0.0.0'))
                );
                if (isDstAnnounced) {
                  // Check mutual Area 0 adjacency
                  const myArea0 = (currentRouter as any).ospf.networks.some((n: any) => (n.areaId ?? n.area) === 0);
                  const otherArea0 = otherOspf.networks.some((n: any) => (n.areaId ?? n.area) === 0);
                  if (myArea0 && otherArea0) {
                    matchedRoute = {
                      network: dstIp,
                      mask: '255.255.255.255',
                      type: 'ospf',
                      nextHop: otherDev.name
                    };
                  }
                }
              }
            }
          }
        }

        if (!matchedRoute) {
          hops.push({
            device: currentRouter.name,
            action: 'drop',
            layer: 'L3',
            details: `Destination Host Unreachable: ไม่มี Route สำหรับเครือข่ายปลายทาง ${dstIp} ในตาราง Routing Table`
          });
          return {
            success: false,
            reason: `${currentRouter.name}: ไม่มี Route ไปยังเครือข่ายปลายทาง (${dstIp}) ใน Routing Table`,
            dropStage: 'routing',
            hops
          };
        }

        // Determine egress port towards next hop
        egressPortName = matchedRoute.interfaceName || Object.keys(currentRouter.ports).find(p => p !== ingressPortName) || 'Gig0/1';
      }

      // 4B. Check NAT Translation on egress
      if ((currentRouter as any).natEnabled) {
        const trans = NatEngine.processOutboundTranslation(
          currentRouter,
          ingressPortName,
          egressPortName,
          currentSrcIp,
          50000,
          protocol
        );
        if (trans.translated) {
          currentSrcIp = trans.translatedIp;
          natTranslated = true;
          hops.push({
            device: currentRouter.name,
            ingressPort: ingressPortName,
            egressPort: egressPortName,
            action: 'nat',
            layer: 'L3',
            details: `PAT Overload: แปลง Private IP ${srcIp} -> Inside Global ${currentSrcIp}:${trans.translatedPort}`
          });
        }
      }

      // 4C. Check Egress ACL
      const outPortObj = currentRouter.ports[egressPortName];
      const aclOutId = outPortObj?.aclOut;
      if (aclOutId) {
        const acl = rAcls.find((a: any) => a.id == aclOutId);
        if (acl) {
          const evalRes = AclEngine.evaluatePacket(acl, currentSrcIp, dstIp, protocol, dstPort);
          if (evalRes.action === 'deny') {
            hops.push({
              device: currentRouter.name,
              egressPort: egressPortName,
              action: 'drop',
              layer: 'L3',
              details: `ถูกบล็อกโดย Outbound ACL ${aclOutId}`
            });
            return {
              success: false,
              reason: `Firewall ACL: ถูกบล็อกโดย Outbound ACL ${aclOutId} บน ${currentRouter.name}`,
              dropStage: 'acl',
              aclBlocked: true,
              hops
            };
          }
        }
      }

      hops.push({
        device: currentRouter.name,
        ingressPort: ingressPortName,
        egressPort: egressPortName,
        action: 'route',
        layer: 'L3',
        details: `ส่งต่อแพ็กเก็ตจาก ${ingressPortName} ออกทาง ${egressPortName}`
      });

      if (directConnectedEgress) {
        break; // Reached router directly connected to destination!
      } else {
        // Move to peer router
        const peer = getPeer(currentRouter.id, egressPortName);
        if (!peer || peer.device.type !== 'router') {
          break;
        }
        currentRouter = peer.device;
      }
    }

    // 5. Final Delivery to Destination Host
    hops.push({
      device: dstDev.name,
      ingressPort: dstPortName,
      action: 'deliver',
      layer: protocol === 'tcp' ? 'L4' : 'L3',
      details: `${protocol.toUpperCase()} Packet ส่งถึงปลายทางสำเร็จ`
    });

    return {
      success: true,
      reason: `${protocol.toUpperCase()} ไปยัง ${dstDev.name} (${dstIp}) สำเร็จ`,
      hops,
      natTranslated
    };
  }
}
