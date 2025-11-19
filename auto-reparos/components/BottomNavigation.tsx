import React from 'react';
import { HomeIcon, LockIcon, MessageCircleIcon } from './Icons';

interface BottomNavigationProps {
  onHome: () => void;
  onAdmin: () => void;
  onContact: () => void;
  currentState: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ onHome, onAdmin, onContact, currentState }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 flex justify-around items-center px-2 py-3 z-[60] md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.3)] safe-area-bottom">
      <NavItem 
        icon={<HomeIcon className="w-6 h-6" />} 
        label="Início" 
        isActive={currentState !== 'ADMIN'} 
        onClick={onHome} 
      />
      <NavItem 
        icon={<MessageCircleIcon className="w-6 h-6" />} 
        label="WhatsApp" 
        isActive={false} 
        onClick={onContact} 
      />
      <NavItem 
        icon={<LockIcon className="w-6 h-6" />} 
        label="Admin" 
        isActive={currentState === 'ADMIN'} 
        onClick={onAdmin} 
      />
    </nav>
  );
};

const NavItem = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-1 gap-1 transition-all active:scale-95 ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <div className={`p-1 rounded-xl ${isActive ? 'bg-blue-500/10' : 'bg-transparent'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold tracking-wide">{label}</span>
  </button>
);

export default BottomNavigation;