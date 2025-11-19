
import React, { useState, useRef, useEffect } from 'react';
import { AppState, AnalysisResult, MaterialPrice, ClientData, ServiceOrder, ServiceCard } from './types';
import { generateRepairVisualization, generateDamageEstimate } from './services/geminiService';
import { dbService } from './services/dbService';
import ComparisonSlider from './components/ComparisonSlider';
import AdminDashboard from './components/AdminDashboard';
import ClientRegistration from './components/ClientRegistration';
import BottomNavigation from './components/BottomNavigation';
import { BrandLogo } from './components/Logo';
import { CameraIcon, UploadIcon, SparklesIcon, RefreshIcon, ToolIcon, LockIcon, PlayIcon, XIcon, CheckCircleIcon, UserIcon, PhoneIcon, MessageCircleIcon } from './components/Icons';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Presentation Video State
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("https://cdn.pixabay.com/video/2022/12/13/142826-781033569_large.mp4");

  // Data from DB
  const [materialPrices, setMaterialPrices] = useState<MaterialPrice[]>([]);
  const [laborRate, setLaborRate] = useState<number>(100);
  const [serviceCards, setServiceCards] = useState<ServiceCard[]>([]);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [materials, rate, cards, video] = await Promise.all([
          dbService.getMaterials(),
          dbService.getLaborRate(),
          dbService.getServiceCards(),
          dbService.getVideoUrl()
        ]);
        setMaterialPrices(materials);
        setLaborRate(rate);
        setServiceCards(cards);
        setVideoUrl(video);
      } catch (e) {
        console.error("Failed to load initial data", e);
      }
    };
    loadData();
  }, []);

  // Reload data when returning from Admin
  useEffect(() => {
    if (state === AppState.IDLE) {
       dbService.getServiceCards().then(setServiceCards);
       dbService.getVideoUrl().then(setVideoUrl);
    }
  }, [state]);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- FUNÇÃO DE COMPRESSÃO DE IMAGEM PARA ACELERAR A IA ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Reduzir para 1024px acelera MUITO a IA mantendo qualidade suficiente para análise
        const MAX_WIDTH = 1024; 
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Qualidade 0.7 (JPEG) reduz drasticamente o tamanho do arquivo sem perder detalhes visuais
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl.split(',')[1]); // Retorna apenas a string base64
        } else {
          reject(new Error("Canvas context creation failed"));
        }
      };
      img.onerror = (error) => reject(error);
    });
  };

  const processImage = async (file: File) => {
    try {
      setState(AppState.ANALYZING);
      setError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // 1. Comprime a imagem ANTES de enviar para a IA (Aceleração Principal)
      const compressedBase64 = await compressImage(file);
        
      try {
        // Ensure we have fresh data before calling AI
        const currentLaborRate = await dbService.getLaborRate();
        const currentMaterials = await dbService.getMaterials();

        // 2. Executa chamadas em paralelo (Já existente, mas agora com payload leve)
        const [repairedImgBase64, estimateData] = await Promise.all([
          generateRepairVisualization(compressedBase64),
          generateDamageEstimate(compressedBase64, currentMaterials, currentLaborRate)
        ]);

        setResult({
          originalImage: compressedBase64,
          repairedImage: repairedImgBase64,
          estimate: estimateData
        });
        
        setState(AppState.RESULTS);
      } catch (err) {
        console.error(err);
        setError("Não foi possível analisar a imagem. Tente novamente com uma foto mais clara.");
        setState(AppState.ERROR);
      }
    } catch (e) {
      console.error(e);
      setError("Erro ao processar arquivo de imagem.");
      setState(AppState.ERROR);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  // Step 1: Start with Registration
  const handleStartQuote = () => {
    setState(AppState.REGISTERING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2: Save Client Data and Prompt for Upload
  const handleRegistrationSubmit = (data: ClientData) => {
    setClientData(data);
    setState(AppState.UPLOAD_PROMPT);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3: Trigger Camera/Upload
  const handleUploadTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setState(AppState.IDLE);
    setResult(null);
    setError(null);
    setClientData(null);
    setIsSubmittingOrder(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step 4: Finalize Order after Results
  const handleFinalizeOrder = async () => {
    if (!result || !result.estimate || !clientData) return;

    setIsSubmittingOrder(true);
    try {
      await dbService.createOrder(
        clientData,
        result.estimate,
        result.originalImage,
        result.repairedImage
      );
      
      setState(AppState.SUCCESS);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error("Error saving order", e);
      alert("Erro ao salvar o pedido. Tente novamente.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // ADMIN VIEW RENDER
  if (state === AppState.ADMIN) {
    return <AdminDashboard onClose={() => setState(AppState.IDLE)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 flex flex-col">
      
      {/* Video Presentation Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              <XIcon className="w-6 h-6" />
            </button>
            <video 
              controls 
              autoPlay 
              className="w-full h-full max-h-[80vh] object-contain"
              key={videoUrl} // Force reload if url changes
            >
              <source src={videoUrl} type="video/mp4" />
              Seu navegador não suporta o elemento de vídeo.
            </video>
          </div>
        </div>
      )}

      {/* Header - Centered Logo with Increased Height */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || state !== AppState.IDLE ? 'bg-blue-950/95 backdrop-blur-md border-b border-blue-900' : 'bg-transparent'
        } h-28 flex items-center justify-center pt-2`}
      >
        <div className="w-full max-w-7xl px-6 relative flex justify-center">
          
          {/* Logo Centered & Scaled Up */}
          <div className="cursor-pointer transform transition-transform hover:scale-105 z-50" onClick={handleReset}>
            <BrandLogo scale={1.2} />
          </div>
          
          {/* Right Side Controls (Desktop Only) - Absolute Position */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-4 z-50">
             {/* Only show New Sim button on desktop/tablet or if state needs it */}
            {(state === AppState.RESULTS || state === AppState.ERROR) && (
               <button 
                 onClick={handleReset} 
                 className="text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-full transition-all flex items-center gap-2"
               >
                 <RefreshIcon className="w-4 h-4" /> Início
               </button>
            )}
          </div>
        </div>
      </header>

      {/* Hidden Input */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        onChange={handleFileSelect}
      />

      {/* Main Content - Add pb-24 for bottom nav spacing */}
      <main className="flex-grow pb-24 md:pb-0">
        
        {/* IDLE STATE - Centered Sanding Background */}
        {state === AppState.IDLE && (
          <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center pt-48 md:pt-56 pb-10">
            {/* Background Image: Sanding/Bodywork */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=2000&auto=format&fit=crop"
                alt="Profissional Lixando Carro"
                className="w-full h-full object-cover object-center opacity-40"
              />
              {/* Dark Blue Overlay */}
              <div className="absolute inset-0 bg-blue-950/80 mix-blend-multiply z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/50 to-slate-950 z-10"></div>
            </div>

            <div className="container mx-auto px-4 relative z-20 flex flex-col items-center text-center max-w-5xl">
              
              <h2 className="text-xl md:text-3xl font-black text-blue-400 uppercase tracking-widest mb-4 drop-shadow-lg animate-fade-in mt-4">
                Os melhores serviços para seu veículo!
              </h2>
              
              {/* Service Cards Row - Centered & Dynamic */}
              <div className="flex flex-wrap justify-center gap-6 mb-10 animate-fade-in-up">
                {serviceCards.map((service, i) => (
                  <div key={service.id} className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 relative rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl transform hover:scale-105 transition-transform duration-300 group">
                    <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover group-hover:opacity-110 transition-opacity" />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors"></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-red-600 text-white text-xs md:text-sm font-black text-center py-1.5 uppercase tracking-widest">
                      {service.title}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-10 animate-fade-in-up animation-delay-200">
                <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] drop-shadow-2xl tracking-tighter" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                  BATEU?<br/>
                  AMASSOU?<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">ARRANHOU?</span>
                </h1>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 w-full justify-center animate-fade-in-up animation-delay-300">
                <button 
                  onClick={handleStartQuote}
                  className="bg-green-600 hover:bg-green-500 text-white text-xl font-bold px-10 py-5 rounded-full transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center justify-center gap-3 border-4 border-white/10 transform hover:-translate-y-1 hover:scale-105"
                >
                  <CameraIcon className="w-7 h-7" />
                  FAZER ORÇAMENTO
                </button>
                <button 
                  onClick={() => setShowVideo(true)}
                  className="bg-white/10 hover:bg-white text-white hover:text-blue-900 text-xl font-bold px-10 py-5 rounded-full transition-all shadow-xl flex items-center justify-center gap-3 backdrop-blur-md border border-white/20 transform hover:-translate-y-1"
                >
                  <PlayIcon className="w-6 h-6 fill-current" />
                  Ver Vídeo
                </button>
              </div>
              
              <div className="mt-12 flex flex-col items-center gap-2 bg-black/40 p-6 rounded-2xl backdrop-blur-sm border border-white/10 animate-fade-in-up animation-delay-500 hover:bg-black/60 transition-colors cursor-pointer" onClick={() => window.open('https://wa.me/5534997672375', '_blank')}>
                <div className="flex items-center gap-3">
                   <div className="bg-green-500 p-2.5 rounded-full shadow-lg shadow-green-500/30 animate-pulse">
                    <PhoneIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 uppercase tracking-widest font-bold">Agende seu serviço pelo WhatsApp</p>
                    <p className="text-3xl font-black text-white tracking-tight">(34) 99767-2375</p>
                  </div>
                </div>
                <div className="h-px w-full bg-white/10 my-2"></div>
                 <p className="text-sm md:text-base font-medium text-blue-200 flex items-center gap-1">
                    <span className="text-yellow-400 text-lg">★</span> 
                    Rua Eclipse, s/nº - Chácara Paraíso IV - Uberlândia
                  </p>
              </div>
            </div>
          </section>
        )}

        {/* REGISTRATION STATE - Now First Step */}
        {state === AppState.REGISTERING && (
          <div className="pt-40 pb-20">
             <ClientRegistration 
                onSubmit={handleRegistrationSubmit} 
                onCancel={() => setState(AppState.IDLE)} 
             />
          </div>
        )}

        {/* UPLOAD PROMPT STATE - Between Register and Analysis */}
        {state === AppState.UPLOAD_PROMPT && clientData && (
          <div className="min-h-screen flex flex-col items-center justify-center pt-32 px-4 text-center bg-slate-950 animate-fade-in">
            <div className="max-w-2xl w-full bg-slate-900/50 p-10 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-sm">
              <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                <CameraIcon className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Olá, {clientData.fullName.split(' ')[0]}!</h2>
              <p className="text-xl text-slate-300 mb-8">
                Agora precisamos de uma foto clara do dano no veículo para que nossa Inteligência Artificial possa analisar e gerar seu orçamento.
              </p>
              <button 
                onClick={handleUploadTrigger}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold px-10 py-5 rounded-2xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-3"
              >
                <CameraIcon className="w-6 h-6" />
                Tirar Foto / Enviar Imagem
              </button>
              <p className="text-sm text-slate-500 mt-6">
                Certifique-se de estar em um ambiente iluminado.
              </p>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {state === AppState.ANALYZING && (
          <div className="min-h-screen flex flex-col items-center justify-center pt-32 pb-12 px-4 text-center bg-slate-950">
            <div className="relative w-32 h-32 mb-8">
              <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <SparklesIcon className="text-blue-400 w-10 h-10 animate-pulse" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">Analisando Danos</h3>
            <div className="space-y-2 text-slate-400">
              <p className="animate-pulse delay-75">Processando imagem do veículo...</p>
              <p className="animate-pulse delay-150">Identificando avarias...</p>
              <p className="animate-pulse delay-300">Gerando visualização do reparo...</p>
            </div>
          </div>
        )}

        {/* RESULTS STATE - SIMPLIFIED (No Budget, Just CTA) */}
        {state === AppState.RESULTS && result && (
          <div className="max-w-4xl mx-auto px-4 pt-40 pb-20 animate-fade-in-up flex flex-col items-center">
            
            <div className="w-full mb-8 text-center">
              <div className="inline-flex items-center gap-3 bg-blue-900/30 px-5 py-2 rounded-full border border-blue-500/30 mb-4">
                <SparklesIcon className="w-5 h-5 text-blue-400" />
                <span className="text-blue-200 font-semibold text-sm uppercase tracking-wide">Análise Concluída</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Veja o Potencial do Seu Carro!
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Nossa IA analisou os danos e gerou uma previsão de como o veículo ficará após o serviço.
              </p>
            </div>

            {/* Comparison Slider - Centered */}
            {result.repairedImage && (
              <div className="w-full max-w-3xl aspect-[4/3] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl ring-4 ring-slate-800 mb-10">
                <ComparisonSlider beforeImage={result.originalImage} afterImage={result.repairedImage} />
              </div>
            )}

            {/* Call to Action Box */}
            <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-green-500 to-blue-500"></div>
              
              <h3 className="text-2xl font-bold text-white mb-4">Gostou do Resultado?</h3>
              <p className="text-slate-300 mb-8 leading-relaxed">
                Já calculamos internamente as peças, materiais e mão de obra necessários para este serviço. 
                Clique abaixo para enviar sua solicitação e receber o orçamento oficial.
              </p>

              <button 
                onClick={handleFinalizeOrder}
                disabled={isSubmittingOrder}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white text-xl font-bold px-10 py-4 rounded-xl transition-all shadow-[0_10px_30px_rgba(22,163,74,0.3)] flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingOrder ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageCircleIcon className="w-6 h-6" />
                    SOLICITAR ORÇAMENTO AGORA
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500 mt-4">
                O orçamento será enviado para seu WhatsApp e E-mail cadastrados.
              </p>
            </div>
          </div>
        )}

        {/* SUCCESS STATE - CUSTOM MESSAGE */}
        {state === AppState.SUCCESS && (
          <div className="min-h-screen flex flex-col items-center justify-center pt-32 text-center px-4 bg-slate-950">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 border border-green-500/20 animate-bounce">
              <CheckCircleIcon className="w-12 h-12" />
            </div>
            <h3 className="text-4xl font-bold text-white mb-6">Solicitação Recebida!</h3>
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-lg mx-auto shadow-xl">
               <p className="text-slate-300 mb-6 text-lg leading-relaxed">
                 Agradecemos a preferência! <br/>
                 Enviaremos o orçamento detalhado para seu <strong>e-mail</strong> e <strong>WhatsApp</strong> em breve.
               </p>
               <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800/30">
                 <p className="text-blue-200 text-sm">
                   Qualquer dúvida, entre em contato pelo número disponível na tela inicial.
                 </p>
               </div>
            </div>
            
            <button 
              onClick={handleReset}
              className="mt-10 bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-10 py-3 rounded-full font-bold transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        )}

        {/* ERROR STATE */}
        {state === AppState.ERROR && (
          <div className="min-h-screen flex flex-col items-center justify-center pt-32 text-center px-4">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500 border border-red-500/20">
              <XIcon className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Erro na análise</h3>
            <p className="text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">{error}</p>
            <button onClick={handleReset} className="bg-white text-slate-950 hover:bg-slate-200 px-8 py-4 rounded-xl font-bold transition-colors">
              Tentar Novamente
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation 
        currentState={state}
        onHome={handleReset}
        onAdmin={() => setState(AppState.ADMIN)}
        onContact={() => window.open('https://wa.me/5534997672375', '_blank')}
      />

      {/* Desktop Footer Link - Visible only on MD+ screens */}
      <footer className="hidden md:block bg-slate-950 py-6 border-t border-slate-900 text-center relative z-10">
        <button 
          onClick={() => setState(AppState.ADMIN)}
          className="text-slate-600 hover:text-slate-400 text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
        >
          <LockIcon className="w-3 h-3" />
          Área do Funileiro (Admin)
        </button>
        <p className="text-slate-700 text-xs mt-2">&copy; {new Date().getFullYear()} Auto Reparos José Eduardo</p>
      </footer>
    </div>
  );
};

export default App;
