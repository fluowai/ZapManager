import React, { useState, useEffect } from "react";
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Settings, 
  MessageSquare, 
  Activity, 
  Smartphone, 
  Globe, 
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Power,
  Bell,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Instance {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "connecting" | "error";
  phone?: string;
  webhook_url?: string;
  alert_enabled: number;
  alert_email?: string;
  created_at: string;
}

interface DashboardProps {
  token: string;
  userRole: string;
}

export function Dashboard({ token, userRole }: DashboardProps) {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newWebhook, setNewWebhook] = useState("");
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editAlertEmail, setEditAlertEmail] = useState("");
  const [editAlertEnabled, setEditAlertEnabled] = useState(false);

  const fetchInstances = async () => {
    try {
      const res = await fetch("/api/instances", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInstances(data);
      }
    } catch (err) {
      console.error("Failed to fetch instances", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(fetchInstances, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const createInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    try {
      const res = await fetch("/api/instances", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, webhook_url: newWebhook }),
      });
      if (res.ok) {
        setNewName("");
        setNewWebhook("");
        setIsModalOpen(false);
        fetchInstances();
      }
    } catch (err) {
      console.error("Failed to create instance", err);
    }
  };

  const deleteInstance = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta instância?")) return;
    try {
      await fetch(`/api/instances/${id}`, { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchInstances();
    } catch (err) {
      console.error("Failed to delete instance", err);
    }
  };

  const toggleInstance = async (id: string) => {
    try {
      await fetch(`/api/instances/${id}/toggle`, { 
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchInstances();
    } catch (err) {
      console.error("Failed to toggle instance", err);
    }
  };

  const restartInstance = async (id: string) => {
    try {
      await fetch(`/api/instances/${id}/restart`, { 
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchInstances();
    } catch (err) {
      console.error("Failed to restart instance", err);
    }
  };

  const updateInstanceSettings = async () => {
    if (!selectedInstance) return;
    try {
      const res = await fetch(`/api/instances/${selectedInstance.id}/settings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          phone: editPhone, 
          alert_enabled: editAlertEnabled, 
          alert_email: editAlertEmail 
        }),
      });
      if (res.ok) {
        fetchInstances();
        setSelectedInstance(null);
      }
    } catch (err) {
      console.error("Failed to update settings", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Visão geral das suas instâncias e conexões.</p>
        </div>

        {userRole === "administrator" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 text-sm"
          >
            <Plus size={18} />
            Nova Instância
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total" 
          value={instances.length.toString()} 
          icon={<Globe className="text-blue-400" />}
        />
        <StatCard 
          label="Online" 
          value={instances.filter(i => i.status === "connected").length.toString()} 
          icon={<CheckCircle2 className="text-emerald-400" />}
        />
        <StatCard 
          label="Erros" 
          value={instances.filter(i => i.status === "error").length.toString()} 
          icon={<AlertCircle className="text-red-400" />}
        />
        <StatCard 
          label="Uptime" 
          value="99.9%" 
          icon={<Activity className="text-purple-400" />}
        />
      </div>

      {/* Instances Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Smartphone size={18} className="text-zinc-500" />
            Instâncias Ativas
          </h2>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="status-dot status-connected" /> Online
            </span>
            <span className="flex items-center gap-1.5">
              <span className="status-dot bg-red-500" /> Erro
            </span>
            <span className="flex items-center gap-1.5">
              <span className="status-dot status-connecting" /> Pendente
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : instances.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-3xl">
            <div className="bg-zinc-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smartphone className="text-zinc-600" size={20} />
            </div>
            <h3 className="text-lg font-bold mb-1 text-white">Nenhuma instância</h3>
            <p className="text-zinc-500 text-sm">Crie sua primeira instância para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {instances.map((instance) => (
                <motion.div
                  key={instance.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "group relative bg-[#141417] border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all",
                    instance.status === "error" && "border-red-500/30 bg-red-500/[0.02]"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-emerald-400 transition-colors text-white">
                        {instance.name}
                      </h3>
                      <p className="text-xs font-mono text-zinc-500 mt-1">ID: {instance.id}</p>
                    </div>
                    <div className={cn(
                      "status-dot",
                      instance.status === "connected" && "status-connected",
                      instance.status === "disconnected" && "status-disconnected",
                      instance.status === "connecting" && "status-connecting",
                      instance.status === "error" && "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]",
                    )} />
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Status</span>
                      <span className={cn(
                        "font-medium capitalize",
                        instance.status === "connected" ? "text-emerald-400" : 
                        instance.status === "error" ? "text-red-500" : "text-zinc-400"
                      )}>
                        {instance.status === "connecting" ? "Conectando..." : 
                         instance.status === "error" ? "Erro" : instance.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Número</span>
                      <span className="font-mono text-zinc-300">{instance.phone || "---"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Alertas</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        instance.alert_enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                      )}>
                        {instance.alert_enabled ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => toggleInstance(instance.id)}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                        instance.status === "connected" 
                          ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
                          : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      )}
                    >
                      <Power size={16} />
                      {instance.status === "connected" ? "Desligar" : "Ligar"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInstance(instance);
                        setEditPhone(instance.phone || "");
                        setEditAlertEmail(instance.alert_email || "");
                        setEditAlertEnabled(!!instance.alert_enabled);
                      }}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all"
                    >
                      <Settings size={16} />
                      Gerenciar
                    </button>
                  </div>

                  {instance.status !== "disconnected" && (
                    <button
                      onClick={() => restartInstance(instance.id)}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all"
                    >
                      <RefreshCw size={14} />
                      Reinicialização Remota
                    </button>
                  )}

                  {userRole === "administrator" && (
                    <button
                      onClick={() => deleteInstance(instance.id)}
                      className="absolute -top-2 -right-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-full text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#141417] border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Nova Instância</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={createInstance} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Nome da Instância</label>
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Suporte Vendas"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">URL do Webhook (Opcional)</label>
                  <input
                    type="url"
                    value={newWebhook}
                    onChange={(e) => setNewWebhook(e.target.value)}
                    placeholder="https://seu-api.com/webhook"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98]"
                >
                  Criar Instância
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedInstance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInstance(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#141417] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedInstance.name}</h2>
                  <p className="text-zinc-500 font-mono text-sm">ID: {selectedInstance.id}</p>
                </div>
                <button onClick={() => setSelectedInstance(null)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Configurações da Instância</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-zinc-500 flex items-center gap-2 mb-2">
                          <Smartphone size={12} /> Número de Telefone
                        </label>
                        <input 
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Ex: 5511999999999"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-white"
                        />
                      </div>
                      
                      <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Bell size={18} className={editAlertEnabled ? "text-emerald-500" : "text-zinc-500"} />
                            <span className="text-sm font-bold text-zinc-200">Ativar Alertas</span>
                          </div>
                          <button 
                            onClick={() => setEditAlertEnabled(!editAlertEnabled)}
                            className={cn(
                              "w-10 h-5 rounded-full relative transition-colors",
                              editAlertEnabled ? "bg-emerald-500" : "bg-zinc-700"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                              editAlertEnabled ? "right-1" : "left-1"
                            )} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-zinc-500 flex items-center gap-2 mb-2">
                          <Mail size={12} /> Email para Notificação
                        </label>
                        <input 
                          type="email"
                          value={editAlertEmail}
                          onChange={(e) => setEditAlertEmail(e.target.value)}
                          placeholder="alerta@empresa.com"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={updateInstanceSettings}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
                  >
                    Salvar Alterações
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Conexão</h3>
                    {selectedInstance.status === "connected" ? (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center">
                        <CheckCircle2 className="text-emerald-500 w-12 h-12 mx-auto mb-4" />
                        <p className="font-bold text-emerald-500">Instância Conectada</p>
                        <p className="text-zinc-400 text-sm mt-1">{selectedInstance.phone}</p>
                      </div>
                    ) : selectedInstance.status === "error" ? (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center">
                        <AlertCircle className="text-red-500 w-12 h-12 mx-auto mb-4" />
                        <p className="font-bold text-red-500">Erro na Conexão</p>
                        <p className="text-zinc-400 text-sm mt-1">Tente reinicializar a instância</p>
                        <button 
                          onClick={() => restartInstance(selectedInstance.id)}
                          className="mt-4 text-xs bg-red-500 text-white px-4 py-2 rounded-lg font-bold"
                        >
                          Reiniciar Agora
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center aspect-square shadow-inner">
                        <QRCodeSVG 
                          value={`whatsapp-simulated-qr-${selectedInstance.id}`} 
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                        <p className="text-black text-[10px] font-bold mt-2 uppercase tracking-tighter">Escaneie para conectar</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <button className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold transition-all text-zinc-300">
                      <ExternalLink size={18} />
                      Documentação API
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 flex items-center justify-between">
      <div>
        <p className="text-zinc-500 text-sm font-medium mb-1">{label}</p>
        <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
      </div>
      <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
        {icon}
      </div>
    </div>
  );
}
