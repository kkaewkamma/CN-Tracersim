# CN-Tracersim (v5.2 Enterprise Edition) 

<p align="center">
  <strong>เว็บแอปพลิเคชันจำลองเครือข่ายและฝึกพิมพ์คำสั่ง Cisco IOS CLI สไตล์ Cisco Packet Tracer</strong><br>
  ขับเคลื่อนด้วยสถาปัตยกรรม <strong>Vite 6, React 19, TypeScript (Strict), Zustand, Tailwind CSS, Vitest</strong> และ <strong>PWA Offline 100%</strong><br>
  พร้อมระบบผู้ช่วยฝึกสอน <strong>Cisco Networking Academy (NetAcad)</strong> ครบ 15 บทเรียน และ 12 แล็บปฏิบัติการพร้อมระบบตรวจคะแนนอัตโนมัติ (Auto-Grader)
</p>

<p align="center">
  <a href="https://github.com/kkaewkamma/CN-Tracersim/actions/workflows/ci.yml">
    <img src="https://github.com/kkaewkamma/CN-Tracersim/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7_Strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Vitest-18_Passed-6E9F18?logo=vitest&logoColor=white" alt="Vitest 18 Passed" />
  <img src="https://img.shields.io/badge/Legacy_Tests-20_Passed-10B981" alt="Legacy Tests 20 Passed" />
  <img src="https://img.shields.io/badge/PWA-Offline_Ready-5A0FC8?logo=pwa&logoColor=white" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/Cisco_NetAcad-15_Lessons_%26_12_Labs-049FD9?logo=cisco&logoColor=white" alt="Cisco NetAcad" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License MIT" />
</p>

---

## สารบัญ (Table of Contents)

- [ จุดเด่นสำคัญ (Key Highlights)](#-จุดเด่นสำคัญ-key-highlights)
- [ หลักสูตร Cisco Networking Academy (15 บทเรียน & 12 ปฏิบัติการ)](#-หลักสูตร-cisco-networking-academy-15-บทเรียน--12-ปฏิบัติการ)
- [ Interactive Cisco IOS CLI Terminal](#-interactive-cisco-ios-cli-terminal)
- [ สถาปัตยกรรมระบบ (Architecture & Tech Stack)](#-สถาปัตยกรรมระบบ-architecture--tech-stack)
- [ โครงสร้างโปรเจกต์ (Project Structure)](#-โครงสร้างโปรเจกต์-project-structure)
- [ การติดตั้งและเริ่มใช้งาน (Getting Started)](#-การติดตั้งและเริ่มใช้งาน-getting-started)
- [ การรันชุดทดสอบ (Dual-Test Runners)](#-การรันชุดทดสอบ-dual-test-runners)
- [ การใช้งานบน iPad และ PWA Offline](#-การใช้งานบน-ipad-และ-pwa-offline)
- [ ใบอนุญาต (License)](#-ใบอนุญาต-license)

---

## จุดเด่นสำคัญ (Key Highlights)

1. ** Interactive Topology Viewport:**
   - ผืนผ้าใบจำลองเครือข่ายความละเอียดสูง รองรับอุปกรณ์ 5 ประเภท ได้แก่ **Router, Switch, PC, Server** และ **ISP Cloud**
   - รองรับการ Pan & Zoom (50% – 160%) และการลากวาง (Drag & Drop) ด้วยระบบสัมผัสลื่นไหล
   - เส้นสัญญาณ SVG อัจฉริยะ แสดงสถานะพอร์ต UP/Down, ป้ายระบุโหมด **802.1Q TRUNK** และตัวช่วยตรวจสอบพอร์ตอัตโนมัติ

2. ** Decoupled Pure Simulation Core:**
   - Network Simulation Core ถูกแยกออกจาก UI และ DOM โดยสิ้นเชิง (100% Framework Agnostic)
   - มีระบบจำลองโปรโตคอลครบวงจร: **L2 Switching (CAM Table, STP, EtherChannel, Port Security), L3 Routing (LPM, Static Route, OSPFv2 Single Area), Security & NAT (Standard/Extended ACL, Dynamic PAT Overload, Static NAT)** และ **DHCPv4 DORA State Machine**

3. ** PKA Auto-Grader (0% – 100%):**
   - ตรวจผลลัพธ์การกำหนดค่าระบบเครือข่ายอัตโนมัติตามโจทย์แล็บ 12 ระดับ พร้อมวิเคราะห์จุดผิดพลาดและรายงานคำอธิบายละเอียด

4. ** Subnetting & VLSM Calculator ในตัว:**
   - คำนวณ Network Address, First/Last Usable IP, Broadcast Address, Wildcard Mask และแจกแจง Bitwise Binary 32-bit ทันที

5. ** Zero-Downtime Dual-Running Strategy:**
   - เมานต์ Modern React 19 UI บน `#root` เป็นค่าเริ่มต้น พร้อมรองรับการสลับไปโหมด Legacy Canvas ผ่านพารามิเตอร์ `?legacy=true` ได้ทันที

---

## หลักสูตร Cisco Networking Academy (15 บทเรียน & 12 ปฏิบัติการ)

เนื้อหาและแล็บถูกจัดโครงสร้างตามกรอบหลักสูตร Cisco NetAcad (Networking Basics, Switching, Routing and Wireless Essentials, และ Network Security):

### 15 บทเรียนตาม Syllabus
| บทเรียน | ชื่อหัวข้อ | มาตรฐานอ้างอิง NetAcad |
| :--- | :--- | :--- |
| **01** | Network Components, Topologies & OSI Model | CCNA 1: ITN Modules 1-3 |
| **02** | Ethernet Switching, MAC Address & CAM Table | CCNA 1: ITN Module 7 |
| **03** | IPv4 Addressing, Subnetting & VLSM | CCNA 1: ITN Modules 11-12 |
| **04** | IPv6 Addressing & Neighbor Discovery | CCNA 1: ITN Module 12 |
| **05** | ARP & ICMP Operation | CCNA 1: ITN Modules 9 & 14 |
| **06** | Cisco IOS CLI Modes & Navigation | CCNA 1: ITN Module 2 |
| **07** | Basic Device Hardening & Initial Configuration | CCNA 1: ITN Modules 2 & 16 |
| **08** | VLANs, Access Ports & 802.1Q Trunking | CCNA 2: SRWE Modules 1-3 |
| **09** | Inter-VLAN Routing (Router-on-a-Stick & SVI) | CCNA 2: SRWE Module 4 |
| **10** | Spanning Tree Protocol (STP & RSTP) | CCNA 2: SRWE Module 5 |
| **11** | EtherChannel (LACP & Static Bundling) | CCNA 2: SRWE Module 6 |
| **12** | DHCPv4 Server, Excluded IP & DORA Relay | CCNA 2: SRWE Module 7 |
| **13** | IPv4 Static & Default Routing | CCNA 2: SRWE Modules 14-16 |
| **14** | Single-Area OSPFv2 Dynamic Routing | CCNA 3: ENSA Modules 1-2 |
| **15** | Network Security: ACLs, NAT/PAT & Port Security | CCNA 2: SRWE Module 9 & CCNA 3 |

### 12 แล็บปฏิบัติการแบบก้าวหน้า (Progressive Practical Labs)
1. **Lab 01:** Basic Switch Configuration & Device Hardening
2. **Lab 02:** Basic Router Configuration & Default Gateway
3. **Lab 03:** IPv4 Addressing & VLSM Subnetting (/26)
4. **Lab 04:** IPv4 Static & Default Routing
5. **Lab 05:** VLANs, Access Ports & 802.1Q Trunking
6. **Lab 06:** Inter-VLAN Routing (Router-on-a-Stick 802.1Q)
7. **Lab 07:** DHCPv4 Server, Excluded IP & DORA Process
8. **Lab 08:** Single-Area OSPFv2 Dynamic Routing (Area 0)
9. **Lab 09:** Standard & Extended IPv4 ACL Firewall (Implicit Deny)
10. **Lab 10:** NAT/PAT Overload, Firewall ACL & ISP Cloud
11. **Lab 11:** Network Troubleshooting Challenge (ซ่อมระบบล่ม 3 จุด)
12. **Lab 12:** Integrated Enterprise Network (Capstone Enterprise Lab)

---

## Interactive Cisco IOS CLI Terminal

จำลองพฤติกรรมของ Cisco IOS Shell พร้อม Command Parser และ Context State Machine:
- **โหมด CLI:** User EXEC (`Router>`), Privileged EXEC (`Router#`), Global Configuration (`Router(config)#`), Interface Mode (`Router(config-if)#`), และ Router Config (`Router(config-router)#`)
- **คำสั่งสำคัญที่รองรับ:**
  - `enable`, `disable`, `configure terminal`, `hostname <name>`
  - `interface <id>`, `ip address <ip> <mask>`, `no shutdown`, `encapsulation dot1Q <vlan>`
  - `switchport mode access|trunk`, `switchport access vlan <id>`, `switchport port-security`
  - `ip route <net> <mask> <next-hop>`, `router ospf <id>`, `network <net> <wildcard> area <id>`
  - `access-list <id> permit|deny <proto> ...`, `ip access-group <id> in|out`
  - `ip nat inside`, `ip nat outside`, `ip nat inside source list <id> interface <if> overload`
  - `ip dhcp pool <name>`, `network`, `default-router`, `ip dhcp excluded-address`
  - `show running-config`, `show ip interface brief`, `show ip route`, `show mac-address-table`, `show ip ospf neighbor`, `show ip nat translations`
  - คีย์ลัด: **Tab Auto-Complete**, History (`Up`/`Down`), `?` แสดง Help

---

## สถาปัตยกรรมระบบ (Architecture & Tech Stack)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. Presentation Layer                           │
│     React 19 + Tailwind CSS + Lucide Icons + Cisco Terminal Modal      │
│         Topology Viewport (SVG Cable Layer + Node Renderer)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        2. Application Layer                            │
│     Zustand Global Stores: useTopologyStore, useSessionStore,          │
│     useAcademyStore + LabGraderService (Auto-Grading 100%)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    3. Network Simulation Core                          │
│     Pure TypeScript (No UI/DOM Dependencies, Strictly Decoupled):       │
│     - IpMath (Bitwise CIDR/VLSM)     - L2Switching (CAM/STP/LACP)      │
│     - AclEngine (Top-Down Wildcard)  - NatEngine (Stateful PAT/NAT)    │
│     - OspfEngine (Dijkstra/Cost)     - DhcpEngine (DORA Leases)        │
│     - CiscoCliParser (IOS Context State Machine)                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                   4. Persistence & PWA Offline Layer                   │
│     IndexedDB Lab Storage (idb) + Workbox Service Worker Precache      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
CN-Tracersim/
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI (Build & Dual-Test)
├── dist/                              # PWA Precache Production Bundle
├── public/                            # PWA Manifest & App Icons
├── src/
│   ├── core/                          # PURE SIMULATION ENGINE (No UI / No DOM)
│   │   ├── types/                     # TypeScript Domain Models
│   │   ├── engine/                    # Protocol Simulation Engines (IP, L2, ACL, NAT, OSPF, DHCP)
│   │   ├── cli/                       # Cisco IOS Parser & State Machine
│   │   └── curriculum/                # NetAcad 15 Lessons & 12 Labs Catalog
│   ├── application/                   # ⚙️ APPLICATION & STATE MANAGEMENT
│   │   ├── stores/                    # Zustand Stores (Topology, Session, Academy)
│   │   └── services/                  # LabGraderService
│   ├── presentation/                  # REACT 19 PRESENTATION LAYER
│   │   ├── components/
│   │   │   ├── canvas/                # Viewport, CableLayer, NodeRenderer
│   │   │   ├── terminal/              # CiscoTerminalModal
│   │   │   └── modals/                # SubnetCalculatorModal, NetAcadCoachModal
│   │   ├── layouts/                   # AppHeader
│   │   ├── App.tsx                    # Main Modern Application View
│   │   └── index.css                  # Tailwind CSS Directives
│   └── main.tsx                       # Dual-Running Vite Entry Point
├── tests/
│   ├── unit/                          # Vitest Modern Unit Tests (15 Tests)
│   ├── integration/                   # Vitest 12-Labs Auto-Grader Tests (3 Tests)
│   └── engine-verification.test.cjs   # Legacy Verification Suite (20 Tests)
├── js/                                # Legacy Baseline Engine (Preserved)
├── index.html                         # Dual-Mount Entry Point
├── vite.config.ts                     # Vite 6 & PWA Configuration
└── tsconfig.json                      # Strict TypeScript Configuration
```

---

## การติดตั้งและเริ่มใช้งาน (Getting Started)

### ความต้องการของระบบ (Prerequisites)
- [Node.js](https://nodejs.org/) v18.0 ขึ้นไป (แนะนำ v20+)
- npm v9+

### ขั้นตอนการรันบนเครื่อง Local
```bash
# 1. Clone repository
git clone https://github.com/kkaewkamma/CN-Tracersim.git
cd CN-Tracersim

# 2. ติดตั้ง Dependencies
npm install

# 3. รัน Development Server
npm run dev
```

เปิดเบราว์เซอร์ไปที่ `http://localhost:5173/` เพื่อเริ่มใช้งาน

### การ Build สำหรับ Production
```bash
npm run build
```
ผลลัพธ์จะถูกสร้างไว้ในโฟลเดอร์ `dist/` พร้อม Service Worker และ Manifest สำหรับ PWA

---

## การรันชุดทดสอบ (Dual-Test Runners)

โปรเจกต์นี้ใช้ระบบทดสอบแบบคู่ขนาน (Dual-Test Runners) เพื่อรับประกันความเข้ากันได้ 100%:

```bash
# 1. รัน Vitest Modern Test Suites (18 Tests - TypeScript Engine, CLI & Stores)
npm test

# 2. รัน Legacy Verification Test Suite (20 Tests - Baseline Engine)
npm run test:legacy

# 3. รันทั้งสองชุดทดสอบพร้อมกัน
npm test && npm run test:legacy
```

---

## การใช้งานบน iPad และ PWA Offline

CN-Tracersim รองรับการติดตั้งเป็น Progressive Web App (PWA) บน iPad, แท็บเล็ต Android และคอมพิวเตอร์เดสก์ท็อป:
1. เปิดแอปพลิเคชันผ่าน Safari บน iPad หรือ Chrome บนแท็บเล็ต
2. แตะปุ่ม **Share (แชร์)** แล้วเลือก **"Add to Home Screen" (เพิ่มไปยังหน้าจอโฮม)**
3. เปิดใช้งานแบบเต็มหน้าจอ (Standalone Display) เสมือนเนทีฟแอป โดยทำงานแบบ **Offline 100% ไม่ต้องต่ออินเทอร์เน็ต**

---

## ใบอนุญาต (License)

โปรเจกต์นี้เผยแพร่ภายใต้ใบอนุญาต [MIT License](./LICENSE)
