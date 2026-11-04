export interface OsiLayerInfo {
  layer: number;
  name: string;
  inInfo: string;
  outInfo: string;
}

export interface OsiSimulationStep {
  step: number;
  device: string;
  type: string;
  port: string;
  desc: string;
  status: 'ok' | 'denied' | 'routing' | 'switching' | 'nat' | 'arp';
  details: string;
  tagged?: boolean;
  vlan?: number;
  layers?: OsiLayerInfo[];
}

export interface SimulationResult {
  success: boolean;
  reason: string;
  hops: string[];
  osiSteps: OsiSimulationStep[];
  aclBlocked?: boolean;
  natTranslated?: boolean;
}

export interface DhcpDoraStep {
  stepName: 'DISCOVER' | 'OFFER' | 'REQUEST' | 'ACK';
  device: string;
  details: string;
  serverIp?: string;
  assignedIp?: string;
}

export interface DhcpLeaseResult {
  success: boolean;
  ip?: string;
  mask?: string;
  gateway?: string;
  dns?: string;
  poolExhausted?: boolean;
  reason?: string;
  doraSteps: DhcpDoraStep[];
}

