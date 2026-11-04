import { PracticalLab } from '../types/lab';

export interface CourseModule {
  id: string;
  number: string;
  topicEn: string;
  title: string;
  badge: string;
  netacadRef: string;
  presetLab: string;
  theorySummary: string;
  simScope: { authentic: string; simplified: string };
  examTips: string[];
  cheatSheet: Array<{ cmd: string; desc: string }>;
}

export const NETACAD_LESSONS: CourseModule[] = [
  {
    id: 'ch01-network-layer',
    number: 'บทที่ 01',
    topicEn: 'Network Layer',
    title: 'IP Packet, ICMP & Traceroute',
    badge: 'OSI Layer 3',
    netacadRef: 'NET-BASICS / CCNA-ITN Mod 8, 14',
    presetLab: 'lab4',
    theorySummary: 'หน้าที่หลักของ Network Layer คือ Logical Addressing (IP Address), Packet Encapsulation พร้อมระบุค่า TTL เพื่อป้องกัน Routing Loop และการค้นหาเส้นทางที่ดีที่สุดด้วย Routing Table',
    simScope: {
      authentic: 'จำลอง IPv4 Header, การลด TTL ทีละ 1 ต่อ Hop, Longest Prefix Match และ ICMP Echo/Traceroute ตามจริง',
      simplified: 'ไม่จำลอง IP MTU Fragmentation ระดับบิตเพื่อให้ตรวจสอบบน OSI Inspector ได้ง่าย'
    },
    examTips: [
      'ค่า TTL ลดลงทีละ 1 ทุกครั้งที่ผ่าน Router แต่ไม่ลดเมื่อผ่าน Layer 2 Switch',
      'Ping ใช้ ICMP Echo Request (Type 8) และรับกลับด้วย ICMP Echo Reply (Type 0)',
      'Traceroute ส่งแพ็กเก็ตเริ่มที่ TTL=1, 2, 3 เพื่อให้เราเตอร์ตอบ ICMP Time Exceeded กลับมา'
    ],
    cheatSheet: [
      { cmd: 'ping 192.168.20.10', desc: 'ทดสอบการเชื่อมต่อระดับ Layer 3 ด้วย ICMP Echo' },
      { cmd: 'traceroute 192.168.20.10', desc: 'ตรวจสอบรายชื่อ Router ทุก Hop ที่แพ็กเก็ตวิ่งผ่าน' },
      { cmd: 'show ip route', desc: 'ตรวจสอบตารางเส้นทาง (Routing Table) บน Router' }
    ]
  },
  {
    id: 'ch02-arp',
    number: 'บทที่ 02',
    topicEn: 'Address Resolution',
    title: 'ARP & Neighbor Discovery',
    badge: 'L2 ⟷ L3',
    netacadRef: 'NET-BASICS / CCNA-ITN Mod 9',
    presetLab: 'lab1',
    theorySummary: 'ARP จับคู่ Logical IP เข้ากับ Physical MAC Address หากส่งในวงเดียวกันจะ Broadcast ถามหาเครื่องปลายทาง แต่หากส่งข้ามวงแลนจะทำ ARP หา MAC ของ Default Gateway เสมอ',
    simScope: {
      authentic: 'จำลอง ARP Request Broadcast (FFFF.FFFF.FFFF), ARP Reply Unicast และ ARP Cache Table',
      simplified: 'ARP Cache ไม่มีวันหมดอายุระหว่างเซสชัน'
    },
    examTips: [
      'ARP Request เป็น Broadcast แต่ ARP Reply ตอบกลับเป็น Unicast',
      'หากส่งข้อมูลข้ามวงแลน Destination MAC ในเฟรมจะเป็น MAC ของ Default Gateway เสมอ'
    ],
    cheatSheet: [
      { cmd: 'arp -a', desc: 'ดูตาราง ARP Cache บนเครื่องลูกข่าย' },
      { cmd: 'show ip arp', desc: 'ดูตาราง ARP Table บน Cisco IOS' }
    ]
  },
  {
    id: 'ch08-vlans',
    number: 'บทที่ 08',
    topicEn: 'VLANs & Trunking',
    title: 'VLAN Concept, Trunk & Native VLAN',
    badge: '802.1Q VLAN',
    netacadRef: 'CCNA-SRWE Mod 3',
    presetLab: 'lab5',
    theorySummary: 'VLAN แบ่ง Broadcast Domain ออกเป็นส่วนๆ เพื่อความปลอดภัย Access Port เชื่อมต่อกับเครื่องปลายทาง ส่วน Trunk Port (IEEE 802.1Q) แทรกป้าย 4-byte Tag ข้ามสวิตช์',
    simScope: {
      authentic: 'แยก Broadcast Domain ตาม VLAN ID, ตรวจสอบ Access vs 802.1Q Trunk และ Native VLAN',
      simplified: 'ไม่จำลองโปรโตคอล DTP อัตโนมัติ บังคับตั้งค่าแบบ Static ตาม Best Practice'
    },
    examTips: [
      'มาตรฐานการติดป้าย VLAN Tag บนสาย Trunk คือ IEEE 802.1Q ขนาด 4 Bytes',
      'Native VLAN (ค่าเริ่มต้น VLAN 1) จะวิ่งผ่าน Trunk โดยไม่ติดป้าย Tag'
    ],
    cheatSheet: [
      { cmd: 'vlan 10', desc: 'สร้าง VLAN 10 บนสวิตช์' },
      { cmd: 'switchport mode access', desc: 'ตั้งค่าพอร์ตสำหรับต่อเครื่องคอมพิวเตอร์' },
      { cmd: 'switchport access vlan 10', desc: 'กำหนดให้พอร์ตเป็นสมาชิกของ VLAN 10' },
      { cmd: 'switchport mode trunk', desc: 'ตั้งค่าพอร์ตเป็นท่อรวมสัญญาณ 802.1Q Trunk' }
    ]
  },
  {
    id: 'ch12-acl',
    number: 'บทที่ 12',
    topicEn: 'Access Control Lists',
    title: 'Standard & Extended IPv4 ACLs',
    badge: 'Security',
    netacadRef: 'CCNA-ENSA Mod 4–5',
    presetLab: 'lab9',
    theorySummary: 'ACL เป็นกฎคัดกรองแพ็กเก็ตที่ประมวลผลจากบนลงล่าง (Top-Down First-Match) โดย Standard ACL กรองเฉพาะ Source IP ส่วน Extended ACL กรองได้ทั้ง Protocol, IP และ Port',
    simScope: {
      authentic: 'ประมวลผลกฎจากบนลงล่าง, รองรับ Wildcard Mask, กรองพอร์ต TCP/UDP และบังคับใช้ Implicit Deny Any เสมอ',
      simplified: 'รองรับ Numbered ACL และ Named ACL พื้นฐาน'
    },
    examTips: [
      'Standard ACL (1-99) ควรวางไว้ใกล้ Destination | Extended ACL (100-199) ควรวางไว้ใกล้ Source',
      'ท้ายตาราง ACL ทุกชุดมีกฎ Implicit Deny Any ซ่อนอยู่เสมอ ต้องมีบรรทัด permit อย่างน้อย 1 ข้อ!'
    ],
    cheatSheet: [
      { cmd: 'access-list 1 deny 192.168.10.50 0.0.0.0', desc: 'บล็อกทุกแพ็กเก็ตจากโฮสต์ 192.168.10.50' },
      { cmd: 'access-list 100 permit ip any any', desc: 'อนุญาตแพ็กเก็ตที่เหลือทั้งหมด' },
      { cmd: 'ip access-group 100 in', desc: 'ผูก ACL กับพอร์ตขาเข้า (Inbound)' }
    ]
  }
];

export const PRACTICAL_LABS_CATALOG: PracticalLab[] = [
  {
    id: 'lab1',
    number: 'LAB 01',
    title: 'Basic Switch Configuration & MAC Address Table',
    netacadRef: 'NET-DEV-INIT / CCNA-ITN Mod 2, 7',
    difficulty: 'Level 1 • Beginner',
    presetId: 'lab1',
    linkedLessonId: 'ch07-basic-switch-config',
    objectives: [
      'ตั้งชื่อสวิตช์ (Hostname) และรหัสผ่านโหมด Privileged ด้วย enable secret',
      'กำหนด IP Address บนพอร์ตเสมือน Management VLAN 1 SVI',
      'ทดสอบการสื่อสารในวงแลนเดียวกันและตรวจสอบตาราง CAM / MAC Address Table'
    ],
    topologyDesc: 'PC1 (192.168.1.10/24), PC2 (192.168.1.11/24) และ File-SRV (192.168.1.100/24) เชื่อมต่อผ่าน SW1-Access',
    devices: ['SW1-Access (Switch)', 'PC1 (PC)', 'PC2 (PC)', 'File-SRV (Server)'],
    scenario: 'คุณเพิ่งติดตั้งสวิตช์ใหม่ ต้องตั้งค่าความปลอดภัยพื้นฐานและ Management IP 192.168.1.2/24 บน VLAN 1',
    procedure: [
      'เข้าสู่โหมด Global Configuration บน SW1-Access',
      'ตั้งรหัสผ่านด้วย enable secret class และเปิด service password-encryption',
      'เข้า interface vlan 1 กำหนด ip address 192.168.1.2 255.255.255.0 และสั่ง no shutdown',
      'ทดสอบ Ping จาก PC1 ไปยัง File-SRV'
    ],
    commands: [
      'SW1-Access(config)# enable secret class',
      'SW1-Access(config)# service password-encryption',
      'SW1-Access(config)# interface vlan 1',
      'SW1-Access(config-if)# ip address 192.168.1.2 255.255.255.0',
      'SW1-Access(config-if)# no shutdown'
    ],
    expectedResults: 'SW1-Access มีพอร์ต VLAN 1 สถานะ Up และ PC1 ส่ง Ping ถึง File-SRV สำเร็จ 100%',
    verification: ['SW1-Access# show ip interface brief', 'SW1-Access# show mac address-table', 'PC1> ping 192.168.1.100'],
    graderCriteria: [
      'พอร์ต Fa0/1–Fa0/3 ของ SW1-Access เปิดทำงานครบทุกพอร์ต (25%)',
      'ตั้งค่า Device Hardening หรือ Management SVI VLAN 1 บน Switch (25%)',
      'เครื่องลูกข่ายอยู่ในวง 192.168.1.0/24 ถูกต้อง (25%)',
      'PC1 สามารถส่ง Ping ไปยัง File-SRV สำเร็จ (25%)'
    ],
    hintsAndSolution: 'คำใบ้: เข้า interface vlan 1 แล้วพิมพ์ ip address 192.168.1.2 255.255.255.0 ตามด้วย no shutdown'
  },
  {
    id: 'lab4',
    number: 'LAB 04',
    title: 'IPv4 Static & Default Routing',
    netacadRef: 'CCNA-SRWE Mod 15–16',
    difficulty: 'Level 2 • Intermediate',
    presetId: 'lab4',
    linkedLessonId: 'ch01-network-layer',
    objectives: [
      'เข้าใจการตัดสินใจเลือกเส้นทางและ Next-Hop Recursive Lookup',
      'ตั้งค่า Static Route (ip route) ทั้งขาไปและขากลับ',
      'ตรวจสอบตาราง Routing Table และเส้นทางด้วย traceroute'
    ],
    topologyDesc: 'HQ-PC (192.168.10.10/24) ➔ R1-HQ (10.0.0.1/30) ⟷ R2-Branch (10.0.0.2/30) ➔ Branch-SRV (192.168.30.100/24)',
    devices: ['R1-HQ (Router)', 'R2-Branch (Router)', 'HQ-PC', 'Branch-SRV'],
    scenario: 'เชื่อมต่อสำนักงานใหญ่กับสาขาผ่าน WAN ลิงก์ 10.0.0.0/30 ด้วยคำสั่ง ip route ทั้งขาไปและขากลับ',
    procedure: [
      'บน R1-HQ กำหนด: ip route 192.168.30.0 255.255.255.0 10.0.0.2',
      'บน R2-Branch กำหนดเส้นทางขากลับ: ip route 192.168.10.0 255.255.255.0 10.0.0.1',
      'ทดสอบ ping 192.168.30.100 จาก HQ-PC'
    ],
    commands: [
      'R1-HQ(config)# ip route 192.168.30.0 255.255.255.0 10.0.0.2',
      'R2-Branch(config)# ip route 192.168.10.0 255.255.255.0 10.0.0.1'
    ],
    expectedResults: 'ตาราง Routing ทั้งสองฝั่งมีรายการ S (Static Route) และ Ping ข้าม WAN สำเร็จ',
    verification: ['R1-HQ# show ip route', 'R2-Branch# show ip route', 'HQ-PC> traceroute 192.168.30.100'],
    graderCriteria: [
      'ลิงก์ WAN 10.0.0.0/30 เปิดใช้งานปกติ (25%)',
      'R1-HQ มี Static Route ไปยังวงสาขาผ่าน 10.0.0.2 (25%)',
      'R2-Branch มี Static Route ขากลับมายังสำนักงานใหญ่ (25%)',
      'HQ-PC สามารถ Ping ไปยัง Branch-SRV สำเร็จ (25%)'
    ],
    hintsAndSolution: 'คำใบ้: การสื่อสารระดับ IP ต้องมีเส้นทางทั้งขาไปและขากลับเสมอ'
  }
];

