/**
 * GALYON TRICHO 1L — Componente 3D Interactivo de la Botella (360°)
 * Renderizado WebGL de alta fidelidad con Three.js, PBR Shaders y OrbitControls
 */
(function initGalyon3DViewer() {
  function start() {
    const mount = document.getElementById('webgl-canvas-mount');
    if (!mount) return;

    // Comprobar soporte de WebGL
    const hasWebGL = (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    })();

    if (!hasWebGL || typeof THREE === 'undefined') {
      const loader = document.getElementById('viewer3d-loader');
      if (loader) {
        loader.innerHTML = `
          <div style="padding:20px;text-align:center;color:#162A1B;">
            <img src="assets/linea-tricho.jpg" alt="GALYON TRICHO" style="max-height:240px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.12);margin-bottom:10px;"/>
            <p style="font-weight:600;font-size:13px;margin:0;">GALYON TRICHO 1 L</p>
          </div>
        `;
      }
      return;
    }

    // Dimensiones y relación de aspecto
    let width = mount.clientWidth || 360;
    let height = mount.clientHeight || 540;

    // 1. Escena
    const scene = new THREE.Scene();

    // 2. Cámara (Encuadre exacto para proporción vertical 2:3)
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    camera.position.set(0, 1.16, 4.25);

    // 3. Renderer transparente (se funde en el papel #F2EFE9 sin marco)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.shadowMap.enabled = false;

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.outline = 'none';
    mount.appendChild(canvas);

    // 4. OrbitControls para rotación táctil 360°
    let controls = null;
    let isUserInteracting = false;
    let lastInteractionTime = performance.now();
    const hint = document.getElementById('facts3dHint');

    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, 1.09, 0); // Centro vertical de la botella
      controls.minDistance = 2.6;
      controls.maxDistance = 5.5;
      controls.minPolarAngle = Math.PI / 2 - 0.40; // Ligera inclinación superior
      controls.maxPolarAngle = Math.PI / 2 + 0.30; // Evita mirar por debajo de la base
      controls.enablePan = false;
      controls.enableZoom = false; // Evita atrapar el scroll vertical de la página
      controls.rotateSpeed = 0.85;

      controls.addEventListener('start', function () {
        isUserInteracting = true;
        lastInteractionTime = performance.now();
        mount.classList.add('is-dragging');
        if (hint) {
          hint.style.opacity = '0';
          setTimeout(() => { hint.style.display = 'none'; }, 350);
        }
      });

      controls.addEventListener('end', function () {
        isUserInteracting = false;
        lastInteractionTime = performance.now();
        mount.classList.remove('is-dragging');
      });
    }

    // 5. Iluminación de Estudio Editorial (Realza el volumen blanco y la etiqueta)
    const keyLight = new THREE.DirectionalLight('#ffffff', 3.0);
    keyLight.position.set(2.8, 3.2, 2.8);
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight('#ffffff', '#e2eee6', 1.3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#ffffff', 1.8);
    rimLight.position.set(-2.6, 2.8, -2.2);
    scene.add(rimLight);

    const frontLight = new THREE.PointLight('#ffffff', 1.2, 8.0, 1.6);
    frontLight.position.set(0.3, 1.2, 3.0);
    scene.add(frontLight);

    // 6. Texturas de acabado HDPE y tapa estriada
    function createProceduralNormalTexture() {
      const size = 512;
      const data = new Uint8Array(size * size * 4);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let nx = (Math.sin(x * 12.3 + y * 23.7) * 0.035);
          let ny = (Math.cos(x * 17.1 - y * 19.3) * 0.035);
          let nz = 1.0;
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          const idx = (y * size + x) * 4;
          data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
          data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
          data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
          data[idx + 3] = 255;
        }
      }
      const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
      return texture;
    }

    function createCapNormalTexture() {
      const w = 256;
      const h = 128;
      const data = new Uint8Array(w * h * 4);
      const numRibs = 72;
      for (let y = 0; y < h; y++) {
        const v = y / h;
        const isRib = v > 0.15 && v < 0.85;
        for (let x = 0; x < w; x++) {
          const u = x / w;
          let nx = (Math.sin(x * 15.3) * 0.03);
          let ny = 0;
          let nz = 1.0;
          if (isRib) {
            const angle = u * Math.PI * 2 * numRibs;
            nx += -Math.sin(angle) * 0.5;
          }
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          const idx = (y * w + x) * 4;
          data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
          data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
          data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
          data[idx + 3] = 255;
        }
      }
      const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.needsUpdate = true;
      return texture;
    }

    const normDry = createProceduralNormalTexture();
    const normCap = createCapNormalTexture();

    // Materiales PBR
    const bottleMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#f8faf8'),
      roughness: 0.32,
      metalness: 0.0,
      normalMap: normDry,
      normalScale: new THREE.Vector2(0.4, 0.4),
      clearcoat: 0.22,
      clearcoatRoughness: 0.20,
      reflectivity: 0.70,
      ior: 1.52,
    });

    const labelMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      roughness: 0.26,
      metalness: 0.0,
      clearcoat: 0.22,
      clearcoatRoughness: 0.16,
      reflectivity: 0.65,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const capMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#f8faf9'),
      roughness: 0.28,
      metalness: 0.0,
      normalMap: normCap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      clearcoat: 0.22,
      clearcoatRoughness: 0.20,
      reflectivity: 0.65,
    });

    function setupLabelTexture(tex) {
      if (!tex) return;
      if (THREE.SRGBColorSpace) {
        tex.colorSpace = THREE.SRGBColorSpace;
      } else if (THREE.sRGBEncoding) {
        tex.encoding = THREE.sRGBEncoding;
      }
      if (renderer && renderer.capabilities) {
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      }
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    }

    // 7. Carga de la Etiqueta HD
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'assets/textures/galyon-label.png',
      function (texture) {
        setupLabelTexture(texture);
        labelMaterial.map = texture;
        labelMaterial.needsUpdate = true;
      },
      undefined,
      function () {
        textureLoader.load('assets/galyon-label-hd.png', function (tex) {
          setupLabelTexture(tex);
          labelMaterial.map = tex;
          labelMaterial.needsUpdate = true;
        });
      }
    );

    // 8. Carga del Modelo 3D (GLB HD de la botella)
    const modelGroup = new THREE.Group();
    modelGroup.name = 'GALYON_TRICHO_STAGE';
    scene.add(modelGroup);

    const loaderEl = document.getElementById('viewer3d-loader');

    function finalizeModel(loadedScene) {
      loadedScene.traverse(function (child) {
        if (child.isMesh) {
          const name = child.name || '';
          if (name.includes('Cap') || name.includes('Tapa') || name.includes('Knurl')) {
            child.material = capMaterial;
          } else if (name.includes('Label') || name.includes('Etiqueta')) {
            child.material = labelMaterial;
          } else {
            child.material = bottleMaterial;
          }
        }
      });

      modelGroup.add(loadedScene);

      if (loaderEl) {
        loaderEl.style.opacity = '0';
        setTimeout(() => {
          loaderEl.style.display = 'none';
        }, 350);
      }
    }

    if (THREE.GLTFLoader) {
      const gltfLoader = new THREE.GLTFLoader();
      gltfLoader.load(
        'assets/galyon-tricho-hd.glb',
        function (gltf) {
          finalizeModel(gltf.scene);
        },
        undefined,
        function (err) {
          console.warn('Cargando fallback GLB:', err);
          gltfLoader.load(
            'assets/galyon-tricho.glb',
            function (gltf2) {
              finalizeModel(gltf2.scene);
            },
            undefined,
            function () {
              createProceduralFallbackModel();
            }
          );
        }
      );
    } else {
      createProceduralFallbackModel();
    }

    function createProceduralFallbackModel() {
      const fallbackGroup = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(0.47, 0.47, 1.45, 64, 1);
      const bodyMesh = new THREE.Mesh(bodyGeo, bottleMaterial);
      bodyMesh.position.y = 0.85;
      fallbackGroup.add(bodyMesh);

      const neckGeo = new THREE.CylinderGeometry(0.24, 0.47, 0.42, 64, 1);
      const neckMesh = new THREE.Mesh(neckGeo, bottleMaterial);
      neckMesh.position.y = 1.76;
      fallbackGroup.add(neckMesh);

      const capGeo = new THREE.CylinderGeometry(0.255, 0.255, 0.28, 64, 1);
      const capMesh = new THREE.Mesh(capGeo, capMaterial);
      capMesh.position.y = 2.05;
      fallbackGroup.add(capMesh);

      const labelGeo = new THREE.CylinderGeometry(0.472, 0.472, 1.25, 64, 1, true);
      const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
      labelMesh.position.y = 0.85;
      labelMesh.rotation.y = -Math.PI / 2;
      fallbackGroup.add(labelMesh);

      finalizeModel(fallbackGroup);
    }

    // 9. Resize Handler
    function handleResize() {
      if (!mount) return;
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      if (newWidth <= 0 || newHeight <= 0) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    }
    window.addEventListener('resize', handleResize);

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(handleResize);
      ro.observe(mount);
    }

    // 10. Loop de Animación & Rotación Suave 360°
    let lastTime = performance.now();
    let currentRotationY = 0;

    function animate(now) {
      requestAnimationFrame(animate);

      if (controls) {
        controls.update();
      }

      if (modelGroup) {
        const timeSec = now * 0.001;

        if (!isUserInteracting) {
          // Rotación suave continua a 360 grados cuando está inactivo
          currentRotationY += 0.004;
          modelGroup.rotation.y = currentRotationY;

          // Micro-respiración flotante sutil (10mm)
          modelGroup.position.y = Math.sin(timeSec * 1.5) * 0.012;
        } else {
          currentRotationY = modelGroup.rotation.y;
        }
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
