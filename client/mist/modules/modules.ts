import { VElement } from "../dom/node";
import { forceUpdate } from "../state/store";
/**
 * Creates a VElement for every item in the provided array using the function provided.
 * @param array - An array of unknown type, has to be the same type that will be passed to element.
 * @param element - The function which will create the VElement.
 * @param state - Optional state object if the whole state needs to be passed to the element creation function.
 * @returns Array of created VElements
 * @example
 * ```js
 * const numbers = [0, 1, 1, 2, 3, 5, 8];
 * const template = (state) => {
 * 	return (
 * 		<div>
 *			{ m_for(numbers, (num) => { return (<div>{num}</div>) }) }
 * 		</div>
 * 	)
 * }
 * ```
 */
export const m_for = (array: unknown[], element: ((arrayItem: unknown, state: unknown) => VElement) | (() => VElement), state?: Record<string, unknown>): VElement[] => {
    return array.map(item => element(item, state));
};
/**
 * For conditionally rendering an element.
 * @param expression - The expression that decides if an element should be rendered.
 * @param element - The element to render.
 * @returns Element provided if the expression is true. Otherwise returns an empty element.
 * @example
 * ```js
 * m_if(2+2==4, (<div>Calculation Correct</div>))
 * ```
 */
export const m_if = (expression: boolean, element: VElement): VElement | "" => {
    return expression ? element : "";
};
/**
 * Same as {@link m_if} but with added else i.e. fallback element.
 * @param expression - The expression that decides if an element should be rendered.
 * @param element - The element to render if expression is true.
 * @param fallback - The element to render if expression if false.
 * @returns One of two provided VElements.
 * @example
 * ```js
 * let count = 9
 * m_if_else(count % 2 === 0, (<span>Count is even</span>), (<span>Count is odd</span>))
 * ```
 */
export const m_if_else = (expression: boolean, element: VElement, fallback: VElement): VElement => {
    return expression ? element : fallback;
};
/** 
 * For forcibly updating the page when state change doesn't autmatically trigger a page update.
 * @remarks Used primarly to update the page after an array in the state object has been updated as pushes to arrays don't trigger a page update automatically.
 */
export const force_update = (): void => {
	if (!forceUpdate) return;
	forceUpdate();
}