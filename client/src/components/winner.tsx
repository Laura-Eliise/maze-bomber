/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../mist/index";

/**
 * Represents the whole winner state
 *
 * @param state - the application global state record
 *
 * @returns VElement
 */
const Winner = (state: Record<string, unknown>): VElement => { // eslint-disable-line
    return (
        <div class="menu-window">
            <div class="menu flex-column">
                <div class="lobby-buttons flex-column" style="margin-bottom: 35px">
                    {/* @ts-expect-error state expected unknown*/}
                    <div class="h2 font brightness" style="color: white; text-shadow: none;">{gotWinner(state) ? state.winner.getUsername() : ""}</div>
                    <div class="ready-character image" style={getStyle(state)}></div>
                    <div class="winner font">{gotWinner(state) ? "Winner" : "Draw"}</div>
                </div>
            </div>
        </div>
    );
};

export default Winner;

/**
 * Returns the winning users character colour png
 *
 * @param state - the application global state record
 *
 * @returns character image as style
 */
function getStyle(state: Record<string, unknown>): string {
    if (gotWinner(state)) {
        // @ts-expect-error state expected unknown
        return `background-image: url(src/assets/images/${state.winner.getCharacter().getColor()}/win_${state.winner.getCharacter().getColor()}.png)`;
    }

    return "background-image: url(/src/assets/images/win_white.png)";
}

/**
 * Checks if there is a winner or it was a draw
 *
 * @param state - the application global state record
 * @returns a bool whether there is a winner or it is a draw
 */
function gotWinner(state: Record<string, unknown>): boolean {
    if (state.winner == "draw") {
        return false;
    }
    else {
        return true;
    }
}