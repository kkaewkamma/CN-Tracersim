import { describe, it, expect } from 'vitest';
import { IpMath } from '../../src/core/engine/ip-math';

describe('Core Engine: IpMath', () => {
  it('validates standard IPv4 addresses correctly', () => {
    expect(IpMath.isValidIPv4('192.168.1.1')).toBe(true);
    expect(IpMath.isValidIPv4('10.0.0.1')).toBe(true);
    expect(IpMath.isValidIPv4('255.255.255.255')).toBe(true);
    expect(IpMath.isValidIPv4('0.0.0.0')).toBe(true);

    expect(IpMath.isValidIPv4('256.0.0.1')).toBe(false);
    expect(IpMath.isValidIPv4('192.168.1')).toBe(false);
    expect(IpMath.isValidIPv4('abc.def.ghi.jkl')).toBe(false);
    expect(IpMath.isValidIPv4('')).toBe(false);
  });

  it('validates Subnet Masks correctly', () => {
    expect(IpMath.isValidMask('255.255.255.0')).toBe(true);
    expect(IpMath.isValidMask('255.255.255.192')).toBe(true);
    expect(IpMath.isValidMask('255.255.255.252')).toBe(true);
    expect(IpMath.isValidMask('0.0.0.0')).toBe(true);

    expect(IpMath.isValidMask('255.255.255.253')).toBe(false);
    expect(IpMath.isValidMask('255.0.255.0')).toBe(false);
  });

  it('converts CIDR and Subnet Mask bidirectionally', () => {
    expect(IpMath.maskToCidr('255.255.255.0')).toBe(24);
    expect(IpMath.maskToCidr('255.255.255.192')).toBe(26);
    expect(IpMath.maskToCidr('255.255.255.252')).toBe(30);

    expect(IpMath.cidrToMask(24)).toBe('255.255.255.0');
    expect(IpMath.cidrToMask(26)).toBe('255.255.255.192');
    expect(IpMath.cidrToMask(30)).toBe('255.255.255.252');
  });

  it('converts Mask to Wildcard Mask and vice versa', () => {
    expect(IpMath.maskToWildcard('255.255.255.0')).toBe('0.0.0.255');
    expect(IpMath.maskToWildcard('255.255.255.192')).toBe('0.0.0.63');
    expect(IpMath.maskToWildcard('255.255.255.252')).toBe('0.0.0.3');

    expect(IpMath.wildcardToMask('0.0.0.255')).toBe('255.255.255.0');
    expect(IpMath.wildcardToMask('0.0.0.3')).toBe('255.255.255.252');
  });

  it('calculates accurate VLSM Subnet Details for /26', () => {
    const details = IpMath.calculateSubnetDetails('192.168.10.75', 26);
    expect(details.networkAddress).toBe('192.168.10.64');
    expect(details.broadcastAddress).toBe('192.168.10.127');
    expect(details.firstHost).toBe('192.168.10.65');
    expect(details.lastHost).toBe('192.168.10.126');
    expect(details.usableHosts).toBe(62);
  });
});

