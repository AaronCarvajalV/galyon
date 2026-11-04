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
  'combo-cacao': {name:'GALYON CACAO TITÁN · 2 L TRICHO + 2 L BACT', line:'combo', image:'assets/linea-tricho.jpg', unit:70, unitLabel:'combo', sizeLabel:'4 litros'},
  'combo-mango': {name:'GALYON MANGO FURIOSO · 2 L BACT + 2 L INSECTA', line:'combo', image:'assets/linea-bact.jpg', unit:70, unitLabel:'combo', sizeLabel:'4 litros'},
  'combo-cana': {name:'GALYON CAÑA BRAVA · 2 L BACT + 2 L INSECTA', line:'combo', image:'assets/linea-insecta.jpg', unit:70, unitLabel:'combo', sizeLabel:'4 litros'},
  'combo-banano': {name:'GALYON VERDE BESTIA · 2 L TRICHO + 2 L BACT', line:'combo', image:'assets/linea-tricho.jpg', unit:70, unitLabel:'combo', sizeLabel:'4 litros'}
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
function subtotal(){return Object.entries(cart).reduce((sum,[sku,qty])=>sum+(PRODUCTS[sku]?.unit || 0)*qty,0)}
function total(){return subtotal()}
function money(n){return '$'+n.toFixed(2).replace('.00','')}
function shippingCategory(){
 const skus=Object.keys(cart).filter(sku=>PRODUCTS[sku] && cart[sku]>0);
 const combos=skus.some(sku=>sku.startsWith('combo-'));
 const singles=skus.some(sku=>!sku.startsWith('combo-'));
 if(combos && !singles) return 'Envío gratis en combos GALYON (Ecuador)';
 if(combos && singles) return 'Envío gratis en combos; otros productos: costo por confirmar';
 return 'Costo de envío por confirmar según destino';
}
function shippingShort(){
 const status=shippingCategory();
 if(status.startsWith('Envío gratis en combos GALYON'))return 'GRATIS';
 if(status.startsWith('Envío gratis en combos;'))return 'Gratis en combos';
 return 'Por confirmar';
}
function toast(message){const el=$('toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2700)}
function city(){return $('ship-city')?.value.trim()||''}
function checkoutText(){
 const rows=Object.entries(cart).filter(([sku,qty])=>PRODUCTS[sku] && qty>0).map(([sku,qty])=>{const p=PRODUCTS[sku];const unit=p.unitLabel||'unidad';const unitText=qty===1?unit:unit+'s';return `• ${qty} ${unitText} de ${p.name} — ${money(qty*p.unit)}`;}).join('\n');

 return `¡Hola, GALYON! Quisiera solicitar estos productos:

${rows}

Subtotal de productos: ${money(subtotal())}
Envío: ${shippingCategory()}
Total estimado de productos: ${money(total())}${city()?'\nCiudad o cantón: '+city():''}

¿Me confirman disponibilidad, métodos de pago y, si hay productos individuales, su costo de envío?`;
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
 $('cart-items').innerHTML=Object.entries(cart).filter(([sku,qty])=>PRODUCTS[sku]&&qty>0).map(([sku,qty])=>{
  const p=PRODUCTS[sku];
  return `<div class="cart-item"><img src="${p.image}" alt="Productos de la línea ${p.line}" loading="lazy"><div class="cart-item-main"><strong>${p.name}</strong><small>${p.sizeLabel||'1 litro'} por unidad · ${money(p.unit)}</small><div class="qty"><button type="button" data-change="${sku}" data-delta="-1" aria-label="Restar una unidad de ${p.name}">−</button><span aria-label="${qty} unidades">${qty}</span><button type="button" data-change="${sku}" data-delta="1" aria-label="Añadir una unidad de ${p.name}">+</button></div></div><span class="cart-item-price">${money(p.unit*qty)}</span></div>`;
 }).join('');
 $('cart-total').textContent=money(total());
 const deal=$('deal-status'); if(deal) deal.textContent=shippingCategory();
 const calc=$('cart-breakdown');
 if(calc) calc.innerHTML=`<span>Subtotal de productos</span><strong>${money(subtotal())}</strong><span>Envío</span><strong>${shippingShort()}</strong>`;
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
 a.classList.add('was-added');
 a.textContent='Añadido';
 setTimeout(()=>{a.classList.remove('was-added');a.textContent='+ Añadir'},1100);
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
menu.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open))});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false')}));
$('year').textContent=new Date().getFullYear();
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
 const data={area:'',crop:'',part:'',symptom:''};
 let step=0;
 const p=key=>'assets/asesor/'+key+'.webp';
 const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const a=(key,text,image='',sub='',possible='',guidance='',line='')=>({key,text,image,sub,possible,guidance,line});
 const farmCrops=[
  a('Cacao','Cacao','cacao'),a('Banano','Banano','banano'),a('Maíz','Maíz','maiz'),
  a('Mango','Mango','v537_mango_arbol'),a('Caña de azúcar','Caña de azúcar','cana'),a('Café','Café','cafe'),
  a('Aguacate','Aguacate','v537_aguacate_arbol'),a('Hortalizas','Hortalizas','v522_jardin_hortalizas'),
  a('Otro cultivo','Otro cultivo','','Descríbenos tu cultivo')
 ];
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
  'Maíz':[['Toda la planta','v52_maiz_campo'],['Hojas','v522_maiz_hojas'],['Raíces o tallo','v52_maiz_planta_raices'],['Frutos o mazorcas','maiz']],
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
  'Maíz':[
    a('maiz_manchas','Manchas en hojas','maiz_manchas','Puntos o lesiones alargadas','','Observa si las lesiones aparecen primero en hojas inferiores o superiores.'),
    a('maiz_oruga','Larvas y daños en el cogollo','maiz_cogollero','Oruga visible, hojas perforadas y excrementos en el cogollo','Posible daño de insectos, incluida alimentación por orugas.','Si puedes fotografiar la larva, el asesor podrá valorar una formulación para la plaga identificada.','INSECTA'),
    a('maiz_tallo','Tallo deteriorado','maiz_tallo','Zonas oscuras o lesiones','','Una fotografía del tallo y de la planta entera ayuda a diferenciar causas.'),
    a('maiz_roya','Pústulas anaranjadas','maiz_roya','Pequeñas lesiones de color óxido','Síntomas compatibles con roya, entre otras afecciones.','Compara varias hojas afectadas; se necesita una evaluación para confirmar la causa.'),unknown
  ],
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
  return '<button type="button" class="advisor-option'+(!item.image?' is-text':'')+'" data-advisor-value="'+e(item.key)+'">'+image+'<span class="advisor-option-text"><strong>'+e(item.text)+'</strong>'+(item.sub?'<small>'+e(item.sub)+'</small>':'')+'</span></button>';
 }
 function grid(items,kind=''){return '<div class="advisor-options '+(kind?'advisor-options-'+kind:'')+'">'+items.map(option).join('')+'</div>';}
 const organSymptomKeys={
  'Banano':{'Toda la planta':['banano_marchitez'], 'Hojas':['banano_sigatoka'], 'Raíces o tallo':['banano_tallo','banano_raices','banano_picudo'], 'Frutos o mazorcas':[]},
  'Maíz':{'Toda la planta':['maiz_manchas','maiz_oruga','maiz_tallo'], 'Hojas':['maiz_manchas','maiz_oruga','maiz_roya'], 'Raíces o tallo':['maiz_tallo'], 'Frutos o mazorcas':[]},
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
  if(data.part==='Frutos o mazorcas' && data.crop==='Maíz')return [
   indicator('manchas','Granos con manchas','Decoloración o granos con puntos oscuros','Muestra una mazorca afectada y otra sana para orientar la evaluación.'),
   indicator('pudricion','Pudrición en la mazorca','Tejidos oscuros, húmedos o con recubrimiento','No se puede reconocer el agente causante sin revisar mejor la lesión.'),
   indicator('insectos','Mazorcas comidas o perforadas','Galerías, insectos o granos dañados','Una foto del insecto o larva ayuda a valorar una alternativa específica.','INSECTA'),
   indicator('deformes','Mazorcas poco desarrolladas','Granos incompletos o deformación','Revisar nutrición, polinización y estrés ambiental puede ser necesario.'),unknown
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
 function result(){
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
   INSECTA:{name:'GALYON INSECTA',image:'assets/linea-insecta.jpg',anchor:'#detalle-insecta',tag:'MANEJO BIOLÓGICO DE INSECTOS',detail:'Beauveria, Metarhizium o Bacillus thuringiensis, según la plaga identificada.',outcomes:['Un manejo más dirigido al insecto que está afectando tu cultivo.','Menor presión de insectos susceptibles cuando se utiliza la formulación adecuada.','Mejor protección del crecimiento nuevo mediante seguimiento y aplicaciones oportunas.']},
   TRICHO:{name:'GALYON TRICHO',image:'assets/linea-tricho.jpg',anchor:'#detalle-tricho',tag:'PROTECCIÓN BIOLÓGICA Y RAÍCES',detail:'Línea con Trichoderma spp. para considerar dentro de un manejo preventivo e integrado.',outcomes:['Condiciones más favorables para desarrollar raíces vigorosas.','Una estrategia biológica adicional frente a determinados hongos susceptibles, según la cepa.','Acompañamiento para cuidar el tejido nuevo y reducir riesgos futuros, sin recuperar tejido ya destruido.']},
   BACT:{name:'GALYON BACT',image:'assets/linea-bact.jpg',anchor:'#detalle-bact',tag:'VIGOR Y DESARROLLO VEGETAL',detail:'Bacillus subtilis o Bacillus amyloliquefaciens, con selección según la necesidad del cultivo.',outcomes:['Mejores condiciones para un crecimiento vegetal vigoroso.','Apoyo al desarrollo radicular y a la actividad biológica del entorno de la planta.','Un plan de aplicación y seguimiento ajustado a la respuesta del cultivo.']}
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
  let contextTip='Envía fotografías claras de la parte afectada y explica desde cuándo notas el problema.';
  if(symKey==='papaya_anillos' || symKey==='papaya_mosaico')contextTip='Las manchas anulares junto con mosaico sugieren un virus. Ninguno de nuestros bioinsumos elimina una infección viral establecida; solicita orientación para confirmar la causa y proteger plantas sanas.';
  else if(symKey==='chirimoya_antracnosis')contextTip='Fotografía frutos afectados y sanos. Diferencia lesión por enfermedad de golpes o daño por frío antes de decidir una aplicación.';
  else if(symKey==='maracuya_roña' || symKey==='maracuya_mancha_bacteriana')contextTip='Registra si el daño se encuentra en hojas y frutos, y desde cuándo comenzó; una evaluación del cultivo permite definir medidas específicas.';
  else if(symKey==='cacao_blanco')contextTip='Retira las mazorcas muy afectadas siguiendo un manejo sanitario adecuado; consulta cómo proteger las próximas mazorcas.';
  else if(symKey==='cacao_negro')contextTip='Revisa drenaje y humedad; el manejo preventivo debe centrarse en proteger mazorcas aún sanas.';
  else if(insectCase)contextTip='Busca el insecto o larva y, si es posible, toma una fotografía para seleccionar el microorganismo adecuado.';
  else if(rootsCase)contextTip='Revisa humedad y condición del suelo: los síntomas de raíz también pueden tener causas no infecciosas.';
  const symptomsPhoto=symptom?.image?p(symptom.image):null;
  const cropReference=[...farmCrops,...gardenCrops].find(x=>x.key===data.crop)?.image||'';
  const displayPhoto=symptomsPhoto||(cropReference?p(cropReference):null);
  const isSymptomPhoto=Boolean(symptomsPhoto);
  const isSyntheticReference=Boolean(symptom?.image && /^v53[234]_/.test(symptom.image));
  const isAdvisorConsultation=symKey==='otro';
  const imageBlock=displayPhoto?'<div class="advisor-evidence-image"><img src="'+e(displayPhoto)+'" alt="'+e(isAdvisorConsultation?'Asesor conversando con un agricultor para orientarlo':'Imagen de referencia de '+symptomName)+'" loading="lazy" decoding="async"><span class="advisor-evidence-tag">'+ (isAdvisorConsultation?'ASESORÍA PERSONALIZADA':isSyntheticReference?'ILUSTRACIÓN DE REFERENCIA':isSymptomPhoto?'FOTO DE REFERENCIA':'IMAGEN DEL CULTIVO') +'</span></div>':'';
  const confirmation='<small class="advisor-confirmation-note">Evaluación visual orientativa. Para confirmar el agente causal se necesita revisar la planta y, si corresponde, realizar análisis fitopatológicos.</small>';
  const badge=probable
   ? '<div class="advisor-problem-label">'+(probable.level==='alto'?'ES MUY PROBABLE QUE SEA':'LO MÁS PROBABLE ES')+'</div><h4>'+e(probable.name)+'</h4>'+confirmation
   : possible
    ? '<div class="advisor-problem-label">CAUSA A INVESTIGAR</div><h4>'+e(possible)+'</h4>'+confirmation
    : '<div class="advisor-problem-label">LO QUE OBSERVAS</div><h4>'+e(symptomName)+'</h4><small class="advisor-confirmation-note">Estos signos son comunes a varias causas. Necesitamos un detalle adicional para nombrar la más probable.</small>';
  const results=choice?'<div class="advisor-solution"><div class="advisor-solution-heading"><span>UNA LÍNEA GALYON PARA TU CASO</span><h4>Tu posible aliado: <strong>'+e(choice.name)+'</strong></h4></div><div class="advisor-product"><div class="advisor-product-photo"><img src="'+e(choice.image)+'" loading="lazy" decoding="async" alt="Presentación fotográfica de '+e(choice.name)+'"></div><div class="advisor-product-copy"><span>'+e(choice.tag)+'</span><h5>'+e(choice.formulation||choice.name)+'</h5><p class="advisor-formulation-line">'+e(choice.name)+'</p><p>'+e(choice.detail)+'</p><a href="'+e(choice.anchor)+'" class="advisor-line-link">Conocer esta línea →</a></div></div></div><div class="advisor-outcomes advisor-outcomes-new"><h4>¿Qué resultados puedes esperar?</h4><div class="advisor-outcome-cards">'+choice.outcomes.map((t,i)=>'<div class="advisor-outcome-card"><span class="advisor-outcome-index">'+('0'+(i+1))+'</span><p>'+e(t)+'</p></div>').join('')+'</div><small>Son objetivos de manejo, no resultados garantizados. La eficacia depende de la cepa, formulación, aplicación y condiciones del cultivo.</small></div>':'<div class="advisor-next"><span class="advisor-result-label">PRIMERO, ENTENDAMOS EL PROBLEMA</span><strong>La alternativa correcta depende de lo que esté ocurriendo.</strong><p>Con la información disponible no sería responsable recomendar una formulación todavía. Un asesor GALYON puede revisar tus fotos y ayudarte a elegir entre TRICHO, BACT e INSECTA según corresponda.</p></div>';
  const message='Hola, GALYON. Completé el Asesor de Cultivos. Lugar: '+data.area+'. Cultivo: '+data.crop+'. Parte afectada: '+(partsForCrop().find(x=>x.key===data.part)?.text||data.part)+'. Síntomas: '+symptomName+'.'+(probable?' Lo más probable según los signos: '+probable.name+' (pendiente de confirmar).':(possible?' Causa a investigar: '+possible+'.':''))+(choice?' Quisiera evaluar '+choice.name+(choice.formulation?' ('+choice.formulation+' como posibilidad)':'')+' y la formulación apropiada.':' Necesito que me recomienden una formulación después de revisar el caso.')+' ¿Qué fotografías o datos adicionales necesitan para mi asesoría gratuita?';
  return '<div class="advisor-result-v523"><div class="advisor-result-hero"><div><span class="advisor-result-label">RESULTADO DE TU CONSULTA</span><h3>Un camino más claro para cuidar tu cultivo.</h3><p>Revisamos lo que seleccionaste y te mostramos el siguiente paso.</p></div></div><div class="advisor-summary"><span><b>Cultivo</b>'+e(data.crop)+'</span><span><b>Parte afectada</b>'+e(partsForCrop().find(x=>x.key===data.part)?.text||data.part)+'</span><span><b>Síntoma seleccionado</b>'+e(symptomName)+'</span></div><div class="advisor-evidence'+(!imageBlock?' is-text-only':'')+'">'+imageBlock+'<div class="advisor-evidence-copy">'+badge+'<p>'+e(guidance)+'</p></div></div>'+results+'<div class="advisor-tip"><div><strong>Un consejo para comenzar</strong><p>'+e(contextTip)+'</p></div></div><a class="advisor-cta advisor-cta-v523" href="https://wa.me/593968933445?text='+encodeURIComponent(message)+'" target="_blank" rel="noopener"><span>Consulta gratis con un asesor</span><span aria-hidden="true">→</span></a><p class="advisor-caution">Es una orientación basada en los síntomas seleccionados; para confirmar la causa se requiere evaluación técnica y, cuando corresponda, análisis de laboratorio. Las imágenes generadas son ilustrativas, no pruebas diagnósticas ni fotografías clínicas verificadas; el producto debe validarse para el caso concreto.</p></div>';
 }

 function render(){
  label.textContent=step===4?'Tu orientación inicial':`Paso ${step+1} de 4`;
  [...progress.children].forEach((el,i)=>el.classList.toggle('is-active',i<=Math.min(step,3)));
  back.hidden=step===0||step===4;
  restart.hidden=step===0;
  root.dataset.advisorStep=String(step);
  if(step===0){
   content.innerHTML='<h3>¿Dónde tienes tus cultivos?</h3><p class="advisor-desc">Escoge el espacio que más se parece al tuyo.</p>'+grid([
    a('Finca o plantación','Finca o plantación','finca','Cultivos de producción'),
    a('Huerto o jardín','Huerto o jardín','huerto-familia','Flores, frutales y plantas de casa')
   ],'places');
  }else if(step===1){
   const garden=data.area==='Huerto o jardín';
   content.innerHTML='<h3>¿Qué cultivo tienes?</h3><p class="advisor-desc">Selecciona tu planta para mostrar problemas frecuentes y ayudarte a describirlos.</p>'+grid(garden?gardenCrops:farmCrops,'crops');
  }else if(step===2){
   content.innerHTML='<h3>¿Dónde observas el problema?</h3><p class="advisor-desc">Selecciona la parte donde se nota más el daño de tu '+e(data.crop.toLowerCase())+'.</p>'+grid(partsForCrop(),'parts');
  }else if(step===3){
   const options=chooseSymptoms();
   const specific=Boolean(catalog[data.crop]||tailoredCrops[data.crop]);
   content.innerHTML='<h3>¿Qué problema se parece al tuyo?</h3><p class="advisor-desc">'+(specific?'Elige lo que observas en '+e(data.crop.toLowerCase())+'.':'Todavía no tenemos síntomas fotografiados específicamente para '+e(data.crop.toLowerCase())+'. Puedes describir tu problema con estas opciones generales.')+' Las fotografías de síntomas son de referencia; donde no hay fotografía validada usamos iconos descriptivos, no diagnósticos.</p>'+grid(options,'symptoms');
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
   const frame=image.closest('.advisor-evidence-image, .advisor-product-photo');
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
  const headerOffset=90;
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
 back.addEventListener('click',ev=>{ev.preventDefault();step=Math.max(0,step-1);renderWithoutJump();});
 restart.addEventListener('click',ev=>{ev.preventDefault();step=0;fields.forEach(f=>data[f]='');renderWithoutJump();});
 render();
})();
