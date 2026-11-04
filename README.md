# NetSim Touch v4.0 Ultimate (CN-Tracersim) 🌐📱🚀

**NetSim Touch v4.0 Ultimate** คือระบบจำลองเครือข่ายระดับ **CCNA Enterprise** และฝึกคำสั่ง **Cisco IOS CLI** สไตล์ Packet Tracer ที่ออกแบบมาเพื่อการสัมผัสบน **iPad / แท็บเล็ต** และเดสก์ท็อป รองรับการติดตั้งเป็น **Progressive Web App (PWA)** แบบเต็มจอและทำงานออฟไลน์ได้ 100%

---

## 🔥 ฟีเจอร์ระดับโปรใน v4.0 Ultimate

1. **🔍 OSI 7-Layer Packet PDU Inspector & Step-by-Step Mode**
   - สลับโหมดการส่งแพ็กเก็ตระหว่าง **⚡ Realtime** และ **🐾 Step-by-Step** (กดเดินแพ็กเก็ตทีละ Hop)
   - เปิดหน้าต่าง **OSI 7-Layer PDU Inspector** เพื่อดูการห่อหุ้มข้อมูล (Encapsulation) ตั้งแต่ Layer 1 (Physical Port), Layer 2 (Src/Dst MAC Address & **802.1Q VLAN Tag**), Layer 3 (Src/Dst IP, **NAT IP Translation** & **ค่า TTL ที่ลดลงทุกครั้งที่ผ่าน Router**), ไปจนถึง Layer 4–7 (ICMP Echo หรือ **TCP Port 80 HTTP GET**)
2. **🛡️ Extended ACL Firewall & NAT/PAT Overload + ISP Cloud**
   - สร้างกฎไฟร์วอลล์ **Access Control Lists (ACL)** บน Router เช่น บล็อก `ICMP Ping` แต่เปิดให้ `TCP Port 80 (HTTP)` ผ่านได้ (`access-list 100 deny icmp any any`, `access-list 100 permit ip any any`)
   - รองรับ **NAT Overload (PAT)** แปลง Private IP (`192.168.x.x`) เป็น Public IP (`203.0.113.x`) อัตโนมัติเมื่อวิ่งผ่านพอร์ต `ip nat inside` ออกสู่ `ip nat outside` พร้อมดูตาราง `show ip nat translations`
   - เพิ่มอุปกรณ์ **`+ ISP Cloud`** สำหรับจำลองโครงข่ายอินเทอร์เน็ตภายนอก
3. **🌐 Layer 7 HTTP Web Client / Server Simulation (TCP Port 80)**
   - เครื่องมือ **🌐 เว็บ HTTP** บนแถบด้านบน และคำสั่ง `http <ip>` ใน CLI เพื่อจำลองการส่ง **TCP SYN ➔ HTTP GET :80 ➔ 200 OK**
   - พิสูจน์การทำงานของ Extended ACL ได้ชัดเจน (เช่น บล็อก Ping แต่เข้าเว็บ Server ผ่านพอร์ต 80 ได้สำเร็จ)
4. **🟣 802.1Q VLAN Trunking & Router-on-a-Stick (Inter-VLAN Routing)**
   - ตั้งค่าพอร์ต Switch เป็น `switchport mode access` หรือ `switchport mode trunk` (แสดงป้าย `802.1Q TRUNK` บนสายแลน)
   - สร้าง Sub-interface บน Router เช่น `interface Gig0/0.10` พร้อมคำสั่ง `encapsulation dot1Q 10` เพื่อให้เครื่องต่าง VLAN คุยข้ามหากันได้ผ่านสายเส้นเดียว
5. **⚡ OSPF Dynamic Routing (`router ospf`) & Multi-Hop Static Routing (`ip route`)**
   - รองรับการประกาศวงแลนด้วย `router ospf 1` ➔ `network <ip> <wildcard> area 0`
   - คำนวณตาราง Routing อัตโนมัติ (Administrative Distance: Connected `0`, Static `1`, OSPF `110` พร้อม Longest Prefix Match)
6. **🎓 ระบบตรวจให้คะแนนอัตโนมัติ (PKA Auto-Grader `0% – 100%`)**
   - ปุ่ม **`🎓 Score: 100%`** บนแถบเมนู ตรวจสอบความสำเร็จของแล็บแต่ละข้อแบบเรียลไทม์ พร้อมกดคัดลอกใบรายงานผลส่งอาจารย์ได้ทันที
7. **🔎 Infinite Canvas Pan & Zoom (`50% – 150%`)**
   - ปุ่มซูมเข้า/ออก/รีเซ็ตมุมมอง มุมขวาล่าง และลากพื้นที่ว่างบนกระดานเพื่อเลื่อนดูผังเครือข่ายขนาดใหญ่ได้อย่างอิสระ
8. **📚 โจทย์แล็บมาตรฐาน CCNA 7 ระดับ (7 Curated Labs)**
   - **Lab 01:** Basic Switch LAN & MAC Table (`192.168.1.0/24`)
   - **Lab 02:** Inter-Subnet Router Gateway (`192.168.10.0/24` ⟷ `192.168.20.0/24`)
   - **Lab 03:** Multi-Router WAN & Static Routing (`R1-HQ` ⟷ `R2-Branch`)
   - **Lab 04:** Troubleshooting Challenge (ภารกิจซ่อมระบบล่ม 3 จุด พร้อมตรวจคะแนนอัตโนมัติ)
   - **Lab 05:** VLAN Trunking & Router-on-a-Stick (`802.1Q` Sub-interfaces `Gig0/0.10` & `.20`)
   - **Lab 06:** Enterprise OSPF Area 0 Dynamic Routing (`router ospf 1`)
   - **Lab 07:** Firewall ACL, NAT Overload & ISP Cloud (บล็อก ICMP Ping แต่เปิด HTTP Port 80 พร้อมทำ NAT ออกสู่อินเทอร์เน็ต)

---

## 💻 ตารางคำสั่ง Cisco IOS CLI ทั้งหมดที่รองรับ

| โหมด | คำสั่ง | คำอธิบาย |
| :--- | :--- | :--- |
| **User (`>`)** | `enable` / `en` | เข้าสู่โหมด Privileged Exec (`#`) |
| **Privileged (`#`)** | `configure terminal` / `conf t` | เข้าสู่โหมด Global Configuration (`(config)#`) |
| | `show ip interface brief` | แสดงตารางพอร์ต, IP Address/VLAN/Trunk และสถานะ Up/Down |
| | `show ip route` | แสดงตาราง Routing (`C` Connected, `L` Local, `S` Static, `O` OSPF) |
| | `show ip ospf neighbor` | แสดงตารางเพื่อนบ้าน OSPF (`FULL/DR`) |
| | `show access-lists` | แสดงกฎไฟร์วอลล์ ACL และจำนวนแพ็กเก็ตที่ตรงเงื่อนไข (`matches`) |
| | `show ip nat translations` | แสดงตารางแปลงที่อยู่ IP (Inside Local ➔ Inside Global) |
| | `show ip arp` | แสดงตาราง ARP (IP คู่กับ MAC Address) |
| | `show vlan brief` | แสดงตาราง VLAN และพอร์ตสมาชิกบน Switch |
| | `show interfaces trunk` | แสดงพอร์ตที่เปิดใช้งาน 802.1Q Trunk บน Switch |
| | `show mac address-table` | แสดงตาราง MAC Address ที่ Switch เรียนรู้จากสายที่เสียบอยู่ |
| | `show running-config` / `sh run` | แสดงการตั้งค่าทั้งหมดของอุปกรณ์ |
| | `ping <ip>` / `traceroute <ip>` | ทดสอบส่ง ICMP Echo หรือไล่เส้นทางทีละ Router Hop |
| | `http <ip>` | ทดสอบเปิดหน้าเว็บผ่าน TCP Port 80 (HTTP GET) |
| | `write` / `wr` | บันทึกการตั้งค่าลงหน่วยความจำ (`localStorage`) |
| **Global Config (`(config)#`)** | `hostname <name>` | เปลี่ยนชื่ออุปกรณ์ |
| | `interface <port \| port.vlan>` | เข้าไปตั้งค่าพอร์ตหลัก หรือสร้าง Sub-interface เช่น `int Gig0/0.10` |
| | `router ospf <process-id>` | เข้าสู่โหมดตั้งค่า OSPF (`(config-router)#`) |
| | `access-list 100 <permit\|deny> <icmp\|tcp\|ip> <src> <dst>` | สร้างกฎ Extended ACL บน Router |
| | `ip nat inside source list 1 overload` | เปิดใช้งาน NAT Overload (PAT) บน Router |
| | `ip route <net> <mask> <next-hop>` | เพิ่มเส้นทาง Static Route บน Router |
| | `ip default-gateway <ip>` | ตั้งค่า Default Gateway |
| **Router OSPF (`(config-router)#`)** | `network <ip> <wildcard> area <id>` | ประกาศวงแลนเข้าสู่ OSPF เช่น `network 192.168.10.0 0.0.0.255 area 0` |
| **Interface (`(config-if)#`)** | `ip address <ip> <mask>` | กำหนด IPv4 Address และ Subnet Mask |
| | `ip address dhcp` | ขอรับ IPv4 และ Default Gateway อัตโนมัติผ่าน DHCP |
| | `ip nat inside` / `ip nat outside` | กำหนดฝั่งพอร์ตภายใน/ภายนอกสำหรับทำ NAT Overload |
| | `encapsulation dot1Q <vlan-id>` | กำหนดหมายเลข 802.1Q VLAN Tag บน Sub-interface ของ Router |
| | `switchport mode <access\|trunk>` | ตั้งค่าพอร์ต Switch เป็น Access หรือ 802.1Q Trunk |
| | `switchport access vlan <1-4094>` | กำหนด Access VLAN ให้พอร์ตบน Switch |
| | `no shutdown` / `shutdown` | เปิด (`Up`) หรือปิด (`Administratively Down`) พอร์ต |
