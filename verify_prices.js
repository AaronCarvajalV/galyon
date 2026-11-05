#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const script = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
const combosHtml = fs.readFileSync(path.join(__dirname, 'combos.html'), 'utf8');
const bioinsumosHtml = fs.readFileSync(path.join(__dirname, 'bioinsumos.html'), 'utf8');
const allHtml = combosHtml + '\n' + bioinsumosHtml;

const elements = new Map();
const element = id => {
  if (!elements.has(id)) {
    elements.set(id, {
      textContent: '',
      innerHTML: '',
      hidden: false,
      value: '',
      setAttribute() {},
      classList: {
        add() {},
        remove() {}
      }
    });
  }
  return elements.get(id);
};

let stored = JSON.stringify({ 'combo-cacao': 2, 'bact-subtilis': 1 });
const ctx = {
  document: { getElementById: element, querySelectorAll: () => [] },
  localStorage: { getItem: () => stored, setItem: (key, value) => { stored = value; } },
  setTimeout: () => 0,
  clearTimeout() {}
};

const api = vm.runInNewContext(
  script.slice(0, script.indexOf('// Add buttons never redirect')) +
  '\n({PRODUCTS,subtotal,total,shippingCost,checkoutText,renderCart,change,count,reset(items){cart={...items};renderCart();}})',
  ctx
);

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('PASS ' + name);
}

test('Confirmed prices match every product and crop combo', () => {
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
    assert.equal(api.PRODUCTS[sku].unit, price, sku);
  }
  for (const match of allHtml.matchAll(/data-product-price="([^"]+)">\$(\d+)/g)) {
    assert.equal(Number(match[2]), expected[match[1]], match[1]);
  }
});

test('Existing saved quantities use current prices without clearing the cart', () => {
  assert.equal(api.count(), 3);
  assert.equal(api.subtotal(), 140);
  assert.equal(api.total(), 145);
});

test('Each crop combo costs $60 with free shipping', () => {
  for (const crop of ['cacao', 'mango', 'cana', 'banano']) {
    api.reset({ ['combo-' + crop]: 1 });
    assert.equal(api.total(), 60);
    assert.equal(api.shippingCost(), 0);
    assert.ok(api.checkoutText().includes('Total del pedido: $60'));
  }
});

test('TRICHO promotion includes its gift at $40 with free shipping', () => {
  api.reset({ 'promo-tricho-humicos': 1 });
  assert.equal(api.total(), 40);
  assert.equal(api.shippingCost(), 0);
  assert.ok(api.checkoutText().includes('1 kg de ácidos húmicos de regalo'));
  assert.ok(element('deal-status').textContent.includes('1 kg'));
});

test('Promotion quantities update gift quantities and subtotals', () => {
  api.change('promo-tricho-humicos', 1);
  assert.equal(api.total(), 80);
  assert.ok(element('deal-status').textContent.includes('2 kg'));
  assert.ok(element('cart-items').innerHTML.includes('$80'));
});

test('Two BACT liters do not receive the TRICHO promotion', () => {
  api.reset({ 'bact-subtilis': 2 });
  assert.equal(api.total(), 45);
  assert.ok(!api.checkoutText().includes('de regalo'));
});

test('Humics and substrate use their individual prices and one shipping charge', () => {
  api.reset({ 'acidos-humicos-1kg': 2, 'tricho-sustrato-1kg': 1 });
  assert.equal(api.subtotal(), 55);
  assert.equal(api.shippingCost(), 5);
  assert.equal(api.total(), 60);
});

test('Mixed cart preserves combo free shipping and charges $5 for other items', () => {
  api.reset({ 'combo-mango': 1, 'acidos-humicos-1kg': 1 });
  assert.equal(api.total(), 80);
  assert.ok(api.checkoutText().includes('Envío gratis en combos'));
});

test('WhatsApp contains unit prices, line totals, shipping, total and destination', () => {
  element('ship-city').value = 'Babahoyo';
  api.reset({ 'insecta-bt': 2 });
  const message = api.checkoutText();
  for (const text of ['$20 c/u · $40', 'Subtotal de productos: $40', 'Envío: $5', 'Total del pedido: $45', 'Babahoyo']) {
    assert.ok(message.includes(text), text);
  }
});

test('Quantity limits, persistence and empty cart remain functional', () => {
  api.reset({ 'bact-subtilis': 50 });
  api.change('bact-subtilis', 1);
  assert.equal(api.count(), 50);
  api.change('bact-subtilis', -50);
  assert.equal(api.count(), 0);
  assert.equal(api.total(), 0);
  assert.ok(element('drawer-footer').hidden);
  assert.equal(stored, '{}');
});

console.log(`\n======================================================`);
console.log(`  ${passed} pricing and combo commercial checks passed successfully!`);
console.log(`======================================================\n`);
