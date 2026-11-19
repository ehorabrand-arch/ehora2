/* Galería por color: enseña solo las fotos del color elegido. */
(function () {
  if (customElements.get('ehora-gallery')) return;

  const norm = (text) =>
    String(text || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLowerCase();

  const parseList = (text) => {
    const out = [];
    String(text || '')
      .split(',')
      .forEach((part) => {
        const range = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
        if (range) {
          for (let n = Number(range[1]); n <= Number(range[2]); n++) out.push(n);
        } else if (/^\d+$/.test(part.trim())) {
          out.push(Number(part.trim()));
        }
      });
    return out;
  };

  class EhoraGallery extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('.eg__track');
      this.slides = Array.from(this.querySelectorAll('.eg__slide'));
      this.thumbItems = Array.from(this.querySelectorAll('.eg__thumb-item'));
      this.empty = this.querySelector('[data-eg-empty]');
      this.stage = this.querySelector('.eg__stage');
      this.currentEl = this.querySelector('[data-eg-current]');
      this.totalEl = this.querySelector('[data-eg-total]');
      this.map = {};
      this.fallback = null;
      String(this.dataset.map || '')
        .split(/\n/)
        .forEach((line) => {
          const at = line.indexOf(':');
          if (at < 1) return;
          const key = norm(line.slice(0, at));
          const list = parseList(line.slice(at + 1));
          if (key === '*') this.fallback = list;
          else this.map[key] = list;
        });

      this.querySelector('[data-eg-prev]').addEventListener('click', () => this.step(-1));
      this.querySelector('[data-eg-next]').addEventListener('click', () => this.step(1));
      this.thumbItems.forEach((item, i) => {
        const button = item.querySelector('.eg__thumb');
        if (button) button.addEventListener('click', () => this.goTo(this.visibleSlides().indexOf(this.slides[i])));
      });
      this.track.addEventListener('scroll', () => {
        window.cancelAnimationFrame(this.raf);
        this.raf = window.requestAnimationFrame(() => this.syncCounter());
      }, { passive: true });
      this.track.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); this.step(1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); this.step(-1); }
      });

      this.onChange = (event) => {
        const target = event.target;
        if (!target || !target.closest || !target.closest('variant-selects, fieldset, variant-radios')) return;
        if (norm(target.dataset && target.dataset.optionName) !== norm(this.dataset.option)) return;
        this.apply(target.value, true);
      };
      document.addEventListener('change', this.onChange);
      this.apply(this.currentColor(), false);
    }

    disconnectedCallback() {
      document.removeEventListener('change', this.onChange);
    }

    currentColor() {
      const checked = Array.from(document.querySelectorAll('input[type="radio"][data-option-name]')).find(
        (input) => input.checked && norm(input.dataset.optionName) === norm(this.dataset.option)
      );
      if (checked) return checked.value;
      const select = Array.from(document.querySelectorAll('select option[data-option-name]')).find(
        (option) => option.selected && norm(option.dataset.optionName) === norm(this.dataset.option)
      );
      return select ? select.value : '';
    }

    apply(color, animate) {
      const key = norm(color);
      let list = this.map[key];
      const extras = this.slides.filter((slide) => slide.dataset.extraColor && norm(slide.dataset.extraColor) === key);
      let showEmpty = false;
      if ((!list || !list.length) && extras.length) list = [];
      if (!list || !list.length && !extras.length) {
        if (key && Object.keys(this.map).length) {
          list = [];
          showEmpty = true;
        } else {
          list = null;
        }
      }
      this.slides.forEach((slide, i) => {
        const show = !list || (slide.dataset.extraColor ? extras.includes(slide) : list.includes(Number(slide.dataset.pos)));
        slide.hidden = !show;
        this.thumbItems[i].hidden = !show;
      });
      if (list) {
        // respeta el orden indicado en el ajuste
        const ordered = list.map((p) => this.slides.find((s) => Number(s.dataset.pos) === p)).filter(Boolean);
        ordered.concat(extras).forEach((slide) => {
          this.track.appendChild(slide);
          const thumb = this.thumbItems[this.slides.indexOf(slide)];
          thumb.parentNode.appendChild(thumb);
        });
      }
      this.stage.hidden = showEmpty;
      this.querySelector('.eg__thumbs').hidden = showEmpty;
      if (this.empty) {
        this.empty.hidden = !showEmpty;
        if (showEmpty) {
          this.empty.querySelector('[data-eg-empty-name]').textContent = color;
          const radio = Array.from(document.querySelectorAll('input[type="radio"][data-option-name]')).find((i) => i.value === color);
          const dot = radio && radio.nextElementSibling && radio.nextElementSibling.querySelector('.ehora-swatch__dot');
          const swatch = this.empty.querySelector('[data-eg-empty-dot]');
          if (dot) swatch.style.cssText = dot.getAttribute('style');
          const open3d = document.querySelector('[data-e3d-open]');
          const btn = this.empty.querySelector('[data-eg-open3d]');
          btn.hidden = !open3d;
          btn.onclick = () => open3d && open3d.click();
        }
      }
      const visible = this.visibleSlides();
      if (this.totalEl) this.totalEl.textContent = visible.length;
      this.track.scrollTo({ left: 0, behavior: 'auto' });
      this.querySelector('.eg__nav--prev').hidden = this.querySelector('.eg__nav--next').hidden = visible.length < 2;
      if (!showEmpty) this.querySelector('.eg__thumbs').hidden = visible.length < 2;
      this.syncCounter();
      if (animate) {
        this.classList.remove('is-switching');
        void this.offsetWidth;
        this.classList.add('is-switching');
      }
    }

    visibleSlides() {
      return Array.from(this.track.children).filter((slide) => !slide.hidden);
    }

    index() {
      const width = this.track.clientWidth || 1;
      return Math.round(this.track.scrollLeft / width);
    }

    syncCounter() {
      const visible = this.visibleSlides();
      const at = Math.min(Math.max(this.index(), 0), Math.max(visible.length - 1, 0));
      if (this.currentEl) this.currentEl.textContent = visible.length ? at + 1 : 0;
      this.querySelectorAll('.eg__thumb').forEach((thumb) => thumb.removeAttribute('aria-current'));
      const slide = visible[at];
      if (slide) {
        const thumb = this.thumbItems[this.slides.indexOf(slide)];
        const button = thumb && thumb.querySelector('.eg__thumb');
        if (button) button.setAttribute('aria-current', 'true');
      }
    }

    goTo(index) {
      const visible = this.visibleSlides();
      if (!visible.length) return;
      const next = (index + visible.length) % visible.length;
      this.track.scrollTo({ left: next * this.track.clientWidth, behavior: 'smooth' });
    }

    step(direction) {
      this.goTo(this.index() + direction);
    }
  }

  customElements.define('ehora-gallery', EhoraGallery);
})();
