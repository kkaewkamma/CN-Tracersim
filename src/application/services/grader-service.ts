import { NetworkDevice, NetworkCable } from '@core/types';
import { IpMath } from '@core/engine/ip-math';
import { OspfEngine } from '@core/engine/ospf-engine';
import { PacketTracer } from '@core/engine/packet-tracer';

export interface LabGradingCheck {
  label: string;
  passed: boolean;
  reason?: string;
  isCustom?: boolean;
}

export interface LabGradingReport {
  title: string;
  checks: LabGradingCheck[];
  passedCount: number;
  percent: number;
  percentage: number;
}

export class LabGraderService {
  /**
   * Evaluates lab criteria against current topology state strictly using PacketTracer simulations.
   */
  static evaluate(
    devices: NetworkDevice[],
    cables: NetworkCable[],
    labId: string,
    customConfig?: { title?: string; rules?: Array<{ type: string; src: string; dst?: string }> }
  ): LabGradingReport {
    const checks: LabGradingCheck[] = [];
    let title = customConfig?.title || `Assessment for ${labId.toUpperCase()}`;

    // Helper: find device by name
    const findDev = (name: string) => devices.find((d) => d.name === name);

    // Helper: run simulation between two named devices
    const runSim = (srcName: string, dstName: string, protocol: 'icmp' | 'tcp' = 'icmp', dstPort?: number) => {
      const src = findDev(srcName);
      const dst = findDev(dstName);
      if (!src || !dst) {
        return {
          success: false,
          reason: `ไม่พบอุปกรณ์ ${!src ? srcName : dstName} บนผังเครือข่าย`,
          hops: []
        };
      }
      return PacketTracer.trace(src, dst, devices, cables, protocol, dstPort);
    };

    // 1. Custom Rules Evaluation
    if (customConfig?.rules && customConfig.rules.length > 0) {
      title = customConfig.title || 'Custom Lab Assessment';
      for (const rule of customConfig.rules) {
        if (rule.type === 'ping_pass') {
          const sim = runSim(rule.src, rule.dst || '', 'icmp');
          checks.push({
            label: `Ping (ICMP) จาก ${rule.src} -> ${rule.dst} สำเร็จ`,
            passed: sim.success,
            reason: sim.reason,
            isCustom: true
          });
        } else if (rule.type === 'http_pass') {
          const sim = runSim(rule.src, rule.dst || '', 'tcp', 80);
          checks.push({
            label: `เปิดเว็บ HTTP (Port 80) จาก ${rule.src} -> ${rule.dst} สำเร็จ`,
            passed: sim.success,
            reason: sim.reason,
            isCustom: true
          });
        } else if (rule.type === 'ping_block') {
          const sim = runSim(rule.src, rule.dst || '', 'icmp');
          const blocked = !sim.success && !!sim.aclBlocked;
          checks.push({
            label: `Firewall ACL บล็อก Ping จาก ${rule.src} -> ${rule.dst}`,
            passed: blocked,
            reason: blocked ? sim.reason : 'Packet ยังไม่ถูกบล็อกด้วยกฎ ACL',
            isCustom: true
          });
        } else if (rule.type === 'nat_active') {
          const d = findDev(rule.src);
          const ok = !!(d && (d as any).natEnabled);
          checks.push({
            label: `เปิดใช้งาน NAT บน ${rule.src}`,
            passed: ok,
            reason: ok ? 'NAT เปิดใช้งานแล้ว' : 'ยังไม่ได้เปิดใช้งาน NAT',
            isCustom: true
          });
        }
      }
    } else if (labId === 'lab1' || labId === 'lan') {
      title = 'Lab 01: Basic Switch Configuration & Device Hardening';
      const sw1 = devices.find((d) => d.type === 'switch');
      const pingSim = runSim('PC1', 'File-SRV', 'icmp');
      const hasHardening = !!(sw1 && (sw1.name !== 'Switch0' && ((sw1 as any).enableSecret || (sw1 as any).passwordEncryption)));
      const portsUp = !!(sw1 && sw1.ports['Fa0/1']?.up && sw1.ports['Fa0/2']?.up);

      checks.push(
        {
          label: 'ตั้งค่าพื้นฐาน Switch (Hostname และ Enable Secret)',
          passed: hasHardening,
          reason: hasHardening ? 'ตั้งค่าการรักษาความปลอดภัยเบื้องต้นเรียบร้อย' : 'ต้องเปลี่ยนชื่อ hostname และตั้งค่า enable secret'
        },
        {
          label: 'พอร์ตเชื่อมต่อบน Switch สถานะ UP พร้อมใช้งาน',
          passed: portsUp,
          reason: portsUp ? 'พอร์ต Fa0/1 และ Fa0/2 สถานะ UP' : 'พอร์ตบน Switch ยังปิดอยู่'
        },
        {
          label: 'ทดสอบส่ง Ping ในวงแลนเดียวกันจาก PC1 -> File-SRV สำเร็จ',
          passed: pingSim.success,
          reason: pingSim.reason
        }
      );
    } else if (labId === 'lab2' || labId === 'subnets') {
      title = 'Lab 02: Basic Router Configuration & Default Gateway';
      const r1 = devices.find((d) => d.type === 'router');
      const pc1 = findDev('PC1');
      const srv = findDev('Web-SRV');
      const pingSim = runSim('PC1', 'Web-SRV', 'icmp');
      const rPortsUp = !!(r1 && r1.ports['Gig0/0']?.ip && r1.ports['Gig0/0']?.up && r1.ports['Gig0/1']?.ip && r1.ports['Gig0/1']?.up);
      const gwOk = !!(pc1?.gateway === '192.168.10.1' && srv?.gateway === '192.168.20.1');

      checks.push(
        {
          label: 'ตั้งค่า IP และเปิดพอร์ต Gig0/0, Gig0/1 บน R1-Core (no shutdown)',
          passed: rPortsUp,
          reason: rPortsUp ? 'Gig0/0 และ Gig0/1 มี IP และสถานะ UP' : 'ตรวจสอบ ip address และ no shutdown บน Gig0/0, Gig0/1'
        },
        {
          label: 'ตั้งค่า Default Gateway บน PC1 (192.168.10.1) และ Web-SRV (192.168.20.1)',
          passed: gwOk,
          reason: gwOk ? 'Default Gateway ทั้งสองฝั่งถูกต้อง' : 'ตรวจสอบค่า Default Gateway ของ PC1 และ Web-SRV'
        },
        {
          label: 'ส่ง Ping ข้ามวงแลนจาก PC1 -> Web-SRV สำเร็จ',
          passed: pingSim.success,
          reason: pingSim.reason
        }
      );
    } else if (labId === 'lab3') {
      title = 'Lab 03: IPv4 Addressing & VLSM Subnetting (/26)';
      const r1 = devices.find((d) => d.type === 'router');
      const pc1 = findDev('Sales-PC');
      const srv = findDev('IT-SRV');
      const pingSim = runSim('Sales-PC', 'IT-SRV', 'icmp');
      const maskOk = r1?.ports['Gig0/0']?.mask === '255.255.255.192' && r1?.ports['Gig0/1']?.mask === '255.255.255.192';
      const ipsOk = !!(pc1 && srv && IpMath.isSameSubnet(pc1.ports['Eth0']?.ip, '192.168.10.1', '255.255.255.192') && IpMath.isSameSubnet(srv.ports['Eth0']?.ip, '192.168.10.65', '255.255.255.192'));

      checks.push(
        {
          label: 'กำหนด Subnet Mask /26 (255.255.255.192) บน R1-VLSM ทั้งสองพอร์ต',
          passed: !!maskOk,
          reason: maskOk ? 'ใช้ Mask 255.255.255.192 ถูกต้อง' : 'ต้องใช้ Subnet Mask 255.255.255.192 (/26)'
        },
        {
          label: 'จัดสรร IP ใน Subnet แรก (.1–.62) ให้ Sales-PC และ Subnet ที่สอง (.65–.126) ให้ IT-SRV',
          passed: ipsOk,
          reason: ipsOk ? 'จัดสรรช่วง IP ตามการคำนวณ VLSM ถูกต้อง' : 'ตรวจสอบ IP ของทั้งสองโฮสต์ให้อยู่ใน Subnet /26'
        },
        {
          label: 'ส่ง Ping ข้าม VLSM Subnet ระหว่าง Sales-PC <-> IT-SRV สำเร็จ',
          passed: pingSim.success,
          reason: pingSim.reason
        }
      );
    } else if (labId === 'lab4' || labId === 'static-route') {
      title = 'Lab 04: IPv4 Static & Default Routing';
      const r1 = findDev('R1-HQ') as any;
      const r2 = findDev('R2-Branch') as any;
      const pingSim = runSim('HQ-PC', 'Branch-SRV', 'icmp');
      const r1Route = !!(r1 && r1.routes && r1.routes.length > 0);
      const r2Route = !!(r2 && r2.routes && r2.routes.length > 0);

      checks.push(
        {
          label: 'กำหนด Static Route บน R1-HQ ไปยัง 192.168.30.0/24',
          passed: r1Route,
          reason: r1Route ? 'พบ Static Route บน R1-HQ แล้ว' : 'ใช้คำสั่ง ip route 192.168.30.0 255.255.255.0 10.0.0.2 บน R1-HQ'
        },
        {
          label: 'กำหนด Static Route ขากลับบน R2-Branch ไปยัง 192.168.10.0/24',
          passed: r2Route,
          reason: r2Route ? 'พบ Static Route ขากลับบน R2-Branch แล้ว' : 'ใช้คำสั่ง ip route 192.168.10.0 255.255.255.0 10.0.0.1 บน R2-Branch'
        },
        {
          label: 'ส่ง Ping ข้ามเราเตอร์จาก HQ-PC -> Branch-SRV สำเร็จทั้งขาไปและขากลับ',
          passed: pingSim.success,
          reason: pingSim.reason
        }
      );
    } else if (labId === 'lab5') {
      title = 'Lab 05: VLANs, Access Ports & 802.1Q Trunking';
      const sw1 = findDev('SW1');
      const sw2 = findDev('SW2');
      const sameVlanSim = runSim('HR-PC1', 'HR-PC2', 'icmp');
      const crossVlanSim = runSim('HR-PC1', 'Sales-PC1', 'icmp');
      const trunkOk = sw1?.ports['Fa0/1']?.mode === 'trunk' && sw2?.ports['Fa0/1']?.mode === 'trunk';

      // Real simulation check for VLAN Isolation: cross-vlan MUST fail, same-vlan MUST succeed!
      const vlanIsolationWorks = !crossVlanSim.success && crossVlanSim.dropStage === 'l2_vlan';

      checks.push(
        {
          label: 'ตั้งค่าพอร์ตเชื่อมต่อระหว่าง SW1 (Fa0/1) และ SW2 (Fa0/1) เป็น 802.1Q Trunk',
          passed: !!trunkOk,
          reason: trunkOk ? 'พอร์ต Fa0/1 ทั้งสองฝั่งเป็น 802.1Q Trunk' : 'ใช้คำสั่ง switchport mode trunk บน Fa0/1'
        },
        {
          label: 'ส่ง Ping ข้าม Switch ใน VLAN 10 เดียวกัน (HR-PC1 -> HR-PC2) สำเร็จ',
          passed: sameVlanSim.success,
          reason: sameVlanSim.reason
        },
        {
          label: 'VLAN Isolation กั้นการสื่อสารระหว่าง VLAN 10 (HR-PC1) กับ VLAN 20 (Sales-PC1)',
          passed: vlanIsolationWorks,
          reason: vlanIsolationWorks ? 'VLAN Isolation กั้นทราฟฟิกข้าม VLAN สำเร็จ (แยก Broadcast Domain)' : 'ตรวจพบว่าแพ็กเก็ตข้าม VLAN ได้โดยไม่มีเราเตอร์ หรือการทดสอบล้มเหลว'
        }
      );
    } else if (labId === 'lab6' || labId === 'roas-vlan') {
      title = 'Lab 06: Inter-VLAN Routing (Router-on-a-Stick 802.1Q)';
      const sw = devices.find((d) => d.type === 'switch');
      const r1 = devices.find((d) => d.type === 'router');
      const pingSim = runSim('HR-PC (VLAN10)', 'DB-SRV (VLAN20)', 'icmp');
      const trunkOk = sw?.ports['Fa0/1']?.mode === 'trunk';
      const subIfOk = !!(r1 && r1.ports['Gig0/0.10']?.ip && r1.ports['Gig0/0.20']?.ip);

      checks.push(
        {
          label: 'ตั้งค่า 802.1Q Trunk บนพอร์ต Fa0/1 ของ Switch',
          passed: !!trunkOk,
          reason: trunkOk ? 'Fa0/1 เป็น 802.1Q Trunk แล้ว' : 'พอร์ต Fa0/1 ยังไม่ได้ตั้งเป็น trunk'
        },
        {
          label: 'สร้าง Sub-interface Gig0/0.10 และ Gig0/0.20 บน Router',
          passed: subIfOk,
          reason: subIfOk ? 'Sub-interfaces .10 และ .20 พร้อมใช้งาน' : 'สร้าง Sub-interface พร้อม encapsulation dot1Q'
        },
        {
          label: 'Ping ข้าม VLAN ระหว่าง HR-PC (VLAN10) <-> DB-SRV (VLAN20) สำเร็จ',
          passed: pingSim.success,
          reason: pingSim.reason
        }
      );
    } else if (labId === 'lab7') {
      title = 'Lab 07: DHCPv4 Server, Excluded IP & DORA Process';
      const r1 = findDev('R1-DHCP') as any;
      const pc1 = findDev('Client-PC1');
      const pc2 = findDev('Client-PC2');
      const pingSim = runSim('Client-PC1', 'R1-DHCP', 'icmp');
      const hasPool = !!(r1 && r1.dhcpPools && r1.dhcpPools.length > 0 && r1.dhcpExcluded && r1.dhcpExcluded.length > 0);
      const hasLeases = !!(pc1?.ports['Eth0']?.ip && pc2?.ports['Eth0']?.ip && pc1.ports['Eth0'].ip !== pc2.ports['Eth0'].ip);

      checks.push(
        {
          label: 'ตั้งค่า ip dhcp excluded-address และ ip dhcp pool บน R1-DHCP',
          passed: hasPool,
          reason: hasPool ? `ตั้งค่า DHCP Pool "${r1.dhcpPools[0].name}" เรียบร้อย` : 'กำหนด ip dhcp pool และ excluded-address บน R1-DHCP'
        },
        {
          label: 'Client-PC1 และ Client-PC2 ขอรับ IP ผ่านกระบวนการ DORA สำเร็จ (IP ไม่ซ้ำกัน)',
          passed: hasLeases,
          reason: hasLeases ? 'ทั้งสองเครื่องได้รับ IP คนละชุดจาก DHCP Pool' : 'รัน ip address dhcp บน Client'
        },
        {
          label: 'ส่ง Ping จาก Client-PC1 ไปยัง Default Gateway (R1-DHCP) สำเร็จ',
          passed: pingSim.success,
          reason: pingSim.reason
        }
      );
    } else if (labId === 'lab8' || labId === 'ospf-core') {
      title = 'Lab 08: Single-Area OSPFv2 Dynamic Routing';
      const r1 = findDev('R1-Edge') as any;
      const r2 = findDev('R2-Core') as any;
      const pingSim = runSim('Edge-PC', 'Cloud-SRV', 'icmp');
      const ospfNetOk = !!(r1?.ospf?.networks?.length > 0 && r2?.ospf?.networks?.length > 0);
      const r1Neighbors = r1 ? OspfEngine.getOspfNeighbors(r1, devices, cables) : [];
      const adjOk = r1Neighbors.length > 0;

      checks.push(
        {
          label: 'เปิดใช้งาน OSPF Process 1 บน R1-Edge และ R2-Core',
          passed: ospfNetOk,
          reason: ospfNetOk ? 'ประกาศ OSPF Network ครบทั้งสองเราเตอร์' : 'ประกาศ network ใน router ospf 1'
        },
        {
          label: 'OSPF Neighbor Adjacency สถานะ FULL (Area ตรงกัน)',
          passed: adjOk,
          reason: adjOk ? 'Neighbor Adjacency FULL บน Area 0' : 'Area ID ไม่ตรงกันหรือยังไม่ได้ประกาศเครือข่ายเชื่อมต่อ'
        },
        {
          label: 'Ping ข้ามเราเตอร์ OSPF จาก Edge-PC -> Cloud-SRV สำเร็จ',
          passed: pingSim.success,
          reason: pingSim.reason
        }
      );
    } else if (labId === 'lab9') {
      title = 'Lab 09: Standard & Extended IPv4 ACL Firewall (Implicit Deny)';
      const r1 = findDev('R1-FW') as any;
      const pingSim = runSim('Staff-PC', 'Web-SRV', 'icmp');
      const httpSim = runSim('Staff-PC', 'Web-SRV', 'tcp', 80);
      const hasBoundAcl = !!(r1 && r1.acls && r1.acls.length > 0 && Object.values(r1.ports).some((p: any) => p.aclIn || p.aclOut || (p as any).aclGroup));

      checks.push(
        {
          label: 'สร้าง Extended ACL 100 และผูกกับ Interface (ip access-group) บน R1-FW',
          passed: hasBoundAcl,
          reason: hasBoundAcl ? 'สร้างและผูก ACL กับพอร์ตเรียบร้อย' : 'สร้าง access-list 100 และใช้ ip access-group 100 in'
        },
        {
          label: 'กฎ ACL บล็อก ICMP Ping จาก Staff-PC -> Web-SRV',
          passed: !pingSim.success && !!pingSim.aclBlocked,
          reason: pingSim.aclBlocked ? pingSim.reason : 'ICMP Ping ต้องถูกบล็อกโดยกฎ ACL'
        },
        {
          label: 'กฎ ACL อนุญาตให้เปิดเว็บ HTTP (TCP Port 80) จาก Staff-PC -> Web-SRV สำเร็จ',
          passed: httpSim.success,
          reason: httpSim.reason
        }
      );
    } else if (labId === 'lab10' || labId === 'acl-nat') {
      title = 'Lab 10: NAT/PAT Overload, Firewall ACL & ISP Cloud';
      const r1 = findDev('R1-Firewall') as any;
      const pingSim = runSim('Corp-PC', 'ISP-Cloud', 'icmp');
      const httpSim = runSim('Corp-PC', 'ISP-Cloud', 'tcp', 80);
      const hasNat = !!(r1 && r1.natEnabled);
      const pingBlockedByAcl = !pingSim.success && !!pingSim.aclBlocked;
      const httpAllowedAndNatted = !!httpSim.success && !!httpSim.natTranslated;

      checks.push(
        {
          label: 'เปิดใช้งาน NAT Overload (Inside/Outside) บน R1-Firewall',
          passed: hasNat && httpAllowedAndNatted,
          reason: httpAllowedAndNatted ? 'แปลง Private IP เป็น Inside Global (PAT Overload) สำเร็จ' : 'เปิดใช้งาน ip nat inside source list ... overload'
        },
        {
          label: 'ตั้งกฎ ACL บล็อก ICMP Ping แต่เปิดให้เข้าเว็บ HTTP Port 80 ได้',
          passed: pingBlockedByAcl && httpSim.success,
          reason: pingBlockedByAcl ? pingSim.reason : 'ICMP Ping ต้องถูกบล็อกด้วยกฎ ACL และ HTTP ต้องผ่านได้'
        },
        {
          label: 'เปิดเข้าเว็บ HTTP (Port 80) จาก Corp-PC ไปยัง ISP-Cloud สำเร็จ',
          passed: httpSim.success,
          reason: httpSim.reason
        }
      );
    } else if (labId === 'lab11' || labId === 'troubleshoot') {
      title = 'Lab 11: Network Troubleshooting Challenge (ซ่อมระบบล่ม 3 จุด)';
      const r1 = findDev('R1-Gateway');
      const pc1 = findDev('PC1');
      const srv = findDev('Payroll-SRV');
      const pingSim = runSim('PC1', 'Payroll-SRV', 'icmp');
      const g01Up = !!(r1 && r1.ports['Gig0/1']?.up);
      const pcGwOk = !!(pc1 && pc1.gateway === '192.168.10.1');
      const srvIpOk = !!(srv && srv.ports['Eth0']?.ip === '192.168.20.100');

      checks.push(
        {
          label: 'เปิดพอร์ต Gig0/1 บน R1-Gateway (no shutdown)',
          passed: g01Up,
          reason: g01Up ? 'พอร์ต Gig0/1 สถานะ UP' : 'พอร์ต Gig0/1 ยังถูก shutdown'
        },
        {
          label: 'ตั้งค่า Default Gateway ของ PC1 เป็น 192.168.10.1',
          passed: pcGwOk,
          reason: pcGwOk ? 'Default Gateway ถูกต้อง (192.168.10.1)' : 'Gateway ไม่ถูกต้อง'
        },
        {
          label: 'แก้ IP ของ Payroll-SRV เป็น 192.168.20.100',
          passed: srvIpOk,
          reason: srvIpOk ? 'IP อยู่ในวง 192.168.20.0/24 ถูกต้อง' : 'IP ของ Payroll-SRV ไม่ถูกต้อง'
        },
        {
          label: 'ส่ง Ping จาก PC1 ไปยัง Payroll-SRV สำเร็จ',
          passed: pingSim.success,
          reason: pingSim.reason
        }
      );
    } else if (labId === 'lab12') {
      title = 'Lab 12: Integrated Enterprise Network (Capstone Lab)';
      const sw = findDev('SW-Core');
      const r1 = findDev('R1-HQ') as any;
      const r2 = findDev('R2-Edge') as any;
      const httpSim = runSim('HQ-PC1', 'ISP-Server', 'tcp', 80);
      const swTrunk = !!(sw && sw.ports['Fa0/1']?.mode === 'trunk');
      const r1Neighbors = r1 ? OspfEngine.getOspfNeighbors(r1, devices, cables) : [];
      const ospfOk = r1Neighbors.length > 0;
      const natOk = !!(r2 && r2.natEnabled);

      checks.push(
        {
          label: 'Switching & Security: ตั้งค่า 802.1Q Trunk (Fa0/1) บน SW-Core',
          passed: swTrunk,
          reason: swTrunk ? 'Trunk 802.1Q พร้อมใช้งาน' : 'ตั้งค่า switchport mode trunk บน Fa0/1'
        },
        {
          label: 'Routing: R1-HQ (ROAS) และ R2-Edge สร้าง OSPF Area 0 Neighbor สำเร็จ',
          passed: ospfOk,
          reason: ospfOk ? 'OSPF Area 0 Neighbor FULL' : 'ตรวจสอบ OSPF บนเราเตอร์ทั้งสอง'
        },
        {
          label: 'WAN & NAT: ส่ง HTTP ข้าม VLAN -> OSPF -> PAT Overload ไปยัง ISP-Server สำเร็จ',
          passed: httpSim.success && !!httpSim.natTranslated && natOk,
          reason: httpSim.reason
        }
      );
    } else {
      const pingSim = devices.length >= 2 ? runSim(devices[0].name, devices[devices.length - 1].name, 'icmp') : { success: false, reason: 'มีอุปกรณ์ไม่เพียงพอ' };
      checks.push({
        label: 'มีอุปกรณ์และสายเชื่อมต่อครบถ้วน',
        passed: devices.length >= 2 && cables.length >= 1,
        reason: devices.length >= 2 && cables.length >= 1 ? 'อุปกรณ์และสายพร้อมใช้งาน' : 'กรุณาวางอุปกรณ์และเชื่อมสาย'
      });
      checks.push({
        label: 'การเชื่อมต่อระหว่างโฮสต์สำเร็จ',
        passed: pingSim.success,
        reason: pingSim.reason
      });
    }

    const passedCount = checks.filter((c) => c.passed).length;
    const percent = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 100;

    return {
      title,
      checks,
      passedCount,
      percent,
      percentage: percent
    };
  }
}
