if (!customElements.get('ehora-sticky-gallery')) {
  customElements.define(
    'ehora-sticky-gallery',
    class EhoraStickyGallery extends HTMLElement {
      connectedCallback() {
        this.steps = [...this.querySelectorAll('.ehora-gallery__step')];
        this.images = [...this.querySelectorAll('.ehora-gallery__img')];
        if (!this.steps.length || !('IntersectionObserver' in window)) return;

        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) this.activate(entry.target.dataset.index);
            });
          },
          { rootMargin: '-45% 0px -45% 0px' }
        );
        this.steps.forEach((step) => this.observer.observe(step));
      }

      disconnectedCallback() {
        this.observer?.disconnect();
      }

      activate(index) {
        [...this.steps, ...this.images].forEach((el) => el.classList.toggle('is-active', el.dataset.index === index));
      }
    }
  );
}

if (!customElements.get('ehora-scroll-expand')) {
  customElements.define(
    'ehora-scroll-expand',
    class EhoraScrollExpand extends HTMLElement {
      connectedCallback() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          this.style.setProperty('--p', 1);
          this.classList.add('is-static');
          return;
        }
        this.ticking = false;
        this.onScroll = () => {
          if (this.ticking) return;
          this.ticking = true;
          requestAnimationFrame(() => {
            this.update();
            this.ticking = false;
          });
        };
        window.addEventListener('scroll', this.onScroll, { passive: true });
        window.addEventListener('resize', this.onScroll, { passive: true });
        this.update();
      }

      disconnectedCallback() {
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('resize', this.onScroll);
      }

      update() {
        const rect = this.getBoundingClientRect();
        const travel = this.offsetHeight - window.innerHeight;
        const progress = travel > 0 ? Math.min(Math.max(-rect.top / travel, 0), 1) : 1;
        this.style.setProperty('--p', progress.toFixed(4));
        this.classList.toggle('is-expanded', progress > 0.85);
      }
    }
  );
}
