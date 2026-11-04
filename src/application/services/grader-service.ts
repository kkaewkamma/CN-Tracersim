import { NetworkDevice, NetworkCable } from '@core/types';
import { IpMath } from '@core/engine/ip-math';
import { AclEngine } from '@core/engine/acl-engine';
import { NatEngine } from '@core/engine/nat-engine';
import { OspfEngine } from '@core/engine/ospf-engine';

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
   * Evaluates lab criteria against current topology state.
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

    // 1. Custom Rules Evaluation
    if (customConfig?.rules && customConfig.rules.length > 0) {
      title = customConfig.title || 'Custom Lab Assessment';
      for (const rule of customConfig.rules) {
        if (rule.type === 'ping_pass') {
          const d1 = findDev(rule.src);
          const d2 = rule.dst ? findDev(rule.dst) : null;
          const ok = !!(d1 && d2 && Object.values(d1.ports).some(p => p.up && p.ip) && Object.values(d2.ports).some(p => p.up && p.ip));
          checks.push({
            label: `Ping (ICMP) จาก ${rule.src} ➔ ${rule.dst} สำเร็จ`,
            passed: ok,
            reason: ok ? 'เชื่อมต่อ ICMP สำเร็จ' : `ปลายทาง ${rule.dst} ไม่สามารถเข้าถึงได้`,
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
      const pc1 = findDev('PC1');
      const srv = findDev('File-SRV');
      const hasHardening = !!(sw1 && (sw1.name !== 'Switch0' || (sw1 as any).enableSecret || (sw1 as any).passwordEncryption));
      const portsUp = !!(sw1 && sw1.ports['Fa0/1']?.up && sw1.ports['Fa0/2']?.up);
      const pingOk = !!(pc1 && srv && pc1.ports['Eth0']?.ip && srv.ports['Eth0']?.ip && IpMath.isSameSubnet(pc1.ports['Eth0'].ip, srv.ports['Eth0'].ip, '255.255.255.0'));

      checks.push(
        {
          label: 'ตั้งค่าพื้นฐาน Switch (Hostname / Enable Secret / SVI Vlan1)',
          passed: hasHardening,
          reason: hasHardening ? 'ตั้งค่าการรักษาความปลอดภัยเบื้องต้นเรียบร้อย' : 'กำหนด hostname หรือ enable secret'
        },
        {
          label: 'พอร์ตเชื่อมต่อบน Switch สถานะ UP พร้อมใช้งาน',
          passed: portsUp,
          reason: portsUp ? 'พอร์ต Fa0/1 และ Fa0/2 สถานะ UP' : 'พอร์ตบน Switch ยังปิดอยู่'
        },
        {
          label: 'ทดสอบส่ง Ping ในวงแลนเดียวกันจาก PC1 ➔ File-SRV สำเร็จ',
          passed: pingOk,
          reason: pingOk ? 'Ping ในวงแลน 192.168.1.0/24 สำเร็จ' : 'ตรวจสอบ IP และ Subnet Mask'
        }
      );
    } else if (labId === 'lab2' || labId === 'subnets') {
      title = 'Lab 02: Basic Router Configuration & Default Gateway';
      const r1 = devices.find((d) => d.type === 'router');
      const pc1 = findDev('PC1');
      const srv = findDev('Web-SRV');
      const rPortsUp = !!(r1 && r1.ports['Gig0/0']?.ip && r1.ports['Gig0/0']?.up && r1.ports['Gig0/1']?.ip && r1.ports['Gig0/1']?.up);
      const gwOk = !!(pc1?.gateway === '192.168.10.1' && srv?.gateway === '192.168.20.1');

      checks.push(
        {
          label: 'ตั้งค่า IP และเปิดพอร์ต Gig0/0, Gig0/1 บน R1-Core (no shutdown)',
          passed: rPortsUp,
          reason: rPortsUp ? 'Gig0/0 และ Gig0/1 มี IP และสถานะ UP' : 'ตรวจสอบ ip address และ no shutdown'
        },
        {
          label: 'ตั้งค่า Default Gateway บน PC1 (192.168.10.1) และ Web-SRV (192.168.20.1)',
          passed: gwOk,
          reason: gwOk ? 'Default Gateway ถูกต้อง' : 'ตรวจสอบค่า Default Gateway ของโฮสต์'
        },
        {
          label: 'ส่ง Ping ข้ามวงแลนจาก PC1 ➔ Web-SRV สำเร็จ',
          passed: rPortsUp && gwOk,
          reason: rPortsUp && gwOk ? 'เราเตอร์ส่งต่อแพ็กเก็ตข้ามวงได้สำเร็จ' : 'เราเตอร์หรือโฮสต์ยังตั้งค่าไม่สมบูรณ์'
        }
      );
    } else if (labId === 'lab3') {
      title = 'Lab 03: IPv4 Addressing & VLSM Subnetting (/26)';
      const r1 = devices.find((d) => d.type === 'router');
      const pc1 = findDev('Sales-PC');
      const srv = findDev('IT-SRV');
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
          reason: ipsOk ? 'จัดสรรช่วง IP ตามการคำนวณ VLSM ถูกต้อง' : 'ตรวจสอบ IP ของทั้งสองโฮสต์'
        },
        {
          label: 'ส่ง Ping ข้าม VLSM Subnet ระหว่าง Sales-PC ⟷ IT-SRV สำเร็จ',
          passed: !!maskOk && ipsOk,
          reason: maskOk && ipsOk ? 'Ping ข้าม Subnet /26 สำเร็จ' : 'ตรวจสอบเราเตอร์และการกำหนดเส้นทาง'
        }
      );
    } else if (labId === 'lab4' || labId === 'static-route') {
      title = 'Lab 04: IPv4 Static & Default Routing';
      const r1 = findDev('R1-HQ') as any;
      const r2 = findDev('R2-Branch') as any;
      const r1Route = !!(r1 && r1.routes && r1.routes.length > 0);
      const r2Route = !!(r2 && r2.routes && r2.routes.length > 0);

      checks.push(
        {
          label: 'กำหนด Static Route บน R1-HQ ไปยัง 192.168.30.0/24',
          passed: r1Route,
          reason: r1Route ? 'พบ Static Route บน R1-HQ แล้ว' : 'ใช้คำสั่ง ip route 192.168.30.0 255.255.255.0 10.0.0.2'
        },
        {
          label: 'กำหนด Static Route ขากลับบน R2-Branch ไปยัง 192.168.10.0/24',
          passed: r2Route,
          reason: r2Route ? 'พบ Static Route ขากลับบน R2-Branch แล้ว' : 'ใช้คำสั่ง ip route 192.168.10.0 255.255.255.0 10.0.0.1'
        },
        {
          label: 'ส่ง Ping ข้ามเราเตอร์จาก HQ-PC ➔ Branch-SRV สำเร็จทั้งขาไปและขากลับ',
          passed: r1Route && r2Route,
          reason: r1Route && r2Route ? 'เส้นทางครบทั้งขาไปและขากลับ' : 'ตรวจสอบ Static Route บนเราเตอร์ทั้งสองตัว'
        }
      );
    } else if (labId === 'lab5') {
      title = 'Lab 05: VLANs, Access Ports & 802.1Q Trunking';
      const sw1 = findDev('SW1');
      const sw2 = findDev('SW2');
      const trunkOk = sw1?.ports['Fa0/1']?.mode === 'trunk' && sw2?.ports['Fa0/1']?.mode === 'trunk';

      checks.push(
        {
          label: 'ตั้งค่าพอร์ตเชื่อมต่อระหว่าง SW1 (Fa0/1) และ SW2 (Fa0/1) เป็น 802.1Q Trunk',
          passed: !!trunkOk,
          reason: trunkOk ? 'พอร์ต Fa0/1 ทั้งสองฝั่งเป็น 802.1Q Trunk' : 'ใช้คำสั่ง switchport mode trunk บน Fa0/1'
        },
        {
          label: 'ส่ง Ping ข้าม Switch ใน VLAN 10 เดียวกัน (HR-PC1 ➔ HR-PC2) สำเร็จ',
          passed: !!trunkOk,
          reason: trunkOk ? 'พอร์ต Trunk ส่งเฟรมข้ามสวิตช์ใน VLAN เดียวกันสำเร็จ' : 'ต้องเปิด Trunk Link ระหว่างสวิตช์'
        },
        {
          label: 'VLAN Isolation กั้นการสื่อสารระหว่าง VLAN 10 (HR-PC1) กับ VLAN 20 (Sales-PC1)',
          passed: true,
          reason: 'VLAN Isolation แยก Broadcast Domain สำเร็จ'
        }
      );
    } else if (labId === 'lab6' || labId === 'roas-vlan') {
      title = 'Lab 06: Inter-VLAN Routing (Router-on-a-Stick 802.1Q)';
      const sw = devices.find((d) => d.type === 'switch');
      const r1 = devices.find((d) => d.type === 'router');
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
          label: 'Ping ข้าม VLAN ระหว่าง HR-PC (VLAN10) ⟷ DB-SRV (VLAN20) สำเร็จ',
          passed: !!trunkOk && subIfOk,
          reason: trunkOk && subIfOk ? 'Router-on-a-Stick ส่งต่อแพ็กเก็ตข้าม VLAN สำเร็จ' : 'ต้องตั้งค่า Trunk และ Sub-interfaces'
        }
      );
    } else if (labId === 'lab7') {
      title = 'Lab 07: DHCPv4 Server, Excluded IP & DORA Process';
      const r1 = findDev('R1-DHCP') as any;
      const pc1 = findDev('Client-PC1');
      const pc2 = findDev('Client-PC2');
      const hasPool = !!(r1 && r1.dhcpPools && r1.dhcpPools.length > 0 && r1.dhcpExcluded && r1.dhcpExcluded.length > 0);
      const hasLeases = !!(pc1?.ports['Eth0']?.ip && pc2?.ports['Eth0']?.ip && pc1.ports['Eth0'].ip !== pc2.ports['Eth0'].ip);

      checks.push(
        {
          label: 'ตั้งค่า ip dhcp excluded-address และ ip dhcp pool บน R1-DHCP',
          passed: hasPool,
          reason: hasPool ? `ตั้งค่า DHCP Pool "${r1.dhcpPools[0].name}" เรียบร้อย` : 'กำหนด ip dhcp pool และ excluded-address'
        },
        {
          label: 'Client-PC1 และ Client-PC2 ขอรับ IP ผ่านกระบวนการ DORA สำเร็จ (IP ไม่ซ้ำกัน)',
          passed: hasLeases,
          reason: hasLeases ? 'ทั้งสองเครื่องได้รับ IP คนละชุดจาก DHCP Pool' : 'รัน ip address dhcp บน Client'
        },
        {
          label: 'ส่ง Ping จาก Client-PC1 ไปยัง Default Gateway (R1-DHCP) สำเร็จ',
          passed: hasPool && hasLeases,
          reason: hasPool && hasLeases ? 'Client สื่อสารกับ Default Gateway สำเร็จ' : 'ตรวจสอบ IP และ Gateway'
        }
      );
    } else if (labId === 'lab8' || labId === 'ospf-core') {
      title = 'Lab 08: Single-Area OSPFv2 Dynamic Routing';
      const r1 = findDev('R1-Edge') as any;
      const r2 = findDev('R2-Core') as any;
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
          label: 'Ping ข้ามเราเตอร์ OSPF จาก Edge-PC ➔ Cloud-SRV สำเร็จ',
          passed: ospfNetOk && adjOk,
          reason: ospfNetOk && adjOk ? 'OSPF สร้างตารางเราติ้งและส่งต่อแพ็กเก็ตสำเร็จ' : 'ตรวจสอบ OSPF Neighbor และการเชื่อมต่อ'
        }
      );
    } else if (labId === 'lab9') {
      title = 'Lab 09: Standard & Extended IPv4 ACL Firewall (Implicit Deny)';
      const r1 = findDev('R1-FW') as any;
      const hasBoundAcl = !!(r1 && r1.acls && r1.acls.length > 0 && Object.values(r1.ports).some((p: any) => p.aclIn || p.aclOut));
      const extAcl = r1?.acls?.find((a: any) => a.id === 100 || a.id === '100');
      const icmpMatch = extAcl ? AclEngine.evaluatePacket(extAcl, '192.168.10.10', '192.168.20.10', 'icmp') : null;
      const tcpMatch = extAcl ? AclEngine.evaluatePacket(extAcl, '192.168.10.10', '192.168.20.10', 'tcp', 80) : null;

      const icmpBlocked = icmpMatch ? icmpMatch.action === 'deny' : false;
      const tcpPermitted = tcpMatch ? tcpMatch.action === 'permit' : false;

      checks.push(
        {
          label: 'สร้าง Extended ACL 100 และผูกกับ Interface (ip access-group) บน R1-FW',
          passed: hasBoundAcl,
          reason: hasBoundAcl ? 'สร้างและผูก ACL กับพอร์ตเรียบร้อย' : 'สร้าง access-list 100 และใช้ ip access-group 100 in'
        },
        {
          label: 'กฎ ACL บล็อก ICMP Ping จาก Staff-PC ➔ Web-SRV',
          passed: icmpBlocked,
          reason: icmpBlocked ? 'ICMP Ping ถูกบล็อกโดยกฎ ACL' : 'ต้องมีกฎ deny icmp หรือใช้ Implicit Deny'
        },
        {
          label: 'กฎ ACL อนุญาตให้เปิดเว็บ HTTP (TCP Port 80) จาก Staff-PC ➔ Web-SRV สำเร็จ',
          passed: tcpPermitted,
          reason: tcpPermitted ? 'HTTP Port 80 ได้รับอนุญาตผ่าน ACL' : 'ต้องมีกฎ permit tcp ... eq 80'
        }
      );
    } else if (labId === 'lab10' || labId === 'acl-nat') {
      title = 'Lab 10: NAT/PAT Overload, Firewall ACL & ISP Cloud';
      const r1 = findDev('R1-Firewall') as any;
      const hasNat = !!(r1 && r1.natEnabled);
      const sess = hasNat ? NatEngine.processOutboundTranslation(r1, 'Gig0/0', 'Gig0/1', '192.168.10.10', 50000, 'tcp') : null;

      checks.push(
        {
          label: 'เปิดใช้งาน NAT Overload (Inside/Outside) บน R1-Firewall',
          passed: hasNat && !!sess?.translated,
          reason: hasNat ? 'แปลง Private IP เป็น Inside Global สำเร็จ' : 'เปิดใช้งาน ip nat inside source list ... overload'
        },
        {
          label: 'ตั้งกฎ ACL บล็อก ICMP Ping แต่เปิดให้เข้าเว็บ HTTP Port 80 ได้',
          passed: hasNat,
          reason: hasNat ? 'ACL ควบคุมการส่งผ่านทราฟฟิกถูกต้อง' : 'ตรวจสอบกฎ ACL'
        },
        {
          label: 'เปิดเข้าเว็บ HTTP (Port 80) จาก Corp-PC ไปยัง ISP-Cloud สำเร็จ',
          passed: hasNat && !!sess?.translated,
          reason: hasNat && !!sess?.translated ? 'PAT แปลงพอร์ตและเชื่อมต่อเว็บสำเร็จ' : 'ตรวจสอบการตั้งค่า NAT และ ACL'
        }
      );
    } else if (labId === 'lab11' || labId === 'troubleshoot') {
      title = 'Lab 11: Network Troubleshooting Challenge (ซ่อมระบบล่ม 3 จุด)';
      const r1 = findDev('R1-Gateway');
      const pc1 = findDev('PC1');
      const srv = findDev('Payroll-SRV');
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
          passed: g01Up && pcGwOk && srvIpOk,
          reason: g01Up && pcGwOk && srvIpOk ? 'ซ่อมแซมระบบครบ 3 จุด ทราฟฟิกผ่านฉลุย' : 'ยังมีจุดที่ตั้งค่าไม่ถูกต้อง'
        }
      );
    } else if (labId === 'lab12') {
      title = 'Lab 12: Integrated Enterprise Network (Capstone Lab)';
      const sw = findDev('SW-Core');
      const r1 = findDev('R1-HQ') as any;
      const r2 = findDev('R2-Edge') as any;
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
          label: 'WAN & NAT: ส่ง HTTP ข้าม VLAN ➔ OSPF ➔ PAT Overload ไปยัง ISP-Server สำเร็จ',
          passed: swTrunk && ospfOk && natOk,
          reason: swTrunk && ospfOk && natOk ? 'ระบบเชื่อมต่อครบวงจรทั้งองค์กร' : 'ตรวจสอบการตั้งค่าทั้งหมด'
        }
      );
    } else {
      checks.push({
        label: 'มีอุปกรณ์และสายเชื่อมต่อครบถ้วน',
        passed: devices.length >= 2 && cables.length >= 1,
        reason: devices.length >= 2 && cables.length >= 1 ? 'อุปกรณ์และสายพร้อมใช้งาน' : 'กรุณาวางอุปกรณ์และเชื่อมสาย'
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
