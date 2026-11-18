/*
  EHORA · Ver en 3D
  Abre el paletero en un visor 3D dentro de una ventana. La librería (model-viewer) y el modelo solo se
  descargan al pulsar el botón. Los colores son variantes reales del producto: al elegir uno en 3D se
  selecciona esa variante en la ficha, y al cambiar la variante en la ficha se actualiza el visor.
  Si el producto no tiene opción de color, se muestran los colores como vista previa.
*/

const E3D_COLORS = [
  { id: 'blanco', name: 'Blanco', hex: '#EFEBE2', trim: '#0B4A25', aliases: ['blanco', 'white', 'crema'] },
  { id: 'blanco-azul', name: 'Blanco ribete azul', hex: '#EFEBE2', trim: '#1E3FBF', aliases: ['blanco ribete azul'] },
  { id: 'beige', name: 'Beige', hex: '#D6C3A3', trim: '#0B4A25', aliases: ['beige', 'arena'] },
  { id: 'verde', name: 'Verde', hex: '#1F4B33', trim: '#EFEBE2', aliases: ['verde', 'green'] },
  { id: 'marino', name: 'Azul marino', hex: '#1C2B4B', trim: '#EFEBE2', aliases: ['azul marino', 'marino', 'navy', 'azul'] },
  { id: 'negro', name: 'Negro', hex: '#18181B', trim: '#EFEBE2', aliases: ['negro', 'black'] },
];

const E3D_RECOLOR = ['Exterior', 'Handle', 'Lining'];

const e3dNorm = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

const e3dMatch = (text) => {
  const n = e3dNorm(text);
  return E3D_COLORS.find((color) => color.aliases.some((alias) => e3dNorm(alias) === n)) || null;
};

if (!customElements.get('ehora-3d')) {
  customElements.define(
    'ehora-3d',
    class Ehora3D extends HTMLElement {
      connectedCallback() {
        this.dialog = this.querySelector('dialog');
        this.opener = this.querySelector('[data-e3d-open]');
        this.stage = this.querySelector('[data-e3d-stage]');
        this.status = this.querySelector('[data-e3d-status]');
        this.bar = this.querySelector('[data-e3d-progress]');
        this.swatchBox = this.querySelector('[data-e3d-swatches]');
        this.nameEl = this.querySelector('[data-e3d-name]');
        this.noteEl = this.querySelector('[data-e3d-note]');
        this.viewer = null;
        this.loading = null;
        this.current = E3D_COLORS[0];

        this.opener.addEventListener('click', () => this.open());
        this.querySelectorAll('[data-e3d-close]').forEach((button) => button.addEventListener('click', () => this.dialog.close()));
        this.dialog.addEventListener('click', (event) => {
          if (event.target === this.dialog) this.dialog.close();
        });
        this.dialog.addEventListener('close', () => {
          document.documentElement.classList.remove('e3d-lock');
          if (this.viewer) this.viewer.autoRotate = false;
        });
        document.addEventListener('change', (event) => {
          if (event.target.closest && event.target.closest('variant-selects') && this.dialog.open) this.syncFromProduct();
        });
      }

      get optionName() {
        return this.dataset.option || 'Color';
      }

      /* Entradas del selector de variantes de la ficha cuyo valor coincide con un color */
      productColors() {
        const picker = document.querySelector('variant-selects');
        if (!picker) return [];
        const found = [];
        const name = this.optionName.replace(/"/g, '');
        picker.querySelectorAll(`input[type="radio"][data-option-name="${name}" i]`).forEach((input) => {
          const color = e3dMatch(input.value);
          if (color) found.push({ color, input, available: !input.classList.contains('disabled') });
        });
        if (!found.length) {
          picker.querySelectorAll('select').forEach((select) => {
            [...select.options].forEach((option) => {
              const color = e3dMatch(option.value || option.textContent);
              if (color) found.push({ color, select, option, available: !option.disabled });
            });
          });
        }
        return found;
      }

      selectedProductColor(entries) {
        const hit = entries.find((entry) => (entry.input ? entry.input.checked : entry.select.value === entry.option.value));
        return hit ? hit.color : null;
      }

      buildSwatches() {
        this.entries = this.productColors();
        const preview = !this.entries.length;
        const colors = preview ? E3D_COLORS : this.entries.map((entry) => entry.color);
        this.swatchBox.textContent = '';
        colors.forEach((color) => {
          const entry = preview ? null : this.entries.find((item) => item.color === color);
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'e3d__swatch';
          button.style.setProperty('--sw', color.hex);
          button.dataset.color = color.id;
          button.setAttribute('aria-label', color.name + (entry && !entry.available ? ' (agotado)' : ''));
          button.setAttribute('aria-pressed', 'false');
          if (entry && !entry.available) button.classList.add('is-soldout');
          button.addEventListener('click', () => this.pick(color, entry));
          this.swatchBox.append(button);
        });
        this.noteEl.hidden = !preview;
      }

      syncFromProduct() {
        const chosen = this.selectedProductColor(this.productColors());
        if (chosen) this.paint(chosen);
      }

      open() {
        this.buildSwatches();
        const chosen = this.selectedProductColor(this.entries) || this.current;
        this.paint(chosen, true);
        document.documentElement.classList.add('e3d-lock');
        this.dialog.showModal();
        this.load();
      }

      /* Elegir un color en 3D selecciona esa variante en la ficha */
      pick(color, entry) {
        this.paint(color);
        if (!entry) return;
        if (entry.input) {
          if (!entry.input.checked) {
            entry.input.checked = true;
            entry.input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else if (entry.select.value !== entry.option.value) {
          entry.select.value = entry.option.value;
          entry.select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      paint(color, skipViewer) {
        this.current = color;
        this.nameEl.textContent = color.name;
        this.swatchBox.querySelectorAll('.e3d__swatch').forEach((swatch) => swatch.setAttribute('aria-pressed', String(swatch.dataset.color === color.id)));
        if (!skipViewer) this.recolor();
        else if (this.viewer && this.viewer.loaded) this.recolor();
      }

      recolor() {
        const viewer = this.viewer;
        if (!viewer || !viewer.model) return;
        const color = this.current;
        viewer.model.materials.forEach((material) => {
          if (!material.isLoaded) return;
          const name = material.name.replace(/[._]\d+$/, '');
          if (name === 'Floor') material.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 0]);
          else if (E3D_RECOLOR.includes(name)) material.pbrMetallicRoughness.setBaseColorFactor(color.hex);
          else if (name === 'Trim') material.pbrMetallicRoughness.setBaseColorFactor(color.trim);
        });
      }

      fail(message) {
        this.status.textContent = message;
        this.status.hidden = false;
        this.bar.parentElement.hidden = true;
        this.loading = null;
      }

      load() {
        if (this.viewer || this.loading) return;
        this.status.hidden = false;
        this.bar.parentElement.hidden = false;
        this.loading = import(this.dataset.lib)
          .then(() => {
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const viewer = document.createElement('model-viewer');
            viewer.setAttribute('src', this.dataset.model);
            viewer.setAttribute('alt', 'Paletero EHORA en 3D');
            viewer.setAttribute('camera-controls', '');
            viewer.setAttribute('camera-orbit', '155deg 76deg 1.7m');
            viewer.setAttribute('min-camera-orbit', 'auto 15deg 0.7m');
            viewer.setAttribute('max-camera-orbit', 'auto 100deg 3.2m');
            viewer.setAttribute('field-of-view', '28deg');
            viewer.setAttribute('environment-image', 'neutral');
            viewer.setAttribute('exposure', '1.1');
            viewer.setAttribute('shadow-intensity', '0.9');
            viewer.setAttribute('shadow-softness', '0.8');
            viewer.setAttribute('interaction-prompt', 'auto');
            if (!reduced) {
              viewer.setAttribute('auto-rotate', '');
              viewer.setAttribute('auto-rotate-delay', '3000');
            }
            viewer.className = 'e3d__viewer';
            viewer.addEventListener('progress', (event) => {
              this.bar.style.transform = `scaleX(${event.detail.totalProgress || 0})`;
            });
            viewer.addEventListener('load', () => {
              this.status.hidden = true;
              this.bar.parentElement.hidden = true;
              this.recolor();
            });
            viewer.addEventListener('error', () => this.fail('No se pudo cargar el modelo 3D. Inténtalo de nuevo más tarde.'));
            this.viewer = viewer;
            this.stage.prepend(viewer);
          })
          .catch(() => this.fail('No se pudo cargar el visor 3D. Inténtalo de nuevo más tarde.'));
      }
    }
  );
}
