import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { 
  ArrowUpRight, 
  MessageCircle, 
  X, 
  Check, 
  ChevronRight,
  Box
} from 'lucide-react';
import { ProductViewer3D } from './components/ProductViewer3D';

const NAV_LINKS = [
  { name: 'Nosotros', id: 'nosotros' },
  { name: 'Bioinsumos', id: 'bioinsumos' },
  { name: 'Visor 3D', id: 'visor3d' },
  { name: 'Asesor', id: 'asesor' },
  { name: 'Análisis de Suelo', id: 'analisis' },
  { name: 'Combos', id: 'combos' },
  { name: 'Acompañamiento', id: 'garantia' },
];

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_080827_a9e5ad52-b6ee-4e79-b393-d936f179cfd7.mp4';

// Inline LogoMark SVG per spec: 44x26, viewBox 0 0 44 26, three white rects at x=0/16/30, y=3, widths 14/12/14, height 20, rx=3.
const LogoMark: React.FC = () => (
  <svg width="44" height="26" viewBox="0 0 44 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <rect x="0" y="3" width="14" height="20" rx="3" fill="white" />
    <rect x="16" y="3" width="12" height="20" rx="3" fill="white" fillOpacity="0.8" />
    <rect x="30" y="3" width="14" height="20" rx="3" fill="white" />
  </svg>
);

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [framesReady, setFramesReady] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoBgRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);

  // Mount effect for fade-in
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect 1: Frame capture (boomerang setup)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let capturing = true;
    let lastTime = -1;
    const MAX_WIDTH = 960;
    const frames: HTMLCanvasElement[] = [];
    let rafId: number | null = null;
    let rvfcId: number | null = null;

    const captureFrame = () => {
      if (!capturing || video.readyState < 2 || video.currentTime === lastTime) {
        return;
      }
      lastTime = video.currentTime;
      const vWidth = video.videoWidth || 960;
      const vHeight = video.videoHeight || 540;
      const scale = Math.min(1, MAX_WIDTH / vWidth);
      const w = Math.round(vWidth * scale);
      const h = Math.round(vHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        frames.push(canvas);
      }
    };

    const scheduleCapture = () => {
      if (!capturing) return;
      if ('requestVideoFrameCallback' in (video as unknown as Record<string, unknown>)) {
        rvfcId = (video as unknown as { requestVideoFrameCallback: (cb: () => void) => number }).requestVideoFrameCallback(() => {
          captureFrame();
          scheduleCapture();
        });
      } else {
        captureFrame();
        rafId = requestAnimationFrame(scheduleCapture);
      }
    };

    const onLoaded = () => {
      video.play().catch(() => {});
      scheduleCapture();
    };

    const onEnded = () => {
      capturing = false;
      framesRef.current = frames;
      setFramesReady(true);
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('ended', onEnded);

    if (video.readyState >= 1) {
      onLoaded();
    }

    return () => {
      capturing = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (rvfcId !== null && 'cancelVideoFrameCallback' in (video as unknown as Record<string, unknown>)) {
        (video as unknown as { cancelVideoFrameCallback: (id: number) => void }).cancelVideoFrameCallback(rvfcId);
      }
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  // Effect 2: Boomerang render
  useEffect(() => {
    if (!framesReady || !displayCanvasRef.current || framesRef.current.length === 0) return;
    const canvas = displayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frames = framesRef.current;
    canvas.width = frames[0].width;
    canvas.height = frames[0].height;

    let index = 0;
    let direction = 1;
    let last = performance.now();
    const interval = 1000 / 30; // 30 fps
    let animId: number;

    const render = (now: number) => {
      if (now - last >= interval) {
        last = now;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frames[index], 0, 0);

        index += direction;
        if (index >= frames.length - 1) {
          index = frames.length - 1;
          direction = -1;
        } else if (index <= 0) {
          index = 0;
          direction = 1;
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [framesReady]);

  // Effect 3: Parallax mouse tracking (gsap)
  useEffect(() => {
    const strength = 20;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * strength;
      targetY = ((e.clientY - cy) / cy) * strength;
    };

    const update = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      if (videoBgRef.current) {
        gsap.set(videoBgRef.current, { x: currentX, y: currentY });
      }
      animId = requestAnimationFrame(update);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-body overflow-x-hidden relative selection:bg-white/20 select-none">
      {/* 1. Video background layer */}
      <div ref={videoBgRef} className="fixed top-0 left-0 w-full h-full z-0 scale-[1.08] origin-center pointer-events-none">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          style={{ display: framesReady ? 'none' : 'block' }}
        />
        <canvas
          ref={displayCanvasRef}
          className="w-full h-full object-cover"
          style={{ display: framesReady ? 'block' : 'none' }}
        />
        {/* Cinematic gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/85" />
      </div>

      {/* 2. Hero title: fixed div, top 126px, fades in */}
      <div
        className={`fixed left-0 right-0 z-20 w-full px-4 text-center transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
        style={{ top: '126px' }}
      >
        <h1 className="hero-title select-none drop-shadow-2xl tracking-tighter">GALYON</h1>
        <p className="font-heading italic text-white/75 text-lg sm:text-2xl md:text-3xl tracking-wide -mt-2 md:-mt-5">
          El futuro del campo <em>crece naturalmente.</em>
        </p>
      </div>

      {/* 3. Nav: fixed top-5 pill */}
      <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap">
        <div className="liquid-glass flex items-center gap-6 rounded px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <LogoMark />
          <div className="hidden lg:flex items-center gap-5">
            {NAV_LINKS.map(link => (
              <button
                key={link.id}
                onClick={() => setActiveModal(link.id)}
                className="text-sm font-body font-light text-white/70 hover:text-white transition-colors duration-200"
              >
                {link.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <a
              href="https://wa.me/593968933445"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-body font-light text-white/70 hover:text-white transition-colors duration-200 hidden sm:flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>096 893 3445</span>
            </a>
            <a
              href="https://wa.me/593968933445?text=Hola%20GALYON%2C%20quisiera%20asesor%C3%ADa%20t%C3%A9cnica%20para%20mis%20cultivos."
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-strong text-sm font-body font-medium text-white rounded px-4 py-1.5 transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_0_16px_2px_rgba(255,255,255,0.12)] active:scale-[0.97] flex items-center gap-1.5"
            >
              <span>Escríbenos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* 4. Bottom row: fixed bottom-12, left-0 right-0 px-10 */}
      <div
        className={`fixed bottom-8 sm:bottom-12 left-0 right-0 px-6 sm:px-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 sm:gap-0 z-20 transition-all duration-1000 delay-300 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Left paragraph */}
        <p className="text-sm font-body font-light text-white/75 max-w-[220px] leading-relaxed hidden sm:block">
          Bioinsumos agrícolas, análisis de suelo y orientación técnica para tomar mejores decisiones en tus cultivos.
        </p>

        {/* Center absolute action buttons */}
        <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:bottom-0 flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          <button
            onClick={() => setActiveModal('bioinsumos')}
            className="group relative bg-white text-black text-sm font-body font-medium rounded px-5 sm:px-6 py-3 overflow-hidden active:scale-[0.97] transition-all duration-200 shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_0_24px_4px_rgba(255,255,255,0.25)] hover:scale-[1.03] flex items-center gap-1.5 cursor-pointer"
          >
            <span className="relative z-10">Conocer bioinsumos</span>
            <ArrowUpRight className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            <span className="absolute inset-0 bg-gradient-to-b from-white to-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
          <button
            onClick={() => setActiveModal('visor3d')}
            className="liquid-glass group text-emerald-300 hover:text-white text-sm font-body font-medium rounded px-4 sm:px-5 py-3 active:scale-[0.97] transition-all duration-200 hover:scale-[1.03] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_2px_rgba(74,222,128,0.15)] flex items-center gap-1.5 cursor-pointer"
          >
            <Box className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Visor 3D</span>
          </button>
          <button
            onClick={() => setActiveModal('asesor')}
            className="liquid-glass group text-white text-sm font-body font-medium rounded px-5 sm:px-6 py-3 active:scale-[0.97] transition-all duration-200 hover:scale-[1.03] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_2px_rgba(255,255,255,0.07)] flex items-center gap-1.5 cursor-pointer"
          >
            <span>Asesor</span>
            <ArrowUpRight className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Right paragraph */}
        <p className="text-sm font-body font-light text-white/75 max-w-[220px] leading-relaxed text-right hidden sm:block">
          Biotecnología aplicada al agro y al ambiente · Envíos a todo el territorio ecuatoriano.
        </p>
      </div>

      {/* 5. Liquid Glass Modals preserving all website content */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="liquid-glass-strong w-full max-w-2xl max-h-[85vh] rounded-[24px] overflow-y-auto p-6 sm:p-8 relative text-white border border-white/20 shadow-2xl">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              aria-label="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal: Bioinsumos */}
            {activeModal === 'bioinsumos' && (
              <div>
                <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-2">
                  Catálogo de Bioinsumos
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading italic text-white mb-3">Líneas Biológicas GALYON</h3>
                <p className="text-sm text-white/70 mb-6">
                  Soluciones microbiológicas vivas desde $20 por litro con formulaciones específicas para raíces, desarrollo vegetal y manejo biológico.
                </p>
                <div className="grid gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase text-emerald-300 font-bold mb-1">GALYON TRICHO</div>
                      <h4 className="font-semibold text-white text-base">Trichoderma spp.</h4>
                      <p className="text-xs text-white/60 mt-1">Defensa biológica de suelo y raíces fuertes frente a hongos patógenos.</p>
                      <span className="text-xs text-emerald-400 font-semibold mt-2 inline-block">1 L por $20 · Galón (4 L) por $60</span>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => setActiveModal('visor3d')}
                        className="liquid-glass text-xs text-emerald-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/20 flex items-center gap-1.5"
                      >
                        <Box className="w-3 h-3" />
                        <span>Ver en 3D</span>
                      </button>
                      <a
                        href="https://wa.me/593968933445?text=Hola%20GALYON%2C%20deseo%20pedir%20GALYON%20TRICHO."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-white/90 flex items-center justify-center gap-1"
                      >
                        Pedir <ChevronRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase text-sky-300 font-bold mb-1">GALYON BACT</div>
                      <h4 className="font-semibold text-white text-base">Bacillus subtilis & amyloliquefaciens</h4>
                      <p className="text-xs text-white/60 mt-1">Bacterias benéficas para vigor vegetativo, estimulación radicular y sanidad foliar.</p>
                      <span className="text-xs text-sky-400 font-semibold mt-2 inline-block">Desde 1 L por $20</span>
                    </div>
                    <a
                      href="https://wa.me/593968933445?text=Hola%20GALYON%2C%20deseo%20pedir%20GALYON%20BACT."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-glass text-xs text-white px-3 py-1.5 rounded-full hover:bg-white/20 flex items-center gap-1 flex-shrink-0"
                    >
                      Pedir <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase text-amber-300 font-bold mb-1">GALYON INSECTA</div>
                      <h4 className="font-semibold text-white text-base">Metarhizium, Beauveria & Bt</h4>
                      <p className="text-xs text-white/60 mt-1">Hongos y bacterias entomopatógenas para control biológico de insectos plaga.</p>
                      <span className="text-xs text-amber-400 font-semibold mt-2 inline-block">1 L por $20</span>
                    </div>
                    <a
                      href="https://wa.me/593968933445?text=Hola%20GALYON%2C%20deseo%20pedir%20GALYON%20INSECTA."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="liquid-glass text-xs text-white px-3 py-1.5 rounded-full hover:bg-white/20 flex items-center gap-1 flex-shrink-0"
                    >
                      Pedir <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Visor 3D Interactivo */}
            {activeModal === 'visor3d' && (
              <div>
                <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-2">
                  Experiencia Inmersiva 3D
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading italic text-white mb-2">
                  GALYON TRICHO · Envase 3D
                </h3>
                <p className="text-sm text-white/70 mb-4">
                  Inspecciona el diseño en 360°, volumen, precinto y especificaciones biológicas oficiales.
                </p>

                <div className="w-full h-[360px] sm:h-[420px] mb-5">
                  <ProductViewer3D />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-white/50 uppercase block">Formato</span>
                    <strong className="text-xs sm:text-sm text-white font-medium">1 Litro / Galón 4L</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-white/50 uppercase block">Microorganismo</span>
                    <strong className="text-xs sm:text-sm text-emerald-300 font-medium">Trichoderma spp.</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-white/50 uppercase block">Acción Principal</span>
                    <strong className="text-xs sm:text-sm text-white font-medium">Raíces y Suelo</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-white/50 uppercase block">Precio Referencial</span>
                    <strong className="text-xs sm:text-sm text-emerald-400 font-medium">$20 / Litro</strong>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href="https://wa.me/593968933445?text=Hola%20GALYON%2C%20estuve%20viendo%20el%20modelo%203D%20de%20GALYON%20TRICHO%20y%20quisiera%20hacer%20un%20pedido."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 text-center bg-white text-black font-semibold text-sm py-3 rounded-full hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Pedir GALYON TRICHO por WhatsApp</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setActiveModal('bioinsumos')}
                    className="w-full sm:w-auto liquid-glass text-white text-xs py-3 px-5 rounded-full hover:bg-white/20 transition-colors"
                  >
                    Ver catálogo
                  </button>
                </div>
              </div>
            )}

            {/* Modal: Asesor de Cultivos */}
            {activeModal === 'asesor' && (
              <div>
                <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-2">
                  Asesoría Técnica Interactiva
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading italic text-white mb-3">¿Qué está pasando en tu cultivo?</h3>
                <p className="text-sm text-white/70 mb-6">
                  Identifica los síntomas de tus plantas y recibe una recomendación técnica personalizada sin costo directamente por WhatsApp.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {['Cacao', 'Mango', 'Caña', 'Banano', 'Café', 'Arroz', 'Maracuyá', 'Huertos'].map(crop => (
                    <a
                      key={crop}
                      href={`https://wa.me/593968933445?text=Hola%20GALYON%2C%20necesito%20asesor%C3%ADa%20para%20mi%20cultivo%20de%20${crop}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-colors block"
                    >
                      <span className="text-sm font-medium text-white">{crop}</span>
                    </a>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="font-semibold text-white text-sm">Consulta gratuita por WhatsApp</h5>
                    <p className="text-xs text-emerald-200/70 mt-0.5">Envía fotografías de tus hojas, tallos o raíces para valoración.</p>
                  </div>
                  <a
                    href="https://wa.me/593968933445?text=Hola%20GALYON%2C%20tengo%20fotos%20de%20mi%20cultivo%20para%20orientaci%C3%B3n."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-4 py-2 rounded-full transition-colors flex-shrink-0"
                  >
                    Enviar fotos
                  </a>
                </div>
              </div>
            )}

            {/* Modal: Análisis de Suelo */}
            {activeModal === 'analisis' && (
              <div>
                <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-2">
                  Laboratorio Agrícola
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading italic text-white mb-3">Conoce tu suelo. Decide con datos.</h3>
                <p className="text-sm text-white/70 mb-6">
                  Antes de invertir en fertilizantes a ciegas, analiza nutrientes, pH y textura para planificar una fertilización eficiente.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">Análisis Básico ($69)</h4>
                      <p className="text-xs text-white/60">pH, fósforo, potasio, calcio, magnesio, micronutrientes y carbono orgánico.</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">$69</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">Análisis Premium ($75)</h4>
                      <p className="text-xs text-white/60">Todos los parámetros del básico más sodio, azufre, boro, salinidad y acidez.</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">$75</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">Premium + Textura ($89)</h4>
                      <p className="text-xs text-white/60">Determinación de porcentajes de arena, limo y arcilla para retención hídrica.</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">$89</span>
                  </div>
                </div>
                <a
                  href="https://wa.me/593968933445?text=Hola%20GALYON%2C%20deseo%20informaci%C3%B3n%20para%20solicitar%20un%20an%C3%A1lisis%20de%20suelo."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-white text-black font-semibold text-sm py-3 rounded-full hover:bg-white/90 transition-colors"
                >
                  Solicitar muestreo por WhatsApp
                </a>
              </div>
            )}

            {/* Modal: Combos */}
            {activeModal === 'combos' && (
              <div>
                <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-2">
                  Combos Especiales
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading italic text-white mb-3">Combos de 4 Litros por $70</h3>
                <p className="text-sm text-white/70 mb-6">
                  Cada combo incluye 4 litros de formulación microbiológica y envío 100% gratis a todo Ecuador.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs text-emerald-400 font-bold uppercase">Cacao</span>
                    <h4 className="font-semibold text-white text-base mt-1">Cacao Titán</h4>
                    <p className="text-xs text-white/60 mt-1">2 L Trichoderma + 2 L Bacillus subtilis. Vigor y defensas biológicas.</p>
                    <div className="mt-3 text-sm font-bold text-white">$70 <span className="line-through text-white/40 text-xs ml-1">$80</span></div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs text-amber-400 font-bold uppercase">Mango</span>
                    <h4 className="font-semibold text-white text-base mt-1">Mango Furioso</h4>
                    <p className="text-xs text-white/60 mt-1">2 L Bacillus subtilis + 2 L Beauveria bassiana. Manejo de plagas y vigor.</p>
                    <div className="mt-3 text-sm font-bold text-white">$70 <span className="line-through text-white/40 text-xs ml-1">$80</span></div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs text-emerald-400 font-bold uppercase">Caña</span>
                    <h4 className="font-semibold text-white text-base mt-1">Caña Brava</h4>
                    <p className="text-xs text-white/60 mt-1">2 L Bacillus amyloliquefaciens + 2 L Metarhizium anisopliae.</p>
                    <div className="mt-3 text-sm font-bold text-white">$70 <span className="line-through text-white/40 text-xs ml-1">$80</span></div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xs text-sky-400 font-bold uppercase">Banano y Plátano</span>
                    <h4 className="font-semibold text-white text-base mt-1">Verde Bestia</h4>
                    <p className="text-xs text-white/60 mt-1">2 L Trichoderma + 2 L Bacillus amyloliquefaciens. Raíces fuertes y vigor.</p>
                    <div className="mt-3 text-sm font-bold text-white">$70 <span className="line-through text-white/40 text-xs ml-1">$80</span></div>
                  </div>
                </div>
                <a
                  href="https://wa.me/593968933445?text=Hola%20GALYON%2C%20deseo%20ordenar%20un%20combo%20agr%C3%ADcola%20con%20env%C3%ADo%20gratis."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-white text-black font-semibold text-sm py-3 rounded-full hover:bg-white/90 transition-colors"
                >
                  Pedir mi combo por WhatsApp (Envío Gratis)
                </a>
              </div>
            )}

            {/* Modal: Nosotros & Acompañamiento */}
            {(activeModal === 'nosotros' || activeModal === 'garantia') && (
              <div>
                <div className="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-2">
                  Nuestro Compromiso
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading italic text-white mb-3">La atención no termina con tu compra.</h3>
                <p className="text-sm text-white/70 mb-6">
                  En GALYON no nos quedamos en la teoría: atendemos tu caso en campo o a distancia mediante llamadas y fotografías con criterio técnico.
                </p>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Asesoría técnica sin costo</h4>
                      <p className="text-xs text-white/60 mt-0.5">Te orientamos antes, durante y después de la aplicación de los bioinsumos.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Seguimiento personalizado</h4>
                      <p className="text-xs text-white/60 mt-0.5">Atención remota a nivel nacional y visitas técnicas en Guayaquil y alrededores.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">Garantía de acompañamiento</h4>
                      <p className="text-xs text-white/60 mt-0.5">Evaluación de resultados y respaldo técnico responsable para tu inversión.</p>
                    </div>
                  </div>
                </div>
                <a
                  href="https://wa.me/593968933445?text=Hola%20GALYON%2C%20quisiera%20conversar%20con%20un%20asesor%20t%C3%A9cnico."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-white text-black font-semibold text-sm py-3 rounded-full hover:bg-white/90 transition-colors"
                >
                  Contactar a un Asesor GALYON
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
