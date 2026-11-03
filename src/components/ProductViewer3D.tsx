import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, Upload } from 'lucide-react';

interface ProductViewer3DProps {
  initialModelUrl?: string;
  className?: string;
}

export const ProductViewer3D: React.FC<ProductViewer3DProps> = ({
  initialModelUrl = '/assets/galyon-tricho.glb',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeUrl, setActiveUrl] = useState<string>(initialModelUrl);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [statusMessage, setStatusMessage] = useState('Renderizando modelo 3D...');
  const [modelType, setModelType] = useState<'glb' | 'procedural'>('glb');

  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId: number;
    let isDisposed = false;
    setLoading(true);

    // 1. Escena 3D
    const scene = new THREE.Scene();

    // 2. Cámara de perspectiva
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 3.2);

    // 3. Renderizador WebGL con alta fidelidad a 60 FPS
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 4. Controles orbitales con amortiguación
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.6;
    controls.minDistance = 1.3;
    controls.maxDistance = 5.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.12;
    controlsRef.current = controls;

    // 5. Iluminación de estudio
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x4ade80, 2.0); // Esmeralda GALYON
    rimLight.position.set(-3, 3, -3);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xa7f3d0, 0.8);
    fillLight.position.set(2, -1, 2);
    scene.add(fillLight);

    // Generador de textura de alta resolución para la etiqueta del envase
    const createLabelTexture = () => {
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 2048;
      labelCanvas.height = 1024;
      const ctx = labelCanvas.getContext('2d');
      if (ctx) {
        // Fondo verde bosque bioinsumos
        const bgGrad = ctx.createLinearGradient(0, 0, 2048, 0);
        bgGrad.addColorStop(0, '#0a2318');
        bgGrad.addColorStop(0.5, '#123827');
        bgGrad.addColorStop(1, '#0a2318');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 2048, 1024);

        // Franjas decorativas esmeralda
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, 0, 2048, 28);
        ctx.fillRect(0, 996, 2048, 28);

        // Panel frontal
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(200, 60, 1648, 904);

        // Marca
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 120px sans-serif';
        ctx.fillText('GALYON', 320, 260);

        ctx.fillStyle = '#4ade80';
        ctx.font = 'italic bold 100px serif';
        ctx.fillText('TRICHO', 320, 380);

        ctx.fillStyle = '#d1d5db';
        ctx.font = '500 48px sans-serif';
        ctx.fillText('Trichoderma harzianum & asperellum', 320, 480);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '400 40px sans-serif';
        ctx.fillText('Biofungicida Microbiológico & Promotor Radicular', 320, 550);

        // Badge de formato
        ctx.fillStyle = '#166534';
        ctx.roundRect ? ctx.roundRect(320, 640, 780, 110, 24) : ctx.fillRect(320, 640, 780, 110);
        ctx.fill();

        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 50px sans-serif';
        ctx.fillText('1 LITRO · FORMULACIÓN LÍQUIDA', 360, 715);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '36px sans-serif';
        ctx.fillText('Biotecnología aplicada al agro · Registro de Inocuidad · Ecuador', 320, 840);
      }

      const tex = new THREE.CanvasTexture(labelCanvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // Sombra de contacto en el suelo
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.92;
    scene.add(shadowPlane);

    // 6. Carga de modelo GLB o fallback procedural
    const loader = new GLTFLoader();
    loader.load(
      activeUrl,
      (gltf) => {
        if (isDisposed) return;
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.8 / (maxDim || 1);
        model.scale.setScalar(scale);

        // Centrar con precisión en el eje Y y situar sobre la sombra
        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale + 0.05;
        model.position.z = -center.z * scale;

        // Ajustar plano de sombra justo en la base del envase
        const minY = -center.y * scale - (size.y * scale * 0.5) + 0.05;
        shadowPlane.position.y = minY - 0.01;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Si es la etiqueta y no trae mapa embebido, aplicar etiqueta GALYON TRICHO
            if (mesh.name === 'Wrap_Around_Label') {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat && !mat.map) {
                mat.map = createLabelTexture();
                mat.roughness = 0.32;
                mat.metalness = 0.03;
                mat.needsUpdate = true;
              }
            }
          }
        });

        scene.add(model);
        setModelType('glb');
        setStatusMessage('GALYON TRICHO 1L · Modelo Oficial');
        setLoading(false);
      },
      undefined,
      (err) => {
        if (isDisposed) return;
        console.error('GLTFLoader error:', err);
        setStatusMessage('Error al cargar modelo 3D');
        setLoading(false);
      }
    );

    // 7. Redimensionamiento adaptativo
    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 8. Bucle 60 FPS
    const clock = new THREE.Clock();
    const animate = () => {
      if (isDisposed) return;
      animId = requestAnimationFrame(animate);
      clock.getDelta();
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Liberación de memoria
    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });

      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeUrl]);

  // Actualizar rotación
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleZoom = (factor: number) => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object as THREE.PerspectiveCamera;
      camera.position.multiplyScalar(factor);
      controlsRef.current.update();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setActiveUrl(objectUrl);
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden bg-radial from-emerald-950/25 via-black/50 to-black/90 border border-white/10 ${className}`}>
      {/* Lienzo WebGL */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Input de archivo oculto para probar otros modelos GLB al instante */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Pantalla de carga */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
          <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs uppercase tracking-widest text-emerald-300 font-medium">Cargando visor 3D...</span>
        </div>
      )}

      {/* Badges superiores */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <div className="liquid-glass px-3 py-1.5 rounded-full text-[11px] font-medium text-white/90 flex items-center gap-1.5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{statusMessage}</span>
        </div>
        {modelType === 'procedural' && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="liquid-glass px-3 py-1.5 rounded-full text-[11px] font-medium text-emerald-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
            title="Seleccionar un archivo .glb de tu equipo para probarlo"
          >
            <Upload className="w-3 h-3" />
            <span>Probar otro .glb</span>
          </button>
        )}
      </div>

      {/* Controles de navegación */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setAutoRotate((prev) => !prev)}
          className={`liquid-glass p-2 rounded-full text-white/80 hover:text-white transition-all ${
            autoRotate ? 'bg-emerald-500/20 text-emerald-300' : ''
          }`}
          title={autoRotate ? 'Pausar rotación' : 'Activar rotación'}
          aria-label="Alternar rotación"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </button>

        <button
          onClick={() => handleZoom(0.85)}
          className="liquid-glass p-2 rounded-full text-white/80 hover:text-white transition-all"
          title="Acercar zoom"
          aria-label="Acercar zoom"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => handleZoom(1.15)}
          className="liquid-glass p-2 rounded-full text-white/80 hover:text-white transition-all"
          title="Alejar zoom"
          aria-label="Alejar zoom"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleResetCamera}
          className="liquid-glass p-2 rounded-full text-white/80 hover:text-white transition-all"
          title="Centrar cámara"
          aria-label="Centrar cámara"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Micro-guía de interacción */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none hidden sm:block">
        <span className="text-[10px] text-white/50 tracking-wider uppercase font-light">
          Arrastra para rotar 360° · Rueda para zoom
        </span>
      </div>
    </div>
  );
};
