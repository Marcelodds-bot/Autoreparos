import React, { useState } from 'react';
import { ClientData } from '../types';
import { UserIcon, MapPinIcon, CarIcon, CameraIcon } from './Icons';

interface ClientRegistrationProps {
  onSubmit: (data: ClientData) => void;
  onCancel: () => void;
}

const ClientRegistration: React.FC<ClientRegistrationProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ClientData>({
    fullName: '',
    cpf: '',
    phone: '',
    email: '',
    zipCode: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    carModel: '',
    carPlate: '',
    carYear: '',
    carColor: ''
  });

  // Funções de Máscara
  const maskCPF = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos
      .replace(/(\d{3})(\d)/, '$1.$2') // Coloca um ponto entre o terceiro e o quarto dígitos de novo (para o segundo bloco de números)
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Coloca um hífen entre o terceiro e o quarto dígitos
      .replace(/(-\d{2})\d+?$/, '$1'); // Impede entrar mais de 11 dígitos
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/^(\d{2})(\d)/g, '($1) $2') // Coloca parênteses em volta dos dois primeiros dígitos
      .replace(/(\d)(\d{4})$/, '$1-$2') // Coloca hífen entre o quarto e o quinto dígitos
      .substring(0, 15); // Limita tamanho
  };

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/^(\d{5})(\d)/, '$1-$2') // Coloca hífen entre o quinto e o sexto dígitos
      .substring(0, 9); // Limita tamanho
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Aplica máscaras dependendo do campo
    if (name === 'cpf') formattedValue = maskCPF(value);
    if (name === 'phone') formattedValue = maskPhone(value);
    if (name === 'zipCode') formattedValue = maskCEP(value);
    // Converter placa para maiúsculo automaticamente
    if (name === 'carPlate') formattedValue = value.toUpperCase();

    setFormData({ ...formData, [name]: formattedValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 animate-fade-in-up">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="bg-blue-900/20 p-6 border-b border-blue-800/30">
          <h2 className="text-2xl font-bold text-white text-center">Cadastro Inicial</h2>
          <p className="text-blue-300 text-center text-sm mt-2">Preencha seus dados para iniciarmos a avaliação do veículo</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          
          {/* Personal Data */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-400 border-b border-slate-800 pb-2">
              <UserIcon className="w-5 h-5" /> Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
                <input required name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Ex: João Silva" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">CPF</label>
                <input 
                  required 
                  name="cpf" 
                  value={formData.cpf} 
                  onChange={handleChange} 
                  maxLength={14}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" 
                  placeholder="000.000.000-00" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Celular / WhatsApp</label>
                <input 
                  required 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  maxLength={15}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" 
                  placeholder="(00) 00000-0000" 
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="seu@email.com" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-400 border-b border-slate-800 pb-2">
              <MapPinIcon className="w-5 h-5" /> Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">CEP</label>
                <input 
                  required 
                  name="zipCode" 
                  value={formData.zipCode} 
                  onChange={handleChange} 
                  maxLength={9}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" 
                  placeholder="00000-000" 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Rua / Avenida</label>
                <input required name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="Av. Principal" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Número</label>
                <input required name="number" value={formData.number} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="123" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Bairro</label>
                <input required name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cidade / UF</label>
                <input required name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="São Paulo - SP" />
              </div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-400 border-b border-slate-800 pb-2">
              <CarIcon className="w-5 h-5" /> Dados do Veículo
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Modelo do Carro</label>
                <input required name="carModel" value={formData.carModel} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="Ex: Honda Civic 2020" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Placa</label>
                <input 
                  required 
                  name="carPlate" 
                  value={formData.carPlate} 
                  onChange={handleChange} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none uppercase font-mono" 
                  placeholder="ABC-1234" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cor</label>
                <input required name="carColor" value={formData.carColor} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" placeholder="Preto" />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-6 flex gap-4">
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
            >
              <CameraIcon className="w-5 h-5" />
              Continuar para Fotos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientRegistration;