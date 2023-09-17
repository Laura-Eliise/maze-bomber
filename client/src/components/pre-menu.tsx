/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../mist/index"; // eslint-disable-line 

// Modules
import { WS_CONNECTION } from "../modules/websocket/websocket";
import { SOUNDS } from "../modules/objects/sounds";

/**
 * Represents the whole pre-menu state
 *
 * @param state - the application global state record
 *
 * @returns VElement
 */
const PreMenu = (state: Record<string, unknown>): VElement => { // eslint-disable-line
    return (
        <div class="menu-window">
            <div class="menu flex-column">
                <div class="flex-column">
                    <button class="button font h3" style="padding-left: 25px; margin-bottom: 10px" onClick={(): void => createUser()}>Start Game</button>
                    <input id="name-input" maxlength="12" placeholder="Enter username" class="name-input font h3"></input>
                </div>
            </div>
        </div>
    );
};

export default PreMenu;

/**
 * Sends a signal through the websocket to create a new user in state with the name written in the input field
 */
function createUser(): void {
    SOUNDS?.playDing();

    // @ts-expect-error never undefined
    const username: string = document.getElementById("name-input")?.value;

    if (!validateUsername(username)) {
        return alert("Please enter a username");
    }

    SOUNDS?.playMusic();

    WS_CONNECTION?.sendMessage("authenticate", username, getRandomColour());
}

/**
 * Validates a username to be actually letters and not space characters
 *
 * @param name - the name a potential user has decided to submit
 *
 * @returns a boolean indicating whether the validation passed or not
 */
function validateUsername(name: string): boolean {
    if (name.trim().length > 0) {
        return true;
    }
    return false;
}

/**
 * Returns a randomly generated hex colour code
 *
 * @returns a random colour
 */
export function getRandomColour(): string {
    const color = "#" + Math.floor(Math.random() * 16777215).toString(16);

    if (color === "#eeeeee" || color.length < 7) {
        return getRandomColour();
    }

    return color;
}
