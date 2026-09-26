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

/*
  Escena ligada al scroll: publica el avance (0 → 1) en --p mientras la sección cruza la pantalla.
  Cada [data-scene-item] recibe --vis (0 oculto, 1 visible) y --dir (-1 por llegar, 1 ya pasado)
  según su tramo dentro de [data-start, data-end]. Con data-steps, el host recibe --step y cada
  [data-step-item] los atributos data-reached / data-current. Los [data-scene-count] cuentan desde 0
  hasta su propio texto entre data-count-from y data-count-to. Un [data-scene-track] publica en --shift
  cuánto sobresale en horizontal. El CSS decide cómo se ve cada estado.
*/
if (!customElements.get('ehora-scroll-scene')) {
  customElements.define(
    'ehora-scroll-scene',
    class EhoraScrollScene extends HTMLElement {
      connectedCallback() {
        this.items = [...this.querySelectorAll('[data-scene-item]')];
        this.start = parseFloat(this.dataset.start) || 0;
        this.end = parseFloat(this.dataset.end) || 1;
        this.hold = parseFloat(this.dataset.hold ?? 0.5);
        this.edge = parseFloat(this.dataset.edge ?? 0.5);
        this.keepFirst = this.hasAttribute('data-keep-first');
        this.keepLast = this.hasAttribute('data-keep-last');

        this.stepItems = [...this.querySelectorAll('[data-step-item]')];
        this.counters = [...this.querySelectorAll('[data-scene-count]')];
        this.counters.forEach((counter) => {
          counter.target = parseFloat(counter.textContent.replace(',', '.')) || 0;
          counter.decimals = (counter.textContent.split(/[.,]/)[1] || '').length;
        });

        this.track = this.querySelector('[data-scene-track]');
        if (this.track) {
          this.measure = () => this.style.setProperty('--shift', `${Math.max(this.track.scrollWidth - this.clientWidth, 0)}px`);
          this.measure();
          window.addEventListener('resize', this.measure, { passive: true });
        }

        this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.classList.add('is-ready');
        this.classList.toggle('is-reduced', this.reduced);

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
        if (this.measure) window.removeEventListener('resize', this.measure);
      }

      update() {
        const rect = this.getBoundingClientRect();
        const travel = this.offsetHeight - window.innerHeight;
        const progress = travel > 0 ? Math.min(Math.max(-rect.top / travel, 0), 1) : 1;
        this.style.setProperty('--p', progress.toFixed(4));

        const span = Math.min(Math.max((progress - this.start) / (this.end - this.start), 0), 1);
        const steps = parseInt(this.dataset.steps, 10);
        if (steps) {
          const step = Math.min(Math.floor(span * steps), steps - 1);
          this.style.setProperty('--step', step);
          this.stepItems.forEach((item, position) => {
            const index = item.dataset.stepItem ? parseInt(item.dataset.stepItem, 10) : position;
            item.toggleAttribute('data-reached', index < step);
            item.toggleAttribute('data-current', index === step - 1);
          });
        }

        this.counters.forEach((counter) => {
          const from = parseFloat(counter.dataset.countFrom) || 0;
          const to = parseFloat(counter.dataset.countTo) || 1;
          const t = this.reduced ? 1 : Math.min(Math.max((progress - from) / (to - from), 0), 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const value = (counter.target * eased).toFixed(counter.decimals);
          if (counter.textContent !== value) counter.textContent = value;
        });

        const count = this.items.length;
        if (!count) return;
        const local = span * count;
        const fade = Math.max(this.edge - this.hold / 2, 0.001);

        this.items.forEach((item, index) => {
          let offset = local - index - 0.5;
          if (this.keepFirst && index === 0 && offset < 0) offset = 0;
          if (this.keepLast && index === count - 1 && offset > 0) offset = 0;
          const vis = Math.min(Math.max((this.edge - Math.abs(offset)) / fade, 0), 1);
          item.style.setProperty('--vis', vis.toFixed(3));
          item.style.setProperty('--dir', offset < 0 ? -1 : 1);
          item.toggleAttribute('data-active', vis > 0.5);
        });
      }
    }
  );
}

if (!customElements.get('ehora-buy-bar')) {
  customElements.define(
    'ehora-buy-bar',
    class EhoraBuyBar extends HTMLElement {
      connectedCallback() {
        this.hidden = false;
        this.offset = (parseFloat(this.dataset.offset) || 40) / 100;
        this.footerVisible = false;

        const footer = document.querySelector('footer, .footer');
        if (footer && 'IntersectionObserver' in window) {
          this.observer = new IntersectionObserver(([entry]) => {
            this.footerVisible = entry.isIntersecting;
            this.update();
          });
          this.observer.observe(footer);
        }

        this.onScroll = () => requestAnimationFrame(() => this.update());
        window.addEventListener('scroll', this.onScroll, { passive: true });
        this.update();
      }

      disconnectedCallback() {
        window.removeEventListener('scroll', this.onScroll);
        this.observer?.disconnect();
      }

      update() {
        const show = window.scrollY > window.innerHeight * this.offset && !this.footerVisible;
        this.classList.toggle('is-visible', show);
        this.querySelector('a')?.setAttribute('tabindex', show ? '0' : '-1');
      }
    }
  );
}
