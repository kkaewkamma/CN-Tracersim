# NetSim Touch v5.0 Academy Edition (CN-Tracersim) 🎓🌐📱🚀

**NetSim Touch v5.0 Academy Edition** คือเว็บแอปพลิเคชันจำลองเครือข่ายและฝึกพิมพ์คำสั่ง **Cisco IOS CLI** สไตล์ **Cisco Packet Tracer** พร้อม **ระบบผู้ช่วยฝึกสอนทีละขั้น (Interactive CLI Coach)** และสรุปเนื้อหาทฤษฎีครบทั้ง **13 บทเรียนตามตารางสอนวิชา Computer Networks** รองรับการใช้งานทั้งบน **iPad / แท็บเล็ต** และคอมพิวเตอร์เดสก์ท็อป (PWA Offline 100%)

---

## 🎓 จุดเด่นใน v5.0 Academy Edition

1. **📚 คอร์สเรียนวิชา Computer Networks ครบ 13 บทตาม Syllabus (`js/academy-tutor.js`)**
   - **บทที่ 01 — Network Layer:** โครงสร้าง IPv4 Packet, ค่า TTL, การทำงานของ ICMP `ping` และ `traceroute`
   - **บทที่ 02 — Address Resolution (ARP):** กลไก ARP Request (`Broadcast FFFF.FFFF.FFFF`), ARP Reply (`Unicast`) และตาราง `show ip arp` / `arp -a`
   - **บทที่ 03 — Transport Layer:** เปรียบเทียบ TCP vs UDP, หมายเลข Port สำคัญ และวิเคราะห์ **TCP 3-Way Handshake (`SYN ➔ SYN-ACK ➔ ACK`)**
   - **บทที่ 04 — IPv4 Addressing:** การคำนวณ Subnetting, VLSM, CIDR (`/24`–`/30`), สูตรหาจำนวนโฮสต์ ($2^h - 2$)
   - **บทที่ 05 — IPv6 Addressing:** โครงสร้าง 128-bit Hexadecimal, กฎการย่อ `::`, Global Unicast (`2001:db8::/64`), Link-Local (`FE80::`), SLAAC (`ipv6 address autoconfig`) และ `ipv6 unicast-routing`
   - **บทที่ 06 — Switches Concepts:** ตาราง MAC Address / CAM Table และกระบวนการ **Learning ➔ Flooding ➔ Forwarding**
   - **บทที่ 07 — Basic Switch & Device Security Config:** การตั้งค่า `hostname`, `enable secret`, `service password-encryption`, `line vty 0 4`, `transport input ssh` และ Management VLAN (`interface vlan 1`)
   - **บทที่ 08 — VLANs & Trunking:** การสร้าง `vlan 10` (`name Sales`), พอร์ต Access vs 802.1Q Trunk และการตั้งค่า `switchport trunk native vlan 99`
   - **บทที่ 09 — Basic Router Configuration:** การตั้งค่าพอร์ต Router (`interface Gig0/1`, `ip address`, `no shutdown`) และ `show ip interface brief`
   - **บทที่ 10 — Routing Concepts:** Administrative Distance (`Connected=0`, `Static=1`, `OSPF=110`), Longest Prefix Match, Static Route, Default Route (`0.0.0.0 0.0.0.0`) และ OSPF Area 0
   - **บทที่ 11 — Inter-VLAN Routing:** ครบทั้ง **Router-on-a-Stick** (`interface Gig0/0.10` + `encapsulation dot1Q 10`) และ **Layer 3 Switch SVI** (`ip routing` + `interface vlan 10`)
   - **บทที่ 12 — Access Control Lists (ACL):** ทั้ง **Standard ACL (1–99)** และ **Extended ACL (100–199)** พร้อมการผูกพอร์ต `ip access-group 100 in`
   - **บทที่ 13 — Network Address Translation (NAT):** คำศัพท์สอบ Inside Local / Inside Global / Outside Local / Outside Global, การตั้งค่า **Static NAT** (`ip nat inside source static`) และ **PAT Overload** (`overload`)

2. **🎯 โค้ชจับมือฝึกพิมพ์คำสั่งจริงทีละขั้น (Step-by-Step Guided CLI Coach)**
   - แสดงป้ายชี้เป้า **`🎯 แตะฝึก CLI ขั้นที่ X`** บนตัวอุปกรณ์ที่ต้องตั้งค่าบนกระดาน
   - แถบผู้ช่วยภายในหน้าต่าง Terminal (`#cliTutorBanner`) แนะนำคำสั่งถัดไปพร้อมอธิบายเหตุผลภาษาไทย และมีปุ่ม **`⚡ พิมพ์และรันให้ดู`** เมื่อต้องการดูตัวอย่าง
   - ตรวจจับคำสั่งที่พิมพ์ใน CLI อัตโนมัติและเช็คถูก `✅` ทันทีเมื่อทำสำเร็จ

3. **🧮 เครื่องคิดเลข IPv4 Subnetting / VLSM / Binary ในตัว**
   - คำนวณ **Network Address, Usable Host Range, Broadcast Address, Subnet Mask, Wildcard Mask** และแสดงเลขฐานสอง 32-Bit แบบเรียลไทม์

4. **🔍 OSI 7-Layer Packet PDU Inspector & 🏆 PKA Auto-Grader (`0% – 100%`)**
   - เจาะลึกแพ็กเก็ตทีละ Hop ตั้งแต่ Layer 1 ถึง Layer 7 (TCP Handshake, HTTP Port 80, ICMP, TTL, NAT IP, 802.1Q Tag, MAC Address)
   - ระบบตรวจให้คะแนนแล็บอัตโนมัติพร้อมคัดลอกใบรายงานผลส่งอาจารย์
