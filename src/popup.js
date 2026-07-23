import { LitElement, html } from "lit";
import "./popup-form.js";
import "./popup-intro.js";
import "./popup-tabs.js";
import { getConfiguration, isConfigurationComplete } from "./configuration.js";
import { LinkdingApi } from "./linkding.js";

export class Popup extends LitElement {
  static properties = {
    hasCompleteConfiguration: { type: Boolean, state: true },
    configuration: { type: Object, state: true },
    api: { type: Object, state: true },
    view: { type: String, state: true },
  };

  constructor() {
    super();
    this.hasCompleteConfiguration = true;
    this.configuration = null;
    this.api = null;
    this.view = "bookmark";
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated(props) {
    super.firstUpdated(props);

    this.init();

    this.addEventListener("show-tabs", () => {
      this.view = "tabs";
    });
    this.addEventListener("show-bookmark", () => {
      this.view = "bookmark";
    });
  }

  async init() {
    this.configuration = await getConfiguration();
    this.hasCompleteConfiguration = isConfigurationComplete(this.configuration);
    if (this.hasCompleteConfiguration) {
      this.api = new LinkdingApi(this.configuration);
    }
  }

  render() {
    if (!this.hasCompleteConfiguration) {
      return html`
        <ld-popup-form
          .configuration="${this.configuration}"
          .api="${this.api}"
        ></ld-popup-form>
        <ld-popup-intro></ld-popup-intro>
      `;
    }

    if (this.view === "tabs") {
      return html`
        <ld-popup-tabs
          .configuration="${this.configuration}"
          .api="${this.api}"
        ></ld-popup-tabs>
      `;
    }

    return html`
      <ld-popup-form
        .configuration="${this.configuration}"
        .api="${this.api}"
      ></ld-popup-form>
    `;
  }
}

customElements.define("ld-popup", Popup);
