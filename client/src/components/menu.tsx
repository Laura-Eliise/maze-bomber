/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../mist/index"; // eslint-disable-line 

// Components
import SoundButtons from "./sound-buttons";

// Modules
import { WS_CONNECTION } from "../modules/websocket/websocket";
import { SOUNDS } from "../modules/objects/sounds";

/**
 * Represents the whole menu state
 *
 * @param state - the application global state record
 *
 * @returns VElement
 */
const Menu = (state: Record<string, unknown>): VElement => {
    return (
        <div class="menu-window">
            <div class="menu flex-column">
                <div class="flex-column">
                    <button class="button font h3" style="padding-left: 25px; margin-bottom: 20px" onClick={(): void => joinQuickPlay(state)}>Quick Play</button>
                    <input id="code-input" placeholder="Lobby code" class="name-input font h3"></input>
                    <button class="button font h3" style="padding-left: 25px; margin-bottom: 2px" onClick={(): void => joinLobby(state)}>Join Lobby</button>
                    <button class="button font h3" style="padding-left: 25px;" onClick={(): void => createLobby(state)}>Create Lobby</button>
                </div>
            </div>

            {SoundButtons(state)}

        </div>
    );
};

export default Menu;

/**
 * Sends a signal through the websocket to quick play and create or join an existing lobby
 *
 * @param state - the application global state record
 */
function joinQuickPlay(state: Record<string, unknown>): void {
    SOUNDS?.playDing();
    // @ts-expect-error state expected unknown
    WS_CONNECTION?.sendMessage("quickPlay", state.user.getUsername(), state.user.getColor()); // eslint-disable-line 
}

/**
 * Sends a signal through the websocket to join a specific lobby using a code from input field
 *
 * @param state - the application global state record
 */
function joinLobby(state: Record<string, unknown>): void {
    SOUNDS?.playDing();
    // @ts-expect-error never undefined
    const code: string = document.getElementById("code-input")?.value;

    // @ts-expect-error state expected unknown
    WS_CONNECTION?.sendMessage("joinLobby", state.user.getUsername(), state.user.getColor(), code); // eslint-disable-line 
}

/**
 * Sends a signal through the websocket to create a new lobby
 *
 * @param state - the application global state record
 */
function createLobby(state: Record<string, unknown>): void {
    SOUNDS?.playDing();
    // @ts-expect-error state expected unknown
    WS_CONNECTION?.sendMessage("createLobby", state.user.getUsername(), state.user.getColor()); // eslint-disable-line 
}