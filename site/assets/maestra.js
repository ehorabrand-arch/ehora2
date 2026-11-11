/* EHORA Maestra: galería por miniaturas y aparición única al entrar en pantalla. Sin JS, todo se ve tal cual. */
if (!customElements.get('em-gallery')) {
  customElements.define(
    'em-gallery',
    class EmGallery extends HTMLElement {
      connectedCallback() {
        this.images = [...this.querySelectorAll('.em-gallery__img')];
        this.thumbs = [...this.querySelectorAll('.em-gallery__thumb')];
        this.thumbs.forEach((thumb) => thumb.addEventListener('click', () => this.show(thumb.dataset.index)));
      }

      show(index) {
        this.images.forEach((img) => img.classList.toggle('is-active', img.dataset.index === index));
        this.thumbs.forEach((thumb) => thumb.setAttribute('aria-pressed', String(thumb.dataset.index === index)));
      }
    }
  );
}

(() => {
  if (window.emRevealReady) return;
  window.emRevealReady = true;
  const start = () => {
    const targets = [...document.querySelectorAll('[data-em-reveal]')];
    if (!targets.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35 }
    );
    targets.forEach((target) => {
      target.classList.add('em-anim');
      observer.observe(target);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
