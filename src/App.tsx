import React, { useState, useEffect } from "react";
import { 
  User,
  Lock,
  AlertCircle,
  MessageSquare
} from "lucide-react";
import { motion } from "motion/react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Connections } from "./components/Connections";
import { Chat } from "./components/Chat";
import { Kanban } from "./components/Kanban";
import { AIBuilder } from "./components/AIBuilder";
import { Settings } from "./components/Settings";

interface UserData {
  id: string;
  username: string;
  role: "administrator" | "operator";
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(() => {
    const saved = localStorage.getItem("zap_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("zap_token"));
  const [activeView, setActiveView] = useState("dashboard");
  
  // Auth states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("zap_user", JSON.stringify(data.user));
        localStorage.setItem("zap_token", data.token);
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError("Erro na conexão");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("zap_user");
    localStorage.removeItem("zap_token");
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#141417] border border-zinc-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="bg-emerald-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-emerald-500 w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">ZapManager</h1>
            <p className="text-zinc-500 mt-2">Acesse sua central de instâncias</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {authError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-zinc-500" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-white"
                  placeholder="admin"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-zinc-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors text-white"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
            >
              Entrar no Sistema
            </button>
          </form>
          
          <p className="text-center text-zinc-600 text-xs mt-8">
            Credenciais padrão: admin / admin123
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex">
      <Sidebar 
        activeView={activeView} 
        onNavigate={setActiveView} 
        onLogout={handleLogout}
        userRole={user?.role}
      />
      
      <main className="flex-1 ml-64 p-6 md:p-12 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {activeView === "dashboard" && <Dashboard token={token} userRole={user?.role || "operator"} />}
          {activeView === "connections" && <Connections token={token} userRole={user?.role || "operator"} />}
          {activeView === "chat" && <Chat />}
          {activeView === "kanban" && <Kanban />}
          {activeView === "ai-builder" && <AIBuilder />}
          {activeView === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
}
