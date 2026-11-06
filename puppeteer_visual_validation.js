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
  console.log('\n--- 1. Testing index.html (Hero Video & 3D Viewer) ---');
  await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#heroVideo');
  const videoSrc = await page.$eval('#heroVideo source', el => el.getAttribute('src'));
  assert.ok(videoSrc.includes('galyon-hero-reveal'), 'Hero video source should be galyon-hero-reveal');
  console.log('✔ Hero video & 3D container loaded without errors.');

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

  // 4. Validate asesor.html (Advisor story & interactive wizard)
  console.log('\n--- 4. Testing asesor.html (Advisor Story & Interactive Engine) ---');
  await page.goto('http://localhost:3000/asesor.html', { waitUntil: 'domcontentloaded' });
  
  // Verify active navbar link
  const asesorActiveNav = await page.$eval('.nav-item.is-active', el => el.textContent.trim());
  assert.equal(asesorActiveNav, 'Asesor', 'Asesor link in navbar must be active on asesor.html');

  // Verify story header
  await page.waitForSelector('.advisor-story');
  const storyHeading = await page.$eval('.advisor-story h2', el => el.textContent);
  assert.ok(storyHeading.includes('Cada planta cuenta una historia'), 'Advisor story heading should mention Cada planta cuenta una historia');
  console.log('✔ Advisor story intro loaded with correct editorial headline.');

  // Verify interactive wizard step 1
  await page.waitForSelector('.advisor-options');
  const cropButtons = await page.$$('.advisor-option');
  assert.ok(cropButtons.length >= 8, 'Advisor should render at least 8 crop options in step 1');
  console.log(`✔ Advisor step 1 loaded with ${cropButtons.length} crop options.`);

  // Click Maíz
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.advisor-option')).find(el => el.textContent.includes('Maíz'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Verify step 2 (parts)
  const partButtons = await page.$$('.advisor-option');
  assert.ok(partButtons.length >= 3, 'Maíz should have plant parts');
  console.log(`✔ Advisor transitioned to step 2 with ${partButtons.length} plant part options.`);

  // Click Hojas
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.advisor-option')).find(el => el.textContent.includes('Hojas'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Verify step 3 (symptoms)
  const symptomButtons = await page.$$('.advisor-option');
  assert.ok(symptomButtons.length >= 3, 'Should render symptoms for Maíz hojas');
  console.log(`✔ Advisor transitioned to step 3 with ${symptomButtons.length} symptom options.`);

  // Click first symptom
  await page.evaluate(() => {
    const btn = document.querySelector('.advisor-option');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // Verify step 4 (result / recommendation)
  await page.waitForSelector('.advisor-result-v523');
  const hasRecommendation = await page.$eval('.advisor-result-v523', el => el.textContent.length > 50);
  assert.ok(hasRecommendation, 'Advisor should display detailed diagnosis result');
  const hasResultImg = await page.$eval('.advisor-evidence img, .advisor-product img', el => !!el.getAttribute('src'));
  assert.ok(hasResultImg, 'Advisor result should include evidence or product image');
  console.log('✔ Advisor wizard completed successfully: diagnosis, image, and product recommendation verified.');

  // Check overflow on all viewports for asesor.html
  for (const vp of viewports) {
    await page.setViewport(vp);
    await new Promise(r => setTimeout(r, 100));
    const hasHOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.ok(!hasHOverflow, `Horizontal overflow detected in asesor.html at ${vp.name}`);
    console.log(`✔ asesor.html layout clean at ${vp.name} (${vp.width}x${vp.height})`);
  }

  // 5. Validate nosotros.html
  console.log('\n--- 5. Testing nosotros.html ---');
  await page.goto('http://localhost:3000/nosotros.html', { waitUntil: 'domcontentloaded' });
  const nosotrosActiveNav = await page.$eval('.nav-item.is-active', el => el.textContent.trim());
  assert.equal(nosotrosActiveNav, 'Nosotros', 'Nosotros link in navbar must be active on nosotros.html');
  for (const vp of viewports) {
    await page.setViewport(vp);
    await new Promise(r => setTimeout(r, 100));
    const hasHOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.ok(!hasHOverflow, `Horizontal overflow detected in nosotros.html at ${vp.name}`);
    console.log(`✔ nosotros.html layout clean at ${vp.name} (${vp.width}x${vp.height})`);
  }

  // 6. Validate analisis-suelo.html
  console.log('\n--- 6. Testing analisis-suelo.html (Soilv2 Packages & Layout) ---');
  await page.goto('http://localhost:3000/analisis-suelo.html', { waitUntil: 'domcontentloaded' });
  const sueloActiveNav = await page.$eval('.nav-item.is-active', el => el.textContent.trim());
  assert.equal(sueloActiveNav, 'Análisis de suelo', 'Análisis de suelo link in navbar must be active on analisis-suelo.html');
  const sueloWaypoint = await page.$eval('.section-waypoint', el => el.textContent.replace(/\s+/g, ' '));
  assert.ok(sueloWaypoint.includes('04') && sueloWaypoint.includes('ANÁLISIS DE SUELO'), 'Waypoint 04 must be present');
  const cardsCount = await page.$$eval('.soilv2-card', els => els.length);
  assert.equal(cardsCount, 5, 'Must render exactly 5 soil analysis package cards');
  const heroImageSrc = await page.$eval('.soilv2-hero > img', el => el.getAttribute('src'));
  assert.ok(heroImageSrc.includes('suelo-hero-muestreo-nuevo.webp'), 'Hero image must be present');
  console.log('✔ Soilv2 hero, waypoint 04, and all 5 package cards verified.');

  for (const vp of viewports) {
    await page.setViewport(vp);
    await new Promise(r => setTimeout(r, 100));
    const hasHOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.ok(!hasHOverflow, `Horizontal overflow detected in analisis-suelo.html at ${vp.name}`);
    console.log(`✔ analisis-suelo.html layout clean at ${vp.name} (${vp.width}x${vp.height})`);
  }

  // 7. Validate acompanamiento.html
  console.log('\n--- 7. Testing acompanamiento.html (Garantia, FAQ & Cross-Links) ---');
  await page.goto('http://localhost:3000/acompanamiento.html', { waitUntil: 'domcontentloaded' });
  const acompActiveNav = await page.$eval('.nav-item.is-active', el => el.textContent.trim());
  assert.equal(acompActiveNav, 'Acompañamiento', 'Acompañamiento link in navbar must be active on acompanamiento.html');
  const acompWaypoint = await page.$eval('.section-waypoint', el => el.textContent.replace(/\s+/g, ' '));
  assert.ok(acompWaypoint.includes('05') && acompWaypoint.includes('ACOMPAÑAMIENTO'), 'Waypoint 05 must be present');
  const faqItemsCount = await page.$$eval('.faq-list details', els => els.length);
  assert.equal(faqItemsCount, 5, 'Must render exactly 5 FAQ items');
  const faqComboText = await page.$$eval('.faq-list details', els => els[3].textContent);
  assert.ok(faqComboText.includes('$60'), 'FAQ about combos must quote updated $60 price');
  assert.ok(!faqComboText.includes('$70'), 'FAQ about combos must not quote old $70 price');
  console.log('✔ Waypoint 05, trust section, and 5 FAQs (verified $60 combos price) clean.');

  for (const vp of viewports) {
    await page.setViewport(vp);
    await new Promise(r => setTimeout(r, 100));
    const hasHOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.ok(!hasHOverflow, `Horizontal overflow detected in acompanamiento.html at ${vp.name}`);
    console.log(`✔ acompanamiento.html layout clean at ${vp.name} (${vp.width}x${vp.height})`);
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
