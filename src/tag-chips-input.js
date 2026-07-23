import { LitElement, html } from "lit";
import { icons } from "./icons";

export class TagChipsInput extends LitElement {
  static properties = {
    tags: { type: Array, state: true },
    availableTags: { type: Array },
    placeholder: { type: String },
    inputValue: { type: String, state: true },
    isOpen: { type: Boolean, state: true },
    suggestions: { type: Array, state: true },
    selectedIndex: { type: Number, state: true },
  };

  constructor() {
    super();
    this.tags = [];
    this.availableTags = [];
    this.placeholder = "";
    this.inputValue = "";
    this.isOpen = false;
    this.suggestions = [];
    this.selectedIndex = 0;
  }

  createRenderRoot() {
    return this;
  }

  get showCreateOption() {
    const val = this.inputValue.trim();
    return (
      val.length > 0 &&
      !this.suggestions.some((s) => s.toLowerCase() === val.toLowerCase())
    );
  }

  fireChange() {
    this.dispatchEvent(
      new CustomEvent("tags-change", {
        detail: { tags: [...this.tags] },
        bubbles: true,
        composed: true,
      }),
    );
  }

  addTag(name) {
    const trimmed = name.trim();
    if (
      !trimmed ||
      this.tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())
    ) {
      return;
    }
    this.tags = [...this.tags, trimmed];
    this.fireChange();
  }

  removeTag(index) {
    this.tags = this.tags.filter((_, i) => i !== index);
    this.fireChange();
    this.querySelector("input")?.focus();
  }

  removeLastTag() {
    if (this.tags.length > 0) {
      this.tags = this.tags.slice(0, -1);
      this.fireChange();
    }
  }

  pick(value) {
    this.addTag(value);
    this.inputValue = "";
    this.isOpen = false;
    this.suggestions = [];
  }

  handleInput(e) {
    this.inputValue = e.target.value;
    this.updateSuggestions();
  }

  updateSuggestions() {
    const word = this.inputValue.trim().toLowerCase();
    this.suggestions = this.availableTags
      .filter(
        (t) =>
          t.toLowerCase().startsWith(word) &&
          !this.tags.some((tt) => tt.toLowerCase() === t.toLowerCase()),
      )
      .slice(0, 100);

    if (this.suggestions.length > 0 || this.showCreateOption) {
      this.isOpen = true;
    } else {
      this.isOpen = false;
    }
    this.selectedIndex = 0;
  }

  selectSuggestion() {
    if (this.showCreateOption) {
      const createIndex = this.suggestions.length;
      if (this.selectedIndex === createIndex) {
        this.pick(this.inputValue.trim());
        return;
      }
    }

    if (
      this.selectedIndex >= 0 &&
      this.selectedIndex < this.suggestions.length
    ) {
      this.pick(this.suggestions[this.selectedIndex]);
    }
  }

  handleKeyDown(e) {
    const totalItems =
      this.suggestions.length + (this.showCreateOption ? 1 : 0);

    if (this.isOpen && (e.keyCode === 13 || e.keyCode === 9)) {
      this.selectSuggestion();
      e.preventDefault();
      return;
    }

    if (e.keyCode === 27) {
      this.isOpen = false;
      e.preventDefault();
      return;
    }

    if (e.keyCode === 38 && this.isOpen) {
      this.selectedIndex = (this.selectedIndex - 1 + totalItems) % totalItems;
      e.preventDefault();
      return;
    }

    if (e.keyCode === 40 && this.isOpen) {
      this.selectedIndex = (this.selectedIndex + 1) % totalItems;
      e.preventDefault();
      return;
    }

    if (e.keyCode === 8 && !this.inputValue) {
      this.removeLastTag();
      e.preventDefault();
    }
  }

  handleFocus() {
    this.updateSuggestions();
  }

  handleFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) {
        this.isOpen = false;
      }
    }, 150);
  }

  render() {
    return html`
      <div class="tag-chips-input" @focusout="${this.handleFocusOut}">
        <div class="tag-chips-container form-input">
          ${this.tags.map(
            (tag, i) => html`
              <span class="tag-chip">
                <span>${tag}</span>
                <button
                  type="button"
                  class="tag-chip-remove"
                  @click="${() => this.removeTag(i)}"
                >
                  ${icons.close()}
                </button>
              </span>
            `,
          )}
          <input
            class="tag-chips-text-input"
            type="text"
            .value="${this.inputValue}"
            placeholder="${this.placeholder}"
            @input="${this.handleInput}"
            @keydown="${this.handleKeyDown}"
            @focus="${this.handleFocus}"
          />
        </div>
        <ul
          class="menu ${this.isOpen &&
          (this.suggestions.length > 0 || this.showCreateOption)
            ? "open"
            : ""}"
        >
          ${this.suggestions.map(
            (tag, i) => html`
              <li
                class="menu-item ${this.selectedIndex === i ? "selected" : ""}"
              >
                <a
                  href="#"
                  @mousedown="${(e) => {
                    e.preventDefault();
                    this.pick(tag);
                  }}"
                >
                  <div class="tile tile-centered">
                    <div class="tile-content">${tag}</div>
                  </div>
                </a>
              </li>
            `,
          )}
          ${this.showCreateOption
            ? html`
                <li
                  class="menu-item ${this.selectedIndex ===
                  this.suggestions.length
                    ? "selected"
                    : ""}"
                >
                  <a
                    href="#"
                    @mousedown="${(e) => {
                      e.preventDefault();
                      this.pick(this.inputValue.trim());
                    }}"
                  >
                    <div class="tile tile-centered">
                      <div class="tile-content">
                        ${icons.plus()} Create "${this.inputValue.trim()}"
                      </div>
                    </div>
                  </a>
                </li>
              `
            : ""}
        </ul>
      </div>
    `;
  }
}

customElements.define("ld-tag-chips-input", TagChipsInput);
