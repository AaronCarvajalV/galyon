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

  // 2. Camera Setup
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
  camera.position.set(0, 1.12, 4.4);

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
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
    controls.target.set(0, 0.95, 0);
    controls.minDistance = 1.1;
    controls.maxDistance = 5.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.08; // Prevent looking under the floor
    controls.enablePan = false;
  }

  // 5. Studio Lighting Rig (Biotech Emerald + Chiaroscuro Sculpting)
  // Key Light (warm white from right-front)
  const keyLight = new THREE.DirectionalLight('#fffef8', 2.9);
  keyLight.position.set(3.6, 3.0, 2.0);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 10;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);

  // Fill Light (ambient green/cream hemisphere)
  const fillLight = new THREE.HemisphereLight('#f0fdf4', '#062015', 0.65);
  scene.add(fillLight);

  // Rim Light (signature GALYON emerald rim light from back-left)
  const rimLight = new THREE.DirectionalLight('#10b981', 3.6);
  rimLight.position.set(-3.2, 2.4, -2.5);
  scene.add(rimLight);

  // Accent Grazing Light (front raking light to catch condensation highlights)
  const grazingLight = new THREE.PointLight('#e6fbf1', 2.2, 6.0, 1.8);
  grazingLight.position.set(1.4, 1.5, 1.8);
  scene.add(grazingLight);

  // 6. Ground Shadow Disc
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 512;
  shadowCanvas.height = 512;
  const sCtx = shadowCanvas.getContext('2d');
  if (sCtx) {
    sCtx.clearRect(0, 0, 512, 512);

    // Soft directional contact shadow shifted back-left
    sCtx.save();
    sCtx.translate(225, 230);
    sCtx.rotate(-0.6);
    sCtx.scale(1.4, 0.9);
    const castGrad = sCtx.createRadialGradient(0, 0, 15, 0, 0, 150);
    castGrad.addColorStop(0, 'rgba(10, 35, 22, 0.75)');
    castGrad.addColorStop(0.4, 'rgba(10, 35, 22, 0.40)');
    castGrad.addColorStop(0.7, 'rgba(10, 35, 22, 0.12)');
    castGrad.addColorStop(1, 'rgba(10, 35, 22, 0)');
    sCtx.fillStyle = castGrad;
    sCtx.beginPath();
    sCtx.arc(0, 0, 150, 0, Math.PI * 2);
    sCtx.fill();
    sCtx.restore();

    // Ambient occlusion contact ring right under bottle base
    const aoGrad = sCtx.createRadialGradient(256, 256, 15, 256, 256, 95);
    aoGrad.addColorStop(0, 'rgba(6, 25, 16, 0.92)');
    aoGrad.addColorStop(0.55, 'rgba(6, 25, 16, 0.88)');
    aoGrad.addColorStop(0.75, 'rgba(6, 25, 16, 0.42)');
    aoGrad.addColorStop(1, 'rgba(6, 25, 16, 0)');
    sCtx.fillStyle = aoGrad;
    sCtx.beginPath();
    sCtx.arc(256, 256, 95, 0, Math.PI * 2);
    sCtx.fill();
  }
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(3.0, 3.0);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.002;
  scene.add(shadowMesh);

  // 7. Procedural Texture Generators
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

  // Bottle body material (blow-molded HDPE polymer)
  const bottleMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f6f8f6'),
    roughness: 0.35,
    metalness: 0.0,
    normalMap: normDroplets,
    normalScale: new THREE.Vector2(0.65, 0.65),
    clearcoat: 0.28,
    clearcoatRoughness: 0.24,
    reflectivity: 0.72,
    ior: 1.52,
    sheen: 0.18,
    sheenColor: new THREE.Color('#a7f3d0'),
  });

  // Label material (satin paper with Spot-UV)
  const labelMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    roughness: 0.28,
    metalness: 0.01,
    clearcoat: 0.22,
    clearcoatRoughness: 0.18,
    reflectivity: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  // Knurled cap material (injection-molded white polypropylene)
  const capMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f9fbf9'),
    roughness: 0.30,
    metalness: 0.0,
    normalMap: normCap,
    normalScale: new THREE.Vector2(0.6, 0.6),
    clearcoat: 0.24,
    clearcoatRoughness: 0.20,
    reflectivity: 0.65,
  });

  // Helper for color space compatibility
  function setSRGBColorSpace(tex) {
    if (!tex) return;
    if (THREE.SRGBColorSpace) {
      tex.colorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding) {
      tex.encoding = THREE.sRGBEncoding;
    }
  }

  // 9. Load Label Texture
  const textureLoader = new THREE.TextureLoader();
  const labelPath = 'assets/textures/galyon-label.png';
  textureLoader.load(
    labelPath,
    function (texture) {
      setSRGBColorSpace(texture);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      labelMaterial.map = texture;
      labelMaterial.needsUpdate = true;
    },
    undefined,
    function () {
      // Fallback label image
      textureLoader.load('assets/galyon-label-hd.png', function (tex) {
        setSRGBColorSpace(tex);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
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

  // 11. Camera Preset Navigation
  const targetCamPos = new THREE.Vector3(0, 1.12, 4.4);
  const targetCamLook = new THREE.Vector3(0, 0.95, 0);
  let isTransitioningCam = true;
  let isAutoRotate = true;
  let lastUserInteractionTime = 0;

  const viewCoordinates = {
    front: {
      pos: new THREE.Vector3(0, 1.12, 4.4),
      look: new THREE.Vector3(0, 0.95, 0),
    },
    threeQuarter: {
      pos: new THREE.Vector3(3.0, 1.35, 3.1),
      look: new THREE.Vector3(0, 0.95, 0),
    },
    label: {
      pos: new THREE.Vector3(0.25, 1.05, 2.05),
      look: new THREE.Vector3(0, 0.98, 0),
    },
    cap: {
      pos: new THREE.Vector3(0.42, 2.65, 1.6),
      look: new THREE.Vector3(0, 1.88, 0),
    },
  };

  function setCameraView(viewKey) {
    const coords = viewCoordinates[viewKey];
    if (!coords) return;
    targetCamPos.copy(coords.pos);
    targetCamLook.copy(coords.look);
    isTransitioningCam = true;
    isAutoRotate = false;
    updateAutoRotateButtonState();
  }

  // Listen to orbit controls interaction
  if (controls) {
    controls.addEventListener('start', function () {
      isTransitioningCam = false;
      lastUserInteractionTime = performance.now();
      mount.classList.add('is-dragging');
    });
    controls.addEventListener('end', function () {
      mount.classList.remove('is-dragging');
    });
  }

  // 12. UI Dock Events
  const viewButtons = document.querySelectorAll('.dock-btn[data-view]');
  viewButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      viewButtons.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      this.classList.add('is-active');
      this.setAttribute('aria-pressed', 'true');
      const view = this.getAttribute('data-view');
      setCameraView(view);
    });
  });

  const finishButtons = document.querySelectorAll('.dock-btn[data-finish]');
  finishButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      finishButtons.forEach(b => b.classList.remove('is-active'));
      this.classList.add('is-active');
      const finish = this.getAttribute('data-finish');
      if (finish === 'condensation') {
        bottleMaterial.normalMap = normDroplets;
        bottleMaterial.normalScale.set(0.65, 0.65);
        bottleMaterial.clearcoat = 0.28;
      } else {
        bottleMaterial.normalMap = normDry;
        bottleMaterial.normalScale.set(0.45, 0.45);
        bottleMaterial.clearcoat = 0.16;
      }
      bottleMaterial.needsUpdate = true;
    });
  });

  const toggleRotateBtn = document.getElementById('btn-toggle-rotate');
  function updateAutoRotateButtonState() {
    if (!toggleRotateBtn) return;
    if (isAutoRotate) {
      toggleRotateBtn.classList.add('is-active');
      toggleRotateBtn.setAttribute('aria-pressed', 'true');
    } else {
      toggleRotateBtn.classList.remove('is-active');
      toggleRotateBtn.setAttribute('aria-pressed', 'false');
    }
  }

  if (toggleRotateBtn) {
    toggleRotateBtn.addEventListener('click', function () {
      isAutoRotate = !isAutoRotate;
      updateAutoRotateButtonState();
      if (isAutoRotate) {
        lastUserInteractionTime = 0;
      }
    });
  }

  // Direct Add-to-Cart from 3D Stage (script.js handles data-add-sku; we provide feedback)
  const addTrichoBtn = document.getElementById('add-tricho-from-hero');
  if (addTrichoBtn) {
    addTrichoBtn.addEventListener('click', function () {
      // Optional slight feedback bounce on the 3D model
      if (modelGroup) {
        modelGroup.position.y += 0.04;
        setTimeout(() => {
          modelGroup.position.y -= 0.04;
        }, 180);
      }
    });
  }

  // 13. Responsive Resize Handler
  function handleResize() {
    if (!mount) return;
    const newWidth = mount.clientWidth;
    const newHeight = mount.clientHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  }
  window.addEventListener('resize', handleResize);

  // 14. Main Animation & Render Loop
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Camera damping interpolation
    if (isTransitioningCam) {
      camera.position.x += (targetCamPos.x - camera.position.x) * 0.08;
      camera.position.y += (targetCamPos.y - camera.position.y) * 0.08;
      camera.position.z += (targetCamPos.z - camera.position.z) * 0.08;

      if (controls) {
        controls.target.x += (targetCamLook.x - controls.target.x) * 0.08;
        controls.target.y += (targetCamLook.y - controls.target.y) * 0.08;
        controls.target.z += (targetCamLook.z - controls.target.z) * 0.08;
      }

      if (camera.position.distanceTo(targetCamPos) < 0.01) {
        isTransitioningCam = false;
      }
    }

    if (controls) {
      controls.update();
    }

    // Auto-rotation & gentle organic floating bobbing
    if (modelGroup) {
      const timeSec = now * 0.001;

      // Subtle breathing float: 15 mm vertical sine wave
      modelGroup.position.y = Math.sin(timeSec * 1.6) * 0.015;

      if (isAutoRotate) {
        modelGroup.rotation.y += 0.007;
      }
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
})();
