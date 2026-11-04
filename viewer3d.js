/**
 * GALYON TRICHO 1L — High-Fidelity 3D Interactive Asset Viewer
 * Studio-Grade WebGL rendering with PBR Shaders, OrbitControls & Tactile Camera Presets
 */
(function initGalyon3DViewer() {
  const mount = document.getElementById('webgl-canvas-mount');
  if (!mount) return;

  // Check WebGL support
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
        <div style="padding:30px;text-align:center;color:#143d2c;">
          <img src="assets/linea-tricho.jpg" alt="GALYON TRICHO" style="max-height:260px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.15);margin-bottom:12px;"/>
          <p style="font-weight:700;font-size:14px;margin:0;">GALYON TRICHO 1 L</p>
          <small style="color:#577361;">Trichoderma harzianum · Biocontrol radicular de precisión</small>
        </div>
      `;
    }
    return;
  }

  // Dimensions & Aspect Ratio
  const width = mount.clientWidth || 800;
  const height = mount.clientHeight || 520;

  // 1. Scene Setup
  const scene = new THREE.Scene();

  // 2. Camera Setup (Tilted slightly down to frame cap top & full label hero view)
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
  camera.position.set(0, 1.48, 3.65);

  // 3. Renderer with transparent background to let the video background breathe
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
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = false;

  const canvas = renderer.domElement;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.style.outline = 'none';
  mount.appendChild(canvas);

  // 4. OrbitControls
  let controls = null;
  if (THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.05, 0);
    controls.minDistance = 2.0;
    controls.maxDistance = 5.5;
    controls.minPolarAngle = Math.PI / 2 - 0.35; // Allow looking at cap top
    controls.maxPolarAngle = Math.PI / 2 + 0.12; // Prevent looking under floor
    controls.enablePan = false;
    controls.enableZoom = true;
  }

  // 5. Studio Packaging Lighting Rig (Crisp commercial white illumination)
  // Key Light (pure white from upper-right front)
  const keyLight = new THREE.DirectionalLight('#ffffff', 2.8);
  keyLight.position.set(2.6, 3.4, 2.6);
  scene.add(keyLight);

  // Fill Light (ambient clean sky/soft green bounce)
  const fillLight = new THREE.HemisphereLight('#ffffff', '#e2eee6', 1.25);
  scene.add(fillLight);

  // Soft Rim Light from upper back-left
  const rimLight = new THREE.DirectionalLight('#ffffff', 1.5);
  rimLight.position.set(-2.5, 3.0, -2.0);
  scene.add(rimLight);

  // Front Specular Light to accentuate bottle label and cap ridges
  const frontLight = new THREE.PointLight('#ffffff', 1.4, 8.0, 1.6);
  frontLight.position.set(0.4, 1.4, 2.8);
  scene.add(frontLight);

  // 6. Procedural Texture Generators
  function createProceduralNormalTexture(includeCondensation) {
    const size = 512;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      const v = y / size;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        let nx = (Math.sin(x * 12.3 + y * 23.7) * 0.04);
        let ny = (Math.cos(x * 17.1 - y * 19.3) * 0.04);
        let nz = 1.0;

        // Mold parting line
        const distSeam = Math.min(Math.abs(u - 0.25), Math.abs(u - 0.75));
        if (distSeam < 0.005) {
          nx += Math.sin((distSeam / 0.005) * Math.PI) * 0.35;
        }

        // Condensation droplets
        if (includeCondensation) {
          const dropFreq = 22;
          const du = (u * dropFreq) % 1.0 - 0.5;
          const dv = (v * dropFreq * 2) % 1.0 - 0.5;
          const dsq = du * du + dv * dv;
          if (dsq < 0.08) {
            const h = (1.0 - dsq / 0.08);
            nx += -du * h * 2.8;
            ny += -dv * h * 2.8;
          }
        }

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
    const width = 256;
    const height = 128;
    const data = new Uint8Array(width * height * 4);
    const numRibs = 72;
    for (let y = 0; y < height; y++) {
      const v = y / height;
      const isRib = v > 0.15 && v < 0.85;
      for (let x = 0; x < width; x++) {
        const u = x / width;
        let nx = (Math.sin(x * 15.3) * 0.03);
        let ny = 0;
        let nz = 1.0;
        if (isRib) {
          const angle = u * Math.PI * 2 * numRibs;
          nx += -Math.sin(angle) * 0.5;
        }
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        const idx = (y * width + x) * 4;
        data[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
        data[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
        data[idx + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
        data[idx + 3] = 255;
      }
    }
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
  }

  // 8. Materials
  const normDroplets = createProceduralNormalTexture(true);
  const normDry = createProceduralNormalTexture(false);
  const normCap = createCapNormalTexture();

  // Bottle body material (blow-molded HDPE polymer: pure white, satin sheen)
  const bottleMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f7faf8'),
    roughness: 0.32,
    metalness: 0.0,
    normalMap: normDry,
    normalScale: new THREE.Vector2(0.4, 0.4),
    clearcoat: 0.20,
    clearcoatRoughness: 0.20,
    reflectivity: 0.70,
    ior: 1.52,
  });

  // Label material (satin paper with Spot-UV)
  const labelMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    roughness: 0.26,
    metalness: 0.0,
    clearcoat: 0.20,
    clearcoatRoughness: 0.16,
    reflectivity: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Knurled cap material (injection-molded white polypropylene)
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

  // Helper for texture settings & anisotropic filtering
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

  // 9. Load Label Texture
  const textureLoader = new THREE.TextureLoader();
  const labelPath = 'assets/textures/galyon-label.png';
  textureLoader.load(
    labelPath,
    function (texture) {
      setupLabelTexture(texture);
      labelMaterial.map = texture;
      labelMaterial.needsUpdate = true;
    },
    undefined,
    function () {
      // Fallback label image
      textureLoader.load('assets/galyon-label-hd.png', function (tex) {
        setupLabelTexture(tex);
        labelMaterial.map = tex;
        labelMaterial.needsUpdate = true;
      });
    }
  );

  // 10. Load 3D Model Group
  let modelGroup = new THREE.Group();
  modelGroup.name = 'GALYON_TRICHO_STAGE';
  scene.add(modelGroup);

  const loaderEl = document.getElementById('viewer3d-loader');

  function finalizeModel(loadedScene) {
    loadedScene.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
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

  // Attempt to load GLB model
  if (THREE.GLTFLoader) {
    const gltfLoader = new THREE.GLTFLoader();
    gltfLoader.load(
      'assets/galyon-tricho-hd.glb',
      function (gltf) {
        finalizeModel(gltf.scene);
      },
      undefined,
      function (err) {
        console.warn('Could not load HD GLB, loading fallback GLB:', err);
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

  // Fallback procedural model if GLTF is not loaded
  function createProceduralFallbackModel() {
    const fallbackGroup = new THREE.Group();
    // Bottle Body (cylinder + rounded shoulder)
    const bodyGeo = new THREE.CylinderGeometry(0.47, 0.47, 1.45, 64, 1);
    const bodyMesh = new THREE.Mesh(bodyGeo, bottleMaterial);
    bodyMesh.position.y = 0.85;
    bodyMesh.castShadow = true;
    fallbackGroup.add(bodyMesh);

    // Shoulder & Neck
    const neckGeo = new THREE.CylinderGeometry(0.24, 0.47, 0.42, 64, 1);
    const neckMesh = new THREE.Mesh(neckGeo, bottleMaterial);
    neckMesh.position.y = 1.76;
    neckMesh.castShadow = true;
    fallbackGroup.add(neckMesh);

    // Cap
    const capGeo = new THREE.CylinderGeometry(0.255, 0.255, 0.28, 64, 1);
    const capMesh = new THREE.Mesh(capGeo, capMaterial);
    capMesh.position.y = 2.05;
    capMesh.castShadow = true;
    fallbackGroup.add(capMesh);

    // Label
    const labelGeo = new THREE.CylinderGeometry(0.472, 0.472, 1.25, 64, 1, true);
    const labelMesh = new THREE.Mesh(labelGeo, labelMaterial);
    labelMesh.position.y = 0.85;
    labelMesh.rotation.y = -Math.PI / 2;
    fallbackGroup.add(labelMesh);

    finalizeModel(fallbackGroup);
  }

  // 11. User Interaction & Auto-Rotation State
  let isUserInteracting = false;
  let lastInteractionTime = 0;

  if (controls) {
    controls.addEventListener('start', function () {
      isUserInteracting = true;
      lastInteractionTime = performance.now();
      mount.classList.add('is-dragging');
    });
    controls.addEventListener('end', function () {
      isUserInteracting = false;
      lastInteractionTime = performance.now();
      mount.classList.remove('is-dragging');
    });
  }

  // 12. Responsive Resize Handler
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

  // 13. Main Animation & Render Loop
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (controls) {
      controls.update();
    }

    // Auto-rotation & gentle organic floating bobbing directly over landscape
    if (modelGroup) {
      const timeSec = now * 0.001;

      // Subtle breathing float: ~10 mm vertical sine wave
      modelGroup.position.y = Math.sin(timeSec * 1.5) * 0.010;

      // When the user is not actively rotating with mouse/touch, rotate gently 360°
      if (!isUserInteracting && (now - lastInteractionTime > 2500)) {
        modelGroup.rotation.y += 0.0035;
      }
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();
