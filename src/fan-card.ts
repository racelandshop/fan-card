/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RippleHandlers } from "@material/mwc-ripple/ripple-handlers";
import { Ripple } from '@material/mwc-ripple';
import { LitElement, html, TemplateResult, css, PropertyValues, CSSResultGroup } from 'lit';
import { findEntities } from "./././find-entities";
import { HassEntity } from 'home-assistant-js-websocket'
import { queryAsync } from 'lit-element'
import { customElement, property, state } from "lit/decorators";
import { ifDefined } from "lit/directives/if-defined";
import { classMap } from "lit/directives/class-map";
import { HomeAssistant, hasConfigOrEntityChanged, hasAction, ActionHandlerEvent, handleAction, LovelaceCardEditor, getLovelace, fireEvent } from 'custom-card-helpers';
import './editor';
import type { BoilerplateCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION, UNAVAILABLE, UNAVAILABLE_STATES } from './const';
import { localize } from './localize/localize';
import { debounce } from "./common/debounce";
import ResizeObserver from "./common/resizeObserver";
import { computeStateName } from "./common/compute_state_name";


console.info(
  `%c  RACELAND-FAN-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'fan-card',
  name: localize('common.card'),
  preview: true, //IMPORTANTE
});

@customElement('fan-card')
export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('fan-card-editor');
  }
  @queryAsync('mwc-ripple') private _ripple!: Promise<Ripple | null>;
  @property({ type: String }) public layout = "big";
  public static getStubConfig(
    hass: HomeAssistant,
    entities: string[],
    entitiesFallback: string[]
  ): BoilerplateCardConfig {
    const includeDomains = ["switch", "fan"];
    const maxEntities = 1;
    const foundEntities = findEntities(
      hass,
      maxEntities,
      entities,
      entitiesFallback,
      includeDomains
    );
    return { type: "custom:fan-card", entity: foundEntities[0] || "", "show_name": true, "show_state": true};
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: BoilerplateCardConfig;
  public setConfig(config: BoilerplateCardConfig): void {
    if (!config) {
      throw new Error(localize('common.invalidconfiguration'));
    }
    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }
    this.config = {
      show_icon: true,
      icon: 'mdi:fan',
      ...config,
      tap_action: {
        action: "toggle",
      },
    };
  }

  public translate_state(stateObj): string{
    if(ifDefined(stateObj ? this.computeActiveState(stateObj) : undefined) === "on") {
      return localize("states.on");
    }
    else if(ifDefined(stateObj ? this.computeActiveState(stateObj) : undefined) === "off") {
      return localize("states.off");
    }
    else if(ifDefined(stateObj ? this.computeActiveState(stateObj) : undefined) === "unavailable") {
      return localize("states.unavailable");
    }
    else {
      return ""
    }
  }

  private _handleMoreInfo() {
    fireEvent(this, "hass-more-info", {
      entityId: this.config?.entity!,
    });
  }

  private mdiDotsVertical = "M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected render(): TemplateResult | void {
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }
    if (this.config.show_error) {
      return this._showError(localize('common.show_error'));
    }
    const stateObj = this.config.entity
      ? this.hass.states[this.config.entity]
      : undefined;
    const name = this.config.show_name

    ? this.config.name || (stateObj ? computeStateName(stateObj) : "")
    : "";
    return html`
      <ha-card >
            <ha-icon-button
            class="more-info"
            .label=${""}
            .path=${this.mdiDotsVertical}
            @click=${this._handleMoreInfo}
            tabindex="0"
            ></ha-icon-button>
        <div class=${classMap({
                "content": this.layout === "big",
                "content-small": this.layout === "medium" || this.layout === "small",
              })}>
          <div class=${classMap({
                "controls": this.layout === "big",
                "controls-small": this.layout === "medium" || this.layout === "small",
              })}>
                <ha-icon-button
                    class="fan-button"
                      @action=${this._handleAction}
                      @focus="${this.handleRippleFocus}"
                      .actionHandler=${actionHandler({
                        hasHold: hasAction(this.config.hold_action),
                        hasDoubleClick: hasAction(this.config.double_tap_action),
                      })}
                      tabindex="0"
                      .label=${`fan: ${this.config.entity || 'No Entity Defined'}`}
                    >

                    <ha-state-icon
                        class="container-icon
                        ${classMap({
                        "state-on": ifDefined(
                        stateObj ? this.computeActiveState(stateObj) : undefined) === "on",
                        "state-off": ifDefined(
                          stateObj ? this.computeActiveState(stateObj) : undefined) === "off",
                        "state-unavailable": stateObj?.state === UNAVAILABLE,
                        })}"
                        .icon=${this.config.icon}
                        .state=${stateObj}
                        ></ha-state-icon>

                </ha-icon-button>
            </div>

            <div class=${classMap({
                "info": this.layout === "big",
                "info-small": this.layout === "small",
                "info-medium": this.layout === "medium",
              })}>
            ${stateObj?.state === UNAVAILABLE
              ? html`
                  <unavailable-icon></unavailable-icon>`
      : html ``}
                ${name}
            </div>
        </div>
      </ha-card>
    `;
  }

private computeActiveState = (stateObj: HassEntity): string => {
  const domain = stateObj.entity_id.split(".")[0];
  let state = stateObj?.state;
  if (domain === "climate") {
    state = stateObj.attributes.hvac_action;
  }
  return state;
};
  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }
  private _showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }
  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });
    return html`
      ${errorCard}
    `;
  }
//   private computeObjectId = (entityId: string): string =>
//     entityId.substr(entityId.indexOf(".") + 1);
//   private computeStateName = (stateObj: HassEntity): string =>
//     stateObj.attributes.friendly_name === undefined
//       ? this.computeObjectId(stateObj.entity_id).replace(/_/g, " ")
//       : stateObj.attributes.friendly_name || "";
  private _rippleHandlers: RippleHandlers = new RippleHandlers(() => {
    return this._ripple;
  });
  private handleRippleFocus() {
    this._rippleHandlers.startFocus();
  }


static get styles(): CSSResultGroup {
  return css`
    ha-card {
      height: 100%;
      padding: 4% 0;
      box-sizing: border-box;
      position: relative;
        overflow: hidden;
        border-radius: 1.5rem;
      }

      .fan-button {
        color: var(--paper-item-icon-color, #44739e);
      width: var(--mdc-icon-size, 24px);
      height: var(--mdc-icon-size, 24px);
      border-radius: 100%;
      --mdc-icon-button-size: 100%;
      --mdc-icon-size: 100%;
    }

    .content {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .content-small {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: left;
    }
    .controls {
      width: 40%;
        text-align: center;
      }

    .controls-small {
        width: 63%;
        margin-right: 30%;
        text-align: center;
    }

    .info {
        text-align: center;
        padding: 5%;
        font-size: 2.3rem;
        font-weight: 450;
        white-space: nowrap;
        display: inline-block;
        overflow: hidden;
        max-width: 80%;
        text-overflow: ellipsis;
        justify-content: space-between;
      }

      .info-medium {
        padding: 5%;
        font-size: 1.8rem;
        font-weight: 450;
        padding-bottom: 4%;
        margin-bottom: 4%;
        margin-left: 7%;
        white-space: nowrap;
        display: inline-block;
        overflow: hidden;
        max-width: 150px;
        float: left;
        text-overflow: ellipsis;
      }

      .info-small {
        padding: 5%;
        font-size: 1.2rem;
        font-weight: 450;
        padding-bottom: 4%;
        margin-bottom: 4%;
        margin-left: 7%;
        white-space: nowrap;
        display: inline-block;
        overflow: hidden;
        max-width: 110px;
        float: left;
        text-overflow: ellipsis;
      }

      ha-state-icon {
      width: 100%;
      height: 100%;
    }

    ha-icon-button + span {
      text-align: center;
    }


    .more-info {
      position: absolute;
      cursor: pointer;
      top: 0;
      right: 0;
      border-radius: 100%;
      color: var(--secondary-text-color);
      z-index: 1;
    }
    unavailable-icon {
      position: absolute;
        top: 11px;
        right: 25%;
    }

    ha-state-icon.state-on {
      color: var(--paper-item-icon-active-color, #fdd835);
      animation: rotate 4s linear;
      animation-delay: 0s;
      animation-iteration-count: infinite;
    }

    ha-state-icon.state-unavailable {
      color: var(--state-icon-unavailable-color, #bdbdbd);
    }
    @keyframes rotate {
      0% {
        transform: rotate(0deg);
      }
      25% {
        transform: rotate(90deg);
      }
      50% {
        transform: rotate(180deg);
      }
      75% {
        transform: rotate(270deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    .state {
      font-size: 0.9rem;
      color: var(--secondary-text-color);
    }
  `;
}
}
