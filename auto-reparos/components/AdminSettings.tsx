
import React, { useState, useEffect, useRef } from 'react';
import { MaterialPrice, ServiceCard } from '../types';
import { CheckCircleIcon, TrashIcon, PlusIcon, ToolIcon, PlayIcon, UploadIcon, RefreshIcon } from './Icons';
import { dbService, DEFAULT_CARDS } from '../services/dbService';

interface AdminSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialPrice[];
  laborRate: number;
  videoUrl: string;
  onSave: (updatedMaterials: MaterialPrice[], laborRate: number, videoUrl: string) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ isOpen, onClose, materials, laborRate, videoUrl, onSave }) => {
  const [localMaterials, setLocalMaterials] = useState<MaterialPrice[]>(materials);
  const [localLaborRate, setLocalLaborRate] = useState<number>(laborRate);
  const [localVideoUrl, setLocalVideoUrl] = useState<string>(videoUrl);
  const [serviceCards, setServiceCards] = useState<ServiceCard[]>([]);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Update local state if props change
  useEffect(() => {
    setLocalMaterials(materials);
    setLocalLaborRate(laborRate);
    setLocalVideoUrl(videoUrl);
    
    // Carregar cards salvos
    dbService.getServiceCards().then(setServiceCards);
  }, [materials, laborRate, videoUrl]);

  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'consumables' | 'paint' | 'preparation'>('preparation');

  if (!isOpen) return null;

  // --- Lógica de Materiais ---
  const handlePriceChange = (id: string, newPrice: string) => {
    const price = parseFloat(newPrice);
    setLocalMaterials(prev => 
      prev.map(m => m.id === id ? { ...m, price: isNaN(price) ? 0 : price } : m)
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este material?')) {
      setLocalMaterials(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemUnit || !newItemPrice) return;

    const newItem: MaterialPrice = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItemName,
      unit: newItemUnit,
      price: parseFloat(newItemPrice),
      category: newItemCategory
    };

    setLocalMaterials([...localMaterials, newItem]);
    setNewItemName('');
    setNewItemUnit('');
    setNewItemPrice('');
  };

  // --- Lógica de Upload de Imagens dos Cards ---
  const handleCardImageUpload = (cardId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert("A imagem é muito grande! Escolha uma imagem menor que 2MB.");
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setServiceCards(prev => prev.map(card => 
          card.id === cardId ? { ...card, imageUrl: event.target.result as string } : card
        ));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRestoreCardDefault = (cardId: string) => {
    const defaultCard = DEFAULT_CARDS.find(c => c.id === cardId);
    if (defaultCard) {
      setServiceCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, imageUrl: defaultCard.imageUrl } : card
      ));
    }
  };

  // --- Lógica de Upload de Vídeo ---
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limite aumentado para 20MB graças ao IndexedDB
    const maxSize = 20 * 1024 * 1024; 
    if (file.size > maxSize) {
      alert("O vídeo é muito grande! Por favor, escolha um vídeo menor que 20MB.");
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    try {
      // Salva diretamente no IndexedDB
      const newUrl = await dbService.saveVideoFile(file);
      setLocalVideoUrl(newUrl);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar o vídeo. Tente novamente.");
    }
  };

  const triggerVideoSelect = () => {
    videoInputRef.current?.click();
  };

  const resetVideo = () => {
    const defaultUrl = "https://cdn.pixabay.com/video/2022/12/13/142826-781033569_large.mp4";
    setLocalVideoUrl(defaultUrl);
    dbService.saveVideoUrl(defaultUrl); // Reseta para a URL padrão
  };

  // --- Salvar Tudo ---
  const handleSave = async () => {
    await dbService.saveServiceCards(serviceCards);
    // Nota: O vídeo já é salvo automaticamente ao selecionar o arquivo via saveVideoFile
    onSave(localMaterials, localLaborRate, localVideoUrl);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-6 border-b border-slate-800 bg-slate-950/30">
        <h2 className="text-xl font-bold text-white">Configurações do Administrador</h2>
        <p className="text-slate-400 text-sm">Personalize a aparência e os custos do sistema.</p>
      </div>

      <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
        
        {/* SEÇÃO: VÍDEO DE APRESENTAÇÃO */}
        <section className="bg-slate-800/30 border border-slate-700 p-5 rounded-xl">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <PlayIcon className="w-5 h-5 text-red-500" />
            Vídeo da Tela Inicial
          </h3>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2">
               <div className="aspect-video w-full bg-black rounded-lg overflow-hidden border border-slate-800 relative shadow-lg">
                <video 
                  src={localVideoUrl} 
                  className="w-full h-full object-contain"
                  controls
                />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  Visualização Atual
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 flex flex-col justify-center gap-4">
              <p className="text-slate-300 text-sm">
                Selecione um arquivo de vídeo do seu computador para exibir na tela inicial.
              </p>
              
              <input 
                ref={videoInputRef}
                type="file" 
                accept="video/mp4,video/webm,video/ogg"
                className="hidden"
                onChange={handleVideoUpload}
              />

              <div className="flex flex-col gap-3">
                <button 
                  onClick={triggerVideoSelect}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                >
                  <UploadIcon className="w-5 h-5" />
                  Carregar Vídeo do Computador
                </button>
                
                <button 
                  onClick={resetVideo}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshIcon className="w-4 h-4" />
                  Restaurar Padrão
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                * Limite aumentado para 20MB. Formatos: MP4, WebM. 
                O vídeo é salvo localmente no seu navegador.
              </p>
            </div>
          </div>
        </section>

        {/* SEÇÃO: IMAGENS DOS CARDS */}
        <section className="bg-slate-800/30 border border-slate-700 p-5 rounded-xl">
          <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <ToolIcon className="w-5 h-5 text-yellow-500" />
            Imagens dos Serviços (Cards)
          </h3>
          <p className="text-slate-400 text-xs mb-4">Carregue fotos do seu computador para ilustrar os serviços na tela inicial.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {serviceCards.map((card) => (
              <div key={card.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 shadow-lg">
                <label className="text-sm font-bold text-white text-center uppercase tracking-wider block">{card.title}</label>
                
                <div className="aspect-square w-full bg-slate-900 rounded-lg overflow-hidden relative group border border-slate-800">
                  <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                  <label 
                    htmlFor={`card-upload-${card.id}`}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-colors font-bold border border-slate-700 hover:border-slate-600"
                  >
                    <UploadIcon className="w-3 h-3" />
                    Trocar Foto
                  </label>
                  <input 
                    id={`card-upload-${card.id}`}
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleCardImageUpload(card.id, e)}
                  />
                  
                  <button 
                    onClick={() => handleRestoreCardDefault(card.id)}
                    className="text-slate-500 hover:text-slate-300 text-xs py-1 flex items-center justify-center gap-1"
                    title="Voltar para a imagem original"
                  >
                    <RefreshIcon className="w-3 h-3" /> Restaurar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEÇÃO: MÃO DE OBRA */}
        <section className="bg-blue-900/10 border border-blue-800/30 p-5 rounded-xl">
          <h3 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
            Mão de Obra Base
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="text-slate-300 font-medium">Valor da Hora Técnica (R$):</label>
            <input 
              type="number" 
              value={localLaborRate}
              onChange={(e) => setLocalLaborRate(parseFloat(e.target.value))}
              className="bg-slate-950 border border-blue-700 text-white px-4 py-2 rounded-lg w-full sm:w-32 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500">Este valor multiplica as horas estimadas pela IA para calcular o custo de serviço.</p>
          </div>
        </section>

        {/* SEÇÃO: ADICIONAR MATERIAL (MANTIDA) */}
        <section className="bg-slate-800/30 border border-slate-700 p-5 rounded-xl">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Cadastrar Novo Material
          </h3>
          <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <input 
                placeholder="Nome do Material" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <input 
                placeholder="Unidade (ex: Lt)" 
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <input 
                type="number"
                placeholder="Preço R$" 
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-3">
              <select 
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-lg text-sm focus:border-blue-500 outline-none"
              >
                <option value="preparation">Preparação</option>
                <option value="paint">Pintura</option>
                <option value="consumables">Consumíveis</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <button type="submit" className="w-full h-full bg-green-600 hover:bg-green-500 text-white rounded-lg flex items-center justify-center transition-colors" title="Adicionar">
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </form>
        </section>

        {/* SEÇÃO: LISTA DE MATERIAIS (MANTIDA) */}
        <section>
           <h3 className="text-white font-bold text-lg mb-4">Tabela de Materiais</h3>
           {['preparation', 'paint', 'consumables'].map((category) => (
            <div key={category} className="mb-8 last:mb-0">
              <h4 className="text-slate-500 font-semibold uppercase text-xs tracking-widest mb-3 border-b border-slate-800 pb-2 flex justify-between">
                <span>
                  {category === 'preparation' ? 'Preparação & Funilaria' : 
                   category === 'paint' ? 'Pintura & Acabamento' : 'Consumíveis Diversos'}
                </span>
                <span className="text-[10px] bg-slate-800 px-2 rounded text-slate-400">
                  {localMaterials.filter(m => m.category === category).length} itens
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {localMaterials.filter(m => m.category === category).map((material) => (
                  <div key={material.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors group">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-slate-200 font-medium truncate" title={material.name}>{material.name}</p>
                      <p className="text-xs text-slate-500">{material.unit}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center">
                        <span className="text-slate-400 text-sm mr-1">R$</span>
                        <input 
                          type="number" 
                          step="0.50"
                          value={material.price} 
                          onChange={(e) => handlePriceChange(material.id, e.target.value)}
                          className="bg-slate-950 border border-slate-600 text-white px-2 py-1 rounded-md w-20 text-right focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
                        />
                      </div>
                      <button 
                        onClick={() => handleDelete(material.id)}
                        className="text-slate-600 hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                        title="Remover Material"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {localMaterials.filter(m => m.category === category).length === 0 && (
                  <div className="col-span-2 text-center py-4 border border-dashed border-slate-800 rounded-lg text-slate-600 text-sm">
                    Nenhum material cadastrado nesta categoria.
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0 flex justify-end gap-3">
        <button 
          onClick={onClose} 
          className="hidden md:block px-5 py-2.5 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors font-medium"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <CheckCircleIcon className="w-5 h-5" />
          Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
