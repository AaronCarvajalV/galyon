'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = __dirname;
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

console.log('======================================================');
console.log('  GALYON (REPO LOCAL) BIOPHILIC SHADOWS AUDIT');
console.log('======================================================\n');

// 1. Asset check
test('Asset mindora-leaf-shadows.webp exists in assets/', () => {
  const assetPath = path.join(root, 'assets', 'mindora-leaf-shadows.webp');
  assert.ok(fs.existsSync(assetPath), 'Asset file must exist');
  const stat = fs.statSync(assetPath);
  assert.ok(stat.size > 20000, `Asset size ${stat.size} should be > 20KB`);
});

// 2. index.html check (Home page must NOT have the background)
test('index.html (Página de Inicio) is preserved WITHOUT the leaf shadows background', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(!html.includes('leaf-shadows-ambient'), 'index.html must NOT contain leaf-shadows-ambient');
  assert.ok(!html.includes('mindora-leaf-shadows'), 'index.html must NOT contain mindora-leaf-shadows');
  assert.ok(html.includes('id="heroSection"'), 'index.html must retain its heroSection');
});

// 3. All other pages check (All tabs except Home must have the background)
const targetPages = [
  'nosotros.html',
  'asesor.html',
  'combos.html',
  'bioinsumos.html',
  'analisis-suelo.html',
  'acompanamiento.html'
];

targetPages.forEach(page => {
  test(`Page ${page} contains .site-bg-fixed with leaf-shadows-bg, drift and light`, () => {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    assert.ok(html.includes('class="site-bg-fixed"'), `${page} must contain .site-bg-fixed`);
    assert.ok(html.includes('class="leaf-shadows-bg"'), `${page} must contain .leaf-shadows-bg`);
    assert.ok(html.includes('class="leaf-shadows-drift"'), `${page} must contain .leaf-shadows-drift`);
    assert.ok(html.includes('class="leaf-shadows-light"'), `${page} must contain .leaf-shadows-light`);
  });
});

// 4. CSS styles.css check
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
test('styles.css defines .site-bg-fixed with sage background #eef0e4', () => {
  assert.ok(styles.includes('.site-bg-fixed'), 'styles.css must define .site-bg-fixed');
  assert.ok(styles.includes('position: fixed'), 'Must be position fixed');
  assert.ok(styles.includes('#eef0e4'), 'Must set #eef0e4 background');
});

test('styles.css defines keyframes for leafShadowBreeze and dappledSunlight with will-change', () => {
  assert.ok(styles.includes('@keyframes leafShadowBreeze'), 'Must define @keyframes leafShadowBreeze');
  assert.ok(styles.includes('@keyframes dappledSunlight'), 'Must define @keyframes dappledSunlight');
  assert.ok(styles.includes('will-change: transform'), 'Must use will-change: transform for 60fps GPU acceleration');
});

test('styles.css respects prefers-reduced-motion', () => {
  assert.ok(styles.includes('@media (prefers-reduced-motion: reduce)'), 'Must include reduced motion query');
  assert.ok(styles.includes('animation: none !important'), 'Must halt animations on reduced motion');
});

// 5. script.js check
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
test('script.js includes scroll parallax and visibilitychange pause', () => {
  assert.ok(script.includes('--leaf-scroll-y'), 'script.js must set --leaf-scroll-y');
  assert.ok(script.includes('visibilitychange'), 'script.js must listen to visibilitychange');
});

console.log(`\n======================================================`);
console.log(`  AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
console.log(`======================================================`);

if (failed > 0) {
  process.exit(1);
}
