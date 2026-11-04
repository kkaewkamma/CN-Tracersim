import { NetworkDevice, NatTranslationEntry } from '../types';
import { IpMath } from './ip-math';
import { AclEngine } from './acl-engine';

export const NatEngine = {
  /**
   * Evaluates Dynamic PAT Overload and Static NAT when packet traverses from Inside to Outside interface
   */
  processOutboundTranslation(
    router: any,
    ingressPort: string,
    egressPort: string,
    srcIp: string,
    srcPort: number = 49152,
    protocol: 'tcp' | 'udp' | 'icmp' = 'icmp'
  ): { translated: boolean; translatedIp: string; translatedPort: number; entry?: NatTranslationEntry } {
    if (!router.natEnabled && !router.staticNat?.length) {
      return { translated: false, translatedIp: srcIp, translatedPort: srcPort };
    }

    const inPortObj = router.ports[ingressPort];
    const outPortObj = router.ports[egressPort];

    // Must be Inside -> Outside transition
    const isInside = inPortObj && (inPortObj.nat === 'inside' || inPortObj.natRole === 'inside');
    const isOutside = outPortObj && (outPortObj.nat === 'outside' || outPortObj.natRole === 'outside');

    if (!isInside || !isOutside) {
      return { translated: false, translatedIp: srcIp, translatedPort: srcPort };
    }

    if (!router.natTranslations) router.natTranslations = [];

    // 1. Static NAT Match (1:1)
    if (router.staticNat && router.staticNat.length > 0) {
      const staticMatch = router.staticNat.find((s: any) => s.insideLocal === srcIp);
      if (staticMatch) {
        let existing = router.natTranslations.find((t: any) => t.insideLocal === srcIp && t.insideGlobal === staticMatch.insideGlobal);
        if (!existing) {
          existing = {
            insideLocal: srcIp,
            insideGlobal: staticMatch.insideGlobal,
            protocol,
            createdAt: Date.now(),
            hits: 1
          };
          router.natTranslations.push(existing);
        } else {
          existing.hits++;
        }
        return { translated: true, translatedIp: staticMatch.insideGlobal, translatedPort: srcPort, entry: existing };
      }
    }

    // 2. PAT Overload (ip nat inside source list <acl> interface <out> overload)
    if (router.natRule) {
      const aclId = router.natRule.aclId;
      const targetAcl = (router.acls || []).find((a: any) => String(a.id) === String(aclId));

      let aclPermitted = true;
      if (targetAcl) {
        const evalRes = AclEngine.evaluatePacket(targetAcl, srcIp, 'any', protocol);
        aclPermitted = (evalRes.action === 'permit');
      }

      if (aclPermitted) {
        const outsidePublicIp = outPortObj.ip || '203.0.113.1';

        // Check existing stateful PAT session
        let session = router.natTranslations.find((t: any) =>
          t.insideLocal === srcIp &&
          t.localPort === srcPort &&
          t.protocol === protocol
        );

        if (!session) {
          // Allocate unique source port
          const usedPorts = router.natTranslations.map((t: any) => t.globalPort).filter(Boolean);
          let allocPort = Math.max(1024, srcPort);
          while (usedPorts.includes(allocPort)) {
            allocPort++;
          }

          session = {
            insideLocal: srcIp,
            insideGlobal: outsidePublicIp,
            localPort: srcPort,
            globalPort: allocPort,
            protocol,
            createdAt: Date.now(),
            hits: 1
          };
          router.natTranslations.push(session);
        } else {
          session.hits++;
        }

        return {
          translated: true,
          translatedIp: session.insideGlobal,
          translatedPort: session.globalPort || srcPort,
          entry: session
        };
      }
    }

    return { translated: false, translatedIp: srcIp, translatedPort: srcPort };
  },

  /**
   * Reverse NAT translation on the Return Path (Outside -> Inside)
   */
  processInboundReverseTranslation(
    router: any,
    ingressPort: string,
    egressPort: string,
    dstIp: string,
    dstPort?: number,
    protocol: 'tcp' | 'udp' | 'icmp' = 'icmp'
  ): { unTranslated: boolean; originalIp: string; originalPort?: number } {
    if (!router.natTranslations || router.natTranslations.length === 0) {
      return { unTranslated: false, originalIp: dstIp, originalPort: dstPort };
    }

    const inPortObj = router.ports[ingressPort];
    const outPortObj = router.ports[egressPort];

    // Outside -> Inside transition
    const isOutside = inPortObj && (inPortObj.nat === 'outside' || inPortObj.natRole === 'outside');
    const isInside = outPortObj && (outPortObj.nat === 'inside' || outPortObj.natRole === 'inside');

    if (!isOutside || !isInside) {
      return { unTranslated: false, originalIp: dstIp, originalPort: dstPort };
    }

    // Match Translation Table by (InsideGlobal == dstIp && globalPort == dstPort)
    const match = router.natTranslations.find((t: any) => {
      if (t.insideGlobal !== dstIp) return false;
      if (dstPort !== undefined && t.globalPort !== undefined) {
        return t.globalPort === dstPort;
      }
      return true;
    });

    if (match) {
      return {
        unTranslated: true,
        originalIp: match.insideLocal,
        originalPort: match.localPort ?? dstPort
      };
    }

    return { unTranslated: false, originalIp: dstIp, originalPort: dstPort };
  }
};

