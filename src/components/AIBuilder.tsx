import React, { useState, useEffect } from "react";
import { Bot, Sparkles, Code2, Play, Save, Settings2, Cpu, AlertCircle } from "lucide-react";

interface LLMConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  is_active: number;
}

const providerNames: Record<string, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
  groq: "Groq",
  anthropic: "Anthropic",
  custom: "Custom"
};

export function AIBuilder() {
  const [llms, setLlms] = useState<LLMConfig[]>([]);
  const [selectedLlmId, setSelectedLlmId] = useState<string>("");
  const [loadingLlms, setLoadingLlms] = useState(true);

  useEffect(() => {
    const fetchLlms = async () => {
      try {
        const token = localStorage.getItem("zap_token");
        const res = await fetch("/api/llms", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const activeLlms = data.filter((llm: LLMConfig) => llm.is_active);
          setLlms(activeLlms);
          if (activeLlms.length > 0) {
            setSelectedLlmId(activeLlms[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch LLMs", error);
      } finally {
        setLoadingLlms(false);
      }
    };
    fetchLlms();
  }, []);

  const selectedLlm = llms.find(llm => llm.id === selectedLlmId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-3rem)]">
      {/* Configuration Panel */}
      <div className="lg:col-span-2 flex flex-col bg-[#141417] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bot className="text-emerald-500" />
              Construtor de Agentes
            </h2>
            <p className="text-zinc-500 text-sm mt-1">Configure o comportamento e personalidade da sua IA</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-medium transition-colors border border-zinc-800">
              <Save size={16} />
              Salvar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-sm font-bold transition-colors">
              <Play size={16} />
              Testar
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-8">
          {/* LLM Selection Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Cpu size={14} /> Modelo de Inteligência
            </h3>
            
            {loadingLlms ? (
              <div className="h-12 bg-zinc-900 rounded-xl animate-pulse" />
            ) : llms.length === 0 ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
                <AlertCircle size={20} />
                <div className="text-sm">
                  <span className="font-bold">Nenhum modelo ativo encontrado.</span>
                  <br />
                  Vá em Configurações &gt; Modelos de IA para ativar um modelo.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <select
                    value={selectedLlmId}
                    onChange={(e) => setSelectedLlmId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-white appearance-none"
                  >
                    {llms.map(llm => (
                      <option key={llm.id} value={llm.id}>
                        {llm.name} ({providerNames[llm.provider] || llm.provider} - {llm.model})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <Settings2 size={16} />
                  </div>
                </div>
                
                {selectedLlm && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex gap-4">
                      <div>
                        <span className="block text-zinc-600 uppercase tracking-wider font-bold mb-1">Provedor</span>
                        <span className="text-zinc-300">{providerNames[selectedLlm.provider] || selectedLlm.provider}</span>
                      </div>
                      <div>
                        <span className="block text-zinc-600 uppercase tracking-wider font-bold mb-1">Modelo</span>
                        <span className="text-zinc-300 font-mono">{selectedLlm.model}</span>
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-md border border-emerald-500/20">
                      Ativo
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Identity Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Sparkles size={14} /> Identidade
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Nome do Agente</label>
                <input 
                  type="text" 
                  defaultValue="Atendente Virtual 01"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">Tom de Voz</label>
                <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors text-zinc-300">
                  <option>Profissional e Formal</option>
                  <option>Amigável e Casual</option>
                  <option>Técnico e Direto</option>
                  <option>Empático e Prestativo</option>
                </select>
              </div>
            </div>
          </section>

          {/* Prompt Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Code2 size={14} /> Prompt do Sistema
            </h3>
            <div className="relative">
              <textarea 
                className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
                defaultValue={`Você é um assistente virtual especializado em atendimento ao cliente para a empresa ZapManager.
                
Suas responsabilidades:
1. Responder dúvidas sobre planos e preços.
2. Ajudar com suporte técnico básico.
3. Agendar reuniões com o time de vendas.

Diretrizes:
- Seja sempre educado e conciso.
- Se não souber a resposta, encaminhe para um humano.
- Use emojis moderadamente para parecer amigável.`}
              />
              <div className="absolute bottom-4 right-4 text-xs text-zinc-600">
                ~450 tokens
              </div>
            </div>
          </section>

          {/* Knowledge Base */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Settings2 size={14} /> Configurações Avançadas
            </h3>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-200">Temperatura (Criatividade)</div>
                  <div className="text-xs text-zinc-500">Define o quão criativo ou determinístico o modelo será.</div>
                </div>
                <input type="range" className="w-32 accent-emerald-500" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-200">Histórico de Contexto</div>
                  <div className="text-xs text-zinc-500">Quantas mensagens anteriores o bot deve lembrar.</div>
                </div>
                <select className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs">
                  <option>5 mensagens</option>
                  <option>10 mensagens</option>
                  <option>20 mensagens</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex flex-col bg-[#141417] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Preview em Tempo Real</h3>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-xs">
              IA
            </div>
            <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none text-sm text-zinc-300">
              Olá! Como posso ajudar você hoje com o ZapManager?
            </div>
          </div>
          <div className="flex gap-3 flex-row-reverse">
            <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-white font-bold text-xs">
              EU
            </div>
            <div className="bg-emerald-600/20 border border-emerald-500/20 p-3 rounded-2xl rounded-tr-none text-sm text-emerald-100">
              Quais são os planos disponíveis?
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-black font-bold text-xs">
              IA
            </div>
            <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none text-sm text-zinc-300">
              Temos três planos principais: Starter, Pro e Enterprise. O plano Starter começa em R$99/mês. Gostaria de ver os detalhes de cada um?
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-zinc-800">
          <input 
            type="text" 
            placeholder="Digite para testar..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
