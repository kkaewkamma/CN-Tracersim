/**
 * NetSim Touch v5.0 Academy Edition - Interactive Network Course & Step-by-Step Cisco CLI Coach
 * Covers 100% of the 13 University Network Course Syllabus Topics:
 *  1. Network Layer (IP Packet, Routing Concept, ICMP, Traceroute)
 *  2. Address Resolution (ARP Request Broadcast & Neighbor Discovery, show ip arp)
 *  3. Transport Layer (TCP/UDP Port Numbers, Wireshark 3-Way Handshake, HTTP Port 80)
 *  4. IPv4 Addressing (Subnetting, VLSM, CIDR & Interactive Calculator)
 *  5. IPv6 Addressing (IPv6 Structure, SLAAC, DHCPv6, Config & Ping IPv6)
 *  6. Switches Concepts (MAC Table / CAM Table, Learning, Flooding, Forwarding)
 *  7. Basic Switches & End Device Configuration (CLI Modes, Hostname, Password, SSH, Management VLAN)
 *  8. VLANs (VLAN Concept, 802.1Q Trunk, Native VLAN)
 *  9. Basic Router Configuration (Router Interfaces, Static IP, no shutdown)
 * 10. Routing Concepts (Static Route, Default Route, Dynamic OSPF Routing)
 * 11. Inter-VLAN Routing (Router-on-a-Stick 802.1Q Sub-interface & Layer 3 Switch SVI)
 * 12. Access Control Lists - ACL (Standard ACL 1-99 vs Extended ACL 100-199)
 * 13. Network Address Translation - NAT (Static NAT, Dynamic NAT & PAT Overload)
 */

const AcademyTutor = {
    activeLessonId: 'ch09-router-basic',
    completedStepIndices: {},
    activeRightTab: 'coach', // 'coach' | 'logs'

    lessons: [
        {
            id: 'ch01-network-layer',
            number: 'บทที่ 01',
            topicEn: 'Network Layer',
            title: 'IP Packet, ICMP & Traceroute',
            badge: 'OSI Layer 3',
            color: 'cyan',
            presetLab: 'static-route',
            theorySummary: `
                <b>หน้าที่หลักของ Network Layer (OSI Layer 3):</b><br>
                • <b>Addressing:</b> กำหนดที่อยู่แบบ Logical (IP Address) เพื่อระบุต้นทาง (Source IP) และปลายทาง (Destination IP)<br>
                • <b>Encapsulation:</b> ห่อหุ้ม Transport Segment เป็น <b>IP Packet</b> พร้อมใส่หัวข้อมูลสำคัญ เช่น <b>TTL (Time-to-Live)</b> ซึ่งจะลดลงทีละ 1 ทุกครั้งที่ผ่าน Router เพื่อป้องกัน Routing Loop<br>
                • <b>Routing:</b> เราเตอร์เลือกเส้นทางที่ดีที่สุดจากตาราง Routing Table เพื่อส่งแพ็กเก็ตข้ามเครือข่าย
            `,
            examTips: [
                'ค่า TTL (Time-to-Live) ลดลงทีละ 1 ทุกครั้งที่ผ่าน Router (Layer 3) แต่ไม่ลดเมื่อผ่าน Switch (Layer 2)',
                'Ping ใช้โปรโตคอล ICMP Echo Request (Type 8) และรับกลับด้วย ICMP Echo Reply (Type 0)',
                'Traceroute ใช้การส่งแพ็กเก็ตโดยตั้ง TTL=1, 2, 3... เพื่อให้เราเตอร์แต่ละ Hop ตอบ ICMP Time Exceeded กลับมา'
            ],
            cheatSheet: [
                { cmd: 'ping 192.168.20.10', desc: 'ทดสอบการเชื่อมต่อระดับ Layer 3 ด้วย ICMP Echo' },
                { cmd: 'traceroute 192.168.20.10', desc: 'ตรวจสอบรายชื่อ Router ทุก Hop ที่แพ็กเก็ตวิ่งผ่าน' },
                { cmd: 'show ip route', desc: 'ตรวจสอบตารางเส้นทาง (Routing Table) บน Router' }
            ],
            steps: [
                {
                    device: 'HQ-PC',
                    cmd: 'ping 192.168.30.100',
                    match: /^ping\s+192\.168\.30\.100/i,
                    explain: 'ทดสอบส่ง ICMP Echo Request จาก HQ-PC ข้าม Router 2 ตัวไปยัง Branch-SRV (192.168.30.100)'
                },
                {
                    device: 'HQ-PC',
                    cmd: 'traceroute 192.168.30.100',
                    match: /^trac(eroute|ert)\s+192\.168\.30\.100/i,
                    explain: 'ใช้คำสั่ง traceroute เพื่อไล่ดู IP ของ Router ทีละ Hop (R1-HQ 192.168.10.1 ➔ R2-Branch 10.0.0.2 ➔ 192.168.30.100)'
                },
                {
                    device: 'R1-HQ',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-HQ'
                },
                {
                    device: 'R1-HQ',
                    cmd: 'show ip route',
                    match: /^sh(ow)?\s+ip\s+ro/i,
                    explain: 'ตรวจสอบตาราง Routing Table ดูความแตกต่างระหว่าง C (Connected) และ S (Static Route)'
                }
            ]
        },
        {
            id: 'ch02-arp',
            number: 'บทที่ 02',
            topicEn: 'Address Resolution',
            title: 'ARP & Neighbor Discovery',
            badge: 'L2 ⟷ L3',
            color: 'emerald',
            presetLab: 'lan',
            theorySummary: `
                <b>Address Resolution Protocol (ARP):</b><br>
                • เมื่อเครื่องต้นทางต้องการส่งข้อมูลไปหา IP ในวงแลนเดียวกัน แต่ยังไม่รู้ <b>MAC Address</b> ปลายทาง จะส่ง <b>ARP Request</b> แบบ <b>Broadcast (Dst MAC: FFFF.FFFF.FFFF)</b> ไปถามทุกเครื่องใน VLAN<br>
                • เครื่องที่เป็นเจ้าของ IP นั้นจะตอบกลับด้วย <b>ARP Reply (Unicast)</b> พร้อมแจ้ง MAC Address ของตน แล้วบันทึกลงใน <b>ARP Table (ARP Cache)</b><br>
                • หากปลายทางอยู่คนละวงแลน เครื่องจะทำ ARP ขอ MAC Address ของ <b>Default Gateway</b> แทน!
            `,
            examTips: [
                'ARP Request ส่งแบบ Broadcast (FFFF.FFFF.FFFF) แต่ ARP Reply ตอบกลับแบบ Unicast',
                'ใน IPv6 จะไม่ใช้ ARP แต่ใช้ ICMPv6 Neighbor Discovery (NS / NA) แทน',
                'หากส่งข้อมูลข้ามวงแลน Destination MAC ในเฟรม Layer 2 จะเป็น MAC ของ Default Gateway เสมอ'
            ],
            cheatSheet: [
                { cmd: 'arp -a', desc: 'ดูตาราง ARP Cache บนเครื่อง PC หรืออุปกรณ์' },
                { cmd: 'show ip arp', desc: 'ดูตารางการจับคู่ IP Address กับ Hardware MAC Address บน Cisco IOS' },
                { cmd: 'clear arp-cache', desc: 'ล้างตาราง ARP Cache เพื่อให้เรียนรู้ใหม่' }
            ],
            steps: [
                {
                    device: 'PC1',
                    cmd: 'arp -a',
                    match: /^(arp|sh(ow)?\s+ip\s+arp)/i,
                    explain: 'ตรวจสอบตาราง ARP Table บน PC1 เพื่อดูรายการจับคู่ IP Address คู่กับ MAC Address (ARPA)'
                },
                {
                    device: 'PC1',
                    cmd: 'ping 192.168.1.100',
                    match: /^ping\s+192\.168\.1\.100/i,
                    explain: 'ส่ง Ping ไปยัง File-SRV (192.168.1.100) เพื่อให้เกิดการค้นหา ARP และส่งข้อมูลผ่าน Switch'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บนสวิตช์ SW1-Access'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'show ip arp',
                    match: /^sh(ow)?\s+(ip\s+)?arp/i,
                    explain: 'ตรวจสอบตาราง ARP บนอุปกรณ์เครือข่าย'
                }
            ]
        },
        {
            id: 'ch03-transport-layer',
            number: 'บทที่ 03',
            topicEn: 'Transport Layer',
            title: 'TCP/UDP Port & 3-Way Handshake',
            badge: 'OSI Layer 4',
            color: 'purple',
            presetLab: 'acl-nat',
            theorySummary: `
                <b>Transport Layer (OSI Layer 4):</b><br>
                • <b>TCP (Transmission Control Protocol):</b> เชื่อมต่อแบบ Connection-oriented เชื่อถือได้ ต้องทำ <b>3-Way Handshake (1. SYN ➔ 2. SYN-ACK ➔ 3. ACK)</b> ก่อนส่งข้อมูล เช่น <b>HTTP (Port 80), HTTPS (443), SSH (22)</b><br>
                • <b>UDP (User Datagram Protocol):</b> แบบ Connectionless ส่งเร็วแต่ไม่ยืนยันการรับ เช่น <b>DNS (Port 53), DHCP (Port 67/68)</b>
            `,
            examTips: [
                'TCP 3-Way Handshake มี 3 ขั้นตอน: SYN ➔ SYN-ACK ➔ ACK',
                'Well-Known Ports ที่ออกสอบบ่อย: FTP (20/21), SSH (22), Telnet (23), DNS (53), DHCP (67/68), HTTP (80), HTTPS (443)',
                'สามารถกดปุ่ม "🔍 OSI 7-Layer" หลังส่ง HTTP เพื่อดู TCP Handshake แบบ Wireshark ได้ทันที'
            ],
            cheatSheet: [
                { cmd: 'http 203.0.113.8', desc: 'จำลองการทำ TCP 3-Way Handshake (Port 80) และดึงหน้าเว็บ HTTP GET' },
                { cmd: 'ping 203.0.113.8', desc: 'ทดสอบส่ง ICMP (ซึ่งในแล็บที่ 7 จะถูกบล็อกด้วย ACL แต่เปิดเฉพาะ TCP Port 80)' }
            ],
            steps: [
                {
                    device: 'Corp-PC',
                    cmd: 'http 203.0.113.8',
                    match: /^(http|curl)\s+203\.0\.113\.8/i,
                    explain: 'จำลองการเชื่อมต่อ TCP Port 80 (SYN ➔ SYN-ACK ➔ ACK) และส่งคำขอ HTTP GET ไปยัง ISP-Cloud (203.0.113.8)'
                },
                {
                    device: 'Corp-PC',
                    cmd: 'ping 203.0.113.8',
                    match: /^ping\s+203\.0\.113\.8/i,
                    explain: 'เปรียบเทียบการส่ง ICMP Ping ไปที่ 203.0.113.8 (จะพบว่า Firewall บล็อก ICMP แต่ยอมให้ TCP Port 80 ผ่านได้!)'
                }
            ]
        },
        {
            id: 'ch04-ipv4-subnetting',
            number: 'บทที่ 04',
            topicEn: 'IPv4 Addressing',
            title: 'Subnetting, VLSM & CIDR',
            badge: 'Subnetting',
            color: 'amber',
            presetLab: 'troubleshoot',
            theorySummary: `
                <b>การคำนวณ IPv4 Subnetting, CIDR และ VLSM:</b><br>
                • <b>CIDR (/Prefix):</b> จำนวนบิตที่เป็นเลข 1 ใน Subnet Mask เช่น <code>/24</code> = <code>255.255.255.0</code> (เหลือบิตโฮสต์ $h = 32 - 24 = 8$ บิต)<br>
                • <b>สูตรจำนวนเครื่อง (Usable Hosts):</b> $2^h - 2$ (หัก Network Address ใบแรก และ Broadcast Address ใบสุดท้ายออก)<br>
                • <b>VLSM:</b> การนำ Subnet มาซอยย่อยตามขนาดที่ใช้งานจริง เช่น ลิงก์เชื่อมระหว่าง Router 2 ตัวใช้แค่ <code>/30</code> ($2^2 - 2 = 2$ โฮสต์) เพื่อประหยัด IP
            `,
            examTips: [
                '/24 = 254 เครื่อง | /25 = 126 เครื่อง | /26 = 62 เครื่อง | /27 = 30 เครื่อง | /28 = 14 เครื่อง | /30 = 2 เครื่อง',
                'กดแท็บ "🧮 เครื่องคิดเลข Subnet & VLSM" ด้านบนเพื่อฝึกคำนวณโจทย์สอบได้ทันที!',
                'ในแล็บนี้ Server1 ตั้ง IP ผิดวง (192.168.50.100) ต้องแก้ให้ตรงกับวง 192.168.20.0/24 ของ Router!'
            ],
            cheatSheet: [
                { cmd: 'interface Eth0', desc: 'เข้าสู่พอร์ตเครือข่ายของเครื่อง Server' },
                { cmd: 'ip address 192.168.20.100 255.255.255.0', desc: 'กำหนด IPv4 และ Subnet Mask /24 ให้อยู่ในวงเดียวกับ Gateway (.20.1)' }
            ],
            steps: [
                {
                    device: 'Payroll-SRV',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เปิด CLI ของเครื่อง Payroll-SRV แล้วเข้าสู่โหมด Privileged (#)'
                },
                {
                    device: 'Payroll-SRV',
                    cmd: 'configure terminal',
                    match: /^conf(igure)?(\s+t(erminal)?)?$/i,
                    explain: 'เข้าสู่โหมด Global Configuration (config)#'
                },
                {
                    device: 'Payroll-SRV',
                    cmd: 'interface Eth0',
                    match: /^int(erface)?\s+eth0/i,
                    explain: 'เลือกพอร์ต Eth0 ของ Payroll-SRV ที่ตอนนี้ตั้ง IP ผิดวงอยู่ (192.168.50.100)'
                },
                {
                    device: 'Payroll-SRV',
                    cmd: 'ip address 192.168.20.100 255.255.255.0',
                    match: /^ip\s+add(ress)?\s+192\.168\.20\.100\s+255\.255\.255\.0/i,
                    explain: 'แก้ IP Address ให้อยู่ใน Subnet 192.168.20.0/24 ตรงกับขา Gig0/1 ของ Router'
                }
            ]
        },
        {
            id: 'ch05-ipv6',
            number: 'บทที่ 05',
            topicEn: 'IPv6 Addressing',
            title: 'IPv6 Structure, SLAAC & DHCPv6',
            badge: '128-bit IPv6',
            color: 'sky',
            presetLab: 'subnets',
            theorySummary: `
                <b>โครงสร้าง IPv6 (128 บิต - เลขฐานสิบหก 8 กลุ่ม):</b><br>
                • <b>กฎการย่อ IPv6:</b> (1) ตัดเลข 0 นำหน้าในแต่ละกลุ่มออกได้ เช่น <code>0db8</code> ➔ <code>db8</code> และ (2) ยุบกลุ่มที่เป็น 0 ติดกันเป็น <code>::</code> ได้ <b>เพียงครั้งเดียว</b> ใน 1 ที่อยู่<br>
                • <b>ประเภทของ IPv6:</b> <b>Global Unicast</b> (<code>2000::/3</code> เช่น <code>2001:db8::/64</code>), <b>Link-Local</b> (<code>FE80::/10</code> ใช้คุยในลิงก์เดียวกัน), <b>Loopback</b> (<code>::1/128</code>)<br>
                • <b>SLAAC:</b> เครื่องลูกข่ายสร้าง IPv6 64-bit อัตโนมัติจาก Router Advertisement (RA) โดยไม่ต้องพึ่ง DHCP Server!
            `,
            examTips: [
                'เครื่องหมาย :: ใช้ยุบศูนย์ต่อเนื่องได้แค่ 1 จุดเท่านั้น เพื่อไม่ให้ขนาดบิตกำกวม',
                'ต้องพิมพ์คำสั่ง "ipv6 unicast-routing" บน Router ก่อนเสมอ จึงจะทำหน้าที่ส่งต่อแพ็กเก็ต IPv6 และแจก SLAAC ได้',
                'คำสั่ง "ipv6 address autoconfig" บนลูกข่าย ใช้รับ IPv6 อัตโนมัติผ่านกลไก SLAAC'
            ],
            cheatSheet: [
                { cmd: 'ipv6 unicast-routing', desc: 'เปิดใช้งานการทำ Routing สำหรับ IPv6 บน Router' },
                { cmd: 'ipv6 address 2001:db8:10::1/64', desc: 'กำหนดที่อยู่ IPv6 Global Unicast ให้พอร์ต' },
                { cmd: 'ipv6 address autoconfig', desc: 'รับที่อยู่ IPv6 อัตโนมัติด้วย SLAAC' },
                { cmd: 'show ipv6 interface brief', desc: 'ตรวจสอบที่อยู่ IPv6 (Link-Local & Global Unicast) บนทุกพอร์ต' }
            ],
            steps: [
                {
                    device: 'R1-Core',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-Core'
                },
                {
                    device: 'R1-Core',
                    cmd: 'configure terminal',
                    match: /^conf(igure)?(\s+t(erminal)?)?$/i,
                    explain: 'เข้าสู่โหมด Global Configuration (config)#'
                },
                {
                    device: 'R1-Core',
                    cmd: 'ipv6 unicast-routing',
                    match: /^ipv6\s+unicast/i,
                    explain: 'เปิดใช้งาน IPv6 Unicast Routing บน R1-Core'
                },
                {
                    device: 'R1-Core',
                    cmd: 'interface Gig0/0',
                    match: /^int(erface)?\s+g(ig)?0\/0$/i,
                    explain: 'เข้าไปที่พอร์ต Gig0/0 ของ R1-Core'
                },
                {
                    device: 'R1-Core',
                    cmd: 'ipv6 address 2001:db8:10::1/64',
                    match: /^ipv6\s+add(ress)?\s+2001:db8:10::1\/64/i,
                    explain: 'กำหนดที่อยู่ IPv6 Global Unicast 2001:db8:10::1/64 ให้ขา Gig0/0'
                },
                {
                    device: 'R1-Core',
                    cmd: 'do show ipv6 interface brief',
                    match: /^(do\s+)?sh(ow)?\s+ipv6\s+int/i,
                    explain: 'ตรวจสอบสถานะ IPv6 ทั้ง Link-Local (FE80::1) และ Global Unicast บน R1-Core'
                }
            ]
        },
        {
            id: 'ch06-switch-concepts',
            number: 'บทที่ 06',
            topicEn: 'Switches Concepts',
            title: 'MAC Table, CAM Table & Switching',
            badge: 'OSI Layer 2',
            color: 'indigo',
            presetLab: 'lan',
            theorySummary: `
                <b>กระบวนการทำงานของ Layer 2 Switch (Switching Process):</b><br>
                1. <b>Learning (เรียนรู้):</b> เมื่อเฟรมวิ่งเข้าพอร์ต สวิตช์จะอ่าน <b>Source MAC Address</b> แล้วจดบันทึกลงตาราง <b>CAM / MAC Address Table</b> ว่าอยู่พอร์ตใด<br>
                2. <b>Flooding (กระจาย):</b> หากอ่าน <b>Destination MAC</b> แล้วไม่พบในตาราง (Unknown Unicast) หรือเป็น Broadcast (<code>FFFF.FFFF.FFFF</code>) สวิตช์จะส่งออกทุกพอร์ตใน VLAN เดียวกัน ยกเว้นพอร์ตที่รับเข้ามา<br>
                3. <b>Forwarding (ส่งตรง):</b> หากพบ Destination MAC ในตารางแล้ว จะส่งออกไปเฉพาะพอร์ตปลายทางพอร์ตเดียวเท่านั้น
            `,
            examTips: [
                'Switch เรียนรู้ตำแหน่งอุปกรณ์จาก Source MAC Address เสมอ แต่ตัดสินใจส่งออกโดยดูจาก Destination MAC Address',
                'Switch แยก Collision Domain ในทุกๆ พอร์ต แต่ทุกพอร์ตใน VLAN เดียวกันยังอยู่ใน Broadcast Domain เดียวกัน',
                'Router เท่านั้นที่ทำหน้าที่กั้น Broadcast Domain (หรือต้องแบ่ง VLAN บน Switch)'
            ],
            cheatSheet: [
                { cmd: 'show mac address-table', desc: 'แสดงตาราง CAM / MAC Address Table ที่สวิตช์เรียนรู้แบบ DYNAMIC' },
                { cmd: 'show ip interface brief', desc: 'ตรวจสอบสถานะพอร์ตทั้งหมดบนสวิตช์ว่า Up หรือ Down' }
            ],
            steps: [
                {
                    device: 'SW1-Access',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บนสวิตช์ SW1-Access'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'show mac address-table',
                    match: /^sh(ow)?\s+mac/i,
                    explain: 'ดูตาราง MAC Address Table (CAM Table) ว่าสวิตช์เรียนรู้ MAC ของ PC1, PC2 และ File-SRV บนพอร์ตใดบ้าง'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'show ip interface brief',
                    match: /^sh(ow)?\s+ip\s+int/i,
                    explain: 'ตรวจสอบสถานะ Physical และ Line Protocol ของพอร์ต Fa0/1 - Fa0/4 บนสวิตช์'
                }
            ]
        },
        {
            id: 'ch07-basic-switch-config',
            number: 'บทที่ 07',
            topicEn: 'Basic Switch & Device Config',
            title: 'CLI Security, SSH & Management VLAN',
            badge: 'IOS Security',
            color: 'teal',
            presetLab: 'lan',
            theorySummary: `
                <b>การตั้งค่าพื้นฐานและความปลอดภัยของสวิตช์ (Basic Switch Configuration):</b><br>
                • <b>Hostname & Passwords:</b> ตั้งชื่อด้วย <code>hostname</code>, ตั้งรหัสผ่านเข้าโหมด Privileged แบบเข้ารหัส MD5 ด้วย <code>enable secret</code> และเข้ารหัสรหัสผ่านทั้งหมดในไฟล์ Config ด้วย <code>service password-encryption</code><br>
                • <b>SSH & VTY Lines:</b> ตั้งรหัสผ่านรีโมตเข้าอุปกรณ์ที่ <code>line vty 0 4</code> และบังคับใช้ SSH แทน Telnet ด้วย <code>transport input ssh</code><br>
                • <b>Management VLAN (SVI):</b> สวิตช์ Layer 2 ไม่มีพอร์ตใส่ IP โดยตรง จึงต้องใส่ IP บนพอร์ตเสมือน <code>interface vlan 1</code> เพื่อให้รีโมตมาจัดการสวิตช์ได้
            `,
            examTips: [
                'enable secret จะปลอดภัยกว่า enable password เพราะเข้ารหัสแบบ Hash (Type 5/8/9) เสมอ',
                'หากต้องการให้ Switch รีโมตข้ามวงแลนได้ ต้องตั้งทั้ง interface vlan 1 (ip address + no shut) และ ip default-gateway!',
                'Telnet (Port 23) ส่งข้อมูลเป็น Plaintext ไม่ปลอดภัย จึงควรใช้ SSH (Port 22) ด้วยคำสั่ง transport input ssh'
            ],
            cheatSheet: [
                { cmd: 'hostname SW1-Core', desc: 'เปลี่ยนชื่ออุปกรณ์สวิตช์' },
                { cmd: 'enable secret class', desc: 'ตั้งรหัสผ่านเข้าโหมด Privileged (#) แบบเข้ารหัส' },
                { cmd: 'service password-encryption', desc: 'เข้ารหัสรหัสผ่านทั้งหมดใน show running-config' },
                { cmd: 'line vty 0 4', desc: 'เข้าสู่โหมดตั้งค่าช่องทางรีโมต Virtual Terminal (SSH/Telnet)' },
                { cmd: 'transport input ssh', desc: 'อนุญาตให้รีโมตเข้าอุปกรณ์ผ่านโปรโตคอล SSH เท่านั้น' },
                { cmd: 'interface vlan 1', desc: 'เข้าสู่พอร์ตเสมือน Management VLAN 1 ของสวิตช์เพื่อกำหนด IP' }
            ],
            steps: [
                {
                    device: 'SW1-Access',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บน SW1-Access'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'configure terminal',
                    match: /^conf(igure)?(\s+t(erminal)?)?$/i,
                    explain: 'เข้าสู่โหมด Global Configuration (config)#'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'enable secret class',
                    match: /^enable\s+(secret|password)\s+\S+/i,
                    explain: 'ตั้งรหัสผ่านสำหรับเข้าโหมด Privileged EXEC แบบเข้ารหัส (enable secret)'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'service password-encryption',
                    match: /^service\s+pass/i,
                    explain: 'เปิดบริการเข้ารหัสรหัสผ่านทั้งหมดในไฟล์ Configuration ไม่ให้เห็นเป็นข้อความธรรมดา'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'line vty 0 4',
                    match: /^line\s+vty/i,
                    explain: 'เข้าสู่โหมดตั้งค่าสายรีโมตเสมือน VTY 0 ถึง 4 (config-line)#'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'transport input ssh',
                    match: /^transport\s+input\s+ssh/i,
                    explain: 'กำหนดให้รับการเชื่อมต่อรีโมตผ่าน SSH เท่านั้นเพื่อความปลอดภัย'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'interface vlan 1',
                    match: /^int(erface)?\s+vlan\s*1$/i,
                    explain: 'เข้าสู่พอร์ตเสมือน Management VLAN 1 (SVI)'
                },
                {
                    device: 'SW1-Access',
                    cmd: 'ip address 192.168.1.2 255.255.255.0',
                    match: /^ip\s+add(ress)?\s+192\.168\.1\.\d+\s+255\.255\.255\.0/i,
                    explain: 'กำหนด Management IP ให้สวิตช์เพื่อให้แอดมินรีโมตเข้ามาตั้งค่าได้'
                }
            ]
        },
        {
            id: 'ch08-vlans',
            number: 'บทที่ 08',
            topicEn: 'VLANs & Trunking',
            title: 'VLAN Concept, Trunk & Native VLAN',
            badge: '802.1Q VLAN',
            color: 'purple',
            presetLab: 'roas-vlan',
            theorySummary: `
                <b>Virtual LAN (VLAN) & 802.1Q Trunking:</b><br>
                • <b>VLAN:</b> การแบ่งกลุ่มพอร์ตบน Switch แบบ Logical เพื่อแยก <b>Broadcast Domain</b> ออกจากกัน เช่น แผนก Sales (VLAN 10) และ Engineering (VLAN 20) แม้เสียบสวิตช์ตัวเดียวกันก็จะไม่เห็น Broadcast ของกันและกัน<br>
                • <b>Access Port:</b> พอร์ตที่ต่อกับเครื่องปลายทาง (PC/Server) รับส่งเฟรมแบบไม่มีป้าย Tag (Untagged) ของ VLAN เดียว<br>
                • <b>Trunk Port (IEEE 802.1Q):</b> ท่อรวมสัญญาณระหว่าง Switch กับ Switch หรือ Switch กับ Router โดยแปะป้าย <b>4-Byte VLAN Tag</b> ไปกับเฟรม ยกเว้นเฟรมของ <b>Native VLAN</b> ที่จะไม่ถูกติดป้าย Tag
            `,
            examTips: [
                'มาตรฐานการติดป้าย VLAN Tag บนสาย Trunk คือ IEEE 802.1Q (ขนาด Tag 4 Bytes แทรกใน Ethernet Header)',
                'Native VLAN (ค่าเริ่มต้นคือ VLAN 1) คือ VLAN ที่วิ่งผ่านสาย Trunk โดยไม่มีการติดป้าย 802.1Q Tag — เพื่อความปลอดภัยมักเปลี่ยนเป็น VLAN อื่น เช่น VLAN 99',
                'ใช้คำสั่ง show vlan brief เพื่อดูพอร์ต Access และใช้ show interfaces trunk เพื่อดูพอร์ต Trunk'
            ],
            cheatSheet: [
                { cmd: 'vlan 10', desc: 'สร้าง VLAN 10 ในฐานข้อมูล VLAN ของสวิตช์' },
                { cmd: 'name Sales', desc: 'ตั้งชื่อให้ VLAN (ในโหมด config-vlan)' },
                { cmd: 'switchport mode access', desc: 'ตั้งค่าพอร์ตเป็นโหมด Access สำหรับต่อเครื่องคอมพิวเตอร์' },
                { cmd: 'switchport access vlan 10', desc: 'กำหนดให้พอร์ต Access นั้นอยู่ในสมาชิก VLAN 10' },
                { cmd: 'switchport mode trunk', desc: 'ตั้งค่าพอร์ตเป็น 802.1Q Trunk เพื่อส่งผ่านหลาย VLAN' },
                { cmd: 'switchport trunk native vlan 99', desc: 'เปลี่ยน Native VLAN บนพอร์ต Trunk เป็น VLAN 99' }
            ],
            steps: [
                {
                    device: 'SW1-Trunk',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บนสวิตช์ SW1-Trunk'
                },
                {
                    device: 'SW1-Trunk',
                    cmd: 'configure terminal',
                    match: /^conf(igure)?(\s+t(erminal)?)?$/i,
                    explain: 'เข้าสู่โหมด Global Configuration (config)#'
                },
                {
                    device: 'SW1-Trunk',
                    cmd: 'vlan 10',
                    match: /^vlan\s+10$/i,
                    explain: 'เข้าสู่โหมดสร้างและตั้งค่า VLAN 10 (config-vlan)#'
                },
                {
                    device: 'SW1-Trunk',
                    cmd: 'name Sales',
                    match: /^name\s+\S+/i,
                    explain: 'ตั้งชื่อ VLAN 10 ว่า "Sales"'
                },
                {
                    device: 'SW1-Trunk',
                    cmd: 'interface Fa0/1',
                    match: /^int(erface)?\s+fa0\/1$/i,
                    explain: 'เข้าสู่พอร์ต Fa0/1 ซึ่งเป็นสายหลักที่เชื่อมต่อไปยังเราเตอร์ R1-ROAS'
                },
                {
                    device: 'SW1-Trunk',
                    cmd: 'switchport trunk native vlan 99',
                    match: /^sw(itchport)?\s+trunk\s+native\s+vlan\s+99/i,
                    explain: 'กำหนดให้ Native VLAN บนพอร์ต Trunk Fa0/1 เป็น VLAN 99 ตามมาตรฐานความปลอดภัย'
                },
                {
                    device: 'SW1-Trunk',
                    cmd: 'do show interfaces trunk',
                    match: /^(do\s+)?sh(ow)?\s+int(erfaces)?\s+trunk/i,
                    explain: 'ตรวจสอบตาราง Trunk จะเห็นพอร์ต Fa0/1 ทำงานแบบ 802.1q และมี Native VLAN เป็น 99'
                }
            ]
        },
        {
            id: 'ch09-router-basic',
            number: 'บทที่ 09',
            topicEn: 'Basic Router Configuration',
            title: 'Router Interface, Static IP & no shut',
            badge: 'Router CLI',
            color: 'cyan',
            presetLab: 'troubleshoot',
            theorySummary: `
                <b>การตั้งค่าพอร์ตของ Router (Basic Router Configuration):</b><br>
                • โดยค่าเริ่มต้น พอร์ตของ Cisco Router ทุกพอร์ตจะถูกปิดไว้ (<b>Administratively Down</b>) ต่างจาก Switch ที่เปิดพอร์ตให้อัตโนมัติ<br>
                • การเปิดใช้งานพอร์ต Router ต้องทำ 3 ขั้นตอนเสมอ:<br>
                  1. เลือกพอร์ต: <code>interface Gig0/1</code><br>
                  2. กำหนด IP และ Mask: <code>ip address 192.168.20.1 255.255.255.0</code><br>
                  3. สั่งเปิดพอร์ต: <code>no shutdown</code>
            `,
            examTips: [
                'หาก show ip interface brief แล้วขึ้นว่า "administratively down" แปลว่าลืมพิมพ์คำสั่ง no shutdown!',
                'ขาของ Router ที่ต่อเข้ากับวงแลนใด จะทำหน้าที่เป็น Default Gateway ของเครื่อง PC ในวงแลนนั้นเสมอ'
            ],
            cheatSheet: [
                { cmd: 'show ip interface brief', desc: 'ดูสรุป IP Address และสถานะ Up/Down ของพอร์ตทั้งหมด' },
                { cmd: 'interface Gig0/1', desc: 'เข้าไปตั้งค่าพอร์ต GigabitEthernet 0/1' },
                { cmd: 'ip address 192.168.20.1 255.255.255.0', desc: 'กำหนด IP Address และ Subnet Mask ให้พอร์ต' },
                { cmd: 'no shutdown', desc: 'เปิดการทำงานของพอร์ตให้ไฟสถานะเปลี่ยนเป็นสีเขียว (Up)' }
            ],
            steps: [
                {
                    device: 'R1-Gateway',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-Gateway'
                },
                {
                    device: 'R1-Gateway',
                    cmd: 'show ip interface brief',
                    match: /^sh(ow)?\s+ip\s+int/i,
                    explain: 'ตรวจสอบสถานะพอร์ต จะเห็นว่าขา Gig0/1 ขึ้นสถานะ administratively down (ไฟสีแดงบนกระดาน)'
                },
                {
                    device: 'R1-Gateway',
                    cmd: 'configure terminal',
                    match: /^conf(igure)?(\s+t(erminal)?)?$/i,
                    explain: 'เข้าสู่โหมด Global Configuration (config)#'
                },
                {
                    device: 'R1-Gateway',
                    cmd: 'interface Gig0/1',
                    match: /^int(erface)?\s+g(ig)?0\/1$/i,
                    explain: 'เลือกพอร์ต GigabitEthernet 0/1 ที่เชื่อมต่อไปยังฝั่ง Server'
                },
                {
                    device: 'R1-Gateway',
                    cmd: 'no shutdown',
                    match: /^no\s+sh(utdown)?$/i,
                    explain: 'สั่งเปิดพอร์ต Gig0/1! สังเกตไฟพอร์ตบนกระดานจะเปลี่ยนจากสีแดงเป็นสีเขียวทันที'
                }
            ]
        },
        {
            id: 'ch10-routing-concepts',
            number: 'บทที่ 10',
            topicEn: 'Routing Concepts',
            title: 'Static Route, Default Route & OSPF',
            badge: 'L3 Routing',
            color: 'emerald',
            presetLab: 'ospf-core',
            theorySummary: `
                <b>หลักการหาเส้นทางของ Router (Routing Concepts):</b><br>
                • เราเตอร์จะรู้จักเฉพาะวงแลนที่เสียบสายติดกับตัวมันโดยตรง (<b>Connected Route - C</b>) เท่านั้น หากต้องการส่งไปวงแลนอื่นที่อยู่ถัดไป ต้องสอนเส้นทางด้วยวิธีใดวิธีหนึ่ง:<br>
                1. <b>Static Route (AD = 1):</b> แอดมินพิมพ์บอกเส้นทางเองด้วย <code>ip route [วงปลายทาง] [Mask] [Next-Hop IP]</code><br>
                2. <b>Default Route (Gateway of Last Resort):</b> <code>ip route 0.0.0.0 0.0.0.0 [Next-Hop]</code> ใช้ส่งออกอินเทอร์เน็ตเมื่อไม่ตรงกับวงใดเลย<br>
                3. <b>Dynamic Routing - OSPF (AD = 110):</b> เราเตอร์แลกเปลี่ยนเส้นทางกันเองอัตโนมัติและคำนวณเส้นทางที่สั้นที่สุดด้วยอัลกอริทึม Dijkstra SPF
            `,
            examTips: [
                'ค่า Administrative Distance (AD) ยิ่งน้อยยิ่งน่าเชื่อถือ: Connected = 0, Static = 1, EIGRP = 90, OSPF = 110, RIP = 120',
                'เมื่อมีหลายเส้นทางไปได้ เราเตอร์จะเลือกเส้นทางที่มี Prefix ยาวที่สุดก่อนเสมอ (Longest Prefix Match เช่น /26 ชนะ /24) ก่อนจะเปรียบเทียบค่า AD!',
                'ต้องตั้งทั้งขาไป (R1 ➔ R2) และขากลับ (R2 ➔ R1) เสมอ แพ็กเก็ตจึงจะ Ping ไป-กลับสำเร็จ'
            ],
            cheatSheet: [
                { cmd: 'ip route 192.168.20.0 255.255.255.0 10.0.0.2', desc: 'เพิ่ม Static Route ไปยังวง .20.0/24 ผ่านขา Next-Hop 10.0.0.2' },
                { cmd: 'ip route 0.0.0.0 0.0.0.0 203.0.113.1', desc: 'ตั้งค่า Default Route (Quad-Zero) ออกสู่อินเทอร์เน็ต' },
                { cmd: 'router ospf 1', desc: 'เปิดโปรโตคอล OSPF Process ID 1' },
                { cmd: 'network 192.168.10.0 0.0.0.255 area 0', desc: 'ประกาศวงแลนเข้าสู่ OSPF Area 0 โดยใช้ Wildcard Mask' },
                { cmd: 'show ip ospf neighbor', desc: 'ตรวจสอบความสัมพันธ์เพื่อนบ้าน OSPF (สถานะ FULL/DR)' }
            ],
            steps: [
                {
                    device: 'R1-Edge',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-Edge'
                },
                {
                    device: 'R1-Edge',
                    cmd: 'show ip ospf neighbor',
                    match: /^sh(ow)?\s+ip\s+ospf\s+nei/i,
                    explain: 'ตรวจสอบตาราง OSPF Neighbor ว่าจับคู่เพื่อนบ้านกับ R2-Core สำเร็จ (สถานะ FULL/DR) หรือไม่'
                },
                {
                    device: 'R1-Edge',
                    cmd: 'show ip route',
                    match: /^sh(ow)?\s+ip\s+ro/i,
                    explain: 'ดูตาราง Routing จะเห็นตัวอักษร "O" (OSPF [110/2]) ที่เรียนรู้วง 172.16.1.0/24 จาก R2-Core อัตโนมัติ!'
                }
            ]
        },
        {
            id: 'ch11-intervlan',
            number: 'บทที่ 11 (5-Nov)',
            topicEn: 'Inter-VLAN Routing',
            title: 'Router-on-a-Stick & Layer 3 Switch',
            badge: '5-Nov Topic',
            color: 'purple',
            presetLab: 'roas-vlan',
            theorySummary: `
                <b>การเชื่อมต่อข้าม VLAN (Inter-VLAN Routing) มี 2 สถาปัตยกรรมหลัก:</b><br>
                1. <b>Router-on-a-Stick (ROAS):</b> ใช้สายแลน Trunk เส้นเดียวเชื่อมระหว่าง Switch กับ Router แล้วซอยพอร์ต Router ออกเป็นพอร์ตย่อย (<b>Sub-interfaces</b> เช่น <code>Gig0/0.10</code> และ <code>Gig0/0.20</code>) พร้อมติดคำสั่ง <code>encapsulation dot1Q [vlan-id]</code><br>
                2. <b>Layer 3 Switch (Multilayer Switch SVI):</b> ประสิทธิภาพสูงกว่าในระดับองค์กร โดยเปิด <code>ip routing</code> บน Switch แล้วสร้างพอร์ตเสมือน <code>interface vlan 10</code> และ <code>interface vlan 20</code> เพื่อเป็น Gateway ในตัวสวิตช์เองเลย!
            `,
            examTips: [
                'ใน Router-on-a-Stick ต้องสั่ง encapsulation dot1Q <vlan> ก่อนจึงจะใส่ ip address บน Sub-interface ได้ และอย่าลืมสั่ง no shutdown ที่พอร์ตแม่ (Gig0/0) ด้วย!',
                'ใน Layer 3 Switch ต้องพิมพ์คำสั่ง "ip routing" ในโหมด Global Config เพื่อเปิดความสามารถในการส่งแพ็กเก็ตข้าม SVI VLAN',
                'ทั้ง 2 วิธีสามารถฝึกพิมพ์คำสั่งจริงได้ในแอปนี้ทันที!'
            ],
            cheatSheet: [
                { cmd: 'interface Gig0/0.10', desc: '[ROAS] สร้างพอร์ตย่อย Sub-interface สำหรับ VLAN 10 บน Router' },
                { cmd: 'encapsulation dot1Q 10', desc: '[ROAS] ระบุให้พอร์ตย่อยนี้รับส่งเฟรมที่ติดป้าย 802.1Q VLAN 10' },
                { cmd: 'ip routing', desc: '[L3 Switch] เปิดโหมด Layer 3 Inter-VLAN Routing บนสวิตช์' },
                { cmd: 'interface vlan 10', desc: '[L3 Switch] สร้างพอร์ตเสมือน SVI สำหรับเป็น Gateway ของ VLAN 10' }
            ],
            steps: [
                {
                    device: 'R1-ROAS',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-ROAS'
                },
                {
                    device: 'R1-ROAS',
                    cmd: 'show ip interface brief',
                    match: /^sh(ow)?\s+ip\s+int/i,
                    explain: 'สังเกตพอร์ตย่อย Gig0/0.10 (192.168.10.1) และ Gig0/0.20 (192.168.20.1) ที่ทำงานอยู่บนสายกายภาพเส้นเดียว'
                },
                {
                    device: 'R1-ROAS',
                    cmd: 'configure terminal',
                    match: /^conf(igure)?(\s+t(erminal)?)?$/i,
                    explain: 'เข้าสู่โหมด Global Configuration เพื่อทดลองสร้าง Sub-interface ใหม่สำหรับ VLAN 30 (Management)'
                },
                {
                    device: 'R1-ROAS',
                    cmd: 'interface Gig0/0.30',
                    match: /^int(erface)?\s+g(ig)?0\/0\.30$/i,
                    explain: 'สร้างพอร์ตย่อย Sub-interface Gig0/0.30'
                },
                {
                    device: 'R1-ROAS',
                    cmd: 'encapsulation dot1Q 30',
                    match: /^encap(sulation)?\s+dot1q\s+30/i,
                    explain: 'ผูกป้ายแท็ก IEEE 802.1Q VLAN 30 เข้ากับพอร์ตย่อยนี้'
                },
                {
                    device: 'R1-ROAS',
                    cmd: 'ip address 192.168.30.1 255.255.255.0',
                    match: /^ip\s+add(ress)?\s+192\.168\.30\.1\s+255\.255\.255\.0/i,
                    explain: 'กำหนด Gateway IP 192.168.30.1/24 ให้กับ VLAN 30 เรียบร้อย!'
                }
            ]
        },
        {
            id: 'ch12-acl',
            number: 'บทที่ 12 (12-Nov)',
            topicEn: 'Access Control Lists',
            title: 'Standard ACL & Extended ACL Firewall',
            badge: '12-Nov Topic',
            color: 'rose',
            presetLab: 'acl-nat',
            theorySummary: `
                <b>Access Control Lists (ACL) - กฎไฟร์วอลล์คัดกรองแพ็กเก็ตบน Router:</b><br>
                • <b>Standard ACL (หมายเลข 1–99):</b> กรองจาก <b>Source IP</b> อย่างเดียวเท่านั้น (ควรวางไว้ <b>ใกล้ปลายทาง</b> ที่สุด เพื่อไม่ให้บล็อกการจราจรไปที่อื่นโดยไม่ตั้งใจ)<br>
                • <b>Extended ACL (หมายเลข 100–199):</b> กรองละเอียดทั้ง <b>Protocol (ICMP/TCP/UDP/IP), Source IP, Destination IP และเลข Port (เช่น eq 80)</b> (ควรวางไว้ <b>ใกล้ต้นทาง</b> ที่สุด เพื่อประหยัดแบนด์วิดท์)<br>
                • เราเตอร์ประมวลผลกฎจาก <b>บนลงล่าง (Top-Down)</b> เมื่อเจอกฎที่ตรงจะหยุดเช็คทันที และบรรทัดสุดท้ายมี <b>Implicit Deny Any</b> ซ่อนอยู่เสมอ!
            `,
            examTips: [
                'จำแม่นๆ สำหรับสอบ: Standard ACL (1-99) วางใกล้ Destination | Extended ACL (100-199) วางใกล้ Source',
                'ท้าย ACL ทุกชุดจะมีกฎที่มองไม่เห็นคือ "deny ip any any" (Implicit Deny) ดังนั้นต้องมีบรรทัด permit อย่างน้อย 1 บรรทัดเสมอ!',
                'ใช้คำสั่ง ip access-group <หมายเลข> in หรือ out ในโหมดพอร์ตเพื่อเปิดใช้งาน ACL'
            ],
            cheatSheet: [
                { cmd: 'access-list 1 deny 192.168.10.50 0.0.0.0', desc: '[Standard ACL] บล็อกทุกแพ็กเก็ตจากโฮสต์ 192.168.10.50' },
                { cmd: 'access-list 100 deny icmp any 8.8.8.8', desc: '[Extended ACL] บล็อกเฉพาะการ Ping (ICMP) ไปยัง 8.8.8.8' },
                { cmd: 'access-list 100 permit ip any any', desc: '[Extended ACL] อนุญาตทราฟฟิกอื่นๆ ที่เหลือทั้งหมด (เช่น HTTP Port 80)' },
                { cmd: 'ip access-group 100 in', desc: 'นำ ACL 100 ไปผูกกับพอร์ตขาเข้า (Inbound) ของ Router' },
                { cmd: 'show access-lists', desc: 'ตรวจสอบรายการกฎ ACL และจำนวนแพ็กเก็ตที่ตรงเงื่อนไข (matches)' }
            ],
            steps: [
                {
                    device: 'R1-Firewall',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ไฟร์วอลล์ R1-Firewall'
                },
                {
                    device: 'R1-Firewall',
                    cmd: 'show access-lists',
                    match: /^sh(ow)?\s+acc/i,
                    explain: 'ตรวจสอบกฎ Extended ACL 100 ที่ตั้งไว้ (บรรทัด 10 บล็อก ICMP ไป 203.0.113.8 และบรรทัด 20 อนุญาต TCP HTTP)'
                },
                {
                    device: 'Corp-PC',
                    cmd: 'ping 203.0.113.8',
                    match: /^ping\s+203\.0\.113\.8/i,
                    explain: 'ทดสอบ Ping จาก Corp-PC ไปที่ 203.0.113.8 จะเห็นผลลัพธ์ U.U.U (ถูกบล็อกโดย ACL 100!)'
                },
                {
                    device: 'Corp-PC',
                    cmd: 'http 203.0.113.8',
                    match: /^(http|curl)\s+203\.0\.113\.8/i,
                    explain: 'ทดสอบเข้าเว็บ HTTP (TCP Port 80) ไปที่ 203.0.113.8 จะผ่านกฎข้อที่ 20 ได้รับหน้าเว็บ 200 OK!'
                }
            ]
        },
        {
            id: 'ch13-nat',
            number: 'บทที่ 13 (19-Nov)',
            topicEn: 'Network Address Translation',
            title: 'Static NAT, Dynamic NAT & PAT Overload',
            badge: '19-Nov Topic',
            color: 'amber',
            presetLab: 'acl-nat',
            theorySummary: `
                <b>Network Address Translation (NAT) - การแปลง Private IP เป็น Public IP:</b><br>
                • <b>4 คำศัพท์สำคัญที่ออกสอบเสมอ:</b><br>
                  - <b>Inside Local:</b> Private IP ของเครื่องในองค์กรก่อนแปลง (เช่น <code>192.168.10.25</code>)<br>
                  - <b>Inside Global:</b> Public IP ขององค์กรหลังแปลงแล้ว เพื่อใช้ออกอินเทอร์เน็ต (เช่น <code>203.0.113.1</code>)<br>
                  - <b>Outside Local / Outside Global:</b> Public IP ของเซิร์ฟเวอร์ปลายทางบนอินเทอร์เน็ต (เช่น <code>203.0.113.8</code>)<br>
                • <b>Static NAT (1:1):</b> จับคู่ Private IP กับ Public IP ตายตัว เหมาะสำหรับเปิด Web Server ในองค์กรให้คนนอกเข้าถึง<br>
                • <b>PAT (NAT Overload - Many:1):</b> เครื่องในองค์กรหลายร้อยเครื่องแชร์ Public IP เดียวกันโดยแยกแยะด้วย <b>หมายเลข Port</b>
            `,
            examTips: [
                'จำคำศัพท์: Inside = ฝั่งองค์กรของเรา, Outside = ฝั่งอินเทอร์เน็ต | Local = มองเห็นจากข้างใน (Private IP), Global = มองเห็นจากโลกภายนอก (Public IP)',
                'ต้องกำหนดขา Router ฝั่ง LAN เป็น "ip nat inside" และขาฝั่ง WAN/ISP เป็น "ip nat outside" เสมอ',
                'คำสั่งที่ทำให้แชร์ 1 Public IP ได้หลายเครื่องคือคีย์เวิร์ดคำว่า "overload" ท้ายคำสั่ง!'
            ],
            cheatSheet: [
                { cmd: 'ip nat inside', desc: 'กำหนดให้พอร์ตฝั่ง LAN (เช่น Gig0/0) เป็นฝั่งภายในองค์กร' },
                { cmd: 'ip nat outside', desc: 'กำหนดให้พอร์ตฝั่ง WAN/ISP (เช่น Gig0/1) เป็นฝั่งออกอินเทอร์เน็ต' },
                { cmd: 'ip nat inside source static 192.168.10.25 203.0.113.50', desc: '[Static NAT] แปลง IP แบบ 1 ต่อ 1 สำหรับเซิร์ฟเวอร์' },
                { cmd: 'ip nat inside source list 1 interface Gig0/1 overload', desc: '[PAT Overload] แปลง Private IP ทั้งวงให้ออกผ่าน Public IP ขา Gig0/1' },
                { cmd: 'show ip nat translations', desc: 'ดูตารางการแปลง IP (Inside Global ⟷ Inside Local)' }
            ],
            steps: [
                {
                    device: 'R1-Firewall',
                    cmd: 'enable',
                    match: /^en(able)?$/i,
                    explain: 'เข้าสู่โหมด Privileged EXEC (#) บนเราเตอร์ R1-Firewall'
                },
                {
                    device: 'R1-Firewall',
                    cmd: 'configure terminal',
                    match: /^conf(igure)?(\s+t(erminal)?)?$/i,
                    explain: 'เข้าสู่โหมด Global Configuration (config)#'
                },
                {
                    device: 'R1-Firewall',
                    cmd: 'ip nat inside source static 192.168.10.25 203.0.113.10',
                    match: /^ip\s+nat\s+inside\s+source\s+static/i,
                    explain: 'ทดลองตั้งค่า Static NAT จับคู่ Inside Local (192.168.10.25) เข้ากับ Inside Global (203.0.113.10)'
                },
                {
                    device: 'R1-Firewall',
                    cmd: 'do show ip nat translations',
                    match: /^(do\s+)?sh(ow)?\s+ip\s+nat/i,
                    explain: 'ตรวจสอบตาราง NAT Translations จะเห็นการจับคู่ Inside Global กับ Inside Local ทันที!'
                }
            ]
        }
    ],

    init() {
        this.renderRightSidebarCoach();
        this.renderAcademyModalLessons();
        this.updateSubnetCalculatorUI();
        this.renderCheatSheetTab();
    },

    getActiveLesson() {
        return this.lessons.find(l => l.id === this.activeLessonId) || this.lessons[0];
    },

    isStepCompleted(lessonId, idx) {
        return !!(this.completedStepIndices[lessonId] && this.completedStepIndices[lessonId][idx]);
    },

    markStepCompleted(lessonId, idx) {
        if (!this.completedStepIndices[lessonId]) {
            this.completedStepIndices[lessonId] = {};
        }
        this.completedStepIndices[lessonId][idx] = true;
        this.renderRightSidebarCoach();
        this.updateInTerminalCoachBanner();
        if (window.CanvasUI) window.CanvasUI.renderNodes();
    },

    getNextPendingStep(lesson = this.getActiveLesson()) {
        if (!lesson || !lesson.steps) return null;
        for (let i = 0; i < lesson.steps.length; i++) {
            if (!this.isStepCompleted(lesson.id, i)) {
                return { index: i, total: lesson.steps.length, ...lesson.steps[i] };
            }
        }
        return null;
    },

    switchRightSidebarTab(tab) {
        this.activeRightTab = tab;
        const btnCoach = document.getElementById('tabRightCoach');
        const btnLogs = document.getElementById('tabRightLogs');
        const panelCoach = document.getElementById('rightCoachContainer');
        const panelLogs = document.getElementById('rightLogsContainer');

        if (!btnCoach || !panelCoach) return;

        if (tab === 'coach') {
            btnCoach.className = 'flex-1 py-2 text-xs font-bold border-b-2 border-cyan-400 text-cyan-300 bg-cyan-500/10 transition';
            btnLogs.className = 'flex-1 py-2 text-xs font-semibold border-b-2 border-transparent text-slate-400 hover:text-white transition';
            panelCoach.classList.remove('hidden');
            panelLogs.classList.add('hidden');
        } else {
            btnLogs.className = 'flex-1 py-2 text-xs font-bold border-b-2 border-emerald-400 text-emerald-300 bg-emerald-500/10 transition';
            btnCoach.className = 'flex-1 py-2 text-xs font-semibold border-b-2 border-transparent text-slate-400 hover:text-white transition';
            panelLogs.classList.remove('hidden');
            panelCoach.classList.add('hidden');
        }
    },

    selectLesson(lessonId, loadTopology = true) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        if (!lesson) return;
        this.activeLessonId = lesson.id;

        if (loadTopology && lesson.presetLab && window.appState) {
            window.appState.loadPresetTopology(lesson.presetLab);
        }

        const modal = document.getElementById('academyModal');
        if (modal) modal.classList.add('hidden');

        this.switchRightSidebarTab('coach');
        this.renderRightSidebarCoach();
        this.updateInTerminalCoachBanner();
        if (window.CanvasUI) window.CanvasUI.renderNodes();

        if (window.appState) {
            window.appState.logEvent('ACADEMY', `🎓 เริ่มบทเรียน: ${lesson.number} - ${lesson.title}`, 'info');
        }
    },

    resetLessonProgress(lessonId = this.activeLessonId) {
        this.completedStepIndices[lessonId] = {};
        this.renderRightSidebarCoach();
        this.updateInTerminalCoachBanner();
        if (window.CanvasUI) window.CanvasUI.renderNodes();
    },

    /**
     * Called automatically by CiscoCLI.execute() whenever the user runs any command
     */
    onCliCommandExecuted(device, rawCommand) {
        const lesson = this.getActiveLesson();
        if (!lesson || !lesson.steps) return;

        const nextStep = this.getNextPendingStep(lesson);
        if (!nextStep) return;

        const devMatches = !nextStep.device || device.name.toLowerCase() === nextStep.device.toLowerCase();
        const cmdMatches = nextStep.match
            ? nextStep.match.test(rawCommand.trim())
            : rawCommand.trim().toLowerCase() === nextStep.cmd.toLowerCase();

        if (devMatches && cmdMatches) {
            this.markStepCompleted(lesson.id, nextStep.index);
            if (window.appState) {
                window.appState.logEvent('COACH', `✅ ผ่านภารกิจขั้นที่ ${nextStep.index + 1}/${nextStep.total}: [${device.name}] ${rawCommand}`, 'ok');
            }
        }
    },

    /**
     * Opens the CLI modal directly for the target device of a step
     */
    openDeviceCliForStep(deviceName) {
        if (!window.appState || !window.ModalController) return;
        const dev = window.appState.devices.find(d => d.name.toLowerCase() === (deviceName || '').toLowerCase()) || window.appState.devices[0];
        if (!dev) return;
        window.appState.selectDevice(dev.id);
        window.ModalController.openConfigModal(dev.id, 'cli');
        this.updateInTerminalCoachBanner();
    },

    /**
     * Automatically prepares the correct CLI mode and runs the target command on the target device
     */
    autoRunStepCommand(stepIdx) {
        const lesson = this.getActiveLesson();
        if (!lesson || !lesson.steps[stepIdx] || !window.appState) return;
        const step = lesson.steps[stepIdx];
        const dev = window.appState.devices.find(d => d.name.toLowerCase() === (step.device || '').toLowerCase()) || window.appState.devices[0];
        if (!dev) return;

        window.appState.selectDevice(dev.id);
        window.ModalController.openConfigModal(dev.id, 'cli');

        const inputEl = document.getElementById('cliInput');
        if (inputEl) {
            inputEl.value = step.cmd;
            window.ModalController.submitCliCommand();
        }
        this.markStepCompleted(lesson.id, stepIdx);
    },

    /**
     * Updates the Live Coach Banner inside the CLI Modal so students see the next command right above the terminal
     */
    updateInTerminalCoachBanner() {
        const banner = document.getElementById('cliTutorBanner');
        if (!banner || !window.ModalController) return;

        const lesson = this.getActiveLesson();
        const nextStep = this.getNextPendingStep(lesson);
        const currentDev = window.appState?.getDevice(window.ModalController.activeDeviceId);

        if (!lesson || !nextStep) {
            banner.innerHTML = `
                <div class="flex items-center justify-between w-full">
                    <span class="text-xs font-bold text-emerald-300">🎉 ยินดีด้วย! คุณฝึกพิมพ์คำสั่งครบทุกขั้นตอนของ ${lesson?.number || 'บทเรียนนี้'} แล้ว</span>
                    <button onclick="AcademyTutor.openAcademyModal()" class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">เลือกบทถัดไป ➔</button>
                </div>
            `;
            return;
        }

        const isCorrectDevice = currentDev && currentDev.name.toLowerCase() === nextStep.device.toLowerCase();

        if (!isCorrectDevice) {
            banner.innerHTML = `
                <div class="flex flex-wrap items-center justify-between gap-2 w-full">
                    <div class="text-xs text-amber-300">
                        <span class="font-bold">🎯 ขั้นที่ ${nextStep.index + 1}/${nextStep.total}:</span>
                        ต้องพิมพ์บนอุปกรณ์ <b class="underline text-white">${nextStep.device}</b> (ตอนนี้คุณเปิดอยู่ที่ ${currentDev ? currentDev.name : '-'})
                    </div>
                    <button onclick="AcademyTutor.openDeviceCliForStep('${nextStep.device}')" class="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow">
                        สลับไปที่ CLI ของ ${nextStep.device} ➔
                    </button>
                </div>
            `;
            return;
        }

        banner.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-2 w-full">
                <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-bold">STEP ${nextStep.index + 1}/${nextStep.total}</span>
                        <span class="text-xs text-slate-200">พิมพ์คำสั่ง: <code class="px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-amber-500/40 font-mono font-bold">${nextStep.cmd}</code></span>
                    </div>
                    <div class="text-[11px] text-slate-400">💡 ${nextStep.explain}</div>
                </div>
                <button type="button" onclick="AcademyTutor.autoRunStepCommand(${nextStep.index})" class="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs shadow shrink-0">
                    ⚡ พิมพ์และรันให้ดู
                </button>
            </div>
        `;
    },

    renderRightSidebarCoach() {
        const container = document.getElementById('rightCoachContainer');
        if (!container) return;

        const lesson = this.getActiveLesson();
        const totalSteps = lesson.steps.length;
        const doneCount = lesson.steps.filter((_, i) => this.isStepCompleted(lesson.id, i)).length;
        const pct = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 100;

        const optionsHtml = this.lessons.map(l =>
            `<option value="${l.id}" ${l.id === lesson.id ? 'selected' : ''}>${l.number}: ${l.topicEn} (${l.title})</option>`
        ).join('');

        const stepsHtml = lesson.steps.map((s, idx) => {
            const isDone = this.isStepCompleted(lesson.id, idx);
            const nextPending = this.getNextPendingStep(lesson);
            const isCurrent = nextPending && nextPending.index === idx;

            return `
                <div class="p-2.5 rounded-2xl border transition ${isDone ? 'bg-emerald-950/25 border-emerald-500/40' : isCurrent ? 'bg-cyan-950/30 border-cyan-400 shadow-lg shadow-cyan-500/10' : 'bg-slate-900/60 border-slate-800 opacity-75'}">
                    <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-1.5">
                            <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isDone ? 'bg-emerald-500 text-slate-950' : isCurrent ? 'bg-cyan-400 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'}">
                                ${isDone ? '✓' : idx + 1}
                            </span>
                            <span class="text-[11px] font-mono font-bold ${isDone ? 'text-emerald-300' : 'text-cyan-300'}">${s.device}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <button onclick="AcademyTutor.openDeviceCliForStep('${s.device}')" class="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-mono" title="เปิดหน้าต่าง CLI ของ ${s.device}">
                                >_ เปิด CLI
                            </button>
                            ${!isDone ? `<button onclick="AcademyTutor.autoRunStepCommand(${idx})" class="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold" title="พิมพ์คำสั่งให้อัตโนมัติ">⚡ รัน</button>` : ''}
                        </div>
                    </div>
                    <div class="px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-amber-300 font-bold mb-1 select-all">
                        ${s.cmd}
                    </div>
                    <p class="text-[11px] text-slate-300 leading-snug">${s.explain}</p>
                </div>
            `;
        }).join('');

        const examTipsHtml = (lesson.examTips || []).map(tip =>
            `<li class="text-[11px] text-slate-300 flex items-start gap-1.5"><span class="text-amber-400 shrink-0">★</span><span>${tip}</span></li>`
        ).join('');

        container.innerHTML = `
            <div class="p-3 space-y-3 overflow-y-auto flex-1">
                <!-- Lesson Selector Dropdown -->
                <div class="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-700/80 space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">📚 เลือกบทเรียนตามตารางสอน</span>
                        <button onclick="AcademyTutor.openAcademyModal()" class="text-[11px] text-amber-300 hover:underline font-semibold">ดูครบ 13 บท ➔</button>
                    </div>
                    <select onchange="AcademyTutor.selectLesson(this.value, true)" class="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-cyan-400">
                        ${optionsHtml}
                    </select>
                </div>

                <!-- Theory Summary Card -->
                <details open class="group bg-slate-900/75 rounded-2xl border border-slate-800 overflow-hidden">
                    <summary class="px-3 py-2 cursor-pointer flex items-center justify-between bg-slate-900 text-xs font-bold text-cyan-300 select-none">
                        <span>📖 สรุปเนื้อหา & จุดเน้นออกสอบ (${lesson.topicEn})</span>
                        <span class="text-slate-400 group-open:rotate-180 transition">▼</span>
                    </summary>
                    <div class="p-3 space-y-2.5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80">
                        <div>${lesson.theorySummary}</div>
                        <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                            <div class="text-[11px] font-bold text-amber-300">🔥 จุดเน้นออกสอบ (Exam Highlights):</div>
                            <ul class="space-y-1">${examTipsHtml}</ul>
                        </div>
                    </div>
                </details>

                <!-- Step-by-Step CLI Practice Mission -->
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white">🎯 ฝึกพิมพ์คำสั่งจริง (${doneCount}/${totalSteps})</span>
                        <button onclick="AcademyTutor.resetLessonProgress()" class="text-[10px] text-slate-400 hover:text-white">เริ่มใหม่</button>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300" style="width: ${pct}%"></div>
                    </div>
                    <div class="space-y-2 pt-1">
                        ${stepsHtml}
                    </div>
                </div>
            </div>
        `;
    },

    openAcademyModal(tab = 'lessons') {
        const modal = document.getElementById('academyModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        this.switchAcademyModalTab(tab);
    },

    closeAcademyModal() {
        const modal = document.getElementById('academyModal');
        if (modal) modal.classList.add('hidden');
    },

    switchAcademyModalTab(tab) {
        const tabs = ['lessons', 'subnet', 'cheatsheet'];
        tabs.forEach(t => {
            const btn = document.getElementById(`acadTabBtn-${t}`);
            const pane = document.getElementById(`acadTabPane-${t}`);
            if (!btn || !pane) return;
            if (t === tab) {
                btn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 shadow transition';
                pane.classList.remove('hidden');
            } else {
                btn.className = 'px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/70 transition';
                pane.classList.add('hidden');
            }
        });
    },

    renderAcademyModalLessons() {
        const grid = document.getElementById('academyLessonsGrid');
        if (!grid) return;

        grid.innerHTML = this.lessons.map(l => {
            const total = l.steps.length;
            const done = l.steps.filter((_, i) => this.isStepCompleted(l.id, i)).length;
            const isActive = l.id === this.activeLessonId;

            return `
                <div class="p-4 rounded-2xl bg-slate-900/90 border ${isActive ? 'border-cyan-400 ring-1 ring-cyan-400/40' : 'border-slate-800 hover:border-slate-600'} flex flex-col justify-between gap-3 transition">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-[11px] font-mono font-bold text-cyan-400">${l.number} • ${l.topicEn}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">${l.badge}</span>
                        </div>
                        <h4 class="font-bold text-sm text-white">${l.title}</h4>
                        <div class="text-xs text-slate-300 leading-relaxed">${l.theorySummary}</div>
                    </div>
                    <div class="pt-3 border-t border-slate-800/90 flex items-center justify-between gap-2">
                        <span class="text-[11px] font-mono ${done === total ? 'text-emerald-400 font-bold' : 'text-slate-400'}">
                            ${done === total ? '✅ ฝึกครบแล้ว' : `ฝึกปฏิบัติ ${done}/${total} ขั้นตอน`}
                        </span>
                        <button onclick="AcademyTutor.selectLesson('${l.id}', true)" class="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-xs shadow">
                            🚀 เริ่มฝึกบทนี้
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    updateSubnetCalculatorUI() {
        const ipEl = document.getElementById('calcIpInput');
        const cidrEl = document.getElementById('calcCidrSelect');
        const outEl = document.getElementById('calcResultBox');
        if (!ipEl || !cidrEl || !outEl) return;

        const details = NetworkEngine.calculateSubnetDetails(ipEl.value || '192.168.10.65', parseInt(cidrEl.value, 10) || 26);

        outEl.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <div class="text-[11px] text-slate-400">Network Address (ชื่อวงแลน)</div>
                    <div class="text-base font-mono font-bold text-cyan-300 mt-0.5">${details.networkAddress}/${details.cidr}</div>
                    <div class="text-[10px] font-mono text-slate-500 mt-1">IP ใบแรกสุด (ห้ามตั้งให้เครื่องลูกข่าย)</div>
                </div>
                <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <div class="text-[11px] text-slate-400">Usable Host IP Range (ช่วงที่ใช้ตั้งให้เครื่องจริง)</div>
                    <div class="text-sm font-mono font-bold text-emerald-400 mt-0.5">${details.firstHost} ➔ ${details.lastHost}</div>
                    <div class="text-[10px] font-mono text-slate-400 mt-1">จำนวนเครื่องที่ใช้ได้: <b class="text-white">${details.usableHosts.toLocaleString()} เครื่อง</b> ($2^{${details.hostBits}} - 2$)</div>
                </div>
                <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <div class="text-[11px] text-slate-400">Broadcast Address (ส่งกระจายทั้งวง)</div>
                    <div class="text-base font-mono font-bold text-amber-300 mt-0.5">${details.broadcastAddress}</div>
                    <div class="text-[10px] font-mono text-slate-500 mt-1">IP ใบสุดท้ายของ Subnet</div>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                        <div class="text-[11px] text-slate-400">Subnet Mask (ใช้ในคำสั่ง ip address / ip route)</div>
                        <div class="text-sm font-mono font-bold text-white mt-0.5">${details.mask}</div>
                    </div>
                    <span class="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 font-mono text-xs font-bold">/${details.cidr}</span>
                </div>
                <div class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                        <div class="text-[11px] text-slate-400">Wildcard Mask (ใช้ใน OSPF network & ACL)</div>
                        <div class="text-sm font-mono font-bold text-purple-300 mt-0.5">${details.wildcard}</div>
                    </div>
                    <span class="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 font-mono text-xs">255 - Mask</span>
                </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5 mt-3">
                <div class="text-slate-400 text-[11px]">🔢 โครงสร้างเลขฐานสอง 32-Bit (Binary Bitwise AND):</div>
                <div class="flex flex-wrap justify-between gap-2"><span class="text-slate-400">IPv4 Address (${details.ip}):</span> <span class="text-cyan-300">${details.binaryIp}</span></div>
                <div class="flex flex-wrap justify-between gap-2"><span class="text-slate-400">Subnet Mask (/${details.cidr}):</span> <span class="text-amber-300">${details.binaryMask}</span></div>
            </div>
        `;
    },

    renderCheatSheetTab() {
        const box = document.getElementById('academyCheatSheetList');
        if (!box) return;

        box.innerHTML = this.lessons.map(l => `
            <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-cyan-300">${l.number}: ${l.topicEn} — ${l.title}</span>
                    <span class="text-[10px] font-mono text-slate-400">${l.badge}</span>
                </div>
                <div class="space-y-1.5">
                    ${(l.cheatSheet || []).map(c => `
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-xl bg-slate-950/90 border border-slate-800/80">
                            <code class="font-mono text-xs font-bold text-amber-300 select-all">${c.cmd}</code>
                            <span class="text-[11px] text-slate-300">${c.desc}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
};

window.AcademyTutor = AcademyTutor;
