import React, { useState } from 'react';
import { NetworkDevice } from '@core/types';
import { useTopologyStore } from '@application/stores/useTopologyStore';
import { 
  X, Settings, Network, Route, Shield, Cpu, 
  Power, Check
} from 'lucide-react';

interface DeviceConfigModalProps {
  device: NetworkDevice;
  onClose: () => void;
}

export const DeviceConfigModal: React.FC<DeviceConfigModalProps> = ({ device, onClose }) => {
  const { updateDevice, updateInterface } = useTopologyStore();
  const [activeTab, setActiveTab] = useState<'interfaces' | 'routing' | 'security' | 'services'>('interfaces');
  const [selectedPort, setSelectedPort] = useState<string>(Object.keys(device.ports)[0] || '');

  // Static Route Form State
  const [newRoute, setNewRoute] = useState({ network: '', mask: '255.255.255.0', nextHop: '' });

  // OSPF Network Form State
  const [newOspfNet, setNewOspfNet] = useState({ network: '', wildcard: '0.0.0.255', areaId: 0 });

  // ACL Rule Form State
  const [newAclRule, setNewAclRule] = useState({
    aclId: 100,
    action: 'permit' as 'permit' | 'deny',
    protocol: 'ip' as 'ip' | 'icmp' | 'tcp' | 'udp',
    src: 'any',
    srcWildcard: '0.0.0.0',
    dst: 'any',
    dstWildcard: '0.0.0.0',
    dstPort: ''
  });

  // DHCP Form State
  const [dhcpForm, setDhcpForm] = useState({
    name: (device as any).dhcpPool?.name || 'LAN_POOL',
    network: (device as any).dhcpPool?.network || '',
    mask: (device as any).dhcpPool?.mask || '255.255.255.0',
    defaultRouter: (device as any).dhcpPool?.defaultRouter || '',
    dnsServer: (device as any).dhcpPool?.dnsServer || '8.8.8.8'
  });

  const port = device.ports[selectedPort];

  const handleTogglePortPower = () => {
    if (!port) return;
    updateInterface(device.id, selectedPort, (p) => ({ ...p, up: !p.up }));
  };

  const handleUpdatePortField = (field: string, value: any) => {
    updateInterface(device.id, selectedPort, (p) => ({ ...p, [field]: value }));
  };

  const handleAddStaticRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoute.network || !newRoute.mask) return;
    const currentRoutes = (device as any).routes || [];
    updateDevice(device.id, (d) => ({
      ...d,
      routes: [...currentRoutes, { ...newRoute }]
    }));
    setNewRoute({ network: '', mask: '255.255.255.0', nextHop: '' });
  };

  const handleRemoveStaticRoute = (idx: number) => {
    const currentRoutes = (device as any).routes || [];
    updateDevice(device.id, (d) => ({
      ...d,
      routes: currentRoutes.filter((_: any, i: number) => i !== idx)
    }));
  };

  const handleAddOspfNetwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOspfNet.network) return;
    const currentOspf = (device as any).ospf || { processId: 1, networks: [] };
    const currentNets = currentOspf.networks || [];
    updateDevice(device.id, (d) => ({
      ...d,
      ospf: {
        ...currentOspf,
        processId: currentOspf.processId || 1,
        networks: [...currentNets, { ...newOspfNet }]
      }
    }));
    setNewOspfNet({ network: '', wildcard: '0.0.0.255', areaId: 0 });
  };

  const handleRemoveOspfNetwork = (idx: number) => {
    const currentOspf = (device as any).ospf || { processId: 1, networks: [] };
    const currentNets = currentOspf.networks || [];
    updateDevice(device.id, (d) => ({
      ...d,
      ospf: {
        ...currentOspf,
        networks: currentNets.filter((_: any, i: number) => i !== idx)
      }
    }));
  };

  const handleAddAclRule = (e: React.FormEvent) => {
    e.preventDefault();
    const currentAcls: any[] = (device as any).acls ? [...(device as any).acls] : [];
    let targetAcl = currentAcls.find(a => Number(a.id) === Number(newAclRule.aclId));
    if (!targetAcl) {
      targetAcl = {
        id: Number(newAclRule.aclId),
        type: Number(newAclRule.aclId) < 100 ? 'standard' : 'extended',
        rules: []
      };
      currentAcls.push(targetAcl);
    }
    const ruleObj: any = {
      id: `${targetAcl.id}-${targetAcl.rules.length + 1}`,
      action: newAclRule.action,
      protocol: newAclRule.protocol,
      src: newAclRule.src,
      srcWildcard: newAclRule.src === 'any' ? '255.255.255.255' : newAclRule.srcWildcard,
      dst: newAclRule.dst,
      dstWildcard: newAclRule.dst === 'any' ? '255.255.255.255' : newAclRule.dstWildcard,
      hits: 0
    };
    if (newAclRule.dstPort) {
      ruleObj.dstPort = parseInt(newAclRule.dstPort, 10);
    }
    targetAcl.rules.push(ruleObj);

    updateDevice(device.id, (d) => ({
      ...d,
      acls: currentAcls
    }));
  };

  const handleRemoveAclRule = (aclId: any, ruleIdx: number) => {
    const currentAcls: any[] = (device as any).acls ? JSON.parse(JSON.stringify((device as any).acls)) : [];
    const targetAcl = currentAcls.find(a => Number(a.id) === Number(aclId));
    if (targetAcl) {
      targetAcl.rules.splice(ruleIdx, 1);
      const filteredAcls = currentAcls.filter(a => a.rules.length > 0);
      updateDevice(device.id, (d) => ({
        ...d,
        acls: filteredAcls
      }));
    }
  };

  const handleSaveDhcpPool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dhcpForm.network) return;
    updateDevice(device.id, (d) => ({
      ...d,
      dhcpPool: { ...dhcpForm }
    }));
  };

  const handleClearDhcpPool = () => {
    updateDevice(device.id, (d) => {
      const copy = { ...d };
      delete (copy as any).dhcpPool;
      return copy;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b1017] border border-cisco-border rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
              <Settings size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{device.name}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {device.type.toUpperCase()}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">GUI Device Configuration Panel (Zustand Integrated)</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-white bg-slate-800 flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-5 border-b border-slate-800 bg-slate-950/60 gap-2">
          <button
            onClick={() => setActiveTab('interfaces')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'interfaces'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network size={14} />
            <span>Interfaces & Ports</span>
          </button>

          {device.type === 'router' && (
            <button
              onClick={() => setActiveTab('routing')}
              className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'routing'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Route size={14} />
              <span>Routing & OSPF</span>
            </button>
          )}

          {device.type === 'router' && (
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                activeTab === 'security'
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield size={14} />
              <span>ACL Firewall & NAT</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('services')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'services'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu size={14} />
            <span>General & Gateway</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#070b12]">
          {/* TAB 1: Interfaces */}
          {activeTab === 'interfaces' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-full">
              {/* Port List */}
              <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-3 space-y-1.5 overflow-y-auto">
                <div className="text-[11px] font-mono font-bold text-slate-400 px-2 pb-1">PORTS / INTERFACES</div>
                {Object.keys(device.ports).map((pName) => {
                  const p = device.ports[pName];
                  const isSel = selectedPort === pName;
                  return (
                    <button
                      key={pName}
                      onClick={() => setSelectedPort(pName)}
                      className={`w-full p-2.5 rounded-xl text-left font-mono text-xs border flex items-center justify-between transition ${
                        isSel
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <span>{pName}</span>
                      <span className={`w-2 h-2 rounded-full ${p.up ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Port Editor */}
              {port ? (
                <div className="md:col-span-2 border border-slate-800 rounded-2xl bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-base text-white">{port.name || selectedPort}</h3>
                      <p className="text-xs font-mono text-slate-400">MAC: {port.mac || '00:00:00:00:00:00'}</p>
                    </div>
                    <button
                      onClick={handleTogglePortPower}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        port.up
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      <Power size={13} />
                      <span>{port.up ? 'Port UP (no shutdown)' : 'Port DOWN (shutdown)'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* IP & Subnet */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">IP Address</label>
                      <input
                        type="text"
                        value={port.ip || ''}
                        onChange={(e) => handleUpdatePortField('ip', e.target.value)}
                        placeholder="e.g. 192.168.10.1"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Subnet Mask</label>
                      <input
                        type="text"
                        value={port.mask || '255.255.255.0'}
                        onChange={(e) => handleUpdatePortField('mask', e.target.value)}
                        placeholder="e.g. 255.255.255.0"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Switch Port Mode (Access / Trunk) */}
                    {device.type === 'switch' && (
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 font-medium">Switchport Mode</label>
                        <select
                          value={port.mode || 'access'}
                          onChange={(e) => handleUpdatePortField('mode', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                        >
                          <option value="access">Access</option>
                          <option value="trunk">802.1Q Trunk</option>
                        </select>
                      </div>
                    )}

                    {/* VLAN ID */}
                    {device.type === 'switch' && port.mode !== 'trunk' && (
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 font-medium">VLAN ID</label>
                        <input
                          type="number"
                          value={port.vlan || 1}
                          onChange={(e) => handleUpdatePortField('vlan', parseInt(e.target.value, 10))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    )}

                    {/* NAT Role */}
                    {device.type === 'router' && (
                      <div className="space-y-1">
                        <label className="text-xs text-slate-300 font-medium">NAT Role</label>
                        <select
                          value={(port as any).nat || ''}
                          onChange={(e) => handleUpdatePortField('nat', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                        >
                          <option value="">None (Disabled)</option>
                          <option value="inside">ip nat inside</option>
                          <option value="outside">ip nat outside</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="md:col-span-2 flex items-center justify-center text-slate-500 text-xs">
                  เลือก Interface จากรายการทางซ้ายเพื่อแก้ไขการตั้งค่า
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Routing & OSPF */}
          {activeTab === 'routing' && device.type === 'router' && (
            <div className="space-y-6">
              {/* Static Routes */}
              <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-4 space-y-3">
                <div className="font-bold text-sm text-cyan-300">Static Routes (ip route)</div>
                <form onSubmit={handleAddStaticRoute} className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Network (e.g. 192.168.30.0)"
                    value={newRoute.network}
                    onChange={(e) => setNewRoute({ ...newRoute, network: e.target.value })}
                    className="flex-1 min-w-[140px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                  />
                  <input
                    type="text"
                    placeholder="Mask (e.g. 255.255.255.0)"
                    value={newRoute.mask}
                    onChange={(e) => setNewRoute({ ...newRoute, mask: e.target.value })}
                    className="w-36 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                  />
                  <input
                    type="text"
                    placeholder="Next Hop / Interface"
                    value={newRoute.nextHop}
                    onChange={(e) => setNewRoute({ ...newRoute, nextHop: e.target.value })}
                    className="w-36 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                  >
                    + เพิ่ม Route
                  </button>
                </form>

                <div className="space-y-1 max-h-40 overflow-y-auto pt-2">
                  {((device as any).routes || []).map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300"
                    >
                      <span>ip route {r.network} {r.mask} {r.nextHop || r.interfaceName || ''}</span>
                      <button
                        onClick={() => handleRemoveStaticRoute(idx)}
                        className="text-rose-400 hover:text-rose-300 text-[11px] font-sans"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                  {(!((device as any).routes) || (device as any).routes.length === 0) && (
                    <div className="text-xs text-slate-500 italic">ยังไม่มี Static Route</div>
                  )}
                </div>
              </div>

              {/* OSPF Config */}
              <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-emerald-300">OSPFv2 Dynamic Routing (router ospf 1)</div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={!!((device as any).ospf?.processId)}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        updateDevice(device.id, (d) => ({
                          ...d,
                          ospf: {
                            ...(d as any).ospf,
                            processId: enabled ? 1 : null,
                            networks: enabled ? ((d as any).ospf?.networks || []) : []
                          }
                        }));
                      }}
                      className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-slate-300">เปิดใช้งาน OSPF Process 1</span>
                  </label>
                </div>

                {((device as any).ospf?.processId) && (
                  <div className="space-y-3 pt-2">
                    <form onSubmit={handleAddOspfNetwork} className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        placeholder="Network (e.g. 192.168.10.0)"
                        value={newOspfNet.network}
                        onChange={(e) => setNewOspfNet({ ...newOspfNet, network: e.target.value })}
                        className="flex-1 min-w-[140px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300"
                      />
                      <input
                        type="text"
                        placeholder="Wildcard (e.g. 0.0.0.255)"
                        value={newOspfNet.wildcard}
                        onChange={(e) => setNewOspfNet({ ...newOspfNet, wildcard: e.target.value })}
                        className="w-32 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300"
                      />
                      <input
                        type="number"
                        placeholder="Area (e.g. 0)"
                        value={newOspfNet.areaId}
                        onChange={(e) => setNewOspfNet({ ...newOspfNet, areaId: parseInt(e.target.value, 10) || 0 })}
                        className="w-20 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                      >
                        + เพิ่ม Network
                      </button>
                    </form>

                    <div className="text-xs text-slate-300">OSPF Area Networks:</div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {((device as any).ospf?.networks || []).map((n: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                          <span>network {n.network} {n.wildcard} area {n.areaId ?? n.area ?? 0}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveOspfNetwork(idx)}
                            className="text-rose-400 hover:text-rose-300 text-[11px] font-sans"
                          >
                            ลบ
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACL & NAT */}
          {activeTab === 'security' && device.type === 'router' && (
            <div className="space-y-6">
              {/* NAT Overload */}
              <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-purple-300">NAT / PAT Overload</div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={!!(device as any).natEnabled}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        updateDevice(device.id, (d) => ({
                          ...d,
                          natEnabled: enabled
                        }));
                      }}
                      className="rounded bg-slate-950 border-slate-700 text-purple-500 focus:ring-0"
                    />
                    <span className="text-slate-300">เปิดใช้งาน NAT Overload</span>
                  </label>
                </div>
                <p className="text-xs text-slate-400">
                  ต้องกำหนด <span className="font-mono text-cyan-300">ip nat inside</span> บนพอร์ต LAN และ{' '}
                  <span className="font-mono text-cyan-300">ip nat outside</span> บนพอร์ต WAN
                </p>
              </div>

              {/* ACL Rules List & Creator Form */}
              <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-4 space-y-3">
                <div className="font-bold text-sm text-amber-300">Access Control Lists (ACL) Form</div>
                <form onSubmit={handleAddAclRule} className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">ACL ID</label>
                    <input
                      type="number"
                      value={newAclRule.aclId}
                      onChange={(e) => setNewAclRule({ ...newAclRule, aclId: parseInt(e.target.value, 10) || 100 })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Action</label>
                    <select
                      value={newAclRule.action}
                      onChange={(e) => setNewAclRule({ ...newAclRule, action: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                    >
                      <option value="permit">PERMIT</option>
                      <option value="deny">DENY</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Protocol</label>
                    <select
                      value={newAclRule.protocol}
                      onChange={(e) => setNewAclRule({ ...newAclRule, protocol: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                    >
                      <option value="ip">IP (Any Layer 3)</option>
                      <option value="icmp">ICMP (Ping)</option>
                      <option value="tcp">TCP (HTTP/HTTPS)</option>
                      <option value="udp">UDP (DNS/DHCP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Destination Port</label>
                    <input
                      type="text"
                      placeholder="e.g. 80"
                      value={newAclRule.dstPort}
                      onChange={(e) => setNewAclRule({ ...newAclRule, dstPort: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Source IP / any</label>
                    <input
                      type="text"
                      value={newAclRule.src}
                      onChange={(e) => setNewAclRule({ ...newAclRule, src: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Source Wildcard</label>
                    <input
                      type="text"
                      value={newAclRule.srcWildcard}
                      onChange={(e) => setNewAclRule({ ...newAclRule, srcWildcard: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Destination IP / any</label>
                    <input
                      type="text"
                      value={newAclRule.dst}
                      onChange={(e) => setNewAclRule({ ...newAclRule, dst: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      + เพิ่มกฎ ACL
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {((device as any).acls || []).map((acl: any) => (
                    <div key={acl.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <div className="font-bold text-xs font-mono text-amber-300">
                        access-list {acl.id} ({acl.type})
                      </div>
                      <div className="space-y-1 text-xs font-mono text-slate-300">
                        {(acl.rules || []).map((r: any, rIdx: number) => (
                          <div key={rIdx} className="flex items-center justify-between pl-2 border-l border-slate-800">
                            <span>
                              {r.action.toUpperCase()} {r.protocol.toUpperCase()} {r.src} {r.srcWildcard} {'->'} {r.dst} {r.dstWildcard} {r.dstPort ? `eq ${r.dstPort}` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAclRule(acl.id, rIdx)}
                              className="text-rose-400 hover:text-rose-300 text-[11px] font-sans ml-2"
                            >
                              ลบ
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(!((device as any).acls) || (device as any).acls.length === 0) && (
                    <div className="text-xs text-slate-500 italic">ยังไม่ได้สร้าง Access Control List (ใช้ฟอร์มด้านบนเพื่อเพิ่มกฎ)</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: General & Gateway */}
          {activeTab === 'services' && (
            <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">ชื่ออุปกรณ์ (Hostname)</label>
                <input
                  type="text"
                  value={device.name}
                  onChange={(e) => updateDevice(device.id, (d) => ({ ...d, name: e.target.value }))}
                  className="w-full max-w-sm px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {(device.type === 'pc' || device.type === 'server') && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Default Gateway</label>
                  <input
                    type="text"
                    value={device.gateway || ''}
                    onChange={(e) => updateDevice(device.id, (d) => ({ ...d, gateway: e.target.value }))}
                    placeholder="e.g. 192.168.10.1"
                    className="w-full max-w-sm px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {device.type === 'switch' && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Enable Secret Password</label>
                  <input
                    type="password"
                    value={(device as any).enableSecret || ''}
                    onChange={(e) => updateDevice(device.id, (d) => ({ ...d, enableSecret: e.target.value } as any))}
                    placeholder="cisco / class"
                    className="w-full max-w-sm px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {device.type === 'router' && (
                <div className="border border-slate-800 rounded-2xl bg-slate-900/60 p-4 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-sky-300">Cisco IOS DHCP Server Pool</div>
                    {(device as any).dhcpPool && (
                      <button
                        type="button"
                        onClick={handleClearDhcpPool}
                        className="text-rose-400 hover:text-rose-300 text-xs font-semibold"
                      >
                        ลบ DHCP Pool
                      </button>
                    )}
                  </div>
                  <form onSubmit={handleSaveDhcpPool} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Pool Name</label>
                      <input
                        type="text"
                        value={dhcpForm.name}
                        onChange={(e) => setDhcpForm({ ...dhcpForm, name: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Network Address</label>
                      <input
                        type="text"
                        placeholder="e.g. 192.168.1.0"
                        value={dhcpForm.network}
                        onChange={(e) => setDhcpForm({ ...dhcpForm, network: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Subnet Mask</label>
                      <input
                        type="text"
                        placeholder="255.255.255.0"
                        value={dhcpForm.mask}
                        onChange={(e) => setDhcpForm({ ...dhcpForm, mask: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">Default Router (Gateway)</label>
                      <input
                        type="text"
                        placeholder="e.g. 192.168.1.1"
                        value={dhcpForm.defaultRouter}
                        onChange={(e) => setDhcpForm({ ...dhcpForm, defaultRouter: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs"
                      >
                        บันทึก DHCP Server Pool
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">การเปลี่ยนแปลงจะบันทึกลง Zustand Store ทันที</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>เสร็จสิ้น</span>
          </button>
        </div>
      </div>
    </div>
  );
};

