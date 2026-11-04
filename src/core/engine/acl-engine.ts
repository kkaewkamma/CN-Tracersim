import { NetworkDevice, AccessControlList, AclRule } from '../types';
import { IpMath } from './ip-math';

export const AclEngine = {
  /**
   * Matches an IP against an ACL pattern using Cisco Wildcard Mask
   * Wildcard Mask: 0 = must match bit exactly, 1 = ignore bit
   */
  matchesWildcard(ip: string, patternIp: string, wildcardMask: string): boolean {
    if (!IpMath.isValidIPv4(ip)) return false;
    if (patternIp === 'any') return true;
    if (patternIp === 'host') return false;
    if (!IpMath.isValidIPv4(patternIp)) return false;

    const ipInt = IpMath.ipToInt(ip);
    const patInt = IpMath.ipToInt(patternIp);
    const wildInt = wildcardMask ? IpMath.ipToInt(wildcardMask) : 0;

    const careMask = (~wildInt) >>> 0;
    return ((ipInt & careMask) >>> 0) === ((patInt & careMask) >>> 0);
  },

  /**
   * Evaluates packet against ACL rules in strict Top-Down order
   * Cisco IOS Rule: If no rule matches, strict Implicit Deny Any applies!
   */
  evaluatePacket(
    acl: AccessControlList,
    srcIp: string,
    dstIp: string,
    protocol: 'ip' | 'icmp' | 'tcp' | 'udp' = 'ip',
    dstPort?: number
  ): { action: 'permit' | 'deny'; matchedRuleIndex: number; implicitDeny: boolean; rule?: AclRule } {
    if (!acl || !acl.rules || acl.rules.length === 0) {
      return { action: 'deny', matchedRuleIndex: -1, implicitDeny: true };
    }

    for (let i = 0; i < acl.rules.length; i++) {
      const rule = acl.rules[i];

      // 1. Protocol match: 'ip' in ACL matches any L3/L4 protocol
      if (rule.protocol && rule.protocol !== 'ip') {
        if (rule.protocol !== protocol) continue;
      }

      // 2. Source IP match with wildcard
      const srcMatches = rule.src === 'any' || this.matchesWildcard(srcIp, rule.src, rule.srcWildcard || '0.0.0.0');
      if (!srcMatches) continue;

      // 3. Destination IP match with wildcard
      const dstMatches = !rule.dst || rule.dst === 'any' || this.matchesWildcard(dstIp, rule.dst, rule.dstWildcard || '0.0.0.0');
      if (!dstMatches) continue;

      // 4. Destination Port match (for TCP/UDP)
      if (rule.dstPort !== undefined && dstPort !== undefined) {
        if (rule.dstPort !== dstPort) continue;
      }

      // Top-Down First Match Hit!
      rule.hits = (rule.hits || 0) + 1;
      return { action: rule.action, matchedRuleIndex: i, implicitDeny: false, rule };
    }

    // Strict Cisco IOS Implicit Deny Any
    return { action: 'deny', matchedRuleIndex: -1, implicitDeny: true };
  },

  /**
   * Checks inbound or outbound interface ACL on a device
   */
  checkInterfaceAcl(
    device: NetworkDevice,
    interfaceName: string,
    direction: 'in' | 'out',
    srcIp: string,
    dstIp: string,
    protocol: 'ip' | 'icmp' | 'tcp' | 'udp' = 'ip',
    dstPort?: number
  ): { permitted: boolean; reason?: string; aclId?: number | string; implicitDeny?: boolean } {
    const iface = device.ports[interfaceName];
    if (!iface) return { permitted: true };

    const boundAclId = direction === 'in' 
      ? (iface.aclIn ?? iface.aclGroup?.id) 
      : (iface.aclOut ?? iface.aclGroup?.id);

    if (!boundAclId) return { permitted: true };

    const router = device as any;
    const aclList: AccessControlList[] = router.acls || [];
    const targetAcl = aclList.find(a => String(a.id) === String(boundAclId));

    if (!targetAcl) return { permitted: true };

    const evalResult = this.evaluatePacket(targetAcl, srcIp, dstIp, protocol, dstPort);
    if (evalResult.action === 'deny') {
      const why = evalResult.implicitDeny
        ? `แพ็กเก็ตถูกปฏิเสธโดย Implicit Deny ท้าย ACL ${targetAcl.id} บน ${device.name} [${interfaceName}]`
        : `แพ็กเก็ตถูกปฏิเสธโดยกฎข้อที่ ${evalResult.matchedRuleIndex + 1} ของ ACL ${targetAcl.id} (deny) บน ${device.name}`;
      return { permitted: false, reason: why, aclId: targetAcl.id, implicitDeny: evalResult.implicitDeny };
    }

    return { permitted: true, aclId: targetAcl.id };
  }
};

