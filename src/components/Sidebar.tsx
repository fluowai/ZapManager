import React from "react";
import { 
  LayoutDashboard, 
  MessageSquareText, 
  KanbanSquare, 
  Bot, 
  Settings, 
  LogOut,
  Shield,
  Wifi
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  userRole?: string;
}

export function Sidebar({ activeView, onNavigate, onLogout, userRole }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "connections", label: "Conexões", icon: Wifi },
    { id: "chat", label: "Conversas", icon: MessageSquareText },
    { id: "kanban", label: "Kanban CRM", icon: KanbanSquare },
    { id: "ai-builder", label: "Agentes IA", icon: Bot },
  ];

  return (
    <aside className="w-64 bg-[#0A0A0B] border-r border-zinc-800 flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500/10 p-2 rounded-lg">
            <MessageSquareText className="text-emerald-500 w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">ZapManager</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeView === item.id 
                ? "bg-emerald-500/10 text-emerald-500" 
                : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-2">
        <div className="px-4 py-3 bg-zinc-900/50 rounded-xl border border-zinc-800 mb-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Shield size={12} className="text-emerald-500" />
            <span className="uppercase tracking-wider font-bold">{userRole}</span>
          </div>
          <div className="text-xs text-zinc-400">v2.6.0 Stable</div>
        </div>

        <button
          onClick={() => onNavigate("settings")}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
            activeView === "settings" 
              ? "bg-emerald-500/10 text-emerald-500" 
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          )}
        >
          <Settings size={18} />
          Configurações
        </button>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  );
}
