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
})();
