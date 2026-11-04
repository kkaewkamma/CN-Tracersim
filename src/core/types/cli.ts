export type CliMode = 
  | 'user'           // Router> or Switch>
  | 'privileged'     // Router# or Switch#
  | 'global'         // (config)#
  | 'interface'      // (config-if)#
  | 'line'           // (config-line)#
  | 'router_ospf'    // (config-router)#
  | 'dhcp_pool';     // (dhcp-config)#

export interface CliContext {
  mode: CliMode;
  currentInterface?: string;
  currentLine?: string;
  currentOspfProcess?: number;
  currentDhcpPool?: string;
}

export interface CliExecutionResult {
  output: string;
  prompt: string;
  context: CliContext;
  stateChanged: boolean;
  eventEmitted?: {
    type: 'COMMAND_EXECUTED' | 'CONFIG_CHANGED' | 'MODE_CHANGED';
    command: string;
    deviceName: string;
  };
}

export interface CiscoCommandRule {
  pattern: RegExp;
  allowedModes: CliMode[];
  handler: (match: RegExpMatchArray, context: CliContext, device: any) => { output: string; contextUpdate?: Partial<CliContext>; stateChanged?: boolean };
}
