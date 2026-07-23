import { LitElement, html } from "lit";
import "./bundle-select.js";
import "./tag-chips-input.js";
import { getAllTabsInfo, closeTabs, showBadge } from "./browser.js";
import { getConfiguration } from "./configuration.js";
import { addUrl } from "./url-index.js";
import { icons } from "./icons";
import { formatDateTag } from "./util.js";

export class PopupTabs extends LitElement {
  static properties = {
    api: { type: Object },
    configuration: { type: Object },
    tabs: { type: Array, state: true },
    bundles: { type: Array, state: true },
    selectedBundle: { type: Object, state: true },
    tags: { type: Array, state: true },
    closeTabsAfterSave: { type: Boolean, state: true },
    saveState: { type: String, state: true },
    progress: { type: Object, state: true },
    errorMessage: { type: String, state: true },
    availableTagNames: { type: Array, state: true },
    extensionConfiguration: { type: Object, state: true },
    loading: { type: Boolean, state: true },
  };

  constructor() {
    super();
    this.api = null;
    this.configuration = null;
    this.tabs = [];
    this.bundles = [];
    this.selectedBundle = null;
    this.tags = [];
    this.closeTabsAfterSave = false;
    this.saveState = "";
    this.progress = { done: 0, total: 0 };
    this.errorMessage = "";
    this.availableTagNames = [];
    this.extensionConfiguration = null;
    this.loading = true;
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated(props) {
    super.firstUpdated(props);
    this.classList.add("tabs-form");
  }

  updated(changedProperties) {
    if (
      changedProperties.has("api") ||
      changedProperties.has("configuration")
    ) {
      if (this.api && this.configuration) {
        this.init();
      }
    }
  }

  async init() {
    this.tabs = await getAllTabsInfo();
    this.tags = [formatDateTag(new Date())];
    this.loading = false;

    this.api
      .getTags()
      .catch(() => [])
      .then((tags) => {
        this.availableTagNames = tags.map((tag) => tag.name);
      });

    this.api
      .getBundles()
      .catch(() => [])
      .then((bundles) => {
        this.bundles = bundles;
      });

    this.extensionConfiguration = await getConfiguration();
  }

  handleBack() {
    this.dispatchEvent(
      new CustomEvent("show-bookmark", {
        bubbles: true,
        composed: true,
      }),
    );
  }

  removeTab(index) {
    this.tabs = this.tabs.filter((_, i) => i !== index);
  }

  handleBundleChange(e) {
    this.selectedBundle = e.detail.bundle;
  }

  handleTagsChange(e) {
    this.tags = e.detail.tags;
  }

  handleCloseTabsChange(e) {
    this.closeTabsAfterSave = e.target.checked;
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (this.tabs.length === 0 || this.saveState === "loading") return;

    if (this.selectedBundle?.isNew && this.tags.length === 0) {
      this.saveState = "error";
      this.errorMessage = "Add at least one tag to create a new bundle";
      return;
    }

    const savedIds = [];
    const failures = [];
    const tabsToSave = this.tabs;

    try {
      let tagNames = [...this.tags];

      if (this.selectedBundle) {
        if (this.selectedBundle.isNew) {
          const bundle = await this.api.createBundle({
            name: this.selectedBundle.name,
            search: "",
            any_tags: this.tags.join(" "),
            all_tags: "",
            excluded_tags: "",
          });
          this.selectedBundle = bundle;
        } else {
          const anyTokens = (this.selectedBundle.any_tags || "")
            .split(/\s+/)
            .filter(Boolean);
          const allTokens = (this.selectedBundle.all_tags || "")
            .split(/\s+/)
            .filter(Boolean);
          const excludedTokens = (this.selectedBundle.excluded_tags || "")
            .split(/\s+/)
            .filter(Boolean);

          for (const token of [...allTokens, ...anyTokens]) {
            if (
              !tagNames.some((t) => t.toLowerCase() === token.toLowerCase())
            ) {
              tagNames.push(token);
            }
          }
          tagNames = tagNames.filter(
            (t) =>
              !excludedTokens.some((e) => e.toLowerCase() === t.toLowerCase()),
          );
        }
      }

      this.saveState = "loading";
      this.progress = { done: 0, total: tabsToSave.length };

      for (const tab of tabsToSave) {
        try {
          await this.api.saveBookmark(
            {
              url: tab.url,
              title: tab.title || "",
              description: "",
              notes: "",
              tag_names: tagNames,
              unread: false,
              shared: false,
            },
            {
              disable_html_snapshot: this.extensionConfiguration?.runSinglefile,
            },
          );
          await addUrl(tab.url);
          savedIds.push(tab.id);
          if (this.extensionConfiguration?.precacheEnabled) {
            showBadge(tab.id);
          }
        } catch (err) {
          failures.push({ tab, error: err.toString() });
          console.error("Failed to save tab", tab.url, err);
        }
        this.progress = {
          done: this.progress.done + 1,
          total: tabsToSave.length,
        };
      }

      if (this.closeTabsAfterSave && savedIds.length > 0) {
        await closeTabs(savedIds);
      }

      if (failures.length === 0) {
        this.saveState = "success";
        if (this.extensionConfiguration?.closeAddBookmarkWindowOnSave) {
          window.setTimeout(() => {
            window.close();
          }, this.extensionConfiguration?.closeAddBookmarkWindowOnSaveMs);
        }
      } else {
        this.tabs = this.tabs.filter((t) => !savedIds.includes(t.id));
        this.saveState = "error";
        this.errorMessage = `${failures.length} of ${tabsToSave.length} tabs failed to save`;
      }
    } catch (e) {
      this.saveState = "error";
      this.errorMessage = e.toString();
      console.error("Error saving tabs", e);
    }
  }

  render() {
    return html`
      <div class="title-row">
        <button
          type="button"
          class="btn btn-link"
          @click="${this.handleBack}"
          title="Back"
        >
          ${icons.back()}
        </button>
        <h1 class="h6 ml-2">Save tabs</h1>
      </div>
      <form class="form" @submit="${this.handleSubmit}">
        <div class="form-group">
          <label class="form-label">Tabs</label>
          ${this.tabs.length === 0
            ? html`
                <div class="form-input-hint text-gray">
                  ${this.loading ? "" : "No tabs to save"}
                </div>
              `
            : html`
                <div class="tab-list">
                  ${this.tabs.map(
                    (tab, i) => html`
                      <div class="tab-list-item">
                        ${tab.favIconUrl
                          ? html`
                              <img
                                class="tab-favicon"
                                src="${tab.favIconUrl}"
                                @error="${(e) => {
                                  e.target.style.display = "none";
                                }}"
                                width="16"
                                height="16"
                              />
                            `
                          : html`<span class="tab-favicon-placeholder"
                              >${icons.globe()}</span
                            >`}
                        <span class="tab-title" title="${tab.title}"
                          >${tab.title}</span
                        >
                        <button
                          type="button"
                          class="btn btn-link tab-remove"
                          ?disabled="${this.saveState === "loading"}"
                          @click="${() => this.removeTab(i)}"
                          title="Remove from list"
                        >
                          ${icons.close()}
                        </button>
                      </div>
                    `,
                  )}
                </div>
              `}
        </div>
        <div class="form-group">
          <label class="form-label">Bundle</label>
          <ld-bundle-select
            .bundles="${this.bundles}"
            .selected="${this.selectedBundle}"
            @bundle-change="${this.handleBundleChange}"
          ></ld-bundle-select>
        </div>
        <div class="form-group">
          <label class="form-label">Tags</label>
          <ld-tag-chips-input
            .tags="${this.tags}"
            .availableTags="${this.availableTagNames}"
            placeholder="Add tag…"
            @tags-change="${this.handleTagsChange}"
          ></ld-tag-chips-input>
        </div>
        <div class="form-group">
          <label class="form-checkbox">
            <input
              type="checkbox"
              .checked="${this.closeTabsAfterSave}"
              @change="${this.handleCloseTabsChange}"
            />
            <i class="form-icon"></i>
            <span>Close tabs after saving</span>
          </label>
        </div>
        <div class="footer">
          ${this.saveState === "success"
            ? html`
                <div class="result-row text-success">
                  ${icons.success()}
                  <span>Tabs saved</span>
                </div>
              `
            : ""}
          ${this.saveState === "error"
            ? html`
                <div class="result-row text-error">
                  Error saving tabs: ${this.errorMessage}
                </div>
              `
            : ""}
          ${this.saveState !== "success"
            ? html`
                <div class="button-row">
                  <button
                    type="submit"
                    class="btn btn-primary btn-wide ml-auto ${this.saveState}"
                    ?disabled="${this.saveState === "loading" ||
                    this.tabs.length === 0}"
                  >
                    ${this.saveState === "loading"
                      ? html`Saving
                        ${this.progress.done}/${this.progress.total}...`
                      : html`Save ${this.tabs.length}
                        ${this.tabs.length === 1 ? "tab" : "tabs"}`}
                  </button>
                </div>
              `
            : ""}
        </div>
      </form>
    `;
  }
}

customElements.define("ld-popup-tabs", PopupTabs);
