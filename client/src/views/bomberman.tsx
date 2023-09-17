/** @jsx jsxTransform */
import { jsxTransform, m_if, VElement } from "../../mist/index"; // eslint-disable-line 

// Components
import Chat from "../components/chat";
import Game from "../components/game";
import Lobby from "../components/lobby";
import Menu from "../components/menu";
import PreMenu from "../components/pre-menu";
import Winner from "../components/winner";

/**
 * Represents the whole application aka Bomberman game
 *
 * @param state - the application global state record
 *
 * @returns VElement
 */
const Bomberman = (state: Record<string, unknown>): VElement => {
    return (
        <div class={getGameBoard(state)}>
            {m_if(state.gameState == "pre-menu", (PreMenu(state)))}

            {m_if(state.gameState == "menu", (Menu(state)))}

            {m_if(state.gameState == "lobby", (Lobby(state)))}

            {m_if(state.gameState == "game", (Game(state)))}

            {m_if(state.gameState == "winner", (Winner(state)))}

            {Chat(state)}
        </div>
    );
};

export default Bomberman;

/**
 * Returns the correct gameboard image class based of the game state
 *
 * @param state - the application global state record
 *
 * @returns the name of the class
 */
function getGameBoard(state: Record<string, unknown>): string {
    return state.gameState == "game" ? "game-board" : "game-menu-board";
}
