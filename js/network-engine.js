/**
 * NetSim Touch v5.0 Academy Edition - Enterprise Network, Security (ACL/NAT), IPv6, L3 Switch & OSI 7-Layer Engine
 * Supports:
 * - IPv4 Subnetting, VLSM Calculator & Longest Prefix Match (LPM)
 * - IPv6 Addressing, SLAAC & ICMPv6 Ping Simulation
 * - Layer 2 Access VLANs, Native VLANs & 802.1Q Trunking
 * - Inter-VLAN Routing: Router-on-a-Stick (802.1Q Sub-interfaces) & Layer 3 Switch SVI (ip routing + interface VlanX)
 * - Multi-Hop Static Routing (ip route), Default Route & Dynamic OSPF (router ospf)
 * - Standard ACL (1-99) & Extended ACL (100-199) Firewall Filtering
 * - Static NAT & Dynamic NAT / PAT Overload
 * - Layer 7 HTTP Web Request (TCP Port 80 + 3-Way Handshake) & DHCP DORA Allocation Engine
 * - Full 7-Layer OSI PDU Encapsulation Inspector
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
        if (!this.isValidIPv4(wildcard)) return '255.255.255.0';
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

    /**
     * Full IPv4 Subnetting / VLSM / CIDR Calculator for Academy Learning
     */
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
        const pObj = dev.ports[portName];
        if (!pObj || !pObj.up) return false;
        const baseName = this.getBasePortName(portName);
        if (baseName !== portName) {
            const baseObj = dev.ports[baseName];
            if (baseObj && !baseObj.up) return false;
        }
        return true;
    },

    /**
     * Evaluates Router Standard (1-99) and Extended (100-199) ACL rules
     */
    evaluateRouterAcl(router, protocol, srcIp, dstIp) {
        const rules = router.acls || [];
        if (rules.length === 0) {
            return { allowed: true, matchedRule: null };
        }

        const matchIpCriterion = (packetIp, ruleIp, wildcard = '0.0.0.0') => {
            if (!ruleIp || ruleIp === 'any') return true;
            if (!this.isValidIPv4(ruleIp)) return true;
            if (!wildcard || wildcard === '0.0.0.0') return packetIp === ruleIp;
            const mask = this.wildcardToMask(wildcard);
            return this.isSameSubnet(packetIp, ruleIp, mask);
        };

        for (const r of rules) {
            const protoMatch = r.protocol === 'ip' || r.protocol === protocol || (r.protocol === 'http' && protocol === 'tcp');
            if (!protoMatch) continue;

            const srcMatch = matchIpCriterion(srcIp, r.src, r.srcWildcard);
            const dstMatch = matchIpCriterion(dstIp, r.dst || 'any', r.dstWildcard);

            if (srcMatch && dstMatch) {
                r.hits = (r.hits || 0) + 1;
                return { allowed: r.action === 'permit', matchedRule: r };
            }
        }

        return { allowed: true, matchedRule: null };
    },

    /**
     * Checks if Static NAT or Dynamic NAT/PAT Overload applies when leaving `router` on `outPort`
     */
    applyRouterNat(router, inPort, outPort, currentSrcIp, dstIp, protocol) {
        const outObj = router.ports[outPort];
        const inObj = router.ports[inPort];
        const isNatTrigger =
            router.natEnabled ||
            (router.staticNat && router.staticNat.length > 0) ||
            (inObj?.nat === 'inside' && outObj?.nat === 'outside') ||
            (outObj?.nat === 'outside');

        if (!isNatTrigger || !outObj || !outObj.ip) return currentSrcIp;
        if (currentSrcIp === outObj.ip) return currentSrcIp;

        router.natTranslations = router.natTranslations || [];

        // Check Static NAT first (ip nat inside source static <local> <global>)
        const staticEntry = (router.staticNat || []).find(s => s.insideLocal === currentSrcIp);
        const translatedIp = staticEntry ? staticEntry.insideGlobal : outObj.ip;

        const portNum = protocol === 'tcp' ? 80 : 1024 + (router.natTranslations.length % 500);
        const insideGlobal = `${translatedIp}:${portNum}`;
        const insideLocal = `${currentSrcIp}:${portNum}`;
        const outsideGlobal = `${dstIp}:${protocol === 'tcp' ? 80 : 0}`;

        if (!router.natTranslations.some(t => t.insideLocal === insideLocal && t.outsideGlobal === outsideGlobal)) {
            router.natTranslations.unshift({
                proto: protocol,
                insideGlobal,
                insideLocal,
                outsideLocal: outsideGlobal,
                outsideGlobal
            });
            if (router.natTranslations.length > 20) router.natTranslations.pop();
        }

        return translatedIp;
    },

    /**
     * Checks if two devices have an active Layer 2 physical/VLAN path.
     */
    findL2PathDetailed(startDevId, targetDevId, devices, cables, requiredVlan = null, visited = new Set()) {
        if (startDevId === targetDevId) return [{ devId: startDevId, inPort: null, outPort: null, vlan: requiredVlan || 1 }];
        visited.add(startDevId);

        const currentDev = devices.find(d => d.id === startDevId);
        if (!currentDev) return null;

        const connectedCables = cables.filter(c => {
            if (c.from === startDevId) {
                return currentDev.ports[c.fromPort]?.up;
            } else if (c.to === startDevId) {
                return currentDev.ports[c.toPort]?.up;
            }
            return false;
        });

        for (const cable of connectedCables) {
            const myPhysPort = cable.from === startDevId ? cable.fromPort : cable.toPort;
            const nextDevId = cable.from === startDevId ? cable.to : cable.from;
            const nextPhysPort = cable.from === startDevId ? cable.toPort : cable.fromPort;
            const nextDev = devices.find(d => d.id === nextDevId);

            if (!nextDev || !nextDev.ports[nextPhysPort]?.up || visited.has(nextDevId)) continue;

            let frameVlan = requiredVlan;
            let taggedOnWire = false;

            if (currentDev.type === 'switch') {
                const swPort = currentDev.ports[myPhysPort];
                const isTrunk = swPort?.mode === 'trunk';
                const portVlan = swPort?.vlan || 1;

                if (isTrunk) {
                    frameVlan = frameVlan || 1;
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
                    nextVlan = frameVlan || 1;
                } else {
                    if (requiredVlan !== null && Number(nextPortVlan) !== Number(requiredVlan)) continue;
                    if (taggedOnWire && frameVlan !== nextPortVlan) continue;
                    if (!taggedOnWire && currentDev.type === 'switch' && frameVlan !== nextPortVlan) continue;
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
                const subPath = this.findL2PathDetailed(nextDevId, targetDevId, devices, cables, nextVlan, new Set(visited));
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

    computeOspfRoutes(router, devices, cables) {
        if (!this.isL3Device(router) || !router.ospf || !router.ospf.networks || router.ospf.networks.length === 0) {
            return [];
        }

        const isInterfaceInOspf = (rtr, pObj) => {
            if (!pObj.ip || !rtr.ospf || !rtr.ospf.networks) return null;
            for (const netStmt of rtr.ospf.networks) {
                const mask = this.wildcardToMask(netStmt.wildcard || '0.0.0.255');
                if (this.isSameSubnet(pObj.ip, netStmt.network, mask)) {
                    return netStmt.area ?? 0;
                }
            }
            return null;
        };

        const myOspfPorts = Object.entries(router.ports).filter(([pName, pObj]) =>
            this.isInterfaceUp(router, pName) && isInterfaceInOspf(router, pObj) !== null
        );
        if (myOspfPorts.length === 0) return [];

        const learnedRoutes = [];
        const visitedRtrs = new Set([router.id]);
        const queue = [];

        for (const [myPortName, myPortObj] of myOspfPorts) {
            const myMask = myPortObj.mask || '255.255.255.0';
            for (const other of devices) {
                if (!this.isL3Device(other) || other.id === router.id) continue;
                for (const [otherPort, otherObj] of Object.entries(other.ports)) {
                    if (!this.isInterfaceUp(other, otherPort) || !otherObj.ip) continue;
                    if (isInterfaceInOspf(other, otherObj) === null) continue;
                    if (this.isSameSubnet(myPortObj.ip, otherObj.ip, myMask)) {
                        const l2 = this.findL2PathDetailed(router.id, other.id, devices, cables, myPortObj.vlan || null);
                        if (l2) {
                            visitedRtrs.add(other.id);
                            queue.push({
                                rtr: other,
                                firstHopIp: otherObj.ip,
                                outPort: myPortName,
                                metric: 2,
                                area: isInterfaceInOspf(other, otherObj)
                            });
                        }
                    }
                }
            }
        }

        while (queue.length > 0) {
            const curr = queue.shift();
            for (const [pName, pObj] of Object.entries(curr.rtr.ports)) {
                if (!this.isInterfaceUp(curr.rtr, pName) || !pObj.ip) continue;
                const area = isInterfaceInOspf(curr.rtr, pObj);
                if (area === null) continue;

                const mask = pObj.mask || '255.255.255.0';
                const netAddr = this.getNetworkAddress(pObj.ip, mask);

                const isDirectOnMe = Object.entries(router.ports).some(([mp, mo]) =>
                    this.isInterfaceUp(router, mp) && mo.ip && this.isSameSubnet(mo.ip, pObj.ip, mo.mask || '255.255.255.0')
                );
                if (!isDirectOnMe && !learnedRoutes.some(r => r.network === netAddr && r.mask === mask)) {
                    learnedRoutes.push({
                        type: 'ospf',
                        network: netAddr,
                        mask,
                        nextHop: curr.firstHopIp,
                        outPort: curr.outPort,
                        metric: curr.metric,
                        area
                    });
                }

                for (const nextRtr of devices) {
                    if (!this.isL3Device(nextRtr) || visitedRtrs.has(nextRtr.id)) continue;
                    for (const [npName, npObj] of Object.entries(nextRtr.ports)) {
                        if (!this.isInterfaceUp(nextRtr, npName) || !npObj.ip) continue;
                        if (isInterfaceInOspf(nextRtr, npObj) === null) continue;
                        if (this.isSameSubnet(pObj.ip, npObj.ip, mask)) {
                            const l2 = this.findL2PathDetailed(curr.rtr.id, nextRtr.id, devices, cables, pObj.vlan || null);
                            if (l2) {
                                visitedRtrs.add(nextRtr.id);
                                queue.push({
                                    rtr: nextRtr,
                                    firstHopIp: curr.firstHopIp,
                                    outPort: curr.outPort,
                                    metric: curr.metric + 1,
                                    area
                                });
                            }
                        }
                    }
                }
            }
        }

        return learnedRoutes;
    },

    getOspfNeighbors(router, devices, cables) {
        if (!this.isL3Device(router) || !router.ospf || !router.ospf.networks) return [];
        const neighbors = [];

        const isInterfaceInOspf = (rtr, pObj) => {
            if (!pObj.ip || !rtr.ospf || !rtr.ospf.networks) return false;
            return rtr.ospf.networks.some(n => this.isSameSubnet(pObj.ip, n.network, this.wildcardToMask(n.wildcard || '0.0.0.255')));
        };

        for (const [myPort, myObj] of Object.entries(router.ports)) {
            if (!this.isInterfaceUp(router, myPort) || !isInterfaceInOspf(router, myObj)) continue;
            const myMask = myObj.mask || '255.255.255.0';

            for (const other of devices) {
                if (!this.isL3Device(other) || other.id === router.id) continue;
                for (const [otherPort, otherObj] of Object.entries(other.ports)) {
                    if (!this.isInterfaceUp(other, otherPort) || !isInterfaceInOspf(other, otherObj)) continue;
                    if (this.isSameSubnet(myObj.ip, otherObj.ip, myMask)) {
                        const l2 = this.findL2PathDetailed(router.id, other.id, devices, cables, myObj.vlan || null);
                        if (l2) {
                            const highestIp = Object.values(other.ports)
                                .filter(p => p.ip)
                                .map(p => p.ip)
                                .sort((a, b) => this.ipToInt(b) - this.ipToInt(a))[0] || otherObj.ip;
                            neighbors.push({
                                neighborId: highestIp,
                                pri: 1,
                                state: 'FULL/DR',
                                address: otherObj.ip,
                                interface: myPort,
                                hostname: other.name
                            });
                        }
                    }
                }
            }
        }
        return neighbors;
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
                        bestMatch = { type: 'connected', outPort: pName, mask };
                    }
                }
            }
        }

        // 2. Static Routes (AD = 1)
        const staticRoutes = router.routes || [];
        for (const r of staticRoutes) {
            if (this.isValidIPv4(r.network) && this.isValidMask(r.mask) && this.isValidIPv4(r.nextHop)) {
                if (this.isSameSubnet(r.network, dstIp, r.mask)) {
                    const prefixLen = this.maskToCidr(r.mask);
                    if (prefixLen > bestPrefixLen || (prefixLen === bestPrefixLen && 1 < bestAd)) {
                        bestPrefixLen = prefixLen;
                        bestAd = 1;
                        bestMatch = { type: 'static', nextHopIp: r.nextHop, network: r.network, mask: r.mask };
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
                    bestMatch = { type: 'ospf', nextHopIp: r.nextHop, outPort: r.outPort, network: r.network, mask: r.mask, metric: r.metric };
                }
            }
        }

        return bestMatch;
    },

    /**
     * Traces Layer 3 + Layer 2 path with ACL evaluation, NAT translation, and OSI 7-Layer PDU inspection
     */
    tracePath(srcDev, srcPortName, srcIp, srcMask, dstDev, dstPortName, dstIp, devices, cables, l4ProtocolLabel = 'ICMP Echo Request (Type 8)', rawProto = 'icmp') {
        const hopsIds = [srcDev.id];
        const routerHopIps = [];
        const osiSteps = [];
        let ttl = 64;
        let activeSrcIp = srcIp;

        const getMac = (dev, portName) => {
            const p = dev.ports[portName] || Object.values(dev.ports)[0];
            if (p && !p.mac) p.mac = this.generateMac(dev.type);
            return p?.mac || '001B.5400.0101';
        };

        const appendL2SegmentWithOsi = (l2Detailed, l3SrcMac, l3DstMac, protocolNote, pktSrcIp = activeSrcIp) => {
            if (!l2Detailed || l2Detailed.length === 0) return;
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
                    dstIp,
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

        if (!this.isL3Device(srcDev)) {
            if (this.isSameSubnet(srcIp, dstIp, srcMask)) {
                const l2Detailed = this.findL2PathDetailed(srcDev.id, dstDev.id, devices, cables, null);
                if (!l2Detailed) {
                    return {
                        success: false,
                        reason: `Request timed out: ไม่พบสายสัญญาณ L2 หรืออยู่คนละ VLAN ไปยัง ${dstDev.name}`,
                        hops: hopsIds.map(id => devices.find(d => d.id === id)),
                        routerHopIps,
                        osiSteps
                    };
                }
                const sMac = getMac(srcDev, srcPortName);
                const dMac = getMac(dstDev, dstPortName);
                appendL2SegmentWithOsi(l2Detailed, sMac, dMac, 'ARP Broadcast (FFFF.FFFF.FFFF) ➔ Direct Local Subnet Delivery');
                return {
                    success: true,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routedVia: null,
                    routerHopIps,
                    osiSteps
                };
            }

            if (!srcDev.gateway) {
                return {
                    success: false,
                    reason: `${srcDev.name}: ปลายทางอยู่คนละวงแลน แต่ยังไม่ได้ตั้งค่า Default Gateway`,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routerHopIps,
                    osiSteps
                };
            }

            const gwTarget = this.findDeviceByIpOnL2(srcDev, srcPortName, srcDev.gateway, devices, cables);
            if (!gwTarget || !this.isL3Device(gwTarget.device)) {
                return {
                    success: false,
                    reason: `${srcDev.name}: ไม่สามารถติดต่อ Default Gateway (${srcDev.gateway}) ได้ (ตรวจสอบ IP Gateway หรือคำสั่ง ip routing บน L3 Switch)`,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routerHopIps,
                    osiSteps
                };
            }

            const sMac = getMac(srcDev, srcPortName);
            const gwMac = getMac(gwTarget.device, gwTarget.port);
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
                dstIp,
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
                    osiSteps
                };
            }
            visitedRouters.add(currentRouter.id);
            routerNames.push(currentRouter.name);

            // 1. Evaluate ACL Firewall Rules on currentRouter
            const aclCheck = this.evaluateRouterAcl(currentRouter, rawProto, activeSrcIp, dstIp);
            if (!aclCheck.allowed) {
                const r = aclCheck.matchedRule;
                const aclMsg = `🛡️ ถูกบล็อกโดย Firewall ACL ${r.id} บน ${currentRouter.name}: [deny ${r.protocol} ${r.src} ➔ ${r.dst || 'any'}]`;
                const lastOsi = osiSteps[osiSteps.length - 1];
                if (lastOsi && lastOsi.deviceId === currentRouter.id) {
                    lastOsi.note = aclMsg;
                }
                return {
                    success: false,
                    aclBlocked: true,
                    reason: aclMsg,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routerHopIps,
                    osiSteps
                };
            }

            if (currentRouter.id === dstDev.id) {
                return {
                    success: true,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routedVia: routerNames,
                    routerHopIps,
                    osiSteps
                };
            }

            ttl = Math.max(1, ttl - 1);
            const route = this.lookupRouterRoute(currentRouter, dstIp, devices, cables);
            if (!route) {
                return {
                    success: false,
                    reason: `Destination Host Unreachable: ${currentRouter.name} ไม่มี Route ไปยังเครือข่ายของ ${dstIp}`,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routerHopIps,
                    osiSteps
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
                        osiSteps
                    };
                }

                // Apply NAT if leaving an outside interface
                const prevIp = activeSrcIp;
                activeSrcIp = this.applyRouterNat(currentRouter, currentRouterIngressPort, route.outPort, activeSrcIp, dstIp, rawProto);
                const natNote = prevIp !== activeSrcIp ? ` • NAT (${prevIp} ➔ ${activeSrcIp})` : '';

                const rtrOutMac = getMac(currentRouter, route.outPort);
                const finalDstMac = getMac(dstDev, dstPortName);
                appendL2SegmentWithOsi(
                    l2ToDst,
                    rtrOutMac,
                    finalDstMac,
                    `L3 Routed via ${route.outPort} (TTL=${ttl}${natNote})`,
                    activeSrcIp
                );
                return {
                    success: true,
                    hops: hopsIds.map(id => devices.find(d => d.id === id)),
                    routedVia: routerNames,
                    routerHopIps,
                    osiSteps
                };
            }

            if (route.type === 'static' || route.type === 'ospf') {
                let egressPort = route.outPort || null;
                if (!egressPort) {
                    for (const [pName, pObj] of Object.entries(currentRouter.ports)) {
                        if (pObj.ip && this.isInterfaceUp(currentRouter, pName) && this.isSameSubnet(pObj.ip, route.nextHopIp, pObj.mask || '255.255.255.0')) {
                            egressPort = pName;
                            break;
                        }
                    }
                }
                const nextHopTarget = this.findDeviceByIpOnL2(currentRouter, egressPort || 'Gig0/0', route.nextHopIp, devices, cables);
                if (!nextHopTarget) {
                    return {
                        success: false,
                        reason: `Request timed out: ${currentRouter.name} ไม่สามารถติดต่อ Next-Hop (${route.nextHopIp}) ได้`,
                        hops: hopsIds.map(id => devices.find(d => d.id === id)),
                        routerHopIps,
                        osiSteps
                    };
                }

                const prevIp = activeSrcIp;
                activeSrcIp = this.applyRouterNat(currentRouter, currentRouterIngressPort, egressPort || 'Gig0/0', activeSrcIp, dstIp, rawProto);
                const natNote = prevIp !== activeSrcIp ? ` • NAT (${prevIp} ➔ ${activeSrcIp})` : '';

                const rtrOutMac = getMac(currentRouter, egressPort || 'Gig0/0');
                const nhMac = getMac(nextHopTarget.device, nextHopTarget.port);
                const protoLabel = route.type === 'ospf' ? `OSPF Route [110/${route.metric}]` : `Static Route [1/0]`;
                appendL2SegmentWithOsi(
                    nextHopTarget.detailedPath,
                    rtrOutMac,
                    nhMac,
                    `L3 Forwarded via ${protoLabel} ➔ Next-Hop ${route.nextHopIp} (TTL=${ttl}${natNote})`,
                    activeSrcIp
                );
                routerHopIps.push({ ip: route.nextHopIp, name: nextHopTarget.device.name });

                if (nextHopTarget.device.id === dstDev.id) {
                    return {
                        success: true,
                        hops: hopsIds.map(id => devices.find(d => d.id === id)),
                        routedVia: [...routerNames, nextHopTarget.device.name],
                        routerHopIps,
                        osiSteps
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
            osiSteps
        };
    },

    simulatePing(srcDev, dstDev, devices, cables) {
        return this.simulateL4Packet(srcDev, dstDev, devices, cables, 'icmp');
    },

    simulateHttp(srcDev, dstDev, devices, cables) {
        return this.simulateL4Packet(srcDev, dstDev, devices, cables, 'tcp');
    },

    simulateL4Packet(srcDev, dstDev, devices, cables, rawProto = 'icmp') {
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

        const reqLabel = rawProto === 'tcp'
            ? 'TCP [SYN ➔ SYN-ACK ➔ ACK] + HTTP GET :80'
            : 'ICMP Echo Request (Type 8, Code 0)';
        const repLabel = rawProto === 'tcp'
            ? 'TCP Port 80 (HTTP/1.1 200 OK)'
            : 'ICMP Echo Reply (Type 0, Code 0)';

        const forward = this.tracePath(srcDev, srcPort, srcIp, srcMask, dstDev, dstPort, dstIp, devices, cables, reqLabel, rawProto);
        if (!forward.success) {
            return forward;
        }

        const hasNatOnPath = devices.some(d => d.type === 'router' && (d.natEnabled || (d.staticNat && d.staticNat.length > 0) || Object.values(d.ports).some(p => p.nat === 'outside')));
        if (!hasNatOnPath && dstDev.type !== 'cloud') {
            const reply = this.tracePath(dstDev, dstPort, dstIp, dstMask, srcDev, srcPort, srcIp, devices, cables, repLabel, rawProto);
            if (!reply.success) {
                return {
                    success: false,
                    reason: `แพ็กเก็ตไปถึง ${dstDev.name} แล้ว แต่ส่งกลับไม่ได้ -> (${reply.reason})`,
                    hops: forward.hops,
                    osiSteps: forward.osiSteps
                };
            }
        }

        const protoTitle = rawProto === 'tcp' ? 'HTTP 200 OK (TCP Handshake สำเร็จ)' : 'Ping สำเร็จ';
        const routeDesc = forward.routedVia && forward.routedVia.length > 0
            ? `Routed via ${forward.routedVia.join(' ➔ ')}: ${srcIp} ➔ ${dstIp}, RTT = ${forward.routedVia.length * 2}ms`
            : `Local Subnet ${this.getNetworkAddress(srcIp, srcMask)}/${this.maskToCidr(srcMask)}, RTT < 1ms`;

        return {
            success: true,
            protocol: rawProto,
            dstIp,
            dstName: dstDev.name,
            reason: `${protoTitle}! (${routeDesc})`,
            hops: forward.hops,
            routerHopIps: forward.routerHopIps,
            osiSteps: forward.osiSteps
        };
    },

    requestDhcpLease(hostDev, devices, cables) {
        const hostPort = Object.keys(hostDev.ports)[0] || 'Eth0';
        const usedIps = new Set();
        devices.forEach(d => {
            Object.values(d.ports).forEach(p => {
                if (p.ip) usedIps.add(p.ip);
            });
        });

        for (const rtr of devices) {
            if (!this.isL3Device(rtr)) continue;
            for (const [rPort, rObj] of Object.entries(rtr.ports)) {
                if (!rObj.ip || !this.isInterfaceUp(rtr, rPort)) continue;
                const reqVlan = rObj.vlan ? Number(rObj.vlan) : null;
                const l2 = this.findL2PathDetailed(hostDev.id, rtr.id, devices, cables, reqVlan);
                if (!l2) continue;

                const lastStep = l2[l2.length - 1];
                const basePort = this.getBasePortName(rPort);
                if (lastStep.inPort && lastStep.inPort !== basePort && !rObj.isSvi) continue;

                const gwIp = rObj.ip;
                const mask = rObj.mask || '255.255.255.0';
                const netInt = this.ipToInt(this.getNetworkAddress(gwIp, mask));

                for (let offset = 10; offset < 250; offset++) {
                    const candidateIp = this.intToIp((netInt + offset) >>> 0);
                    if (!usedIps.has(candidateIp) && candidateIp !== gwIp) {
                        hostDev.ports[hostPort].ip = candidateIp;
                        hostDev.ports[hostPort].mask = mask;
                        hostDev.ports[hostPort].up = true;
                        hostDev.ports[hostPort].dhcp = true;
                        hostDev.gateway = gwIp;
                        return {
                            success: true,
                            ip: candidateIp,
                            mask,
                            gateway: gwIp,
                            dhcpServer: rtr.name,
                            vlan: reqVlan || 1
                        };
                    }
                }
            }
        }

        return {
            success: false,
            reason: 'ไม่พบ DHCP Server (Router / L3 Switch) ที่เปิดพอร์ตอยู่ในวงแลนหรือ VLAN เดียวกัน'
        };
    }
};

window.NetworkEngine = NetworkEngine;
