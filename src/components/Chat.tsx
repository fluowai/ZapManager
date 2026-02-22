import React from "react";
import { Search, Filter, Paperclip, Mic, Send, MoreVertical, Phone, Video } from "lucide-react";

export function Chat() {
  return (
    <div className="flex h-[calc(100vh-3rem)] gap-6">
      {/* Sidebar de Contatos */}
      <div className="w-80 flex flex-col bg-[#141417] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold mb-4">Conversas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar conversa..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {["Todos", "Não lidos", "Grupos", "Atendendo"].map((filter) => (
              <button key={filter} className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-400 whitespace-nowrap transition-colors">
                {filter}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer transition-colors group">
              <div className="flex justify-between mb-1">
                <span className="font-bold text-sm text-zinc-200">Cliente Exemplo {i}</span>
                <span className="text-[10px] text-zinc-500">14:3{i}</span>
              </div>
              <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400">
                Olá, gostaria de saber mais sobre os planos disponíveis para...
              </p>
              <div className="flex gap-2 mt-2">
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] rounded font-medium">Vendas</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col bg-[#141417] border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#141417]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold">
              CE
            </div>
            <div>
              <h3 className="font-bold text-sm">Cliente Exemplo 1</h3>
              <p className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
          <div className="flex gap-2 text-zinc-400">
            <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><Phone size={18} /></button>
            <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><Video size={18} /></button>
            <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><Search size={18} /></button>
            <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><MoreVertical size={18} /></button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0A0A0B]/50">
          <div className="flex justify-center">
            <span className="text-[10px] text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full">Hoje</span>
          </div>
          
          <div className="flex flex-col gap-1 max-w-[70%]">
            <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none text-sm text-zinc-200">
              Olá! Gostaria de saber mais sobre os planos.
            </div>
            <span className="text-[10px] text-zinc-500 ml-2">14:30</span>
          </div>

          <div className="flex flex-col gap-1 max-w-[70%] self-end items-end">
            <div className="bg-emerald-600 p-3 rounded-2xl rounded-tr-none text-sm text-white">
              Olá! Claro, temos diversas opções para atender sua empresa. Você busca algo para quantos atendentes?
            </div>
            <span className="text-[10px] text-zinc-500 mr-2">14:31 • Lido</span>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-[#141417] border-t border-zinc-800">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2">
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Digite sua mensagem..." 
              className="flex-1 bg-transparent text-sm focus:outline-none text-white placeholder-zinc-500"
            />
            <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <Mic size={20} />
            </button>
            <button className="p-2 bg-emerald-500 text-black hover:bg-emerald-600 rounded-lg transition-colors">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
