export interface AssessmentQuestion {
  id: string;
  track: string;
  question: string;
  options: string[];
  correctIndex: number;
  diagnosticWhyWrong: string;
  conceptSummary: string;
  cliRef: string;
}

export const CCNA_ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
        {
            id: 'q1',
            track: 'Networking Basics (NET-BASICS)',
            question: 'เมื่อเครื่อง PC1 (192.168.10.10/24) ต้องการส่งแพ็กเก็ตไปยัง Web Server ที่อยู่คนละวงแลน (192.168.20.100/24) ค่า Destination MAC Address ในเฟรม Layer 2 ที่ออกจาก PC1 จะเป็นของอุปกรณ์ใด?',
            options: [
                'MAC Address ของขา Default Gateway (Router ขาที่อยู่ในวง 192.168.10.0/24)',
                'MAC Address ของเครื่อง Web Server (192.168.20.100) โดยตรง',
                'Broadcast MAC Address (FFFF.FFFF.FFFF) ไปตลอดเส้นทางจนถึง Server',
                'MAC Address ของพอร์ต Switch ที่ PC1 เสียบสายแลนอยู่'
            ],
            correctIndex: 0,
            diagnosticWhyWrong: 'เมื่อปลายทางอยู่คนละ Subnet เครื่องต้นทางจะไม่ทำ ARP หา IP ปลายทางข้ามวงแลน แต่จะทำ ARP หา MAC Address ของ Default Gateway เพื่อฝากเฟรมให้ Router ส่งต่อข้ามเครือข่าย',
            conceptSummary: 'ในเฟรม Ethernet (Layer 2) ค่า Source/Destination MAC จะเปลี่ยนไปในทุกๆ Router Hop ในขณะที่ Source/Destination IP (Layer 3) จะคงเดิมจากต้นทางถึงปลายทาง (ยกเว้นทำ NAT)',
            cliRef: 'show ip arp / arp -a'
        },
        {
            id: 'q2',
            track: 'Networking Basics (NET-BASICS)',
            question: 'เครือข่าย 192.168.10.64/26 มี Subnet Mask, ช่วง Usable Host IP และจำนวนเครื่องที่ใช้งานได้จริงเท่าใด?',
            options: [
                'Mask 255.255.255.192 | ช่วงโฮสต์ 192.168.10.65 – 192.168.10.126 (62 เครื่อง)',
                'Mask 255.255.255.128 | ช่วงโฮสต์ 192.168.10.65 – 192.168.10.190 (126 เครื่อง)',
                'Mask 255.255.255.224 | ช่วงโฮสต์ 192.168.10.65 – 192.168.10.94 (30 เครื่อง)',
                'Mask 255.255.255.192 | ช่วงโฮสต์ 192.168.10.64 – 192.168.10.127 (64 เครื่อง)'
            ],
            correctIndex: 0,
            diagnosticWhyWrong: '/26 เหลือบิตโฮสต์ h = 32 - 26 = 6 บิต จำนวนเครื่องที่ใช้ได้จริงคือ 2^6 - 2 = 62 เครื่อง โดย 192.168.10.64 คือ Network Address และ 192.168.10.127 คือ Broadcast Address ห้ามนำมาตั้งให้เครื่องลูกข่าย',
            conceptSummary: 'การแบ่ง Subnet /26 มีขนาดบล็อกละ 64 ที่อยู่ (.0, .64, .128, .192) โดยต้องหักที่อยู่แรกสุด (Network ID) และสุดท้าย (Broadcast) ออกเสมอ',
            cliRef: 'ip address 192.168.10.65 255.255.255.192'
        },
        {
            id: 'q3',
            track: 'Networking Devices & Initial Config (NET-DEV-INIT)',
            question: 'เมื่อตรวจสอบเราเตอร์ด้วยคำสั่ง show ip interface brief แล้วพบว่าพอร์ต Gig0/1 แสดงสถานะ Status เป็น "administratively down" และ Protocol เป็น "down" สาเหตุและวิธีแก้ไขที่ถูกต้องคือข้อใด?',
            options: [
                'พอร์ตถูกปิดไว้โดยค่าเริ่มต้นของ IOS ต้องเข้าโหมด interface Gig0/1 แล้วพิมพ์คำสั่ง no shutdown',
                'สายแลนหลุดหรือเสียบผิดประเภท ต้องเปลี่ยนสายแลนใหม่เท่านั้น',
                'ยังไม่ได้ตั้งค่าโปรโตคอล OSPF บนพอร์ต Gig0/1',
                'ตั้งค่า Subnet Mask ไม่ตรงกับเครื่องคอมพิวเตอร์ปลายทาง'
            ],
            correctIndex: 0,
            diagnosticWhyWrong: 'คำว่า "administratively down" บน Cisco IOS หมายความว่าพอร์ตถูกสั่งปิด (shutdown) ในระดับซอฟต์แวร์ ไม่ใช่ปัญหาสายหลุด (ซึ่งจะขึ้นว่า down/down เฉยๆ)',
            conceptSummary: 'พอร์ตของ Cisco Router ทุกพอร์ตจะเริ่มต้นในสถานะ shutdown เสมอ แอดมินต้องกำหนด IP Address และสั่ง no shutdown เพื่อเปิดใช้งาน',
            cliRef: 'interface Gig0/1 -> no shutdown'
        },
        {
            id: 'q4',
            track: 'Networking Devices & Initial Config (NET-DEV-INIT)',
            question: 'ข้อใดคือชุดคำสั่งที่ถูกต้องในการตั้งค่าให้สวิตช์ Layer 2 สามารถรับการรีโมตผ่านเครือข่ายและปลอดภัยที่สุดตามหลัก Device Hardening?',
            options: [
                'ตั้ง enable secret, กำหนด IP บน interface vlan 1 (no shut), ตั้ง ip default-gateway และบังคับ transport input ssh บน line vty 0 4',
                'กำหนด IP Address ลงบนพอร์ตกายภาพ (Physical Interface) Fa0/1 โดยตรง และเปิด transport input telnet',
                'ตั้ง enable password แบบไม่เข้ารหัส และไม่ต้องกำหนด ip default-gateway',
                'ใช้คำสั่ง ip routing บนสวิตช์ Layer 2 โดยไม่ต้องสร้าง VLAN 1'
            ],
            correctIndex: 0,
            diagnosticWhyWrong: 'สวิตช์ Layer 2 ไม่สามารถกำหนด IP บนพอร์ตกายภาพ (Fa0/1) ได้ ต้องกำหนดบนพอร์ตเสมือน SVI (interface vlan 1) พร้อมตั้ง ip default-gateway และควรใช้ enable secret คู่กับ SSH แทน Telnet',
            conceptSummary: 'Telnet ส่งรหัสผ่านเป็น Plaintext จึงเสี่ยงต่อการถูกดักฟัง (Sniffing) มาตรฐาน NetAcad จึงกำหนดให้ใช้ SSH (transport input ssh) และ enable secret เสมอ',
            cliRef: 'enable secret / service password-encryption / transport input ssh'
        },
        {
            id: 'q5',
            track: 'Switching, Routing & Wireless (CCNA-SRWE)',
            question: 'ในการตั้งค่า Inter-VLAN Routing แบบ Router-on-a-Stick (ROAS) บนเราเตอร์ขา Gig0/0.10 สำหรับ VLAN 10 เหตุใดเมื่อพิมพ์คำสั่ง ip address 192.168.10.1 255.255.255.0 ทันทีแล้วระบบแจ้งเตือนข้อผิดพลาด?',
            options: [
                'เพราะยังไม่ได้พิมพ์คำสั่ง encapsulation dot1Q 10 เพื่อระบุหมายเลข VLAN Tag ให้กับ Sub-interface นั้นก่อน',
                'เพราะยังไม่ได้พิมพ์คำสั่ง switchport mode trunk บนขา Gig0/0 ของ Router',
                'เพราะ Sub-interface ไม่รองรับ Subnet Mask ขนาด /24',
                'เพราะต้องสั่ง shutdown พอร์ตหลัก Gig0/0 ก่อนสร้าง Sub-interface'
            ],
            correctIndex: 0,
            diagnosticWhyWrong: 'บน Cisco IOS Router พอร์ตย่อย (Sub-interface) จะไม่ยอมรับคำสั่ง ip address จนกว่าจะระบุโปรโตคอลการติดป้ายแท็กด้วยคำสั่ง encapsulation dot1Q <vlan-id> เสียก่อน',
            conceptSummary: 'ในสถาปัตยกรรม ROAS พอร์ตฝั่ง Switch ต้องตั้งเป็น switchport mode trunk ส่วนฝั่ง Router ต้องสร้าง Sub-interface (เช่น Gig0/0.10), สั่ง encapsulation dot1Q 10, ใส่ ip address และสั่ง no shutdown ที่พอร์ตแม่ Gig0/0',
            cliRef: 'interface Gig0/0.10 -> encapsulation dot1Q 10 -> ip address ...'
        },
        {
            id: 'q6',
            track: 'Switching, Routing & Wireless (CCNA-SRWE)',
            question: 'ในโปรโตคอล Spanning Tree Protocol (STP) และ EtherChannel ข้อใดอธิบายพฤติกรรมการทำงานได้ถูกต้องที่สุด?',
            options: [
                'สวิตช์ที่มีค่า Bridge Priority ต่ำที่สุดจะได้รับเลือกเป็น Root Bridge และพอร์ตที่รวมกลุ่มเป็น EtherChannel (Port-channel) จะถูกมองเป็นลิงก์ตรรกะเส้นเดียวจึงไม่ถูก STP บล็อกกันเอง',
                'สวิตช์ที่มีค่า Bridge Priority สูงที่สุดจะเป็น Root Bridge เสมอ และ STP จะบล็อกพอร์ตทุกเส้นในกลุ่ม EtherChannel ยกเว้นเส้นแรก',
                'การจับคู่ LACP EtherChannel จะสำเร็จได้เมื่อตั้งค่าโหมดเป็น passive ทั้งสองฝั่งของสายแลน',
                'คำสั่ง spanning-tree portfast ควรเปิดใช้งานเฉพาะบนพอร์ต Trunk ที่เชื่อมระหว่าง Switch กับ Switch เท่านั้น'
            ],
            correctIndex: 0,
            diagnosticWhyWrong: 'STP เลือก Root Bridge จากค่า Bridge ID (Priority + MAC) ที่ "ต่ำที่สุด" ไม่ใช่สูงที่สุด และการรวมพอร์ตด้วย EtherChannel (LACP active/active หรือ active/passive) จะทำให้ STP มองพอร์ตขนานเหล่านั้นเป็น Logical Link เดียว',
            conceptSummary: 'หากต่อสายแลนขนานกันระหว่างสวิตช์โดยไม่ทำ EtherChannel โปรโตคอล STP จะสั่งบล็อก (BLK) เส้นสำรองเพื่อกัน Loop แต่หากมัดรวมด้วย EtherChannel จะได้ทั้งแบนด์วิดท์เพิ่มและ Redundancy พร้อมกัน',
            cliRef: 'spanning-tree vlan 1 root primary / channel-group 1 mode active'
        },
        {
            id: 'q7',
            track: 'Switching, Routing & Wireless (CCNA-SRWE)',
            question: 'เมื่อเปิดใช้งาน DHCPv4 Server บน Cisco Router คำสั่งใดใช้สำหรับป้องกันไม่ให้ Router แจก IP Address ของตัวเอง (192.168.10.1) และของ File Server (192.168.10.2–192.168.10.9) ไปซ้ำกับเครื่องลูกข่าย?',
            options: [
                'พิมพ์คำสั่ง ip dhcp excluded-address 192.168.10.1 192.168.10.9 ในโหมด Global Configuration',
                'พิมพ์คำสั่ง exclude-ip 192.168.10.1 192.168.10.9 เข้าไปข้างในโหมด dhcp-config',
                'สร้าง Standard ACL เพื่อบล็อก IP 192.168.10.1 ถึง 192.168.10.9',
                'ไม่ต้องตั้งค่าใดๆ เพราะ DHCP Pool จะเว้น 10 ที่อยู่แรกให้อัตโนมัติเสมอ'
            ],
            correctIndex: 0,
            diagnosticWhyWrong: 'คำสั่ง ip dhcp excluded-address <low-ip> [high-ip] ต้องพิมพ์ในโหมด Global Configuration (config)# ไม่ใช่ในโหมดย่อยของ Pool และต้องระบุเพื่อป้องกันปัญหา IP Address Conflict',
            conceptSummary: 'กระบวนการ DHCP DORA (Discover -> Offer -> Request -> Ack) จะเลือกแจก IP จากช่วง network ใน Pool ที่ไม่ได้อยู่ในรายการ ip dhcp excluded-address',
            cliRef: 'ip dhcp excluded-address 192.168.10.1 192.168.10.9'
        },
        {
            id: 'q8',
            track: 'Switching, Routing & Wireless (CCNA-SRWE)',
            question: 'เราเตอร์ R1 และ R2 เชื่อมต่อกันด้วยลิงก์ 10.0.0.0/30 แต่ไม่สามารถสร้างความสัมพันธ์ OSPF Neighbor (show ip ospf neighbor ว่างเปล่า) สาเหตุใดต่อไปนี้ที่ทำให้ OSPF สร้าง Neighbor ไม่สำเร็จ?',
            options: [
                'R1 ตั้งค่า network 10.0.0.0 0.0.0.3 area 0 แต่ R2 ตั้งค่าเป็น area 1 (Area ID ไม่ตรงกัน)',
                'R1 ใช้คำสั่ง router ospf 1 แต่ R2 ใช้คำสั่ง router ospf 10 (Process ID ต่างกัน)',
                'ไม่ได้ตั้งค่า Static Route ควบคู่ไปกับ OSPF บนพอร์ตเดียวกัน',
                'ค่า Administrative Distance ของ OSPF มีค่าเป็น 110 ซึ่งสูงกว่า Static Route'
            ],
            correctIndex: 0,
            diagnosticWhyWrong: 'หมายเลข Process ID ของ OSPF (เช่น router ospf 1 กับ router ospf 10) มีความสำคัญเฉพาะภายในตัวเครื่อง (Locally Significant) จึงต่างกันได้ แต่หมายเลข Area ID, Subnet และ Hello/Dead Timers บนลิงก์เดียวกันต้องตรงกัน 100% จึงจะจับคู่ Neighbor ได้',
            conceptSummary: 'เงื่อนไขการสร้าง OSPF Neighbor Adjacency: (1) อยู่บน Subnet เดียวกัน, (2) อยู่ใน Area ID เดียวกัน, (3) Hello/Dead Timers ตรงกัน และ (4) พอร์ตไม่เป็น Passive Interface',
            cliRef: 'router ospf 1 -> network 10.0.0.0 0.0.0.3 area 0'
        },
        {
            id: 'q9',
            track: 'Network Security (CCNA-ENSA)',
            question: 'แอดมินพิมพ์คำสั่งต่อไปนี้บนเราเตอร์:\naccess-list 100 deny ip host 192.168.10.50 any\nแล้วนำไปผูกกับพอร์ต Gig0/0 ขาเข้า (ip access-group 100 in) ทันทีโดยไม่ได้พิมพ์คำสั่งอื่นเพิ่ม ผลลัพธ์จะเป็นอย่างไร?',
            options: [
                'คอมพิวเตอร์ทุกเครื่องในวง 192.168.10.0/24 จะถูกบล็อกทั้งหมด เพราะบรรทัดสุดท้ายของทุก ACL มีกฎ Implicit Deny Any (deny ip any any) ซ่อนอยู่เสมอ',
                'มีเฉพาะเครื่อง 192.168.10.50 เท่านั้นที่ถูกบล็อก ส่วนเครื่องอื่นๆ ออกอินเทอร์เน็ตได้ตามปกติ',
                'ACL จะไม่ทำงานจนกว่าจะรีสตาร์ทเราเตอร์ด้วยคำสั่ง reload',
                'เราเตอร์จะอนุญาตเฉพาะแพ็กเก็ต ICMP Ping แต่บล็อก HTTP'
            ],
            correctIndex: 0,
            diagnosticWhyWrong: 'Cisco IOS ACL ทุกชุดจะมีกฎที่มองไม่เห็น (Implicit Deny Any) อยู่ท้ายสุดเสมอ หากมีแต่บรรทัด deny โดยไม่มีบรรทัด permit อย่างน้อย 1 บรรทัด แพ็กเก็ตจากเครื่องอื่นๆ ที่ไม่ตรงกับข้อแรกจะตกลงไปโดน Implicit Deny ทั้งหมด!',
            conceptSummary: 'กฎทองของการเขียน ACL: ประมวลผลจากบนลงล่าง (Top-Down First-Match) และต้องมีอนุญาต (เช่น access-list 100 permit ip any any) เพื่อไม่ให้ทราฟฟิกปกติถูกบล็อกโดย Implicit Deny',
            cliRef: 'access-list 100 permit ip any any'
        },
        {
            id: 'q10',
            track: 'Network Security (CCNA-ENSA)',
            question: 'เมื่อตั้งค่า Switch Port Security บนพอร์ต Fa0/1 ด้วยค่าเริ่มต้น (Default Violation Mode = Shutdown, Maximum = 1) หากมีคนถอดสายแลนไปเสียบโน้ตบุ๊กแปลกปลอมแล้วส่งข้อมูล พอร์ต Fa0/1 จะเป็นอย่างไรและแอดมินต้องกู้คืนอย่างไร?',
            options: [
                'พอร์ตจะถูกตัดการทำงานเป็นสถานะ err-disabled ทันที แอดมินต้องเข้า interface Fa0/1 แล้วพิมพ์คำสั่ง shutdown ตามด้วย no shutdown',
                'พอร์ตจะยังคงเปิดอยู่แต่จำกัดความเร็วเหลือ 10 Mbps',
                'พอร์ตจะรีเซ็ตตัวเองอัตโนมัติทันทีที่ถอดสายแลนออกโดยไม่ต้องพิมพ์คำสั่งใดๆ',
                'สวิตช์จะลบ VLAN ทั้งหมดในฐานข้อมูลเพื่อป้องกันการโจมตี'
            ],
            correctIndex: 0,
            diagnosticWhyWrong: 'ในโหมด Violation Shutdown (ค่าเริ่มต้น) เมื่อตรวจพบ Source MAC Address เกินจำนวนหรือไม่อยู่ในรายการที่อนุญาต สวิตช์จะสั่งปิดพอร์ตเป็นสถานะ err-disabled ทันที การสั่ง no shutdown อย่างเดียวจะไม่พอ ต้องสั่ง shutdown ก่อนแล้วจึงสั่ง no shutdown',
            conceptSummary: 'โหมดของ Port Security มี 3 รูปแบบ: Protect (ทิ้งเฟรมเงียบๆ), Restrict (ทิ้งเฟรม + นับสถิติ Violation + แจ้ง Syslog) และ Shutdown (ตัดพอร์ตเป็น err-disabled)',
            cliRef: 'show port-security interface Fa0/1 / shutdown -> no shutdown'
        }
    ];
