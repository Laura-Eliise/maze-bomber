/** @jsx jsxTransform */
import { jsxTransform, m_for, m_if, VElement } from "../../mist/index"; // eslint-disable-line 

// Components
import SoundButtons from "./sound-buttons";

// Modules
import User from "../modules/objects/user";
import { WS_CONNECTION } from "../modules/websocket/websocket";
import { SOUNDS } from "../modules/objects/sounds";

/**
 * Represents the whole lobby state
 *
 * @param state - the application global state record
 *
 * @returns VElement
 */
const Lobby = (state: Record<string, unknown>): VElement => {
    return (
        <div class="menu-window">
            <div class="menu flex-column">

                <div class="lobby-details flex-column">
                    <p class="h2 font brightness" style="color: white; text-shadow: none;">Lobby</p>
                    {/* @ts-expect-error state expected unknown*/}
                    <p class="h3 font brightness" style="color: white; text-shadow: none; cursor: pointer" title={state.activeLobby.getLobbyId()} id="code" value={state.activeLobby.getLobbyId()} onClick={(): void => copyToClipboard(state)}>Lobby code: {state.activeLobby.getLobbyId()}</p> {// eslint-disable-line
                    }
                </div>

                <div class="lobby-buttons flex-column">
                    {/* @ts-expect-error state expected unknown*/}
                    {m_if(state.readyCounter > 0, (<div class="h2 font brightness" style="color: white; text-shadow: none; padding-bottom: 20px; position:absolute; top: 125px">You'll be readied in: {state.readyCounter}</div>))}

                    {/* @ts-expect-error state expected unknown*/}
                    {m_if(state.gameReadyCounter > 0, (<div class="h2 font brightness" style="color: white; text-shadow: none; padding-bottom: 20px; position:absolute; top: 125px">Game will start in: {state.gameReadyCounter}</div>))}

                    {/* @ts-expect-error state expected unknown*/}
                    <button class="button font h3" style="padding-left: 25px; margin-bottom: 2px" onClick={(): void => { toggleReady(state); }}>{isReady(state.user, state) ? "Unready" : "Ready"}</button>
                    <button class="button font h3" style="padding-left: 25px;" onClick={(): void => leaveLobby(state)}>Leave lobby</button>

                    {/* @ts-expect-error state expected unknown*/}
                    {m_if(state.activeLobby.getUsers().size == 1, (<div class="h3 font brightness" style="color: white; text-shadow: none; padding-bottom: 20px; position:absolute; top: 270px">Waiting for players...</div>))}
                </div>

                <div class="lobby-players">
                    {/* @ts-expect-error state expected unknown*/}
                    {m_for(makeArray(state), (user: User) => { return renderUserCharacter(user, state); })}
                </div>

            </div>

            {SoundButtons(state)}

        </div>
    );
};

export default Lobby;

/**
 * Copies the lobby code onto clipboard
 */
async function copyToClipboard(): Promise<void> {
    // @ts-expect-error never undefined
    const copyText: string = document.getElementById("code").title;

    await navigator.clipboard.writeText(copyText);
}

/**
 * Creates an array from lobby users map and returns array sorted based on user joining the lobby date
 *
 * @param state - the application global state record
 *
 * @returns array of lobby users
 */
function makeArray(state: Record<string, unknown>): User[] {
    // @ts-expect-error state expected unknown
    const users: User[] = Array.from(state.activeLobby.getUsers().values()); // eslint-disable-line 

    users.sort((a, b) => new Date(a.getJoinDate()).getTime() - new Date(b.getJoinDate()).getTime());

    return users;
}

/**
 * Renders a character with user's username and assigned colour in the lobby
 *
 * @param user - the user whose character must be rendered
 * @param state - the application global state record
 *
 * @returns VElement
 */
function renderUserCharacter(user: User, state: Record<string, unknown>): VElement {
    return (
        <div class="player flex-column">
            <div class="h2 font brightness" style="color: white; text-shadow: none;">
                {user.getUsername()}
            </div>
            <div class={isReady(user, state) ? "ready-character image" : "unready-character image"} style={getStyle(user, isReady(user, state))}></div>
        </div>
    );
}

/**
 * Returns the correct character image based on users ready state in the lobby
 *
 * @param user - the user whose character must be rendered
 * @param ready - users ready state
 *
 * @returns character image as style
 */
function getStyle(user: User, ready: boolean): string {
    if (ready) {
        return `background-image: url(src/assets/images/${user.getCharacter().getColor()}/win_${user.getCharacter().getColor()}.png)`;
    }
    else {
        return `background-image: url(src/assets/images/${user.getCharacter().getColor()}/lose_${user.getCharacter().getColor()}.png)`;
    }
}


/**
 * Return users ready state inside the active lobby
 *
 * @param user - the user whose ready state is targeted
 * @param state - the application global state record
 *
 * @returns users ready state as a boolean
 */
function isReady(user: User, state: Record<string, unknown>): boolean {
    // @ts-expect-error state expected unknown
    return state.activeLobby.getUserReadyState(user); // eslint-disable-line 
}

/**
 * Sends a signal through the websocket to leave from the lobby
 *
 * @param state - the application global state record
 */
function leaveLobby(state: Record<string, unknown>): void {
    SOUNDS?.playDing();
    // @ts-expect-error state expected unknown
    WS_CONNECTION?.sendMessage("leaveLobby", state.user.getUsername(), undefined, state.activeLobby.getLobbyId()); // eslint-disable-line 
}

/**
 * Sends a signal through the websocket to toggle the current user ready state inside the active lobby
 *
 * @param state - the application global state record
 */
function toggleReady(state: Record<string, unknown>): void {
    SOUNDS?.playDing();
    // @ts-expect-error state expected unknown
    WS_CONNECTION?.sendMessage("userToggleReady", state.user.getUsername(), state.user.getColor(), state.activeLobby.getLobbyId(), null, state.activeLobby.getUserReadyState(state.user)); // eslint-disable-line 
}