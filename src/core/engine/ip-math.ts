/**
 * Mathematical & Utility methods for IPv4 and Subnet calculations
 * Strictly Pure Functions - No UI or external dependencies.
 */

export const IpMath = {
  isValidIPv4(ip: string): boolean {
    if (!ip || typeof ip !== 'string') return false;
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => {
      if (!/^\d+$/.test(p)) return false;
      const num = parseInt(p, 10);
      return num >= 0 && num <= 255 && (p === '0' || !p.startsWith('0'));
    });
  },

  isValidIPv6(addr: string): boolean {
    if (!addr || typeof addr !== 'string') return false;
    const clean = addr.trim().split('/')[0];
    if (!clean.includes(':')) return false;
    return /^[0-9a-fA-F:]+$/.test(clean);
  },

  isValidMask(mask: string): boolean {
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

  ipToInt(ip: string): number {
    return ip.trim().split('.').reduce((acc, oct) => ((acc << 8) + parseInt(oct, 10)) >>> 0, 0) >>> 0;
  },

  intToIp(int: number): string {
    return [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255
    ].join('.');
  },

  maskToCidr(mask: string): number {
    if (!this.isValidMask(mask)) return 24;
    const int = this.ipToInt(mask);
    let count = 0;
    for (let i = 31; i >= 0; i--) {
      if ((int & (1 << i)) !== 0) count++;
      else break;
    }
    return count;
  },

  cidrToMask(cidr: number): string {
    if (cidr < 0 || cidr > 32) cidr = 24;
    if (cidr === 0) return '0.0.0.0';
    const maskInt = ((0xFFFFFFFF << (32 - cidr)) >>> 0);
    return this.intToIp(maskInt);
  },

  maskToWildcard(mask: string): string {
    if (!this.isValidIPv4(mask)) return '0.0.0.255';
    const maskInt = this.ipToInt(mask);
    const wildcardInt = (~maskInt) >>> 0;
    return this.intToIp(wildcardInt);
  },

  wildcardToMask(wildcard: string): string {
    if (!this.isValidIPv4(wildcard)) return '255.255.255.0';
    const wildInt = this.ipToInt(wildcard);
    const maskInt = (~wildInt) >>> 0;
    return this.intToIp(maskInt);
  },

  getNetworkAddress(ip: string, mask: string): string {
    if (!this.isValidIPv4(ip) || !this.isValidMask(mask)) return ip;
    return this.intToIp((this.ipToInt(ip) & this.ipToInt(mask)) >>> 0);
  },

  getBroadcastAddress(ip: string, mask: string): string {
    if (!this.isValidIPv4(ip) || !this.isValidMask(mask)) return ip;
    const netInt = this.ipToInt(ip) & this.ipToInt(mask);
    const bcastInt = (netInt | (~this.ipToInt(mask))) >>> 0;
    return this.intToIp(bcastInt);
  },

  isSameSubnet(ip1: string, ip2: string, mask: string): boolean {
    if (!this.isValidIPv4(ip1) || !this.isValidIPv4(ip2) || !this.isValidMask(mask)) return false;
    return this.getNetworkAddress(ip1, mask) === this.getNetworkAddress(ip2, mask);
  },

  calculateSubnetDetails(ipInput: string, cidrInput: number) {
    const cidr = Math.min(32, Math.max(8, cidrInput || 24));
    const ip = this.isValidIPv4(ipInput) ? ipInput.trim() : '192.168.10.1';
    const mask = this.cidrToMask(cidr);
    const wildcard = this.maskToWildcard(mask);
    const network = this.getNetworkAddress(ip, mask);
    const broadcast = this.getBroadcastAddress(ip, mask);

    const netInt = this.ipToInt(network);
    const bcastInt = this.ipToInt(broadcast);
    const hostBits = 32 - cidr;
    const totalHosts = Math.pow(2, hostBits);
    const usableHosts = hostBits >= 2 ? totalHosts - 2 : (hostBits === 1 ? 2 : 1);

    const firstHost = cidr >= 31 ? network : this.intToIp(netInt + 1);
    const lastHost = cidr >= 31 ? broadcast : this.intToIp(bcastInt - 1);

    const toBinary = (strIp: string) => strIp.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0')).join('.');

    return {
      ip,
      cidr,
      mask,
      wildcard,
      networkAddress: network,
      broadcastAddress: broadcast,
      firstHost,
      lastHost,
      usableHosts,
      totalHosts,
      hostBits,
      binaryIp: toBinary(ip),
      binaryMask: toBinary(mask)
    };
  },

  generateMac(deviceType: string = 'pc'): string {
    const prefixes: Record<string, string> = {
      router: '0050.7966.',
      switch: '0001.9654.',
      pc: '00D0.BA11.',
      server: '00E0.F722.',
      cloud: '00F0.88AA.'
    };
    const prefix = prefixes[deviceType] || '0050.7966.';
    const randHex = () => Math.floor(Math.random() * 65536).toString(16).padStart(4, '0').toUpperCase();
    return `${prefix}${randHex()}`;
  }
};

