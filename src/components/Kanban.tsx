import React from "react";
import { MoreHorizontal, Plus, Calendar, User } from "lucide-react";

export function Kanban() {
  const columns = [
    { id: "new", title: "Novos Leads", color: "bg-blue-500" },
    { id: "contacted", title: "Em Contato", color: "bg-yellow-500" },
    { id: "proposal", title: "Proposta Enviada", color: "bg-purple-500" },
    { id: "closed", title: "Fechado", color: "bg-emerald-500" },
  ];

  const cards = [
    { id: 1, title: "Implementação ZapManager", client: "Tech Solutions", value: "R$ 1.500", date: "12 Fev", column: "new" },
    { id: 2, title: "Renovação Anual", client: "Marketing Pro", value: "R$ 3.200", date: "10 Fev", column: "contacted" },
    { id: 3, title: "Integração API", client: "E-commerce Top", value: "R$ 5.000", date: "08 Fev", column: "proposal" },
  ];

  return (
    <div className="h-[calc(100vh-3rem)] overflow-x-auto">
      <div className="flex gap-6 min-w-max h-full pb-4">
        {columns.map((col) => (
          <div key={col.id} className="w-80 flex flex-col bg-[#141417] border border-zinc-800 rounded-2xl h-full">
            {/* Column Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${col.color}`} />
                <h3 className="font-bold text-sm">{col.title}</h3>
                <span className="bg-zinc-900 text-zinc-500 text-xs px-2 py-0.5 rounded-full">
                  {cards.filter(c => c.column === col.id).length}
                </span>
              </div>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors">
                  <Plus size={16} />
                </button>
                <button className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-[#0A0A0B]/30">
              {cards.filter(c => c.column === col.id).map((card) => (
                <div key={card.id} className="bg-[#141417] border border-zinc-800 p-4 rounded-xl hover:border-zinc-600 cursor-grab active:cursor-grabbing shadow-sm transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-zinc-900 text-zinc-400 text-[10px] px-2 py-1 rounded font-medium uppercase tracking-wider">
                      {card.client}
                    </span>
                    <button className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                  <h4 className="font-bold text-sm mb-3 text-zinc-200">{card.title}</h4>
                  <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800/50 pt-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {card.date}
                    </div>
                    <div className="font-mono font-medium text-emerald-500">
                      {card.value}
                    </div>
                  </div>
                </div>
              ))}
              
              <button className="w-full py-2 flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-xl text-sm border border-dashed border-zinc-800 hover:border-zinc-700 transition-all">
                <Plus size={14} />
                Adicionar Card
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
