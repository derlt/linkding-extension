import { LitElement, html } from "lit";
import { icons } from "./icons";

export class BundleSelect extends LitElement {
  static properties = {
    bundles: { type: Array },
    selected: { type: Object, state: true },
    isOpen: { type: Boolean, state: true },
    query: { type: String, state: true },
    selectedIndex: { type: Number, state: true },
  };

  constructor() {
    super();
    this.bundles = [];
    this.selected = null;
    this.isOpen = false;
    this.query = "";
    this.selectedIndex = 0;
  }

  createRenderRoot() {
    return this;
  }

  get filtered() {
    if (!this.query) return this.bundles;
    return this.bundles.filter((b) =>
      b.name.toLowerCase().includes(this.query.toLowerCase()),
    );
  }

  get isExactMatch() {
    return this.bundles.some(
      (b) => b.name.toLowerCase() === this.query.trim().toLowerCase(),
    );
  }

  get showCreateOption() {
    const q = this.query.trim();
    return q.length > 0 && !this.isExactMatch;
  }

  open() {
    this.isOpen = true;
    this.query = "";
    this.selectedIndex = 0;
    this.updateComplete.then(() => {
      this.querySelector(".menu input")?.focus();
    });
  }

  close() {
    this.isOpen = false;
    this.query = "";
    this.selectedIndex = 0;
  }

  handleTriggerClick() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  select(bundle) {
    this.selected = bundle;
    this.close();
    this.dispatchEvent(
      new CustomEvent("bundle-change", {
        detail: { bundle },
        bubbles: true,
        composed: true,
      }),
    );
  }

  handleQueryInput(e) {
    this.query = e.target.value;
    this.selectedIndex =
      this.filtered.length > 0 || this.showCreateOption ? 1 : 0;
  }

  handleKeyDown(e) {
    const totalItems =
      this.filtered.length + 1 + (this.showCreateOption ? 1 : 0);

    if (e.keyCode === 27) {
      this.close();
      e.preventDefault();
      return;
    }

    if (e.keyCode === 38) {
      this.selectedIndex = (this.selectedIndex - 1 + totalItems) % totalItems;
      e.preventDefault();
      return;
    }

    if (e.keyCode === 40) {
      this.selectedIndex = (this.selectedIndex + 1) % totalItems;
      e.preventDefault();
      return;
    }

    if (e.keyCode === 13) {
      const createIndex = this.filtered.length + 1;

      if (this.selectedIndex === 0) {
        this.select(null);
      } else if (this.showCreateOption && this.selectedIndex === createIndex) {
        this.select({ isNew: true, name: this.query.trim() });
      } else {
        const mappedIndex = this.selectedIndex - 1;
        if (mappedIndex >= 0 && mappedIndex < this.filtered.length) {
          this.select(this.filtered[mappedIndex]);
        }
      }
      e.preventDefault();
    }
  }

  handleFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) {
        this.close();
      }
    }, 150);
  }

  render() {
    const label = this.selected ? this.selected.name : "No bundle";

    return html`
      <div class="bundle-select" @focusout="${this.handleFocusOut}">
        <button
          type="button"
          class="bundle-select-trigger"
          @click="${this.handleTriggerClick}"
        >
          <span class="bundle-select-label">${label}</span>
          ${icons.chevronDown()}
        </button>
        ${this.isOpen
          ? html`
              <ul class="menu open">
                <li class="menu-item">
                  <input
                    class="form-input"
                    type="text"
                    placeholder="Search bundles…"
                    .value="${this.query}"
                    @input="${this.handleQueryInput}"
                    @keydown="${this.handleKeyDown}"
                  />
                </li>
                <li
                  class="menu-item ${this.selectedIndex === 0
                    ? "selected"
                    : ""}"
                >
                  <a
                    href="#"
                    @mousedown="${(e) => {
                      e.preventDefault();
                      this.select(null);
                    }}"
                  >
                    <div class="tile tile-centered">
                      <div class="tile-content text-gray">No bundle</div>
                    </div>
                  </a>
                </li>
                ${this.filtered.map(
                  (bundle, i) => html`
                    <li
                      class="menu-item ${this.selectedIndex === i + 1
                        ? "selected"
                        : ""}"
                    >
                      <a
                        href="#"
                        @mousedown="${(e) => {
                          e.preventDefault();
                          this.select(bundle);
                        }}"
                      >
                        <div class="tile tile-centered">
                          <div class="tile-content">${bundle.name}</div>
                        </div>
                      </a>
                    </li>
                  `,
                )}
                ${this.showCreateOption
                  ? html`
                      <li
                        class="menu-item ${this.selectedIndex ===
                        this.filtered.length + 1
                          ? "selected"
                          : ""}"
                      >
                        <a
                          href="#"
                          @mousedown="${(e) => {
                            e.preventDefault();
                            this.select({
                              isNew: true,
                              name: this.query.trim(),
                            });
                          }}"
                        >
                          <div class="tile tile-centered">
                            <div class="tile-content">
                              ${icons.plus()} Create new bundle
                              "${this.query.trim()}"
                            </div>
                          </div>
                        </a>
                      </li>
                    `
                  : ""}
              </ul>
            `
          : ""}
      </div>
    `;
  }
}

customElements.define("ld-bundle-select", BundleSelect);
