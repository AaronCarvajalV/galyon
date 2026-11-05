'use strict';
// Un único reloj mantiene alineados problema, solución y objetivo del cultivo.
(()=>{
 const mobile=window.matchMedia('(max-width: 760px)');
 const about=document.querySelector('.intro-secondary');
 function syncAbout(){if(about)about.open=!mobile.matches;}
 syncAbout();mobile.addEventListener('change',syncAbout);
 const gallery=document.querySelector('.identity-gallery-steps');
 if(!gallery)return;
 const groups=[...gallery.querySelectorAll('.identity-sequence-slides')].map(group=>[...group.querySelectorAll('.identity-sequence-slide')]);
 if(!groups.length||groups.some(slides=>slides.length<2))return;
 const count=Math.min(...groups.map(slides=>slides.length));
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let current=0,timer=null,visible=false;
 function show(index){
  current=index%count;
  groups.forEach(slides=>slides.forEach((slide,i)=>{
   slide.classList.toggle('is-current',i===current);
   slide.setAttribute('aria-hidden',String(i!==current));
  }));
 }
 function schedule(){
  clearInterval(timer);timer=null;
  if(visible&&!document.hidden&&!motion.matches)timer=setInterval(()=>show(current+1),6000);
 }
 document.addEventListener('visibilitychange',schedule);
 motion.addEventListener('change',()=>{if(motion.matches)show(0);schedule();});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();}).observe(gallery);
 else visible=true;
 show(0);schedule();

 // --------------------------------------------------------------------------
 // CINEMÁTICA DE TÍTULOS Y DESVANECIMIENTO SUAVE (ESTILO STATEMENT & 3D INICIO)
 // --------------------------------------------------------------------------
 if (!motion.matches) {
  document.documentElement.classList.add('has-kinetic-motion');
 }

 function revealTitleChars(titleEl, startDelay = 80) {
  if (!titleEl || titleEl.dataset.hasRevealed) return;
  titleEl.dataset.hasRevealed = 'true';
  const chars = titleEl.querySelectorAll('.char');
  setTimeout(() => {
   chars.forEach((char, idx) => {
    setTimeout(() => {
     char.classList.add('is-revealed');
    }, idx * 22);
   });
  }, startDelay);
 }

 // 1. Showcase principal: activa título y desvanecimiento escalonado de las 4 tarjetas
 const showcase = document.querySelector('.galyon-showcase');
 if (showcase) {
  if ('IntersectionObserver' in window && !motion.matches) {
   const showcaseObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
     if (entry.isIntersecting) {
      revealTitleChars(document.getElementById('nosotrosShowcaseTitle'), 100);
      const photos = showcase.querySelectorAll('.identity-photo');
      photos.forEach(photo => photo.classList.add('is-revealed'));
      showcaseObserver.unobserve(entry.target);
     }
    });
   }, { threshold: 0.12 });
   showcaseObserver.observe(showcase);
  } else {
   revealTitleChars(document.getElementById('nosotrosShowcaseTitle'), 100);
   showcase.querySelectorAll('.identity-photo').forEach(p => p.classList.add('is-revealed'));
  }
 }

 // 2. Sección secundaria: activa titular de Quiénes Somos y desvanecimiento de intro-grid & métricas
 const introGrid = document.querySelector('#nosotros .intro-grid');
 const metrics = document.querySelector('#nosotros .metrics');
 if (introGrid) {
  if ('IntersectionObserver' in window && !motion.matches) {
   const introObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
     if (entry.isIntersecting) {
      revealTitleChars(document.getElementById('nosotrosIntroTitle'), 60);
      introGrid.classList.add('is-revealed');
      if (metrics) metrics.classList.add('is-revealed');
      introObserver.unobserve(entry.target);
     }
    });
   }, { threshold: 0.15 });
   introObserver.observe(introGrid);
  } else {
   revealTitleChars(document.getElementById('nosotrosIntroTitle'), 60);
   introGrid.classList.add('is-revealed');
   if (metrics) metrics.classList.add('is-revealed');
  }
 }
})();
