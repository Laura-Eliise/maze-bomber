/** @jsx jsxTransform */
import { jsxTransform, m_if_else, VElement } from "../../mist/index"; // eslint-disable-line 

/**
 * Represents one message inside the chat which can either be a system message or user message
 *
 * @param message - message details
 *
 * @returns VElement
 */
const Message = (message: { system: boolean, sender: string | null, content: string, color: string }): VElement => {
    return (
        m_if_else(message.system, SystemMessage(message), UserMessage(message))
    );
};

export default Message;


/**
 * Represents a system message which will be sent out when a user joins the global chat or a lobby chat
 *
 * @param message - message details
 *
 * @returns VElement
 */
const SystemMessage = (message: { system: boolean, sender: string | null, content: string, color: string }): VElement => {
    return (
        <div class="message-div font h3">
            <div class="message-content" style={`color: ${message.color}`}>
                {message.content}
            </div>
        </div>
    );
};

/**
 * Represents message that a user has sent out
 *
 * @param message - message details
 *
 * @returns VElement
 */
const UserMessage = (message: { system: boolean, sender: string | null, content: string, color: string }): VElement => {
    return (
        <div class="message-div font h3">
            <div class="message-sender" style={`color: ${message.color}`}>
                {message.sender}
            </div>
            <div class="message-content">
                {message.content}
            </div>
        </div>
    );
};