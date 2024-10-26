import * as BUI from "@thatopen/ui";
import { elementPropertiesTemplate, } from "./src/template";
/**
 * Creates an instance of ElementProperties component.
 *
 * @param state - The initial state for the ElementProperties component.
 * @returns A new instance of ElementProperties component.
 *
 */
export const elementProperties = (state) => {
    const element = BUI.Component.create(elementPropertiesTemplate, state);
    return element;
};
