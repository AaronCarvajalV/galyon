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

    // Sombra de contacto en el suelo
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
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

    // Generador procedural de envase GALYON TRICHO (1 Litro)
    const createProceduralBottle = () => {
      const bottleGroup = new THREE.Group();

      const bodyGeo = new THREE.CylinderGeometry(0.5, 0.52, 1.35, 48);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xf5f7f4,
        roughness: 0.25,
        metalness: 0.05,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      bottleGroup.add(body);

      const shoulderGeo = new THREE.ConeGeometry(0.5, 0.28, 48, 1, true);
      const shoulder = new THREE.Mesh(shoulderGeo, bodyMat);
      shoulder.position.y = 0.81;
      shoulder.castShadow = true;
      bottleGroup.add(shoulder);

      const neckGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.22, 32);
      const neck = new THREE.Mesh(neckGeo, bodyMat);
      neck.position.y = 0.96;
      neck.castShadow = true;
      bottleGroup.add(neck);

      const capGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.2, 32);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x166534,
        roughness: 0.3,
        metalness: 0.15,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 1.08;
      cap.castShadow = true;
      bottleGroup.add(cap);

      const ringGeo = new THREE.TorusGeometry(0.24, 0.02, 16, 32);
      const ring = new THREE.Mesh(ringGeo, capMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.97;
      bottleGroup.add(ring);

      // Etiqueta tipográfica GALYON TRICHO
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 1024;
      labelCanvas.height = 512;
      const ctx = labelCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f291e';
        ctx.fillRect(0, 0, 1024, 512);

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, 0, 1024, 18);
        ctx.fillRect(0, 494, 1024, 18);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px sans-serif';
        ctx.fillText('GALYON', 80, 140);

        ctx.fillStyle = '#4ade80';
        ctx.font = 'italic bold 52px serif';
        ctx.fillText('TRICHO', 80, 210);

        ctx.fillStyle = '#d1d5db';
        ctx.font = '28px sans-serif';
        ctx.fillText('Trichoderma harzianum & asperellum', 80, 270);
        ctx.fillText('Biofungicida & Protector Radicular', 80, 315);

        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('1 LITRO · FORMULACIÓN LÍQUIDA', 80, 395);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '22px sans-serif';
        ctx.fillText('Biotecnología para el campo ecuatoriano', 80, 445);
      }

      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const labelGeo = new THREE.CylinderGeometry(0.505, 0.525, 0.95, 48, 1, true, 0, Math.PI * 1.5);
      const labelMat = new THREE.MeshStandardMaterial({
        map: labelTex,
        roughness: 0.35,
        metalness: 0.05,
      });
      const label = new THREE.Mesh(labelGeo, labelMat);
      label.rotation.y = -Math.PI / 4;
      label.position.y = -0.05;
      bottleGroup.add(label);

      bottleGroup.position.y = -0.15;
      scene.add(bottleGroup);
      return bottleGroup;
    };

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
        const scale = 1.75 / (maxDim || 1);
        model.scale.setScalar(scale);

        model.position.x = -center.x * scale;
        model.position.y = -center.y * scale + 0.1;
        model.position.z = -center.z * scale;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
        setModelType('glb');
        setStatusMessage('Modelo GLB renderizado');
        setLoading(false);
      },
      undefined,
      (err) => {
        if (isDisposed) return;
        console.warn('GLTFLoader aviso:', err);
        createProceduralBottle();
        setModelType('procedural');
        setStatusMessage('Envase 3D GALYON TRICHO');
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
