// ============================================================================
// CN-Tracersim Core Domain Models (Pure TypeScript - No UI/DOM dependencies)
// ============================================================================

export type DeviceType = 'router' | 'switch' | 'pc' | 'server' | 'cloud';

export type PortMedium = 'FastEthernet' | 'GigabitEthernet' | 'Serial' | 'Loopback' | 'SVI';
export type SwitchPortMode = 'access' | 'trunk';
export type PortSecurityViolation = 'protect' | 'restrict' | 'shutdown';

export interface PortSecurityConfig {
  enabled: boolean;
  maximum: number;
  violation: PortSecurityViolation;
  sticky: boolean;
  secureMacs: string[];
  violationCount: number;
}

export interface NetworkInterface {
  name: string; // e.g. "Gig0/0", "Fa0/1", "Gig0/0.10"
  medium?: PortMedium;
  mac: string;
  ip: string;
  mask: string;
  up: boolean;
  errDisabled?: boolean;
  vlan?: number;
  mode?: SwitchPortMode;
  nativeVlan?: number;
  allowedVlans?: number[];
  isSubIf?: boolean;
  parentPort?: string;
  nat?: 'inside' | 'outside' | null;
  natRole?: 'inside' | 'outside' | null;
  aclIn?: number | string | null;
  aclOut?: number | string | null;
  aclGroup?: { id: number | string; direction: 'in' | 'out' };
  ospfCost?: number;
  portfast?: boolean;
  bpduGuard?: boolean;
  channelGroup?: { id: number; mode: 'active' | 'passive' | 'desirable' | 'auto' | 'on' };
  portSecurity?: PortSecurityConfig;
}

export interface RouteEntry {
  network: string;
  mask: string;
  nextHop?: string;
  interfaceName?: string;
  type: 'connected' | 'static' | 'ospf';
  administrativeDistance: number;
  metric: number;
}

export interface RoutingTable {
  routes: RouteEntry[];
}

export interface AclRule {
  id: number | string;
  action: 'permit' | 'deny';
  protocol: 'ip' | 'icmp' | 'tcp' | 'udp';
  src: string;
  srcWildcard: string;
  dst: string;
  dstWildcard: string;
  dstPort?: number;
  hits: number;
}

export interface AccessControlList {
  id: number | string;
  type: 'standard' | 'extended';
  rules: AclRule[];
}

export interface NatTranslationEntry {
  insideLocal: string;
  insideGlobal: string;
  outsideLocal?: string;
  outsideGlobal?: string;
  protocol?: 'tcp' | 'udp' | 'icmp';
  localPort?: number;
  globalPort?: number;
  createdAt: number;
  hits: number;
}

export interface OspfNetworkAreaConfig {
  network: string;
  wildcard: string;
  areaId: number;
  area?: number;
}

export interface OspfConfiguration {
  processId: number | null;
  routerId?: string;
  networks: OspfNetworkAreaConfig[];
  neighbors?: Array<{
    neighborId: string;
    neighborIp: string;
    state: 'DOWN' | 'INIT' | '2-WAY' | 'EXSTART' | 'EXCHANGE' | 'LOADING' | 'FULL';
    role?: 'DR' | 'BDR' | 'DROTHER';
  }>;
}

export interface DhcpPoolConfig {
  name: string;
  network: string;
  mask: string;
  defaultRouter: string;
  dnsServer: string;
}

export interface DhcpLeaseRecord {
  mac: string;
  ip: string;
  clientHostname?: string;
  leaseExpires?: number;
}

export interface BaseNetworkDevice {
  id: string;
  type: DeviceType;
  name: string;
  x: number;
  y: number;
  ports: Record<string, NetworkInterface>;
  gateway: string;
  arpTable?: Record<string, string>;
  enableSecret?: string;
  passwordEncryption?: boolean;
}

export interface RouterDevice extends BaseNetworkDevice {
  type: 'router';
  routes: Array<{ network: string; mask: string; nextHop?: string; interfaceName?: string }>;
  acls: AccessControlList[];
  ospf: OspfConfiguration;
  natEnabled: boolean;
  natRule?: { aclId: number | string; outInterface: string; overload: boolean };
  natTranslations: NatTranslationEntry[];
  staticNat?: Array<{ insideLocal: string; insideGlobal: string }>;
  dhcpPools: DhcpPoolConfig[];
  dhcpExcluded: Array<{ low: string; high: string }>;
  dhcpBindings?: DhcpLeaseRecord[];
}

export interface SwitchDevice extends BaseNetworkDevice {
  type: 'switch';
  macTable: Array<{ mac: string; port: string; vlan: number; type: 'DYNAMIC' | 'STATIC'; timestamp?: number }>;
  vlans: Record<number, string>;
  stpPriority?: number;
  portChannels?: Record<number, { mode: string; members: string[] }>;
}

export interface HostDevice extends BaseNetworkDevice {
  type: 'pc' | 'server' | 'cloud';
}

export type NetworkDevice = RouterDevice | SwitchDevice | HostDevice;

export interface NetworkCable {
  id: string;
  from: string;
  fromPort: string;
  to: string;
  toPort: string;
  cableType?: 'copper-straight' | 'copper-cross' | 'fiber';
}

export interface NetworkTopology {
  version: string;
  presetId?: string;
  devices: NetworkDevice[];
  cables: NetworkCable[];
  counters?: { router: number; switch: number; pc: number; server: number; cloud: number };
}

