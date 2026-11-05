#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = __dirname;
let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('✔ PASS ' + name);
  } catch (err) {
    console.error('✖ FAIL ' + name);
    console.error(err);
    process.exit(1);
  }
}

console.log('========================================================');
console.log('  GALYON — COMMERCIAL CATALOG & COMBOS AUDIT SUITE      ');
console.log('========================================================');

// 1. Assets verification
test('Required multimedia assets exist on disk', () => {
  const assets = [
    'assets/acidos-humicos-50.webp',
    'assets/promo-tricho-humicos.webp',
    'assets/combo-cacao-titan.webp',
    'assets/combo-mango-furioso.webp',
    'assets/combo-cana-brava.webp',
    'assets/combo-verde-bestia.webp',
    'assets/catalogo/tricho-1l.webp',
    'assets/catalogo/bact-subtilis-1l.webp',
    'assets/catalogo/bact-amyloliquefaciens-1l.webp',
    'assets/catalogo/insecta-bt-1l.webp',
    'assets/catalogo/insecta-beauveria-1l.webp',
    'assets/catalogo/insecta-metarhizium-1l.webp'
  ];
  for (const a of assets) {
    const full = path.join(root, a);
    assert.ok(fs.existsSync(full), `Asset missing: ${a}`);
    assert.ok(fs.statSync(full).size > 1000, `Asset empty or corrupt: ${a}`);
  }
});

// 2. Navigation items across all pages
test('Navbar includes Combos link in all site pages', () => {
  const pages = [
    'index.html',
    'nosotros.html',
    'bioinsumos.html',
    'combos.html',
    'asesor.html',
    'analisis-suelo.html',
    'acompanamiento.html'
  ];
  for (const page of pages) {
    const content = fs.readFileSync(path.join(root, page), 'utf8');
    assert.ok(content.includes('href="combos.html"'), `${page} is missing href="combos.html"`);
    assert.ok(content.includes('class="nav-item'), `${page} is missing nav-item styling`);
    if (page === 'combos.html') {
      assert.ok(
        content.includes('class="nav-item is-active" aria-current="page">Combos</a>'),
        'combos.html should have is-active on Combos link'
      );
    }
  }
});

// 3. script.js commercial catalog & cart evaluation
const scriptCode = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const elements = new Map();
const mockElement = id => {
  if (!elements.has(id)) {
    elements.set(id, {
      textContent: '',
      innerHTML: '',
      hidden: false,
      value: '',
      setAttribute() {},
      classList: { add() {}, remove() {} }
    });
  }
  return elements.get(id);
};
let storedStorage = '{}';
const sandbox = {
  document: {
    getElementById: mockElement,
    querySelectorAll: () => []
  },
  localStorage: {
    getItem: () => storedStorage,
    setItem: (key, val) => { storedStorage = val; }
  },
  setTimeout: () => 0,
  clearTimeout() {}
};

const extractIndex = scriptCode.indexOf('document.querySelectorAll(\'[data-add-sku]\')');
const cartCoreCode = scriptCode.slice(0, extractIndex) +
  '\n({PRODUCTS, subtotal, total, shippingCost, shippingShort, shippingCategory, checkoutText, renderCart, change, count, reset(items){cart={...items};renderCart();}})';

const cartApi = vm.runInNewContext(cartCoreCode, sandbox);

test('PRODUCTS definition includes all new commercial products and correct pricing', () => {
  const expected = {
    'tricho-trichoderma': 20,
    'tricho-trichoderma-galon': 60,
    'bact-subtilis': 20,
    'bact-amyloliquefaciens': 20,
    'insecta-bt': 20,
    'insecta-beauveria': 20,
    'insecta-metarhizium': 20,
    'promo-tricho-humicos': 40,
    'acidos-humicos-1kg': 15,
    'tricho-sustrato-1kg': 25,
    'combo-cacao': 60,
    'combo-mango': 60,
    'combo-cana': 60,
    'combo-banano': 60
  };
  for (const [sku, price] of Object.entries(expected)) {
    assert.ok(cartApi.PRODUCTS[sku], `SKU missing in PRODUCTS: ${sku}`);
    assert.equal(cartApi.PRODUCTS[sku].unit, price, `Price mismatch for ${sku}`);
  }
});

test('Combos feature free shipping while single products incur standard shipping', () => {
  // Single combo
  cartApi.reset({ 'combo-cacao': 1 });
  assert.equal(cartApi.subtotal(), 60);
  assert.equal(cartApi.shippingCost(), 0);
  assert.equal(cartApi.total(), 60);
  assert.equal(cartApi.shippingShort(), 'Gratis');

  // Single standard product
  cartApi.reset({ 'acidos-humicos-1kg': 1 });
  assert.equal(cartApi.subtotal(), 15);
  assert.equal(cartApi.shippingCost(), 5);
  assert.equal(cartApi.total(), 20);

  // Mixed cart: combo + single product
  cartApi.reset({ 'combo-banano': 1, 'tricho-sustrato-1kg': 1 });
  assert.equal(cartApi.subtotal(), 85);
  assert.equal(cartApi.shippingCost(), 5);
  assert.equal(cartApi.total(), 90);
  assert.ok(cartApi.shippingCategory().includes('Envío gratis en combos'));
});

test('Weekly promotion includes free gift description and free shipping', () => {
  cartApi.reset({ 'promo-tricho-humicos': 1 });
  assert.equal(cartApi.subtotal(), 40);
  assert.equal(cartApi.shippingCost(), 0);
  assert.equal(cartApi.total(), 40);
  assert.ok(cartApi.checkoutText().includes('Promoción TRICHO + ácidos húmicos'));
  assert.ok(mockElement('deal-status').textContent.includes('1 kg de ácidos húmicos de regalo'));
});

test('combos.html contains all 4 crop combos and weekly offer', () => {
  const content = fs.readFileSync(path.join(root, 'combos.html'), 'utf8');
  assert.ok(content.includes('data-add-sku="promo-tricho-humicos"'));
  assert.ok(content.includes('data-combo="cacao"'));
  assert.ok(content.includes('data-combo="mango"'));
  assert.ok(content.includes('data-combo="cana"'));
  assert.ok(content.includes('data-combo="banano"'));
  assert.ok(content.includes('combo-lightbox'));
  assert.ok(content.includes('id="cart-drawer"'));
});

test('bioinsumos.html contains Ácidos Húmicos 50 % and TRICHO sustrato cart button', () => {
  const content = fs.readFileSync(path.join(root, 'bioinsumos.html'), 'utf8');
  assert.ok(content.includes('data-add-sku="acidos-humicos-1kg"'));
  assert.ok(content.includes('data-add-sku="tricho-sustrato-1kg"'));
  assert.ok(content.includes('id="humicos"'));
  assert.ok(content.includes('id="tricho-sustrato"'));
});

console.log('========================================================');
console.log(`  ALL ${passed} VERIFICATION AUDITS PASSED CLEANLY!     `);
console.log('========================================================');
