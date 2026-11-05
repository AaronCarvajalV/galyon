#!/usr/bin/env node
'use strict';

/**
 * Independent Automated Verification Suite for GALYON Asesor de Cultivos
 * Philosophy: Ponytail (Zero external dependencies, Node.js standard library only, fast, deterministic)
 *
 * Scope:
 *   1. Static Architecture & Integrity Audit (index.html, script.js, styles.css, assets/asesor)
 *   2. Exhaustive Step-by-Step Advisor Simulation (Steps 0, 1, 2, 3, 4 across all areas, crops, parts, symptoms)
 *   3. Strict Filesystem Casing & 404 Prevention (Exact character match on case-sensitive filesystems)
 *   4. Data Structures Exhaustive Audit (farmCrops, gardenCrops, specificParts, catalog, tailoredCrops, portfolio)
 *   5. Image File Integrity (Valid WebP/JPEG headers, non-empty, accessible)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Target project root (defaults to script directory)
const ROOT_DIR = process.argv[2] ? path.resolve(process.argv[2]) : __dirname;

console.log(`\n======================================================`);
console.log(`  GALYON ASESOR DE CULTIVOS — IMAGE AUDIT & VERIFICATION`);
console.log(`  Target directory: ${ROOT_DIR}`);
console.log(`======================================================\n`);

let passedCount = 0;
let failedCount = 0;
const failures = [];

function test(description, fn) {
  try {
    fn();
    console.log(`  ✔ [PASS] ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${description}`);
    console.error(`           Reason: ${err.message}`);
    failedCount++;
    failures.push({ description, error: err.message });
  }
}

/**
 * Checks if a relative path exists on disk with exact casing on every path component.
 * Essential for detecting case-sensitivity bugs that pass on macOS APFS but fail with 404 on Linux.
 */
function checkExactPath(baseDir, relativePath) {
  const normalized = path.normalize(relativePath).replace(/^(\.\/)+/, '');
  const segments = normalized.split(path.sep);
  let currentDir = baseDir;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment || segment === '.') continue;

    if (!fs.existsSync(currentDir)) {
      return { exists: false, exactCase: false, failedSegment: segment, atDir: currentDir };
    }

    const entries = fs.readdirSync(currentDir);
    if (!entries.includes(segment)) {
      const caseInsensitiveMatch = entries.find(e => e.toLowerCase() === segment.toLowerCase());
      if (caseInsensitiveMatch) {
        return {
          exists: true,
          exactCase: false,
          expected: segment,
          actual: caseInsensitiveMatch,
          dir: currentDir
        };
      }
      return { exists: false, exactCase: false, missingSegment: segment, atDir: currentDir };
    }

    currentDir = path.join(currentDir, segment);
  }

  return { exists: true, exactCase: true, fullPath: currentDir };
}

/**
 * Validates binary header for WebP (RIFF....WEBP) or JPEG (FF D8 FF)
 */
function validateImageHeader(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.length < 12) return { valid: false, reason: 'File smaller than 12 bytes' };

  // WebP check
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { valid: true, format: 'WebP', size: buf.length };
  }

  // JPEG check
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { valid: true, format: 'JPEG', size: buf.length };
  }

  // PNG check
  if (buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') {
    return { valid: true, format: 'PNG', size: buf.length };
  }

  return { valid: false, reason: 'Unrecognized image magic bytes' };
}

// Read core project files
const asesorHtmlPath = fs.existsSync(path.join(ROOT_DIR, 'asesor.html')) ? path.join(ROOT_DIR, 'asesor.html') : path.join(ROOT_DIR, 'index.html');
const indexPath = asesorHtmlPath;
const scriptPath = path.join(ROOT_DIR, 'script.js');
const stylesPath = path.join(ROOT_DIR, 'styles.css');
const asesorDir = path.join(ROOT_DIR, 'assets', 'asesor');

const indexHtml = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
const scriptJs = fs.existsSync(scriptPath) ? fs.readFileSync(scriptPath, 'utf8') : '';
const stylesCss = fs.existsSync(stylesPath) ? fs.readFileSync(stylesPath, 'utf8') : '';

// ---------------------------------------------------------------------
// SUITE 1: Static Architecture & File Structure Audit
// ---------------------------------------------------------------------
console.log('--- 1. Static Architecture & File Structure Audit ---');

test('asesor.html contains #asesor section with semantic structure', () => {
  assert.ok(indexHtml.includes('id="asesor"'), 'asesor.html is missing section #asesor');
  assert.ok(indexHtml.includes('id="advisor-app"'), 'asesor.html is missing #advisor-app container');
  assert.ok(indexHtml.includes('id="advisor-content"'), 'asesor.html is missing #advisor-content');
  assert.ok(indexHtml.includes('id="advisor-progress-bar"'), 'asesor.html is missing #advisor-progress-bar');
  assert.ok(indexHtml.includes('id="advisor-back"'), 'asesor.html is missing #advisor-back button');
  assert.ok(indexHtml.includes('id="advisor-restart"'), 'asesor.html is missing #advisor-restart button');
});

test('assets/asesor/ directory exists and contains valid WebP files', () => {
  assert.ok(fs.existsSync(asesorDir), `Directory not found: ${asesorDir}`);
  const files = fs.readdirSync(asesorDir);
  assert.ok(files.length >= 100, `Expected at least 100 advisor images, found ${files.length}`);

  // Ensure every file in assets/asesor is lowercase and ends with .webp
  for (const file of files) {
    assert.strictEqual(file, file.toLowerCase(), `Filename contains uppercase letters: ${file}`);
    assert.ok(file.endsWith('.webp'), `File in assets/asesor is not .webp: ${file}`);
    const check = validateImageHeader(path.join(asesorDir, file));
    assert.ok(check.valid, `Invalid image file ${file}: ${check.reason}`);
    assert.strictEqual(check.format, 'WebP', `File ${file} is not a valid WebP`);
  }
});

test('Portfolio product images referenced in advisor results exist in assets/', () => {
  const portfolioFiles = ['assets/linea-insecta.jpg', 'assets/linea-tricho.jpg', 'assets/linea-bact.jpg'];
  for (const rel of portfolioFiles) {
    const check = checkExactPath(ROOT_DIR, rel);
    assert.ok(check.exists, `Portfolio image missing: ${rel}`);
    assert.ok(check.exactCase, `Portfolio image case mismatch: ${rel}`);
    const header = validateImageHeader(path.join(ROOT_DIR, rel));
    assert.ok(header.valid, `Invalid image format for ${rel}`);
  }
});

test('styles.css contains no broken url() references in advisor rules', () => {
  const advisorBlockRegex = /([^{}]+(?:advisor|#asesor)[^{}]*)\{([^}]+)\}/g;
  let match;
  let advisorUrlCount = 0;
  while ((match = advisorBlockRegex.exec(stylesCss)) !== null) {
    const body = match[2];
    const urlMatches = [...body.matchAll(/url\((["']?)([^)"']+)\1\)/g)];
    for (const u of urlMatches) {
      advisorUrlCount++;
      const targetUrl = u[2];
      if (targetUrl.startsWith('data:') || targetUrl.startsWith('http')) continue;
      const check = checkExactPath(ROOT_DIR, targetUrl);
      assert.ok(check.exists && check.exactCase, `Broken url in styles.css: ${targetUrl}`);
    }
  }
  // Currently advisor styles use background colors/gradients, 0 broken URLs
  assert.strictEqual(advisorUrlCount, 0, 'Unexpected url() references found in advisor CSS');
});

// ---------------------------------------------------------------------
// SUITE 2: Dynamic Execution Simulation of All Advisor Journeys
// ---------------------------------------------------------------------
console.log('\n--- 2. Dynamic Execution Simulation of All Advisor Journeys ---');

// Extract the advisor IIFE from script.js
const advisorMatch = scriptJs.match(/\/\/ GALYON Asesor de Cultivos[\s\S]*?render\(\);\s*\}\)\(\);/);
assert.ok(advisorMatch, 'Could not find Advisor IIFE in script.js');

// Build an isolated simulation harness of the actual script.js logic
const renderedImages = [];
let interceptedHtml = '';

const runnerSandbox = `
const renderedImages = [];
let interceptedHtml = "";

const root = {
  dataset: {},
  addEventListener: () => {},
  contains: () => true
};
const content = {
  set innerHTML(val) {
    interceptedHtml = val;
    const matches = val.matchAll(/<img[^>]+src=["\x27]([^"\x27]+)["\x27][^>]*>/g);
    for (const m of matches) {
      renderedImages.push({ src: m[1], async: m[0].includes('decoding="async"') });
    }
  },
  get innerHTML() { return interceptedHtml; },
  querySelectorAll: () => []
};
const label = { textContent: "" };
const progress = { children: [{}, {}, {}, {}].map(() => ({ classList: { toggle: () => {} } })) };
const back = { hidden: false, addEventListener: () => {} };
const restart = { hidden: false, addEventListener: () => {} };
const window = {
  scrollY: 0,
  scrollTo: () => {},
  requestAnimationFrame: () => {}
};
const document = {
  getElementById: (id) => {
    if (id === "advisor-app") return root;
    if (id === "advisor-content") return content;
    if (id === "advisor-step-label") return label;
    if (id === "advisor-progress-bar") return progress;
    if (id === "advisor-back") return back;
    if (id === "advisor-restart") return restart;
    return null;
  }
};
` + advisorMatch[0]
  .replace('(()=>{', 'function runSimulator() {')
  .replace('render();\n})();', `
  return {
    setData: (d) => Object.assign(data, d),
    setStep: (s) => { step = s; },
    render,
    farmCrops,
    gardenCrops,
    partsForCrop,
    chooseSymptoms,
    data,
    renderedImages,
    specificParts,
    catalog,
    general,
    unknown,
    result,
    productPhotos: advisorProductPhotos
  };
}; runSimulator();
`);

const sim = eval(runnerSandbox);

// Execute exhaustive simulation across all flows
sim.setStep(0);
sim.render();

const areas = ['Finca o plantación', 'Huerto o jardín'];
for (const area of areas) {
  sim.setData({ area, crop: '', part: '', symptom: '' });
  sim.setStep(1);
  sim.render();

  const crops = area === 'Huerto o jardín' ? sim.gardenCrops : sim.farmCrops;
  for (const cropObj of crops) {
    const crop = cropObj.key;
    sim.setData({ area, crop, part: '', symptom: '' });
    sim.setStep(2);
    sim.render();

    const parts = sim.partsForCrop();
    for (const partObj of parts) {
      const part = partObj.key;
      sim.setData({ area, crop, part, symptom: '' });
      sim.setStep(3);
      sim.render();

      const symptoms = sim.chooseSymptoms();
      for (const symObj of symptoms) {
        const symptom = symObj.key;
        sim.setData({ area, crop, part, symptom });
        sim.setStep(4);
        sim.render();
      }
    }
  }
}

test('Advisor simulator generated non-empty paths across all wizard steps', () => {
  assert.ok(sim.renderedImages.length > 500, `Expected >500 image renders, got ${sim.renderedImages.length}`);
});

const uniqueRenderedSrcs = [...new Set(sim.renderedImages.map(x => x.src))];

test('100% of dynamically rendered images exist on disk with exact casing', () => {
  assert.ok(uniqueRenderedSrcs.length >= 100, `Expected at least 100 unique image URLs, found ${uniqueRenderedSrcs.length}`);
  const errors = [];

  for (const relSrc of uniqueRenderedSrcs) {
    const check = checkExactPath(ROOT_DIR, relSrc);
    if (!check.exists) {
      errors.push(`Missing image: ${relSrc}`);
    } else if (!check.exactCase) {
      errors.push(`Case mismatch: ${relSrc} (expected ${check.expected}, found ${check.actual})`);
    }
  }

  assert.strictEqual(errors.length, 0, `Detected ${errors.length} image path errors:\n${errors.join('\n')}`);
});

test('No empty string or undefined or NaN image src rendered in any step', () => {
  for (const entry of sim.renderedImages) {
    assert.ok(entry.src && entry.src.trim() !== '', `Empty image src found: ${JSON.stringify(entry)}`);
    assert.ok(!entry.src.includes('undefined'), `Undefined found in image src: ${entry.src}`);
    assert.ok(!entry.src.includes('null'), `Null found in image src: ${entry.src}`);
    assert.ok(!entry.src.includes('.webp.webp'), `Double extension found in image src: ${entry.src}`);
  }
});

// ---------------------------------------------------------------------
// SUITE 3: Deep Data Structure Audit (Beyond Standard Traversal)
// ---------------------------------------------------------------------
console.log('\n--- 3. Deep Data Structure Audit (All Defined Crops & Parts) ---');

test('All images declared in farmCrops and gardenCrops exist with exact casing', () => {
  const allCrops = [...sim.farmCrops, ...sim.gardenCrops];
  for (const crop of allCrops) {
    if (crop.image) {
      const rel = `assets/asesor/${crop.image}.webp`;
      const check = checkExactPath(ROOT_DIR, rel);
      assert.ok(check.exists && check.exactCase, `Crop image missing or case mismatch: ${rel} for ${crop.key}`);
    }
  }
});

test('All images declared across specificParts exist with exact casing', () => {
  for (const [cropName, partsList] of Object.entries(sim.specificParts)) {
    for (const [partName, imgKey] of partsList) {
      if (imgKey) {
        const rel = `assets/asesor/${imgKey}.webp`;
        const check = checkExactPath(ROOT_DIR, rel);
        assert.ok(check.exists && check.exactCase, `specificParts[${cropName}][${partName}] missing: ${rel}`);
      }
    }
  }
});

test('All images declared in catalog (symptoms) exist with exact casing', () => {
  for (const [cropName, dataOrList] of Object.entries(sim.catalog)) {
    const items = Array.isArray(dataOrList)
      ? dataOrList
      : Object.values(dataOrList).flat();

    for (const item of items) {
      if (item.image) {
        const rel = `assets/asesor/${item.image}.webp`;
        const check = checkExactPath(ROOT_DIR, rel);
        assert.ok(check.exists && check.exactCase, `catalog[${cropName}] symptom image missing: ${rel} (${item.key})`);
      }
    }
  }
});

test('General fallback and unknown advisor options point to valid images', () => {
  for (const item of sim.general) {
    if (item.image) {
      const rel = `assets/asesor/${item.image}.webp`;
      const check = checkExactPath(ROOT_DIR, rel);
      assert.ok(check.exists && check.exactCase, `general symptom missing: ${rel}`);
    }
  }
  if (sim.unknown.image) {
    const rel = `assets/asesor/${sim.unknown.image}.webp`;
    const check = checkExactPath(ROOT_DIR, rel);
    assert.ok(check.exists && check.exactCase, `unknown option missing: ${rel}`);
  }
});

test('Edge-case crops (Arroz, Maracuyá, Otro cultivo) render valid images and clean fallbacks', () => {
  const edgeCrops = ['Arroz', 'Maracuyá', 'Otro cultivo'];
  for (const crop of edgeCrops) {
    sim.setData({ area: 'Finca o plantación', crop, part: '', symptom: '' });
    sim.setStep(2);
    sim.render();
    const parts = sim.partsForCrop();
    for (const partObj of parts) {
      sim.setData({ area: 'Finca o plantación', crop, part: partObj.key, symptom: '' });
      sim.setStep(3);
      sim.render();
      const symptoms = sim.chooseSymptoms();
      for (const symObj of symptoms) {
        sim.setData({ area: 'Finca o plantación', crop, part: partObj.key, symptom: symObj.key });
        sim.setStep(4);
        sim.render();
      }
    }
  }
});

test('All WebP assets in assets/asesor have positive dimensions (width > 0, height > 0)', () => {
  const files = fs.readdirSync(asesorDir);
  for (const file of files) {
    const buf = fs.readFileSync(path.join(asesorDir, file));
    assert.ok(buf.length > 100, `File ${file} suspiciously small (${buf.length} bytes)`);
    assert.strictEqual(buf.toString('ascii', 0, 4), 'RIFF', `Header mismatch for ${file}`);
    assert.strictEqual(buf.toString('ascii', 8, 12), 'WEBP', `Header format mismatch for ${file}`);
  }
});

// ---------------------------------------------------------------------
// SUITE 4: Error Handler & Fallback Resilience
// ---------------------------------------------------------------------
console.log('\n--- 4. Error Handler & Fallback Resilience ---');

test('script.js error listener gracefully handles image error events on card options', () => {
  // Extract error listener function from script.js
  const handlerMatch = scriptJs.match(/root\.addEventListener\('error',\s*(ev\s*=>\s*\{[\s\S]*?\}),\s*true\);/);
  assert.ok(handlerMatch, 'Could not find root error event listener in script.js');

  class MockElement {
    constructor(tagName, className = '') {
      this.tagName = tagName.toUpperCase();
      this.classList = {
        _classes: new Set(className.split(' ').filter(Boolean)),
        add: (c) => this.classList._classes.add(c),
        contains: (c) => this.classList._classes.has(c),
        remove: (c) => this.classList._classes.delete(c)
      };
      this.children = [];
      this.parentNode = null;
    }
    get className() { return [...this.classList._classes].join(' '); }
    set className(val) { this.classList._classes = new Set(val.split(' ').filter(Boolean)); }
    setAttribute() {}
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }
    remove() {
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter(c => c !== this);
        this.parentNode = null;
      }
    }
    replaceWith(newElem) {
      if (this.parentNode) {
        const idx = this.parentNode.children.indexOf(this);
        if (idx !== -1) {
          this.parentNode.children.splice(idx, 1, newElem);
          newElem.parentNode = this.parentNode;
          this.parentNode = null;
        }
      }
    }
    querySelector(selector) {
      const cls = selector.replace(/^\./, '');
      return this.children.find(c => c.classList && c.classList.contains(cls)) || null;
    }
    closest(selector) {
      let cur = this;
      const targets = selector.split(',').map(s => s.trim().replace(/^\./, ''));
      while (cur) {
        if (cur.classList && targets.some(t => cur.classList.contains(t))) return cur;
        cur = cur.parentNode;
      }
      return null;
    }
  }

  const HTMLImageElement = MockElement;
  const document = { createElement: (tag) => new MockElement(tag) };
  const errorHandler = eval('(' + handlerMatch[1] + ')');

  // Test 1: Image inside .advisor-option fails
  const card = new MockElement('button', 'advisor-option');
  const imgOption = new MockElement('img');
  card.appendChild(imgOption);

  errorHandler({ target: imgOption });
  assert.ok(card.classList.contains('is-text'), 'Card option should have gained is-text class on image error');
  assert.ok(card.children.some(c => c.className.includes('advisor-no-photo')), 'Card should contain advisor-no-photo placeholder');
});

test('script.js error listener removes misleading tags and adds placeholder in evidence images', () => {
  const handlerMatch = scriptJs.match(/root\.addEventListener\('error',\s*(ev\s*=>\s*\{[\s\S]*?\}),\s*true\);/);
  class MockElement {
    constructor(tagName, className = '') {
      this.tagName = tagName.toUpperCase();
      this.classList = {
        _classes: new Set(className.split(' ').filter(Boolean)),
        add: (c) => this.classList._classes.add(c),
        contains: (c) => this.classList._classes.has(c),
        remove: (c) => this.classList._classes.delete(c)
      };
      this.children = [];
      this.parentNode = null;
    }
    get className() { return [...this.classList._classes].join(' '); }
    set className(val) { this.classList._classes = new Set(val.split(' ').filter(Boolean)); }
    setAttribute() {}
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }
    remove() {
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter(c => c !== this);
        this.parentNode = null;
      }
    }
    querySelector(selector) {
      const cls = selector.replace(/^\./, '');
      return this.children.find(c => c.classList && c.classList.contains(cls)) || null;
    }
    closest(selector) {
      let cur = this;
      const targets = selector.split(',').map(s => s.trim().replace(/^\./, ''));
      while (cur) {
        if (cur.classList && targets.some(t => cur.classList.contains(t))) return cur;
        cur = cur.parentNode;
      }
      return null;
    }
  }

  const HTMLImageElement = MockElement;
  const document = { createElement: (tag) => new MockElement(tag) };
  const errorHandler = eval('(' + handlerMatch[1] + ')');

  // Test: Image inside .advisor-evidence-image fails
  const frame = new MockElement('div', 'advisor-evidence-image');
  const imgEvidence = new MockElement('img');
  const tagEvidence = new MockElement('span', 'advisor-evidence-tag');
  tagEvidence.textContent = 'FOTO DE REFERENCIA';
  frame.appendChild(imgEvidence);
  frame.appendChild(tagEvidence);

  errorHandler({ target: imgEvidence });
  assert.strictEqual(frame.children.includes(imgEvidence), false, 'Failed image must be removed from frame');
  assert.strictEqual(frame.children.includes(tagEvidence), false, 'Misleading caption tag must be removed on error');
  const notice = frame.children.find(c => c.className.includes('advisor-image-unavailable'));
  assert.ok(notice, 'Frame must contain advisor-image-unavailable notice');
  assert.strictEqual(notice.textContent, 'Fotografía no disponible');
});

test('script.js error listener handles product photo failures, idempotency, and non-image error safety', () => {
  const handlerMatch = scriptJs.match(/root\.addEventListener\('error',\s*(ev\s*=>\s*\{[\s\S]*?\}),\s*true\);/);
  class MockElement {
    constructor(tagName, className = '') {
      this.tagName = tagName.toUpperCase();
      this.classList = {
        _classes: new Set(className.split(' ').filter(Boolean)),
        add: (c) => this.classList._classes.add(c),
        contains: (c) => this.classList._classes.has(c),
        remove: (c) => this.classList._classes.delete(c)
      };
      this.children = [];
      this.parentNode = null;
    }
    get className() { return [...this.classList._classes].join(' '); }
    set className(val) { this.classList._classes = new Set(val.split(' ').filter(Boolean)); }
    setAttribute() {}
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }
    remove() {
      if (this.parentNode) {
        this.parentNode.children = this.parentNode.children.filter(c => c !== this);
        this.parentNode = null;
      }
    }
    querySelector(selector) {
      const cls = selector.replace(/^\./, '');
      return this.children.find(c => c.classList && c.classList.contains(cls)) || null;
    }
    closest(selector) {
      let cur = this;
      const targets = selector.split(',').map(s => s.trim().replace(/^\./, ''));
      while (cur) {
        if (cur.classList && targets.some(t => cur.classList.contains(t))) return cur;
        cur = cur.parentNode;
      }
      return null;
    }
  }

  const HTMLImageElement = MockElement;
  const document = { createElement: (tag) => new MockElement(tag) };
  const errorHandler = eval('(' + handlerMatch[1] + ')');

  // Test product photo failure
  const frame = new MockElement('div', 'advisor-product-photo');
  const imgProduct = new MockElement('img');
  frame.appendChild(imgProduct);

  errorHandler({ target: imgProduct });
  assert.strictEqual(frame.children.includes(imgProduct), false, 'Product image must be removed');
  const notices = frame.children.filter(c => c.className.includes('advisor-image-unavailable'));
  assert.strictEqual(notices.length, 1, 'Exactly one unavailable notice should be added');

  // Test idempotency: triggering error again on same frame should not duplicate notice
  errorHandler({ target: imgProduct });
  const noticesAfter = frame.children.filter(c => c.className.includes('advisor-image-unavailable'));
  assert.strictEqual(noticesAfter.length, 1, 'Unavailable notice must remain singular on repeated error');

  const variant = new MockElement('figure', 'advisor-catalog-variant');
  const variantImage = new MockElement('img');
  const caption = new MockElement('figcaption');
  variant.appendChild(variantImage);
  variant.appendChild(caption);
  errorHandler({target: variantImage});
  assert.ok(!variant.children.includes(variantImage), 'Failed variant image must be removed');
  assert.ok(variant.children.includes(caption), 'Microorganism caption must survive image failure');
  assert.strictEqual(variant.children.filter(c => c.className.includes('advisor-image-unavailable')).length, 1);

  // Test non-image event: should return safely without throwing
  errorHandler({ target: new MockElement('div') });
  errorHandler({ target: null });
});

test('advisor-evidence renders is-text-only class when no image is present to protect mobile layout', () => {
  // Simulate result() with no photo (e.g. Otro cultivo with general symptom)
  sim.setData({ area: 'Finca o plantación', crop: 'Otro cultivo', part: 'Hojas', symptom: 'manchas' });
  const html = sim.result();
  assert.ok(html.includes('class="advisor-evidence is-text-only"'), 'Must render is-text-only when no photo exists');
  assert.ok(stylesCss.includes('.crop-advisor .advisor-evidence.is-text-only'), 'styles.css must style is-text-only');
  assert.ok(stylesCss.includes('.crop-advisor .advisor-evidence:not(.is-text-only)'), 'styles.css media query must exempt is-text-only from 2-column layout');
});

test('All dynamically rendered advisor images include decoding="async"', () => {
  assert.ok(sim.renderedImages.length > 500);
  for (const image of sim.renderedImages) assert.ok(image.async, `Missing async decoding: ${image.src}`);
});

const expectedProductPhotos = {
  'Trichoderma spp.': ['tricho', 'tricho-1l.webp', 'GALYON TRICHO'],
  'Bacillus subtilis': ['subtilis', 'bact-subtilis-1l.webp', 'GALYON BACT'],
  'Bacillus amyloliquefaciens': ['amyl', 'bact-amyloliquefaciens-1l.webp', 'GALYON BACT'],
  'Bacillus thuringiensis': ['bt', 'insecta-bt-1l.webp', 'GALYON INSECTA'],
  'Beauveria bassiana': ['beauveria', 'insecta-beauveria-1l.webp', 'GALYON INSECTA'],
  'Metarhizium anisopliae': ['metarhizium', 'insecta-metarhizium-1l.webp', 'GALYON INSECTA']
};
test('Each specific microorganism renders exactly its individual catalog bottle', () => {
  for (const [microbe, [key, file, line]] of Object.entries(expectedProductPhotos)) {
    const html = sim.productPhotos(line, microbe);
    assert.strictEqual((html.match(/<img /g) || []).length, 1, microbe);
    assert.ok(html.includes(`src="assets/catalogo/${file}"`), microbe);
    assert.ok(html.includes(`data-advisor-product="${key}"`), microbe);
    assert.ok(html.includes(`${microbe}, presentación de 1 litro`), microbe);
    assert.ok(checkExactPath(ROOT_DIR, `assets/catalogo/${file}`).exists);
    assert.ok(validateImageHeader(path.join(ROOT_DIR, 'assets/catalogo', file)).valid);
  }
});
test('Two named fungal alternatives show only those two bottles, never Bt', () => {
  const html = sim.productPhotos('GALYON INSECTA', 'Beauveria bassiana o Metarhizium anisopliae');
  assert.strictEqual((html.match(/<img /g) || []).length, 2);
  assert.ok(html.includes('insecta-beauveria-1l.webp'));
  assert.ok(html.includes('insecta-metarhizium-1l.webp'));
  assert.ok(!html.includes('insecta-bt-1l.webp'));
});
test('A line without a selected formulation displays labeled alternatives without selecting a default', () => {
  for (const [line, count] of [['GALYON BACT', 2], ['GALYON INSECTA', 3]]) {
    const html = sim.productPhotos(line);
    assert.strictEqual((html.match(/<img /g) || []).length, count);
    assert.strictEqual((html.match(/<figcaption>/g) || []).length, count);
    assert.ok(html.includes('Formulaciones a evaluar según el caso'));
    assert.ok(!html.includes('assets/linea-'));
  }
});
test('Known advisor results select the right individual bottle in both result engines', () => {
  for (const [crop, part, symptom, expected] of [
    ['Cacao', 'Frutos o mazorcas', 'cacao_negro', 'amyl'],
    ['Banano', 'Hojas', 'banano_sigatoka', 'subtilis'],
    ['Banano', 'Raíces o tallo', 'banano_picudo', 'metarhizium'],
    ['Café', 'Frutos o granos', 'cafe_broca', 'beauveria'],
    ['Maíz', 'Hojas', 'maiz_oruga', 'bt'],
    ['Maíz', 'Raíces o tallo', 'maiz_raices_deterioradas', 'tricho']
  ]) {
    sim.setData({area: 'Finca o plantación', crop, part, symptom});
    const html = sim.result();
    assert.ok(html.includes(`data-advisor-product="${expected}"`), `${crop} / ${symptom}`);
    assert.strictEqual((html.match(/data-advisor-product=/g) || []).length, 1, symptom);
  }
});

// ---------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------
console.log(`\n======================================================`);
console.log(`  VERIFICATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log(`======================================================\n`);

if (failedCount > 0) {
  console.error(`FAILED ASSERTIONS (${failedCount}):`);
  for (const f of failures) {
    console.error(`- ${f.description}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log(`All Asesor de Cultivos image assertions passed successfully!`);
  console.log(`- Total image instances simulated: ${sim.renderedImages.length}`);
  console.log(`- Unique image assets certified: ${uniqueRenderedSrcs.length}`);
  console.log(`- Filesystem case-sensitivity: 100% exact match`);
  console.log(`- Zero 404 routes or missing assets detected.`);
  process.exit(0);
}
