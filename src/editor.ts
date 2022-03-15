/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/camelcase */
import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { HomeAssistant, fireEvent, LovelaceCardEditor, ActionConfig } from 'custom-card-helpers';
import { BoilerplateCardConfig, EditorTarget } from './types';
import { customElement, property, state } from 'lit/decorators';
import { fanCardEditorSchema } from './schema';

const includeDomains = ["switch"];

@customElement('fan-card-editor')
export class BoilerplateCardEditor extends LitElement implements LovelaceCardEditor {

  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: BoilerplateCardConfig;

  @state() private _toggle?: boolean;

  @state() private _helpers?: any;

  private _initialized = false;

  public setConfig(config: BoilerplateCardConfig): void {
    this._config = config;
    this.loadCardHelpers();
  }
  protected shouldUpdate(): boolean {
    if (!this._initialized) {
      this._initialize();
    }
    return true;
  }
  get _name(): string {
    return this._config?.name || '';
  }
  get _show_name(): boolean {
    return this._config?.show_name ?? true;
  }
  get _show_state(): boolean {
    return this._config?.show_state ?? true;
  }
  get _entity(): string {
    return this._config?.entity || '';
  }
  get _show_warning(): boolean {
    return this._config?.show_warning || false;
  }
  get _show_error(): boolean {
    return this._config?.show_error || false;
  }
  get _tap_action(): ActionConfig {
    return this._config?.tap_action || { action: 'more-info' };
  }
  get _hold_action(): ActionConfig {
    return this._config?.hold_action || { action: 'none' };
  }
  get _double_tap_action(): ActionConfig {
    return this._config?.double_tap_action || { action: 'none' };
  }


  protected render(): TemplateResult | void {
    if (!this.hass || !this._helpers) {
      return html``;
    }
    this._helpers.importMoreInfoControl('climate');
    const entities = Object.keys(this.hass.states).filter(eid => eid.substr(0, eid.indexOf('.')) === 'switch');
    return html`
      <ha-form
        .hass=${this.hass}
        .schema=${fanCardEditorSchema}
        .computeLabel=${this._computeLabel}
        .data = ${this._config}
        @value-changed=${this._valueChanged}
      ></ha-form>`;
  }

  private _initialize(): void {
    if (this.hass === undefined) return;
    if (this._config === undefined) return;
    if (this._helpers === undefined) return;
    this._initialized = true;
  }

  private async loadCardHelpers(): Promise<void> {
    this._helpers = await (window as any).loadCardHelpers();
  }

  private _computeLabel(schema) {
    return this.hass!.localize(
      `ui.panel.lovelace.editor.card.generic.${schema.name}`
    );
  };

  private _valueChanged(ev: CustomEvent): void {
    const config = ev.detail.value;
    fireEvent(this, "config-changed", { config });
  }

  static get styles(): CSSResultGroup {
    return css`
      .option {
        padding: 3% 0%;
        cursor: pointer;
      }
      .row {
        display: flex;
        margin-bottom: -14px;
        pointer-events: none;
      }
      .title {
        padding-left: 16px;
        margin-top: -6px;
        pointer-events: none;
      }
      .secondary {
        padding-left: 40px;
        color: var(--secondary-text-color);
        pointer-events: none;
      }
      .values {
        padding-left: 16px;
        background: var(--secondary-background-color);
        display: grid;
      }
      ha-formfield {
        padding: 0px 10px 0px 20px;
        max-width: 211px;
      }
    `;
  }
}
