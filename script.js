 'use strict';
const NUMBER = '593968933445';
const PRODUCTS = {
  'tricho-trichoderma': {name:'GALYON TRICHO · Trichoderma spp.', line:'tricho', image:'assets/linea-tricho.jpg', unit:20, unitLabel:'litro', sizeLabel:'1 litro'},
  'tricho-trichoderma-galon': {name:'GALYON TRICHO · Trichoderma spp. (galón)', line:'tricho', image:'assets/tricho-galon-adaptado.webp', unit:60, unitLabel:'galón', sizeLabel:'4 litros'},
  'bact-subtilis': {name:'GALYON BACT · Bacillus subtilis', line:'bact', image:'assets/linea-bact.jpg', unit:20, unitLabel:'litro', sizeLabel:'1 litro'},
  'bact-amyloliquefaciens': {name:'GALYON BACT · Bacillus amyloliquefaciens', line:'bact', image:'assets/linea-bact.jpg', unit:20, unitLabel:'litro', sizeLabel:'1 litro'},
  'insecta-bt': {name:'GALYON INSECTA · Bacillus thuringiensis', line:'insecta', image:'assets/linea-insecta.jpg', unit:20, unitLabel:'litro', sizeLabel:'1 litro'},
  'insecta-beauveria': {name:'GALYON INSECTA · Beauveria bassiana', line:'insecta', image:'assets/linea-insecta.jpg', unit:20, unitLabel:'litro', sizeLabel:'1 litro'},
  'insecta-metarhizium': {name:'GALYON INSECTA · Metarhizium anisopliae', line:'insecta', image:'assets/linea-insecta.jpg', unit:20, unitLabel:'litro', sizeLabel:'1 litro'},
  'promo-tricho-humicos': {name:'Promoción TRICHO + ácidos húmicos', line:'promo', image:'assets/promo-tricho-humicos.webp', unit:40, unitLabel:'combo', sizeLabel:'2 litros de TRICHO + 1 kg de ácidos húmicos de regalo', freeShipping:true},
  'acidos-humicos-1kg': {name:'Ácidos Húmicos 50 %', line:'humicos', image:'assets/acidos-humicos-50.webp', unit:15, unitLabel:'paquete', sizeLabel:'1 kg'},
  'tricho-sustrato-1kg': {name:'GALYON TRICHO en sustrato', line:'tricho', image:'assets/tricho-sustrato.webp', unit:25, unitLabel:'paquete', sizeLabel:'1 kg'},
  'combo-cacao': {freeShipping:true, name:'Cacao Vital (GALYON CACAO TITÁN) · 2 L TRICHO + 2 L BACT', line:'combo', image:'assets/combo-cacao-titan.webp', unit:60, unitLabel:'combo', sizeLabel:'4 litros'},
  'combo-mango': {freeShipping:true, name:'Mango Selecto (GALYON MANGO FURIOSO) · 2 L BACT + 2 L INSECTA', line:'combo', image:'assets/combo-mango-furioso.webp', unit:60, unitLabel:'combo', sizeLabel:'4 litros'},
  'combo-cana': {freeShipping:true, name:'Caña Productiva (GALYON CAÑA BRAVA) · 2 L BACT + 2 L INSECTA', line:'combo', image:'assets/combo-cana-brava.webp', unit:60, unitLabel:'combo', sizeLabel:'4 litros'},
  'combo-banano': {freeShipping:true, name:'Banano Próspero (GALYON VERDE BESTIA) · 2 L TRICHO + 2 L BACT', line:'combo', image:'assets/combo-verde-bestia.webp', unit:60, unitLabel:'combo', sizeLabel:'4 litros'}
};
const $ = id => document.getElementById(id);
let cart = {};
try {
  const saved = JSON.parse(localStorage.getItem('galyon_cart_v20') || '{}');
  for (const sku of Object.keys(PRODUCTS)) {
    const n = Number(saved[sku]);
    if(Number.isInteger(n) && n>0 && n<=50) cart[sku]=n;
  }
} catch(e) {}
function save(){try{localStorage.setItem('galyon_cart_v20', JSON.stringify(cart));}catch(e){}}
function count(){return Object.values(cart).reduce((a,b)=>a+b,0)}
const STANDARD_SHIPPING=5;
function money(value){return '$'+Number(value).toLocaleString('es-EC',{maximumFractionDigits:2});}
function cartEntries(){return Object.entries(cart).filter(([sku,qty])=>PRODUCTS[sku]&&qty>0);}
function subtotal(){return cartEntries().reduce((sum,[sku,qty])=>sum+PRODUCTS[sku].unit*qty,0);}
function shippingCost(){const rows=cartEntries();return rows.length&&rows.some(([sku])=>!PRODUCTS[sku].freeShipping)?STANDARD_SHIPPING:0;}
function total(){return subtotal()+shippingCost();}
function shippingCategory(){
 const rows=cartEntries();
 if(!rows.length)return 'Elige productos para calcular el envío';
 if(rows.every(([sku])=>PRODUCTS[sku].freeShipping))return 'Envío gratis en combos GALYON (Ecuador)';
 if(rows.some(([sku])=>PRODUCTS[sku].freeShipping))return 'Envío gratis en combos; envío de otros productos: '+money(STANDARD_SHIPPING);
 return 'Envío de productos individuales: '+money(STANDARD_SHIPPING);
}
function shippingShort(){return shippingCost()?money(shippingCost()):'Gratis';}
function syncProductPrices(){
 document.querySelectorAll('[data-product-price]').forEach(el=>{
  const product=PRODUCTS[el.dataset.productPrice];
  if(product)el.textContent=money(product.unit);
 });
}
function toast(message){const el=$('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2700)}
function city(){return $('ship-city')?.value.trim()||''}
function checkoutText(){
 const rows=cartEntries().map(([sku,qty])=>{const p=PRODUCTS[sku];return `• ${qty} × ${p.name} (${p.sizeLabel}) · ${money(p.unit)} c/u · ${money(p.unit*qty)}`;}).join('\n');

 return `¡Hola, GALYON! Quisiera solicitar estos productos:

${rows}

Subtotal de productos: ${money(subtotal())}
Envío: ${shippingShort()}
Total del pedido: ${money(total())}
${shippingCategory()}${city()?'\nCiudad o cantón: '+city():''}

¿Me confirman disponibilidad, entrega y métodos de pago?`;
}

function updateCheckout(){
 const b=$('checkout'); if(!b)return;
 b.href=count()?`https://wa.me/${NUMBER}?text=${encodeURIComponent(checkoutText())}`:`https://wa.me/${NUMBER}`;
 b.setAttribute('aria-disabled',String(count()===0));
}
function renderCart(){
 const n=count();
 $('cart-count').textContent=n;
 $('drawer-count').textContent=n?`(${n})`:'';
 $('empty-cart').hidden=n!==0;
 $('drawer-footer').hidden=n===0;
 document.querySelectorAll('.formulations-cart-count').forEach(el=>el.textContent=n);
 $('cart-items').innerHTML=cartEntries().map(([sku,qty])=>{
  const p=PRODUCTS[sku];
  return `<div class="cart-item"><img src="${p.image}" alt="Productos de la línea ${p.line}" loading="lazy"><div class="cart-item-main"><strong>${p.name}</strong><small>${p.sizeLabel||'1 litro'} por unidad · ${money(p.unit)} c/u</small><div class="qty"><button type="button" data-change="${sku}" data-delta="-1" aria-label="Restar una unidad de ${p.name}">−</button><span aria-label="${qty} unidades">${qty}</span><button type="button" data-change="${sku}" data-delta="1" aria-label="Añadir una unidad de ${p.name}">+</button></div><div class="cart-item-price">${money(p.unit*qty)}</div></div></div>`;
 }).join('');
 $('cart-total').textContent=money(total());
 const deal=$('deal-status');
 if(deal) deal.textContent=shippingCategory()+(cart['promo-tricho-humicos']?' · '+cart['promo-tricho-humicos']+' kg de ácidos húmicos de regalo con tu promoción TRICHO.':'');
 const calc=$('cart-breakdown');
 if(calc) calc.innerHTML=`<span>Subtotal de productos</span><strong>${money(subtotal())}</strong><span>Envío</span><strong>${shippingShort()}</strong>`;
 const subEl=$('cart-subtotal'); if(subEl) subEl.textContent=money(subtotal());
 const shipEl=$('cart-shipping'); if(shipEl) shipEl.textContent=shippingShort();
 document.querySelectorAll('[data-change]').forEach(b=>b.addEventListener('click',()=>change(b.dataset.change,Number(b.dataset.delta))));
 updateCheckout();
}
function change(sku,delta){
 if(!PRODUCTS[sku])return;
 const next=Math.max(0,Math.min(50,(cart[sku]||0)+delta));
 if(next)cart[sku]=next;else delete cart[sku];
 save();renderCart();
}
function openCart(){
 renderCart();
 // CSS :target line detail cards close cleanly when the user switches to the cart.
 if(location.hash.startsWith('#detalle-')) dismissGalyonModal();
 $('drawer-backdrop').hidden=false;
 $('cart-drawer').classList.add('is-open');
 $('cart-drawer').setAttribute('aria-hidden','false');
 document.body.classList.add('cart-open');
 $('close-cart').focus();
}
function closeCart(){
 $('drawer-backdrop').hidden=true;
 $('cart-drawer').classList.remove('is-open');
 $('cart-drawer').setAttribute('aria-hidden','true');
 document.body.classList.remove('cart-open');
}
function whatsapp(text){location.href=`https://wa.me/${NUMBER}?text=${encodeURIComponent(text)}`}
// Add buttons never redirect to WhatsApp.
document.querySelectorAll('[data-add-sku]').forEach(a=>a.addEventListener('click',e=>{
 const sku=a.dataset.addSku;
 if(!PRODUCTS[sku]) return;
 e.preventDefault(); change(sku,1);
 if(!a.dataset.originalLabel) a.dataset.originalLabel = a.textContent.trim();
 a.classList.add('was-added');
 a.textContent='Añadido';
 setTimeout(()=>{
   a.classList.remove('was-added');
   a.textContent=a.dataset.originalLabel || '+ Añadir';
 },1100);
 toast(`${PRODUCTS[sku].name} añadido · ${count()} ${count()===1?'producto':'productos'} en tu pedido`);
}));
// Combos por cultivo: productos de 4 L con precio propio; sin promoción general de 2 x $30.
document.querySelectorAll('[data-combo]').forEach(button=>button.addEventListener('click',()=>{
 const sku='combo-'+button.dataset.combo;
 if(!PRODUCTS[sku])return;
 cart[sku]=Math.min(50,(cart[sku]||0)+1);
 save();renderCart();toast('Combo GALYON añadido a tu pedido');openCart();
}));
document.querySelectorAll('[data-view-cart]').forEach(b=>b.addEventListener('click',openCart));
$('open-cart').addEventListener('click',openCart);
$('close-cart').addEventListener('click',closeCart);
$('drawer-backdrop').addEventListener('click',closeCart);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart()});
$('explore-products').addEventListener('click',()=>{closeCart();location.href='bioinsumos.html#lineas'});
$('ship-city').addEventListener('input',updateCheckout);
// Checkout is a native WhatsApp link. User must press Send to transmit the message.
$('float-wa').addEventListener('click',()=>whatsapp('Hola GALYON, quisiera conocer más sobre sus bioinsumos y servicios.'));
const menu=$('menu-toggle'), nav=$('navlinks');
if (menu && nav) {
  menu.addEventListener('click',e=>{
    e.stopPropagation();
    const open=nav.classList.toggle('is-open');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded',String(open));
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    nav.classList.remove('is-open');
    menu.classList.remove('is-open');
    menu.setAttribute('aria-expanded','false');
  }));
  document.addEventListener('click',e=>{
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !menu.contains(e.target)) {
      nav.classList.remove('is-open');
      menu.classList.remove('is-open');
      menu.setAttribute('aria-expanded','false');
    }
  });
}
if ($('year')) $('year').textContent=new Date().getFullYear();
renderCart();

// ponytail: cierre unificado de modales/drawers y retorno limpio al inicio
function resetToHome(e) {
 const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname === '';
 if (isHome) {
  if (e) {
   if (e.preventDefault) e.preventDefault();
   if (e.stopPropagation) e.stopPropagation();
  }
  closeCart();
  const nav = $('navlinks'), menu = $('menu-toggle');
  if (nav) nav.classList.remove('is-open');
  if (menu) menu.setAttribute('aria-expanded', 'false');
  document.querySelectorAll('.galyon-modal').forEach(m => m.classList.add('is-dismissed'));
  const dlg = $('combo-lightbox'); if (dlg?.open) dlg.close();
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  if (window.location.hash) {
   try {
    history.replaceState(null, '', window.location.pathname + window.location.search);
   } catch(err) {}
  }
  return false;
 }
 return true;
}
window.resetToHome = resetToHome;
document.querySelectorAll('.brand').forEach(b => b.addEventListener('click', resetToHome));


// Mantener la posición del cliente al abrir o cerrar las fichas.
let lineReturnScrollY = null;
const lineModalIds = new Set(['#detalle-tricho','#detalle-bact','#detalle-insecta']);

// Guardamos la posición exacta antes de que el navegador navegue al ancla.
document.querySelectorAll('.view-line[href^="#detalle-"]').forEach(link => {
 link.addEventListener('click', () => {
  lineReturnScrollY = window.scrollY;
  document.querySelectorAll('.galyon-modal').forEach(m => m.classList.remove('is-dismissed'));
  // El :target usa un elemento fixed; Safari puede desplazar el documento al navegar.
  requestAnimationFrame(() => window.scrollTo({top:lineReturnScrollY,behavior:'instant'}));
 });
});
function dismissGalyonModal(event){
 if(event)event.preventDefault();
 const keepY = lineReturnScrollY ?? window.scrollY;
 document.querySelectorAll('.galyon-modal').forEach(m => m.classList.add('is-dismissed'));
 // Sustituimos el hash en vez de enlazar a #lineas, evitando el salto.
 history.replaceState(history.state,'',window.location.pathname+window.location.search);
 window.scrollTo({top:keepY,left:0,behavior:'instant'});
 requestAnimationFrame(() => window.scrollTo({top:keepY,left:0,behavior:'instant'}));
 lineReturnScrollY = null;
}
document.querySelectorAll('.galyon-modal-close,.galyon-modal-backdrop').forEach(el => {
 el.addEventListener('click',dismissGalyonModal);
});
document.addEventListener('keydown', e => {
 if(e.key === 'Escape' && lineModalIds.has(window.location.hash)) dismissGalyonModal(e);
});



// GALYON galleries: shared 2.5 s autoplay, only inside the visible detail modal, without pause on hover.
(()=>{
 const INTERVAL = 2500;
 const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.galyon-modal .tricho-gallery').forEach(gallery=>{
  const modal=gallery.closest('.galyon-modal');
  const surface=gallery.querySelector('.tricho-gallery-slides');
  const slides=[...gallery.querySelectorAll('.tricho-gallery-slide')];
  const dots=[...gallery.querySelectorAll('.tricho-gallery-dots button, [data-slide]')];
  if(!modal || !surface || slides.length<2) return;
  let current=0, timer=null, resumeTimer=null, focused=false, touchStart=null;
  const isOpen=()=>location.hash==='#'+modal.id && !modal.classList.contains('is-dismissed') && !document.hidden;
  function stop(){clearTimeout(timer);timer=null;clearTimeout(resumeTimer);resumeTimer=null;}
  function show(index){
   current=(index+slides.length)%slides.length;
   slides.forEach((slide,i)=>{
    slide.classList.toggle('is-current',i===current);
    slide.setAttribute('aria-hidden',String(i!==current));
   });
   dots.forEach((dot,i)=>{
    dot.classList.toggle('is-current',i===current);
    if(i===current) dot.setAttribute('aria-current','true');
    else dot.removeAttribute('aria-current');
   });
  }
  function schedule(){
   stop();
   if(isOpen() && !focused && !reduceMotion.matches){
    timer=setTimeout(()=>{show(current+1);schedule();},INTERVAL);
   }
  }
  function goTo(target){
   show(target);
   stop();
   // A manual action holds the slide for a full interval.
   if(isOpen()) resumeTimer=setTimeout(schedule,INTERVAL);
  }
  const manual=(step=1)=>goTo(current+step);
  surface.setAttribute('role','button');
  surface.setAttribute('tabindex','0');
  surface.setAttribute('aria-label','Mostrar la siguiente fotografía');
  surface.addEventListener('click',()=>{if(!surface.dataset.swiped) manual();delete surface.dataset.swiped;});
  surface.addEventListener('keydown',e=>{
   if(e.key==='Enter'||e.key===' '){e.preventDefault();manual();}
   else if(e.key==='ArrowRight'){e.preventDefault();manual(1);}
   else if(e.key==='ArrowLeft'){e.preventDefault();manual(-1);}
  });
  surface.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0]?.clientX??null;},{passive:true});
  surface.addEventListener('touchend',e=>{
   if(touchStart===null)return;
   const delta=(e.changedTouches[0]?.clientX??touchStart)-touchStart;
   touchStart=null;
   if(Math.abs(delta)>45){surface.dataset.swiped='1';manual(delta<0?1:-1);}
  },{passive:true});
  surface.addEventListener('focusin',()=>{focused=true;stop();});
  surface.addEventListener('focusout',()=>{focused=false;schedule();});
  gallery.querySelectorAll('.tricho-gallery-prev').forEach(btn=>btn.addEventListener('click',()=>manual(-1)));
  gallery.querySelectorAll('.tricho-gallery-next').forEach(btn=>btn.addEventListener('click',()=>manual(1)));
  dots.forEach(dot=>dot.addEventListener('click',()=>goTo(+dot.dataset.slide)));
  function update(){if(isOpen()){show(0);schedule();}else stop();}
  window.addEventListener('hashchange',update);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else schedule();});
  document.querySelectorAll('.galyon-modal-close,.galyon-modal-backdrop').forEach(btn=>btn.addEventListener('click',stop));
  document.querySelectorAll('a[href="#'+modal.id+'"]').forEach(link=>link.addEventListener('click',()=>setTimeout(update,120)));
  show(0);if(isOpen())schedule();
 });
})();


// GALYON Asesor de Cultivos v5.1. Orientación visual inicial, nunca diagnóstico confirmado.
(()=>{
 const root=document.getElementById('advisor-app');if(!root)return;
 const content=document.getElementById('advisor-content');
 const label=document.getElementById('advisor-step-label');
 const progress=document.getElementById('advisor-progress-bar');
 const back=document.getElementById('advisor-back');
 const restart=document.getElementById('advisor-restart');
 const fields=['area','crop','part','symptom'];
 const ENABLE_GARDEN_MODE=false; // Cambiar a true para reactivar finca/huerto y sus cuatro pasos.
 const firstStep=ENABLE_GARDEN_MODE?0:1;
 const data={area:ENABLE_GARDEN_MODE?'':'Finca o plantación',crop:'',part:'',symptom:''};
 let step=firstStep;
 const p=key=>'assets/asesor/'+key+'.webp';
 const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const a=(key,text,image='',sub='',possible='',guidance='',line='')=>({key,text,image,sub,possible,guidance,line});
 const toNavAnchor = h => { const p = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : ''; if (h.startsWith('#detalle-')) return (p.endsWith('bioinsumos.html') ? '' : 'bioinsumos.html') + h; if (h === '#analisis') return (p.endsWith('analisis-suelo.html') ? '' : 'analisis-suelo.html') + h; return h; };

 // BEGIN ADVISOR CARD IMAGES
 // Solo presentación: los datos de diagnóstico permanecen intactos.
 const advisorCardImages={
  "Maíz|Raíces o tallo|symptoms|maiz_base_pudricion": "ref-maiz-base-podrida",
  "Maíz|Raíces o tallo|symptoms|maiz_raices_deterioradas": "ref-maiz-raices-oscuras",
  "Maíz|Raíces o tallo|symptoms|maiz_galerias_tallo": "ref-maiz-galerias-tallo",
  "Maíz|Raíces o tallo|symptoms|maiz_tallo_quebradizo": "ref-maiz-tallo-quebradizo",
  "Mango|Toda la planta|symptoms|observacion_mango_amarillas": "ref-mango-arbol-amarillo",
  "Mango|Toda la planta|symptoms|observacion_mango_insectos": "ref-mango-arbol-insectos",
  "Mango|Toda la planta|symptoms|observacion_mango_crecimiento": "ref-mango-crecimiento-desigual",
  "Mango|Hojas|symptoms|observacion_mango_insectos": "ref-mango-hojas-comidas",
  "Mango|Hojas|symptoms|observacion_mango_polvo": "ref-mango-hojas-polvo",
  "Mango|Raíces o tallo|symptoms|observacion_mango_decaimiento": "ref-mango-base-decaimiento",
  "Mango|Raíces o tallo|symptoms|observacion_mango_insectos": "ref-mango-tallo-galerias",
  "Caña de azúcar||parts|Raíces o tallo": "ref-cana-raices-categoria",
  "Aguacate|Toda la planta|symptoms|observacion_aguacate_amarillas": "ref-aguacate-arbol-amarillo",
  "Aguacate|Toda la planta|symptoms|observacion_aguacate_insectos": "ref-aguacate-arbol-insectos",
  "Aguacate|Toda la planta|symptoms|observacion_aguacate_crecimiento": "ref-aguacate-crecimiento-desigual",
  "Aguacate|Hojas|symptoms|observacion_aguacate_insectos": "ref-aguacate-hojas-comidas",
  "Aguacate|Hojas|symptoms|observacion_aguacate_polvo": "ref-aguacate-hojas-polvo",
  "Aguacate|Raíces o tallo|symptoms|observacion_aguacate_decaimiento": "ref-aguacate-base-decaimiento",
  "Aguacate|Raíces o tallo|symptoms|observacion_aguacate_insectos": "ref-aguacate-tallo-galerias",
  "Aguacate|Frutos o mazorcas|symptoms|observacion_aguacate_insectos": "ref-aguacate-frutos-perforados",
  "Aguacate|Frutos o mazorcas|symptoms|observacion_aguacate_deformes": "ref-aguacate-frutos-deformes",
  "Hortalizas||parts|Raíces o tallo": "ref-hortalizas-raices-categoria",
  "Hortalizas||parts|Frutos o mazorcas": "ref-hortalizas-frutos-categoria",
  "Cacao|Toda la planta|symptoms|cacao_debil": "ref-cacao-arbol-amarillo",
  "Cacao|Toda la planta|symptoms|cacao_seco": "ref-cacao-ramas-secas",
  "Cacao|Raíces o tallo|symptoms|cacao_raices": "ref-cacao-raices-danadas",
  "Cacao|Frutos o mazorcas|symptoms|cacao_insecto": "ref-cacao-mazorca-insectos",
  "Banano|Toda la planta|symptoms|banano_marchitez": "ref-banano-arbol-decaido",
  "Banano|Raíces o tallo|symptoms|banano_picudo": "ref-banano-cormo-galerias",
  "Mango|Hojas|symptoms|observacion_mango_amarillas": "ref-mango-hojas-amarillas",
  "Aguacate|Hojas|symptoms|observacion_aguacate_amarillas": "ref-aguacate-hojas-amarillas",
  "Caña de azúcar|Toda la planta|symptoms|cana_roya": "ref-cana-hoja-roya",
  "Caña de azúcar|Hojas|symptoms|cana_roya": "ref-cana-hoja-roya",
  "Caña de azúcar|Toda la planta|symptoms|cana_carbon": "ref-cana-carbon-referencia",
  "Caña de azúcar|Raíces o tallo|symptoms|cana_carbon": "ref-cana-carbon-referencia",
  "Caña de azúcar|Frutos o mazorcas|symptoms|cana_carbon": "ref-cana-carbon-referencia",
  "Caña de azúcar|Toda la planta|symptoms|cana_cogollo": "ref-cana-cogollo-danado",
  "Caña de azúcar|Hojas|symptoms|cana_cogollo": "ref-cana-cogollo-danado",
  "Caña de azúcar|Frutos o mazorcas|symptoms|cana_cogollo": "ref-cana-cogollo-danado",
  "Caña de azúcar|Raíces o tallo|symptoms|cana_barrenador": "ref-cana-tallo-perforado",
  "Caña de azúcar|Frutos o mazorcas|symptoms|cana_barrenador": "ref-cana-tallo-perforado",
  "Café|Toda la planta|symptoms|cafe_roya": "ref-cafe-roya-referencia",
  "Café|Hojas|symptoms|cafe_roya": "ref-cafe-roya-referencia",
  "Café|Toda la planta|symptoms|cafe_ramas": "ref-cafe-rama-seca",
  "Café|Raíces o tallo|symptoms|cafe_ramas": "ref-cafe-rama-seca",
  "Café|Hojas|symptoms|cafe_hojas": "ref-cafe-hojas-manchas",
  "Café|Frutos o mazorcas|symptoms|cafe_broca": "ref-cafe-cerezas-perforadas",
  "Hortalizas|Toda la planta|symptoms|hort_manchas": "ref-hortalizas-manchas-hojas",
  "Hortalizas|Hojas|symptoms|hort_manchas": "ref-hortalizas-manchas-hojas",
  "Hortalizas|Toda la planta|symptoms|hort_blanco": "ref-hortalizas-polvo-blanco",
  "Hortalizas|Hojas|symptoms|hort_blanco": "ref-hortalizas-polvo-blanco",
  "Hortalizas|Toda la planta|symptoms|hort_insectos": "ref-hortalizas-hojas-comidas",
  "Hortalizas|Hojas|symptoms|hort_insectos": "ref-hortalizas-hojas-comidas",
  "Hortalizas|Frutos o mazorcas|symptoms|hort_frutos": "ref-hortalizas-frutos-manchas",
  "Cacao||parts|Hojas": "rev2-cacao-hojas-categoria",
  "Cacao|Raíces o tallo|symptoms|cacao_cancro": "rev2-cacao-cancro",
  "Cacao|Raíces o tallo|symptoms|cacao_marchito": "rev2-cacao-rama-marchita",
  "Cacao|Frutos o mazorcas|symptoms|cacao_negro": "rev2-cacao-mazorca-negra",
  "Banano|Raíces o tallo|symptoms|banano_tallo": "rev2-banano-base-danada",
  "Banano|Raíces o tallo|symptoms|banano_raices": "rev2-banano-raices-danadas",
  "Mango|Toda la planta|symptoms|observacion_mango_flor": "rev2-mango-floracion-seca",
  "Mango||parts|Hojas": "rev2-mango-hojas-categoria",
  "Mango||parts|Raíces o tallo": "rev2-mango-base-categoria",
  "Mango|Frutos o mazorcas|symptoms|observacion_mango_pudricion": "rev2-mango-fruto-podrido",
  "Aguacate|Toda la planta|symptoms|observacion_aguacate_flor": "rev2-aguacate-floracion-seca",
  "Aguacate||parts|Hojas": "rev2-aguacate-hojas-categoria",
  "Aguacate||parts|Raíces o tallo": "rev2-aguacate-base-categoria",
  "Aguacate|Frutos o mazorcas|symptoms|observacion_aguacate_fruto_manchas": "rev2-aguacate-fruto-manchas",
  "Caña de azúcar||parts|Hojas": "rev2-cana-hojas-categoria",
  "Caña de azúcar||parts|Frutos o mazorcas": "rev2-cana-tallos-categoria",
  "Hortalizas||parts|Toda la planta": "rev2-hortalizas-planta-categoria",
  "Hortalizas||parts|Hojas": "rev2-hortalizas-hojas-categoria",
  "Banano|Frutos o mazorcas|symptoms|observacion_banano_manchas": "rev2-banano-dedos-manchas",
  "Cacao||parts|Toda la planta": "rev2-cacao-planta-categoria",
  "Cacao||parts|Raíces o tallo": "rev2-cacao-raices-categoria",
  "Cacao||parts|Frutos o mazorcas": "rev2-cacao-fruto-categoria",
  "Banano||parts|Hojas": "rev2-banano-hojas-categoria",
  "Cacao|Hojas|symptoms|cacao_amarillo": "rev2-cacao-hoja-amarilla"
};
 // END ADVISOR CARD IMAGES
 const farmCrops=[
  a('Cacao','Cacao','cacao'),a('Banano','Banano','banano'),a('Maíz','Maíz','maiz'),
  a('Mango','Mango','v537_mango_arbol'),a('Caña de azúcar','Caña de azúcar','cana'),a('Café','Café','cafe'),
  a('Aguacate','Aguacate','v537_aguacate_arbol'),a('Hortalizas','Hortalizas','v522_jardin_hortalizas'),
  a('Otro cultivo','Otro cultivo','','Descríbenos tu cultivo')
 ];
 // Portadas exclusivas del selector; conservar imágenes de referencia de los resultados.
 const farmCropCovers={
  'Cacao':'catalogo-cacao','Banano':'catalogo-banano','Maíz':'catalogo-maiz',
  'Mango':'catalogo-mango','Caña de azúcar':'catalogo-cana','Café':'catalogo-cafe',
  'Aguacate':'catalogo-aguacate','Hortalizas':'catalogo-hortalizas'
 };
 const gardenCrops=[
  a('Hortalizas','Hortalizas','v522_jardin_hortalizas'), a('Tomate','Tomate','v532_tomate_planta','Cultivo de patio o maceta'),
  a('Ají o pimiento','Ají o pimiento','v532_aji_planta','Frutos y hojas'),a('Cítricos','Cítricos','v532_citricos_arbol','Limón, naranja, mandarina'),
  a('Mango','Mango','v537_mango_arbol','Árbol frutal'),a('Chirimoya','Chirimoya','v525_chirimoya_frutos','Árbol frutal'),
  a('Papaya','Papaya','v525_papaya_planta','Frutal de patio'),a('Flores y ornamentales','Flores y ornamentales','v532_flores_jardin','Plantas decorativas'),
  a('Hierbas aromáticas','Hierbas aromáticas','v524_jardin_aromaticas','Albahaca, menta, romero'),a('Otro cultivo','Otro cultivo','','Cuéntanos qué tienes')
 ];
 const partOptions=[a('Frutos o mazorcas','Frutos o mazorcas','mazorcas'),a('Hojas','Hojas','hojas'),a('Raíces o tallo','Raíces o tallo','raices'),a('Toda la planta','Toda la planta','planta')];
 const specificParts={
  'Cacao':[['Toda la planta','v52_cacao_planta_completa'],['Hojas','v52_cacao_hojas'],['Raíces o tallo','v52_cacao_raices'],['Frutos o mazorcas','v52_cacao_mazorcas']],
  'Café':[['Toda la planta','v52_cafe_planta_completa'],['Hojas','v52_cafe_hojas'],['Raíces o tallo','v52_cafe_raices'],['Frutos o mazorcas','v52_cafe_cerezas']],
  'Banano':[['Toda la planta','v535_banano_planta'],['Hojas','v526_banano_hojas'],['Raíces o tallo','v535_banano_pseudotallo'],['Frutos o mazorcas','v52_banano_racimo']],
  'Maíz':[['Toda la planta','maiz_toda_planta'],['Hojas','maiz_hojas'],['Raíces o tallo','maiz_raices_tallo'],['Frutos o mazorcas','maiz_mazorcas']],
  'Caña de azúcar':[['Toda la planta','v52_cana_plantacion'],['Hojas','v522_cana_hojas'],['Raíces o tallo',''],['Frutos o mazorcas','v522_cana_tallos']],
  'Arroz':[['Toda la planta','v525_arroz_planta'],['Hojas','v525_arroz_hojas'],['Raíces o tallo','v525_arroz_tallos'],['Frutos o mazorcas','v525_arroz_espigas']],
  'Maracuyá':[['Toda la planta','maracuya'],['Hojas',''],['Raíces o tallo',''],['Frutos o mazorcas','maracuya']],
  'Chirimoya':[['Toda la planta','v525_chirimoya_arbol'],['Hojas','v525_chirimoya_hojas'],['Raíces o tallo',''],['Frutos o mazorcas','v525_chirimoya_frutos']],
  'Papaya':[['Toda la planta','v525_papaya_planta'],['Hojas','v525_papaya_hojas'],['Raíces o tallo','v525_papaya_tallo'],['Frutos o mazorcas','v525_papaya_frutos']],
  'Tomate':[['Toda la planta','v532_tomate_planta'],['Hojas','v526_tomate_hojas'],['Raíces o tallo',''],['Frutos o mazorcas','v526_tomate_frutos']],
  'Ají o pimiento':[['Toda la planta','v532_aji_planta'],['Hojas','v526_aji_hojas'],['Raíces o tallo',''],['Frutos o mazorcas','v526_aji_frutos']],
  'Cítricos':[['Toda la planta','v532_citricos_arbol'],['Hojas','v526_citricos_hojas'],['Raíces o tallo',''],['Frutos o mazorcas','v526_citricos_frutos']],
  'Mango':[['Toda la planta','v537_mango_arbol'],['Hojas','v537_mango_hojas'],['Raíces o tallo','v537_mango_base'],['Frutos o mazorcas','v537_mango_frutos_sanos']],
  'Aguacate':[['Toda la planta','v537_aguacate_arbol'],['Hojas','v537_aguacate_hojas'],['Raíces o tallo','v537_aguacate_base'],['Frutos o mazorcas','v537_aguacate_frutos_sanos']],
  'Flores y ornamentales':[['Toda la planta','v532_flores_jardin'],['Hojas','v526_flores_hojas'],['Raíces o tallo',''],['Frutos o mazorcas','v526_flores_flores']],
  'Hierbas aromáticas':[['Toda la planta','v524_jardin_aromaticas'],['Hojas','v526_aromaticas_hojas'],['Raíces o tallo','']],
  'Hortalizas':[['Toda la planta','v522_jardin_hortalizas'],['Hojas','v526_hortalizas_hojas'],['Raíces o tallo',''],['Frutos o mazorcas','']]
 };
 const partsForCrop=()=> (specificParts[data.crop]||[
   ['Toda la planta',''],['Hojas',''],['Raíces o tallo',''],['Frutos o mazorcas','']
 ]).map(([key,image])=>a(key,key==='Frutos o mazorcas' ? ({'Café':'Cerezas de café','Banano':'Racimos de banano','Maíz':'Mazorcas de maíz','Arroz':'Espigas y granos','Caña de azúcar':'Tallos o cogollos','Cacao':'Mazorcas de cacao','Maracuyá':'Frutos de maracuyá','Flores y ornamentales':'Flores y botones','Tomate':'Tomates','Ají o pimiento':'Ajíes o pimientos','Cítricos':'Frutos cítricos','Mango':'Mangos','Aguacate':'Aguacates','Chirimoya':'Chirimoyas','Papaya':'Papayas'}[data.crop]||'Frutos o flores'):(key==='Raíces o tallo' ? ({'Banano':'Raíces o pseudotallo','Caña de azúcar':'Raíces o tallos','Café':'Raíces o ramas','Arroz':'Raíces o vainas','Flores y ornamentales':'Raíces o tallos'}[data.crop]||key):key),image));
 const general=[
  a('manchas','Manchas en hojas','','Manchas, puntos o áreas secas', '', 'Compara hojas jóvenes y maduras, e indica si las manchas aparecen en nuevas zonas.'),
  a('pudricion','Frutos, raíces o tallos deteriorados','','Zonas blandas, oscuras o con pudrición','','Indica qué parte empezó a dañarse y si las lesiones están creciendo.'),
  a('plagas','Perforaciones o insectos','','Agujeros, larvas o insectos visibles','Posible daño por insectos.','Identifica el insecto o envía una foto para evaluar qué manejo corresponde.','INSECTA'),
  a('marchitez','Amarillamiento o marchitez','','Hojas amarillas, secas o caídas','','También pueden intervenir raíces, agua y nutrición; una foto de la planta completa ayudará a diferenciarlas.'),
  a('otro','No reconozco mi problema','v534_asesoria_personalizada','Quiero explicar mi caso al asesor','','Envía fotografías de las partes afectadas para una evaluación personalizada.')
 ];
 const unknown=a('otro','No reconozco mi problema','v534_asesoria_personalizada','El problema se ve distinto','','Compártenos dos fotografías: una de cerca y otra de toda la planta.');
 // Diagnósticos ORIENTATIVOS, no confirmaciones. Se nombran agentes solo donde el síntoma
 // seleccionado incluye una señal visual suficientemente distintiva; cambios inespecíficos
 // (amarillamiento, marchitez, manchas genéricas) NO se asignan a una enfermedad única.
 const probableCauses={
  cacao_blanco:{name:'Moniliasis del cacao (Moniliophthora roreri)',level:'alto'},
  cacao_negro:{name:'Mazorca negra, frecuentemente asociada a Phytophthora spp.',level:'medio'},
  cacao_escoba:{name:'Escoba de bruja del cacao (Moniliophthora perniciosa)',level:'alto'},
  cafe_roya:{name:'Roya del café (Hemileia vastatrix)',level:'alto'},
  cafe_broca:{name:'Broca del café (Hypothenemus hampei)',level:'medio'},
  maiz_oruga:{name:'Gusano cogollero del maíz (Spodoptera frugiperda)',level:'medio'},
  maiz_roya:{name:'Roya del maíz (Puccinia spp.)',level:'medio'},
  cana_carbon:{name:'Carbón de la caña de azúcar (Sporisorium scitamineum)',level:'alto'},
  cana_roya:{name:'Roya de la caña de azúcar',level:'medio'},
  banano_sigatoka:{name:'Es muy probable que se trate de Sigatoka del banano',level:'medio'},
  arroz_espiga:{name:'Falso carbón del arroz (Ustilaginoidea virens)',level:'medio'},
  hort_blanco:{name:'Oídio o cenicilla en hortalizas',level:'medio'},
  tomate_mosca_blanca:{name:'Mosca blanca del tomate (Bemisia o Trialeurodes)',level:'alto'},
  aji_pulgones:{name:'Pulgones o áfidos en ají (Aphididae)',level:'alto'},
  citricos_minador:{name:'Minador de la hoja de los cítricos (Phyllocnistis citrella)',level:'alto'},
  flores_oidio:{name:'Oídio o cenicilla de los rosales',level:'alto'},
  mango_lesiones_fruto:{name:'Antracnosis del mango, entre otras posibles causas',level:'medio'},
  papaya_anillos:{name:'Mancha anular de la papaya (virus PRSV)',level:'alto'},
  papaya_mosaico:{name:'Posible mancha anular de la papaya (virus PRSV)',level:'medio'},
  papaya_antracnosis:{name:'Antracnosis de papaya (Colletotrichum spp.), entre otras causas',level:'medio'},
  chirimoya_antracnosis:{name:'Antracnosis de chirimoya (Colletotrichum spp.), entre otras causas',level:'medio'},
  maracuya_roña:{name:'Roña o sarna del maracuyá, entre otras causas',level:'medio'},
  maracuya_mancha_bacteriana:{name:'Posible mancha bacteriana del maracuyá (Xanthomonas spp.)',level:'medio'}
 };

 // Maíz: una ficha por síntoma y categoría; ver docs/asesor-maiz.md.
 const maizeCases={
  "maiz_amarillamiento_general": {
    "part": "Toda la planta",
    "title": "Amarillamiento generalizado",
    "sub": "La planta pierde su color verde en varias hojas.",
    "cause": "Disponibilidad insuficiente de nitrógeno o azufre; raíces afectadas por exceso de agua.",
    "explanation": "La falta de nutrientes disponibles reduce la formación de clorofila. Una V amarilla desde la punta de hojas viejas orienta a nitrógeno; hojas jóvenes pálidas requieren revisar azufre y raíces.",
    "management": "Prioriza análisis de suelo y, según la etapa, análisis foliar. Ajusta fertilización y drenaje a los resultados; un microorganismo no sustituye el nutriente faltante.",
    "goals": [
      "Recuperar el color y actividad de las hojas nuevas.",
      "Ajustar la nutrición sin aplicaciones a ciegas.",
      "Mejorar el aprovechamiento del agua y fertilizantes."
    ],
    "actions": [
      "Compara hojas jóvenes y viejas y registra dónde inicia el amarillo.",
      "Revisa humedad, raíces y antecedentes de fertilización.",
      "Muestrea zonas sanas y afectadas por separado antes de corregir la nutrición."
    ],
    "product": null,
    "condition": "",
    "image": "",
    "cardImage": "maiz_amarillamiento_generalizado"
  },
  "maiz_crecimiento_desigual": {
    "part": "Toda la planta",
    "title": "Plantas pequeñas o crecimiento desigual",
    "sub": "Hay plantas de distinta altura o sectores que no avanzan.",
    "cause": "Emergencia irregular, compactación o nutrición limitada; descartar achaparramiento si hay entrenudos cortos y enrojecimiento.",
    "explanation": "El establecimiento desigual limita la exploración de raíces. Si aparecen entrenudos cortos, hojas rojizas y chicharritas Dalbulus maidis, investiga el complejo de achaparramiento, incluido Spiroplasma kunkelii.",
    "management": "Revisa siembra, suelo y nutrición. Ante signos de achaparramiento, solicita evaluación fitosanitaria y manejo del vector; los bioinsumos disponibles no curan una infección sistémica.",
    "goals": [
      "Identificar por qué unas plantas quedan rezagadas.",
      "Mejorar la uniformidad del próximo establecimiento.",
      "Detectar a tiempo un problema de vector o de suelo."
    ],
    "actions": [
      "Compara profundidad de siembra, emergencia y raíces entre plantas.",
      "Revisa compactación y antecedentes de herbicidas.",
      "Fotografía entrenudos, coloración y cualquier chicharrita; lleva muestras si el técnico lo indica."
    ],
    "product": null,
    "condition": "",
    "image": "",
    "cardImage": "maiz_crecimiento_desigual"
  },
  "maiz_marchitez_general": {
    "part": "Toda la planta",
    "title": "Marchitez y decaimiento",
    "sub": "Las hojas pierden turgencia o se enrollan.",
    "cause": "Déficit de agua o raíces sin oxígeno; diferenciar daño radicular y vascular.",
    "explanation": "La planta pierde agua más rápido de lo que puede absorberla. Suelo seco apunta a déficit hídrico; suelo saturado con marchitez indica raíces que no respiran o no funcionan bien.",
    "management": "Corrige el balance de agua antes de elegir un producto. Si hay raíces blandas o lesiones internas, continúa por la categoría Raíces o tallo para orientar la evaluación.",
    "goals": [
      "Restablecer el suministro de agua a la planta.",
      "Evitar riego excesivo cuando el problema es drenaje.",
      "Separar estrés ambiental de enfermedad radicular."
    ],
    "actions": [
      "Comprueba humedad a profundidad de raíces, no solo en la superficie.",
      "Observa si las plantas recuperan turgencia al amanecer.",
      "Compara raíces de plantas sanas y marchitas y registra distribución del daño."
    ],
    "product": null,
    "condition": "",
    "image": "",
    "cardImage": "maiz_marchitez_decaimiento"
  },
  "maiz_caidas_secamiento": {
    "part": "Toda la planta",
    "title": "Plantas caídas o secamiento progresivo",
    "sub": "Se tumban plantas o aparecen focos de secamiento.",
    "cause": "Acame por pérdida de anclaje o resistencia del tallo; estrés, viento o pudriciones del complejo Fusarium spp.",
    "explanation": "La raíz o el tallo dejan de sostener la planta. El secamiento prematuro también acompaña pudriciones; una planta caída por viento no demuestra una infección.",
    "management": "Revisa el punto de falla antes de tratar. Prioriza el manejo de agua, densidad y nutrición, y la evaluación de tallos dañados en lotes próximos a cosecha.",
    "goals": [
      "Reducir pérdidas por plantas caídas.",
      "Distinguir daño mecánico de deterioro de tejidos.",
      "Priorizar el manejo y cosecha de sectores afectados."
    ],
    "actions": [
      "Distingue raíz arrancada, base blanda y quiebre de entrenudos.",
      "Aprieta y abre longitudinalmente tallos de una muestra representativa.",
      "Registra viento, sequía, densidad y ubicación de los focos."
    ],
    "product": null,
    "condition": "",
    "image": "",
    "cardImage": "maiz_plantas_caidas_secamiento"
  },
  "maiz_manchas": {
    "part": "Hojas",
    "title": "Manchas cafés o lesiones alargadas",
    "sub": "Áreas necróticas que crecen sobre las hojas.",
    "cause": "Tizón foliar compatible con Exserohilum turcicum; diferenciar Cercospora zeae-maydis, otras manchas y daño químico.",
    "explanation": "Las lesiones reducen el área verde que sostiene el llenado. Su forma, límites entre nervaduras y avance en hojas nuevas ayudan a distinguir enfermedad de quemadura.",
    "management": "Bacillus subtilis se considera por su actividad preventiva frente a ciertos hongos foliares. Integra protección del follaje sano, monitoreo e híbridos resistentes.",
    "goals": [
      "Conservar área foliar funcional.",
      "Reducir nuevas lesiones cuando el agente sea susceptible.",
      "Sostener el potencial de llenado mediante manejo oportuno."
    ],
    "actions": [
      "Fotografía la hoja completa y una lesión de cerca en ambas caras.",
      "Revisa la hoja de la mazorca y registra la evolución del daño.",
      "Compara antecedentes de aspersión, híbrido y humedad antes de definir el programa."
    ],
    "product": "subtilis",
    "condition": "Evaluar solo tras identificar un hongo susceptible y verificar cepa, etiqueta y uso foliar de la formulación GALYON.",
    "image": "",
    "cardImage": "maiz_hojas_lesiones_referencia"
  },
  "maiz_roya": {
    "part": "Hojas",
    "title": "Pústulas anaranjadas (roya)",
    "sub": "Puntos elevados que liberan polvo color óxido.",
    "cause": "Roya del maíz: Puccinia sorghi o Puccinia polysora.",
    "explanation": "Las pústulas producen esporas y disminuyen el tejido fotosintético. Examinar ambas caras permite orientar el tipo de roya; distinguir las especies requiere revisión técnica.",
    "management": "Prioriza identificación, seguimiento de hojas nuevas e híbridos resistentes. No se asigna una formulación GALYON por el color de la pústula: el programa debe tener respaldo específico frente a la roya identificada.",
    "goals": [
      "Frenar el avance mediante un programa fitosanitario oportuno.",
      "Conservar follaje funcional cerca del llenado.",
      "Elegir materiales y manejo adecuados para el siguiente ciclo."
    ],
    "actions": [
      "Comprueba si el polvo se desprende y fotografía ambas caras.",
      "Registra altura de las hojas afectadas, etapa e intensidad del avance.",
      "Si progresa en hojas superiores, solicita evaluación pronta para definir manejo autorizado."
    ],
    "product": null,
    "condition": "",
    "image": "maiz_roya",
    "cardImage": "maiz_hojas_roya_referencia"
  },
  "maiz_oruga": {
    "part": "Hojas",
    "title": "Hojas comidas o perforadas por insectos",
    "sub": "Mordeduras, agujeros o excrementos recientes.",
    "cause": "Daño de larvas masticadoras, especialmente Spodoptera frugiperda; diferenciar otros insectos y daño físico.",
    "explanation": "Las larvas consumen follaje y pueden concentrarse en el cogollo. El insecto presente y su tamaño determinan la opción de manejo, no el orificio por sí solo.",
    "management": "Bacillus thuringiensis actúa por ingestión en larvas susceptibles. El momento de intervención y alcanzar larvas pequeñas son claves para proteger hojas nuevas.",
    "goals": [
      "Reducir alimentación de larvas susceptibles.",
      "Proteger el cogollo y el follaje que se está formando.",
      "Orientar el control al insecto realmente presente."
    ],
    "actions": [
      "Abre con cuidado el cogollo y fotografía larvas y excrementos.",
      "Distingue daños antiguos de mordeduras frescas y registra plantas afectadas.",
      "Conserva enemigos naturales y verifica susceptibilidad y cobertura antes de aplicar."
    ],
    "product": "bt",
    "condition": "Evaluar para larvas pequeñas, activas y susceptibles; confirmar la plaga y el uso indicado de la cepa GALYON.",
    "image": "maiz_cogollero",
    "cardImage": "maiz_hojas_insectos_referencia"
  },
  "maiz_clorosis_intervenal": {
    "part": "Hojas",
    "title": "Amarillamiento entre nervaduras",
    "sub": "Franjas claras mientras las nervaduras conservan verde.",
    "cause": "Desequilibrio de magnesio, zinc o hierro; también raíces restringidas o lesión por herbicidas.",
    "explanation": "El patrón y la edad de la hoja ayudan a separar causas: magnesio suele afectar primero hojas viejas; zinc o hierro pueden manifestarse en hojas jóvenes. El color no determina por sí solo qué nutriente aplicar.",
    "management": "Orienta la corrección con análisis de suelo y tejido. Revisa pH, drenaje y aplicaciones recientes antes de indicar fertilizantes; no corresponde vender un bioinsumo por este síntoma aislado.",
    "goals": [
      "Identificar el nutriente o factor limitante.",
      "Corregir la causa del amarillamiento en el crecimiento nuevo.",
      "Evitar aplicaciones innecesarias o desequilibrios adicionales."
    ],
    "actions": [
      "Fotografía hojas jóvenes y viejas y compara las franjas.",
      "Revisa pH, fertilización y herbicidas utilizados.",
      "Toma muestras de suelo y tejido de áreas afectadas y sanas por separado."
    ],
    "product": null,
    "condition": "",
    "image": "",
    "cardImage": "maiz_hojas_clorosis_referencia"
  },
  "maiz_base_pudricion": {
    "part": "Raíces o tallo",
    "title": "Pudrición en la base del tallo",
    "sub": "La base se oscurece, se ablanda o pierde consistencia.",
    "cause": "Pudrición basal: Fusarium spp.; diferenciar Pythium spp. y pudrición bacteriana.",
    "explanation": "La destrucción de tejidos en la base reduce la conducción y el sostén. Tejido acuoso y colapso cerca del suelo orientan a Pythium; olor fuerte y descomposición blanda requieren descartar bacterias.",
    "management": "Trichoderma spp. se valora como apoyo preventivo del entorno radicular frente a hongos compatibles, junto con drenaje y manejo de residuos. No reconstruye la base dañada.",
    "goals": [
      "Proteger raíces y bases aún funcionales.",
      "Reducir condiciones que favorecen nuevas pudriciones.",
      "Diferenciar hongo, oomiceto y bacteria antes del manejo."
    ],
    "actions": [
      "Abre la base longitudinalmente y fotografía la lesión interna.",
      "Revisa saturación del suelo, olor y avance del foco.",
      "Solicita identificación del agente antes de definir un programa biológico."
    ],
    "product": "tricho",
    "condition": "Considerar si se confirma un hongo radicular susceptible y el uso de la cepa GALYON; no extrapolar a bacterias o Pythium sin validación.",
    "image": ""
  },
  "maiz_raices_deterioradas": {
    "part": "Raíces o tallo",
    "title": "Raíces oscuras o deterioradas",
    "sub": "Raíces con lesiones, pérdida de firmeza o menor desarrollo.",
    "cause": "Daño radicular por anegamiento o compactación; con lesiones activas, investigar Fusarium spp. y otros patógenos.",
    "explanation": "La raíz lesionada absorbe menos agua y nutrientes. La falta de oxígeno puede producir un aspecto similar al de una infección; busca tejido blando o necrosado y compara plantas sanas.",
    "management": "Trichoderma spp. se considera por su acción antagonista en la zona radicular cuando hay un hongo susceptible. Recuperar aireación y manejo hídrico es parte del mismo plan.",
    "goals": [
      "Favorecer raíces nuevas funcionales.",
      "Mejorar exploración del suelo y absorción de agua.",
      "Disminuir el riesgo de nuevas lesiones fúngicas compatibles."
    ],
    "actions": [
      "Excava plantas completas con suelo para conservar las raíces.",
      "Compara drenaje, compactación y firmeza del tejido.",
      "Si hay raíces comidas, busca larvas; si hay lesiones, solicita diagnóstico del agente."
    ],
    "product": "tricho",
    "condition": "Evaluar únicamente si las lesiones corresponden a un hongo susceptible y la formulación GALYON tiene el uso apropiado.",
    "image": ""
  },
  "maiz_galerias_tallo": {
    "part": "Raíces o tallo",
    "title": "Perforaciones o galerías en el tallo",
    "sub": "Orificios con aserrín, excrementos o túneles internos.",
    "cause": "Barrenador del tallo compatible con Diatraea saccharalis; diferenciar otras larvas perforadoras.",
    "explanation": "Las galerías interrumpen tejidos y debilitan el tallo. Las larvas ya encerradas son difíciles de alcanzar; identificar la plaga y buscar estadios expuestos define el manejo.",
    "management": "Bacillus thuringiensis se valora para larvas susceptibles antes de entrar al tallo. Con galerías establecidas, prioriza monitoreo del ciclo y manejo integrado del barrenador.",
    "goals": [
      "Prevenir nuevas entradas de larvas susceptibles.",
      "Conservar resistencia de los tallos nuevos.",
      "Intervenir en el momento en que la larva está accesible."
    ],
    "actions": [
      "Abre algunos tallos afectados y fotografía larvas y galerías.",
      "Busca huevos y larvas pequeñas fuera del tallo en plantas vecinas.",
      "Registra incidencia y coordina manejo de residuos y enemigos naturales con el técnico."
    ],
    "product": "bt",
    "condition": "Evaluar solo si se identifican larvas susceptibles y expuestas y la etiqueta lo permite; no indicar una aspersión para eliminar larvas encerradas.",
    "image": ""
  },
  "maiz_tallo_quebradizo": {
    "part": "Raíces o tallo",
    "title": "Tallo debilitado o quebradizo",
    "sub": "El tallo pierde resistencia o se quiebra al presionarlo.",
    "cause": "Pérdida de resistencia por estrés y desequilibrio de potasio; descartar Fusarium spp., Colletotrichum graminicola y galerías.",
    "explanation": "El daño interno y la movilización de reservas hacia la mazorca reducen el sostén. Quiebre y médula deteriorada requieren distinguir nutrición, pudrición e insectos antes de elegir un control.",
    "management": "Prioriza nutrición equilibrada y evaluación del riesgo de acame. No se prescribe automáticamente un microorganismo para un tallo quebradizo sin conocer la causa.",
    "goals": [
      "Reducir pérdidas por quiebre y acame.",
      "Identificar deterioro interno antes de que avance.",
      "Mejorar resistencia del cultivo en el siguiente ciclo."
    ],
    "actions": [
      "Aprieta entrenudos inferiores y abre tallos representativos.",
      "Revisa potasio, densidad, sequía y presencia de galerías.",
      "En lotes cercanos a madurez, acuerda prioridad de cosecha de sectores inestables."
    ],
    "product": null,
    "condition": "",
    "image": ""
  },
  "maiz_granos_manchas": {
    "part": "Frutos o mazorcas",
    "title": "Granos con manchas",
    "sub": "Granos con puntos oscuros o coloración anormal.",
    "cause": "Manchado de grano: investigar Fusarium spp., otros hongos y lesiones no infecciosas.",
    "explanation": "El color anormal puede acompañar colonización fúngica o daño físico. Revisar el grano, su humedad y la presencia de moho permite orientar la evaluación.",
    "management": "Bacillus amyloliquefaciens se considera como complemento preventivo para proteger tejido sano frente a hongos susceptibles. No revierte el grano dañado ni elimina micotoxinas.",
    "goals": [
      "Proteger futuras mazorcas y tejido sano.",
      "Reducir factores que facilitan nuevas infecciones.",
      "Separar y evaluar oportunamente granos afectados."
    ],
    "actions": [
      "Compara mazorcas sanas y afectadas y fotografía granos de cerca.",
      "Revisa daño de insectos, humedad y condiciones de cosecha.",
      "Separa el grano con moho y evalúa micotoxinas antes de destinarlo a consumo o alimento animal."
    ],
    "product": "amyl",
    "condition": "Valorar tras identificar el agente y verificar susceptibilidad, cepa y uso previsto de la formulación GALYON.",
    "image": "galyon_maiz_granos_manchas"
  },
  "maiz_pudricion_mazorca": {
    "part": "Frutos o mazorcas",
    "title": "Pudrición en la mazorca",
    "sub": "Tejidos deteriorados, húmedos o con micelio.",
    "cause": "Pudrición de mazorca compatible con Fusarium spp., Stenocarpella maydis o Aspergillus spp.",
    "explanation": "Los hongos deterioran el grano; algunos producen micotoxinas. El aspecto del moho orienta, pero no permite identificar la especie ni saber si el grano es apto para consumo.",
    "management": "Bacillus amyloliquefaciens se valora para protección preventiva del tejido sano frente a hongos susceptibles, dentro de un manejo integrado; no como cura de mazorcas podridas.",
    "goals": [
      "Evitar nuevas pérdidas en mazorcas sanas.",
      "Reducir humedad y heridas que favorecen la infección.",
      "Separar grano deteriorado y orientar su evaluación."
    ],
    "actions": [
      "Separa mazorcas afectadas y conserva muestras para diagnóstico.",
      "Revisa humedad y daños de insectos; planifica secado y almacenamiento adecuados.",
      "Consulta evaluación de micotoxinas antes de usar grano con moho."
    ],
    "product": "amyl",
    "condition": "Considerar solo con diagnóstico del agente y verificación de la cepa GALYON; ningún bioinsumo descontamina el grano.",
    "image": "galyon_maiz_pudricion_mazorca"
  },
  "maiz_perforaciones_mazorca": {
    "part": "Frutos o mazorcas",
    "title": "Mazorcas comidas o perforadas",
    "sub": "Galerías, granos mordidos, excrementos o larvas.",
    "cause": "Daño de larvas en mazorca: Helicoverpa zea, Spodoptera frugiperda u otras especies.",
    "explanation": "Las larvas consumen estigmas y granos y abren heridas para hongos. El control es más oportuno antes de que se refugien dentro de la mazorca.",
    "management": "Bacillus thuringiensis se considera por ingestión frente a larvas susceptibles. El plan debe alcanzar larvas pequeñas y expuestas en el momento correcto.",
    "goals": [
      "Prevenir nuevas perforaciones de larvas susceptibles.",
      "Proteger estigmas y granos aún sanos.",
      "Reducir heridas que facilitan pudriciones."
    ],
    "actions": [
      "Busca larvas vivas y fotografía su tamaño y daño reciente.",
      "Revisa estigmas y puntas de mazorcas vecinas durante la floración.",
      "Coordina el momento de intervención antes de que las larvas queden protegidas."
    ],
    "product": "bt",
    "condition": "Valorar para una plaga y cepa compatibles, con larvas susceptibles expuestas y uso autorizado; no presumir alcance dentro de la mazorca.",
    "image": "galyon_maiz_perforaciones_mazorca"
  },
  "maiz_mal_llenado_mazorca": {
    "part": "Frutos o mazorcas",
    "title": "Mazorcas poco desarrolladas",
    "sub": "Zonas sin granos o llenado irregular.",
    "cause": "Polinización incompleta o aborto de granos por estrés hídrico, calor o nutrición limitada.",
    "explanation": "La falta de coincidencia entre polen y estigmas o el estrés durante floración y llenado dejan espacios vacíos. No implica por sí sola una enfermedad.",
    "management": "Revisa agua, polinización y nutrición, apoyándote en análisis de suelo. No corresponde recomendar automáticamente un microorganismo ni prometer rellenar granos ausentes.",
    "goals": [
      "Mejorar las condiciones para el llenado de futuras mazorcas.",
      "Corregir limitaciones de agua o nutrición.",
      "Ajustar la planificación de siembra y floración."
    ],
    "actions": [
      "Anota fechas de floración y episodios de calor o sequía.",
      "Revisa riego, densidad y daño de insectos en los estigmas.",
      "Compara mazorcas de varias zonas y solicita análisis de suelo para el próximo plan."
    ],
    "product": null,
    "condition": "",
    "image": "galyon_maiz_mal_llenado_mazorca"
  }
};
 // Una fotografía individual por formulación, compartida por todos los resultados.
 const advisorProductCatalog={
  tricho:{line:'GALYON TRICHO',microbe:'Trichoderma spp.',image:'assets/catalogo/tricho-1l.webp',anchor:'#detalle-tricho'},
  subtilis:{line:'GALYON BACT',microbe:'Bacillus subtilis',image:'assets/catalogo/bact-subtilis-1l.webp',anchor:'#detalle-bact'},
  amyl:{line:'GALYON BACT',microbe:'Bacillus amyloliquefaciens',image:'assets/catalogo/bact-amyloliquefaciens-1l.webp',anchor:'#detalle-bact'},
  bt:{line:'GALYON INSECTA',microbe:'Bacillus thuringiensis',image:'assets/catalogo/insecta-bt-1l.webp',anchor:'#detalle-insecta'},
  beauveria:{line:'GALYON INSECTA',microbe:'Beauveria bassiana',image:'assets/catalogo/insecta-beauveria-1l.webp',anchor:'#detalle-insecta'},
  metarhizium:{line:'GALYON INSECTA',microbe:'Metarhizium anisopliae',image:'assets/catalogo/insecta-metarhizium-1l.webp',anchor:'#detalle-insecta'}
 };
 function advisorProductPhotos(line,formulation=''){
  const candidates=Object.entries(advisorProductCatalog).filter(([,product])=>product.line===line);
  const matches=candidates.filter(([,product])=>formulation.includes(product.microbe));
  // Sin formulación definida, mostrar alternativas de la línea sin elegir una por defecto.
  const products=matches.length?matches:candidates;
  const photo=([key,product])=>'<img src="'+e(product.image)+'" data-advisor-product="'+e(key)+'" alt="'+e(product.line+' — '+product.microbe+', presentación de 1 litro')+'" loading="lazy" decoding="async" width="1000" height="1000">';
  if(products.length===1)return '<div class="advisor-product-photo advisor-catalog-photo">'+photo(products[0])+'</div>';
  return '<div class="advisor-product-variants" role="group" aria-label="Alternativas de formulación"><p class="advisor-variants-label">Formulaciones a evaluar según el caso</p>'+products.map(entry=>'<figure class="advisor-catalog-variant">'+photo(entry)+'<figcaption>'+e(entry[1].microbe)+'</figcaption></figure>').join('')+'</div>';
 }
 const maizeProducts={subtilis:advisorProductCatalog.subtilis,amyl:advisorProductCatalog.amyl,tricho:advisorProductCatalog.tricho,bt:advisorProductCatalog.bt};
 const catalog={
  'Cacao':{
    'Frutos o mazorcas':[
      a('cacao_negro','Manchas negras y pudrición','v534_cacao_manchas_negras_mazorca','Zonas marrones o negras que avanzan','Síntomas compatibles con mazorca negra, entre otras causas.','Fotografía la lesión y revisa si se extiende rápidamente; el aspecto no confirma por sí solo Phytophthora spp.'),
      a('cacao_blanco','Polvo blanco o crema','v52_cacao_moniliasis_foto_real','Capa clara sobre la mazorca','Síntomas compatibles con moniliasis, entre otras causas.','Una imagen de cerca y el estado de la mazorca ayudan a diferenciar problemas parecidos.'),
      a('cacao_insecto','Insectos en la mazorca','v534_cacao_insectos_mazorca','Insectos presentes en la superficie; no todos perforan el fruto','Posible daño por insectos u otros organismos.','Conviene identificar el organismo antes de elegir una formulación de control.','INSECTA'),
      a('otro','No reconozco mi problema','v534_asesoria_personalizada','Prefiero consultarlo con un asesor','','Envía fotografías de cerca y de la planta completa.')
    ],
    'Hojas':[
      a('cacao_hojas_manchas','Manchas rojas o cafés','v534_cacao_manchas_necrosis','Manchas rojizas, zonas necróticas o bordes dañados','','Compara las hojas afectadas con las sanas y muestra ambos lados al asesor.'),
      a('cacao_hojas_insectos','Hojas comidas','v534_cacao_hojas_comidas','Perforaciones y bordes irregulares','Posible alimentación de insectos.','Una foto del insecto, si está presente, ayudará a escoger la alternativa apropiada.','INSECTA'),
      a('cacao_amarillo','Amarillamiento o decaimiento','v534_cacao_hoja_marchita','La planta pierde vigor','','Conviene revisar raíces, humedad y nutrición antes de seleccionar un bioinsumo.'),
      unknown
    ],
    'Raíces o tallo':[
      a('cacao_cancro','Lesiones en tallos','v534_cacao_lesiones_tallos','Heridas, zonas oscuras o grietas','','Una lesión del tallo puede tener varias causas; muestra también las ramas y las raíces.'),
      a('cacao_raices','Raíces dañadas o débiles','v52_cacao_raices','Pocas raíces o áreas deterioradas','','Se recomienda revisar raíces y condiciones del suelo para orientar una alternativa biológica.'),
      a('cacao_marchito','Rama marchita','v534_cacao_rama_marchita','Ramas que pierden vigor','','Indica si la marchitez está limitada a una rama o afecta a toda la planta.'),
      unknown
    ],
    'Toda la planta':[
      a('cacao_escoba','Brotes deformados','v534_cacao_escoba_bruja','Ramas con crecimiento anormal','Los brotes son compatibles con escoba de bruja, entre otras causas.','Muestra un acercamiento del crecimiento anormal para una valoración técnica.'),
      a('cacao_debil','Amarillamiento general','v534_cacao_amarillamiento_general','Pérdida de vigor y hojas amarillas','','Las causas pueden ser nutricionales, ambientales o fitosanitarias.'),
      a('cacao_seco','Ramas secas','cacao_cancro','Secamiento progresivo','','Indica desde dónde inicia el secamiento y si hay lesiones en los tallos.'),
      unknown
    ]
  },
  'Banano':[
    a('banano_sigatoka','Manchas y estrías en hojas','v535_banano_manchas_hojas','Lesiones alargadas o zonas oscuras','Es muy probable que se trate de Sigatoka del banano.','Fotografía la progresión de las manchas en hojas nuevas y viejas para orientar el manejo.'),
    a('banano_marchitez','Amarillamiento general o decaimiento','v535_banano_planta','Pérdida de vigor en la planta completa','Es muy probable que exista un problema vascular, radicular o de estrés severo.','Toma una foto adicional de la base y del sistema radicular para afinar la recomendación.'),
    a('banano_tallo','Base del pseudotallo dañada','v535_banano_base_danada','Zonas oscuras y deterioro en la base','Es muy probable que exista pudrición o daño avanzado en pseudotallo.','Muestra la base de la planta y explica cuándo empezó el deterioro.'),
    a('banano_raices','Problemas en raíces','v535_banano_raices','Raíces deterioradas o poco desarrolladas','Es muy probable que haya daño radicular que está afectando el vigor de la planta.','Comparte también el tipo de suelo, humedad y edad de la plantación.'),
    a('banano_picudo','Galerías o perforaciones en el cormo','v536_banano_galerias_picudo','Orificios o galerías en pseudotallo y cormo','Es muy probable que exista daño de picudo negro del plátano.','Solicita revisión del cormo y, si es posible, evidencia del insecto para confirmar el nivel de ataque.','INSECTA'),unknown
  ],
  'Maíz':Object.entries(maizeCases).map(([key,c])=>a(key,c.title,c.cardImage||c.image,c.sub,c.cause,c.explanation)),
  'Arroz':[
    a('arroz_manchas','Manchas alargadas en hojas','arroz_tizon','Zonas pajizas o cafés','','Examina si el daño está aumentando y si aparece en las hojas más jóvenes.'),
    a('arroz_espiga','Bolas de polvo verde en espigas','arroz_falso_carbon','Algunos granos se convierten en bolas amarillentas o verdosas','','Una foto nítida de la espiga permitirá diferenciar posibles enfermedades.'),
    a('arroz_tallo','Lesiones en vainas o tallos','arroz_tallo','Deterioro de zonas del tallo','','Indica si el daño coincide con plantas caídas o marchitas.'),
    a('arroz_granos','Granos manchados o dañados','arroz_grano','Decoloración en espigas','','Muestra las espigas completas y granos afectados.'),unknown
  ],
  'Caña de azúcar':[
    a('cana_roya','Manchas anaranjadas','cana_roya','Pústulas rojizas en hojas','Síntomas compatibles con roya, entre otras causas.','Fotografía ambas caras de las hojas afectadas.'),
    a('cana_carbon','Estructuras negras anormales','cana_carbon','Crecimientos oscuros tipo látigo','Síntomas compatibles con carbón de la caña, entre otras causas.','Muestra la estructura completa y su ubicación en la planta.'),
    a('cana_cogollo','Cogollo amarillento o dañado','cana_cogollo','Hojas nuevas afectadas','','Es útil conocer la edad del cultivo y si el daño aumenta.'),
    a('cana_barrenador','Perforaciones en el tallo','cana_barrenador','Galerías o daño interno','Posible actividad de insectos barrenadores, entre otras causas.','La identificación del insecto es clave para elegir un producto apropiado.','INSECTA'),unknown
  ],
  'Café':[
    a('cafe_roya','Polvillo naranja bajo las hojas','cafe_roya','Manchas amarillas arriba y polvo anaranjado en el envés','Síntomas compatibles con roya del café, entre otras causas.','Muestra ambas caras de la hoja y el avance del problema.'),
    a('cafe_broca','Cerezas perforadas','cafe_broca','Pequeños agujeros en cerezas','Posible daño por insectos perforadores, entre otras causas.','Una imagen del fruto abierto y del insecto puede ayudar a identificar la plaga.','INSECTA'),
    a('cafe_hojas','Manchas en hojas','cafe_manchas','Lesiones irregulares','','Describe si aparecen también amarillamiento o caída de hojas.'),
    a('cafe_ramas','Ramas que se secan','cafe_rama_seca','Secamiento de brotes','','Conviene revisar tallo, raíces y condiciones del cultivo.'),unknown
  ],
  'Hortalizas':[
    a('hort_manchas','Manchas oscuras en hojas','hort_tizon','Áreas cafés o secas','','Muestra hojas nuevas y maduras, e indica la hortaliza específica.'),
    a('hort_blanco','Polvo blanquecino','hort_oidio','Capa clara sobre la hoja','Síntomas compatibles con oídio, entre otras causas.','Una foto cercana del crecimiento blanquecino ayudará a orientarte.'),
    a('hort_frutos','Frutos con manchas','hort_antracnosis','Manchas hundidas o decoloración','','Comparte fotos de frutos sanos y afectados.'),
    a('hort_insectos','Hojas comidas','hort_insectos','Perforaciones, larvas o mordeduras','Posible actividad de insectos.','Identificar la plaga permitirá valorar una alternativa de GALYON INSECTA.','INSECTA'),unknown
  ]
 };
 function option(item){
  const symptomClass=item.key.startsWith('observacion_')?(/_insectos$/.test(item.key)?'pest':/_manchas$|_tallo$|_polvo$/.test(item.key)?'spots':/_pudricion$/.test(item.key)?'rot':/_marchitez$|_decaimiento$/.test(item.key)?'wilt':'growth'):'';
  const glyphs={pest:'<circle cx="24" cy="24" r="10"/><path d="M14 13 9 9m25 4 5-4M12 24H5m38 0h-7M14 35l-5 4m25-4 5 4M24 14v20M17 19l14 10"/>',spots:'<path d="M12 39C11 22 20 13 39 9c1 18-7 28-27 30Z"/><path d="M13 38 33 17"/><circle cx="21" cy="24" r="2"/><circle cx="29" cy="29" r="2"/>',rot:'<circle cx="24" cy="25" r="14"/><path d="M24 11c0-6 3-8 8-8M15 16c-5-3-8-2-10-1"/><path d="M17 30l4-5 4 2 5-7"/>',wilt:'<path d="M24 39V23M24 27c-11 2-14-5-14-13 9 0 14 6 14 13Zm0-4c0-8 5-13 14-13 0 8-3 14-14 13Z"/><path d="M12 42h24"/>',growth:'<path d="M24 40V10m0 13c-8 0-12-5-12-12 9 0 12 5 12 12Zm0-5c0-7 4-12 12-12 0 7-4 12-12 12Z"/><path d="M13 40h22"/>'};
  const badge=symptomClass?'<span class="advisor-symptom-illustration advisor-symptom-'+symptomClass+'" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+glyphs[symptomClass]+'</svg></span>':'';
  const image=item.image?'<img src="'+e(p(item.image))+'" alt="" loading="lazy" decoding="async">':badge||'<span class="advisor-no-photo" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M12 36c15 0 25-11 25-26-14 0-26 9-26 26Z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M15 32 34 15" fill="none" stroke="currentColor" stroke-width="2.5"/></svg></span>';
  return '<button type="button" class="advisor-option'+(!item.image?' is-text':'')+'" data-advisor-value="'+e(item.key)+'"'+(item.referenceImage?' data-reference-image="true" aria-description="Ilustración generada de referencia"':'')+'>'+image+'<span class="advisor-option-text"><strong>'+e(item.text)+'</strong>'+(item.sub?'<small>'+e(item.sub)+'</small>':'')+'</span></button>';
 }
 function visualFor(item,kind){
  if(!item)return null;
  const part=kind==='parts'?'':data.part;
  const image=data.area==='Finca o plantación'&&advisorCardImages[[data.crop,part,kind,item.key].join('|')];
  return image?{...item,image,referenceImage:true}:item;
 }
 function grid(items,kind=''){
  return '<div class="advisor-options '+(kind?'advisor-options-'+kind:'')+'">'+items.map(item=>option(visualFor(item,kind))).join('')+'</div>';
 }
 const organSymptomKeys={
  'Banano':{'Toda la planta':['banano_marchitez'], 'Hojas':['banano_sigatoka'], 'Raíces o tallo':['banano_tallo','banano_raices','banano_picudo'], 'Frutos o mazorcas':[]},
  'Maíz':Object.fromEntries(specificParts['Maíz'].map(([part])=>[part,Object.keys(maizeCases).filter(key=>maizeCases[key].part===part)])),
  'Caña de azúcar':{'Toda la planta':['cana_roya','cana_carbon','cana_cogollo'], 'Hojas':['cana_roya','cana_cogollo'], 'Raíces o tallo':['cana_carbon','cana_barrenador'], 'Frutos o mazorcas':['cana_carbon','cana_barrenador','cana_cogollo']},
  'Café':{'Toda la planta':['cafe_ramas','cafe_roya'], 'Hojas':['cafe_roya','cafe_hojas'], 'Raíces o tallo':['cafe_ramas'], 'Frutos o mazorcas':['cafe_broca']},
  'Hortalizas':{'Toda la planta':['hort_manchas','hort_blanco','hort_insectos'], 'Hojas':['hort_manchas','hort_blanco','hort_insectos'], 'Raíces o tallo':[], 'Frutos o mazorcas':['hort_frutos']}
 };
 // v5.2.8: recorridos específicos para jardines y maracuyá.
 // Las tarjetas que no tienen una foto FITOSANITARIA comprobada utilizan iconos
 // descriptivos: nunca presentamos una foto de una planta sana como enfermedad.
 const tailoredCrops={
  'Maracuyá':{leaf:'hojas de maracuyá',fruit:'frutos de maracuyá',base:'la liana o sus raíces',whole:'la enredadera'},
  'Tomate':{leaf:'hojas de tomate',fruit:'tomates',base:'los tallos o raíces',whole:'la tomatera'},
  'Ají o pimiento':{leaf:'hojas de ají o pimiento',fruit:'ajíes o pimientos',base:'la base del tallo o raíces',whole:'la planta de ají'},
  'Cítricos':{leaf:'hojas de cítricos',fruit:'limones, naranjas o mandarinas',base:'las ramas o el cuello del árbol',whole:'el árbol de cítricos'},
  'Aguacate':{leaf:'hojas de aguacate',fruit:'aguacates',base:'el tronco o las raíces',whole:'el árbol de aguacate'},
  'Mango':{leaf:'hojas de mango',fruit:'mangos',base:'las ramas o raíces',whole:'el árbol de mango'},
  'Chirimoya':{leaf:'hojas de chirimoya',fruit:'chirimoyas',base:'el tronco o raíces',whole:'el árbol de chirimoya'},
  'Papaya':{leaf:'hojas de papaya',fruit:'papayas',base:'el tallo o cuello de la planta',whole:'la papaya'},
  'Flores y ornamentales':{leaf:'hojas de las ornamentales',fruit:'flores o botones',base:'tallos o raíces',whole:'la planta ornamental',floral:true},
  'Hierbas aromáticas':{leaf:'hojas de las aromáticas',base:'tallos o raíces',whole:'la planta aromática',herb:true}
 };
 const indicator=(type,text,sub,guidance,line='')=>a('observacion_'+data.crop.toLowerCase().replace(/[^a-záéíóúñ]+/g,'_')+'_'+type,text,'',sub,'',guidance,line);
 function specificGardenSymptoms(){
  const c=tailoredCrops[data.crop];
  if(!c)return null;
  const insectNote='Si ves larvas o insectos, envía una fotografía: elegir la formulación INSECTA depende de la plaga identificada.';
  let items;
  switch(data.part){
   case 'Hojas':
    items=[
     a('observacion_'+data.crop.toLowerCase()+'_manchas','Manchas en '+c.leaf, data.crop==='Mango'?'v537_mango_hojas':data.crop==='Aguacate'?'v537_aguacate_hojas':'','Zonas cafés, oscuras o circulares','','Compara hojas nuevas y viejas; las manchas pueden deberse a varias causas.'),
     indicator('insectos','Hojas comidas o insectos','Orificios, bordes mordidos o larvas',insectNote,'INSECTA'),
     ...(data.crop==='Tomate'?[a('tomate_mosca_blanca','Mosquitas blancas bajo las hojas','v532_tomate_mosca_blanca','Pequeños insectos blancos vuelan al mover la planta; pueden dejar las hojas pegajosas.','', 'Mira debajo de las hojas: fotografía insectos blancos, ninfas y cualquier melaza antes de elegir la formulación.','INSECTA')]:[]),
     ...(data.crop==='Ají o pimiento'?[a('aji_pulgones','Colonias de pulgones en brotes','v532_aji_pulgones','Insectos agrupados en brotes tiernos; hojas arrugadas o pegajosas.','', 'Observa el envés y fotografía colonias de insectos verdes o amarillentos antes de seleccionar el manejo.','INSECTA')]:[]),
     ...(data.crop==='Cítricos'?[a('citricos_minador','Caminos serpenteantes en hojas nuevas','v532_citricos_minador','Galerías claras en zigzag y hojas jóvenes enrolladas.','', 'Las galerías suelen estar dentro de hojas jóvenes: identifica el minador antes de decidir un manejo; los productos de contacto pueden no alcanzarlo.')]:[]),
     ...(data.crop==='Flores y ornamentales'?[a('flores_oidio','Polvo blanco en hojas de rosas','v532_rosal_oidio','Recubrimiento blanquecino como harina en hojas y brotes.','', 'Si son rosas u ornamentales similares, es muy probable oídio; compara varios brotes y confirma el cultivo antes de tratar.')]:[]),
     ...(data.crop==='Papaya'?[a('papaya_mosaico','Mosaico amarillo y hojas deformadas','','Parches amarillos y verdes, hojas arrugadas o muy estrechas.','', 'Compara además los frutos: los anillos son una pista importante de PRSV. No existe un biofungicida que cure una planta infectada por el virus.')]:[]),
     ...(data.crop==='Maracuyá'?[a('maracuya_mancha_bacteriana','Manchas acuosas con halo amarillo','','Puntos húmedos que oscurecen y pueden rodearse de amarillo.','', 'Podría tratarse de mancha bacteriana, pero otros organismos provocan lesiones parecidas. Fotografía ambas caras y los tallos.')]:[]),
     (data.crop==='Mango'?a('observacion_mango_amarillas','Hojas amarillas o enrolladas','v544_mango_amarillas','Cambio de color, deformación o caída','','El amarillamiento también puede relacionarse con agua, nutrición o estrés.'):data.crop==='Aguacate'?a('observacion_aguacate_amarillas','Hojas amarillas o enrolladas','v544_aguacate_amarillas','Cambio de color, deformación o caída','','Revisa riego, suelo y raíces para entender la causa.'):indicator('amarillas','Hojas amarillas o enrolladas','Cambio de color, deformación o caída','El amarillamiento también puede relacionarse con agua, nutrición o estrés.')) ,
     indicator('polvo','Capa blanquecina en hojas','Polvo o recubrimiento blanco visible','Comparte una foto cercana del recubrimiento antes de decidir un manejo.')
    ];break;
   case 'Frutos o mazorcas':
    if(c.herb)return [unknown];
    items=[
     ...(data.crop==='Mango'?[]:[a('observacion_'+data.crop.toLowerCase()+'_fruto_manchas','Manchas en '+c.fruit,data.crop==='Aguacate'?'v537_aguacate_frutos':'','Áreas oscuras, costras o puntos','','Indica si el fruto está firme o blando y muestra el daño de cerca.')]),
     ...(data.crop==='Mango'?[a('mango_lesiones_fruto','Manchas oscuras hundidas en mangos','v538_mango_manchas_unicas','Lesiones negras, irregulares o deprimidas sobre la cáscara.','', 'La antracnosis es una posibilidad importante, pero las lesiones pueden tener otras causas: muestra fruta y hojas afectadas.')]:[]),
     ...(data.crop==='Papaya'?[a('papaya_anillos','Anillos verdes en la cáscara','v533_papaya_anillos','Marcas concéntricas verdes y hundidas; pueden coincidir con mosaico en hojas.','', 'La mancha anular por PRSV es muy probable si se observan además hojas con mosaico; una formulación GALYON no cura el virus. Confirma antes de decidir manejo.'),a('papaya_antracnosis','Manchas negras hundidas en papaya','','Áreas oscuras y deprimidas en frutos que maduran.','', 'La antracnosis es probable, pero golpes y otras pudriciones pueden parecerse. Muestra frutos de varios estados.')]:[]),
     ...(data.crop==='Chirimoya'?[a('chirimoya_antracnosis','Lesiones hundidas en chirimoyas','','Manchas oscuras redondeadas; a veces aparecen masas de esporas rosadas.','', 'Estos signos orientan hacia antracnosis, que debe diferenciarse de daño por frío, golpes y otras pudriciones.')]:[]),
     ...(data.crop==='Maracuyá'?[a('maracuya_roña','Costras corchosas en maracuyá','','Lesiones elevadas, pardas o con aspecto de corcho en la cáscara.','', 'La roña es una causa posible; también pueden producirse manchas por daño mecánico y otros patógenos. Muestra hojas y frutos juntos.')]:[]),
     a('observacion_'+data.crop.toLowerCase()+'_pudricion','Pudrición de '+c.fruit,data.crop==='Mango'?'v537_mango_frutos':data.crop==='Aguacate'?'v537_aguacate_frutos':'','Zonas blandas, húmedas o descompuestas','','Describe cuándo comenzó la lesión y cuántos frutos están afectados.'),
     ...(data.crop==='Mango'?[a('observacion_mango_fruto_insectos','Perforaciones o insectos en mangos','v543_mango_insectos','Agujeros o presencia de larvas', '', insectNote,'INSECTA')]:[indicator('insectos','Perforaciones o insectos en '+c.fruit,'Agujeros o presencia de larvas',insectNote,'INSECTA')]),
     ...(data.crop==='Mango'?[a('observacion_mango_fruto_deformes','Frutos deformados','v543_mango_deformes','Desarrollo irregular o caída prematura','','Las alteraciones pueden involucrar factores ambientales y nutricionales.')]:[indicator('deformes',c.floral?'Flores o botones deformados':'Frutos deformados','Desarrollo irregular o caída prematura','Las alteraciones pueden involucrar factores ambientales y nutricionales.')])
    ];break;
   case 'Raíces o tallo':
    items=[
     a('observacion_'+data.crop.toLowerCase()+'_tallo','Lesiones en '+c.base,data.crop==='Mango'?'v537_mango_base':data.crop==='Aguacate'?'v537_aguacate_base':'','Manchas, grietas o tejido deteriorado','','Envía una fotografía de la zona afectada sin arrancar tejido sano.'),
     indicator('decaimiento','Pérdida de vigor desde la base','Marchitez, caída o crecimiento débil','Revisa primero humedad, drenaje y otros signos en el sistema radicular.'),
     indicator('insectos','Galerías o insectos en tallos','Orificios, aserrín o daño visible',insectNote,'INSECTA')
    ];break;
   default:
    items=[
     a('observacion_'+data.crop.toLowerCase()+'_marchitez','Marchitez general',data.crop==='Mango'?'v537_mango_decaimiento':data.crop==='Aguacate'?'v537_aguacate_decaimiento':'','La planta está decaída o pierde turgencia','','Compara el estado del suelo y el riego, además de posibles plagas o enfermedades.'),
     indicator('amarillas','Amarillamiento de '+c.whole,'Pierde vigor o cambia de color','Una foto de toda la planta y otra de la zona afectada ayudarán a orientar las causas.'),
     indicator('insectos','Daños visibles por insectos','Hojas comidas, larvas o perforaciones',insectNote,'INSECTA'),
     ...(data.crop==='Mango'?[a('observacion_mango_flor','Flores secas o caída de floración','v539_mango_flor','Inflorescencias secas o flores caídas','','Observa el estado de la floración y comparte imágenes de brotes sanos y afectados.')]:data.crop==='Aguacate'?[a('observacion_aguacate_flor','Flores secas o poca formación','v539_aguacate_flor','Flores oscuras o que se secan','','Indica cuándo apareció el daño en la floración y si afecta a varios árboles.')]:[]),
     indicator('crecimiento','Crecimiento débil o irregular','Poco desarrollo, caída de hojas o brotes anormales','Indica la edad de la planta y desde cuándo observas el cambio.')
    ];break;
  }
  return [...items,unknown];
 }
 const chooseSymptoms=()=>{
  const tailored=specificGardenSymptoms();
  if(tailored)return tailored;
  // Banano y maíz: antes el visitante que seleccionaba frutos solo veía «No estoy seguro».
  // Preguntamos por el aspecto observable de racimos/mazorcas, sin asignar una causa no demostrada.
  if(data.part==='Frutos o mazorcas' && data.crop==='Banano')return [
   a('observacion_banano_manchas','Dedos de banano con manchas','v535_banano_dedos_manchas','Manchas o zonas oscuras en la cáscara','','Comparte imágenes de frutos de distintos racimos y describe si las lesiones crecen.'),
   a('observacion_banano_pudricion','Frutos blandos o deteriorados','v535_banano_frutos_blandos','Pudrición o partes blandas','','Indica si el problema empezó antes o después de la cosecha.'),
   a('observacion_banano_deformes','Frutos pequeños o deformados','v535_banano_frutos_deformes','Desarrollo desigual en el racimo','','También puede intervenir el estado nutricional, el agua y la edad del racimo.'),unknown
  ];
  const table=catalog[data.crop];
  if(!table)return general;
  if(Array.isArray(table)){
   const keys=organSymptomKeys[data.crop]?.[data.part];
   if(!keys)return table;
   const matches=table.filter(item=>keys.includes(item.key));
   return [...matches,unknown];
  }
  return table[data.part]||general;
 };
 const resultAgents={"cosmopolites":{"id":"cosmopolites","name":"Picudo negro del banano","scientific":"Cosmopolites sordidus","view":"Vista ampliada","image":"agente-cosmopolites"},"hypothenemus":{"id":"hypothenemus","name":"Broca del café","scientific":"Hypothenemus hampei","view":"Vista ampliada","image":"agente-hypothenemus"},"frugiperda":{"id":"frugiperda","name":"Larva de gusano cogollero","scientific":"Spodoptera frugiperda","view":"Vista ampliada","image":"agente-frugiperda"},"diatraea":{"id":"diatraea","name":"Ejemplo de larva barrenadora","scientific":"Diatraea spp.","view":"Vista ampliada","image":"agente-diatraea"},"monilia":{"id":"monilia","name":"Hongo asociado a moniliasis","scientific":"Moniliophthora roreri","view":"Vista microscópica","image":"agente-monilia"},"perniciosa":{"id":"perniciosa","name":"Hongo asociado a escoba de bruja","scientific":"Moniliophthora perniciosa","view":"Vista ampliada","image":"agente-perniciosa"},"phytophthora":{"id":"phytophthora","name":"Oomiceto asociado a mazorca negra","scientific":"Phytophthora spp.","view":"Vista microscópica","image":"agente-phytophthora"},"hemileia":{"id":"hemileia","name":"Hongo de la roya del café","scientific":"Hemileia vastatrix","view":"Vista microscópica","image":"agente-hemileia"},"puccinia":{"id":"puccinia","name":"Hongos asociados a roya","scientific":"Puccinia spp.","view":"Vista microscópica","image":"agente-puccinia"},"sporisorium":{"id":"sporisorium","name":"Hongo del carbón de la caña","scientific":"Sporisorium scitamineum","view":"Vista microscópica","image":"agente-sporisorium"},"pseudocercospora":{"id":"pseudocercospora","name":"Hongos asociados a Sigatoka","scientific":"Pseudocercospora spp.","view":"Vista microscópica","image":"agente-pseudocercospora"},"oidio":{"id":"oidio","name":"Hongos asociados a oídio","scientific":"Hongos del oídio","view":"Vista microscópica","image":"agente-oidio"},"colletotrichum":{"id":"colletotrichum","name":"Hongos asociados a antracnosis","scientific":"Colletotrichum spp.","view":"Vista microscópica","image":"agente-colletotrichum"},"exserohilum":{"id":"exserohilum","name":"Agente a investigar en tizón foliar","scientific":"Exserohilum turcicum","view":"Vista microscópica","image":"agente-exserohilum"}};
 const resultAgentRoutes={"Banano|banano_picudo":"cosmopolites","Banano|banano_sigatoka":"pseudocercospora","Cacao|cacao_blanco":"monilia","Cacao|cacao_negro":"phytophthora","Cacao|cacao_escoba":"perniciosa","Café|cafe_roya":"hemileia","Café|cafe_broca":"hypothenemus","Maíz|maiz_roya":"puccinia","Maíz|maiz_oruga":"frugiperda","Maíz|maiz_manchas":"exserohilum","Maíz|maiz_galerias_tallo":"diatraea","Caña de azúcar|cana_roya":"puccinia","Caña de azúcar|cana_carbon":"sporisorium","Caña de azúcar|cana_barrenador":"diatraea","Hortalizas|hort_blanco":"oidio","Mango|mango_lesiones_fruto":"colletotrichum"};
 function agentForResult(){
  if(data.area!=='Finca o plantación'||!chooseSymptoms().some(item=>item.key===data.symptom))return null;
  const agent=resultAgents[resultAgentRoutes[data.crop+'|'+data.symptom]];
  return agent?{...agent,example:data.crop==='Caña de azúcar'&&data.symptom==='cana_barrenador'}:null;
 }
 function agentImageBlock(agent){
  return '<div class="advisor-evidence-image"><img src="'+e(p(agent.image))+'" data-agent-id="'+e(agent.id)+'" alt="Ilustración de referencia de '+e(agent.name)+' — '+e(agent.scientific)+'" loading="lazy" decoding="async"><span class="advisor-evidence-tag advisor-agent-tag"><b>'+(agent.example?'EJEMPLO DEL GRUPO':'POSIBLE CAUSANTE')+'</b><i>'+e(agent.scientific)+'</i><small>'+e(agent.view)+' · ilustración de referencia</small></span></div>';
 }
 function maizeResult(c){
  const product=c.product?maizeProducts[c.product]:null;
  const partName=partsForCrop().find(part=>part.key===data.part)?.text||data.part;
  const selectedVisual=visualFor(chooseSymptoms().find(item=>item.key===data.symptom),'symptoms');
  const imageSlug=selectedVisual?.image||c.image;
  const generatedReference=selectedVisual?.referenceImage||/^galyon_|^maiz_hojas_/.test(imageSlug||'');
  const agent=agentForResult();
  const image=agent?agentImageBlock(agent):imageSlug?'<div class="advisor-evidence-image"><img src="'+e(p(imageSlug))+'" alt="Referencia visual de '+e(c.title)+'" loading="lazy" decoding="async"><span class="advisor-evidence-tag">'+(generatedReference?'ILUSTRACIÓN DE REFERENCIA':'IMAGEN DE REFERENCIA')+'</span></div>':'';
  const outcomeCards=c.goals.map((goal,i)=>'<div class="advisor-outcome-card"><span class="advisor-outcome-index">0'+(i+1)+'</span><p>'+e(goal)+'</p></div>').join('');
  const fieldActions=c.actions.map((action,i)=>'<p>'+e((i+1)+'. '+action)+'</p>').join('');
  const management=product
   ? '<div class="advisor-solution"><div class="advisor-solution-heading"><span>PRODUCTO A EVALUAR SEGÚN EL AGENTE</span><h4><strong>'+e(product.line)+' — '+e(product.microbe)+'</strong></h4></div><div class="advisor-product">'+advisorProductPhotos(product.line,product.microbe)+'<div class="advisor-product-copy"><h5>'+e(product.microbe)+'</h5><p class="advisor-formulation-line">'+e(product.line)+'</p><p>'+e(c.management)+'</p><p>'+e(c.condition)+'</p><a href="'+e(toNavAnchor(product.anchor))+'" class="advisor-line-link">Conocer esta línea →</a></div></div></div>'
   : '<div class="advisor-next"><div class="advisor-result-label">MANEJO PRIORITARIO</div><strong>Primero, corregir la causa.</strong><p>'+e(c.management)+'</p>'+(data.part==='Hojas'&&data.symptom==='maiz_roya'?'':'<a class="advisor-line-link" href="'+toNavAnchor("#analisis")+'">Conocer los análisis de suelo →</a>')+'</div>';
  const message='Hola, GALYON. Completé el Asesor de Cultivos. Lugar: '+data.area+'. Cultivo: Maíz. Parte afectada: '+partName+'. Síntomas: '+c.title+'. Causa probable a verificar: '+c.cause+' Explicación: '+c.explanation+' Manejo: '+c.management+(product?' Producto a evaluar: '+product.line+' — '+product.microbe+'. Condición: '+c.condition:' Sin bioinsumo asignado automáticamente.')+' Objetivos: '+c.goals.join(' ')+' Acciones de campo: '+c.actions.join(' ')+' Quiero continuar la evaluación con fotografías reales, edad del cultivo, extensión del daño y antecedentes de riego y fertilización. ¿Qué datos o muestras necesitan?';
  return '<div class="advisor-result-v523">'+
   '<div class="advisor-result-hero"><div><span class="advisor-result-label">ORIENTACIÓN PARA TU MAÍZ</span><h3>'+e(c.title)+'</h3><p>Entendamos la causa y definamos el manejo.</p></div></div>'+
   '<div class="advisor-summary"><span><b>Cultivo</b>Maíz</span><span><b>Parte afectada</b>'+e(partName)+'</span><span><b>Síntoma seleccionado</b>'+e(c.title)+'</span></div>'+
   '<div class="advisor-evidence'+(!image?' is-text-only':'')+'">'+image+'<div class="advisor-evidence-copy"><div class="advisor-problem-label">CAUSA PROBABLE A VERIFICAR</div><h4>'+e(c.cause)+'</h4><p>'+e(c.explanation)+'</p></div></div>'+management+
   '<div class="advisor-outcomes advisor-outcomes-new"><h4>Qué buscamos conseguir</h4><div class="advisor-outcome-cards">'+outcomeCards+'</div></div>'+
   '<div class="advisor-tip"><div><strong>Qué hacer en campo</strong>'+fieldActions+'</div></div>'+
   '<a class="advisor-cta advisor-cta-v523" href="https://wa.me/593968933445?text='+encodeURIComponent(message)+'" target="_blank" rel="noopener"><span>Revisar mi caso con GALYON</span><span aria-hidden="true">→</span></a>'+
   '<p class="advisor-caution">Orientación por síntomas. Confirmamos la causa con tus datos de campo y, cuando haga falta, análisis. Las imágenes son de referencia.</p></div>';
 }
 function result(){
  const maizeCase=data.crop==='Maíz'?maizeCases[data.symptom]:null;
  if(maizeCase && maizeCase.part===data.part)return maizeResult(maizeCase);
  const symptom=chooseSymptoms().find(s=>s.key===data.symptom) || general.find(s=>s.key===data.symptom);
  const symptomName=symptom?.text||'Sin identificar';
  const possible=symptom?.possible||'';
  const guidance=symptom?.guidance||'Muestra el problema desde cerca y una vista general de la planta para orientar los siguientes pasos.';
  const symKey=symptom?.key||'';
  const probable=probableCauses[symKey]||null;
  // Enlace orientativo por tipo de problema. Cada formulación se confirma con el asesor.
  const insectKeys=new Set(['cacao_hojas_insectos','cacao_insecto','maiz_oruga','cafe_broca','cana_barrenador','hort_insectos','tomate_mosca_blanca','aji_pulgones','banano_picudo','citricos_minador']);
  const rootKeys=new Set(['cacao_raices','banano_raices','banano_tallo','maiz_tallo','cacao_cancro']);
  const foliarKeys=new Set(['cacao_negro','cacao_blanco','cacao_escoba','banano_sigatoka','cafe_roya','cana_roya','maiz_roya','hort_blanco','flores_oidio','hort_manchas','hort_frutos','cafe_hojas','maiz_manchas','cacao_hojas_manchas']);
  const specialKeys=new Set(['papaya_anillos','papaya_mosaico','cana_carbon','banano_marchitez']);
  // Los indicadores genéricos se orientan por el síntoma, nunca como diagnóstico confirmado.
  const isGenericInsect=symKey.startsWith('observacion_') && /_insectos$|_insecto$|_plagas$/.test(symKey);
  const isGenericRoots=symKey.startsWith('observacion_') && /_tallo$/.test(symKey);
  const isGenericFoliage=symKey.startsWith('observacion_') && /_manchas$|_pudricion$/.test(symKey);
  const insectCase=insectKeys.has(symKey)||isGenericInsect||symKey==='plagas';
  const rootsCase=rootKeys.has(symKey)||isGenericRoots;
  const fungusCase=foliarKeys.has(symKey)||isGenericFoliage;
  const selectedLine=specialKeys.has(symKey)||symKey==='otro'?null:insectCase?'INSECTA':rootsCase?'TRICHO':fungusCase?'BACT':null;
  const portfolio={
   INSECTA:{name:'GALYON INSECTA',anchor:'#detalle-insecta',tag:'MANEJO BIOLÓGICO DE INSECTOS',detail:'Beauveria, Metarhizium o Bacillus thuringiensis, según la plaga identificada.',outcomes:['Un manejo más dirigido al insecto que está afectando tu cultivo.','Menor presión de insectos susceptibles cuando se utiliza la formulación adecuada.','Mejor protección del crecimiento nuevo mediante seguimiento y aplicaciones oportunas.']},
   TRICHO:{name:'GALYON TRICHO',anchor:'#detalle-tricho',tag:'PROTECCIÓN BIOLÓGICA Y RAÍCES',detail:'Línea con Trichoderma spp. para considerar dentro de un manejo preventivo e integrado.',outcomes:['Condiciones más favorables para desarrollar raíces vigorosas.','Una estrategia biológica adicional frente a determinados hongos susceptibles, según la cepa.','Acompañamiento para cuidar el tejido nuevo y reducir riesgos futuros, sin recuperar tejido ya destruido.']},
   BACT:{name:'GALYON BACT',anchor:'#detalle-bact',tag:'VIGOR Y DESARROLLO VEGETAL',detail:'Bacillus subtilis o Bacillus amyloliquefaciens, con selección según la necesidad del cultivo.',outcomes:['Mejores condiciones para un crecimiento vegetal vigoroso.','Apoyo al desarrollo radicular y a la actividad biológica del entorno de la planta.','Un plan de aplicación y seguimiento ajustado a la respuesta del cultivo.']}
  };
  const choice=selectedLine?{...portfolio[selectedLine],outcomes:[...portfolio[selectedLine].outcomes]}:null;
  if(choice && symKey==='cacao_negro'){
   choice.detail='Bacillus amyloliquefaciens es una alternativa biológica para evaluar dentro del manejo de Phytophthora en cacao. Se enfoca en proteger el tejido sano, no en recuperar mazorcas podridas.';
   choice.tag='ALTERNATIVA BIOLÓGICA COMPLEMENTARIA PARA MAZORCA NEGRA';
  }
  if(choice && symKey==='cacao_blanco'){
   choice.detail='Bacillus amyloliquefaciens o Bacillus subtilis, según el programa de prevención y manejo de moniliasis.';
  }
  if(choice && selectedLine==='INSECTA' && symKey==='banano_picudo'){
   choice.detail='Metarhizium anisopliae o Beauveria bassiana son alternativas a valorar contra el picudo negro; requieren estrategias para alcanzar al insecto.';
  }
  if(choice && selectedLine==='TRICHO'){
   choice.detail='Trichoderma spp. como complemento del manejo radicular y del suelo, una vez identificada la causa del daño.';
  }

  // Personalizar las metas al problema seleccionado; no equivale a prometer eficacia del producto.
  const caseOutcomes={
   cacao_blanco:['Proteger mejor las mazorcas que aún están sanas mediante un plan preventivo.','Reducir la presión de la moniliasis combinando vigilancia, retiro de frutos afectados y herramientas biológicas compatibles.','Dar seguimiento a la producción nueva para conservar una mayor proporción de frutos aprovechables.'],
   cacao_negro:['Priorizar la protección de las mazorcas que todavía no muestran daños.','Reducir condiciones que favorecen nuevas pudriciones con un manejo más dirigido.','Conservar más frutos sanos en el siguiente ciclo, si el manejo integrado resulta efectivo.'],
   cacao_escoba:['Identificar nuevos brotes anormales a tiempo para actuar antes de que avance el problema.','Disminuir la presión de la enfermedad con seguimiento y herramientas de manejo integrado.','Favorecer el desarrollo de brotes nuevos mejor cuidados.'],
   cafe_broca:['Actuar de forma más dirigida sobre el insecto que perfora las cerezas.','Buscar menos cerezas nuevas afectadas con una estrategia de control adaptada a la plaga.','Proteger la calidad de los frutos sanos mediante monitoreo oportuno.'],
   cacao_hojas_insectos:['Dirigir el manejo hacia las larvas o insectos que están comiendo las hojas.','Buscar menos perforaciones nuevas en las hojas cuando la plaga sea susceptible.','Ayudar a que el crecimiento nuevo conserve mayor área foliar sana.'],
   maiz_oruga:['Enfocar el manejo en las larvas presentes en el cogollo del maíz.','Buscar menor daño nuevo en hojas y cogollos cuando se use una formulación apropiada.','Cuidar el crecimiento de la planta durante las siguientes etapas.'],
   cacao_raices:['Favorecer la formación de raíces más activas en la zona del suelo.','Ayudar a crear condiciones para una mejor absorción de agua y nutrientes.','Dar seguimiento al vigor de la planta conforme se estabilice el sistema radicular.'],
   tomate_mosca_blanca:['Buscar menor presencia de mosca blanca en los brotes y hojas nuevas con el manejo adecuado.','Proteger mejor el follaje nuevo y reducir el daño de los insectos susceptibles.','Dar seguimiento al envés de las hojas para detectar reinfestaciones a tiempo.'],
   aji_pulgones:['Buscar menor presión de pulgones en brotes tiernos si la formulación es apropiada.','Favorecer la formación de brotes nuevos con menos daño por succión.','Verificar semanalmente hojas nuevas para detectar reinfestaciones.'],
   banano_sigatoka:['Reducir el avance de nuevas manchas en hojas funcionales con un manejo más dirigido.','Conservar mayor área foliar sana para sostener el llenado del racimo.','Dar seguimiento al rebrote nuevo para verificar una mejor respuesta del cultivo.'],
   banano_picudo:['Reducir la presión del picudo negro en la plantación mediante un manejo más dirigido.','Proteger mejor la base de las plantas y disminuir el avance del daño interno.','Dar seguimiento a nuevas perforaciones o galerías para actuar a tiempo.'],
   banano_marchitez:['Recuperar gradualmente el vigor del cultivo si se corrige la causa principal del decaimiento.','Proteger las plantas sanas cercanas con un manejo oportuno y mejor seguimiento.','Tener una orientación más clara sobre el siguiente paso a tomar en campo.']
  };
  // v5.3.0 — Priorizar una formulación para conversar con el asesor, sin prescribirla por una fotografía.
  const specificFormulations={
   maiz_oruga:{name:'Bacillus thuringiensis',why:'Primera formulación a evaluar cuando se confirme una larva susceptible en el cogollo.'},
   cafe_broca:{name:'Beauveria bassiana',why:'Alternativa que el asesor puede evaluar si se confirma broca del café y las condiciones de aplicación son apropiadas.'},
   cana_barrenador:{name:'Bacillus thuringiensis',why:'Evaluar solamente si se confirma una larva susceptible y el momento de aplicación permite alcanzarla.'},
   tomate_mosca_blanca:{name:'Beauveria bassiana o Metarhizium anisopliae',why:'La línea INSECTA puede valorarse si la plaga y la formulación son apropiadas; no se presume eficacia de la formulación GALYON sin validación.'},
   aji_pulgones:{name:'Beauveria bassiana',why:'Formulación para evaluar únicamente después de comprobar que la cepa comercial es apropiada para el áfido identificado.'}
  };
  // Mostramos la formulación concreta solo cuando el síntoma permite sugerir una candidata.
  const cultivoFormulacion={
   cacao_negro:['Bacillus amyloliquefaciens','Se puede evaluar como complemento preventivo frente a Phytophthora.'],
   cacao_blanco:['Bacillus amyloliquefaciens','Para valorar en un manejo preventivo de moniliasis.'],
   cacao_escoba:['Bacillus amyloliquefaciens','Solo como apoyo preventivo; se requiere confirmar el diagnóstico.'],
   banano_sigatoka:['Bacillus subtilis','Alternativa complementaria que requiere una evaluación del manejo foliar.'],
   cafe_roya:['Bacillus subtilis','Se puede considerar como complemento de un programa de manejo de roya.'],
   cana_roya:['Bacillus subtilis','Apoyo biológico complementario si se confirma la enfermedad.'],
   maiz_roya:['Bacillus subtilis','Alternativa a evaluar para manejo preventivo foliar.'],
   hort_blanco:['Bacillus subtilis','Opción que el asesor puede valorar para el problema fúngico observado.'],
   flores_oidio:['Bacillus subtilis','Alternativa complementaria frente al oídio, con diagnóstico previo.'],
   cacao_raices:['Trichoderma spp.','Apoyo a la zona radicular; es necesario identificar la causa del daño.'],
   banano_raices:['Trichoderma spp.','Apoyo biológico radicular una vez evaluada la causa.'],
   banano_tallo:['Trichoderma spp.','El daño interno requiere evaluación; puede no ser susceptible al hongo.'],
   maiz_tallo:['Trichoderma spp.','Solo como complemento del manejo del suelo tras identificar el problema.'],
   banano_picudo:['Metarhizium anisopliae','Alternativa a valorar contra el picudo negro mediante manejo dirigido.'],
   cacao_hojas_insectos:['Bacillus thuringiensis','Solo si se identifican larvas masticadoras susceptibles.'],
   cacao_insecto:['Metarhizium anisopliae','Alternativa a valorar según la especie de insecto observada.']
  };
  const byCase=cultivoFormulacion[symKey];
  if(choice && byCase){
   choice.formulation=byCase[0];
   choice.detail='Formulación a evaluar: '+byCase[0]+'. '+byCase[1];
  }
  if(choice && selectedLine==='INSECTA'){
   const formulation=specificFormulations[symKey];
   if(formulation){choice.formulation=formulation.name;choice.detail='Formulación a evaluar: '+formulation.name+'. '+formulation.why;}else if(!choice.formulation){choice.detail='Identifica primero el insecto. Evaluaremos Bacillus thuringiensis, Beauveria bassiana o Metarhizium anisopliae según la plaga y su susceptibilidad.';}
  }
  if(choice&&caseOutcomes[symKey])choice.outcomes=caseOutcomes[symKey];
  if(choice){
   const candidates=Object.values(advisorProductCatalog).filter(product=>product.line===choice.name);
   const matched=candidates.filter(product=>(choice.formulation||'').includes(product.microbe));
   choice.multipleProducts=(matched.length||candidates.length)>1;
  }
  let contextTip='Envía fotografías claras de la parte afectada y explica desde cuándo notas el problema.';
  if(symKey==='papaya_anillos' || symKey==='papaya_mosaico')contextTip='Las manchas anulares junto con mosaico sugieren un virus. Ninguno de nuestros bioinsumos elimina una infección viral establecida; solicita orientación para confirmar la causa y proteger plantas sanas.';
  else if(symKey==='chirimoya_antracnosis')contextTip='Fotografía frutos afectados y sanos. Diferencia lesión por enfermedad de golpes o daño por frío antes de decidir una aplicación.';
  else if(symKey==='maracuya_roña' || symKey==='maracuya_mancha_bacteriana')contextTip='Registra si el daño se encuentra en hojas y frutos, y desde cuándo comenzó; una evaluación del cultivo permite definir medidas específicas.';
  else if(symKey==='cacao_blanco')contextTip='Retira las mazorcas muy afectadas siguiendo un manejo sanitario adecuado; consulta cómo proteger las próximas mazorcas.';
  else if(symKey==='cacao_negro')contextTip='Revisa drenaje y humedad; el manejo preventivo debe centrarse en proteger mazorcas aún sanas.';
  else if(insectCase)contextTip='Busca el insecto o larva y, si es posible, toma una fotografía para seleccionar el microorganismo adecuado.';
  else if(rootsCase)contextTip='Revisa humedad y condición del suelo: los síntomas de raíz también pueden tener causas no infecciosas.';
  const selectedVisual=visualFor(symptom,'symptoms');
  const symptomsPhoto=selectedVisual?.image?p(selectedVisual.image):null;
  const cropReference=[...farmCrops,...gardenCrops].find(x=>x.key===data.crop)?.image||'';
  const displayPhoto=symptomsPhoto||(cropReference?p(cropReference):null);
  const isSymptomPhoto=Boolean(symptomsPhoto);
  const isSyntheticReference=Boolean(selectedVisual?.referenceImage || (selectedVisual?.image && /^v53[234]_/.test(selectedVisual.image)));
  const isAdvisorConsultation=symKey==='otro';
  const agent=agentForResult();
  const imageBlock=agent?agentImageBlock(agent):displayPhoto?'<div class="advisor-evidence-image"><img src="'+e(displayPhoto)+'" alt="'+e(isAdvisorConsultation?'Asesor conversando con un agricultor para orientarlo':'Imagen de referencia de '+symptomName)+'" loading="lazy" decoding="async"><span class="advisor-evidence-tag">'+ (isAdvisorConsultation?'ASESORÍA PERSONALIZADA':isSyntheticReference?'ILUSTRACIÓN DE REFERENCIA':isSymptomPhoto?'FOTO DE REFERENCIA':'IMAGEN DEL CULTIVO') +'</span></div>':'';
  const confirmation='<small class="advisor-confirmation-note">Evaluación visual orientativa. Para confirmar el agente causal se necesita revisar la planta y, si corresponde, realizar análisis fitopatológicos.</small>';
  const badge=probable
   ? '<div class="advisor-problem-label">'+(probable.level==='alto'?'ES MUY PROBABLE QUE SEA':'LO MÁS PROBABLE ES')+'</div><h4>'+e(probable.name)+'</h4>'+confirmation
   : possible
    ? '<div class="advisor-problem-label">CAUSA A INVESTIGAR</div><h4>'+e(possible)+'</h4>'+confirmation
    : '<div class="advisor-problem-label">LO QUE OBSERVAS</div><h4>'+e(symptomName)+'</h4><small class="advisor-confirmation-note">Estos signos son comunes a varias causas. Necesitamos un detalle adicional para nombrar la más probable.</small>';
  const results=choice?'<div class="advisor-solution"><div class="advisor-solution-heading"><span>UNA LÍNEA GALYON PARA TU CASO</span><h4>Tu posible aliado: <strong>'+e(choice.name)+'</strong></h4></div><div class="advisor-product'+(choice.multipleProducts?' has-variants':'')+'">'+advisorProductPhotos(choice.name,choice.formulation)+'<div class="advisor-product-copy"><span>'+e(choice.tag)+'</span><h5>'+e(choice.formulation||choice.name)+'</h5><p class="advisor-formulation-line">'+e(choice.name)+'</p><p>'+e(choice.detail)+'</p><a href="'+e(toNavAnchor(choice.anchor))+'" class="advisor-line-link">Conocer esta línea →</a></div></div></div><div class="advisor-outcomes advisor-outcomes-new"><h4>¿Qué resultados puedes esperar?</h4><div class="advisor-outcome-cards">'+choice.outcomes.map((t,i)=>'<div class="advisor-outcome-card"><span class="advisor-outcome-index">'+('0'+(i+1))+'</span><p>'+e(t)+'</p></div>').join('')+'</div><small>Son objetivos de manejo, no resultados garantizados. La eficacia depende de la cepa, formulación, aplicación y condiciones del cultivo.</small></div>':'<div class="advisor-next"><span class="advisor-result-label">PRIMERO, ENTENDAMOS EL PROBLEMA</span><strong>La alternativa correcta depende de lo que esté ocurriendo.</strong><p>Con la información disponible no sería responsable recomendar una formulación todavía. Un asesor GALYON puede revisar tus fotos y ayudarte a elegir entre TRICHO, BACT e INSECTA según corresponda.</p></div>';
  const message='Hola, GALYON. Completé el Asesor de Cultivos. Lugar: '+data.area+'. Cultivo: '+data.crop+'. Parte afectada: '+(partsForCrop().find(x=>x.key===data.part)?.text||data.part)+'. Síntomas: '+symptomName+'.'+(probable?' Lo más probable según los signos: '+probable.name+' (pendiente de confirmar).':(possible?' Causa a investigar: '+possible+'.':''))+(choice?' Quisiera evaluar '+choice.name+(choice.formulation?' ('+choice.formulation+' como posibilidad)':'')+' y la formulación apropiada.':' Necesito que me recomienden una formulación después de revisar el caso.')+' ¿Qué fotografías o datos adicionales necesitan para mi asesoría gratuita?';
  return '<div class="advisor-result-v523"><div class="advisor-result-hero"><div><span class="advisor-result-label">RESULTADO DE TU CONSULTA</span><h3>Un camino más claro para cuidar tu cultivo.</h3><p>Revisamos lo que seleccionaste y te mostramos el siguiente paso.</p></div></div><div class="advisor-summary"><span><b>Cultivo</b>'+e(data.crop)+'</span><span><b>Parte afectada</b>'+e(partsForCrop().find(x=>x.key===data.part)?.text||data.part)+'</span><span><b>Síntoma seleccionado</b>'+e(symptomName)+'</span></div><div class="advisor-evidence'+(!imageBlock?' is-text-only':'')+'">'+imageBlock+'<div class="advisor-evidence-copy">'+badge+'<p>'+e(guidance)+'</p></div></div>'+results+'<div class="advisor-tip"><div><strong>Un consejo para comenzar</strong><p>'+e(contextTip)+'</p></div></div><a class="advisor-cta advisor-cta-v523" href="https://wa.me/593968933445?text='+encodeURIComponent(message)+'" target="_blank" rel="noopener"><span>Consulta gratis con un asesor</span><span aria-hidden="true">→</span></a><p class="advisor-caution">Es una orientación basada en los síntomas seleccionados; para confirmar la causa se requiere evaluación técnica y, cuando corresponda, análisis de laboratorio. Las imágenes generadas son ilustrativas, no pruebas diagnósticas ni fotografías clínicas verificadas; el producto debe validarse para el caso concreto.</p></div>';
 }

 function render(){
  const totalSteps=ENABLE_GARDEN_MODE?4:3;
  const visibleStep=step-firstStep;
  label.textContent=step===4?'Tu orientación inicial':`Paso ${visibleStep+1} de ${totalSteps}`;
  root.dataset.advisorTotalSteps=String(totalSteps);
  [...progress.children].forEach((el,i)=>{el.hidden=i>=totalSteps;el.classList.toggle('is-active',i<=Math.min(visibleStep,totalSteps-1));});
  back.hidden=step===firstStep||step===4;
  restart.hidden=step===firstStep;
  root.dataset.advisorStep=String(step);
  root.dataset.advisorCrop=data.crop;
  if(step===0){
   content.innerHTML='<h3>¿Dónde tienes tus cultivos?</h3><p class="advisor-desc">Escoge el espacio que más se parece al tuyo.</p>'+grid([
    a('Finca o plantación','Finca o plantación','finca','Cultivos de producción'),
    a('Huerto o jardín','Huerto o jardín','huerto-familia','Flores, frutales y plantas de casa')
   ],'places');
  }else if(step===1){
   const garden=data.area==='Huerto o jardín';
   content.innerHTML='<h3>¿Qué cultivo tienes?</h3><p class="advisor-desc">Selecciona tu planta para mostrar problemas frecuentes y ayudarte a describirlos.</p>'+grid(garden?gardenCrops:farmCrops.map(crop=>({...crop,image:farmCropCovers[crop.key]||crop.image})),'crops');
  }else if(step===2){
   content.innerHTML='<h3>¿Dónde observas el problema?</h3><p class="advisor-desc">Selecciona la parte donde se nota más el daño de tu '+e(data.crop.toLowerCase())+'.</p>'+grid(partsForCrop(),'parts');
  }else if(step===3){
   const options=chooseSymptoms();
   const specific=Boolean(catalog[data.crop]||tailoredCrops[data.crop]);
   content.innerHTML='<h3>¿Qué problema se parece al tuyo?</h3><p class="advisor-desc">'+(specific?'Elige lo que observas en '+e(data.crop.toLowerCase())+'.':'Todavía no tenemos síntomas fotografiados específicamente para '+e(data.crop.toLowerCase())+'. Puedes describir tu problema con estas opciones generales.')+' Las imágenes son de referencia: compara los signos visibles y elige la opción más parecida.</p>'+grid(options,'symptoms');
  }else content.innerHTML=result();
 }
 // Si falla una imagen, mostramos una tarjeta limpia en lugar del icono roto del navegador.
 root.addEventListener('error',ev=>{
  const image=ev.target;
  if(!(image instanceof HTMLImageElement))return;
  const card=image.closest('.advisor-option');
  if(card){
   const placeholder=document.createElement('span');
   placeholder.className='advisor-no-photo';
   placeholder.setAttribute('aria-hidden','true');
   placeholder.innerHTML='<svg viewBox="0 0 48 48"><path d="M12 36c15 0 25-11 25-26-14 0-26 9-26 26Z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M15 32 34 15" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>';
   image.replaceWith(placeholder);
   card.classList.add('is-text');
  }else{
   const frame=image.closest('.advisor-evidence-image, .advisor-product-photo, .advisor-catalog-variant');
   if(frame){
    const tag=frame.querySelector('.advisor-evidence-tag');
    if(tag)tag.remove();
    image.remove();
    if(!frame.querySelector('.advisor-image-unavailable')){
     const notice=document.createElement('span');
     notice.className='advisor-image-unavailable';
     notice.textContent='Fotografía no disponible';
     frame.appendChild(notice);
    }
   }
  }
 },true);
 root.addEventListener('click',ev=>{
  const btn=ev.target.closest('[data-advisor-value]');if(!btn||!root.contains(btn)||step>3)return;
  data[fields[step]]=btn.dataset.advisorValue;
  fields.slice(step+1).forEach(f=>data[f]='');
  step=Math.min(step+1,4);
  renderWithoutJump();
 });
 function renderWithoutJump(){
  // Keep the advisor header visible on every step. Replacing a tall card grid with
  // a short one can otherwise force the browser to clamp scroll into the products.
  // Position by document coordinates rather than relying on scroll anchoring.
  render();
  const headerOffset=(document.querySelector?.('.header')?.getBoundingClientRect().height||74)+16;
  const keepAdvisorTop=()=>{
   const absoluteTop=window.scrollY+root.getBoundingClientRect().top;
   window.scrollTo({top:Math.max(0,absoluteTop-headerOffset),left:0,behavior:'instant'});
  };
  keepAdvisorTop();
  requestAnimationFrame(keepAdvisorTop);
  // Images change layout after loading in some browsers; keep the wizard anchored.
  content.querySelectorAll('img').forEach(image=>{
   if(!image.complete) image.addEventListener('load',keepAdvisorTop,{once:true});
  });
 }
 back.addEventListener('click',ev=>{ev.preventDefault();step=Math.max(firstStep,step-1);renderWithoutJump();});
 restart.addEventListener('click',ev=>{ev.preventDefault();step=firstStep;fields.forEach(f=>data[f]='');data.area=ENABLE_GARDEN_MODE?'':'Finca o plantación';renderWithoutJump();});
 render();
})();


// Video Background Seamless Loop Controller (Sin parpadeos grises, loop fluido continuo)
(function initGlobalDynamicBackgroundVideo() {
  const video = document.getElementById('hero-video');
  if (!video) return;

  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.style.opacity = '1';

  function playVideo() {
    if (video.paused) {
      video.play().catch(function() {
        function userResume() {
          video.play().catch(function() {});
          window.removeEventListener('click', userResume);
          window.removeEventListener('touchstart', userResume);
          window.removeEventListener('scroll', userResume);
        }
        window.addEventListener('click', userResume, { once: true });
        window.addEventListener('touchstart', userResume, { once: true });
        window.addEventListener('scroll', userResume, { once: true });
      });
    }
  }

  // Loop continuo inmediato sin modificar opacidad si el navegador llegara al fin
  video.addEventListener('ended', function() {
    video.currentTime = 0;
    playVideo();
  });

  video.addEventListener('loadeddata', playVideo);
  video.addEventListener('canplay', playVideo);

  if (video.readyState >= 2) {
    playVideo();
  } else {
    playVideo();
  }
})();
