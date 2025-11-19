
import React, { useState, useEffect } from 'react';
import { MaterialPrice, ServiceOrder, CostItem } from '../types';
import { dbService } from '../services/dbService';
import { CheckCircleIcon, LockIcon, SettingsIcon, UserIcon, PhoneIcon, CarIcon, RefreshIcon, TrashIcon, PlusIcon, ShareIcon, PrinterIcon } from './Icons';
import AdminSettings from './AdminSettings';

interface AdminDashboardProps {
  onClose: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'prices'>('orders');
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Editing State
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  
  // Data for Settings
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([]);
  const [laborRate, setLaborRate] = useState<number>(100);
  const [videoUrl, setVideoUrl] = useState<string>("");

  // Load Orders on auth or tab change
  useEffect(() => {
    if (isAuthenticated && activeTab === 'orders') {
      fetchOrders();
    }
  }, [isAuthenticated, activeTab]);

  // Load Settings on auth or tab change
  useEffect(() => {
    if (isAuthenticated && activeTab === 'prices') {
      fetchSettings();
    }
  }, [isAuthenticated, activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await dbService.getOrders();
      setOrders(data);
    } catch (e) {
      console.error("Failed to fetch orders", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [materials, rate, video] = await Promise.all([
        dbService.getMaterials(),
        dbService.getLaborRate(),
        dbService.getVideoUrl()
      ]);
      setMaterialPrices(materials);
      setLaborRate(rate);
      setVideoUrl(video);
    } catch (e) {
      console.error("Failed to fetch settings", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      setIsAuthenticated(true);
    } else {
      alert("Senha incorreta");
    }
  };

  const handleSaveSettings = async (newMaterials: MaterialPrice[], newLaborRate: number, newVideoUrl: string) => {
    setLoading(true);
    try {
      await Promise.all([
        dbService.saveMaterials(newMaterials),
        dbService.saveLaborRate(newLaborRate),
        dbService.saveVideoUrl(newVideoUrl)
      ]);
      setMaterialPrices(newMaterials);
      setLaborRate(newLaborRate);
      setVideoUrl(newVideoUrl);
      alert("Configurações salvas com sucesso!");
    } catch (e) {
      alert("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Tem certeza que deseja EXCLUIR este pedido permanentemente?')) {
      try {
        await dbService.deleteOrder(orderId);
        setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
        if (editingOrder?.id === orderId) setEditingOrder(null);
      } catch (error) {
        alert('Erro ao excluir pedido');
      }
    }
  };

  // --- LOGICA DE EDIÇÃO DE ORÇAMENTO ---

  const handleOpenOrder = (order: ServiceOrder) => {
    setEditingOrder(order);
  };

  const handleUpdateItem = (
    type: 'parts' | 'materials',
    index: number,
    field: 'name' | 'estimatedPrice',
    value: string | number
  ) => {
    if (!editingOrder) return;
    
    const newOrder = { ...editingOrder };
    const list = type === 'parts' ? [...newOrder.estimate.parts] : [...newOrder.estimate.materials];
    
    list[index] = {
      ...list[index],
      [field]: value
    };

    if (type === 'parts') newOrder.estimate.parts = list;
    else newOrder.estimate.materials = list;

    recalculateTotal(newOrder);
  };

  const handleAddItem = (type: 'parts' | 'materials') => {
    if (!editingOrder) return;
    
    const newItem: CostItem = { name: 'Novo Item', estimatedPrice: 0 };
    const newOrder = { ...editingOrder };
    
    if (type === 'parts') newOrder.estimate.parts.push(newItem);
    else newOrder.estimate.materials.push(newItem);
    
    setEditingOrder(newOrder); 
  };

  const handleRemoveItem = (type: 'parts' | 'materials', index: number) => {
    if (!editingOrder) return;

    const newOrder = { ...editingOrder };
    if (type === 'parts') {
      newOrder.estimate.parts.splice(index, 1);
    } else {
      newOrder.estimate.materials.splice(index, 1);
    }
    
    recalculateTotal(newOrder);
  };

  const handleLaborChange = (field: 'hours' | 'rate', value: string) => {
    if (!editingOrder) return;
    
    const val = parseFloat(value) || 0;
    const newOrder = { ...editingOrder };
    
    if (field === 'hours') {
        newOrder.estimate.laborHours = val;
    } 
    
    recalculateTotal(newOrder);
  };
  
  const handleLaborCostChange = (value: string) => {
      if (!editingOrder) return;
      const val = parseFloat(value) || 0;
      const newOrder = { ...editingOrder };
      newOrder.estimate.laborCost = val;
      recalculateTotal(newOrder);
  };

  const recalculateTotal = (order: ServiceOrder) => {
    const partsTotal = order.estimate.parts.reduce((acc, item) => acc + (Number(item.estimatedPrice) || 0), 0);
    const materialsTotal = order.estimate.materials.reduce((acc, item) => acc + (Number(item.estimatedPrice) || 0), 0);
    const laborTotal = Number(order.estimate.laborCost) || 0;
    
    order.estimate.totalEstimate = partsTotal + materialsTotal + laborTotal;
    setEditingOrder({ ...order });
  };

  const handleSaveOrder = async () => {
    if (!editingOrder) return;
    
    setLoading(true);
    try {
        const orderToSave = { ...editingOrder, status: 'approved' as const };
        await dbService.updateOrder(orderToSave);
        setEditingOrder(orderToSave);
        setOrders(prev => prev.map(o => o.id === orderToSave.id ? orderToSave : o));
        alert("Orçamento salvo com sucesso!");
    } catch (e) {
        alert("Erro ao salvar orçamento.");
    } finally {
        setLoading(false);
    }
  };

  // TEXTO ATUALIZADO PARA INCLUIR LOGO/NOME E CONTATOS
  const generateSummaryText = () => {
      if (!editingOrder) return "";
      
      const { client, estimate } = editingOrder;
      const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
      
      let text = `🛠️ *AUTO REPAROS JOSÉ EDUARDO* 🛠️\n`;
      text += `📍 Rua Eclipse, s/nº - Chácara Paraíso IV - Uberlândia\n\n`;
      
      text += `Olá, *${client.fullName}*! Segue o orçamento detalhado para o veículo *${client.carModel}* (${client.carPlate}).\n\n`;
      
      if (estimate.parts.length > 0) {
          text += `*PEÇAS:*\n`;
          estimate.parts.forEach(p => text += `- ${p.name}: ${formatMoney(p.estimatedPrice)}\n`);
          text += `\n`;
      }
      
      if (estimate.materials.length > 0) {
          text += `*MATERIAIS:*\n`;
          estimate.materials.forEach(m => text += `- ${m.name}: ${formatMoney(m.estimatedPrice)}\n`);
          text += `\n`;
      }
      
      text += `*MÃO DE OBRA:* ${formatMoney(estimate.laborCost)}\n`;
      text += `--------------------------------\n`;
      text += `*TOTAL GERAL: ${formatMoney(estimate.totalEstimate)}*\n\n`;
      text += `📞 *AGENDAMENTO:* (34) 99767-2375\n`;
      text += `Fico à disposição para agendarmos o serviço!`;
      
      return text;
  };

  const handleSendWhatsApp = () => {
      if (!editingOrder) return;
      const text = generateSummaryText();
      const phone = editingOrder.client.phone.replace(/\D/g, '');
      const url = `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  const handleSendEmail = () => {
      if (!editingOrder) return;
      const text = generateSummaryText();
      const subject = `Orçamento - Auto Reparos José Eduardo - ${editingOrder.client.carModel}`;
      const url = `mailto:${editingOrder.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
      window.location.href = url;
  };

  // --- FUNÇÃO DE IMPRESSÃO COM LOGOMARCA ---
  const handlePrintOrder = () => {
    if (!editingOrder) return;
    
    const { client, estimate, originalImage } = editingOrder;
    const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const date = new Date(editingOrder.date).toLocaleDateString('pt-BR');

    // Janela de impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Por favor, permita pop-ups para imprimir.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orçamento - ${client.fullName}</title>
        <style>
          body { font-family: 'Arial', sans-serif; color: #000; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #dc2626; padding-bottom: 20px; }
          .logo-container { display: flex; flex-direction: column; align-items: flex-start; }
          .logo-text { font-family: 'Impact', sans-serif; font-size: 32px; color: #dc2626; line-height: 1; margin-bottom: 5px; }
          .logo-sub { font-size: 16px; font-weight: bold; color: #000; font-style: italic; }
          .logo-name { font-size: 18px; font-weight: bold; margin-top: 4px; }
          .company-info { text-align: right; font-size: 14px; color: #555; }
          .company-info strong { color: #000; font-size: 16px; }
          
          .section-title { background: #f3f4f6; padding: 10px; font-weight: bold; margin: 20px 0 10px 0; border-left: 4px solid #dc2626; }
          
          .grid { display: flex; gap: 40px; margin-bottom: 20px; }
          .col { flex: 1; }
          .field { margin-bottom: 8px; font-size: 14px; }
          .field strong { color: #444; width: 80px; display: inline-block; }
          
          table { w-full: 100%; border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 14px; }
          th { text-align: left; border-bottom: 2px solid #ddd; padding: 8px; }
          td { border-bottom: 1px solid #eee; padding: 8px; }
          .text-right { text-align: right; }
          
          .total-section { text-align: right; margin-top: 30px; padding-top: 20px; border-top: 2px solid #000; }
          .total-label { font-size: 14px; text-transform: uppercase; color: #666; }
          .total-value { font-size: 32px; font-weight: bold; color: #dc2626; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          .contact-highlight { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
             <!-- SVG Logo Simplified Inline -->
             <div style="margin-bottom: 5px;">
                <span class="logo-text">AUTO</span> <span class="logo-sub">REPAROS</span>
             </div>
             <div class="logo-name">José Eduardo</div>
          </div>
          <div class="company-info">
            <strong>Auto Reparos José Eduardo</strong><br>
            Rua Eclipse, s/nº - Chácara Paraíso IV<br>
            Uberlândia - MG<br>
            (34) 99767-2375
          </div>
        </div>

        <h2 style="text-align: center; margin-bottom: 30px;">ORÇAMENTO DE SERVIÇO</h2>

        <div class="grid">
          <div class="col">
            <div class="section-title">DADOS DO CLIENTE</div>
            <div class="field"><strong>Nome:</strong> ${client.fullName}</div>
            <div class="field"><strong>CPF:</strong> ${client.cpf}</div>
            <div class="field"><strong>Telefone:</strong> ${client.phone}</div>
            <div class="field"><strong>Email:</strong> ${client.email}</div>
            <div class="field"><strong>Endereço:</strong> ${client.address}, ${client.number}</div>
          </div>
          <div class="col">
            <div class="section-title">DADOS DO VEÍCULO</div>
            <div class="field"><strong>Modelo:</strong> ${client.carModel}</div>
            <div class="field"><strong>Placa:</strong> ${client.carPlate}</div>
            <div class="field"><strong>Cor:</strong> ${client.carColor}</div>
            <div class="field"><strong>Data:</strong> ${date}</div>
          </div>
        </div>

        <div class="section-title">DESCRIÇÃO DOS SERVIÇOS E PEÇAS</div>
        
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Tipo</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${estimate.parts.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>Peça</td>
                <td class="text-right">${formatMoney(p.estimatedPrice)}</td>
              </tr>
            `).join('')}
            
            ${estimate.materials.map(m => `
              <tr>
                <td>${m.name}</td>
                <td>Material</td>
                <td class="text-right">${formatMoney(m.estimatedPrice)}</td>
              </tr>
            `).join('')}
            
            <tr>
              <td><strong>Mão de Obra Especializada (${estimate.laborHours}h)</strong></td>
              <td>Serviço</td>
              <td class="text-right"><strong>${formatMoney(estimate.laborCost)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-label">Valor Total Estimado</div>
          <div class="total-value">${formatMoney(estimate.totalEstimate)}</div>
        </div>

        <div class="footer">
          <div class="contact-highlight">📞 AGENDAMENTO: (34) 99767-2375</div>
          <p>Orçamento válido por 15 dias. Valores sujeitos a alteração em caso de danos ocultos.</p>
          <p>Obrigado pela preferência!</p>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
              <LockIcon className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">Área Restrita</h2>
          <p className="text-slate-400 text-center mb-8">Acesso exclusivo para administração</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha de Acesso"
              className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-lg outline-none focus:border-red-500"
            />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg transition-colors">
              Entrar
            </button>
            <button type="button" onClick={onClose} className="w-full text-slate-500 py-2 text-sm hover:text-white">
              Voltar ao site público
            </button>
          </form>
        </div>
      </div>
    );
  }

  // RENDER ORDER EDITOR
  if (editingOrder) {
      const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

      return (
          <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
              <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                      <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-white flex items-center gap-2">
                          &larr; Voltar para lista
                      </button>
                      <div className="flex gap-2">
                          <button onClick={() => handleDeleteOrder(editingOrder.id)} className="bg-red-900/30 text-red-500 hover:bg-red-900/50 p-2 rounded-lg" title="Excluir">
                              <TrashIcon className="w-5 h-5" />
                          </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* LEFT COL: INFO */}
                      <div className="space-y-6">
                          {/* Card Cliente */}
                          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                              <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2"><UserIcon className="w-4 h-4" /> Cliente</h3>
                              <p className="text-white font-bold text-lg">{editingOrder.client.fullName}</p>
                              <p className="text-slate-400 text-sm mt-1">{editingOrder.client.phone}</p>
                              <p className="text-slate-400 text-sm">{editingOrder.client.email}</p>
                              <p className="text-slate-500 text-xs mt-2">{editingOrder.client.address}, {editingOrder.client.number}</p>
                          </div>

                          {/* Card Veículo */}
                          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                              <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2"><CarIcon className="w-4 h-4" /> Veículo</h3>
                              <p className="text-white font-bold">{editingOrder.client.carModel}</p>
                              <p className="text-slate-400 text-sm">Placa: {editingOrder.client.carPlate}</p>
                              <div className="mt-4 rounded-lg overflow-hidden border border-slate-700">
                                  <img src={`data:image/jpeg;base64,${editingOrder.originalImage}`} className="w-full h-48 object-cover" />
                              </div>
                              {editingOrder.repairedImage && (
                                  <div className="mt-2">
                                      <p className="text-xs text-slate-500 mb-1">Simulação IA:</p>
                                      <img src={`data:image/jpeg;base64,${editingOrder.repairedImage}`} className="w-full h-32 object-cover rounded-lg opacity-70" />
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* RIGHT COL: EDITABLE ESTIMATE */}
                      <div className="lg:col-span-2 space-y-6">
                          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
                              <h2 className="text-2xl font-bold text-white mb-1">Editar Orçamento</h2>
                              <p className="text-slate-400 text-sm mb-6">Adicione ou remova itens conforme sua avaliação técnica.</p>

                              {/* PARTS LIST */}
                              <div className="mb-8">
                                  <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                                      <h3 className="text-slate-300 font-bold uppercase text-xs tracking-wider">Peças ({editingOrder.estimate.parts.length})</h3>
                                      <button onClick={() => handleAddItem('parts')} className="text-green-500 hover:text-green-400 text-xs font-bold flex items-center gap-1">
                                          <PlusIcon className="w-3 h-3" /> Adicionar
                                      </button>
                                  </div>
                                  <div className="space-y-2">
                                      {editingOrder.estimate.parts.map((item, idx) => (
                                          <div key={idx} className="flex gap-2 items-center">
                                              <input 
                                                  value={item.name}
                                                  onChange={(e) => handleUpdateItem('parts', idx, 'name', e.target.value)}
                                                  className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded px-3 py-2 focus:border-blue-500 outline-none"
                                                  placeholder="Nome da Peça"
                                              />
                                              <input 
                                                  type="number"
                                                  value={item.estimatedPrice}
                                                  onChange={(e) => handleUpdateItem('parts', idx, 'estimatedPrice', parseFloat(e.target.value))}
                                                  className="w-24 bg-slate-800 border border-slate-700 text-white text-sm rounded px-3 py-2 text-right focus:border-blue-500 outline-none"
                                                  placeholder="0.00"
                                              />
                                              <button onClick={() => handleRemoveItem('parts', idx)} className="text-slate-600 hover:text-red-500 p-2">
                                                  <TrashIcon className="w-4 h-4" />
                                              </button>
                                          </div>
                                      ))}
                                      {editingOrder.estimate.parts.length === 0 && <p className="text-slate-600 text-sm italic text-center py-2">Nenhuma peça listada.</p>}
                                  </div>
                              </div>

                              {/* MATERIALS LIST */}
                              <div className="mb-8">
                                  <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                                      <h3 className="text-slate-300 font-bold uppercase text-xs tracking-wider">Materiais ({editingOrder.estimate.materials.length})</h3>
                                      <button onClick={() => handleAddItem('materials')} className="text-green-500 hover:text-green-400 text-xs font-bold flex items-center gap-1">
                                          <PlusIcon className="w-3 h-3" /> Adicionar
                                      </button>
                                  </div>
                                  <div className="space-y-2">
                                      {editingOrder.estimate.materials.map((item, idx) => (
                                          <div key={idx} className="flex gap-2 items-center">
                                              <input 
                                                  value={item.name}
                                                  onChange={(e) => handleUpdateItem('materials', idx, 'name', e.target.value)}
                                                  className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded px-3 py-2 focus:border-blue-500 outline-none"
                                                  placeholder="Nome do Material"
                                              />
                                              <input 
                                                  type="number"
                                                  value={item.estimatedPrice}
                                                  onChange={(e) => handleUpdateItem('materials', idx, 'estimatedPrice', parseFloat(e.target.value))}
                                                  className="w-24 bg-slate-800 border border-slate-700 text-white text-sm rounded px-3 py-2 text-right focus:border-blue-500 outline-none"
                                                  placeholder="0.00"
                                              />
                                              <button onClick={() => handleRemoveItem('materials', idx)} className="text-slate-600 hover:text-red-500 p-2">
                                                  <TrashIcon className="w-4 h-4" />
                                              </button>
                                          </div>
                                      ))}
                                      {editingOrder.estimate.materials.length === 0 && <p className="text-slate-600 text-sm italic text-center py-2">Nenhum material listado.</p>}
                                  </div>
                              </div>

                              {/* LABOR & TOTAL */}
                              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
                                  <div className="flex justify-between items-center">
                                      <label className="text-slate-300 text-sm font-medium">Horas Estimadas:</label>
                                      <input 
                                          type="number"
                                          value={editingOrder.estimate.laborHours}
                                          onChange={(e) => handleLaborChange('hours', e.target.value)}
                                          className="w-24 bg-slate-900 border border-slate-600 text-white text-sm rounded px-3 py-2 text-right"
                                      />
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <label className="text-slate-300 text-sm font-medium">Custo Mão de Obra (R$):</label>
                                      <input 
                                          type="number"
                                          value={editingOrder.estimate.laborCost}
                                          onChange={(e) => handleLaborCostChange(e.target.value)}
                                          className="w-32 bg-slate-900 border border-blue-500/50 text-blue-300 font-bold text-sm rounded px-3 py-2 text-right"
                                      />
                                  </div>
                                  
                                  <div className="h-px bg-slate-700 my-4"></div>
                                  
                                  <div className="flex justify-between items-end">
                                      <span className="text-slate-400 uppercase text-xs tracking-widest font-bold">Total Geral</span>
                                      <span className="text-3xl font-black text-white">{formatMoney(editingOrder.estimate.totalEstimate)}</span>
                                  </div>
                              </div>

                              {/* ACTIONS */}
                              <div className="mt-8 flex flex-col gap-3">
                                  <button 
                                      onClick={handleSaveOrder}
                                      className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-colors"
                                  >
                                      <CheckCircleIcon className="w-5 h-5" />
                                      Salvar Orçamento
                                  </button>
                                  
                                  <div className="flex gap-3">
                                      <button 
                                          onClick={handleSendWhatsApp}
                                          className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                                      >
                                          <PhoneIcon className="w-5 h-5" /> WhatsApp
                                      </button>
                                      <button 
                                          onClick={handleSendEmail}
                                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                                      >
                                          <ShareIcon className="w-5 h-5" /> Email
                                      </button>
                                       <button 
                                          onClick={handlePrintOrder}
                                          className="flex-1 bg-slate-200 hover:bg-white text-slate-900 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                                      >
                                          <PrinterIcon className="w-5 h-5" /> Imprimir
                                      </button>
                                  </div>
                              </div>

                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )
  }

  // DEFAULT LIST VIEW
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-lg">
            <SettingsIcon className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
        </div>
        <button onClick={onClose} className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700">
          Sair
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${activeTab === 'orders' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
          >
            <UserIcon className="w-5 h-5" />
            Pedidos de Orçamento
          </button>
          <button 
             onClick={() => setActiveTab('prices')}
             className={`flex-1 px-6 py-4 rounded-xl font-bold transition-all border flex items-center justify-center gap-2 ${activeTab === 'prices' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'}`}
          >
            <SettingsIcon className="w-5 h-5" />
            Configurações e Materiais
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
             <RefreshIcon className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
             <p className="text-slate-400">Carregando dados...</p>
          </div>
        ) : (
          <>
            {activeTab === 'prices' ? (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                 <AdminSettings 
                  isOpen={true} 
                  onClose={() => {}} 
                  materials={materialPrices} 
                  laborRate={laborRate}
                  videoUrl={videoUrl}
                  onSave={handleSaveSettings} 
                 />
               </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                {orders.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    Nenhum pedido recebido ainda.
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                      <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                             <UserIcon />
                           </div>
                           <div>
                             <h3 className="font-bold text-white">{order.client.fullName}</h3>
                             <p className="text-xs text-slate-400">{new Date(order.date).toLocaleString()}</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-bold text-xl">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.estimate.totalEstimate)}
                          </p>
                          <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded border border-yellow-500/20 uppercase font-bold">
                            {order.status === 'pending' ? 'Pendente' : order.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Client Info */}
                        <div className="space-y-3 text-sm">
                          <h4 className="text-slate-500 font-semibold uppercase tracking-wider text-xs mb-2">Dados do Cliente</h4>
                          <p className="flex items-center gap-2 text-slate-300">
                            <span className="text-slate-500 w-12">CPF:</span> {order.client.cpf}
                          </p>
                          <p className="flex items-center gap-2 text-slate-300">
                            <span className="text-slate-500 w-12">Tel:</span> {order.client.phone}
                          </p>
                          <p className="flex items-center gap-2 text-slate-300">
                            <span className="text-slate-500 w-12">Email:</span> {order.client.email}
                          </p>
                          <div className="mt-2 pt-2 border-t border-slate-800">
                            <p className="text-slate-300">{order.client.address}, {order.client.number}</p>
                            <p className="text-slate-400">{order.client.neighborhood} - {order.client.city}</p>
                          </div>
                        </div>

                        {/* Car Info */}
                        <div className="space-y-3 text-sm">
                          <h4 className="text-slate-500 font-semibold uppercase tracking-wider text-xs mb-2">Veículo & Serviço</h4>
                          <div className="flex items-start gap-3">
                            <div className="w-20 h-20 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-slate-700">
                              <img src={`data:image/jpeg;base64,${order.originalImage}`} className="w-full h-full object-cover" alt="Carro" />
                            </div>
                            <div>
                               <p className="font-bold text-white text-lg flex items-center gap-2">
                                 <CarIcon className="w-4 h-4 text-blue-500" />
                                 {order.client.carModel}
                               </p>
                               <p className="text-slate-400 text-xs mt-1">Placa: <span className="text-slate-200 font-mono bg-slate-800 px-1 rounded">{order.client.carPlate}</span></p>
                               <p className="text-slate-400 text-xs">Cor: {order.client.carColor}</p>
                            </div>
                          </div>
                          <div className="mt-2 bg-slate-800 p-2 rounded text-xs text-slate-300">
                            <p>Mão de Obra: {order.estimate.laborHours}h</p>
                            <p>Peças: {order.estimate.parts.length} itens</p>
                          </div>
                        </div>

                         {/* Quick Actions */}
                         <div className="flex flex-col justify-center gap-3">
                            <button 
                              onClick={() => handleOpenOrder(order)}
                              className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-blue-900/20"
                            >
                              <SettingsIcon className="w-5 h-5" />
                              Revisar Orçamento
                            </button>
                            
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="border border-red-900/50 text-red-500 hover:bg-red-900/20 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <TrashIcon className="w-4 h-4" />
                              Excluir Pedido
                            </button>
                         </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
