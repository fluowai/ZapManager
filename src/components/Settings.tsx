import React, { useState, useEffect } from "react";
import { 
  Users, 
  Bot, 
  Plus, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Key,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface User {
  id: string;
  username: string;
  role: "administrator" | "operator";
  created_at: string;
}

interface LLMConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  is_active: number;
  created_at: string;
}

const providerNames: Record<string, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
  groq: "Groq",
  anthropic: "Anthropic",
  custom: "Custom"
};

const providerModels: Record<string, string[]> = {
  openai: ["gpt-4-turbo", "gpt-4o", "gpt-3.5-turbo"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"],
  groq: ["llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768", "gemma-7b-it"],
  anthropic: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"]
};

export function Settings() {
  const [activeTab, setActiveTab] = useState<"team" | "llm">("team");
  const [users, setUsers] = useState<User[]>([]);
  const [llms, setLlms] = useState<LLMConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User Form State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("operator");

  // LLM Form State
  const [isLLMModalOpen, setIsLLMModalOpen] = useState(false);
  const [llmName, setLlmName] = useState("");
  const [llmProvider, setLlmProvider] = useState("openai");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmModel, setLlmModel] = useState("");

  const token = localStorage.getItem("zap_token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, llmsRes] = await Promise.all([
        fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/llms", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (llmsRes.ok) setLlms(await llmsRes.json());
    } catch (error) {
      console.error("Failed to fetch settings data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      });
      if (res.ok) {
        setIsUserModalOpen(false);
        setNewUsername("");
        setNewPassword("");
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create user", error);
    }
  };

  const handleCreateLLM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/llms", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: llmName, 
          provider: llmProvider, 
          api_key: llmApiKey, 
          model: llmModel 
        }),
      });
      if (res.ok) {
        setIsLLMModalOpen(false);
        setLlmName("");
        setLlmApiKey("");
        setLlmModel("");
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create LLM config", error);
    }
  };

  const deleteLLM = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      await fetch(`/api/llms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error("Failed to delete LLM", error);
    }
  };

  const toggleLLM = async (id: string) => {
    try {
      await fetch(`/api/llms/${id}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error("Failed to toggle LLM", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab("team")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "team" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            )}
          >
            <Users size={16} />
            Gestão de Equipe
          </button>
          <button
            onClick={() => setActiveTab("llm")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === "llm" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            )}
          >
            <Bot size={16} />
            Modelos de IA
          </button>
        </div>
      </div>

      {activeTab === "team" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center bg-[#141417] p-6 rounded-2xl border border-zinc-800">
            <div>
              <h2 className="text-xl font-bold text-white">Membros da Equipe</h2>
              <p className="text-zinc-400 text-sm">Gerencie quem tem acesso ao painel.</p>
            </div>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={18} />
              Adicionar Membro
            </button>
          </div>

          <div className="grid gap-4">
            {users.map(user => (
              <div key={user.id} className="bg-[#141417] border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white">{user.username}</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Shield size={12} className={user.role === "administrator" ? "text-emerald-500" : "text-zinc-500"} />
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                  Criado em: {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === "llm" && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center bg-[#141417] p-6 rounded-2xl border border-zinc-800">
            <div>
              <h2 className="text-xl font-bold text-white">Conexões de IA</h2>
              <p className="text-zinc-400 text-sm">Configure os provedores de inteligência artificial.</p>
            </div>
            <button
              onClick={() => setIsLLMModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus size={18} />
              Nova Conexão
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {llms.map(llm => (
              <div key={llm.id} className="bg-[#141417] border border-zinc-800 p-6 rounded-xl relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-800">
                      <Bot className="text-emerald-500" size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{llm.name}</h3>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">
                        {providerNames[llm.provider] || llm.provider}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteLLM(llm.id)}
                    className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-2"><Cpu size={14} /> Modelo</span>
                    <span className="text-zinc-300 font-mono text-xs">{llm.model}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 flex items-center gap-2"><Key size={14} /> API Key</span>
                    <span className="text-zinc-300 font-mono text-xs">••••••••••••</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleLLM(llm.id)}
                  className={cn(
                    "w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
                    llm.is_active 
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800"
                  )}
                >
                  {llm.is_active ? (
                    <><CheckCircle2 size={14} /> Ativo</>
                  ) : (
                    <><XCircle size={14} /> Inativo</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-white mb-4">Adicionar Membro</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Usuário</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Permissão</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="operator">Operador</option>
                    <option value="administrator">Administrador</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-2 rounded-lg font-bold"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isLLMModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141417] border border-zinc-800 rounded-2xl p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-white mb-4">Nova Conexão IA</h2>
              <form onSubmit={handleCreateLLM} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Nome da Conexão</label>
                  <input
                    type="text"
                    value={llmName}
                    onChange={e => setLlmName(e.target.value)}
                    placeholder="Ex: GPT-4 Principal"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Provedor</label>
                  <select
                    value={llmProvider}
                    onChange={e => setLlmProvider(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="custom">Custom / Local</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Modelo</label>
                  <input
                    list="model-suggestions"
                    type="text"
                    value={llmModel}
                    onChange={e => setLlmModel(e.target.value)}
                    placeholder={
                      llmProvider === "openai" ? "Ex: gpt-4-turbo" :
                      llmProvider === "gemini" ? "Ex: gemini-1.5-pro" :
                      llmProvider === "groq" ? "Ex: llama3-70b-8192" :
                      llmProvider === "anthropic" ? "Ex: claude-3-opus-20240229" :
                      "Ex: local-model-v1"
                    }
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    required
                  />
                  <datalist id="model-suggestions">
                    {providerModels[llmProvider]?.map(model => (
                      <option key={model} value={model} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">API Key</label>
                  <input
                    type="password"
                    value={llmApiKey}
                    onChange={e => setLlmApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsLLMModalOpen(false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-2 rounded-lg font-bold"
                  >
                    Salvar Conexão
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
