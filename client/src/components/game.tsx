/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../mist/index"; // eslint-disable-line 
import GameStats from "./gameStats";

/**
 * Represents the whole game state
 *
 * @param state - the application global state record
 *
 * @returns VElement
 */
const Game = (state: Record<string, unknown>): VElement => {
    return (
        <div class="game-window">
            {/* @ts-expect-error state expected unknown*/}
            {state.activeGame.getHTML()}
            {GameStats(state)}
        </div>
    );
};

export default Game;