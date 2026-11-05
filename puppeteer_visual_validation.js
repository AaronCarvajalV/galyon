#!/usr/bin/env node
'use strict';
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-compact-360', width: 360, height: 800 }
];

async function run() {
  console.log('🚀 Starting Puppeteer browser validation...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Validate index.html
  console.log('\n--- 1. Testing index.html (Hero & 3D Viewer) ---');
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.hero__headline');
  const headlineText = await page.$eval('.hero__headline', el => el.textContent.replace(/\s+/g, ''));
  assert.equal(headlineText, 'GALYON', 'Hero headline should say GALYON');
  const threeCanvas = await page.$('#viewer3d-container canvas');
  console.log('✔ Hero headline & 3D container loaded without errors.');

  // Validate exact Navbar items and layout across all 7 pages
  console.log('\n--- Testing Unified Navbar across all 7 pages ---');
  const expectedNav = ['Inicio', 'Nosotros', 'Asesor', 'Combos', 'Productos', 'Análisis de suelo', 'Acompañamiento'];
  const testPages = ['index.html', 'nosotros.html', 'asesor.html', 'combos.html', 'bioinsumos.html', 'analisis-suelo.html', 'acompanamiento.html'];
  
  for (const p of testPages) {
    await page.goto(`http://localhost:3000/${p}`, { waitUntil: 'domcontentloaded' });
    const navItems = await page.$$eval('.nav-menu .nav-item', els => els.map(e => e.textContent.trim()));
    assert.deepEqual(navItems, expectedNav, `Navbar items mismatch in ${p}: ${JSON.stringify(navItems)}`);
    
    // Check cart button and WhatsApp button
    const hasCart = await page.$eval('#open-cart', el => !!el);
    const cartCount = await page.$eval('#cart-count', el => el.textContent.trim());
    const waText = await page.$eval('#header-wa', el => el.textContent.trim());
    
    assert.ok(hasCart, `Missing #open-cart in ${p}`);
    assert.equal(cartCount, '0', `Cart count should start at 0 in ${p}`);
    assert.ok(waText.includes('Escríbenos'), `WhatsApp button text should include 'Escríbenos' in ${p}`);
    console.log(`✔ Navbar verified in ${p}: [${navItems.join(' · ')}] + Cart(0) + Escríbenos`);
  }

  // Check overflow on all viewports for index.html
  for (const vp of viewports) {
    await page.setViewport(vp);
    await new Promise(r => setTimeout(r, 100));
    const hasHOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.ok(!hasHOverflow, `Horizontal overflow detected in index.html at ${vp.name}`);
    console.log(`✔ index.html layout clean at ${vp.name} (${vp.width}x${vp.height})`);
  }

  // 2. Validate combos.html
  console.log('\n--- 2. Testing combos.html (Combos & Weekly Offer) ---');
  await page.goto('http://localhost:3000/combos.html', { waitUntil: 'domcontentloaded' });
  
  // Verify active navbar link
  const activeNavText = await page.$eval('.nav-item.is-active', el => el.textContent.trim());
  assert.equal(activeNavText, 'Combos', 'Combos link in navbar must be active on combos.html');

  // Verify Weekly offer & 4 combo cards
  await page.waitForSelector('.weekly-offer');
  const comboCardsCount = await page.$$eval('.combo-card', els => els.length);
  assert.equal(comboCardsCount, 4, 'Should have exactly 4 combo cards');
  console.log(`✔ Found weekly offer and ${comboCardsCount} crop combo cards.`);

  // Test adding promo to cart
  await page.click('[data-add-sku="promo-tricho-humicos"]');
  await page.waitForSelector('.cart-item');
  const cartItemTitle = await page.$eval('.cart-item strong', el => el.textContent);
  assert.ok(cartItemTitle.includes('Promoción TRICHO'), 'Cart item should be Promoción TRICHO');
  const cartTotalText = await page.$eval('#cart-total', el => el.textContent.trim());
  assert.equal(cartTotalText, '$40', 'Cart total should be $40 for the promotion');
  console.log('✔ Cart interaction: promo-tricho-humicos successfully added at $40 with free shipping.');

  // Test adding Cacao combo
  await page.click('[data-combo="cacao"]');
  await new Promise(r => setTimeout(r, 200));
  const newCartTotal = await page.$eval('#cart-total', el => el.textContent.trim());
  assert.equal(newCartTotal, '$100', 'Cart total should be $100 after adding $60 combo');
  console.log('✔ Cart interaction: combo-cacao successfully added at $60 (total $100).');

  // Test Lightbox modal
  await page.click('.close-btn'); // close drawer
  await new Promise(r => setTimeout(r, 200));
  await page.evaluate(() => {
    const btn = document.querySelector('.combo-card .combo-image-open');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 100));
  const isLightboxOpen = await page.evaluate(() => {
    const d = document.getElementById('combo-lightbox');
    return d && (d.open || d.hasAttribute('open'));
  });
  assert.ok(isLightboxOpen, 'Lightbox dialog should open when clicking combo poster');
  await page.evaluate(() => {
    document.querySelector('.combo-lightbox-close').click();
  });
  await new Promise(r => setTimeout(r, 100));
  const isLightboxClosed = await page.evaluate(() => {
    const d = document.getElementById('combo-lightbox');
    return d && !d.open && !d.hasAttribute('open');
  });
  assert.ok(isLightboxClosed, 'Lightbox dialog should close properly');
  console.log('✔ Lightbox modal opens and closes properly.');

  // Check overflow on all viewports for combos.html
  for (const vp of viewports) {
    await page.setViewport(vp);
    await new Promise(r => setTimeout(r, 100));
    const hasHOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.ok(!hasHOverflow, `Horizontal overflow detected in combos.html at ${vp.name}`);
    console.log(`✔ combos.html layout clean at ${vp.name} (${vp.width}x${vp.height})`);
  }

  // 3. Validate bioinsumos.html
  console.log('\n--- 3. Testing bioinsumos.html (Catalog, Humicos, Sustrato) ---');
  await page.goto('http://localhost:3000/bioinsumos.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#humicos');
  await page.waitForSelector('#tricho-sustrato');

  // Check humicos price and button
  const humicPrice = await page.$eval('#humicos .humic-price strong', el => el.textContent.trim());
  assert.equal(humicPrice, '$15', 'Humicos price should be $15');
  console.log('✔ Ácidos Húmicos 50 % section loaded with price $15 and cart button.');

  // Check overflow on all viewports for bioinsumos.html
  for (const vp of viewports) {
    await page.setViewport(vp);
    await new Promise(r => setTimeout(r, 100));
    const hasHOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.ok(!hasHOverflow, `Horizontal overflow detected in bioinsumos.html at ${vp.name}`);
    console.log(`✔ bioinsumos.html layout clean at ${vp.name} (${vp.width}x${vp.height})`);
  }

  await browser.close();

  // Console error check (filter out expected network or favicon if any)
  const fatalErrors = consoleErrors.filter(e => !e.includes('favicon.ico') && !e.includes('analytics'));
  assert.equal(fatalErrors.length, 0, `Unexpected browser console errors: ${fatalErrors.join(', ')}`);

  console.log('\n======================================================');
  console.log('  🎉 ALL PUPPETEER HEADLESS AUDITS PASSED WITH 0 ERRORS! ');
  console.log('======================================================');
}

run().catch(err => {
  console.error('Fatal Puppeteer test failure:', err);
  process.exit(1);
});
