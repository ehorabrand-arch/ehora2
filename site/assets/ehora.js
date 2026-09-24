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
