import React from 'react';

export const BrandLogo = ({ className = "", scale = 1 }: { className?: string, scale?: number }) => {
  return (
    <div 
      className={`relative flex flex-col items-center justify-center ${className}`} 
      style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: 'center top',
        width: '220px' // Largura fixa para garantir centralização perfeita no container pai
      }}
    >
      
      {/* Upper Graphic Section: Car & Spray Gun */}
      {/* Ajustado para centralizar o conjunto gráfico */}
      <div className="relative w-[160px] h-12 mb-1">
        {/* Car Silhouette (Stylized) */}
        <svg width="140" height="50" viewBox="0 0 140 50" className="absolute left-0 top-0" style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>
          <path 
            d="M10 35 C10 35, 25 20, 45 18 C65 16, 85 16, 100 22 C115 28, 130 30, 135 35" 
            fill="none" 
            stroke="white" 
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path 
            d="M45 18 C50 8, 70 5, 90 8 C100 10, 100 22, 100 22" 
            fill="none" 
            stroke="white" 
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {/* Spray Gun (Right side) */}
        <svg width="60" height="60" viewBox="0 0 60 60" className="absolute -right-4 -top-2 rotate-12">
          {/* Cup */}
          <rect x="10" y="0" width="20" height="25" rx="2" fill="#dc2626" stroke="white" strokeWidth="1" />
          {/* Body */}
          <path d="M20 25 L20 35 L10 40 L10 55 L25 55 L30 40 L45 40 L48 35 L20 35" fill="#dc2626" stroke="white" strokeWidth="1" />
          {/* Trigger/Nozzle */}
          <rect x="45" y="38" width="5" height="4" fill="#991b1b" />
        </svg>
      </div>

      {/* Text Section - Agora centralizado */}
      <div className="flex flex-col leading-none items-center">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black text-red-600 tracking-tighter drop-shadow-lg font-impact" style={{ textShadow: '2px 2px 0px #fff' }}>
            AUTO
          </span>
          <span className="text-2xl font-bold text-white italic tracking-wider drop-shadow-md">
            REPAROS
          </span>
        </div>
        <div className="text-3xl font-bold text-white tracking-wide -mt-1 drop-shadow-lg text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
          José Eduardo
        </div>
      </div>
      
      {/* Tagline Strip */}
      <div className="mt-1 h-1 w-full bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
    </div>
  );
};