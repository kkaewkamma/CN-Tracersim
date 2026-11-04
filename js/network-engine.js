/**
 * NetSim Touch - Network & Packet Simulation Engine
 * Handles IPv4 subnet calculations, routing logic, ARP, and PDU path finding.
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

    getNetworkAddress(ip, mask) {
        if (!this.isValidIPv4(ip) || !this.isValidIPv4(mask)) return null;
        return this.intToIp((this.ipToInt(ip) & this.ipToInt(mask)) >>> 0);
    },

    isSameSubnet(ip1, ip2, mask) {
        if (!this.isValidIPv4(ip1) || !this.isValidIPv4(ip2) || !this.isValidIPv4(mask)) return false;
        const m = this.ipToInt(mask);
        return ((this.ipToInt(ip1) & m) >>> 0) === ((this.ipToInt(ip2) & m) >>> 0);
    },

    /**
     * Checks if two directly connected or switch-bridged devices have active physical link
     */
    findPhysicalPath(startDevId, targetDevId, devices, cables, visited = new Set()) {
        if (startDevId === targetDevId) return [startDevId];
        visited.add(startDevId);

        const currentDev = devices.find(d => d.id === startDevId);
        if (!currentDev) return null;

        // Find all connected cables from this device where interface is UP
        const connectedCables = cables.filter(c => {
            if (c.from === startDevId) {
                return currentDev.ports[c.fromPort]?.up;
            } else if (c.to === startDevId) {
                return currentDev.ports[c.toPort]?.up;
            }
            return false;
        });

        for (const cable of connectedCables) {
            const nextDevId = cable.from === startDevId ? cable.to : cable.from;
            const nextPort = cable.from === startDevId ? cable.toPort : cable.fromPort;
            const nextDev = devices.find(d => d.id === nextDevId);

            if (!nextDev || !nextDev.ports[nextPort]?.up || visited.has(nextDevId)) continue;

            if (nextDevId === targetDevId) {
                return [startDevId, nextDevId];
            }

            // Only Bridges / L2 Switches forward packets without routing
            if (nextDev.type === 'switch') {
                const subPath = this.findPhysicalPath(nextDevId, targetDevId, devices, cables, new Set(visited));
                if (subPath) {
                    return [startDevId, ...subPath];
                }
            }
        }

        return null;
    },

    /**
     * Simulates ICMP Ping from srcDev to dstDev
     * Returns: { success: boolean, reason: string, hops: Device[] }
     */
    simulatePing(srcDev, dstDev, devices, cables) {
        if (!srcDev || !dstDev) {
            return { success: false, reason: 'ระบุอุปกรณ์ไม่ถูกต้อง', hops: [] };
        }
        if (srcDev.id === dstDev.id) {
            return { success: true, reason: 'Ping ตัวเอง (Loopback) สำเร็จ', hops: [srcDev] };
        }

        // Get primary IP for source
        const srcIpEntry = Object.entries(srcDev.ports).find(([p, obj]) => obj.ip && obj.up);
        if (!srcIpEntry) {
            return { success: false, reason: `${srcDev.name}: พอร์ตไม่ได้เปิด (Shutdown) หรือยังไม่ได้ตั้งค่า IP`, hops: [srcDev] };
        }
        const [srcPort, srcPortObj] = srcIpEntry;
        const srcIp = srcPortObj.ip;
        const srcMask = srcPortObj.mask || '255.255.255.0';

        // Get primary IP for destination
        const dstIpEntry = Object.entries(dstDev.ports).find(([p, obj]) => obj.ip);
        if (!dstIpEntry) {
            return { success: false, reason: `${dstDev.name}: ยังไม่ได้ตั้งค่า IP Address`, hops: [srcDev] };
        }
        const [dstPort, dstPortObj] = dstIpEntry;
        if (!dstPortObj.up) {
            return { success: false, reason: `${dstDev.name} (${dstPort}): พอร์ตปิดอยู่ (Administratively Down)`, hops: [srcDev] };
        }
        const dstIp = dstPortObj.ip;
        const dstMask = dstPortObj.mask || '255.255.255.0';

        // Case 1: In the same local subnet
        if (this.isSameSubnet(srcIp, dstIp, srcMask)) {
            const path = this.findPhysicalPath(srcDev.id, dstDev.id, devices, cables);
            if (!path) {
                return { 
                    success: false, 
                    reason: `Request timed out: ไม่พบสายเชื่อมต่อไปยัง ${dstDev.name} ในเครือข่าย Local`, 
                    hops: [srcDev] 
                };
            }
            const hopDevices = path.map(id => devices.find(d => d.id === id));
            return {
                success: true,
                reason: `Ping สำเร็จ! (Local Subnet ${this.getNetworkAddress(srcIp, srcMask)}/24, RTT < 1ms)`,
                hops: hopDevices
            };
        }

        // Case 2: Different Subnets (Requires Default Gateway & Router)
        if (!srcDev.gateway) {
            return {
                success: false,
                reason: `${srcDev.name}: ปลายทางอยู่นอกเครือข่าย แต่ไม่ได้ตั้งค่า Default Gateway`,
                hops: [srcDev]
            };
        }

        // Find the Router with interface matching srcDev's Gateway
        let gatewayRouter = null;
        let gatewayPort = null;
        for (const dev of devices) {
            if (dev.type === 'router') {
                for (const [pName, pObj] of Object.entries(dev.ports)) {
                    if (pObj.ip === srcDev.gateway && pObj.up) {
                        gatewayRouter = dev;
                        gatewayPort = pName;
                        break;
                    }
                }
            }
            if (gatewayRouter) break;
        }

        if (!gatewayRouter) {
            return {
                success: false,
                reason: `Default Gateway (${srcDev.gateway}) ใช้งานไม่ได้ หรือพอร์ตบน Router ปิดอยู่`,
                hops: [srcDev]
            };
        }

        // Check path from srcDev to Gateway Router
        const pathToRouter = this.findPhysicalPath(srcDev.id, gatewayRouter.id, devices, cables);
        if (!pathToRouter) {
            return {
                success: false,
                reason: `${srcDev.name} ไม่สามารถติดต่อ Default Gateway (${gatewayRouter.name}) ได้`,
                hops: [srcDev]
            };
        }

        // Router checks routing table for destination subnet
        let routerOutPort = null;
        for (const [pName, pObj] of Object.entries(gatewayRouter.ports)) {
            if (pObj.ip && pObj.up && this.isSameSubnet(pObj.ip, dstIp, pObj.mask || '255.255.255.0')) {
                routerOutPort = pName;
                break;
            }
        }

        if (!routerOutPort) {
            const hopsSoFar = pathToRouter.map(id => devices.find(d => d.id === id));
            return {
                success: false,
                reason: `Destination Host Unreachable: ${gatewayRouter.name} ไม่มี Route ไปยังเครือข่าย ${dstIp}`,
                hops: hopsSoFar
            };
        }

        // Check path from Router to Destination
        const pathToDst = this.findPhysicalPath(gatewayRouter.id, dstDev.id, devices, cables);
        if (!pathToDst) {
            const hopsSoFar = pathToRouter.map(id => devices.find(d => d.id === id));
            return {
                success: false,
                reason: `Request timed out: ${gatewayRouter.name} ต่อสายไปยัง ${dstDev.name} ไม่สำเร็จ`,
                hops: hopsSoFar
            };
        }

        // Check return path: dstDev must have gateway pointing back to router
        if (dstDev.type === 'pc' || dstDev.type === 'server') {
            const routerFacingIp = gatewayRouter.ports[routerOutPort].ip;
            if (!dstDev.gateway || dstDev.gateway !== routerFacingIp) {
                const forwardHops = [...pathToRouter, ...pathToDst.slice(1)].map(id => devices.find(d => d.id === id));
                return {
                    success: false,
                    reason: `Request timed out: ${dstDev.name} ได้รับแพ็กเก็ต แต่ไม่มี Default Gateway ส่งกลับ (${routerFacingIp})`,
                    hops: forwardHops
                };
            }
        }

        // Full round-trip path
        const fullHops = [...pathToRouter, ...pathToDst.slice(1)].map(id => devices.find(d => d.id === id));
        return {
            success: true,
            reason: `Ping สำเร็จ! (Routed via ${gatewayRouter.name}: ${srcIp} -> ${dstIp}, RTT = 2ms)`,
            hops: fullHops
        };
    }
};

window.NetworkEngine = NetworkEngine;
