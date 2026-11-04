/**
 * NetSim Touch v5.1 Core Engine - Authentic Cisco IOS Network Simulation Core
 * Strictly separated from UI. Implements authentic packet-level and protocol-level behavior:
 * 1. ACL Engine: Top-Down evaluation, Standard (1-99) & Extended (100-199), Wildcard Masks, Port matching,
 *    Inbound/Outbound interface bindings (ip access-group), and strict Cisco IOS Implicit Deny.
 * 2. NAT/PAT Engine: Inside/Outside interface roles, Static NAT, Dynamic PAT Overload with ACL verification,
 *    unique source port allocation, translation table tracking, and stateful Reverse NAT on the actual return path.
 * 3. OSPF Engine: Process ID, Network/Wildcard matching, strict Area ID adjacency verification,
 *    Router-ID election, Neighbor State Machine (FULL/DR, FULL/BDR), and Interface Cost metric calculation.
 * 4. DHCP Engine: Full 4-Step DORA (Discover, Offer, Request, ACK), DHCP Pools (network, default-router, dns-server),
 *    Excluded-Address ranges, Lease Binding Table, Duplicate IP prevention, and Pool Exhaustion detection.
 * 5. L2-L4 Protocol Simulation: ARP Cache & Request/Reply, Switch CAM MAC Learning, STP Loop Prevention,
 *    VLAN Isolation, 802.1Q Tagging & Native VLAN, TCP 3-Way Handshake, UDP, and ICMP.
 */

const NetworkEngine = {
    isValidIPv4(ip) {
        if (!ip || typeof ip !== 'string') return false;
        const parts = ip.trim().split('.');
        if (parts.length !== 4) return false;
        return parts.every(p => {
            if (!/^\d+$/.test(p)) return false;
            const num = parseInt(p, 10);
            return num >= 0 && num <= 255 && (p === '0' || !p.startsWith('0'));
        });
    },

    isValidIPv6(addr) {
        if (!addr || typeof addr !== 'string') return false;
        const clean = addr.trim().split('/')[0];
        if (!clean.includes(':')) return false;
        return /^[0-9a-fA-F:]+$/.test(clean);
    },

    isValidMask(mask) {
        if (!this.isValidIPv4(mask)) return false;
        const validMaskInts = [
            0x00000000, 0x80000000, 0xC0000000, 0xE0000000, 0xF0000000, 0xF8000000,
            0xFC000000, 0xFE000000, 0xFF000000, 0xFF800000, 0xFFC00000, 0xFFE00000,
            0xFFF00000, 0xFFF80000, 0xFFFC0000, 0xFFFE0000, 0xFFFF0000, 0xFFFF8000,
            0xFFFFC000, 0xFFFFE000, 0xFFFFF000, 0xFFFFF800, 0xFFFFFC00, 0xFFFFFE00,
            0xFFFFFF00, 0xFFFFFF80, 0xFFFFFFC0, 0xFFFFFFE0, 0xFFFFFFF0, 0xFFFFFFF8,
            0xFFFFFFFC, 0xFFFFFFFE, 0xFFFFFFFF
        ];
        return validMaskInts.includes(this.ipToInt(mask) >>> 0);
    },

    ipToInt(ip) {
        return ip.trim().split('.').reduce((acc, oct) => ((acc << 8) + parseInt(oct, 10)) >>> 0, 0) >>> 0;
    },

    intToIp(int) {
        return [
            (int >>> 24) & 255,
            (int >>> 16) & 255,
            (int >>> 8) & 255,
            int & 255
        ].join('.');
    },

    cidrToMask(cidr) {
        const bits = Math.max(0, Math.min(32, parseInt(cidr, 10) || 24));
        const maskInt = bits === 0 ? 0 : (0xFFFFFFFF << (32 - bits)) >>> 0;
        return this.intToIp(maskInt);
    },

    wildcardToMask(wildcard) {
        if (!this.isValidIPv4(wildcard)) return '255.255.255.255';
        const wInt = this.ipToInt(wildcard);
        const mInt = (~wInt) >>> 0;
        return this.intToIp(mInt);
    },

    maskToWildcard(mask) {
        if (!this.isValidIPv4(mask)) return '0.0.0.255';
        const mInt = this.ipToInt(mask);
        return this.intToIp((~mInt) >>> 0);
    },

    maskToCidr(mask) {
        if (!this.isValidMask(mask)) return 24;
        let m = this.ipToInt(mask) >>> 0;
        let bits = 0;
        while (m & 0x80000000) {
            bits++;
            m = (m << 1) >>> 0;
        }
        return bits;
    },

    getNetworkAddress(ip, mask) {
        if (!this.isValidIPv4(ip) || !this.isValidIPv4(mask)) return null;
        return this.intToIp((this.ipToInt(ip) & this.ipToInt(mask)) >>> 0);
    },

    calculateSubnetDetails(ipInput = '192.168.10.65', cidrOrMask = 26) {
        const ip = this.isValidIPv4(ipInput) ? ipInput.trim() : '192.168.10.1';
        let cidr = 24;
        let mask = '255.255.255.0';
        if (typeof cidrOrMask === 'number' || /^\d+$/.test(String(cidrOrMask))) {
            cidr = Math.max(8, Math.min(32, parseInt(cidrOrMask, 10) || 24));
            mask = this.cidrToMask(cidr);
        } else if (this.isValidMask(cidrOrMask)) {
            mask = cidrOrMask;
            cidr = this.maskToCidr(mask);
        }

        const ipInt = this.ipToInt(ip);
        const maskInt = this.ipToInt(mask);
        const wildcardInt = (~maskInt) >>> 0;
        const netInt = (ipInt & maskInt) >>> 0;
        const bcastInt = (netInt | wildcardInt) >>> 0;

        const hostBits = 32 - cidr;
        const totalAddresses = Math.pow(2, hostBits);
        const usableHosts = hostBits <= 1 ? 0 : totalAddresses - 2;
        const firstHost = hostBits <= 1 ? this.intToIp(netInt) : this.intToIp((netInt + 1) >>> 0);
        const lastHost = hostBits <= 1 ? this.intToIp(bcastInt) : this.intToIp((bcastInt - 1) >>> 0);

        const firstOctet = (ipInt >>> 24) & 255;
        let ipClass = 'Class C';
        if (firstOctet >= 1 && firstOctet <= 126) ipClass = 'Class A';
        else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'Class B';
        else if (firstOctet >= 224) ipClass = 'Class D/E (Multicast)';

        const toBin = (numInt) => [
            ((numInt >>> 24) & 255).toString(2).padStart(8, '0'),
            ((numInt >>> 16) & 255).toString(2).padStart(8, '0'),
            ((numInt >>> 8) & 255).toString(2).padStart(8, '0'),
            (numInt & 255).toString(2).padStart(8, '0')
        ].join('.');

        return {
            ip,
            cidr,
            mask,
            wildcard: this.intToIp(wildcardInt),
            networkAddress: this.intToIp(netInt),
            broadcastAddress: this.intToIp(bcastInt),
            firstHost,
            lastHost,
            usableHosts,
            totalAddresses,
            hostBits,
            ipClass,
            binaryIp: toBin(ipInt),
            binaryMask: toBin(maskInt)
        };
    },

    isSameSubnet(ip1, ip2, mask) {
        if (!this.isValidIPv4(ip1) || !this.isValidIPv4(ip2) || !this.isValidIPv4(mask)) return false;
        const m = this.ipToInt(mask);
        return ((this.ipToInt(ip1) & m) >>> 0) === ((this.ipToInt(ip2) & m) >>> 0);
    },

    /**
     * Authentic Cisco IOS Wildcard Mask bit-by-bit comparison:
     * 0 bits in wildcard must match exactly; 1 bits in wildcard are "don't care".
     */
    matchesWildcard(packetIp, ruleIp, wildcard = '0.0.0.0') {
        if (!ruleIp || ruleIp === 'any') return true;
        if (!this.isValidIPv4(packetIp) || !this.isValidIPv4(ruleIp)) return false;
        const wc = this.isValidIPv4(wildcard) ? wildcard : '0.0.0.0';
        const pktInt = this.ipToInt(packetIp);
        const ruleInt = this.ipToInt(ruleIp);
        const wcInt = this.ipToInt(wc);
        const careMask = (~wcInt) >>> 0;
        return ((pktInt & careMask) >>> 0) === ((ruleInt & careMask) >>> 0);
    },

    generateMac(devType = 'router') {
        const ouiMap = {
            router: '001B.54',
            switch: '0024.C4',
            pc: '00E0.4C',
            server: '0050.56',
            cloud: '000C.29'
        };
        const prefix = ouiMap[devType] || '001B.54';
        const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
        return `${prefix}${hex()}.${hex()}${hex()}`;
    },

    getBasePortName(portName) {
        return (portName || '').split('.')[0];
    },

    isL3Device(dev) {
        if (!dev) return false;
        return dev.type === 'router' || (dev.type === 'switch' && !!dev.ipRouting);
    },

    isInterfaceUp(dev, portName) {
        if (!dev || !dev.ports) return false;
        const pObj = dev.ports[portName];
        if (!pObj || !pObj.up || pObj.errDisabled) return false;
        const baseName = this.getBasePortName(portName);
        if (baseName !== portName) {
            const baseObj = dev.ports[baseName];
            if (baseObj && (!baseObj.up || baseObj.errDisabled)) return false;
        }
        return true;
    },

    /**
     * =========================================================================
     * CISCO IOS SWITCH PORT SECURITY ENGINE (CCNA SRWE Module 11)
     * =========================================================================
     * Evaluates Switch Port Security on ingress frames:
     * - Supports `switchport port-security`, `maximum <1-32>`, `mac-address <mac|sticky>`,
     *   and `violation <protect|restrict|shutdown>`
     * - Automatically learns Sticky/Dynamic secure MACs up to `maximum`
     * - On violation:
     *   * `protect`  : Drops frame silently (does not increment violation counter)
     *   * `restrict` : Drops frame and increments `violationCount` (Syslog/SNMP trap)
     *   * `shutdown` : Places port into `err-disabled` state (`up = false`, `errDisabled = true`)
     */
    checkSwitchPortSecurity(swDev, portName, srcMac) {
        if (!swDev || swDev.type !== 'switch' || !portName) {
            return { allowed: true };
        }
        const pObj = swDev.ports?.[portName];
        if (!pObj) return { allowed: true };

        if (pObj.errDisabled) {
            return {
                allowed: false,
                errDisabled: true,
                violationMode: pObj.portSecurity?.violation || 'shutdown',
                reason: `🔒 Port Security Error-Disabled: พอร์ต ${portName} บน ${swDev.name} อยู่ในสถานะ err-disabled (ต้องรัน shutdown และ no shutdown เพื่อกู้คืน)`
            };
        }

        const ps = pObj.portSecurity;
        if (!ps || !ps.enabled || !srcMac) {
            return { allowed: true };
        }

        const normMac = String(srcMac).trim().toUpperCase();
        ps.secureMacs = Array.isArray(ps.secureMacs) ? ps.secureMacs.map(m => String(m).trim().toUpperCase()) : [];
        const maxMacs = Math.max(1, parseInt(ps.maximum, 10) || 1);
        const violationMode = (ps.violation || 'shutdown').toLowerCase();

        // Already a known secure MAC on this port
        if (ps.secureMacs.includes(normMac)) {
            return { allowed: true };
        }

        // Still have room under `maximum` -> dynamically / sticky learn this MAC
        if (ps.secureMacs.length < maxMacs) {
            ps.secureMacs.push(normMac);
            return { allowed: true, learnedSecureMac: normMac };
        }

        // Violation triggered!
        ps.lastViolatingMac = normMac;
        if (violationMode === 'protect') {
            return {
                allowed: false,
                errDisabled: false,
                violationMode: 'protect',
                reason: `🔒 Port Security Violation (Protect) บน ${swDev.name} (${portName}): ดรอปเฟรมจาก MAC ${normMac} (เกินค่า Maximum ${maxMacs})`
            };
        }

        ps.violationCount = (ps.violationCount || 0) + 1;
        if (violationMode === 'restrict') {
            return {
                allowed: false,
                errDisabled: false,
                violationMode: 'restrict',
                violationCount: ps.violationCount,
                reason: `🔒 Port Security Violation (Restrict #${ps.violationCount}) บน ${swDev.name} (${portName}): บล็อก MAC ${normMac} และแจ้งเตือน Security Trap`
            };
        }

        // Default Cisco IOS violation mode: shutdown -> err-disabled
        pObj.errDisabled = true;
        pObj.up = false;
        return {
            allowed: false,
            errDisabled: true,
            violationMode: 'shutdown',
            violationCount: ps.violationCount,
            reason: `🔒 Port Security Violation (Shutdown -> err-disabled) บน ${swDev.name} (${portName}):ตรวจพบ MAC แปลกปลอม ${normMac} พอร์ตถูกสั่งปิดอัตโนมัติ!`
        };
    },

    /**
     * Checks if two switch ports on connected switches form a valid EtherChannel (LACP / PAgP / On) bundle.
     */
    isEtherChannelCompat(p1Obj, p2Obj) {
        const cg1 = p1Obj?.channelGroup;
        const cg2 = p2Obj?.channelGroup;
        if (!cg1?.id || !cg2?.id) return false;
        const m1 = (cg1.mode || '').toLowerCase();
        const m2 = (cg2.mode || '').toLowerCase();
        if (m1 === 'on' && m2 === 'on') return true;
        if ((m1 === 'active' && (m2 === 'active' || m2 === 'passive')) ||
            (m1 === 'passive' && m2 === 'active')) return true;
        if ((m1 === 'desirable' && (m2 === 'desirable' || m2 === 'auto')) ||
            (m1 === 'auto' && m2 === 'desirable')) return true;
        return false;
    },

    getEtherChannelSummary(swDev, devices = [], cables = []) {
        if (!swDev || swDev.type !== 'switch') return [];
        const groups = {};
        for (const [pName, pObj] of Object.entries(swDev.ports || {})) {
            if (pName.toLowerCase().startsWith('port-channel')) continue;
            if (pObj.channelGroup?.id) {
                const gid = Number(pObj.channelGroup.id);
                if (!groups[gid]) {
                    groups[gid] = {
                        groupId: gid,
                        portChannelName: `Po${gid}`,
                        fullPortName: `Port-channel${gid}`,
                        protocol: pObj.channelGroup.protocol || 'LACP',
                        mode: pObj.channelGroup.mode || 'active',
                        members: []
                    };
                }
                const cable = cables.find(c => (c.from === swDev.id && c.fromPort === pName) || (c.to === swDev.id && c.toPort === pName));
                let flag = 'D';
                if (this.isInterfaceUp(swDev, pName)) {
                    if (cable) {
                        const peerId = cable.from === swDev.id ? cable.to : cable.from;
                        const peerPort = cable.from === swDev.id ? cable.toPort : cable.fromPort;
                        const peerDev = devices.find(d => d.id === peerId);
                        const peerPortObj = peerDev?.ports?.[peerPort];
                        if (peerDev && this.isInterfaceUp(peerDev, peerPort) && this.isEtherChannelCompat(pObj, peerPortObj)) {
                            flag = 'P';
                        } else {
                            flag = 'I';
                        }
                    } else {
                        flag = 'I';
                    }
                }
                groups[gid].members.push({ port: pName, flag });
            }
        }
        return Object.values(groups).map(g => {
            const hasBundled = g.members.some(m => m.flag === 'P');
            g.status = hasBundled ? 'SU' : 'SD';
            return g;
        });
    },

    /**
     * =========================================================================
     * PRIORITY 0.1: CISCO IOS ACL ENGINE (WITH STRICT IMPLICIT DENY)
     * =========================================================================
     * Evaluates an ACL by ID (or all active ACLs on router/interface) in top-down order.
     * Supports:
     * - Standard ACL (1-99): Matches Source IP + Source Wildcard
     * - Extended ACL (100-199): Matches Protocol (ip, icmp, tcp, udp, http),
     *   Source IP + Source Wildcard, Destination IP + Destination Wildcard, and Destination Port (dstPort)
     * - Strict Cisco IOS Implicit Deny: When an ACL exists / is bound to an interface,
     *   any packet that does not match any rule is DENIED by the implicit `deny ip any any` at the end.
     */
    evaluateAclRules(rulesList, protocol, srcIp, dstIp, dstPort = null, aclIdLabel = 100) {
        if (!rulesList || rulesList.length === 0) {
            // In Cisco IOS, an applied empty ACL or unmatched ACL results in Implicit Deny
            return {
                allowed: false,
                implicitDeny: true,
                matchedRule: {
                    id: aclIdLabel,
                    action: 'deny',
                    protocol: 'ip',
                    src: 'any',
                    dst: 'any',
                    implicit: true
                }
            };
        }

        const normProto = (protocol || 'ip').toLowerCase();
        const effectiveDstPort = dstPort !== null ? Number(dstPort) : (normProto === 'tcp' || normProto === 'http' ? 80 : null);

        for (const r of rulesList) {
            const ruleProto = (r.protocol || 'ip').toLowerCase();
            const isStandard = Number(r.id) >= 1 && Number(r.id) <= 99;

            let protoMatch = false;
            if (isStandard || ruleProto === 'ip') {
                protoMatch = true;
            } else if (ruleProto === normProto) {
                protoMatch = true;
            } else if (ruleProto === 'http' && (normProto === 'tcp' || normProto === 'http')) {
                protoMatch = effectiveDstPort === null || effectiveDstPort === 80;
            } else if (ruleProto === 'tcp' && normProto === 'http') {
                protoMatch = true;
            }
            if (!protoMatch) continue;

            // Check optional port constraint (e.g. eq 80 / eq www / eq 443)
            if (!isStandard && r.dstPort !== undefined && r.dstPort !== null && r.dstPort !== 'any') {
                const reqPort = r.dstPort === 'www' || r.dstPort === 'http' ? 80 : Number(r.dstPort);
                if (!isNaN(reqPort) && effectiveDstPort !== null && effectiveDstPort !== reqPort) {
                    continue;
                }
            }

            const srcMatch = this.matchesWildcard(srcIp, r.src || 'any', r.srcWildcard || '0.0.0.0');
            const dstMatch = isStandard
                ? true
                : this.matchesWildcard(dstIp, r.dst || 'any', r.dstWildcard || '0.0.0.0');

            if (srcMatch && dstMatch) {
                r.hits = (r.hits || 0) + 1;
                return {
                    allowed: r.action === 'permit',
                    implicitDeny: false,
                    matchedRule: r
                };
            }
        }

        // Strict Cisco IOS Implicit Deny at the end of the ACL!
        return {
            allowed: false,
            implicitDeny: true,
            matchedRule: {
                id: rulesList[0]?.id || aclIdLabel,
                action: 'deny',
                protocol: 'ip',
                src: 'any',
                dst: 'any',
                implicit: true
            }
        };
    },

    /**
     * Evaluates Router ACLs on ingressPort ('in'), egressPort ('out'), or router-level ACLs.
     * Note: ACLs that are ONLY referenced by `router.natRule.aclId` (e.g., Standard ACL 1 for NAT overload)
     * and NOT bound to an interface via `ip access-group` are NAT classification ACLs, not traffic-filtering firewall ACLs!
     */
    evaluateRouterAcl(router, protocol, srcIp, dstIp, inPort = null, outPort = null, dstPort = null) {
        const allRules = router.acls || [];
        const inPortObj = inPort ? router.ports?.[inPort] : null;
        const outPortObj = outPort ? router.ports?.[outPort] : null;

        // 1. Check Inbound Interface ACL (`ip access-group <id> in`)
        const inAclId = inPortObj?.aclIn || (inPortObj?.aclGroup?.direction === 'in' ? inPortObj.aclGroup.id : null);
        if (inAclId !== null && inAclId !== undefined) {
            const rulesForIn = allRules.filter(r => Number(r.id) === Number(inAclId));
            const res = this.evaluateAclRules(rulesForIn, protocol, srcIp, dstIp, dstPort, inAclId);
            if (!res.allowed) return res;
        }

        // 2. Check Outbound Interface ACL (`ip access-group <id> out`)
        const outAclId = outPortObj?.aclOut || (outPortObj?.aclGroup?.direction === 'out' ? outPortObj.aclGroup.id : null);
        if (outAclId !== null && outAclId !== undefined) {
            const rulesForOut = allRules.filter(r => Number(r.id) === Number(outAclId));
            const res = this.evaluateAclRules(rulesForOut, protocol, srcIp, dstIp, dstPort, outAclId);
            if (!res.allowed) return res;
        }

        // 3. If no interface has an explicit `ip access-group`, evaluate firewall ACLs configured on the router
        //    (excluding NAT-only classification ACLs referenced by router.natRule.aclId unless explicitly bound)
        const hasAnyInterfaceBinding = Object.values(router.ports || {}).some(p => p.aclIn || p.aclOut || p.aclGroup);
        if (!hasAnyInterfaceBinding && allRules.length > 0) {
            const natAclId = router.natRule?.aclId ? Number(router.natRule.aclId) : null;
            const firewallRules = allRules.filter(r => natAclId === null || Number(r.id) !== natAclId);
            if (firewallRules.length > 0) {
                return this.evaluateAclRules(firewallRules, protocol, srcIp, dstIp, dstPort, firewallRules[0].id);
            }
        }

        return { allowed: true, implicitDeny: false, matchedRule: null };
    },

    /**
     * =========================================================================
     * PRIORITY 0.2: CISCO IOS NAT / PAT OVERLOAD ENGINE (WITH SESSION TRACKING)
     * =========================================================================
     * Translates Inside Local IP:Port -> Inside Global IP:Port when traversing from
     * an `ip nat inside` interface to an `ip nat outside` interface.
     * - Verifies NAT ACL if `router.natRule.aclId` is configured (`ip nat inside source list <acl> interface <if> overload`)
     * - Allocates unique PAT source ports per session (`srcPort` tracking)
     * - Supports reverse translation (`reverseRouterNat`) on the return path
     */
    applyRouterNat(router, inPort, outPort, currentSrcIp, dstIp, protocol, srcPort = null, dstPort = null) {
        const outObj = router.ports?.[outPort];
        const inObj = router.ports?.[inPort];
        if (!outObj || !outObj.ip) {
            return { translatedIp: currentSrcIp, translatedPort: srcPort, natApplied: false };
        }

        // Must enter via `inside` (or router with natEnabled & leaving `outside`) and exit via `outside`
        const isInsideToOutside =
            (inObj?.nat === 'inside' && outObj?.nat === 'outside') ||
            ((router.natEnabled || (router.staticNat && router.staticNat.length > 0)) && outObj?.nat === 'outside' && inPort !== outPort);

        if (!isInsideToOutside || currentSrcIp === outObj.ip) {
            return { translatedIp: currentSrcIp, translatedPort: srcPort, natApplied: false };
        }

        // Check if router.natRule restricts output interface
        if (router.natRule?.outInterface && router.natRule.outInterface !== outPort) {
            return { translatedIp: currentSrcIp, translatedPort: srcPort, natApplied: false };
        }

        router.natTranslations = router.natTranslations || [];

        // 1. Check 1-to-1 Static NAT first (`ip nat inside source static <local> <global>`)
        const staticEntry = (router.staticNat || []).find(s => s.insideLocal === currentSrcIp);
        let translatedIp = null;

        if (staticEntry) {
            translatedIp = staticEntry.insideGlobal;
        } else {
            // 2. Dynamic NAT / PAT Overload: Verify ACL if configured (`ip nat inside source list <aclId> ...`)
            if (router.natRule?.aclId) {
                const natAclRules = (router.acls || []).filter(r => Number(r.id) === Number(router.natRule.aclId));
                if (natAclRules.length > 0) {
                    const aclRes = this.evaluateAclRules(natAclRules, protocol, currentSrcIp, dstIp, dstPort, router.natRule.aclId);
                    if (!aclRes.allowed) {
                        return { translatedIp: currentSrcIp, translatedPort: srcPort, natApplied: false };
                    }
                }
            }
            if (!router.natEnabled && !router.natRule && outObj?.nat !== 'outside') {
                return { translatedIp: currentSrcIp, translatedPort: srcPort, natApplied: false };
            }
            translatedIp = outObj.ip;
        }

        // PAT Port Allocation & Session Tracking
        const normProto = (protocol || 'icmp').toLowerCase();
        const effectiveDstPort = dstPort !== null ? Number(dstPort) : (normProto === 'tcp' || normProto === 'http' ? 80 : (normProto === 'udp' ? 53 : 8));
        if (router._patPortSeq === undefined) router._patPortSeq = 1024;
        const origSrcPort = srcPort !== null ? Number(srcPort) : (++router._patPortSeq);

        const insideLocalStr = `${currentSrcIp}:${origSrcPort}`;
        const outsideGlobalStr = `${dstIp}:${effectiveDstPort}`;

        // Check if an active session already exists for (proto, insideLocal, outsideGlobal)
        let existing = router.natTranslations.find(
            t => t.proto === normProto && t.insideLocal === insideLocalStr && t.outsideGlobal === outsideGlobalStr
        );

        if (!existing) {
            // Ensure unique PAT port on Inside Global IP even when multiple Inside Local hosts use the same source port
            let patPort = origSrcPort;
            while (router.natTranslations.some(t => t.insideGlobal === `${translatedIp}:${patPort}` && t.insideLocal !== insideLocalStr)) {
                patPort++;
            }
            const insideGlobalStr = `${translatedIp}:${patPort}`;
            existing = {
                proto: normProto,
                insideGlobal: insideGlobalStr,
                insideLocal: insideLocalStr,
                outsideLocal: outsideGlobalStr,
                outsideGlobal: outsideGlobalStr,
                insideGlobalIp: translatedIp,
                insideLocalIp: currentSrcIp,
                patPort,
                origSrcPort,
                dstIp,
                dstPort: effectiveDstPort,
                inPort,
                outPort
            };
            router.natTranslations.unshift(existing);
            if (router.natTranslations.length > 50) router.natTranslations.pop();
        }

        return {
            translatedIp: existing.insideGlobalIp || translatedIp,
            translatedPort: existing.patPort || origSrcPort,
            natApplied: true,
            translated: true,
            translationEntry: existing
        };
    },

    /**
     * Reverse NAT lookup on Return Path:
     * When a reply packet from `srcIp` (Outside Global) arrives at `router` on an `outside` port
     * destined for `dstIp` (Inside Global), translates `dstIp` back to `insideLocalIp` if a matching session
     * or Static NAT entry exists!
     */
    reverseRouterNat(router, inPort, srcIp, dstIp, protocol, dstPort = null, explicitPatPort = null) {
        const inObj = router.ports?.[inPort];
        if (!inObj) return { translatedDstIp: dstIp, originalSrcIp: dstIp, natReversed: false, reversed: false };

        const targetPatPort = explicitPatPort !== null ? explicitPatPort : dstPort;
        const normProto = (protocol || 'icmp').toLowerCase();
        const transList = router.natTranslations || [];

        // 1. Match active session in natTranslations
        const session = transList.find(t => {
            const globalIp = t.insideGlobalIp || (t.insideGlobal || '').split(':')[0];
            const localIp = t.insideLocalIp || (t.insideLocal || '').split(':')[0];
            if (!globalIp || !localIp) return false;
            if (globalIp !== dstIp) return false;
            if (t.proto !== '---' && t.proto !== normProto) return false;
            if (targetPatPort !== null && t.patPort && Number(t.patPort) !== Number(targetPatPort)) return false;
            return true;
        });

        if (session) {
            const localIp = session.insideLocalIp || session.insideLocal.split(':')[0];
            return {
                translatedDstIp: localIp,
                originalSrcIp: localIp,
                natReversed: true,
                reversed: true,
                session
            };
        }

        // 2. Match 1-to-1 Static NAT
        const staticEntry = (router.staticNat || []).find(s => s.insideGlobal === dstIp);
        if (staticEntry && inObj.nat === 'outside') {
            return {
                translatedDstIp: staticEntry.insideLocal,
                originalSrcIp: staticEntry.insideLocal,
                natReversed: true,
                reversed: true,
                session: staticEntry
            };
        }

        return { translatedDstIp: dstIp, originalSrcIp: dstIp, natReversed: false, reversed: false };
    },

    /**
     * =========================================================================
     * LAYER 2 SWITCHING, STP LOOP PREVENTION, MAC LEARNING & 802.1Q TRUNKING
     * =========================================================================
     */
    computeStpBlockedPorts(devices, cables) {
        // Spanning Tree Protocol (STP IEEE 802.1D / PVST+) cycle breaker across Switch-to-Switch links
        // Respects:
        // 1. Bridge Priority (`sw.stpPriority`, default 32768) for Root Bridge election
        // 2. EtherChannel bundles (`channel-group` with compatible LACP/PAgP/On modes) treated as a single logical link
        const switches = devices.filter(d => d.type === 'switch');
        if (switches.length <= 1) return new Set();

        const getBridgePrio = (sw) => {
            if (!sw) return 32768;
            if (typeof sw.stpPriority === 'number') return sw.stpPriority;
            if (sw.stpPriority && typeof sw.stpPriority === 'object') {
                return Number(sw.stpPriority[1] ?? sw.stpPriority.default ?? 32768);
            }
            return 32768;
        };

        const swIds = new Set(switches.map(s => s.id));
        const swCables = cables.filter(c => swIds.has(c.from) && swIds.has(c.to));
        if (swCables.length < switches.length) return new Set();

        const parent = {};
        switches.forEach(s => { parent[s.id] = s.id; });
        const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));

        const blockedCableEndpoints = new Set();
        const activeLogicalBundles = new Set();

        for (const c of swCables) {
            const s1 = devices.find(d => d.id === c.from);
            const s2 = devices.find(d => d.id === c.to);
            const p1 = s1?.ports?.[c.fromPort];
            const p2 = s2?.ports?.[c.toPort];
            if (!this.isInterfaceUp(s1, c.fromPort) || !this.isInterfaceUp(s2, c.toPort)) continue;

            // Check if this cable is part of a valid EtherChannel bundle between s1 and s2
            const isBundled = this.isEtherChannelCompat(p1, p2);
            const pairKey = [s1.id, s2.id].sort().join('<->');
            const bundleKey = isBundled ? `${pairKey}:Po${p1.channelGroup.id}-${p2.channelGroup.id}` : null;

            if (bundleKey && activeLogicalBundles.has(bundleKey)) {
                // Additional member link of an already-forwarding EtherChannel bundle -> DO NOT block via STP!
                continue;
            }

            const r1 = find(c.from);
            const r2 = find(c.to);
            if (r1 === r2) {
                // Redundant L2 loop detected! Block the port on the switch with the higher Bridge Priority (or higher ID)
                const prio1 = getBridgePrio(s1);
                const prio2 = getBridgePrio(s2);
                if (prio1 > prio2) {
                    blockedCableEndpoints.add(`${c.from}:${c.fromPort}`);
                } else {
                    blockedCableEndpoints.add(`${c.to}:${c.toPort}`);
                }
            } else {
                parent[r2] = r1;
                if (bundleKey) activeLogicalBundles.add(bundleKey);
            }
        }
        return blockedCableEndpoints;
    },

    getSpanningTreeInfo(swDev, devices = [], cables = [], vlanId = 1) {
        const switches = devices.filter(d => d.type === 'switch');
        const getPrio = (sw) => {
            if (!sw) return 32768;
            if (typeof sw.stpPriority === 'number') return sw.stpPriority;
            if (sw.stpPriority && typeof sw.stpPriority === 'object') {
                return Number(sw.stpPriority[vlanId] ?? sw.stpPriority.default ?? 32768);
            }
            return 32768;
        };
        const getBridgeMac = (sw) => {
            if (!sw.bridgeMac) {
                const firstPort = Object.values(sw.ports || {})[0];
                sw.bridgeMac = firstPort?.mac || this.generateMac('switch');
            }
            return sw.bridgeMac;
        };

        const sortedSwitches = [...switches].sort((a, b) => {
            const pa = getPrio(a);
            const pb = getPrio(b);
            if (pa !== pb) return pa - pb;
            return String(a.id).localeCompare(String(b.id));
        });

        const rootSw = sortedSwitches[0] || swDev;
        const isRoot = rootSw.id === swDev.id;
        const blockedSet = this.computeStpBlockedPorts(devices, cables);

        const interfaces = [];
        for (const [pName, pObj] of Object.entries(swDev.ports || {})) {
            if (pObj.isSvi || !this.isInterfaceUp(swDev, pName)) continue;
            const isBlocked = blockedSet.has(`${swDev.id}:${pName}`);
            const role = isBlocked ? 'Altn' : (isRoot ? 'Desg' : (pObj.mode === 'trunk' ? 'Root' : 'Desg'));
            const status = isBlocked ? 'BLK' : 'FWD';
            const cost = pName.toLowerCase().startsWith('fa') ? 19 : (pName.toLowerCase().startsWith('po') ? 3 : 4);
            const type = pObj.portfast ? 'P2p Edge (PortFast)' : 'P2p';
            interfaces.push({
                port: pName,
                role,
                status,
                cost,
                prioNbr: '128.1',
                type
            });
        }

        return {
            vlanId,
            protocol: swDev.stpMode || 'ieee (PVST+)',
            isRoot,
            rootBridge: {
                priority: getPrio(rootSw) + Number(vlanId),
                basePriority: getPrio(rootSw),
                mac: getBridgeMac(rootSw),
                name: rootSw.name
            },
            bridgeId: {
                priority: getPrio(swDev) + Number(vlanId),
                basePriority: getPrio(swDev),
                mac: getBridgeMac(swDev)
            },
            interfaces
        };
    },

    recordSwitchMacLearning(l2Detailed, srcMac, devices) {
        if (!l2Detailed || !srcMac) return;
        for (const step of l2Detailed) {
            const dev = devices.find(d => d.id === step.devId);
            if (dev && dev.type === 'switch' && step.inPort) {
                if (!Array.isArray(dev.macTable)) {
                    dev.macTable = [];
                }
                const vlan = step.vlan || 1;
                const existing = dev.macTable.find(e => e.mac === srcMac && Number(e.vlan) === Number(vlan));
                if (existing) {
                    existing.port = step.inPort;
                    existing.updatedAt = Date.now();
                } else {
                    dev.macTable.push({
                        mac: srcMac,
                        vlan,
                        port: step.inPort,
                        type: 'DYNAMIC',
                        updatedAt: Date.now()
                    });
                }
            }
        }
    },

    recordArpEntry(dev, ip, mac, portName) {
        if (!dev || !ip || !mac) return;
        dev.arpCache = dev.arpCache || {};
        dev.arpCache[ip] = {
            ip,
            mac,
            interface: portName || Object.keys(dev.ports || {})[0] || 'Eth0',
            age: 0
        };
    },

    findL2PathDetailed(startDevId, targetDevId, devices, cables, requiredVlan = null, visited = new Set(), stpBlocked = null, srcMac = null) {
        if (startDevId === targetDevId) return [{ devId: startDevId, inPort: null, outPort: null, vlan: requiredVlan || 1 }];
        visited.add(startDevId);

        const blockedSet = stpBlocked || this.computeStpBlockedPorts(devices, cables);
        const currentDev = devices.find(d => d.id === startDevId);
        if (!currentDev) return null;

        const connectedCables = cables.filter(c => {
            if (c.from === startDevId) {
                return this.isInterfaceUp(currentDev, c.fromPort);
            } else if (c.to === startDevId) {
                return this.isInterfaceUp(currentDev, c.toPort);
            }
            return false;
        });

        for (const cable of connectedCables) {
            const myPhysPort = cable.from === startDevId ? cable.fromPort : cable.toPort;
            const nextDevId = cable.from === startDevId ? cable.to : cable.from;
            const nextPhysPort = cable.from === startDevId ? cable.toPort : cable.fromPort;
            const nextDev = devices.find(d => d.id === nextDevId);

            if (!nextDev || visited.has(nextDevId)) continue;

            // Check Switch Port Security on ingress switch port (even if already err-disabled so we record the diagnostic reason)
            if (nextDev.type === 'switch') {
                const nextSwPort = nextDev.ports?.[nextPhysPort];
                if (nextSwPort && (nextSwPort.errDisabled || nextSwPort.portSecurity?.enabled)) {
                    let effectiveSrcMac = srcMac;
                    if (!effectiveSrcMac && currentDev.type !== 'switch') {
                        const p = currentDev.ports?.[myPhysPort] || Object.values(currentDev.ports || {})[0];
                        if (p && !p.mac) p.mac = this.generateMac(currentDev.type);
                        effectiveSrcMac = p?.mac || null;
                    }
                    const secRes = this.checkSwitchPortSecurity(nextDev, nextPhysPort, effectiveSrcMac);
                    if (!secRes.allowed) {
                        this._lastPortSecurityViolation = secRes;
                        continue;
                    }
                }
            }

            if (!this.isInterfaceUp(nextDev, nextPhysPort)) continue;

            // Enforce STP Port Blocking on redundant Switch links
            if (blockedSet.has(`${startDevId}:${myPhysPort}`) || blockedSet.has(`${nextDevId}:${nextPhysPort}`)) {
                continue;
            }

            let frameVlan = requiredVlan;
            let taggedOnWire = false;

            if (currentDev.type === 'switch') {
                const swPort = currentDev.ports[myPhysPort];
                const isTrunk = swPort?.mode === 'trunk';
                const portVlan = swPort?.vlan || 1;

                if (isTrunk) {
                    frameVlan = frameVlan || 1;
                    if (swPort?.allowedVlans && swPort.allowedVlans !== 'all') {
                        const allowedList = String(swPort.allowedVlans).split(',').map(v => Number(v.trim()));
                        if (!allowedList.includes(Number(frameVlan))) continue;
                    }
                    const nativeVlan = swPort?.nativeVlan || 1;
                    taggedOnWire = Number(frameVlan) !== Number(nativeVlan);
                } else {
                    if (frameVlan !== null && Number(frameVlan) !== Number(portVlan)) continue;
                    frameVlan = portVlan;
                    taggedOnWire = false;
                }
            } else if (currentDev.type === 'router') {
                if (frameVlan !== null && frameVlan > 1) {
                    taggedOnWire = true;
                }
            }

            let nextVlan = frameVlan;
            if (nextDev.type === 'switch') {
                const nextSwPort = nextDev.ports[nextPhysPort];
                const nextIsTrunk = nextSwPort?.mode === 'trunk';
                const nextPortVlan = nextSwPort?.vlan || 1;

                if (nextIsTrunk) {
                    const nextNative = nextSwPort?.nativeVlan || 1;
                    nextVlan = taggedOnWire ? (frameVlan || 1) : nextNative;
                    if (requiredVlan !== null && Number(nextVlan) !== Number(requiredVlan)) continue;
                } else {
                    if (requiredVlan !== null && Number(nextPortVlan) !== Number(requiredVlan)) continue;
                    if (taggedOnWire && Number(frameVlan) !== Number(nextPortVlan)) continue;
                    if (!taggedOnWire && currentDev.type === 'switch' && Number(frameVlan) !== Number(nextPortVlan)) continue;
                    nextVlan = nextPortVlan;
                }
            } else if (nextDev.type === 'router') {
                if (nextDevId === targetDevId && requiredVlan !== null) {
                    if (Number(nextVlan) !== Number(requiredVlan)) continue;
                    const hasMatchingSubIf = Object.entries(nextDev.ports).some(([pName, pObj]) => {
                        return this.getBasePortName(pName) === nextPhysPort && this.isInterfaceUp(nextDev, pName) && (Number(pObj.vlan) === Number(nextVlan) || (!pObj.vlan && Number(nextVlan) === 1));
                    });
                    if (!hasMatchingSubIf && taggedOnWire) continue;
                }
            } else {
                // End Host (PC / Server / Cloud) cannot receive 802.1Q Tagged frames
                if (taggedOnWire) continue;
                if (requiredVlan !== null && currentDev.type === 'switch') {
                    const outSwPort = currentDev.ports[myPhysPort];
                    if (outSwPort?.mode !== 'trunk' && Number(outSwPort?.vlan || 1) !== Number(requiredVlan)) continue;
                }
            }

            if (nextDevId === targetDevId) {
                return [
                    { devId: startDevId, outPort: myPhysPort, vlan: frameVlan || 1, tagged: taggedOnWire },
                    { devId: nextDevId, inPort: nextPhysPort, vlan: nextVlan || 1, tagged: taggedOnWire }
                ];
            }

            if (nextDev.type === 'switch') {
                let effectiveSrcMac = srcMac;
                if (!effectiveSrcMac && currentDev.type !== 'switch') {
                    const p = currentDev.ports?.[myPhysPort] || Object.values(currentDev.ports || {})[0];
                    effectiveSrcMac = p?.mac || null;
                }
                const subPath = this.findL2PathDetailed(nextDevId, targetDevId, devices, cables, nextVlan, new Set(visited), blockedSet, effectiveSrcMac);
                if (subPath) {
                    subPath[0].inPort = nextPhysPort;
                    return [
                        { devId: startDevId, outPort: myPhysPort, vlan: frameVlan || 1, tagged: taggedOnWire },
                        ...subPath
                    ];
                }
            }
        }

        return null;
    },

    findPhysicalPath(startDevId, targetDevId, devices, cables, requiredVlan = null) {
        const detailed = this.findL2PathDetailed(startDevId, targetDevId, devices, cables, requiredVlan);
        return detailed ? detailed.map(h => h.devId) : null;
    },

    findDeviceByIpOnL2(startDev, startPortName, targetIp, devices, cables) {
        const startPortObj = startDev.ports[startPortName];
        let startVlan = startPortObj?.vlan ? Number(startPortObj.vlan) : null;

        for (const dev of devices) {
            for (const [pName, pObj] of Object.entries(dev.ports)) {
                if (pObj.ip === targetIp && this.isInterfaceUp(dev, pName)) {
                    const targetVlan = pObj.vlan ? Number(pObj.vlan) : startVlan;
                    const detailed = this.findL2PathDetailed(startDev.id, dev.id, devices, cables, targetVlan);
                    if (detailed) {
                        const lastStep = detailed[detailed.length - 1];
                        const expectedPhysPort = this.getBasePortName(pName);
                        if (!lastStep.inPort || lastStep.inPort === expectedPhysPort || dev.type === 'switch' || pObj.isSvi) {
                            return {
                                device: dev,
                                port: pName,
                                path: detailed.map(d => d.devId),
                                detailedPath: detailed
                            };
                        }
                    }
                }
            }
        }
        return null;
    },

    /**
     * =========================================================================
     * PRIORITY 0.3: CISCO IOS OSPF ENGINE (STRICT AREA CHECK & INTERFACE COST)
     * =========================================================================
     */
    getInterfaceOspfCost(portName, portObj) {
        if (portObj && typeof portObj.ospfCost === 'number' && portObj.ospfCost > 0) {
            return portObj.ospfCost;
        }
        const lower = (portName || '').toLowerCase();
        if (lower.startsWith('fa')) return 10; // FastEthernet 100 Mbps -> Cost 10 (Ref BW 1000 Mbps)
        if (lower.startsWith('se')) return 64; // Serial -> Cost 64
        return 1; // GigabitEthernet -> Cost 1
    },

    getOspfInterfaceArea(rtr, pObj) {
        if (!pObj || !pObj.ip || !rtr.ospf || !Array.isArray(rtr.ospf.networks)) return null;
        for (const netStmt of rtr.ospf.networks) {
            if (!this.isValidIPv4(netStmt.network)) continue;
            if (this.matchesWildcard(pObj.ip, netStmt.network, netStmt.wildcard || '0.0.0.255')) {
                return Number(netStmt.area ?? 0);
            }
        }
        return null;
    },

    getRouterId(router) {
        if (router.ospf?.routerId && this.isValidIPv4(router.ospf.routerId)) {
            return router.ospf.routerId;
        }
        const activeIps = Object.entries(router.ports || {})
            .filter(([pName, pObj]) => pObj.ip && this.isInterfaceUp(router, pName))
            .map(([, pObj]) => pObj.ip)
            .sort((a, b) => this.ipToInt(b) - this.ipToInt(a));
        return activeIps[0] || '0.0.0.0';
    },

    getOspfNeighbors(router, devices, cables) {
        if (!this.isL3Device(router) || !router.ospf || !Array.isArray(router.ospf.networks) || router.ospf.networks.length === 0) {
            return [];
        }
        const neighbors = [];
        const myRouterId = this.getRouterId(router);

        for (const [myPort, myObj] of Object.entries(router.ports)) {
            if (!this.isInterfaceUp(router, myPort) || !myObj.ip) continue;
            const myArea = this.getOspfInterfaceArea(router, myObj);
            if (myArea === null) continue;
            const myMask = myObj.mask || '255.255.255.0';

            for (const other of devices) {
                if (!this.isL3Device(other) || other.id === router.id) continue;
                for (const [otherPort, otherObj] of Object.entries(other.ports)) {
                    if (!this.isInterfaceUp(other, otherPort) || !otherObj.ip) continue;
                    const otherArea = this.getOspfInterfaceArea(other, otherObj);
                    if (otherArea === null) continue;

                    // Must be in the same IP subnet AND have L2 connectivity
                    const otherMask = otherObj.mask || '255.255.255.0';
                    if (myMask !== otherMask || !this.isSameSubnet(myObj.ip, otherObj.ip, myMask)) continue;

                    // Strict OSPF Area ID verification!
                    if (Number(myArea) !== Number(otherArea)) {
                        continue;
                    }

                    const l2 = this.findL2PathDetailed(router.id, other.id, devices, cables, myObj.vlan || null);
                    if (l2) {
                        const otherRouterId = this.getRouterId(other);
                        const isOtherDR = this.ipToInt(otherRouterId) >= this.ipToInt(myRouterId);
                        neighbors.push({
                            neighborId: otherRouterId,
                            pri: 1,
                            state: isOtherDR ? 'FULL/DR' : 'FULL/BDR',
                            address: otherObj.ip,
                            interface: myPort,
                            area: myArea,
                            cost: this.getInterfaceOspfCost(myPort, myObj),
                            hostname: other.name
                        });
                    }
                }
            }
        }
        return neighbors;
    },

    computeOspfRoutes(router, devices, cables) {
        if (!this.isL3Device(router) || !router.ospf || !Array.isArray(router.ospf.networks) || router.ospf.networks.length === 0) {
            return [];
        }

        const learnedRoutes = [];
        const bestCostByRtr = { [router.id]: 0 };
        const queue = [];

        // Seed Dijkstra / BFS with verified FULL neighbors (which strictly match Area ID, Subnet, and Interface Up)
        for (const [myPortName, myPortObj] of Object.entries(router.ports)) {
            if (!this.isInterfaceUp(router, myPortName) || !myPortObj.ip) continue;
            const myArea = this.getOspfInterfaceArea(router, myPortObj);
            if (myArea === null) continue;
            const myMask = myPortObj.mask || '255.255.255.0';
            const linkCost = this.getInterfaceOspfCost(myPortName, myPortObj);

            for (const other of devices) {
                if (!this.isL3Device(other) || other.id === router.id) continue;
                for (const [otherPort, otherObj] of Object.entries(other.ports)) {
                    if (!this.isInterfaceUp(other, otherPort) || !otherObj.ip) continue;
                    const otherArea = this.getOspfInterfaceArea(other, otherObj);
                    if (otherArea === null || Number(otherArea) !== Number(myArea)) continue;
                    if ((otherObj.mask || '255.255.255.0') !== myMask) continue;

                    if (this.isSameSubnet(myPortObj.ip, otherObj.ip, myMask)) {
                        const l2 = this.findL2PathDetailed(router.id, other.id, devices, cables, myPortObj.vlan || null);
                        if (l2) {
                            bestCostByRtr[other.id] = linkCost;
                            queue.push({
                                rtr: other,
                                firstHopIp: otherObj.ip,
                                outPort: myPortName,
                                cost: linkCost,
                                area: myArea
                            });
                        }
                    }
                }
            }
        }

        while (queue.length > 0) {
            queue.sort((a, b) => a.cost - b.cost);
            const curr = queue.shift();

            for (const [pName, pObj] of Object.entries(curr.rtr.ports)) {
                if (!this.isInterfaceUp(curr.rtr, pName) || !pObj.ip) continue;
                const area = this.getOspfInterfaceArea(curr.rtr, pObj);
                if (area === null) continue;

                const mask = pObj.mask || '255.255.255.0';
                const netAddr = this.getNetworkAddress(pObj.ip, mask);
                const subnetCost = curr.cost + this.getInterfaceOspfCost(pName, pObj);

                const isDirectOnMe = Object.entries(router.ports).some(([mp, mo]) =>
                    this.isInterfaceUp(router, mp) && mo.ip && this.isSameSubnet(mo.ip, pObj.ip, mo.mask || '255.255.255.0')
                );

                if (!isDirectOnMe) {
                    const existingRoute = learnedRoutes.find(r => r.network === netAddr && r.mask === mask);
                    if (!existingRoute) {
                        learnedRoutes.push({
                            type: 'ospf',
                            network: netAddr,
                            mask,
                            nextHop: curr.firstHopIp,
                            outPort: curr.outPort,
                            metric: subnetCost,
                            area
                        });
                    } else if (subnetCost < existingRoute.metric) {
                        existingRoute.metric = subnetCost;
                        existingRoute.nextHop = curr.firstHopIp;
                        existingRoute.outPort = curr.outPort;
                        existingRoute.area = area;
                    }
                }

                for (const nextRtr of devices) {
                    if (!this.isL3Device(nextRtr) || nextRtr.id === curr.rtr.id) continue;
                    for (const [npName, npObj] of Object.entries(nextRtr.ports)) {
                        if (!this.isInterfaceUp(nextRtr, npName) || !npObj.ip) continue;
                        const nextArea = this.getOspfInterfaceArea(nextRtr, npObj);
                        if (nextArea === null || Number(nextArea) !== Number(area)) continue;
                        if ((npObj.mask || '255.255.255.0') !== mask) continue;

                        if (this.isSameSubnet(pObj.ip, npObj.ip, mask)) {
                            const l2 = this.findL2PathDetailed(curr.rtr.id, nextRtr.id, devices, cables, pObj.vlan || null);
                            if (l2) {
                                const newCost = curr.cost + this.getInterfaceOspfCost(pName, pObj);
                                if (bestCostByRtr[nextRtr.id] === undefined || newCost < bestCostByRtr[nextRtr.id]) {
                                    bestCostByRtr[nextRtr.id] = newCost;
                                    queue.push({
                                        rtr: nextRtr,
                                        firstHopIp: curr.firstHopIp,
                                        outPort: curr.outPort,
                                        cost: newCost,
                                        area: nextArea
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        return learnedRoutes;
    },

    lookupRoute(router, dstIp, devices = [], cables = []) {
        return this.lookupRouterRoute(router, dstIp, devices, cables);
    },

    lookupRouterRoute(router, dstIp, devices = [], cables = []) {
        let bestMatch = null;
        let bestPrefixLen = -1;
        let bestAd = 999;

        // 1. Directly Connected Interfaces (AD = 0)
        for (const [pName, pObj] of Object.entries(router.ports)) {
            if (pObj.ip && this.isInterfaceUp(router, pName)) {
                const mask = pObj.mask || '255.255.255.0';
                if (this.isSameSubnet(pObj.ip, dstIp, mask)) {
                    const prefixLen = this.maskToCidr(mask);
                    if (prefixLen > bestPrefixLen || (prefixLen === bestPrefixLen && 0 < bestAd)) {
                        bestPrefixLen = prefixLen;
                        bestAd = 0;
                        bestMatch = { type: 'connected', ad: 0, outPort: pName, mask };
                    }
                }
            }
        }

        // 2. Static Routes (AD = 1) - Must have a reachable Next-Hop on an UP interface!
        const staticRoutes = router.routes || [];
        for (const r of staticRoutes) {
            if (this.isValidIPv4(r.network) && this.isValidMask(r.mask) && this.isValidIPv4(r.nextHop)) {
                const hasUpEgressForNextHop = Object.entries(router.ports).some(([pName, pObj]) =>
                    pObj.ip && this.isInterfaceUp(router, pName) && this.isSameSubnet(pObj.ip, r.nextHop, pObj.mask || '255.255.255.0')
                );
                if (!hasUpEgressForNextHop) continue;

                if (this.isSameSubnet(r.network, dstIp, r.mask)) {
                    const prefixLen = this.maskToCidr(r.mask);
                    if (prefixLen > bestPrefixLen || (prefixLen === bestPrefixLen && 1 < bestAd)) {
                        bestPrefixLen = prefixLen;
                        bestAd = 1;
                        bestMatch = { type: 'static', ad: 1, nextHopIp: r.nextHop, network: r.network, mask: r.mask };
                    }
                }
            }
        }

        // 3. OSPF Dynamic Routes (AD = 110)
        const ospfRoutes = this.computeOspfRoutes(router, devices, cables);
        for (const r of ospfRoutes) {
            if (this.isSameSubnet(r.network, dstIp, r.mask)) {
                const prefixLen = this.maskToCidr(r.mask);
                if (prefixLen > bestPrefixLen || (prefixLen === bestPrefixLen && 110 < bestAd)) {
                    bestPrefixLen = prefixLen;
                    bestAd = 110;
                    bestMatch = { type: 'ospf', ad: 110, nextHopIp: r.nextHop, outPort: r.outPort, network: r.network, mask: r.mask, metric: r.metric };
                }
            }
        }

        return bestMatch;
    },

    /**
     * =========================================================================
     * LAYER 3 + LAYER 2 PACKET FORWARDING & STATEFUL RETURN PATH VERIFICATION
     * =========================================================================
     */
    tracePath(srcDev, srcPortName, srcIp, srcMask, dstDev, dstPortName, dstIp, devices, cables, l4ProtocolLabel = 'ICMP Echo Request (Type 8)', rawProto = 'icmp', l4Meta = {}) {
        const hopsIds = [srcDev.id];
        const routerHopIps = [];
        const osiSteps = [];
        const natTranslatedHops = [];
        let ttl = 64;
        let activeSrcIp = srcIp;
        let activeDstIp = dstIp;
        let activeSrcPort = l4Meta.srcPort ?? null;
        let activeDstPort = l4Meta.dstPort ?? (rawProto === 'tcp' ? 80 : (rawProto === 'udp' ? 53 : null));

        const getMac = (dev, portName) => {
            const p = dev.ports[portName] || Object.values(dev.ports)[0];
            if (p && !p.mac) p.mac = this.generateMac(dev.type);
            return p?.mac || '001B.5400.0101';
        };

        const appendL2SegmentWithOsi = (l2Detailed, l3SrcMac, l3DstMac, protocolNote, pktSrcIp = activeSrcIp, pktDstIp = activeDstIp) => {
            if (!l2Detailed || l2Detailed.length === 0) return;
            this.recordSwitchMacLearning(l2Detailed, l3SrcMac, devices);

            for (let i = 0; i < l2Detailed.length; i++) {
                const step = l2Detailed[i];
                const dev = devices.find(d => d.id === step.devId);
                if (!dev) continue;

                if (hopsIds[hopsIds.length - 1] !== dev.id) {
                    hopsIds.push(dev.id);
                }

                const lastOsi = osiSteps[osiSteps.length - 1];
                if (lastOsi && lastOsi.deviceId === dev.id && i === 0) {
                    lastOsi.outPort = step.outPort || lastOsi.outPort;
                    lastOsi.outSrcMac = l3SrcMac;
                    lastOsi.outDstMac = l3DstMac;
                    lastOsi.srcIp = pktSrcIp;
                    lastOsi.dstIp = pktDstIp;
                    lastOsi.vlan = step.vlan || 1;
                    lastOsi.tagged = !!step.tagged;
                    lastOsi.note = protocolNote;
                    continue;
                }

                osiSteps.push({
                    hopNumber: osiSteps.length + 1,
                    deviceId: dev.id,
                    deviceName: dev.name,
                    deviceType: dev.type,
                    inPort: step.inPort || (i === 0 ? srcPortName : 'Local'),
                    outPort: step.outPort || (i === l2Detailed.length - 1 ? dstPortName : 'Forwarded'),
                    vlan: step.vlan || 1,
                    tagged: !!step.tagged,
                    inSrcMac: l3SrcMac,
                    inDstMac: l3DstMac,
                    outSrcMac: l3SrcMac,
                    outDstMac: l3DstMac,
                    srcIp: pktSrcIp,
                    dstIp: pktDstIp,
                    ttl,
                    icmpType: l4ProtocolLabel,
                    note: dev.type === 'switch' && !dev.ipRouting
                        ? `Layer 2 Switch CAM Lookup (VLAN ${step.vlan || 1}${step.tagged ? ' • 802.1Q Tagged' : ' • Untagged'})`
                        : protocolNote
                });
            }
        };

        let currentRouter = null;
        let currentRouterIngressPort = null;
        this._lastPortSecurityViolation = null;

        if (!this.isL3Device(srcDev)) {
            const dstOwnsActiveDstIp = Object.values(dstDev.ports || {}).some(p => p.ip === activeDstIp);
            if (this.isSameSubnet(activeSrcIp, activeDstIp, srcMask) && dstOwnsActiveDstIp) {
                const l2Detailed = this.findL2PathDetailed(srcDev.id, dstDev.id, devices, cables, null);
                if (!l2Detailed) {
                    const psReason = this._lastPortSecurityViolation?.reason;
                    return {
                        success: false,
                        portSecurityBlocked: !!this._lastPortSecurityViolation,
                        errDisabled: !!this._lastPortSecurityViolation?.errDisabled,
                        reason: psReason || `Request timed out: ไม่พบสายสัญญาณ L2 หรืออยู่คนละ VLAN ไปยัง ${dstDev.name}`,
                        hops: hopsIds.map(id => devices.find(d => d.id === id)),
                        routerHopIps,
                        osiSteps,
                        finalSrcIp: activeSrcIp,
                        natTranslatedHops
                    };
                }
                const sMac = getMac(srcDev, srcPortName);
                const dMac = getMac(dstDev, dstPortName);
                this.recordArpEntry(srcDev, activeDstIp, dMac, srcPortName);
                this.recordArpEntry(dstDev, activeSrcIp, sMac, dstPortName);
                appendL2SegmentWithOsi(l2Detailed, sMac, dMac, 'ARP Broadcast (FFFF.FFFF.FFFF) ➔ Direct Local Subnet Delivery');
                return {
                    success: true,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routedVia: null,
                    routerHopIps,
                    osiSteps,
                    finalSrcIp: activeSrcIp,
                    natTranslatedHops
                };
            }

            // If activeDstIp is in the same subnet as srcDev (e.g. replying to a NAT Router's Inside Global IP on the WAN link),
            // ARP resolves activeDstIp directly on L2 without needing a Default Gateway!
            const nextHopIpToResolve = this.isSameSubnet(activeSrcIp, activeDstIp, srcMask) ? activeDstIp : srcDev.gateway;

            if (!nextHopIpToResolve) {
                return {
                    success: false,
                    reason: `${srcDev.name}: ปลายทางอยู่คนละวงแลน แต่ยังไม่ได้ตั้งค่า Default Gateway`,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routerHopIps,
                    osiSteps,
                    finalSrcIp: activeSrcIp,
                    natTranslatedHops
                };
            }

            const gwTarget = this.findDeviceByIpOnL2(srcDev, srcPortName, nextHopIpToResolve, devices, cables);
            if (!gwTarget || !this.isL3Device(gwTarget.device)) {
                const psReason = this._lastPortSecurityViolation?.reason;
                return {
                    success: false,
                    portSecurityBlocked: !!this._lastPortSecurityViolation,
                    errDisabled: !!this._lastPortSecurityViolation?.errDisabled,
                    reason: psReason || `${srcDev.name}: ไม่สามารถติดต่อ Default Gateway (${srcDev.gateway}) ได้`,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routerHopIps,
                    osiSteps,
                    finalSrcIp: activeSrcIp,
                    natTranslatedHops
                };
            }

            const sMac = getMac(srcDev, srcPortName);
            const gwMac = getMac(gwTarget.device, gwTarget.port);
            this.recordArpEntry(srcDev, srcDev.gateway, gwMac, srcPortName);
            this.recordArpEntry(gwTarget.device, activeSrcIp, sMac, gwTarget.port);
            appendL2SegmentWithOsi(gwTarget.detailedPath, sMac, gwMac, `ARP Resolved Gateway (${gwTarget.device.name} - ${srcDev.gateway})`);
            currentRouter = gwTarget.device;
            currentRouterIngressPort = gwTarget.port;
            routerHopIps.push({ ip: srcDev.gateway, name: gwTarget.device.name });
        } else {
            currentRouter = srcDev;
            currentRouterIngressPort = srcPortName;
            osiSteps.push({
                hopNumber: 1,
                deviceId: srcDev.id,
                deviceName: srcDev.name,
                deviceType: srcDev.type,
                inPort: 'Local',
                outPort: srcPortName,
                vlan: srcDev.ports[srcPortName]?.vlan || 1,
                tagged: false,
                inSrcMac: getMac(srcDev, srcPortName),
                inDstMac: '0000.0000.0000',
                outSrcMac: getMac(srcDev, srcPortName),
                outDstMac: '0000.0000.0000',
                srcIp: activeSrcIp,
                dstIp: activeDstIp,
                ttl,
                icmpType: l4ProtocolLabel,
                note: `Originating L3 Routing Lookup on ${srcDev.name}`
            });
        }

        const visitedRouters = new Set();
        const routerNames = [];

        while (currentRouter) {
            if (visitedRouters.has(currentRouter.id)) {
                return {
                    success: false,
                    reason: `TTL Expired in transit: เกิด Routing Loop ที่ ${currentRouter.name}`,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routerHopIps,
                    osiSteps,
                    finalSrcIp: activeSrcIp,
                    natTranslatedHops
                };
            }
            visitedRouters.add(currentRouter.id);
            routerNames.push(currentRouter.name);

            // Check Reverse NAT on Ingress if this packet is returning to an Inside Global IP on this router!
            if (l4Meta.isReturnPath) {
                const revNat = this.reverseRouterNat(currentRouter, currentRouterIngressPort, activeSrcIp, activeDstIp, rawProto, activeDstPort);
                if (revNat.natReversed) {
                    activeDstIp = revNat.translatedDstIp;
                }
            }

            // Determine Route for activeDstIp
            const isDestinedToCurrentRouter = Object.entries(currentRouter.ports).some(
                ([pName, pObj]) => pObj.ip === activeDstIp && this.isInterfaceUp(currentRouter, pName)
            );

            if (currentRouter.id === dstDev.id || isDestinedToCurrentRouter) {
                const aclCheck = this.evaluateRouterAcl(currentRouter, rawProto, activeSrcIp, activeDstIp, currentRouterIngressPort, null, activeDstPort);
                if (!aclCheck.allowed) {
                    const r = aclCheck.matchedRule;
                    const aclMsg = r.implicit
                        ? `🛡️ ถูกบล็อกโดย Implicit Deny (ACL ${r.id}) บน ${currentRouter.name}`
                        : `🛡️ ถูกบล็อกโดย Firewall ACL ${r.id} บน ${currentRouter.name}: [deny ${r.protocol} ${r.src} ➔ ${r.dst || 'any'}]`;
                    return {
                        success: false,
                        aclBlocked: true,
                        implicitDeny: !!aclCheck.implicitDeny,
                        reason: aclMsg,
                        hops: hopsIds.map(id => devices.find(d => d.id === id)),
                        routerHopIps,
                        osiSteps,
                        finalSrcIp: activeSrcIp,
                        natTranslatedHops
                    };
                }
                return {
                    success: true,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routedVia: routerNames,
                    routerHopIps,
                    osiSteps,
                    finalSrcIp: activeSrcIp,
                    natTranslatedHops
                };
            }

            ttl = Math.max(1, ttl - 1);
            const route = this.lookupRouterRoute(currentRouter, activeDstIp, devices, cables);
            if (!route) {
                return {
                    success: false,
                    reason: `Destination Host Unreachable: ${currentRouter.name} ไม่มี Route ไปยังเครือข่ายของ ${activeDstIp}`,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routerHopIps,
                    osiSteps,
                    finalSrcIp: activeSrcIp,
                    natTranslatedHops
                };
            }

            // Determine egress port for ACL & NAT evaluation
            let egressPort = route.outPort || null;
            if (!egressPort && route.nextHopIp) {
                for (const [pName, pObj] of Object.entries(currentRouter.ports)) {
                    if (pObj.ip && this.isInterfaceUp(currentRouter, pName) && this.isSameSubnet(pObj.ip, route.nextHopIp, pObj.mask || '255.255.255.0')) {
                        egressPort = pName;
                        break;
                    }
                }
            }

            // Evaluate ACL (Inbound on currentRouterIngressPort, Outbound on egressPort, or Router-level ACL)
            const aclCheck = this.evaluateRouterAcl(currentRouter, rawProto, activeSrcIp, activeDstIp, currentRouterIngressPort, egressPort, activeDstPort);
            if (!aclCheck.allowed) {
                const r = aclCheck.matchedRule;
                const aclMsg = r.implicit
                    ? `🛡️ ถูกบล็อกโดย Implicit Deny (ACL ${r.id}) บน ${currentRouter.name}`
                    : `🛡️ ถูกบล็อกโดย Firewall ACL ${r.id} บน ${currentRouter.name}: [deny ${r.protocol} ${r.src} ➔ ${r.dst || 'any'}]`;
                const lastOsi = osiSteps[osiSteps.length - 1];
                if (lastOsi && lastOsi.deviceId === currentRouter.id) {
                    lastOsi.note = aclMsg;
                }
                return {
                    success: false,
                    aclBlocked: true,
                    implicitDeny: !!aclCheck.implicitDeny,
                    reason: aclMsg,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routerHopIps,
                    osiSteps,
                    finalSrcIp: activeSrcIp,
                    natTranslatedHops
                };
            }

            if (route.type === 'connected') {
                const outPortObj = currentRouter.ports[route.outPort];
                const outVlan = outPortObj?.vlan ? Number(outPortObj.vlan) : null;
                const l2ToDst = this.findL2PathDetailed(currentRouter.id, dstDev.id, devices, cables, outVlan);
                if (!l2ToDst) {
                    return {
                        success: false,
                        reason: `Request timed out: ${currentRouter.name} (${route.outPort}) ทราบวงแลนปลายทาง แต่สายสัญญาณหรือ VLAN ไปยัง ${dstDev.name} ไม่ตรงกัน`,
                        hops: hopsIds.map(id => devices.find(d => d.id === id)),
                        routerHopIps,
                        osiSteps,
                        finalSrcIp: activeSrcIp,
                        natTranslatedHops
                    };
                }

                // Apply NAT if leaving an outside interface on the forward path
                let natNote = '';
                if (!l4Meta.isReturnPath) {
                    const natRes = this.applyRouterNat(currentRouter, currentRouterIngressPort, route.outPort, activeSrcIp, activeDstIp, rawProto, activeSrcPort, activeDstPort);
                    if (natRes.natApplied) {
                        natNote = ` • NAT (${activeSrcIp}:${activeSrcPort || ''} ➔ ${natRes.translatedIp}:${natRes.translatedPort || ''})`;
                        natTranslatedHops.push({
                            routerId: currentRouter.id,
                            routerName: currentRouter.name,
                            insideLocalIp: activeSrcIp,
                            insideGlobalIp: natRes.translatedIp,
                            patPort: natRes.translatedPort
                        });
                        activeSrcIp = natRes.translatedIp;
                        activeSrcPort = natRes.translatedPort;
                    }
                }

                const rtrOutMac = getMac(currentRouter, route.outPort);
                const finalDstMac = getMac(dstDev, dstPortName);
                this.recordArpEntry(currentRouter, activeDstIp, finalDstMac, route.outPort);
                this.recordArpEntry(dstDev, outPortObj.ip, rtrOutMac, dstPortName);
                appendL2SegmentWithOsi(
                    l2ToDst,
                    rtrOutMac,
                    finalDstMac,
                    `L3 Routed via ${route.outPort} (TTL=${ttl}${natNote})`,
                    activeSrcIp,
                    activeDstIp
                );
                return {
                    success: true,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routedVia: routerNames,
                    routerHopIps,
                    osiSteps,
                    finalSrcIp: activeSrcIp,
                    finalSrcPort: activeSrcPort,
                    natTranslatedHops
                };
            }

            if (route.type === 'static' || route.type === 'ospf') {
                const nextHopTarget = this.findDeviceByIpOnL2(currentRouter, egressPort || 'Gig0/0', route.nextHopIp, devices, cables);
                if (!nextHopTarget) {
                    return {
                        success: false,
                        reason: `Request timed out: ${currentRouter.name} ไม่สามารถติดต่อ Next-Hop (${route.nextHopIp}) ได้`,
                        hops: hopsIds.map(id => devices.find(d => d.id === id)),
                        routerHopIps,
                        osiSteps,
                        finalSrcIp: activeSrcIp,
                        natTranslatedHops
                    };
                }

                let natNote = '';
                if (!l4Meta.isReturnPath) {
                    const natRes = this.applyRouterNat(currentRouter, currentRouterIngressPort, egressPort || 'Gig0/0', activeSrcIp, activeDstIp, rawProto, activeSrcPort, activeDstPort);
                    if (natRes.natApplied) {
                        natNote = ` • NAT (${activeSrcIp}:${activeSrcPort || ''} ➔ ${natRes.translatedIp}:${natRes.translatedPort || ''})`;
                        natTranslatedHops.push({
                            routerId: currentRouter.id,
                            routerName: currentRouter.name,
                            insideLocalIp: activeSrcIp,
                            insideGlobalIp: natRes.translatedIp,
                            patPort: natRes.translatedPort
                        });
                        activeSrcIp = natRes.translatedIp;
                        activeSrcPort = natRes.translatedPort;
                    }
                }

                const rtrOutMac = getMac(currentRouter, egressPort || 'Gig0/0');
                const nhMac = getMac(nextHopTarget.device, nextHopTarget.port);
                const protoLabel = route.type === 'ospf' ? `OSPF Route [110/${route.metric}]` : `Static Route [1/0]`;
                appendL2SegmentWithOsi(
                    nextHopTarget.detailedPath,
                    rtrOutMac,
                    nhMac,
                    `L3 Forwarded via ${protoLabel} ➔ Next-Hop ${route.nextHopIp} (TTL=${ttl}${natNote})`,
                    activeSrcIp,
                    activeDstIp
                );
                routerHopIps.push({ ip: route.nextHopIp, name: nextHopTarget.device.name });

                if (nextHopTarget.device.id === dstDev.id) {
                    return {
                        success: true,
                        hops: hopsIds.map(id => devices.find(d => d.id === id)),
                        routedVia: [...routerNames, nextHopTarget.device.name],
                        routerHopIps,
                        osiSteps,
                        finalSrcIp: activeSrcIp,
                        finalSrcPort: activeSrcPort,
                        natTranslatedHops
                    };
                }
                currentRouter = nextHopTarget.device;
                currentRouterIngressPort = nextHopTarget.port;
            }
        }

        return {
            success: false,
            reason: 'ไม่พบเส้นทางไปยังปลายทาง',
            hops: hopsIds.map(id => devices.find(d => d.id === id)),
            routerHopIps,
            osiSteps,
            finalSrcIp: activeSrcIp,
            natTranslatedHops
        };
    },

    simulatePing(srcDev, dstDev, devices, cables) {
        return this.simulateL4Packet(srcDev, dstDev, devices, cables, 'icmp');
    },

    simulateHttp(srcDev, dstDev, devices, cables) {
        return this.simulateL4Packet(srcDev, dstDev, devices, cables, 'tcp', { dstPort: 80 });
    },

    simulateUdp(srcDev, dstDev, devices, cables, dstPort = 53) {
        return this.simulateL4Packet(srcDev, dstDev, devices, cables, 'udp', { dstPort });
    },

    simulateL4Packet(srcDev, dstDev, devices, cables, rawProto = 'icmp', options = {}) {
        if (!srcDev || !dstDev) {
            return { success: false, reason: 'ระบุอุปกรณ์ไม่ถูกต้อง', hops: [], osiSteps: [] };
        }
        if (srcDev.id === dstDev.id) {
            return { success: true, reason: 'Loopback 127.0.0.1 สำเร็จ', hops: [srcDev], osiSteps: [] };
        }

        const srcIpEntry = Object.entries(srcDev.ports).find(([p, obj]) => obj.ip && this.isInterfaceUp(srcDev, p));
        if (!srcIpEntry) {
            return { success: false, reason: `${srcDev.name}: พอร์ตยังไม่ได้เปิด (Shutdown) หรือยังไม่ได้ตั้งค่า IP Address`, hops: [srcDev], osiSteps: [] };
        }
        const [srcPort, srcPortObj] = srcIpEntry;
        const srcIp = srcPortObj.ip;
        const srcMask = srcPortObj.mask || '255.255.255.0';

        const dstIpEntry = Object.entries(dstDev.ports).find(([p, obj]) => obj.ip);
        if (!dstIpEntry) {
            return { success: false, reason: `${dstDev.name}: ยังไม่ได้ตั้งค่า IP Address`, hops: [srcDev], osiSteps: [] };
        }
        const [dstPort, dstPortObj] = dstIpEntry;
        if (!this.isInterfaceUp(dstDev, dstPort)) {
            return { success: false, reason: `${dstDev.name} (${dstPort}): พอร์ตปลายทางปิดอยู่ (Administratively Down)`, hops: [srcDev], osiSteps: [] };
        }
        const dstIp = dstPortObj.ip;
        const dstMask = dstPortObj.mask || '255.255.255.0';

        const l4SrcPort = options.srcPort ?? (1024 + Math.floor(Math.random() * 4000));
        const l4DstPort = options.dstPort ?? (rawProto === 'tcp' ? 80 : (rawProto === 'udp' ? 53 : 8));

        const reqLabel = rawProto === 'tcp'
            ? `TCP [SYN ➔ SYN-ACK ➔ ACK] Port ${l4SrcPort} ➔ :${l4DstPort} (HTTP GET)`
            : rawProto === 'udp'
            ? `UDP Datagram Port ${l4SrcPort} ➔ :${l4DstPort}`
            : 'ICMP Echo Request (Type 8, Code 0)';
        const repLabel = rawProto === 'tcp'
            ? `TCP Port ${l4DstPort} ➔ :${l4SrcPort} (HTTP/1.1 200 OK)`
            : rawProto === 'udp'
            ? `UDP Reply Port ${l4DstPort} ➔ :${l4SrcPort}`
            : 'ICMP Echo Reply (Type 0, Code 0)';

        // 1. Forward Path (Source -> Destination)
        const forward = this.tracePath(srcDev, srcPort, srcIp, srcMask, dstDev, dstPort, dstIp, devices, cables, reqLabel, rawProto, {
            srcPort: l4SrcPort,
            dstPort: l4DstPort,
            isReturnPath: false
        });
        const isNatTranslated = !!(forward.natTranslatedHops && forward.natTranslatedHops.length > 0);
        if (!forward.success) {
            return Object.assign({}, forward, {
                natTranslated: isNatTranslated,
                translatedSrcIp: forward.finalSrcIp || srcIp
            });
        }

        // 2. Return Path Verification (Destination -> Source or NAT Inside Global IP)
        // Always verify the return path! If the forward packet was NAT-translated on a router along the path,
        // the destination sends its reply to `forward.finalSrcIp` (the NAT router's Inside Global IP),
        // and the NAT router translates it back to `srcIp` via `reverseRouterNat`!
        const replyTargetIp = forward.finalSrcIp || srcIp;
        const reply = this.tracePath(dstDev, dstPort, dstIp, dstMask, srcDev, srcPort, replyTargetIp, devices, cables, repLabel, rawProto, {
            srcPort: l4DstPort,
            dstPort: forward.finalSrcPort || l4SrcPort,
            isReturnPath: true
        });

        if (!reply.success) {
            return {
                success: false,
                natTranslated: isNatTranslated,
                translatedSrcIp: forward.finalSrcIp || srcIp,
                reason: `แพ็กเก็ตไปถึง ${dstDev.name} แล้ว แต่ส่งกลับไม่ได้ (เส้นทางขากลับล้มเหลว) -> (${reply.reason})`,
                hops: forward.hops,
                osiSteps: forward.osiSteps,
                natTranslatedHops: forward.natTranslatedHops
            };
        }

        const protoTitle = rawProto === 'tcp'
            ? 'HTTP 200 OK (TCP Handshake 3-Way สำเร็จ)'
            : rawProto === 'udp'
            ? 'UDP 전송 สำเร็จ'
            : 'Ping สำเร็จ';
        const routeDesc = forward.routedVia && forward.routedVia.length > 0
            ? `Routed via ${forward.routedVia.join(' ➔ ')}: ${srcIp} ➔ ${dstIp}, RTT = ${forward.routedVia.length * 2}ms`
            : `Local Subnet ${this.getNetworkAddress(srcIp, srcMask)}/${this.maskToCidr(srcMask)}, RTT < 1ms`;

        const tcpHandshakeSteps = rawProto === 'tcp' ? [
            { step: '1. TCP SYN', detail: `${srcIp}:${l4SrcPort} ➔ ${dstIp}:${l4DstPort} [Flags: SYN, Seq=0]` },
            { step: '2. TCP SYN-ACK', detail: `${dstIp}:${l4DstPort} ➔ ${replyTargetIp}:${forward.finalSrcPort || l4SrcPort} [Flags: SYN, ACK, Seq=0, Ack=1]` },
            { step: '3. TCP ACK + HTTP GET', detail: `${srcIp}:${l4SrcPort} ➔ ${dstIp}:${l4DstPort} [Flags: ACK, HTTP GET /index.html]` },
            { step: '4. HTTP 200 OK', detail: `${dstIp}:${l4DstPort} ➔ ${replyTargetIp}:${forward.finalSrcPort || l4SrcPort} [HTTP/1.1 200 OK]` }
        ] : null;

        return {
            success: true,
            protocol: rawProto,
            dstIp,
            dstName: dstDev.name,
            natTranslated: isNatTranslated,
            translatedSrcIp: forward.finalSrcIp || srcIp,
            reason: `${protoTitle}! (${routeDesc})`,
            hops: forward.hops,
            routerHopIps: forward.routerHopIps,
            osiSteps: forward.osiSteps,
            natTranslatedHops: forward.natTranslatedHops,
            tcpHandshakeSteps
        };
    },

    /**
     * =========================================================================
     * PRIORITY 0.4: CISCO IOS DHCP SERVER & CLIENT DORA ENGINE
     * =========================================================================
     * Simulates the full 4-Step DHCP DORA process:
     * 1. DHCP DISCOVER (Src 0.0.0.0:68 -> Dst 255.255.255.255:67 Broadcast)
     * 2. DHCP OFFER    (DHCP Server offers first non-excluded, unused IP from Pool)
     * 3. DHCP REQUEST  (Client requests the offered IP)
     * 4. DHCP ACK      (DHCP Server commits lease to dhcpBindings and returns IP, Mask, Default-Router, DNS)
     */
    isIpExcludedOnRouter(rtr, candidateIp) {
        const excludedList = rtr.dhcpExcluded || [];
        const candInt = this.ipToInt(candidateIp);
        for (const ex of excludedList) {
            const startIp = ex.low || ex.start;
            const endIp = ex.high || ex.end || startIp;
            if (!this.isValidIPv4(startIp)) continue;
            const sInt = this.ipToInt(startIp);
            const eInt = endIp && this.isValidIPv4(endIp) ? this.ipToInt(endIp) : sInt;
            const low = Math.min(sInt, eInt);
            const high = Math.max(sInt, eInt);
            if (candInt >= low && candInt <= high) return true;
        }
        return false;
    },

    requestDhcpLease(hostDev, devices, cables) {
        const hostPort = Object.keys(hostDev.ports)[0] || 'Eth0';
        const hostPortObj = hostDev.ports[hostPort];
        if (!hostPortObj.mac) hostPortObj.mac = this.generateMac(hostDev.type);
        const clientMac = hostPortObj.mac;

        // Collect all currently assigned IPs across all devices so we never assign a duplicate IP
        const usedIps = new Set();
        devices.forEach(d => {
            Object.entries(d.ports || {}).forEach(([pName, p]) => {
                if (d.id === hostDev.id && pName === hostPort) return;
                if (p.ip && this.isValidIPv4(p.ip)) usedIps.add(p.ip);
            });
            // Also check active bindings on all routers
            if (Array.isArray(d.dhcpBindings)) {
                d.dhcpBindings.forEach(b => {
                    if (b.mac !== clientMac && b.ip) usedIps.add(b.ip);
                });
            }
        });

        for (const rtr of devices) {
            if (!this.isL3Device(rtr)) continue;
            rtr.dhcpBindings = rtr.dhcpBindings || [];

            for (const [rPort, rObj] of Object.entries(rtr.ports)) {
                if (!rObj.ip || !this.isInterfaceUp(rtr, rPort)) continue;
                const reqVlan = rObj.vlan ? Number(rObj.vlan) : null;
                const l2 = this.findL2PathDetailed(hostDev.id, rtr.id, devices, cables, reqVlan);
                if (!l2) continue;

                const lastStep = l2[l2.length - 1];
                const basePort = this.getBasePortName(rPort);
                if (lastStep.inPort && lastStep.inPort !== basePort && !rObj.isSvi) continue;

                const ifaceIp = rObj.ip;
                const ifaceMask = rObj.mask || '255.255.255.0';
                const ifaceNet = this.getNetworkAddress(ifaceIp, ifaceMask);

                // Match configured `ip dhcp pool <name>` on `rtr`, or fall back to interface pool if no pools configured
                const pools = Array.isArray(rtr.dhcpPools) ? rtr.dhcpPools : [];
                let matchedPool = pools.find(pool =>
                    pool.network && pool.mask && this.getNetworkAddress(pool.network, pool.mask) === ifaceNet
                );

                // If the router explicitly configured DHCP pools, only serve subnets that have a matching pool!
                if (pools.length > 0 && !matchedPool) {
                    continue;
                }

                const poolName = matchedPool?.name || `POOL_${rPort}`;
                const mask = matchedPool?.mask || ifaceMask;
                const gwIp = matchedPool?.defaultRouter || ifaceIp;
                const dnsIp = matchedPool?.dnsServer || '8.8.8.8';

                const subDetails = this.calculateSubnetDetails(ifaceIp, mask);
                const firstHostInt = this.ipToInt(subDetails.firstHost);
                const lastHostInt = this.ipToInt(subDetails.lastHost);

                // Check if this client MAC already has a valid lease in this subnet
                const existingBinding = rtr.dhcpBindings.find(
                    b => b.mac === clientMac && this.isSameSubnet(b.ip, ifaceIp, mask) && !this.isIpExcludedOnRouter(rtr, b.ip) && !usedIps.has(b.ip)
                );

                let assignedIp = existingBinding ? existingBinding.ip : null;

                if (!assignedIp) {
                    // If no explicit excluded-address is set and no custom pool is set, start from .10 for convenience on /24,
                    // otherwise scan from firstHostInt to lastHostInt respecting `ip dhcp excluded-address`!
                    const hasCustomPoolOrExcl = (pools.length > 0) || (rtr.dhcpExcluded && rtr.dhcpExcluded.length > 0);
                    const startOffset = (!hasCustomPoolOrExcl && subDetails.usableHosts >= 20) ? 9 : 0;

                    for (let currInt = (firstHostInt + startOffset) >>> 0; currInt <= lastHostInt; currInt++) {
                        const candidateIp = this.intToIp(currInt);
                        if (candidateIp === ifaceIp || candidateIp === gwIp) continue;
                        if (usedIps.has(candidateIp)) continue;
                        if (this.isIpExcludedOnRouter(rtr, candidateIp)) continue;
                        assignedIp = candidateIp;
                        break;
                    }
                }

                if (!assignedIp) {
                    return {
                        success: false,
                        poolExhausted: true,
                        reason: `DHCP Pool "${poolName}" บน ${rtr.name} เต็มแล้ว (Pool Exhausted - ไม่มี IP ว่างในวง ${ifaceNet}/${subDetails.cidr})`
                    };
                }

                // Update router's DHCP Binding Table
                rtr.dhcpBindings = rtr.dhcpBindings.filter(b => b.mac !== clientMac && b.ip !== assignedIp);
                rtr.dhcpBindings.push({
                    ip: assignedIp,
                    mac: clientMac,
                    hostName: hostDev.name,
                    pool: poolName,
                    leaseExpiration: 'Infinite (Active)',
                    type: 'Automatic'
                });

                // Apply lease to client interface
                hostPortObj.ip = assignedIp;
                hostPortObj.mask = mask;
                hostPortObj.up = true;
                hostPortObj.dhcp = true;
                hostDev.gateway = gwIp;
                hostDev.dnsServer = dnsIp;

                const doraSteps = [
                    { step: '1. DHCP DISCOVER', detail: `${hostDev.name} (${clientMac}) ➔ 255.255.255.255 (UDP 68➔67 Broadcast)` },
                    { step: '2. DHCP OFFER', detail: `${rtr.name} (${ifaceIp}) เสนอ IP ${assignedIp}/${subDetails.cidr} จาก Pool "${poolName}"` },
                    { step: '3. DHCP REQUEST', detail: `${hostDev.name} ขอรับสิทธิ์ใช้งาน IP ${assignedIp} อย่างเป็นทางการ` },
                    { step: '4. DHCP ACK', detail: `${rtr.name} ยืนยัน Lease: IP=${assignedIp}, Mask=${mask}, GW=${gwIp}, DNS=${dnsIp}` }
                ];

                return {
                    success: true,
                    ip: assignedIp,
                    mask,
                    gateway: gwIp,
                    dnsServer: dnsIp,
                    poolName,
                    dhcpServer: rtr.name,
                    vlan: reqVlan || 1,
                    doraSteps
                };
            }
        }

        return {
            success: false,
            reason: 'ไม่พบ DHCP Server (Router / L3 Switch) ที่เปิดพอร์ตหรือมี DHCP Pool อยู่ในวงแลน/VLAN เดียวกัน'
        };
    }
};

window.NetworkEngine = NetworkEngine;
