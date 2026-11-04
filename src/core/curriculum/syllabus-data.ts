import { PracticalLab } from '../types/lab';

export interface CourseModule {
  id: string;
  number: string;
  topicEn: string;
  title: string;
  badge: string;
  color?: string;
  netacadRef?: string;
  presetLab?: string;
  theorySummary: string;
  simScope?: { authentic: string; simplified: string };
  examTips: string[];
  cheatSheet: Array<{ cmd: string; desc: string }>;
  steps?: Array<{
    title?: string;
    desc?: string;
    device?: string;
    cmd?: string;
    expected?: string;
    verification?: string;
    match?: any;
    explain?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export const NETACAD_LESSONS: CourseModule[] = [
  {
    "id": "ch01-network-layer",
    "number": "บทที่ 01",
    "topicEn": "Network Layer",
    "title": "IP Packet, ICMP & Traceroute",
    "badge": "OSI Layer 3",
    "color": "cyan",
    "presetLab": "static-route",
    "theorySummary": "\n                <b>หน้าที่หลักของ Network Layer (OSI Layer 3):</b><br>\n                • <b>Addressing:</b> กำหนดที่อยู่แบบ Logical (IP Address) เพื่อระบุต้นทาง (Source IP) และปลายทาง (Destination IP)<br>\n                • <b>Encapsulation:</b> ห่อหุ้ม Transport Segment เป็น <b>IP Packet</b> พร้อมใส่หัวข้อมูลสำคัญ เช่น <b>TTL (Time-to-Live)</b> ซึ่งจะลดลงทีละ 1 ทุกครั้งที่ผ่าน Router เพื่อป้องกัน Routing Loop<br>\n                • <b>Routing:</b> เราเตอร์เลือกเส้นทางที่ดีที่สุดจากตาราง Routing Table เพื่อส่งแพ็กเก็ตข้ามเครือข่าย\n            ",
    "examTips": [
      "ค่า TTL (Time-to-Live) ลดลงทีละ 1 ทุกครั้งที่ผ่าน Router (Layer 3) แต่ไม่ลดเมื่อผ่าน Switch (Layer 2)",
      "Ping ใช้โปรโตคอล ICMP Echo Request (Type 8) และรับกลับด้วย ICMP Echo Reply (Type 0)",
      "Traceroute ใช้การส่งแพ็กเก็ตโดยตั้ง TTL=1, 2, 3... เพื่อให้เราเตอร์แต่ละ Hop ตอบ ICMP Time Exceeded กลับมา"
    ],
    "cheatSheet": [
      {
        "cmd": "ping 192.168.20.10",
        "desc": "ทดสอบการเชื่อมต่อระดับ Layer 3 ด้วย ICMP Echo"
      },
      {
        "cmd": "traceroute 192.168.20.10",
        "desc": "ตรวจสอบรายชื่อ Router ทุก Hop ที่แพ็กเก็ตวิ่งผ่าน"
      },
      {
        "cmd": "show ip route",
        "desc": "ตรวจสอบตารางเส้นทาง (Routing Table) บน Router"
      }
    ],
    "steps": [
      {
        "device": "HQ-PC",
        "cmd": "ping 192.168.30.100",
        "match": {},
        "explain": "ทดสอบส่ง ICMP Echo Request จาก HQ-PC ข้าม Router 2 ตัวไปยัง Branch-SRV (192.168.30.100)"
      },
      {
        "device": "HQ-PC",
        "cmd": "traceroute 192.168.30.100",
        "match": {},
        "explain": "ใช้คำสั่ง traceroute เพื่อไล่ดู IP ของ Router ทีละ Hop (R1-HQ 192.168.10.1 ➔ R2-Branch 10.0.0.2 ➔ 192.168.30.100)"
      },
      {
        "device": "R1-HQ",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-HQ"
      },
      {
        "device": "R1-HQ",
        "cmd": "show ip route",
        "match": {},
        "explain": "ตรวจสอบตาราง Routing Table ดูความแตกต่างระหว่าง C (Connected) และ S (Static Route)"
      }
    ]
  },
  {
    "id": "ch02-arp",
    "number": "บทที่ 02",
    "topicEn": "Address Resolution",
    "title": "ARP & Neighbor Discovery",
    "badge": "L2 ⟷ L3",
    "color": "emerald",
    "presetLab": "lan",
    "theorySummary": "\n                <b>Address Resolution Protocol (ARP):</b><br>\n                • เมื่อเครื่องต้นทางต้องการส่งข้อมูลไปหา IP ในวงแลนเดียวกัน แต่ยังไม่รู้ <b>MAC Address</b> ปลายทาง จะส่ง <b>ARP Request</b> แบบ <b>Broadcast (Dst MAC: FFFF.FFFF.FFFF)</b> ไปถามทุกเครื่องใน VLAN<br>\n                • เครื่องที่เป็นเจ้าของ IP นั้นจะตอบกลับด้วย <b>ARP Reply (Unicast)</b> พร้อมแจ้ง MAC Address ของตน แล้วบันทึกลงใน <b>ARP Table (ARP Cache)</b><br>\n                • หากปลายทางอยู่คนละวงแลน เครื่องจะทำ ARP ขอ MAC Address ของ <b>Default Gateway</b> แทน!\n            ",
    "examTips": [
      "ARP Request ส่งแบบ Broadcast (FFFF.FFFF.FFFF) แต่ ARP Reply ตอบกลับแบบ Unicast",
      "ใน IPv6 จะไม่ใช้ ARP แต่ใช้ ICMPv6 Neighbor Discovery (NS / NA) แทน",
      "หากส่งข้อมูลข้ามวงแลน Destination MAC ในเฟรม Layer 2 จะเป็น MAC ของ Default Gateway เสมอ"
    ],
    "cheatSheet": [
      {
        "cmd": "arp -a",
        "desc": "ดูตาราง ARP Cache บนเครื่อง PC หรืออุปกรณ์"
      },
      {
        "cmd": "show ip arp",
        "desc": "ดูตารางการจับคู่ IP Address กับ Hardware MAC Address บน Cisco IOS"
      },
      {
        "cmd": "clear arp-cache",
        "desc": "ล้างตาราง ARP Cache เพื่อให้เรียนรู้ใหม่"
      }
    ],
    "steps": [
      {
        "device": "PC1",
        "cmd": "arp -a",
        "match": {},
        "explain": "ตรวจสอบตาราง ARP Table บน PC1 เพื่อดูรายการจับคู่ IP Address คู่กับ MAC Address (ARPA)"
      },
      {
        "device": "PC1",
        "cmd": "ping 192.168.1.100",
        "match": {},
        "explain": "ส่ง Ping ไปยัง File-SRV (192.168.1.100) เพื่อให้เกิดการค้นหา ARP และส่งข้อมูลผ่าน Switch"
      },
      {
        "device": "SW1-Access",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนสวิตช์ SW1-Access"
      },
      {
        "device": "SW1-Access",
        "cmd": "show ip arp",
        "match": {},
        "explain": "ตรวจสอบตาราง ARP บนอุปกรณ์เครือข่าย"
      }
    ]
  },
  {
    "id": "ch03-transport-layer",
    "number": "บทที่ 03",
    "topicEn": "Transport Layer",
    "title": "TCP/UDP Port & 3-Way Handshake",
    "badge": "OSI Layer 4",
    "color": "purple",
    "presetLab": "acl-nat",
    "theorySummary": "\n                <b>Transport Layer (OSI Layer 4):</b><br>\n                • <b>TCP (Transmission Control Protocol):</b> เชื่อมต่อแบบ Connection-oriented เชื่อถือได้ ต้องทำ <b>3-Way Handshake (1. SYN ➔ 2. SYN-ACK ➔ 3. ACK)</b> ก่อนส่งข้อมูล เช่น <b>HTTP (Port 80), HTTPS (443), SSH (22)</b><br>\n                • <b>UDP (User Datagram Protocol):</b> แบบ Connectionless ส่งเร็วแต่ไม่ยืนยันการรับ เช่น <b>DNS (Port 53), DHCP (Port 67/68)</b>\n            ",
    "examTips": [
      "TCP 3-Way Handshake มี 3 ขั้นตอน: SYN ➔ SYN-ACK ➔ ACK",
      "Well-Known Ports ที่ออกสอบบ่อย: FTP (20/21), SSH (22), Telnet (23), DNS (53), DHCP (67/68), HTTP (80), HTTPS (443)",
      "สามารถกดปุ่ม \"🔍 OSI 7-Layer\" หลังส่ง HTTP เพื่อดู TCP Handshake แบบ Wireshark ได้ทันที"
    ],
    "cheatSheet": [
      {
        "cmd": "http 203.0.113.8",
        "desc": "จำลองการทำ TCP 3-Way Handshake (Port 80) และดึงหน้าเว็บ HTTP GET"
      },
      {
        "cmd": "ping 203.0.113.8",
        "desc": "ทดสอบส่ง ICMP (ซึ่งในแล็บที่ 7 จะถูกบล็อกด้วย ACL แต่เปิดเฉพาะ TCP Port 80)"
      }
    ],
    "steps": [
      {
        "device": "Corp-PC",
        "cmd": "http 203.0.113.8",
        "match": {},
        "explain": "จำลองการเชื่อมต่อ TCP Port 80 (SYN ➔ SYN-ACK ➔ ACK) และส่งคำขอ HTTP GET ไปยัง ISP-Cloud (203.0.113.8)"
      },
      {
        "device": "Corp-PC",
        "cmd": "ping 203.0.113.8",
        "match": {},
        "explain": "เปรียบเทียบการส่ง ICMP Ping ไปที่ 203.0.113.8 (จะพบว่า Firewall บล็อก ICMP แต่ยอมให้ TCP Port 80 ผ่านได้!)"
      }
    ]
  },
  {
    "id": "ch04-ipv4-subnetting",
    "number": "บทที่ 04",
    "topicEn": "IPv4 Addressing",
    "title": "Subnetting, VLSM & CIDR",
    "badge": "Subnetting",
    "color": "amber",
    "presetLab": "troubleshoot",
    "theorySummary": "\n                <b>การคำนวณ IPv4 Subnetting, CIDR และ VLSM:</b><br>\n                • <b>CIDR (/Prefix):</b> จำนวนบิตที่เป็นเลข 1 ใน Subnet Mask เช่น <code>/24</code> = <code>255.255.255.0</code> (เหลือบิตโฮสต์ $h = 32 - 24 = 8$ บิต)<br>\n                • <b>สูตรจำนวนเครื่อง (Usable Hosts):</b> $2^h - 2$ (หัก Network Address ใบแรก และ Broadcast Address ใบสุดท้ายออก)<br>\n                • <b>VLSM:</b> การนำ Subnet มาซอยย่อยตามขนาดที่ใช้งานจริง เช่น ลิงก์เชื่อมระหว่าง Router 2 ตัวใช้แค่ <code>/30</code> ($2^2 - 2 = 2$ โฮสต์) เพื่อประหยัด IP\n            ",
    "examTips": [
      "/24 = 254 เครื่อง | /25 = 126 เครื่อง | /26 = 62 เครื่อง | /27 = 30 เครื่อง | /28 = 14 เครื่อง | /30 = 2 เครื่อง",
      "กดแท็บ \"🧮 เครื่องคิดเลข Subnet & VLSM\" ด้านบนเพื่อฝึกคำนวณโจทย์สอบได้ทันที!",
      "ในแล็บนี้ Server1 ตั้ง IP ผิดวง (192.168.50.100) ต้องแก้ให้ตรงกับวง 192.168.20.0/24 ของ Router!"
    ],
    "cheatSheet": [
      {
        "cmd": "interface Eth0",
        "desc": "เข้าสู่พอร์ตเครือข่ายของเครื่อง Server"
      },
      {
        "cmd": "ip address 192.168.20.100 255.255.255.0",
        "desc": "กำหนด IPv4 และ Subnet Mask /24 ให้อยู่ในวงเดียวกับ Gateway (.20.1)"
      }
    ],
    "steps": [
      {
        "device": "Payroll-SRV",
        "cmd": "enable",
        "match": {},
        "explain": "เปิด CLI ของเครื่อง Payroll-SRV แล้วเข้าสู่โหมด Privileged (#)"
      },
      {
        "device": "Payroll-SRV",
        "cmd": "configure terminal",
        "match": {},
        "explain": "เข้าสู่โหมด Global Configuration (config)#"
      },
      {
        "device": "Payroll-SRV",
        "cmd": "interface Eth0",
        "match": {},
        "explain": "เลือกพอร์ต Eth0 ของ Payroll-SRV ที่ตอนนี้ตั้ง IP ผิดวงอยู่ (192.168.50.100)"
      },
      {
        "device": "Payroll-SRV",
        "cmd": "ip address 192.168.20.100 255.255.255.0",
        "match": {},
        "explain": "แก้ IP Address ให้อยู่ใน Subnet 192.168.20.0/24 ตรงกับขา Gig0/1 ของ Router"
      }
    ]
  },
  {
    "id": "ch05-ipv6",
    "number": "บทที่ 05",
    "topicEn": "IPv6 Addressing",
    "title": "IPv6 Structure, SLAAC & DHCPv6",
    "badge": "128-bit IPv6",
    "color": "sky",
    "presetLab": "subnets",
    "theorySummary": "\n                <b>โครงสร้าง IPv6 (128 บิต - เลขฐานสิบหก 8 กลุ่ม):</b><br>\n                • <b>กฎการย่อ IPv6:</b> (1) ตัดเลข 0 นำหน้าในแต่ละกลุ่มออกได้ เช่น <code>0db8</code> ➔ <code>db8</code> และ (2) ยุบกลุ่มที่เป็น 0 ติดกันเป็น <code>::</code> ได้ <b>เพียงครั้งเดียว</b> ใน 1 ที่อยู่<br>\n                • <b>ประเภทของ IPv6:</b> <b>Global Unicast</b> (<code>2000::/3</code> เช่น <code>2001:db8::/64</code>), <b>Link-Local</b> (<code>FE80::/10</code> ใช้คุยในลิงก์เดียวกัน), <b>Loopback</b> (<code>::1/128</code>)<br>\n                • <b>SLAAC:</b> เครื่องลูกข่ายสร้าง IPv6 64-bit อัตโนมัติจาก Router Advertisement (RA) โดยไม่ต้องพึ่ง DHCP Server!\n            ",
    "examTips": [
      "เครื่องหมาย :: ใช้ยุบศูนย์ต่อเนื่องได้แค่ 1 จุดเท่านั้น เพื่อไม่ให้ขนาดบิตกำกวม",
      "ต้องพิมพ์คำสั่ง \"ipv6 unicast-routing\" บน Router ก่อนเสมอ จึงจะทำหน้าที่ส่งต่อแพ็กเก็ต IPv6 และแจก SLAAC ได้",
      "คำสั่ง \"ipv6 address autoconfig\" บนลูกข่าย ใช้รับ IPv6 อัตโนมัติผ่านกลไก SLAAC"
    ],
    "cheatSheet": [
      {
        "cmd": "ipv6 unicast-routing",
        "desc": "เปิดใช้งานการทำ Routing สำหรับ IPv6 บน Router"
      },
      {
        "cmd": "ipv6 address 2001:db8:10::1/64",
        "desc": "กำหนดที่อยู่ IPv6 Global Unicast ให้พอร์ต"
      },
      {
        "cmd": "ipv6 address autoconfig",
        "desc": "รับที่อยู่ IPv6 อัตโนมัติด้วย SLAAC"
      },
      {
        "cmd": "show ipv6 interface brief",
        "desc": "ตรวจสอบที่อยู่ IPv6 (Link-Local & Global Unicast) บนทุกพอร์ต"
      }
    ],
    "steps": [
      {
        "device": "R1-Core",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-Core"
      },
      {
        "device": "R1-Core",
        "cmd": "configure terminal",
        "match": {},
        "explain": "เข้าสู่โหมด Global Configuration (config)#"
      },
      {
        "device": "R1-Core",
        "cmd": "ipv6 unicast-routing",
        "match": {},
        "explain": "เปิดใช้งาน IPv6 Unicast Routing บน R1-Core"
      },
      {
        "device": "R1-Core",
        "cmd": "interface Gig0/0",
        "match": {},
        "explain": "เข้าไปที่พอร์ต Gig0/0 ของ R1-Core"
      },
      {
        "device": "R1-Core",
        "cmd": "ipv6 address 2001:db8:10::1/64",
        "match": {},
        "explain": "กำหนดที่อยู่ IPv6 Global Unicast 2001:db8:10::1/64 ให้ขา Gig0/0"
      },
      {
        "device": "R1-Core",
        "cmd": "do show ipv6 interface brief",
        "match": {},
        "explain": "ตรวจสอบสถานะ IPv6 ทั้ง Link-Local (FE80::1) และ Global Unicast บน R1-Core"
      }
    ]
  },
  {
    "id": "ch06-switch-concepts",
    "number": "บทที่ 06",
    "topicEn": "Switches Concepts",
    "title": "MAC Table, CAM Table & Switching",
    "badge": "OSI Layer 2",
    "color": "indigo",
    "presetLab": "lan",
    "theorySummary": "\n                <b>กระบวนการทำงานของ Layer 2 Switch (Switching Process):</b><br>\n                1. <b>Learning (เรียนรู้):</b> เมื่อเฟรมวิ่งเข้าพอร์ต สวิตช์จะอ่าน <b>Source MAC Address</b> แล้วจดบันทึกลงตาราง <b>CAM / MAC Address Table</b> ว่าอยู่พอร์ตใด<br>\n                2. <b>Flooding (กระจาย):</b> หากอ่าน <b>Destination MAC</b> แล้วไม่พบในตาราง (Unknown Unicast) หรือเป็น Broadcast (<code>FFFF.FFFF.FFFF</code>) สวิตช์จะส่งออกทุกพอร์ตใน VLAN เดียวกัน ยกเว้นพอร์ตที่รับเข้ามา<br>\n                3. <b>Forwarding (ส่งตรง):</b> หากพบ Destination MAC ในตารางแล้ว จะส่งออกไปเฉพาะพอร์ตปลายทางพอร์ตเดียวเท่านั้น\n            ",
    "examTips": [
      "Switch เรียนรู้ตำแหน่งอุปกรณ์จาก Source MAC Address เสมอ แต่ตัดสินใจส่งออกโดยดูจาก Destination MAC Address",
      "Switch แยก Collision Domain ในทุกๆ พอร์ต แต่ทุกพอร์ตใน VLAN เดียวกันยังอยู่ใน Broadcast Domain เดียวกัน",
      "Router เท่านั้นที่ทำหน้าที่กั้น Broadcast Domain (หรือต้องแบ่ง VLAN บน Switch)"
    ],
    "cheatSheet": [
      {
        "cmd": "show mac address-table",
        "desc": "แสดงตาราง CAM / MAC Address Table ที่สวิตช์เรียนรู้แบบ DYNAMIC"
      },
      {
        "cmd": "show ip interface brief",
        "desc": "ตรวจสอบสถานะพอร์ตทั้งหมดบนสวิตช์ว่า Up หรือ Down"
      }
    ],
    "steps": [
      {
        "device": "SW1-Access",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนสวิตช์ SW1-Access"
      },
      {
        "device": "SW1-Access",
        "cmd": "show mac address-table",
        "match": {},
        "explain": "ดูตาราง MAC Address Table (CAM Table) ว่าสวิตช์เรียนรู้ MAC ของ PC1, PC2 และ File-SRV บนพอร์ตใดบ้าง"
      },
      {
        "device": "SW1-Access",
        "cmd": "show ip interface brief",
        "match": {},
        "explain": "ตรวจสอบสถานะ Physical และ Line Protocol ของพอร์ต Fa0/1 - Fa0/4 บนสวิตช์"
      }
    ]
  },
  {
    "id": "ch07-basic-switch-config",
    "number": "บทที่ 07",
    "topicEn": "Basic Switch & Device Config",
    "title": "CLI Security, SSH & Management VLAN",
    "badge": "IOS Security",
    "color": "teal",
    "presetLab": "lan",
    "theorySummary": "\n                <b>การตั้งค่าพื้นฐานและความปลอดภัยของสวิตช์ (Basic Switch Configuration):</b><br>\n                • <b>Hostname & Passwords:</b> ตั้งชื่อด้วย <code>hostname</code>, ตั้งรหัสผ่านเข้าโหมด Privileged แบบเข้ารหัส MD5 ด้วย <code>enable secret</code> และเข้ารหัสรหัสผ่านทั้งหมดในไฟล์ Config ด้วย <code>service password-encryption</code><br>\n                • <b>SSH & VTY Lines:</b> ตั้งรหัสผ่านรีโมตเข้าอุปกรณ์ที่ <code>line vty 0 4</code> และบังคับใช้ SSH แทน Telnet ด้วย <code>transport input ssh</code><br>\n                • <b>Management VLAN (SVI):</b> สวิตช์ Layer 2 ไม่มีพอร์ตใส่ IP โดยตรง จึงต้องใส่ IP บนพอร์ตเสมือน <code>interface vlan 1</code> เพื่อให้รีโมตมาจัดการสวิตช์ได้\n            ",
    "examTips": [
      "enable secret จะปลอดภัยกว่า enable password เพราะเข้ารหัสแบบ Hash (Type 5/8/9) เสมอ",
      "หากต้องการให้ Switch รีโมตข้ามวงแลนได้ ต้องตั้งทั้ง interface vlan 1 (ip address + no shut) และ ip default-gateway!",
      "Telnet (Port 23) ส่งข้อมูลเป็น Plaintext ไม่ปลอดภัย จึงควรใช้ SSH (Port 22) ด้วยคำสั่ง transport input ssh"
    ],
    "cheatSheet": [
      {
        "cmd": "hostname SW1-Core",
        "desc": "เปลี่ยนชื่ออุปกรณ์สวิตช์"
      },
      {
        "cmd": "enable secret class",
        "desc": "ตั้งรหัสผ่านเข้าโหมด Privileged (#) แบบเข้ารหัส"
      },
      {
        "cmd": "service password-encryption",
        "desc": "เข้ารหัสรหัสผ่านทั้งหมดใน show running-config"
      },
      {
        "cmd": "line vty 0 4",
        "desc": "เข้าสู่โหมดตั้งค่าช่องทางรีโมต Virtual Terminal (SSH/Telnet)"
      },
      {
        "cmd": "transport input ssh",
        "desc": "อนุญาตให้รีโมตเข้าอุปกรณ์ผ่านโปรโตคอล SSH เท่านั้น"
      },
      {
        "cmd": "interface vlan 1",
        "desc": "เข้าสู่พอร์ตเสมือน Management VLAN 1 ของสวิตช์เพื่อกำหนด IP"
      }
    ],
    "steps": [
      {
        "device": "SW1-Access",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บน SW1-Access"
      },
      {
        "device": "SW1-Access",
        "cmd": "configure terminal",
        "match": {},
        "explain": "เข้าสู่โหมด Global Configuration (config)#"
      },
      {
        "device": "SW1-Access",
        "cmd": "enable secret class",
        "match": {},
        "explain": "ตั้งรหัสผ่านสำหรับเข้าโหมด Privileged EXEC แบบเข้ารหัส (enable secret)"
      },
      {
        "device": "SW1-Access",
        "cmd": "service password-encryption",
        "match": {},
        "explain": "เปิดบริการเข้ารหัสรหัสผ่านทั้งหมดในไฟล์ Configuration ไม่ให้เห็นเป็นข้อความธรรมดา"
      },
      {
        "device": "SW1-Access",
        "cmd": "line vty 0 4",
        "match": {},
        "explain": "เข้าสู่โหมดตั้งค่าสายรีโมตเสมือน VTY 0 ถึง 4 (config-line)#"
      },
      {
        "device": "SW1-Access",
        "cmd": "transport input ssh",
        "match": {},
        "explain": "กำหนดให้รับการเชื่อมต่อรีโมตผ่าน SSH เท่านั้นเพื่อความปลอดภัย"
      },
      {
        "device": "SW1-Access",
        "cmd": "interface vlan 1",
        "match": {},
        "explain": "เข้าสู่พอร์ตเสมือน Management VLAN 1 (SVI)"
      },
      {
        "device": "SW1-Access",
        "cmd": "ip address 192.168.1.2 255.255.255.0",
        "match": {},
        "explain": "กำหนด Management IP ให้สวิตช์เพื่อให้แอดมินรีโมตเข้ามาตั้งค่าได้"
      }
    ]
  },
  {
    "id": "ch08-vlans",
    "number": "บทที่ 08",
    "topicEn": "VLANs & Trunking",
    "title": "VLAN Concept, Trunk & Native VLAN",
    "badge": "802.1Q VLAN",
    "color": "purple",
    "presetLab": "roas-vlan",
    "theorySummary": "\n                <b>Virtual LAN (VLAN) & 802.1Q Trunking:</b><br>\n                • <b>VLAN:</b> การแบ่งกลุ่มพอร์ตบน Switch แบบ Logical เพื่อแยก <b>Broadcast Domain</b> ออกจากกัน เช่น แผนก Sales (VLAN 10) และ Engineering (VLAN 20) แม้เสียบสวิตช์ตัวเดียวกันก็จะไม่เห็น Broadcast ของกันและกัน<br>\n                • <b>Access Port:</b> พอร์ตที่ต่อกับเครื่องปลายทาง (PC/Server) รับส่งเฟรมแบบไม่มีป้าย Tag (Untagged) ของ VLAN เดียว<br>\n                • <b>Trunk Port (IEEE 802.1Q):</b> ท่อรวมสัญญาณระหว่าง Switch กับ Switch หรือ Switch กับ Router โดยแปะป้าย <b>4-Byte VLAN Tag</b> ไปกับเฟรม ยกเว้นเฟรมของ <b>Native VLAN</b> ที่จะไม่ถูกติดป้าย Tag\n            ",
    "examTips": [
      "มาตรฐานการติดป้าย VLAN Tag บนสาย Trunk คือ IEEE 802.1Q (ขนาด Tag 4 Bytes แทรกใน Ethernet Header)",
      "Native VLAN (ค่าเริ่มต้นคือ VLAN 1) คือ VLAN ที่วิ่งผ่านสาย Trunk โดยไม่มีการติดป้าย 802.1Q Tag — เพื่อความปลอดภัยมักเปลี่ยนเป็น VLAN อื่น เช่น VLAN 99",
      "ใช้คำสั่ง show vlan brief เพื่อดูพอร์ต Access และใช้ show interfaces trunk เพื่อดูพอร์ต Trunk"
    ],
    "cheatSheet": [
      {
        "cmd": "vlan 10",
        "desc": "สร้าง VLAN 10 ในฐานข้อมูล VLAN ของสวิตช์"
      },
      {
        "cmd": "name Sales",
        "desc": "ตั้งชื่อให้ VLAN (ในโหมด config-vlan)"
      },
      {
        "cmd": "switchport mode access",
        "desc": "ตั้งค่าพอร์ตเป็นโหมด Access สำหรับต่อเครื่องคอมพิวเตอร์"
      },
      {
        "cmd": "switchport access vlan 10",
        "desc": "กำหนดให้พอร์ต Access นั้นอยู่ในสมาชิก VLAN 10"
      },
      {
        "cmd": "switchport mode trunk",
        "desc": "ตั้งค่าพอร์ตเป็น 802.1Q Trunk เพื่อส่งผ่านหลาย VLAN"
      },
      {
        "cmd": "switchport trunk native vlan 99",
        "desc": "เปลี่ยน Native VLAN บนพอร์ต Trunk เป็น VLAN 99"
      }
    ],
    "steps": [
      {
        "device": "SW1-Trunk",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนสวิตช์ SW1-Trunk"
      },
      {
        "device": "SW1-Trunk",
        "cmd": "configure terminal",
        "match": {},
        "explain": "เข้าสู่โหมด Global Configuration (config)#"
      },
      {
        "device": "SW1-Trunk",
        "cmd": "vlan 10",
        "match": {},
        "explain": "เข้าสู่โหมดสร้างและตั้งค่า VLAN 10 (config-vlan)#"
      },
      {
        "device": "SW1-Trunk",
        "cmd": "name Sales",
        "match": {},
        "explain": "ตั้งชื่อ VLAN 10 ว่า \"Sales\""
      },
      {
        "device": "SW1-Trunk",
        "cmd": "interface Fa0/1",
        "match": {},
        "explain": "เข้าสู่พอร์ต Fa0/1 ซึ่งเป็นสายหลักที่เชื่อมต่อไปยังเราเตอร์ R1-ROAS"
      },
      {
        "device": "SW1-Trunk",
        "cmd": "switchport trunk native vlan 99",
        "match": {},
        "explain": "กำหนดให้ Native VLAN บนพอร์ต Trunk Fa0/1 เป็น VLAN 99 ตามมาตรฐานความปลอดภัย"
      },
      {
        "device": "SW1-Trunk",
        "cmd": "do show interfaces trunk",
        "match": {},
        "explain": "ตรวจสอบตาราง Trunk จะเห็นพอร์ต Fa0/1 ทำงานแบบ 802.1q และมี Native VLAN เป็น 99"
      }
    ]
  },
  {
    "id": "ch09-router-basic",
    "number": "บทที่ 09",
    "topicEn": "Basic Router Configuration",
    "title": "Router Interface, Static IP & no shut",
    "badge": "Router CLI",
    "color": "cyan",
    "presetLab": "troubleshoot",
    "theorySummary": "\n                <b>การตั้งค่าพอร์ตของ Router (Basic Router Configuration):</b><br>\n                • โดยค่าเริ่มต้น พอร์ตของ Cisco Router ทุกพอร์ตจะถูกปิดไว้ (<b>Administratively Down</b>) ต่างจาก Switch ที่เปิดพอร์ตให้อัตโนมัติ<br>\n                • การเปิดใช้งานพอร์ต Router ต้องทำ 3 ขั้นตอนเสมอ:<br>\n                  1. เลือกพอร์ต: <code>interface Gig0/1</code><br>\n                  2. กำหนด IP และ Mask: <code>ip address 192.168.20.1 255.255.255.0</code><br>\n                  3. สั่งเปิดพอร์ต: <code>no shutdown</code>\n            ",
    "examTips": [
      "หาก show ip interface brief แล้วขึ้นว่า \"administratively down\" แปลว่าลืมพิมพ์คำสั่ง no shutdown!",
      "ขาของ Router ที่ต่อเข้ากับวงแลนใด จะทำหน้าที่เป็น Default Gateway ของเครื่อง PC ในวงแลนนั้นเสมอ"
    ],
    "cheatSheet": [
      {
        "cmd": "show ip interface brief",
        "desc": "ดูสรุป IP Address และสถานะ Up/Down ของพอร์ตทั้งหมด"
      },
      {
        "cmd": "interface Gig0/1",
        "desc": "เข้าไปตั้งค่าพอร์ต GigabitEthernet 0/1"
      },
      {
        "cmd": "ip address 192.168.20.1 255.255.255.0",
        "desc": "กำหนด IP Address และ Subnet Mask ให้พอร์ต"
      },
      {
        "cmd": "no shutdown",
        "desc": "เปิดการทำงานของพอร์ตให้ไฟสถานะเปลี่ยนเป็นสีเขียว (Up)"
      }
    ],
    "steps": [
      {
        "device": "R1-Gateway",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-Gateway"
      },
      {
        "device": "R1-Gateway",
        "cmd": "show ip interface brief",
        "match": {},
        "explain": "ตรวจสอบสถานะพอร์ต จะเห็นว่าขา Gig0/1 ขึ้นสถานะ administratively down (ไฟสีแดงบนกระดาน)"
      },
      {
        "device": "R1-Gateway",
        "cmd": "configure terminal",
        "match": {},
        "explain": "เข้าสู่โหมด Global Configuration (config)#"
      },
      {
        "device": "R1-Gateway",
        "cmd": "interface Gig0/1",
        "match": {},
        "explain": "เลือกพอร์ต GigabitEthernet 0/1 ที่เชื่อมต่อไปยังฝั่ง Server"
      },
      {
        "device": "R1-Gateway",
        "cmd": "no shutdown",
        "match": {},
        "explain": "สั่งเปิดพอร์ต Gig0/1! สังเกตไฟพอร์ตบนกระดานจะเปลี่ยนจากสีแดงเป็นสีเขียวทันที"
      }
    ]
  },
  {
    "id": "ch10-routing-concepts",
    "number": "บทที่ 10",
    "topicEn": "Routing Concepts",
    "title": "Static Route, Default Route & OSPF",
    "badge": "L3 Routing",
    "color": "emerald",
    "presetLab": "ospf-core",
    "theorySummary": "\n                <b>หลักการหาเส้นทางของ Router (Routing Concepts):</b><br>\n                • เราเตอร์จะรู้จักเฉพาะวงแลนที่เสียบสายติดกับตัวมันโดยตรง (<b>Connected Route - C</b>) เท่านั้น หากต้องการส่งไปวงแลนอื่นที่อยู่ถัดไป ต้องสอนเส้นทางด้วยวิธีใดวิธีหนึ่ง:<br>\n                1. <b>Static Route (AD = 1):</b> แอดมินพิมพ์บอกเส้นทางเองด้วย <code>ip route [วงปลายทาง] [Mask] [Next-Hop IP]</code><br>\n                2. <b>Default Route (Gateway of Last Resort):</b> <code>ip route 0.0.0.0 0.0.0.0 [Next-Hop]</code> ใช้ส่งออกอินเทอร์เน็ตเมื่อไม่ตรงกับวงใดเลย<br>\n                3. <b>Dynamic Routing - OSPF (AD = 110):</b> เราเตอร์แลกเปลี่ยนเส้นทางกันเองอัตโนมัติและคำนวณเส้นทางที่สั้นที่สุดด้วยอัลกอริทึม Dijkstra SPF\n            ",
    "examTips": [
      "ค่า Administrative Distance (AD) ยิ่งน้อยยิ่งน่าเชื่อถือ: Connected = 0, Static = 1, EIGRP = 90, OSPF = 110, RIP = 120",
      "เมื่อมีหลายเส้นทางไปได้ เราเตอร์จะเลือกเส้นทางที่มี Prefix ยาวที่สุดก่อนเสมอ (Longest Prefix Match เช่น /26 ชนะ /24) ก่อนจะเปรียบเทียบค่า AD!",
      "ต้องตั้งทั้งขาไป (R1 ➔ R2) และขากลับ (R2 ➔ R1) เสมอ แพ็กเก็ตจึงจะ Ping ไป-กลับสำเร็จ"
    ],
    "cheatSheet": [
      {
        "cmd": "ip route 192.168.20.0 255.255.255.0 10.0.0.2",
        "desc": "เพิ่ม Static Route ไปยังวง .20.0/24 ผ่านขา Next-Hop 10.0.0.2"
      },
      {
        "cmd": "ip route 0.0.0.0 0.0.0.0 203.0.113.1",
        "desc": "ตั้งค่า Default Route (Quad-Zero) ออกสู่อินเทอร์เน็ต"
      },
      {
        "cmd": "router ospf 1",
        "desc": "เปิดโปรโตคอล OSPF Process ID 1"
      },
      {
        "cmd": "network 192.168.10.0 0.0.0.255 area 0",
        "desc": "ประกาศวงแลนเข้าสู่ OSPF Area 0 โดยใช้ Wildcard Mask"
      },
      {
        "cmd": "show ip ospf neighbor",
        "desc": "ตรวจสอบความสัมพันธ์เพื่อนบ้าน OSPF (สถานะ FULL/DR)"
      }
    ],
    "steps": [
      {
        "device": "R1-Edge",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-Edge"
      },
      {
        "device": "R1-Edge",
        "cmd": "show ip ospf neighbor",
        "match": {},
        "explain": "ตรวจสอบตาราง OSPF Neighbor ว่าจับคู่เพื่อนบ้านกับ R2-Core สำเร็จ (สถานะ FULL/DR) หรือไม่"
      },
      {
        "device": "R1-Edge",
        "cmd": "show ip route",
        "match": {},
        "explain": "ดูตาราง Routing จะเห็นตัวอักษร \"O\" (OSPF [110/2]) ที่เรียนรู้วง 172.16.1.0/24 จาก R2-Core อัตโนมัติ!"
      }
    ]
  },
  {
    "id": "ch11-intervlan",
    "number": "บทที่ 11 (5-Nov)",
    "topicEn": "Inter-VLAN Routing",
    "title": "Router-on-a-Stick & Layer 3 Switch",
    "badge": "5-Nov Topic",
    "color": "purple",
    "presetLab": "roas-vlan",
    "theorySummary": "\n                <b>การเชื่อมต่อข้าม VLAN (Inter-VLAN Routing) มี 2 สถาปัตยกรรมหลัก:</b><br>\n                1. <b>Router-on-a-Stick (ROAS):</b> ใช้สายแลน Trunk เส้นเดียวเชื่อมระหว่าง Switch กับ Router แล้วซอยพอร์ต Router ออกเป็นพอร์ตย่อย (<b>Sub-interfaces</b> เช่น <code>Gig0/0.10</code> และ <code>Gig0/0.20</code>) พร้อมติดคำสั่ง <code>encapsulation dot1Q [vlan-id]</code><br>\n                2. <b>Layer 3 Switch (Multilayer Switch SVI):</b> ประสิทธิภาพสูงกว่าในระดับองค์กร โดยเปิด <code>ip routing</code> บน Switch แล้วสร้างพอร์ตเสมือน <code>interface vlan 10</code> และ <code>interface vlan 20</code> เพื่อเป็น Gateway ในตัวสวิตช์เองเลย!\n            ",
    "examTips": [
      "ใน Router-on-a-Stick ต้องสั่ง encapsulation dot1Q <vlan> ก่อนจึงจะใส่ ip address บน Sub-interface ได้ และอย่าลืมสั่ง no shutdown ที่พอร์ตแม่ (Gig0/0) ด้วย!",
      "ใน Layer 3 Switch ต้องพิมพ์คำสั่ง \"ip routing\" ในโหมด Global Config เพื่อเปิดความสามารถในการส่งแพ็กเก็ตข้าม SVI VLAN",
      "ทั้ง 2 วิธีสามารถฝึกพิมพ์คำสั่งจริงได้ในแอปนี้ทันที!"
    ],
    "cheatSheet": [
      {
        "cmd": "interface Gig0/0.10",
        "desc": "[ROAS] สร้างพอร์ตย่อย Sub-interface สำหรับ VLAN 10 บน Router"
      },
      {
        "cmd": "encapsulation dot1Q 10",
        "desc": "[ROAS] ระบุให้พอร์ตย่อยนี้รับส่งเฟรมที่ติดป้าย 802.1Q VLAN 10"
      },
      {
        "cmd": "ip routing",
        "desc": "[L3 Switch] เปิดโหมด Layer 3 Inter-VLAN Routing บนสวิตช์"
      },
      {
        "cmd": "interface vlan 10",
        "desc": "[L3 Switch] สร้างพอร์ตเสมือน SVI สำหรับเป็น Gateway ของ VLAN 10"
      }
    ],
    "steps": [
      {
        "device": "R1-ROAS",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-ROAS"
      },
      {
        "device": "R1-ROAS",
        "cmd": "show ip interface brief",
        "match": {},
        "explain": "สังเกตพอร์ตย่อย Gig0/0.10 (192.168.10.1) และ Gig0/0.20 (192.168.20.1) ที่ทำงานอยู่บนสายกายภาพเส้นเดียว"
      },
      {
        "device": "R1-ROAS",
        "cmd": "configure terminal",
        "match": {},
        "explain": "เข้าสู่โหมด Global Configuration เพื่อทดลองสร้าง Sub-interface ใหม่สำหรับ VLAN 30 (Management)"
      },
      {
        "device": "R1-ROAS",
        "cmd": "interface Gig0/0.30",
        "match": {},
        "explain": "สร้างพอร์ตย่อย Sub-interface Gig0/0.30"
      },
      {
        "device": "R1-ROAS",
        "cmd": "encapsulation dot1Q 30",
        "match": {},
        "explain": "ผูกป้ายแท็ก IEEE 802.1Q VLAN 30 เข้ากับพอร์ตย่อยนี้"
      },
      {
        "device": "R1-ROAS",
        "cmd": "ip address 192.168.30.1 255.255.255.0",
        "match": {},
        "explain": "กำหนด Gateway IP 192.168.30.1/24 ให้กับ VLAN 30 เรียบร้อย!"
      }
    ]
  },
  {
    "id": "ch12-acl",
    "number": "บทที่ 12 (12-Nov)",
    "topicEn": "Access Control Lists",
    "title": "Standard ACL & Extended ACL Firewall",
    "badge": "12-Nov Topic",
    "color": "rose",
    "presetLab": "acl-nat",
    "theorySummary": "\n                <b>Access Control Lists (ACL) - กฎไฟร์วอลล์คัดกรองแพ็กเก็ตบน Router:</b><br>\n                • <b>Standard ACL (หมายเลข 1–99):</b> กรองจาก <b>Source IP</b> อย่างเดียวเท่านั้น (ควรวางไว้ <b>ใกล้ปลายทาง</b> ที่สุด เพื่อไม่ให้บล็อกการจราจรไปที่อื่นโดยไม่ตั้งใจ)<br>\n                • <b>Extended ACL (หมายเลข 100–199):</b> กรองละเอียดทั้ง <b>Protocol (ICMP/TCP/UDP/IP), Source IP, Destination IP และเลข Port (เช่น eq 80)</b> (ควรวางไว้ <b>ใกล้ต้นทาง</b> ที่สุด เพื่อประหยัดแบนด์วิดท์)<br>\n                • เราเตอร์ประมวลผลกฎจาก <b>บนลงล่าง (Top-Down)</b> เมื่อเจอกฎที่ตรงจะหยุดเช็คทันที และบรรทัดสุดท้ายมี <b>Implicit Deny Any</b> ซ่อนอยู่เสมอ!\n            ",
    "examTips": [
      "จำแม่นๆ สำหรับสอบ: Standard ACL (1-99) วางใกล้ Destination | Extended ACL (100-199) วางใกล้ Source",
      "ท้าย ACL ทุกชุดจะมีกฎที่มองไม่เห็นคือ \"deny ip any any\" (Implicit Deny) ดังนั้นต้องมีบรรทัด permit อย่างน้อย 1 บรรทัดเสมอ!",
      "ใช้คำสั่ง ip access-group <หมายเลข> in หรือ out ในโหมดพอร์ตเพื่อเปิดใช้งาน ACL"
    ],
    "cheatSheet": [
      {
        "cmd": "access-list 1 deny 192.168.10.50 0.0.0.0",
        "desc": "[Standard ACL] บล็อกทุกแพ็กเก็ตจากโฮสต์ 192.168.10.50"
      },
      {
        "cmd": "access-list 100 deny icmp any 8.8.8.8",
        "desc": "[Extended ACL] บล็อกเฉพาะการ Ping (ICMP) ไปยัง 8.8.8.8"
      },
      {
        "cmd": "access-list 100 permit ip any any",
        "desc": "[Extended ACL] อนุญาตทราฟฟิกอื่นๆ ที่เหลือทั้งหมด (เช่น HTTP Port 80)"
      },
      {
        "cmd": "ip access-group 100 in",
        "desc": "นำ ACL 100 ไปผูกกับพอร์ตขาเข้า (Inbound) ของ Router"
      },
      {
        "cmd": "show access-lists",
        "desc": "ตรวจสอบรายการกฎ ACL และจำนวนแพ็กเก็ตที่ตรงเงื่อนไข (matches)"
      }
    ],
    "steps": [
      {
        "device": "R1-Firewall",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ไฟร์วอลล์ R1-Firewall"
      },
      {
        "device": "R1-Firewall",
        "cmd": "show access-lists",
        "match": {},
        "explain": "ตรวจสอบกฎ Extended ACL 100 ที่ตั้งไว้ (บรรทัด 10 บล็อก ICMP ไป 203.0.113.8 และบรรทัด 20 อนุญาต TCP HTTP)"
      },
      {
        "device": "Corp-PC",
        "cmd": "ping 203.0.113.8",
        "match": {},
        "explain": "ทดสอบ Ping จาก Corp-PC ไปที่ 203.0.113.8 จะเห็นผลลัพธ์ U.U.U (ถูกบล็อกโดย ACL 100!)"
      },
      {
        "device": "Corp-PC",
        "cmd": "http 203.0.113.8",
        "match": {},
        "explain": "ทดสอบเข้าเว็บ HTTP (TCP Port 80) ไปที่ 203.0.113.8 จะผ่านกฎข้อที่ 20 ได้รับหน้าเว็บ 200 OK!"
      }
    ]
  },
  {
    "id": "ch13-nat",
    "number": "บทที่ 13 (19-Nov)",
    "topicEn": "Network Address Translation",
    "title": "Static NAT, Dynamic NAT & PAT Overload",
    "badge": "19-Nov Topic",
    "color": "amber",
    "presetLab": "acl-nat",
    "theorySummary": "\n                <b>Network Address Translation (NAT) - การแปลง Private IP เป็น Public IP:</b><br>\n                • <b>4 คำศัพท์สำคัญที่ออกสอบเสมอ:</b><br>\n                  - <b>Inside Local:</b> Private IP ของเครื่องในองค์กรก่อนแปลง (เช่น <code>192.168.10.25</code>)<br>\n                  - <b>Inside Global:</b> Public IP ขององค์กรหลังแปลงแล้ว เพื่อใช้ออกอินเทอร์เน็ต (เช่น <code>203.0.113.1</code>)<br>\n                  - <b>Outside Local / Outside Global:</b> Public IP ของเซิร์ฟเวอร์ปลายทางบนอินเทอร์เน็ต (เช่น <code>203.0.113.8</code>)<br>\n                • <b>Static NAT (1:1):</b> จับคู่ Private IP กับ Public IP ตายตัว เหมาะสำหรับเปิด Web Server ในองค์กรให้คนนอกเข้าถึง<br>\n                • <b>PAT (NAT Overload - Many:1):</b> เครื่องในองค์กรหลายร้อยเครื่องแชร์ Public IP เดียวกันโดยแยกแยะด้วย <b>หมายเลข Port</b>\n            ",
    "examTips": [
      "จำคำศัพท์: Inside = ฝั่งองค์กรของเรา, Outside = ฝั่งอินเทอร์เน็ต | Local = มองเห็นจากข้างใน (Private IP), Global = มองเห็นจากโลกภายนอก (Public IP)",
      "ต้องกำหนดขา Router ฝั่ง LAN เป็น \"ip nat inside\" และขาฝั่ง WAN/ISP เป็น \"ip nat outside\" เสมอ",
      "คำสั่งที่ทำให้แชร์ 1 Public IP ได้หลายเครื่องคือคีย์เวิร์ดคำว่า \"overload\" ท้ายคำสั่ง!"
    ],
    "cheatSheet": [
      {
        "cmd": "ip nat inside",
        "desc": "กำหนดให้พอร์ตฝั่ง LAN (เช่น Gig0/0) เป็นฝั่งภายในองค์กร"
      },
      {
        "cmd": "ip nat outside",
        "desc": "กำหนดให้พอร์ตฝั่ง WAN/ISP (เช่น Gig0/1) เป็นฝั่งออกอินเทอร์เน็ต"
      },
      {
        "cmd": "ip nat inside source static 192.168.10.25 203.0.113.50",
        "desc": "[Static NAT] แปลง IP แบบ 1 ต่อ 1 สำหรับเซิร์ฟเวอร์"
      },
      {
        "cmd": "ip nat inside source list 1 interface Gig0/1 overload",
        "desc": "[PAT Overload] แปลง Private IP ทั้งวงให้ออกผ่าน Public IP ขา Gig0/1"
      },
      {
        "cmd": "show ip nat translations",
        "desc": "ดูตารางการแปลง IP (Inside Global ⟷ Inside Local)"
      }
    ],
    "steps": [
      {
        "device": "R1-Firewall",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-Firewall"
      },
      {
        "device": "R1-Firewall",
        "cmd": "configure terminal",
        "match": {},
        "explain": "เข้าสู่โหมด Global Configuration (config)#"
      },
      {
        "device": "R1-Firewall",
        "cmd": "ip nat inside source static 192.168.10.25 203.0.113.10",
        "match": {},
        "explain": "ทดลองตั้งค่า Static NAT จับคู่ Inside Local (192.168.10.25) เข้ากับ Inside Global (203.0.113.10)"
      },
      {
        "device": "R1-Firewall",
        "cmd": "do show ip nat translations",
        "match": {},
        "explain": "ตรวจสอบตาราง NAT Translations จะเห็นการจับคู่ Inside Global กับ Inside Local ทันที!"
      }
    ]
  },
  {
    "id": "ch14-stp-etherchannel",
    "number": "บทที่ 14 (SRWE)",
    "topicEn": "STP & EtherChannel",
    "title": "Spanning Tree Protocol & Link Aggregation",
    "badge": "CCNA-SRWE M5-6",
    "color": "sky",
    "presetLab": "lab5",
    "theorySummary": "\n                <b>Spanning Tree Protocol (IEEE 802.1D / Rapid PVST+) & EtherChannel:</b><br>\n                • <b>STP ป้องกัน Layer 2 Broadcast Storm:</b> เมื่อต่อสายสำรองระหว่าง Switch หลายเส้น STP จะเลือก <b>Root Bridge</b> (สวิตช์ที่มีค่า <b>Bridge Priority</b> ต่ำสุด ค่าเริ่มต้นคือ <code>32768</code>) และบล็อกพอร์ตสำรองไว้ในสถานะ <b>BLK (Alternate)</b><br>\n                • <b>PortFast & BPDU Guard:</b> ใช้คำสั่ง <code>spanning-tree portfast</code> บนพอร์ตที่ต่อ PC เพื่อให้พอร์ตขึ้นสถานะ Forwarding ทันที<br>\n                • <b>EtherChannel (IEEE 802.3ad LACP / Cisco PAgP):</b> รวมพอร์ตกายภาพหลายเส้นเป็นท่อเสมือน <code>Port-channel 1 (Po1)</code> ทำให้ได้แบนด์วิดท์เพิ่มขึ้นโดยที่ STP มองว่าเป็นลิงก์เดียว ไม่ถูกบล็อก!\n            ",
    "examTips": [
      "สวิตช์ที่มี Bridge ID (Priority + MAC) ต่ำที่สุดจะชนะการเลือกตั้งเป็น Root Bridge เสมอ (ปรับด้วย spanning-tree vlan 1 root primary หรือ priority 4096)",
      "LACP ใช้โหมด active / passive ส่วน PAgP ของ Cisco ใช้โหมด desirable / auto (ถ้าทั้งสองฝั่งเป็น passive หรือ auto คู่กัน จะไม่สร้าง EtherChannel!)",
      "ใช้คำสั่ง show spanning-tree และ show etherchannel summary เพื่อตรวจสอบสถานะ Root Bridge และกลุ่มพอร์ต (SU)"
    ],
    "cheatSheet": [
      {
        "cmd": "spanning-tree mode rapid-pvst",
        "desc": "เปลี่ยนโหมด STP เป็น Rapid PVST+ (802.1w)"
      },
      {
        "cmd": "spanning-tree vlan 1 root primary",
        "desc": "บังคับให้สวิตช์ตัวนี้เป็น Root Bridge ของ VLAN 1 (Priority 24576)"
      },
      {
        "cmd": "spanning-tree portfast",
        "desc": "เปิด PortFast บนพอร์ต Access ที่ต่อเครื่องลูกข่าย"
      },
      {
        "cmd": "channel-group 1 mode active",
        "desc": "รวมพอร์ตเข้ากลุ่ม EtherChannel 1 ด้วยโปรโตคอลมาตรฐาน LACP"
      },
      {
        "cmd": "show spanning-tree",
        "desc": "ตรวจสอบ Root Bridge และบทบาทพอร์ต (Root / Desg / Altn BLK)"
      },
      {
        "cmd": "show etherchannel summary",
        "desc": "ตรวจสอบสถานะกลุ่มพอร์ต Port-channel (Po1(SU))"
      }
    ],
    "steps": [
      {
        "device": "SW1-Core",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บนสวิตช์หลัก SW1-Core"
      },
      {
        "device": "SW1-Core",
        "cmd": "configure terminal",
        "match": {},
        "explain": "เข้าสู่โหมด Global Configuration (config)#"
      },
      {
        "device": "SW1-Core",
        "cmd": "spanning-tree vlan 1 root primary",
        "match": {},
        "explain": "กำหนดให้ SW1-Core เป็น Root Bridge หลักของเครือข่าย (ลดค่า Priority ลงเหลือ 24576)"
      },
      {
        "device": "SW1-Core",
        "cmd": "do show spanning-tree",
        "match": {},
        "explain": "ตรวจสอบตาราง STP จะเห็นข้อความ \"This bridge is the root\" และพอร์ตทุกขาเป็น Designated Forwarding (FWD)"
      }
    ]
  },
  {
    "id": "ch15-port-security",
    "number": "บทที่ 15 (Security)",
    "topicEn": "Switch Port Security",
    "title": "Port Security, Sticky MAC & Err-Disabled",
    "badge": "CCNA-SRWE M11",
    "color": "rose",
    "presetLab": "lab1",
    "theorySummary": "\n                <b>การป้องกันพอร์ตสวิตช์ระดับ Layer 2 (Switch Port Security):</b><br>\n                • ป้องกันการนำอุปกรณ์แปลกปลอม (Rogue Device) มาเสียบสายแลน หรือการโจมตีแบบ <b>MAC Flooding Attack</b> ที่ทำให้ตาราง CAM เต็ม<br>\n                • <b>Sticky MAC Learning:</b> คำสั่ง <code>switchport port-security mac-address sticky</code> สั่งให้สวิตช์จำ MAC Address ของเครื่องแรกที่ส่งเฟรมเข้ามาเป็นเจ้าของพอร์ตทันที<br>\n                • <b>3 โหมดการลงโทษเมื่อละเมิด (Violation Modes):</b><br>\n                  1. <b>Protect:</b> ทิ้งเฟรมแปลกปลอมเงียบๆ โดยไม่แจ้งเตือน<br>\n                  2. <b>Restrict:</b> ทิ้งเฟรมแปลกปลอม + ส่งแจ้งเตือน Syslog และเพิ่มตัวนับ Violation Counter<br>\n                  3. <b>Shutdown (ค่าเริ่มต้น):</b> ตัดพอร์ตเป็นสถานะ <b>err-disabled</b> ทันที! แอดมินต้องกู้คืนด้วยการสั่ง <code>shutdown</code> แล้วตามด้วย <code>no shutdown</code>\n            ",
    "examTips": [
      "ต้องตั้งพอร์ตเป็นโหมด Access (switchport mode access) ก่อนเสมอ จึงจะเปิดคำสั่ง switchport port-security ได้!",
      "โหมด Violation เริ่มต้นของ Cisco IOS คือ Shutdown (พอร์ตจะดับเป็นสถานะ err-disabled ทันทีที่มี MAC เกินกำหนด)",
      "วิธีกู้คืนพอร์ตที่ติดสถานะ err-disabled คือเข้า interface นั้นแล้วพิมพ์ shutdown ตามด้วย no shutdown"
    ],
    "cheatSheet": [
      {
        "cmd": "switchport mode access",
        "desc": "บังคับพอร์ตเป็น Access Port ก่อนเปิดใช้งาน Port Security"
      },
      {
        "cmd": "switchport port-security",
        "desc": "เปิดฟีเจอร์ Port Security บนพอร์ตสวิตช์"
      },
      {
        "cmd": "switchport port-security maximum 1",
        "desc": "จำกัดจำนวน MAC Address สูงสุดที่อนุญาตบนพอร์ตนี้ไว้ที่ 1 เครื่อง"
      },
      {
        "cmd": "switchport port-security mac-address sticky",
        "desc": "จำ MAC Address ของเครื่องที่เสียบใช้งานปัจจุบันโดยอัตโนมัติ"
      },
      {
        "cmd": "switchport port-security violation restrict",
        "desc": "ตั้งโหมดเมื่อพบ MAC แปลกปลอมให้บล็อกเฟรมและนับสถิติ (Restrict)"
      },
      {
        "cmd": "show port-security interface Fa0/1",
        "desc": "ตรวจสอบสถานะ Port Security, Violation Mode และจำนวนครั้งที่ละเมิด"
      }
    ],
    "steps": [
      {
        "device": "SW1-Access",
        "cmd": "enable",
        "match": {},
        "explain": "เข้าสู่โหมด Privileged EXEC (#) บน SW1-Access"
      },
      {
        "device": "SW1-Access",
        "cmd": "configure terminal",
        "match": {},
        "explain": "เข้าสู่โหมด Global Configuration (config)#"
      },
      {
        "device": "SW1-Access",
        "cmd": "interface Fa0/1",
        "match": {},
        "explain": "เข้าสู่พอร์ต Fa0/1 ที่เชื่อมต่ออยู่กับเครื่อง PC1"
      },
      {
        "device": "SW1-Access",
        "cmd": "switchport port-security",
        "match": {},
        "explain": "เปิดใช้งานระบบรักษาความปลอดภัยพอร์ต (Port Security) บนขา Fa0/1"
      },
      {
        "device": "SW1-Access",
        "cmd": "switchport port-security mac-address sticky",
        "match": {},
        "explain": "สั่งให้สวิตช์จดจำ MAC Address ของ PC1 แบบ Sticky MAC อัตโนมัติ"
      },
      {
        "device": "SW1-Access",
        "cmd": "do show port-security interface Fa0/1",
        "match": {},
        "explain": "ตรวจสอบสถานะ Port Security บนพอร์ต Fa0/1 (Port Status: Secure-up)"
      }
    ]
  }
];

export const PRACTICAL_LABS_CATALOG: PracticalLab[] = [
  {
    "id": "lab1",
    "number": "LAB 01",
    "title": "Basic Switch Configuration & MAC Address Table",
    "netacadRef": "NET-DEV-INIT / CCNA-ITN Mod 2, 7",
    "difficulty": "Level 1 • Beginner",
    "presetId": "lab1",
    "linkedLessonId": "ch07-basic-switch-config",
    "objectives": [
      "ตั้งชื่อสวิตช์ (Hostname) และรหัสผ่านป้องกันโหมด Privileged EXEC ด้วย enable secret",
      "ตั้งค่าที่อยู่ IP สำหรับบริหารจัดการสวิตช์ผ่านพอร์ตเสมือน Management VLAN 1 (SVI)",
      "ทดสอบการสื่อสารในวงแลนเดียวกันและตรวจสอบตาราง CAM / MAC Address Table"
    ],
    "topologyDesc": "PC1 (192.168.1.10/24), PC2 (192.168.1.11/24) และ File-SRV (192.168.1.100/24) เชื่อมต่อเข้ากับสวิตช์ SW1-Access (Fa0/1–Fa0/3)",
    "devices": [
      "SW1-Access (Cisco 2960 Switch)",
      "PC1 (Workstation)",
      "PC2 (Workstation)",
      "File-SRV (Server)"
    ],
    "scenario": "คุณเพิ่งติดตั้งสวิตช์ตัวใหม่ในห้องปฏิบัติการ ต้องตั้งค่าความปลอดภัยพื้นฐาน กำหนด Management IP 192.168.1.2/24 บน VLAN 1 และยืนยันว่าเครื่องลูกข่ายทั้งหมดสื่อสารกับ File-SRV ได้",
    "procedure": [
      "เปิดหน้าต่าง CLI ของ SW1-Access แล้วเข้าสู่โหมด Global Configuration (enable ➔ configure terminal)",
      "ตั้งรหัสผ่าน Privileged EXEC ด้วยคำสั่ง enable secret class และเข้ารหัสรหัสผ่านด้วย service password-encryption",
      "เข้าสู่พอร์ตเสมือน interface vlan 1 แล้วกำหนด IP 192.168.1.2 255.255.255.0 พร้อมสั่ง no shutdown",
      "เปิด CLI ของ PC1 แล้วทดสอบส่ง Ping ไปยัง File-SRV (192.168.1.100) จากนั้นตรวจสอบตาราง MAC บนสวิตช์"
    ],
    "commands": [
      "SW1-Access(config)# enable secret class",
      "SW1-Access(config)# service password-encryption",
      "SW1-Access(config)# interface vlan 1",
      "SW1-Access(config-if)# ip address 192.168.1.2 255.255.255.0",
      "SW1-Access(config-if)# no shutdown"
    ],
    "expectedResults": "SW1-Access มีพอร์ต VLAN 1 สถานะ up/up ที่ IP 192.168.1.2 และ PC1/PC2 สามารถ Ping ไปยัง File-SRV (192.168.1.100) ได้สำเร็จ 100%",
    "verification": [
      "SW1-Access# show ip interface brief",
      "SW1-Access# show mac address-table",
      "PC1> ping 192.168.1.100"
    ],
    "graderCriteria": [
      "พอร์ต Fa0/1–Fa0/3 ของ SW1-Access เปิดทำงาน (Up) ครบทุกพอร์ต (25%)",
      "ตั้งค่า Device Hardening (enable secret หรือ Management SVI VLAN 1) บน SW1-Access (25%)",
      "PC1 และ PC2 อยู่ในวงแลน 192.168.1.0/24 ถูกต้อง (25%)",
      "PC1 สามารถส่ง Ping ไปยัง File-SRV (192.168.1.100) สำเร็จ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: สวิตช์ Layer 2 ไม่สามารถใส่ IP Address บนพอร์ต Fa0/1 ได้โดยตรง ต้องเข้าที่ interface vlan 1 แล้วพิมพ์ ip address 192.168.1.2 255.255.255.0 ตามด้วย no shutdown",
    "autoDemoCommands": [
      {
        "device": "SW1-Access",
        "cmds": [
          "enable",
          "configure terminal",
          "enable secret class",
          "service password-encryption",
          "interface vlan 1",
          "ip address 192.168.1.2 255.255.255.0",
          "no shutdown",
          "end"
        ]
      }
    ]
  },
  {
    "id": "lab2",
    "number": "LAB 02",
    "title": "Basic Router Configuration & Default Gateway",
    "netacadRef": "NET-DEV-INIT / CCNA-ITN Mod 10",
    "difficulty": "Level 1 • Beginner",
    "presetId": "lab2",
    "linkedLessonId": "ch09-router-basic",
    "objectives": [
      "เข้าใจบทบาทของ Router ในการเชื่อมต่อข้ามเครือข่าย (Inter-Subnet Routing)",
      "กำหนด IPv4 Address และเปิดการทำงานพอร์ต GigabitEthernet ของ Router ด้วยคำสั่ง no shutdown",
      "ตั้งค่า Default Gateway บนเครื่องลูกข่ายเพื่อให้ส่งแพ็กเก็ตข้ามวงแลนได้"
    ],
    "topologyDesc": "วงแลนที่ 1 (PC-A 192.168.10.10/24 ผ่าน SW1) และวงแลนที่ 2 (Web-SRV 192.168.20.100/24 ผ่าน SW2) เชื่อมต่อเข้ากับเราเตอร์ R1-Core ขา Gig0/0 และ Gig0/1",
    "devices": [
      "R1-Core (Cisco 2911 Router)",
      "SW1-LAN1 & SW2-LAN2 (Switches)",
      "PC-A (192.168.10.10)",
      "Web-SRV (192.168.20.100)"
    ],
    "scenario": "บริษัทมีเครือข่าย 2 แผนก คือวง 192.168.10.0/24 และ 192.168.20.0/24 โดยมี R1-Core เป็นตัวกลาง คุณต้องตรวจสอบและตั้งค่าขา Gig0/0 และ Gig0/1 ให้เป็น Default Gateway ของแต่ละวงแลน",
    "procedure": [
      "เปิด CLI ของ R1-Core แล้วตรวจสอบสถานะพอร์ตด้วยคำสั่ง show ip interface brief",
      "เข้าสู่พอร์ต interface Gig0/0 กำหนด ip address 192.168.10.1 255.255.255.0 และสั่ง no shutdown",
      "เข้าสู่พอร์ต interface Gig0/1 กำหนด ip address 192.168.20.1 255.255.255.0 และสั่ง no shutdown",
      "ทดสอบ Ping และ Traceroute จาก PC-A (192.168.10.10) ข้ามไปยัง Web-SRV (192.168.20.100)"
    ],
    "commands": [
      "R1-Core(config)# interface Gig0/0",
      "R1-Core(config-if)# ip address 192.168.10.1 255.255.255.0",
      "R1-Core(config-if)# no shutdown",
      "R1-Core(config)# interface Gig0/1",
      "R1-Core(config-if)# ip address 192.168.20.1 255.255.255.0",
      "R1-Core(config-if)# no shutdown"
    ],
    "expectedResults": "ตาราง Routing ของ R1-Core แสดง Connected Routes (C) ทั้งสองวงแลน และ PC-A สามารถ Ping ข้ามวงไปยัง Web-SRV ได้สำเร็จ",
    "verification": [
      "R1-Core# show ip interface brief",
      "R1-Core# show ip route",
      "PC-A> ping 192.168.20.100"
    ],
    "graderCriteria": [
      "R1-Core ขา Gig0/0 ตั้งค่า IP 192.168.10.1/24 และสถานะ Up (25%)",
      "R1-Core ขา Gig0/1 ตั้งค่า IP 192.168.20.1/24 และสถานะ Up (25%)",
      "PC-A และ Web-SRV ตั้งค่า Default Gateway ชี้มายังขาของ R1-Core ถูกต้อง (25%)",
      "PC-A ส่ง Ping ข้ามวงแลนไปยัง Web-SRV (192.168.20.100) สำเร็จ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: ตรวจสอบให้แน่ใจว่าพอร์ต Gig0/0 และ Gig0/1 บน R1-Core ไม่ได้ติดสถานะ administratively down และค่า Default Gateway ของ PC-A คือ 192.168.10.1",
    "autoDemoCommands": [
      {
        "device": "R1-Core",
        "cmds": [
          "enable",
          "configure terminal",
          "interface Gig0/0",
          "ip address 192.168.10.1 255.255.255.0",
          "no shutdown",
          "interface Gig0/1",
          "ip address 192.168.20.1 255.255.255.0",
          "no shutdown",
          "end"
        ]
      }
    ]
  },
  {
    "id": "lab3",
    "number": "LAB 03",
    "title": "IPv4 Addressing & VLSM Subnetting (/26)",
    "netacadRef": "NET-BASICS / CCNA-ITN Mod 11",
    "difficulty": "Level 1 • Subnetting",
    "presetId": "lab3",
    "linkedLessonId": "ch04-ipv4-subnetting",
    "objectives": [
      "คำนวณการแบ่งเครือข่ายย่อย (Subnetting /26 = Mask 255.255.255.192) ซึ่งรองรับได้วงละ 62 โฮสต์",
      "แยกแยะช่วง IP ของ Subnet ที่ 1 (.0/26 ช่วง .1–.62) และ Subnet ที่ 2 (.64/26 ช่วง .65–.126)",
      "แก้ไขปัญหาการตั้ง IP Address และ Subnet Mask ผิดวงแลนบน Router และ PC"
    ],
    "topologyDesc": "Sales-PC (วงที่ 1: 192.168.10.0/26) เชื่อมต่อผ่าน SW1 เข้าสู่ R1-VLSM ขา Gig0/0 (.1/26) และ Eng-PC (วงที่ 2: 192.168.10.64/26) เชื่อมต่อผ่าน SW2 เข้าสู่ขา Gig0/1 (.65/26)",
    "devices": [
      "R1-VLSM (Router)",
      "SW1-Sales & SW2-Eng (Switches)",
      "Sales-PC (192.168.10.10/26)",
      "Eng-PC (ต้องตั้งเป็น 192.168.10.70/26)"
    ],
    "scenario": "ฝ่ายไอทีได้รับบล็อก IP 192.168.10.0/24 และต้องการแบ่งเป็นย่อยขนาด /26 (255.255.255.192) ให้แผนก Sales (192.168.10.0/26) และแผนก Engineering (192.168.10.64/26) แต่พอร์ต Gig0/1 ของ R1-VLSM และเครื่อง Eng-PC ยังตั้งค่าไม่เสร็จสมบูรณ์",
    "procedure": [
      "เปิดเครื่องคิดเลข Subnet ในเมนู Academy เพื่อตรวจสอบช่วงโฮสต์ของ 192.168.10.64/26 (First Host: .65, Last Host: .126, Mask: 255.255.255.192)",
      "เปิด CLI ของ R1-VLSM เข้าที่ interface Gig0/1 แล้วตั้งค่า ip address 192.168.10.65 255.255.255.192 และสั่ง no shutdown",
      "เปิด CLI ของ Eng-PC เข้าที่ interface Eth0 ตั้งค่า ip address 192.168.10.70 255.255.255.192 และตั้ง ip default-gateway 192.168.10.65",
      "ทดสอบส่ง Ping จาก Sales-PC (192.168.10.10) ไปยัง Eng-PC (192.168.10.70)"
    ],
    "commands": [
      "R1-VLSM(config)# interface Gig0/1",
      "R1-VLSM(config-if)# ip address 192.168.10.65 255.255.255.192",
      "R1-VLSM(config-if)# no shutdown",
      "Eng-PC(config)# interface Eth0",
      "Eng-PC(config-if)# ip address 192.168.10.70 255.255.255.192",
      "Eng-PC(config)# ip default-gateway 192.168.10.65"
    ],
    "expectedResults": "R1-VLSM มองเห็นทั้ง 2 Subnet ย่อย (192.168.10.0/26 และ 192.168.10.64/26) โดยไม่เกิด Subnet Overlap และ Sales-PC Ping ไปหา Eng-PC สำเร็จ",
    "verification": [
      "R1-VLSM# show ip route",
      "R1-VLSM# show ip interface brief",
      "Sales-PC> ping 192.168.10.70"
    ],
    "graderCriteria": [
      "R1-VLSM ขา Gig0/0 ตั้งค่า 192.168.10.1/26 (255.255.255.192) ถูกต้อง (25%)",
      "R1-VLSM ขา Gig0/1 ตั้งค่า 192.168.10.65/26 (255.255.255.192) และสั่ง no shutdown (25%)",
      "Eng-PC ตั้งค่า IP ในช่วง 192.168.10.66–126 Mask 255.255.255.192 และ Gateway 192.168.10.65 (25%)",
      "Sales-PC สามารถ Ping ข้าม Subnet /26 ไปยัง Eng-PC ได้สำเร็จ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: สำหรับ /26 บล็อกละ 64 ที่อยู่ — วงที่สองเริ่มที่ .64 ดังนั้น IP แรกที่ใช้ได้คือ 192.168.10.65 (ตั้งให้ Router Gig0/1) และ Mask คือ 255.255.255.192",
    "autoDemoCommands": [
      {
        "device": "R1-VLSM",
        "cmds": [
          "enable",
          "configure terminal",
          "interface Gig0/1",
          "ip address 192.168.10.65 255.255.255.192",
          "no shutdown",
          "end"
        ]
      },
      {
        "device": "Eng-PC",
        "cmds": [
          "enable",
          "configure terminal",
          "interface Eth0",
          "ip address 192.168.10.70 255.255.255.192",
          "exit",
          "ip default-gateway 192.168.10.65",
          "end"
        ]
      }
    ]
  },
  {
    "id": "lab4",
    "number": "LAB 04",
    "title": "IPv4 Static & Default Routing",
    "netacadRef": "CCNA-SRWE Mod 15–16",
    "difficulty": "Level 2 • Intermediate",
    "presetId": "lab4",
    "linkedLessonId": "ch01-network-layer",
    "objectives": [
      "เข้าใจการตัดสินใจเลือกเส้นทางของ Router และการทำ Next-Hop Recursive Lookup",
      "ตั้งค่า Static Route (ip route) ทั้งขาไป (Forward Path) และขากลับ (Return Path)",
      "ตรวจสอบตาราง Routing Table (show ip route) และไล่เส้นทางด้วย traceroute"
    ],
    "topologyDesc": "HQ-PC (192.168.10.10/24) ➔ R1-HQ (10.0.0.1/30) ⟷ R2-Branch (10.0.0.2/30) ➔ Branch-SRV (192.168.30.100/24)",
    "devices": [
      "R1-HQ (HQ Router)",
      "R2-Branch (Branch Router)",
      "HQ-SW & Branch-SW",
      "HQ-PC (192.168.10.10)",
      "Branch-SRV (192.168.30.100)"
    ],
    "scenario": "สำนักงานใหญ่ (R1-HQ) เชื่อมต่อกับสาขา (R2-Branch) ผ่านลิงก์ WAN Point-to-Point วง 10.0.0.0/30 คุณต้องตรวจสอบและกำหนด Static Route บนเราเตอร์ทั้งสองฝั่งเพื่อให้ HQ-PC ติดต่อกับ Branch-SRV ได้",
    "procedure": [
      "ตรวจสอบตารางเส้นทางบน R1-HQ ด้วยคำสั่ง show ip route",
      "บน R1-HQ กำหนดเส้นทางไปยังวงแลนสาขา: ip route 192.168.30.0 255.255.255.0 10.0.0.2",
      "บน R2-Branch กำหนดเส้นทางขากลับมายังสำนักงานใหญ่: ip route 192.168.10.0 255.255.255.0 10.0.0.1",
      "ทดสอบ ping 192.168.30.100 และ traceroute 192.168.30.100 จากเครื่อง HQ-PC"
    ],
    "commands": [
      "R1-HQ(config)# ip route 192.168.30.0 255.255.255.0 10.0.0.2",
      "R2-Branch(config)# ip route 192.168.10.0 255.255.255.0 10.0.0.1"
    ],
    "expectedResults": "ทั้ง R1-HQ และ R2-Branch มีรายการ S (Static Route, AD=1) ในตาราง Routing และ HQ-PC Ping/Traceroute ไปถึง 192.168.30.100 สำเร็จ",
    "verification": [
      "R1-HQ# show ip route",
      "R2-Branch# show ip route",
      "HQ-PC> traceroute 192.168.30.100"
    ],
    "graderCriteria": [
      "ลิงก์ WAN 10.0.0.0/30 ระหว่าง R1-HQ และ R2-Branch เปิดใช้งานปกติ (25%)",
      "R1-HQ มี Static Route ไปยังวง 192.168.30.0/24 ผ่าน Next-Hop 10.0.0.2 (25%)",
      "R2-Branch มี Static Route ขากลับไปยังวง 192.168.10.0/24 ผ่าน Next-Hop 10.0.0.1 (25%)",
      "HQ-PC สามารถ Ping ข้าม Router 2 ตัวไปยัง Branch-SRV สำเร็จ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: การสื่อสารระดับ IP ต้องมีเส้นทางทั้งขาไปและขากลับ หาก R1-HQ ส่งไปได้แต่ R2-Branch ไม่มี Route กลับมายัง 192.168.10.0/24 การ Ping จะล้มเหลว",
    "autoDemoCommands": [
      {
        "device": "R1-HQ",
        "cmds": [
          "enable",
          "configure terminal",
          "ip route 192.168.30.0 255.255.255.0 10.0.0.2",
          "end"
        ]
      },
      {
        "device": "R2-Branch",
        "cmds": [
          "enable",
          "configure terminal",
          "ip route 192.168.10.0 255.255.255.0 10.0.0.1",
          "end"
        ]
      }
    ]
  },
  {
    "id": "lab5",
    "number": "LAB 05",
    "title": "VLAN Segmentation & IEEE 802.1Q Trunking",
    "netacadRef": "CCNA-SRWE Mod 3",
    "difficulty": "Level 2 • Switching",
    "presetId": "lab5",
    "linkedLessonId": "ch08-vlans",
    "objectives": [
      "สร้างและตั้งชื่อ VLAN 10 (Sales) และ VLAN 20 (Engineering) บนสวิตช์",
      "กำหนดพอร์ตเครื่องลูกข่ายเป็น Access Port ให้ตรงตาม VLAN ที่สังกัด",
      "ตั้งค่าสายเชื่อมต่อระหว่างสวิตช์ 2 ตัวเป็น IEEE 802.1Q Trunk Port เพื่อให้ VLAN เดียวกันข้ามสวิตช์ได้"
    ],
    "topologyDesc": "SW1-Core เชื่อมต่อกับ SW2-Access ผ่านพอร์ต Fa0/1 โดยมี Sales-PC1 & Eng-PC1 อยู่ฝั่ง SW1 และ Sales-PC2 & Eng-PC2 อยู่ฝั่ง SW2",
    "devices": [
      "SW1-Core & SW2-Access (2960 Switches)",
      "Sales-PC1 (.10.11) & Sales-PC2 (.10.12)",
      "Eng-PC1 (.20.11) & Eng-PC2 (.20.12)"
    ],
    "scenario": "พนักงานแผนก Sales (VLAN 10) และ Engineering (VLAN 20) นั่งอยู่คนละชั้น (SW1-Core และ SW2-Access) ปัจจุบันสายเชื่อมระหว่างสวิตช์ (Fa0/1 บน SW2-Access) และพอร์ตของ Sales-PC2 (Fa0/2) ยังไม่ได้ตั้งค่า VLAN และ Trunk ให้ถูกต้อง",
    "procedure": [
      "เปิด CLI ของ SW2-Access แล้วตรวจสอบสถานะ VLAN ด้วยคำสั่ง show vlan brief",
      "เข้าสู่พอร์ต interface Fa0/2 (ที่ต่อกับ Sales-PC2) ตั้งค่า switchport mode access และ switchport access vlan 10",
      "เข้าสู่พอร์ต interface Fa0/1 (สายเชื่อมไปหา SW1-Core) ตั้งค่าเป็นท่อรวมสัญญาณด้วยคำสั่ง switchport mode trunk",
      "ตรวจสอบพอร์ต Trunk ด้วย show interfaces trunk และทดสอบ Ping จาก Sales-PC1 (192.168.10.11) ไปยัง Sales-PC2 (192.168.10.12)"
    ],
    "commands": [
      "SW2-Access(config)# interface Fa0/2",
      "SW2-Access(config-if)# switchport mode access",
      "SW2-Access(config-if)# switchport access vlan 10",
      "SW2-Access(config)# interface Fa0/1",
      "SW2-Access(config-if)# switchport mode trunk"
    ],
    "expectedResults": "พอร์ต Fa0/1 บนสวิตช์ทั้งสองตัวเป็น 802.1Q Trunk ทำให้ Sales-PC1 คุยกับ Sales-PC2 (VLAN 10) ได้ และ Eng-PC1 คุยกับ Eng-PC2 (VLAN 20) ได้ โดยที่ VLAN 10 กับ 20 ยังถูกแยก Broadcast Domain ออกจากกัน",
    "verification": [
      "SW2-Access# show vlan brief",
      "SW2-Access# show interfaces trunk",
      "Sales-PC1> ping 192.168.10.12"
    ],
    "graderCriteria": [
      "พอร์ต Access ของ Sales-PC1 และ Sales-PC2 อยู่ใน VLAN 10 ถูกต้อง (25%)",
      "พอร์ต Access ของ Eng-PC1 และ Eng-PC2 อยู่ใน VLAN 20 ถูกต้อง (25%)",
      "ลิงก์ Fa0/1 ระหว่าง SW1-Core และ SW2-Access ทำงานในโหมด 802.1Q Trunk ทั้งสองฝั่ง (25%)",
      "Sales-PC1 ส่ง Ping ข้ามสวิตช์ไปยัง Sales-PC2 สำเร็จ และ Eng-PC1 Ping ไปยัง Eng-PC2 สำเร็จ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: บน SW2-Access ต้องเปลี่ยนพอร์ต Fa0/2 ให้เป็น switchport access vlan 10 และเปลี่ยนพอร์ต Fa0/1 ให้เป็น switchport mode trunk",
    "autoDemoCommands": [
      {
        "device": "SW2-Access",
        "cmds": [
          "enable",
          "configure terminal",
          "interface Fa0/2",
          "switchport mode access",
          "switchport access vlan 10",
          "interface Fa0/1",
          "switchport mode trunk",
          "end"
        ]
      }
    ]
  },
  {
    "id": "lab6",
    "number": "LAB 06",
    "title": "Inter-VLAN Routing (Router-on-a-Stick 802.1Q)",
    "netacadRef": "CCNA-SRWE Mod 4",
    "difficulty": "Level 2 • Inter-VLAN",
    "presetId": "lab6",
    "linkedLessonId": "ch11-intervlan",
    "objectives": [
      "เข้าใจหลักการทำงานของ Router-on-a-Stick (ROAS) ที่ใช้สาย Trunk เส้นเดียวรับส่งหลาย VLAN",
      "สร้างและตั้งค่า Sub-interface (Gig0/0.10 และ Gig0/0.20) พร้อมระบุ encapsulation dot1Q <vlan-id>",
      "ตรวจสอบการส่งแพ็กเก็ตข้าม VLAN (VLAN 10 ⟷ R1-ROAS ⟷ VLAN 20)"
    ],
    "topologyDesc": "Sales-VLAN10 (192.168.10.10/24) และ Eng-VLAN20 (192.168.20.10/24) ต่อเข้ากับ SW1-Trunk ซึ่งเชื่อมสาย Trunk (Fa0/1) ไปยัง R1-ROAS ขา Gig0/0 (Gig0/0.10 และ Gig0/0.20)",
    "devices": [
      "R1-ROAS (Router)",
      "SW1-Trunk (Switch)",
      "Sales-VLAN10 (192.168.10.10)",
      "Eng-VLAN20 (192.168.20.10)"
    ],
    "scenario": "หลังจากแยก VLAN 10 และ VLAN 20 ออกจากกันแล้ว บริษัทต้องการให้ทั้งสองแผนกส่งไฟล์ข้าม VLAN กันได้ผ่านเราเตอร์ R1-ROAS โดยใช้สถาปัตยกรรม Router-on-a-Stick",
    "procedure": [
      "ตรวจสอบพอร์ต Fa0/1 บน SW1-Trunk ว่าตั้งค่าเป็น switchport mode trunk แล้ว",
      "บน R1-ROAS เข้าสู่พอร์ตย่อย interface Gig0/0.10 ตั้งค่า encapsulation dot1Q 10 และ ip address 192.168.10.1 255.255.255.0",
      "เข้าสู่พอร์ตย่อย interface Gig0/0.20 ตั้งค่า encapsulation dot1Q 20 และ ip address 192.168.20.1 255.255.255.0 พร้อมเปิดพอร์ตหลัก Gig0/0 ด้วย no shutdown",
      "ทดสอบ Ping ข้าม VLAN จาก Sales-VLAN10 (192.168.10.10) ไปยัง Eng-VLAN20 (192.168.20.10)"
    ],
    "commands": [
      "R1-ROAS(config)# interface Gig0/0.10",
      "R1-ROAS(config-subif)# encapsulation dot1Q 10",
      "R1-ROAS(config-subif)# ip address 192.168.10.1 255.255.255.0",
      "R1-ROAS(config)# interface Gig0/0.20",
      "R1-ROAS(config-subif)# encapsulation dot1Q 20",
      "R1-ROAS(config-subif)# ip address 192.168.20.1 255.255.255.0"
    ],
    "expectedResults": "R1-ROAS แสดงตาราง Routing ที่มี Connected Sub-interfaces ทั้งวง 192.168.10.0/24 (Gig0/0.10) และ 192.168.20.0/24 (Gig0/0.20) และ Ping ข้าม VLAN สำเร็จ",
    "verification": [
      "R1-ROAS# show ip interface brief",
      "SW1-Trunk# show interfaces trunk",
      "Sales-VLAN10> ping 192.168.20.10"
    ],
    "graderCriteria": [
      "SW1-Trunk ตั้งค่าพอร์ต Fa0/1 เป็น 802.1Q Trunk และพอร์ตลูกข่ายอยู่ถูก VLAN (25%)",
      "R1-ROAS ตั้งค่า Sub-interface Gig0/0.10 (VLAN 10, IP 192.168.10.1/24) (25%)",
      "R1-ROAS ตั้งค่า Sub-interface Gig0/0.20 (VLAN 20, IP 192.168.20.1/24) (25%)",
      "Sales-VLAN10 สามารถ Ping ข้าม VLAN ไปยัง Eng-VLAN20 สำเร็จ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: บน Sub-interface ของ Cisco IOS ต้องพิมพ์คำสั่ง encapsulation dot1Q <vlan-id> ก่อนเสมอ จึงจะสามารถกำหนด ip address ได้",
    "autoDemoCommands": [
      {
        "device": "R1-ROAS",
        "cmds": [
          "enable",
          "configure terminal",
          "interface Gig0/0",
          "no shutdown",
          "interface Gig0/0.10",
          "encapsulation dot1Q 10",
          "ip address 192.168.10.1 255.255.255.0",
          "interface Gig0/0.20",
          "encapsulation dot1Q 20",
          "ip address 192.168.20.1 255.255.255.0",
          "end"
        ]
      }
    ]
  },
  {
    "id": "lab7",
    "number": "LAB 07",
    "title": "DHCPv4 Server Configuration & DORA Lease",
    "netacadRef": "CCNA-SRWE Mod 7",
    "difficulty": "Level 2 • Network Services",
    "presetId": "lab7",
    "linkedLessonId": "ch09-router-basic",
    "objectives": [
      "เข้าใจกระบวนการขอรับ IP อัตโนมัติ 4 ขั้นตอนของ DHCPv4 (DORA: Discover, Offer, Request, Acknowledge)",
      "ตั้งค่า ip dhcp excluded-address เพื่อกันสำรอง IP ของ Gateway และ Server ไม่ให้ถูกแจกซ้ำ",
      "สร้าง DHCP Pool (network, default-router, dns-server) บน Router และสั่ง ipconfig /renew บนเครื่องลูกข่าย"
    ],
    "topologyDesc": "Staff-PC1 และ Staff-PC2 เชื่อมต่อผ่าน SW1-LAN เข้าสู่เราเตอร์ R1-DHCP ขา Gig0/0 (192.168.10.1/24)",
    "devices": [
      "R1-DHCP (DHCPv4 Router)",
      "SW1-LAN (Switch)",
      "Staff-PC1 & Staff-PC2 (DHCP Clients)"
    ],
    "scenario": "บริษัทต้องการเลิกตั้งค่า Static IP บนคอมพิวเตอร์พนักงานทีละเครื่อง คุณได้รับมอบหมายให้ตั้งค่า R1-DHCP เป็น DHCPv4 Server แจก IP วง 192.168.10.0/24 โดยกันสำรอง IP 192.168.10.1 ถึง 192.168.10.9 ไว้",
    "procedure": [
      "เปิด CLI ของ R1-DHCP เข้าสู่โหมด Global Config แล้วกันสำรอง IP: ip dhcp excluded-address 192.168.10.1 192.168.10.9",
      "สร้าง Pool ชื่อ LAN_POOL ด้วยคำสั่ง ip dhcp pool LAN_POOL",
      "กำหนดวงแลน network 192.168.10.0 255.255.255.0, เกตเวย์ default-router 192.168.10.1 และ dns-server 8.8.8.8",
      "เปิด CLI ของ Staff-PC1 และ Staff-PC2 แล้วพิมพ์ ipconfig /renew เพื่อรับ IP อัตโนมัติผ่านกระบวนการ DORA"
    ],
    "commands": [
      "R1-DHCP(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.9",
      "R1-DHCP(config)# ip dhcp pool LAN_POOL",
      "R1-DHCP(dhcp-config)# network 192.168.10.0 255.255.255.0",
      "R1-DHCP(dhcp-config)# default-router 192.168.10.1",
      "R1-DHCP(dhcp-config)# dns-server 8.8.8.8",
      "Staff-PC1> ipconfig /renew"
    ],
    "expectedResults": "Staff-PC1 และ Staff-PC2 ได้รับ IP ตั้งแต่ 192.168.10.10 เป็นต้นไป พร้อม Default Gateway 192.168.10.1 และแสดงในตาราง show ip dhcp binding บน R1-DHCP",
    "verification": [
      "R1-DHCP# show ip dhcp binding",
      "R1-DHCP# show ip dhcp pool",
      "Staff-PC1> ping 192.168.10.1"
    ],
    "graderCriteria": [
      "สร้าง DHCP Pool สำหรับวง 192.168.10.0/24 พร้อมระบุ default-router 192.168.10.1 (25%)",
      "กำหนด ip dhcp excluded-address เพื่อกันสำรอง IP ของ Gateway ไม่ให้แจกชน (25%)",
      "Staff-PC1 ได้รับ IP จาก DHCP (ในช่วง .10.2–.10.254) และมีตาราง Lease Binding (25%)",
      "Staff-PC2 ได้รับ IP จาก DHCP และสามารถ Ping ไปยัง R1-DHCP (192.168.10.1) สำเร็จ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: หลังจากสร้าง ip dhcp pool บน R1-DHCP เสร็จแล้ว อย่าลืมเปิด CLI ของ Staff-PC1 และ Staff-PC2 เพื่อสั่ง ipconfig /renew (หรือ dhcp)",
    "autoDemoCommands": [
      {
        "device": "R1-DHCP",
        "cmds": [
          "enable",
          "configure terminal",
          "ip dhcp excluded-address 192.168.10.1 192.168.10.9",
          "ip dhcp pool LAN_POOL",
          "network 192.168.10.0 255.255.255.0",
          "default-router 192.168.10.1",
          "dns-server 8.8.8.8",
          "end"
        ]
      },
      {
        "device": "Staff-PC1",
        "cmds": [
          "ipconfig /renew"
        ]
      },
      {
        "device": "Staff-PC2",
        "cmds": [
          "ipconfig /renew"
        ]
      }
    ]
  },
  {
    "id": "lab8",
    "number": "LAB 08",
    "title": "Single-Area OSPFv2 Dynamic Routing",
    "netacadRef": "CCNA-ENSA Mod 1–2",
    "difficulty": "Level 3 • Dynamic Routing",
    "presetId": "lab8",
    "linkedLessonId": "ch10-routing-concepts",
    "objectives": [
      "เข้าใจกลไก Link-State Routing ของ OSPFv2 (Hello Protocol, Neighbor Adjacency FULL, Dijkstra SPF Cost)",
      "เปิดโปรโตคอล router ospf 1 และประกาศเครือข่ายด้วยคำสั่ง network <ip> <wildcard> area 0",
      "ตรวจสอบตารางเพื่อนบ้าน (show ip ospf neighbor) และเส้นทางรหัส O [110/cost] ใน show ip route"
    ],
    "topologyDesc": "Branch-PC (192.168.100.10/24) ➔ R1-Edge (10.10.10.1/30) ⟷ R2-Core (10.10.10.2/30) ➔ Cloud-DB (172.16.1.100/24)",
    "devices": [
      "R1-Edge & R2-Core (OSPF Routers)",
      "SW-Edge & SW-Core (Switches)",
      "Branch-PC (192.168.100.10)",
      "Cloud-DB (172.16.1.100)"
    ],
    "scenario": "องค์กรต้องการเปลี่ยนจากการใช้ Static Route มาเป็น Single-Area OSPFv2 (Area 0) ระหว่างเราเตอร์ R1-Edge และ R2-Core เพื่อแลกเปลี่ยนเส้นทางอัตโนมัติ",
    "procedure": [
      "บน R1-Edge เข้าโหมด router ospf 1 แล้วประกาศวง network 192.168.100.0 0.0.0.255 area 0 และ network 10.10.10.0 0.0.0.3 area 0",
      "บน R2-Core เข้าโหมด router ospf 1 แล้วประกาศวง network 172.16.1.0 0.0.0.255 area 0 และ network 10.10.10.0 0.0.0.3 area 0",
      "ตรวจสอบสถานะเพื่อนบ้านด้วย show ip ospf neighbor และดูตารางเส้นทางด้วย show ip route",
      "ทดสอบส่ง Ping จาก Branch-PC (192.168.100.10) ไปยัง Cloud-DB (172.16.1.100)"
    ],
    "commands": [
      "R1-Edge(config)# router ospf 1",
      "R1-Edge(config-router)# network 192.168.100.0 0.0.0.255 area 0",
      "R1-Edge(config-router)# network 10.10.10.0 0.0.0.3 area 0",
      "R2-Core(config)# router ospf 1",
      "R2-Core(config-router)# network 172.16.1.0 0.0.0.255 area 0",
      "R2-Core(config-router)# network 10.10.10.0 0.0.0.3 area 0"
    ],
    "expectedResults": "R1-Edge และ R2-Core สร้าง OSPF Neighbor สถานะ FULL บน Area 0 สำเร็จ ติดตั้งเส้นทาง O [110/2] และ Ping ถึงกัน 100%",
    "verification": [
      "R1-Edge# show ip ospf neighbor",
      "R1-Edge# show ip route",
      "Branch-PC> ping 172.16.1.100"
    ],
    "graderCriteria": [
      "ลิงก์ Backbone 10.10.10.0/30 ระหว่าง R1-Edge และ R2-Core เปิดทำงาน (25%)",
      "R1-Edge และ R2-Core สร้างความสัมพันธ์ OSPF Neighbor (FULL State) ใน Area 0 สำเร็จ (25%)",
      "ตาราง Routing ติดตั้งเส้นทางรหัส O (OSPF AD 110) ครบทั้งสองฝั่ง (25%)",
      "Branch-PC สามารถส่ง Ping ข้ามเครือข่าย OSPF ไปยัง Cloud-DB สำเร็จ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: Wildcard Mask ของ /24 คือ 0.0.0.255 และของ /30 คือ 0.0.0.3 โดยทั้งสองฝั่งต้องใช้เลข Area ID ตรงกัน (area 0) จึงจะจับคู่ Neighbor ได้",
    "autoDemoCommands": [
      {
        "device": "R1-Edge",
        "cmds": [
          "enable",
          "configure terminal",
          "router ospf 1",
          "network 192.168.100.0 0.0.0.255 area 0",
          "network 10.10.10.0 0.0.0.3 area 0",
          "end"
        ]
      },
      {
        "device": "R2-Core",
        "cmds": [
          "enable",
          "configure terminal",
          "router ospf 1",
          "network 172.16.1.0 0.0.0.255 area 0",
          "network 10.10.10.0 0.0.0.3 area 0",
          "end"
        ]
      }
    ]
  },
  {
    "id": "lab9",
    "number": "LAB 09",
    "title": "Standard & Extended IPv4 ACL Security Policy",
    "netacadRef": "CCNA-ENSA Mod 4–5",
    "difficulty": "Level 3 • Network Security",
    "presetId": "lab9",
    "linkedLessonId": "ch12-acl",
    "objectives": [
      "เข้าใจกฎการประมวลผล ACL แบบเรียงลำดับจากบนลงล่าง (Top-Down First-Match) และ Implicit Deny Any",
      "เขียนกฎ ACL เพื่อบล็อกเครื่องที่ไม่ได้รับอนุญาต (Guest-PC 192.168.10.50) ไม่ให้เข้าถึงเซิร์ฟเวอร์การเงิน",
      "ผูก ACL เข้ากับพอร์ตของ Router ด้วยคำสั่ง ip access-group <id> in|out และทดสอบผลลัพธ์"
    ],
    "topologyDesc": "Admin-PC (192.168.10.10/24) และ Guest-PC (192.168.10.50/24) เชื่อมผ่าน SW1-Corp เข้าสู่ R1-ACL (Gig0/0) เพื่อไปยัง Finance-SRV (192.168.20.100/24 บนขา Gig0/1)",
    "devices": [
      "R1-ACL (Security Router)",
      "SW1-Corp (Switch)",
      "Admin-PC (.10.10)",
      "Guest-PC (.10.50)",
      "Finance-SRV (.20.100)"
    ],
    "scenario": "ฝ่ายความมั่นคงต้องการป้องกันไม่ให้เครื่องผู้มาติดต่อ (Guest-PC 192.168.10.50) เข้าถึงเซิร์ฟเวอร์การเงิน (Finance-SRV 192.168.20.100) แต่ยังต้องอนุญาตให้เครื่องผู้ดูแลระบบ (Admin-PC 192.168.10.10) เข้าใช้งานได้ตามปกติ",
    "procedure": [
      "เปิด CLI ของ R1-ACL แล้วเข้าสู่โหมด Global Configuration",
      "สร้างกฎข้อที่ 1 เพื่อบล็อก Guest-PC: access-list 100 deny ip host 192.168.10.50 any (หรือใช้ Standard ACL 1)",
      "สร้างกฎข้อที่ 2 เพื่ออนุญาตเครื่องอื่นๆ ที่เหลือ (สำคัญมากเพื่อไม่ให้ติด Implicit Deny): access-list 100 permit ip any any",
      "เข้าสู่พอร์ต interface Gig0/0 แล้วผูก ACL ขาเข้าด้วยคำสั่ง ip access-group 100 in จากนั้นทดสอบ Ping จากทั้งสองเครื่อง"
    ],
    "commands": [
      "R1-ACL(config)# access-list 100 deny ip host 192.168.10.50 any",
      "R1-ACL(config)# access-list 100 permit ip any any",
      "R1-ACL(config)# interface Gig0/0",
      "R1-ACL(config-if)# ip access-group 100 in"
    ],
    "expectedResults": "เมื่อ Guest-PC (192.168.10.50) สั่ง Ping ไปยัง Finance-SRV จะถูกปฏิเสธ (U.U.U / Denied by ACL) แต่เมื่อ Admin-PC (192.168.10.10) สั่ง Ping จะสำเร็จ 100% (!!!!!)",
    "verification": [
      "R1-ACL# show access-lists",
      "Guest-PC> ping 192.168.20.100",
      "Admin-PC> ping 192.168.20.100"
    ],
    "graderCriteria": [
      "สร้างรายการ ACL บน R1-ACL ที่มีทั้งกฎ deny และ permit (25%)",
      "นำ ACL ไปผูกกับพอร์ตของ R1-ACL ด้วยคำสั่ง ip access-group (25%)",
      "บล็อกทราฟฟิกจาก Guest-PC (192.168.10.50) ไม่ให้เข้าถึง Finance-SRV สำเร็จ (25%)",
      "อนุญาตให้ Admin-PC (192.168.10.10) ส่ง Ping ไปยัง Finance-SRV ได้ตามปกติ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: ห้ามลืมบรรทัด access-list 100 permit ip any any ต่อท้ายกฎ deny มิฉะนั้น Implicit Deny ท้าย ACL จะบล็อก Admin-PC ไปด้วย!",
    "autoDemoCommands": [
      {
        "device": "R1-ACL",
        "cmds": [
          "enable",
          "configure terminal",
          "access-list 100 deny ip host 192.168.10.50 any",
          "access-list 100 permit ip any any",
          "interface Gig0/0",
          "ip access-group 100 in",
          "end"
        ]
      }
    ]
  },
  {
    "id": "lab10",
    "number": "LAB 10",
    "title": "NAT/PAT Overload & Internet Edge Firewall",
    "netacadRef": "CCNA-ENSA Mod 6",
    "difficulty": "Level 3 • NAT & Edge Security",
    "presetId": "lab10",
    "linkedLessonId": "ch13-nat",
    "objectives": [
      "แยกแยะคำศัพท์ Inside Local, Inside Global, Outside Local และ Outside Global",
      "ตั้งค่าพอร์ต ip nat inside / ip nat outside และคำสั่ง PAT Overload (ip nat inside source list 1 interface Gig0/1 overload)",
      "ทดสอบการแปลง Private IP เป็น Public IP พร้อมตรวจสอบตาราง show ip nat translations"
    ],
    "topologyDesc": "Corp-PC (192.168.10.25/24) ➔ SW1-Corp ➔ R1-Firewall (Gig0/0 Inside: 192.168.10.1/24 | Gig0/1 Outside: 203.0.113.1/29) ➔ ISP-Cloud (203.0.113.8/29)",
    "devices": [
      "R1-Firewall (NAT/Firewall Router)",
      "SW1-Corp (Switch)",
      "Corp-PC (192.168.10.25)",
      "ISP-Cloud (203.0.113.8)"
    ],
    "scenario": "เครือข่ายภายในองค์กรใช้ Private IP 192.168.10.0/24 ซึ่งไม่สามารถออกสู่อินเทอร์เน็ต (ISP-Cloud 203.0.113.8) ได้โดยตรง ต้องใช้ PAT Overload แปลงเป็น Public IP 203.0.113.1 ควบคู่กับ ACL 100 ที่บล็อก ICMP แต่เปิดให้เข้าเว็บ HTTP Port 80 ได้",
    "procedure": [
      "ตรวจสอบการตั้งค่า NAT และ ACL บน R1-Firewall ด้วยคำสั่ง show running-config",
      "บน Corp-PC ทดสอบเรียกหน้าเว็บ HTTP ไปยัง ISP-Cloud ด้วยคำสั่ง http 203.0.113.8",
      "บน Corp-PC ทดสอบส่ง ICMP Ping ไปยัง 203.0.113.8 เพื่อยืนยันว่า ACL 100 บล็อกเฉพาะ ICMP แต่ไม่บล็อก HTTP",
      "เปิด CLI ของ R1-Firewall แล้วตรวจสอบตารางการแปลงที่อยู่ด้วยคำสั่ง show ip nat translations"
    ],
    "commands": [
      "R1-Firewall(config)# access-list 1 permit 192.168.10.0 0.0.0.255",
      "R1-Firewall(config)# ip nat inside source list 1 interface Gig0/1 overload",
      "R1-Firewall(config)# interface Gig0/0",
      "R1-Firewall(config-if)# ip nat inside",
      "R1-Firewall(config)# interface Gig0/1",
      "R1-Firewall(config-if)# ip nat outside"
    ],
    "expectedResults": "เมื่อ Corp-PC เรียกเว็บ http 203.0.113.8 แพ็กเก็ตจะถูกแปลง Source IP จาก 192.168.10.25 เป็น 203.0.113.1:port และบันทึกในตาราง NAT Translation",
    "verification": [
      "Corp-PC> http 203.0.113.8",
      "R1-Firewall# show ip nat translations",
      "R1-Firewall# show access-lists"
    ],
    "graderCriteria": [
      "กำหนดขา ip nat inside (Gig0/0) และ ip nat outside (Gig0/1) ถูกต้อง (25%)",
      "เปิดใช้งาน PAT Overload คู่กับ ACL 1 สำหรับวง 192.168.10.0/24 (25%)",
      "Extended ACL 100 บล็อก ICMP Ping ไปยัง 203.0.113.8 ตามนโยบาย (25%)",
      "อนุญาตให้ Corp-PC เข้าถึง HTTP (TCP Port 80) ที่ 203.0.113.8 พร้อมแปลง NAT สำเร็จ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: ลองรันคำสั่ง http 203.0.113.8 บน Corp-PC ก่อน แล้วจึงไปพิมพ์ show ip nat translations บน R1-Firewall เพื่อดูรายการ Dynamic PAT ที่ถูกสร้างขึ้น",
    "autoDemoCommands": [
      {
        "device": "Corp-PC",
        "cmds": [
          "http 203.0.113.8"
        ]
      },
      {
        "device": "R1-Firewall",
        "cmds": [
          "enable",
          "show ip nat translations"
        ]
      }
    ]
  },
  {
    "id": "lab11",
    "number": "LAB 11",
    "title": "Network Troubleshooting Methodology (3-Bug Challenge)",
    "netacadRef": "CCNA-ENSA Mod 12",
    "difficulty": "Level 3 • Troubleshooting",
    "presetId": "lab11",
    "linkedLessonId": "ch09-router-basic",
    "objectives": [
      "ประยุกต์ใช้กระบวนการวิเคราะห์ปัญหาเครือข่ายตามลำดับชั้น OSI (Physical/Data Link ➔ Network/IP ➔ Routing)",
      "ค้นหาและซ่อมแซมจุดเสีย 3 จุดในเครือข่ายที่ล่ม (พอร์ต Shutdown, Default Gateway ผิด, IP Server คนละวงแลน)",
      "ยืนยันผลการซ่อมแซมจน Auto-Grader ขึ้นคะแนนเต็ม 100%"
    ],
    "topologyDesc": "Admin-PC (192.168.10.10/24) ➔ SW1 ➔ R1-Gateway (Gig0/0 .10.1 | Gig0/1 .20.1) ➔ SW2 ➔ Payroll-SRV (ต้องอยู่ในวง .20.0/24)",
    "devices": [
      "R1-Gateway (Router)",
      "SW1 & SW2 (Switches)",
      "Admin-PC (Workstation)",
      "Payroll-SRV (Server)"
    ],
    "scenario": "เกิดเหตุเครือข่ายขัดข้อง! Admin-PC ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ระบบเงินเดือน (Payroll-SRV) ได้ จากการตรวจสอบเบื้องต้นพบความผิดปกติซ่อนอยู่ 3 จุดในระบบ คุณต้องตรวจหาและซ่อมให้ครบทั้ง 3 จุด",
    "procedure": [
      "จุดที่ 1 (Router Port Down): เปิด CLI ของ R1-Gateway ใช้คำสั่ง show ip interface brief จะพบว่า Gig0/1 เป็น administratively down ให้เข้าไปสั่ง no shutdown",
      "จุดที่ 2 (Wrong Default Gateway): ตรวจสอบ Admin-PC พบว่าตั้ง Default Gateway ผิดเป็น 192.168.99.1 ให้แก้เป็น ip default-gateway 192.168.10.1",
      "จุดที่ 3 (Wrong Subnet IP): ตรวจสอบ Payroll-SRV พบว่าตั้ง IP ผิดวงเป็น 192.168.50.100 ให้เข้า interface Eth0 แล้วแก้เป็น ip address 192.168.20.100 255.255.255.0",
      "ทดสอบส่ง Ping จาก Admin-PC ไปยัง Payroll-SRV (192.168.20.100)"
    ],
    "commands": [
      "R1-Gateway(config)# interface Gig0/1",
      "R1-Gateway(config-if)# no shutdown",
      "Admin-PC(config)# ip default-gateway 192.168.10.1",
      "Payroll-SRV(config)# interface Eth0",
      "Payroll-SRV(config-if)# ip address 192.168.20.100 255.255.255.0"
    ],
    "expectedResults": "ไฟพอร์ตทุกเส้นเปลี่ยนเป็นสีเขียว (Up) คะแนน Auto-Grader พุ่งขึ้นเป็น 100% และ Admin-PC Ping ไปยัง Payroll-SRV สำเร็จ",
    "verification": [
      "R1-Gateway# show ip interface brief",
      "Admin-PC> ping 192.168.20.100",
      "Admin-PC> traceroute 192.168.20.100"
    ],
    "graderCriteria": [
      "ซ่อมจุดที่ 1: เปิดพอร์ต Gig0/1 บน R1-Gateway ด้วยคำสั่ง no shutdown (25%)",
      "ซ่อมจุดที่ 2: แก้ Default Gateway ของ Admin-PC เป็น 192.168.10.1 (25%)",
      "ซ่อมจุดที่ 3: แก้ IP ของ Payroll-SRV ให้กลับมาอยู่ในวง 192.168.20.0/24 (25%)",
      "Admin-PC สามารถส่ง Ping ไปยัง Payroll-SRV สำเร็จครบสมบูรณ์ (25%)"
    ],
    "hintsAndSolution": "คำใบ้: กดปุ่ม \"⚡ รันเฉลยอัตโนมัติ (Auto-Demo)\" ด้านล่างเพื่อดูสคริปต์ซ่อมทั้ง 3 จุดทีละขั้นตอน หรือเปิด CLI ของแต่ละอุปกรณ์เพื่อพิมพ์ตามรายการ Required Commands",
    "autoDemoCommands": [
      {
        "device": "R1-Gateway",
        "cmds": [
          "enable",
          "configure terminal",
          "interface Gig0/1",
          "no shutdown",
          "end"
        ]
      },
      {
        "device": "PC1",
        "cmds": [
          "enable",
          "configure terminal",
          "ip default-gateway 192.168.10.1",
          "end"
        ]
      },
      {
        "device": "Payroll-SRV",
        "cmds": [
          "enable",
          "configure terminal",
          "interface Eth0",
          "ip address 192.168.20.100 255.255.255.0",
          "end"
        ]
      }
    ]
  },
  {
    "id": "lab12",
    "number": "LAB 12",
    "title": "Integrated Enterprise Network Configuration (Capstone)",
    "netacadRef": "CCNA-SRWE & CCNA-ENSA Capstone",
    "difficulty": "Level 4 • Capstone Master",
    "presetId": "lab12",
    "linkedLessonId": "ch15-port-security",
    "objectives": [
      "บูรณาการทักษะทั้งหมดตั้งแต่ Layer 2 Security (Port Security), Dynamic Routing (OSPF Area 0) ไปจนถึง WAN Edge PAT Overload",
      "เปิดใช้งาน Switch Port Security บน SW1-HQ ขา Fa0/2 เพื่อล็อกเครื่อง HQ-PC1",
      "ตั้งค่า OSPF Area 0 บน R1-HQ และเปิดใช้งาน PAT Overload บน R2-Edge เพื่อให้ออกสู่ ISP-DNS (203.0.113.8) ได้ครบวงจร"
    ],
    "topologyDesc": "HQ-PC1 (192.168.10.10/24) ➔ SW1-HQ ➔ R1-HQ (10.0.0.1/30) ⟷ R2-Edge (10.0.0.2/30 | WAN 203.0.113.1/29) ➔ ISP-DNS (203.0.113.8/29)",
    "devices": [
      "SW1-HQ (Access Switch)",
      "R1-HQ (Core OSPF Router)",
      "R2-Edge (WAN Edge NAT/OSPF Router)",
      "HQ-PC1 (192.168.10.10)",
      "ISP-DNS (203.0.113.8)"
    ],
    "scenario": "ภารกิจระดับ CCNA Capstone! คุณต้องตั้งค่าเครือข่ายองค์กรครบวงจร 3 ส่วน: (1) เปิด Port Security บน SW1-HQ พอร์ต Fa0/2, (2) เปิด OSPF Area 0 บน R1-HQ เพื่อจับคู่กับ R2-Edge และ (3) เปิด PAT Overload บน R2-Edge เพื่อให้ HQ-PC1 ออกสู่อินเทอร์เน็ต (203.0.113.8) ได้",
    "procedure": [
      "ส่วนที่ 1 (Switch Security): บน SW1-HQ เข้าสู่พอร์ต interface Fa0/2 สั่ง switchport mode access, switchport port-security และ switchport port-security mac-address sticky",
      "ส่วนที่ 2 (OSPF Area 0): บน R1-HQ เข้าโหมด router ospf 1 แล้วประกาศวง network 192.168.10.0 0.0.0.255 area 0 และ network 10.0.0.0 0.0.0.3 area 0",
      "ส่วนที่ 3 (WAN PAT Overload): บน R2-Edge สร้าง access-list 1 permit any และสั่ง ip nat inside source list 1 interface Gig0/1 overload",
      "ทดสอบส่ง Ping และ HTTP จาก HQ-PC1 (192.168.10.10) ไปยัง ISP-DNS (203.0.113.8)"
    ],
    "commands": [
      "SW1-HQ(config)# interface Fa0/2",
      "SW1-HQ(config-if)# switchport port-security",
      "SW1-HQ(config-if)# switchport port-security mac-address sticky",
      "R1-HQ(config)# router ospf 1",
      "R1-HQ(config-router)# network 192.168.10.0 0.0.0.255 area 0",
      "R1-HQ(config-router)# network 10.0.0.0 0.0.0.3 area 0",
      "R2-Edge(config)# access-list 1 permit any",
      "R2-Edge(config)# ip nat inside source list 1 interface Gig0/1 overload"
    ],
    "expectedResults": "SW1-HQ ล็อกพอร์ต Fa0/2 ด้วย Port Security, R1-HQ จับคู่ OSPF FULL กับ R2-Edge, R2-Edge แปลง PAT ออกสู่ ISP-DNS และได้คะแนน Capstone 100% เต็ม!",
    "verification": [
      "SW1-HQ# show port-security interface Fa0/2",
      "R1-HQ# show ip ospf neighbor",
      "R2-Edge# show ip nat translations",
      "HQ-PC1> ping 203.0.113.8"
    ],
    "graderCriteria": [
      "เปิดใช้งาน Switch Port Security บนพอร์ต Fa0/2 ของ SW1-HQ (25%)",
      "สร้างความสัมพันธ์ OSPF Area 0 Neighbor (FULL) ระหว่าง R1-HQ และ R2-Edge (25%)",
      "ตั้งค่า PAT Overload (ip nat inside/outside + overload) บน R2-Edge (25%)",
      "HQ-PC1 (192.168.10.10) สามารถส่ง Ping ออกไปยัง ISP-DNS (203.0.113.8) สำเร็จครบวงจร (25%)"
    ],
    "hintsAndSolution": "คำใบ้: บน R2-Edge มีการตั้งค่า ip nat inside (Gig0/0) และ ip nat outside (Gig0/1) ไว้ให้แล้ว เพียงเพิ่ม access-list 1 permit any และ ip nat inside source list 1 interface Gig0/1 overload",
    "autoDemoCommands": [
      {
        "device": "SW1-HQ",
        "cmds": [
          "enable",
          "configure terminal",
          "interface Fa0/2",
          "switchport mode access",
          "switchport port-security",
          "switchport port-security mac-address sticky",
          "end"
        ]
      },
      {
        "device": "R1-HQ",
        "cmds": [
          "enable",
          "configure terminal",
          "router ospf 1",
          "network 192.168.10.0 0.0.0.255 area 0",
          "network 10.0.0.0 0.0.0.3 area 0",
          "end"
        ]
      },
      {
        "device": "R2-Edge",
        "cmds": [
          "enable",
          "configure terminal",
          "access-list 1 permit any",
          "ip nat inside source list 1 interface Gig0/1 overload",
          "end"
        ]
      }
    ]
  }
];
