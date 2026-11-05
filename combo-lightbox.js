/* v5.7.3 — Permite visualizar el banner de cada combo completo sin cortes. */
(function () {
  'use strict';
  const dialog = document.getElementById('combo-lightbox');
  const enlarged = document.getElementById('combo-lightbox-img');
  if (!dialog || !enlarged) return;
  const close = dialog.querySelector('.combo-lightbox-close');
  document.querySelectorAll('.combo-image-open[data-image]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      const thumb = button.querySelector('img');
      enlarged.src = button.dataset.image;
      enlarged.alt = thumb ? thumb.alt : 'Imagen del combo GALYON';
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open','');
    });
  });
  close.addEventListener('click', () => {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
})();
