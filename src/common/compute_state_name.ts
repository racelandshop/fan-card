import { HassEntity } from "home-assistant-js-websocket";

export const computeObjectId = (entityId: string): string =>
    entityId.substr(entityId.indexOf(".") + 1);

export const computeStateName = (stateObj: HassEntity): string =>
  stateObj.attributes.friendly_name === undefined
    ? computeObjectId(stateObj.entity_id).replace(/_/g, " ")
    : stateObj.attributes.friendly_name || "";