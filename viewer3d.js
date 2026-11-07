/**
 * GALYON TRICHO 1L — Calibrated 3D Asset Studio & Viewer (Three.js WebGL)
 * Integrado desde galyon-tricho-—-3d-asset-studio-&-validation 2
 * - PBR Shaders con acabado HDPE mate-satinado sin reflejos plásticos
 * - Geometría de torno de precisión de 1L con base rehundida (punt) y cuello cónico
 * - Tapa estriada con 72 estrías físicas 3D y precinto de seguridad
 * - Sombra de contacto cálida editorial (#2A2E24)
 * - Transiciones suaves de cámara (Frontal, Vista 3/4, Posterior, Tapa 3D) y rotación 360°
 */
(function initGalyon3DStudio() {
  function start() {
    const mount = document.getElementById('webgl-canvas-mount');
    if (!mount) return;

    // 1. Verificación WebGL
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

    // 2. Especificaciones Anatómicas de la Botella 1 Litro (GALYON_SPECS)
    const GALYON_SPECS = {
      totalHeight: 2.18,
      bodyRadius: 0.47,
      bodyDiameter: 0.94,
      labelYStart: 0.18,
      labelYEnd: 1.48,
      labelHeight: 1.30,
      capHeight: 0.28,
      capRadius: 0.255,
    };

    // 3. Generación Procedural de Texturas PBR (galyonTextures)
    function makeTextureFromRGBA(data, width, height, isSRGB) {
      if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imgData = ctx.createImageData(width, height);
          imgData.data.set(data);
          ctx.putImageData(imgData, 0, 0);
          const tex = new THREE.CanvasTexture(canvas);
          if (isSRGB && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.needsUpdate = true;
          return tex;
        }
      }
      const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
      if (isSRGB && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.needsUpdate = true;
      return tex;
    }

    function createBottlePBRMaps() {
      const size = 512;
      const colorData = new Uint8Array(size * size * 4);
      const normalData = new Uint8Array(size * size * 4);
      const roughData = new Uint8Array(size * size * 4);
      const aoData = new Uint8Array(size * size * 4);

      const hash = (x, y) => {
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
        return n - Math.floor(n);
      };

      const smoothNoise = (x, y) => {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        const u = fx * fx * (3.0 - 2.0 * fx);
        const v = fy * fy * (3.0 - 2.0 * fy);
        const a = hash(ix, iy);
        const b = hash(ix + 1, iy);
        const c = hash(ix, iy + 1);
        const d = hash(ix + 1, iy + 1);
        return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
      };

      const heightField = new Float32Array(size * size);
      for (let y = 0; y < size; y++) {
        const v = y / size;
        for (let x = 0; x < size; x++) {
          const u = x / size;
          const nCoarse = smoothNoise(u * 120, v * 120) * 0.30;
          const nMed = smoothNoise(u * 240, v * 240) * 0.22;
          let h = (nCoarse + nMed) * 0.32;
          h += Math.sin(v * Math.PI * 180) * 0.012;
          heightField[y * size + x] = h;
        }
      }

      const baseIvoryR = 244 / 255;
      const baseIvoryG = 242 / 255;
      const baseIvoryB = 237 / 255;
      const shadowStoneR = 184 / 255;
      const shadowStoneG = 180 / 255;
      const shadowStoneB = 168 / 255;

      const bumpScale = 1.45;
      for (let y = 0; y < size; y++) {
        const v = y / size;
        for (let x = 0; x < size; x++) {
          const u = x / size;
          const idx = (y * size + x) * 4;
          const xRight = (x + 1) % size;
          const yUp = Math.min(size - 1, y + 1);

          const hCenter = heightField[y * size + x];
          const hRight = heightField[y * size + xRight];
          const hUp = heightField[yUp * size + x];

          const dX = (hCenter - hRight) * bumpScale;
          const dY = (hCenter - hUp) * bumpScale;
          const len = Math.sqrt(dX * dX + dY * dY + 1.0);

          normalData[idx] = Math.round(((dX / len) * 0.5 + 0.5) * 255);
          normalData[idx + 1] = Math.round(((dY / len) * 0.5 + 0.5) * 255);
          normalData[idx + 2] = Math.round(((1.0 / len) * 0.5 + 0.5) * 255);
          normalData[idx + 3] = 255;

          const baseRough = 0.56 - (hCenter - 0.15) * 0.06;
          const roughVal = Math.max(0.35, Math.min(0.68, baseRough));
          const rByte = Math.round(roughVal * 255);
          roughData[idx] = rByte;
          roughData[idx + 1] = rByte;
          roughData[idx + 2] = rByte;
          roughData[idx + 3] = 255;

          // Chiaroscuro sutil en flancos para leer volumen blanco
          let shade = 1.0;
          const distLeft = Math.min(Math.abs(u - 0.25), Math.abs(u - 1.25));
          const distRight = Math.min(Math.abs(u - 0.75), Math.abs(u + 0.25));
          shade -= Math.exp(-(distLeft * distLeft) / (2 * 0.10 * 0.10)) * 0.40;
          shade -= Math.exp(-(distRight * distRight) / (2 * 0.10 * 0.10)) * 0.32;

          if (v < 0.075) {
            const t = v / 0.075;
            shade *= 0.52 + 0.48 * (t * t);
          }
          if (v > 0.85 && v < 0.91) {
            shade *= 0.80;
          }

          const clampedShade = Math.max(0.2, Math.min(1.0, shade));
          const rCol = shadowStoneR + (baseIvoryR - shadowStoneR) * clampedShade;
          const gCol = shadowStoneG + (baseIvoryG - shadowStoneG) * clampedShade;
          const bCol = shadowStoneB + (baseIvoryB - shadowStoneB) * clampedShade;

          colorData[idx] = Math.round(rCol * 255);
          colorData[idx + 1] = Math.round(gCol * 255);
          colorData[idx + 2] = Math.round(bCol * 255);
          colorData[idx + 3] = 255;

          const aoVal = Math.max(0.3, Math.min(1.0, 0.4 + 0.6 * clampedShade));
          const aoByte = Math.round(aoVal * 255);
          aoData[idx] = aoByte;
          aoData[idx + 1] = aoByte;
          aoData[idx + 2] = aoByte;
          aoData[idx + 3] = 255;
        }
      }

      return {
        colorMap: makeTextureFromRGBA(colorData, size, size, true),
        normalMap: makeTextureFromRGBA(normalData, size, size, false),
        roughnessMap: makeTextureFromRGBA(roughData, size, size, false),
        aoMap: makeTextureFromRGBA(aoData, size, size, false),
      };
    }

    function createCapPBRMaps() {
      const width = 256;
      const height = 96;
      const colorData = new Uint8Array(width * height * 4);
      const normalData = new Uint8Array(width * height * 4);
      const numRibs = 72;

      for (let y = 0; y < height; y++) {
        const v = y / height;
        const isRibZone = v > 0.18 && v < 0.88;

        for (let x = 0; x < width; x++) {
          const u = x / width;
          const angle = u * Math.PI * 2 * numRibs;
          let nx = Math.sin(x * 12.3 + y * 24.1) * 0.03;
          let ny = Math.cos(x * 15.7 - y * 11.9) * 0.03;
          let nz = 1.0;

          if (isRibZone) {
            nx += -Math.sin(angle) * 0.35;
            nz = Math.sqrt(Math.max(0.1, 1.0 - nx * nx - ny * ny));
          }

          const idx = (y * width + x) * 4;
          normalData[idx] = Math.round((nx * 0.5 + 0.5) * 255);
          normalData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
          normalData[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
          normalData[idx + 3] = 255;

          let shade = 0.96;
          if (isRibZone) {
            shade *= 0.82 + 0.18 * (Math.cos(angle) * 0.5 + 0.5);
          }
          colorData[idx] = Math.round(242 * shade);
          colorData[idx + 1] = Math.round(240 * shade);
          colorData[idx + 2] = Math.round(234 * shade);
          colorData[idx + 3] = 255;
        }
      }

      return {
        colorMap: makeTextureFromRGBA(colorData, width, height, true),
        normalMap: makeTextureFromRGBA(normalData, width, height, false),
      };
    }

    // 4. Sombra de contacto de estudio suave (Warm Olive-Taupe)
    function createContactShadowTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 512, 512);

        // Sombra direccional proyectada suave hacia atrás-izquierda
        ctx.save();
        ctx.translate(236, 246);
        ctx.scale(1.24, 0.86);
        const castGrad = ctx.createRadialGradient(0, 0, 24, 0, 0, 160);
        castGrad.addColorStop(0, 'rgba(42, 46, 36, 0.28)');
        castGrad.addColorStop(0.45, 'rgba(56, 54, 44, 0.15)');
        castGrad.addColorStop(0.78, 'rgba(72, 68, 58, 0.04)');
        castGrad.addColorStop(1, 'rgba(72, 68, 58, 0)');
        ctx.fillStyle = castGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 160, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Anillo de contacto oscuro directamente bajo la base (R = 0.43)
        const aoGrad = ctx.createRadialGradient(256, 256, 20, 256, 256, 114);
        aoGrad.addColorStop(0, 'rgba(32, 36, 28, 0.44)');
        aoGrad.addColorStop(0.55, 'rgba(36, 40, 32, 0.46)');
        aoGrad.addColorStop(0.74, 'rgba(54, 52, 42, 0.20)');
        aoGrad.addColorStop(1, 'rgba(54, 52, 42, 0)');
        ctx.fillStyle = aoGrad;
        ctx.beginPath();
        ctx.arc(256, 256, 114, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
    }

    // 5. Perfil de Torno Anatómico de la Botella 1 Litro (galyonBottle.ts)
    function getBottleProfilePoints() {
      const pts = [];
      const R = GALYON_SPECS.bodyRadius; // 0.47
      const R_RECESS = R - 0.0012;

      // Base rehundida (punt) y anillo de apoyo en mesa
      pts.push(new THREE.Vector2(0.0, 0.044));
      pts.push(new THREE.Vector2(0.12, 0.040));
      pts.push(new THREE.Vector2(0.24, 0.028));
      pts.push(new THREE.Vector2(0.34, 0.012));
      pts.push(new THREE.Vector2(0.39, 0.002));
      pts.push(new THREE.Vector2(0.408, 0.0));
      pts.push(new THREE.Vector2(0.432, 0.0));
      pts.push(new THREE.Vector2(0.452, 0.010));
      pts.push(new THREE.Vector2(0.464, 0.028));
      pts.push(new THREE.Vector2(0.469, 0.052));
      pts.push(new THREE.Vector2(R, 0.085));

      // Bumper inferior y receso de etiqueta
      pts.push(new THREE.Vector2(R, 0.172));
      pts.push(new THREE.Vector2(R_RECESS, 0.180));
      pts.push(new THREE.Vector2(R_RECESS, 0.50));
      pts.push(new THREE.Vector2(R_RECESS, 0.83));
      pts.push(new THREE.Vector2(R_RECESS, 1.16));
      pts.push(new THREE.Vector2(R_RECESS, 1.480));

      // Bumper superior y hombro robusto
      pts.push(new THREE.Vector2(R, 1.488));
      pts.push(new THREE.Vector2(R, 1.56));
      pts.push(new THREE.Vector2(0.466, 1.605));
      pts.push(new THREE.Vector2(0.456, 1.650));
      pts.push(new THREE.Vector2(0.440, 1.695));
      pts.push(new THREE.Vector2(0.416, 1.738));
      pts.push(new THREE.Vector2(0.385, 1.778));
      pts.push(new THREE.Vector2(0.348, 1.812));
      pts.push(new THREE.Vector2(0.305, 1.842));
      pts.push(new THREE.Vector2(0.265, 1.865));
      pts.push(new THREE.Vector2(0.238, 1.882));

      // Cuello y anillo de precinto
      pts.push(new THREE.Vector2(0.236, 1.895));
      pts.push(new THREE.Vector2(0.260, 1.908));
      pts.push(new THREE.Vector2(0.260, 1.925));
      pts.push(new THREE.Vector2(0.236, 1.936));
      pts.push(new THREE.Vector2(0.234, 2.10));
      pts.push(new THREE.Vector2(0.232, 2.14));
      pts.push(new THREE.Vector2(0.205, 2.15));
      pts.push(new THREE.Vector2(0.190, 2.13));
      pts.push(new THREE.Vector2(0.190, 2.06));

      return pts;
    }

    function createBottleBodyGeometry(segments = 128) {
      const points = getBottleProfilePoints();
      const geometry = new THREE.LatheGeometry(points, segments, Math.PI, Math.PI * 2);
      geometry.computeVertexNormals();

      const posAttr = geometry.attributes.position;
      const uvAttr = geometry.attributes.uv;
      if (posAttr && uvAttr) {
        const totalH = GALYON_SPECS.totalHeight;
        for (let i = 0; i < uvAttr.count; i++) {
          const y = posAttr.getY(i);
          const vNorm = Math.max(0, Math.min(1, y / totalH));
          uvAttr.setY(i, vNorm);
        }
        uvAttr.needsUpdate = true;
        geometry.setAttribute('uv2', uvAttr.clone());
      }
      return geometry;
    }

    // 6. Geometría Esculpida 3D de la Tapa (72 estrías físicas)
    function createCapGeometry(segments = 192) {
      const cols = Math.max(segments, 192);
      const R = GALYON_SPECS.capRadius;
      const yStart = 1.90;
      const capHeight = GALYON_SPECS.capHeight;
      const yEnd = yStart + capHeight;
      const numRibs = 72;
      const ribAmplitude = 0.0036;

      const rows = [
        { y: yStart + 0.005, r: 0.232, ribFactor: 0, tamperFactor: 0 },
        { y: yStart, r: R - 0.004, ribFactor: 0, tamperFactor: 0 },
        { y: yStart + 0.005, r: R + 0.001, ribFactor: 0, tamperFactor: 0.3 },
        { y: yStart + 0.035, r: R + 0.001, ribFactor: 0, tamperFactor: 0.3 },
        { y: yStart + 0.039, r: R - 0.007, ribFactor: 0, tamperFactor: 1.0 },
        { y: yStart + 0.046, r: R - 0.007, ribFactor: 0, tamperFactor: 1.0 },
        { y: yStart + 0.051, r: R, ribFactor: 0.3, tamperFactor: 0 },
        { y: yStart + 0.058, r: R + 0.001, ribFactor: 1.0, tamperFactor: 0 },
        { y: yStart + 0.140, r: R + 0.001, ribFactor: 1.0, tamperFactor: 0 },
        { y: yEnd - 0.028, r: R + 0.001, ribFactor: 1.0, tamperFactor: 0 },
        { y: yEnd - 0.020, r: R, ribFactor: 0.2, tamperFactor: 0 },
        { y: yEnd - 0.011, r: R - 0.002, ribFactor: 0, tamperFactor: 0 },
        { y: yEnd - 0.004, r: R - 0.008, ribFactor: 0, tamperFactor: 0 },
        { y: yEnd, r: R - 0.018, ribFactor: 0, tamperFactor: 0 },
        { y: yEnd, r: 0.150, ribFactor: 0, tamperFactor: 0 },
        { y: yEnd - 0.0025, r: 0.142, ribFactor: 0, tamperFactor: 0 },
        { y: yEnd - 0.0025, r: 0.028, ribFactor: 0, tamperFactor: 0 },
        { y: yEnd - 0.001, r: 0.0, ribFactor: 0, tamperFactor: 0 },
      ];

      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const uvs = [];
      const indices = [];

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        const v = (row.y - yStart) / capHeight;

        for (let cIdx = 0; cIdx <= cols; cIdx++) {
          const u = cIdx / cols;
          const theta = (u - 0.5) * Math.PI * 2;
          let radius = row.r;

          if (row.ribFactor > 0) {
            const w = Math.cos(theta * numRibs);
            const shaped = Math.tanh(w * 2.2) * 0.5 + 0.5;
            radius += shaped * ribAmplitude * row.ribFactor;
          }
          if (row.tamperFactor > 0) {
            const bridge = Math.cos(theta * 24) > 0.75 ? 0.004 : 0.0;
            radius += bridge * row.tamperFactor;
          }

          const x = Math.sin(theta) * radius;
          const z = Math.cos(theta) * radius;
          positions.push(x, row.y, z);
          uvs.push(u, v);
        }
      }

      for (let rIdx = 0; rIdx < rows.length - 1; rIdx++) {
        for (let cIdx = 0; cIdx < cols; cIdx++) {
          const a = rIdx * (cols + 1) + cIdx;
          const b = (rIdx + 1) * (cols + 1) + cIdx;
          const c = (rIdx + 1) * (cols + 1) + (cIdx + 1);
          const d = rIdx * (cols + 1) + (cIdx + 1);
          indices.push(a, d, b);
          indices.push(b, d, c);
        }
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    }

    // 7. Cilindro Envolvente de la Etiqueta (U = 0.50 centrado en frontal +Z)
    function createLabelGeometry(segments = 128) {
      const radius = GALYON_SPECS.bodyRadius + 0.0006;
      const yBottom = GALYON_SPECS.labelYStart;
      const yTop = GALYON_SPECS.labelYEnd;
      const height = yTop - yBottom;
      const heightSegments = 16;

      const geometry = new THREE.BufferGeometry();
      const positions = [];
      const normals = [];
      const uvs = [];
      const indices = [];

      for (let yIndex = 0; yIndex <= heightSegments; yIndex++) {
        const v = yIndex / heightSegments;
        const y = yBottom + v * height;

        for (let xIndex = 0; xIndex <= segments; xIndex++) {
          const u = xIndex / segments;
          const theta = (u - 0.5) * Math.PI * 2;
          const x = Math.sin(theta) * radius;
          const z = Math.cos(theta) * radius;

          positions.push(x, y, z);
          normals.push(Math.sin(theta), 0, Math.cos(theta));
          uvs.push(u, v);
        }
      }

      for (let yIndex = 0; yIndex < heightSegments; yIndex++) {
        for (let xIndex = 0; xIndex < segments; xIndex++) {
          const a = yIndex * (segments + 1) + xIndex;
          const b = (yIndex + 1) * (segments + 1) + xIndex;
          const c = (yIndex + 1) * (segments + 1) + (xIndex + 1);
          const d = yIndex * (segments + 1) + (xIndex + 1);
          indices.push(a, d, b);
          indices.push(b, d, c);
        }
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    }

    // 8. Dimensiones y Configuración de Escena
    let width = mount.clientWidth || 360;
    let height = mount.clientHeight || 540;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 50);
    camera.position.set(0, 1.09, 4.35);

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
    renderer.toneMappingExposure = 1.02;

    const canvas = renderer.domElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.outline = 'none';
    mount.appendChild(canvas);

    // 9. Iluminación de Estudio Calibrada (Anti-Washout / Editorial)
    const keyLight = new THREE.DirectionalLight('#FFFDF8', 1.25);
    keyLight.position.set(2.6, 2.5, 2.1);
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight('#F4F0E6', '#8A8374', 0.65);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight('#D6D0C2', 0.45);
    rimLight.position.set(-2.4, 1.8, -1.8);
    scene.add(rimLight);

    const emeraldLight = new THREE.PointLight('#3A7D2C', 0.22, 6.5, 1.8);
    emeraldLight.position.set(-2.0, 0.8, -1.5);
    scene.add(emeraldLight);

    const grazingLight = new THREE.PointLight('#F5F1E8', 0.30, 5.5, 1.8);
    grazingLight.position.set(1.5, 1.4, 1.7);
    scene.add(grazingLight);

    // 10. Plano de Sombra de Contacto en el Suelo (Y = 0.001)
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.001;
    scene.add(shadowMesh);

    // 11. Materiales PBR Calibrados
    const bottleMaps = createBottlePBRMaps();
    const capMaps = createCapPBRMaps();

    const bottleMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      map: bottleMaps.colorMap,
      roughness: 0.58,
      roughnessMap: bottleMaps.roughnessMap,
      metalness: 0.0,
      normalMap: bottleMaps.normalMap,
      normalScale: new THREE.Vector2(0.32, 0.32),
      aoMap: bottleMaps.aoMap,
      aoMapIntensity: 0.85,
      clearcoat: 0.0,
      clearcoatRoughness: 0.65,
      specularIntensity: 0.22,
      specularColor: new THREE.Color('#F3EFE6'),
      ior: 1.46,
    });

    const labelMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      roughness: 0.56,
      metalness: 0.0,
      specularIntensity: 0.25,
      clearcoat: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    const capMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#f8faf9'),
      map: capMaps.colorMap,
      normalMap: capMaps.normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughness: 0.48,
      metalness: 0.0,
      clearcoat: 0.0,
      specularIntensity: 0.20,
    });

    function setupTextureProps(tex) {
      if (!tex) return;
      if (THREE.SRGBColorSpace) {
        tex.colorSpace = THREE.SRGBColorSpace;
      } else if (THREE.sRGBEncoding) {
        tex.encoding = THREE.sRGBEncoding;
      }
      if (renderer && renderer.capabilities) {
        tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
      }
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    }

    // Carga de la textura de etiqueta HD
    const texLoader = new THREE.TextureLoader();
    texLoader.load(
      'assets/textures/galyon-label.png',
      function (tex) {
        setupTextureProps(tex);
        labelMaterial.map = tex;
        labelMaterial.needsUpdate = true;
      },
      undefined,
      function () {
        texLoader.load('assets/galyon-label-hd.png', function (tex2) {
          setupTextureProps(tex2);
          labelMaterial.map = tex2;
          labelMaterial.needsUpdate = true;
        });
      }
    );

    // 12. Construcción del Ensamblaje del Modelo 3D
    const modelGroup = new THREE.Group();
    modelGroup.name = 'GALYON_TRICHO_STAGE';
    scene.add(modelGroup);

    const bottleBody = new THREE.Mesh(createBottleBodyGeometry(128), bottleMaterial);
    bottleBody.name = 'Bottle_Body_HDPE';
    modelGroup.add(bottleBody);

    const bottleCap = new THREE.Mesh(createCapGeometry(192), capMaterial);
    bottleCap.name = 'Bottle_Cap_Knurled';
    modelGroup.add(bottleCap);

    const bottleLabel = new THREE.Mesh(createLabelGeometry(128), labelMaterial);
    bottleLabel.name = 'Bottle_Label_Wrap';
    modelGroup.add(bottleLabel);

    const loaderEl = document.getElementById('viewer3d-loader');
    if (loaderEl) {
      loaderEl.style.opacity = '0';
      setTimeout(() => {
        loaderEl.style.display = 'none';
      }, 300);
    }

    // 13. OrbitControls con límites suaves
    let controls = null;
    let isUserInteracting = false;
    let isAutoRotate = true;
    const hint = document.getElementById('facts3dHint');

    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.target.set(0, 1.02, 0);
      controls.minDistance = 1.4;
      controls.maxDistance = 6.0;
      controls.minPolarAngle = 0.15;
      controls.maxPolarAngle = Math.PI / 2 + 0.06;
      controls.enablePan = false;
      controls.enableZoom = false; // Preserva el scroll natural de la página
      controls.rotateSpeed = 0.85;

      controls.addEventListener('start', function () {
        isUserInteracting = true;
        isTransitioningCam = false;
        mount.classList.add('is-dragging');
        if (hint) {
          hint.style.opacity = '0';
          setTimeout(() => { hint.style.display = 'none'; }, 350);
        }
      });

      controls.addEventListener('end', function () {
        isUserInteracting = false;
        mount.classList.remove('is-dragging');
      });
    }

    // 14. Presets de Cámara y Transición Suave (Frontal, 3/4, Posterior, Tapa)
    const viewCoords = {
      front: {
        pos: new THREE.Vector3(0, 1.09, 4.35),
        look: new THREE.Vector3(0, 1.02, 0),
      },
      threeQuarter: {
        pos: new THREE.Vector3(3.05, 1.32, 3.05),
        look: new THREE.Vector3(0, 1.00, 0),
      },
      back: {
        pos: new THREE.Vector3(0, 1.09, -4.35),
        look: new THREE.Vector3(0, 1.02, 0),
      },
      cap: {
        pos: new THREE.Vector3(0.45, 2.75, 1.50),
        look: new THREE.Vector3(0.0, 1.88, 0),
      },
    };

    let targetCamPos = viewCoords.front.pos.clone();
    let targetCamLook = viewCoords.front.look.clone();
    let isTransitioningCam = false;

    function setCameraView(presetName) {
      const target = viewCoords[presetName];
      if (!target) return;
      targetCamPos.copy(target.pos);
      targetCamLook.copy(target.look);
      isTransitioningCam = true;
      if (modelGroup) {
        modelGroup.rotation.y = 0; // Vuelve al alineamiento base de la vista seleccionada
      }
    }

    // Conectar botones de la interfaz
    const viewButtons = document.querySelectorAll('[data-view]');
    viewButtons.forEach((btn) => {
      btn.addEventListener('click', function () {
        const view = this.getAttribute('data-view');
        viewButtons.forEach((b) => b.classList.remove('is-active'));
        this.classList.add('is-active');
        setCameraView(view);
      });
    });

    const autoRotateBtn = document.getElementById('btn3dAutoRotate');
    if (autoRotateBtn) {
      autoRotateBtn.addEventListener('click', function () {
        isAutoRotate = !isAutoRotate;
        this.classList.toggle('is-active', isAutoRotate);
      });
    }

    // 15. Manejador de Resize Responsivo
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

    // 16. Bucle de Animación y Rotación 360° Suave
    let lastTime = performance.now();

    function animate(now) {
      requestAnimationFrame(animate);

      // Transición suave de cámara hacia preset seleccionado
      if (isTransitioningCam) {
        camera.position.lerp(targetCamPos, 0.08);
        if (controls) {
          controls.target.lerp(targetCamLook, 0.08);
        }
        if (camera.position.distanceTo(targetCamPos) < 0.01) {
          camera.position.copy(targetCamPos);
          if (controls) controls.target.copy(targetCamLook);
          isTransitioningCam = false;
        }
      }

      if (controls) {
        controls.update();
      }

      // Rotación 360° continua si el usuario no está arrastrando
      if (modelGroup && isAutoRotate && !isUserInteracting && !isTransitioningCam) {
        modelGroup.rotation.y += 0.004;
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    // Exponer API global
    window.galyon3DViewer = {
      setView: setCameraView,
      toggleAutoRotate: (state) => {
        isAutoRotate = state !== undefined ? state : !isAutoRotate;
        if (autoRotateBtn) autoRotateBtn.classList.toggle('is-active', isAutoRotate);
      },
      modelGroup,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
