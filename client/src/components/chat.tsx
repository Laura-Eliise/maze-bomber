/** @jsx jsxTransform */
import { jsxTransform, m_for, VElement } from "../../mist/index"; // eslint-disable-line 

// Components
import Message from "./message";

// Modules
import { WS_CONNECTION } from "../modules/websocket/websocket";

/**
 * Represents the whole chat window
 *
 * @param state - the application global state record
 *
 * @returns VElement
 */
const Chat = (state: Record<string, unknown>): VElement => {
    return (
        <div class="game-chat">
            <div id="message-box" class="message-box">
                {/* @ts-expect-error state expected unknown*/}
                {m_for(state.messages, (message: { system: boolean; sender: string | null; content: string; color: string; }) => { return Message(message);})}
            </div>
            <input id="chat-input" class="chat-input font h3" placeholder={getPlacerholder(state)} onKeyDown={(e: KeyboardEvent): void => sendMessage(state, e)}></input>
        </div>
    );
};

export default Chat;

/**
 * Returns input field placeholder text
 *
 * @param state - the application global state record
 *
 * @returns Placeholder text for input field based of if user has registered or not
 */
function getPlacerholder(state: Record<string, unknown>): string {
    const element = document.getElementById("chat-input");

    if (element) {
        // @ts-expect-error never null
        element.disabled = state.user ? false : true;
    }

    return state.user ? "Enter text" : "Enter username to chat";
}

/**
 * Sends a message through the websocket
 *
 * @param state - the application global state record
 * @param event - A keyboard onKeyDown event
 */
function sendMessage(state: Record<string, unknown>, event: KeyboardEvent): void {
    if (event.key != "Enter") return;

    if (!state.user) return;

    // @ts-expect-error never null
    if (event.target.value.trim().length == 0) return; // eslint-disable-line

    // @ts-expect-error state expected unknown
    WS_CONNECTION?.sendMessage("sendMessage", state.user.getUsername(), state.user.getColor(), null, event.target.value); // eslint-disable-line

    // @ts-expect-error never null
    event.target.value = "";
}
