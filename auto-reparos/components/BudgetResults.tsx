import React from 'react';
import { RepairEstimate } from '../types';
import { ToolIcon, CheckCircleIcon, ShareIcon } from './Icons';

interface BudgetResultsProps {
  estimate: RepairEstimate;
  onProceed: () => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const BudgetResults: React.FC<BudgetResultsProps> = ({ estimate, onProceed }) => {
  
  const handleShare = async () => {
    const shareText = `
🚗 *Orçamento - Auto Reparos José Eduardo* 🚗
    
🛠️ *Serviço:* ${estimate.summary}
    
💰 *Peças:* ${estimate.parts.length} itens
🎨 *Materiais:* ${estimate.materials.length} itens
👨‍🔧 *Mão de Obra:* ~${estimate.laborHours} horas

*TOTAL ESTIMADO: ${formatCurrency(estimate.totalEstimate)}*

📍 Endereço: Rua Eclipse, s/nº - Chácara Paraíso IV - Uberlândia
📞 Contato: (34) 99767-2375
    `.trim();

    const shareData = {
      title: 'Orçamento - Auto Reparos José Eduardo',
      text: shareText,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("Resumo do orçamento copiado para a área de transferência!");
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl mt-6">
      <div className="bg-slate-900/50 p-6 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ToolIcon className="text-blue-500" />
          Orçamento Estimado
        </h2>
        <p className="text-slate-400 mt-2 text-sm">{estimate.summary}</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Parts Section */}
        {estimate.parts.length > 0 && (
          <div>
            <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-3">Peças para Reparo/Troca</h3>
            <div className="space-y-2">
              {estimate.parts.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-700/30 p-3 rounded-lg">
                  <span className="text-slate-200">{item.name}</span>
                  <span className="text-emerald-400 font-mono font-medium">{formatCurrency(item.estimatedPrice)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Materials Section */}
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-3">Materiais de Consumo</h3>
          <div className="space-y-2">
            {estimate.materials.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-700/30 p-3 rounded-lg">
                <span className="text-slate-200">{item.name}</span>
                <span className="text-emerald-400 font-mono font-medium">{formatCurrency(item.estimatedPrice)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Labor */}
        <div>
          <h3 className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-3">Mão de Obra</h3>
          <div className="flex justify-between items-center bg-slate-700/30 p-3 rounded-lg">
            <span className="text-slate-200">Serviço Especializado (~{estimate.laborHours} horas)</span>
            <span className="text-emerald-400 font-mono font-medium">{formatCurrency(estimate.laborCost)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="pt-6 border-t border-slate-700">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <span className="block text-sm text-slate-400 mb-1">Total Estimado</span>
              <div className="text-4xl font-bold text-white">{formatCurrency(estimate.totalEstimate)}</div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button 
                onClick={handleShare}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <ShareIcon className="w-5 h-5" />
                Compartilhar
              </button>
              
              <button 
                onClick={onProceed}
                className="flex-[2] bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
              >
                <CheckCircleIcon />
                Confirmar Pedido
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-right">
            *Valores estimados baseados em médias de mercado. Pode variar conforme a região e oficina.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetResults;