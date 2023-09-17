/** @jsx jsxTransform */
import { jsxTransform, m_for, m_if_else, store, VElement } from "../../mist/index"; // eslint-disable-line 
import { SOUNDS } from "../modules/objects/sounds";
import User from "../modules/objects/user";
import { WS_CONNECTION } from "../modules/websocket/websocket";
import { toggleFx, toggleMusic } from "./sound-buttons";

/**
 * Represents one game duration
 */
const gameDuration = 180;

/**
 * Represents the stats section of an active game
 *
 * @param state - the application global state record
 *
 * @returns VElement
 */
const GameStats = (state: Record<string, unknown>): VElement => {
    return (
        <div class="game-stats">

            {Players(state)}

            {Timer(state)}

            {Buttons(state)}

        </div>
    );
};

export default GameStats;

/**
 * Represents all the players in the game
 *
 * @param state - the application global state record
 * @returns VElement
 */
const Players = (state: Record<string, unknown>): VElement => {
    return (
        <div class="game-stats-players">

            {/* @ts-expect-error state expected unknown*/}
            {m_for(prepareData(state.activeGame.getUsers()), (player: unknown) => { return Player(player); })}

        </div>
    );
};

/**
 * Prepares the data to always contain 4 players
 *
 * @example
 * // if there are only 2 players, the last 2 spots will be filled with mock disabled users
 *
 * @param array - the games array of users
 * @returns a formatted array of users
 */
function prepareData(array: User[]): User[] {

    for (const _ of array) { // eslint-disable-line
        if (array.length == 4) {
            return array;
        }
        array.push(new User("disabled", "disabled", "disabled"));
    }

    return array;
}

/**
 * Represents one player in the games players
 *
 * @param player - the player targetd
 * @returns VElement
 */
const Player = (player: User): VElement => {
    return (

        m_if_else(player.getUserId() != "disabled",


            m_if_else(player.getCharacter().getHealth() > 0,
                <div class="stats-player">
                    <div class="portrait-1 image" style={getColoredImage(player.getCharacter().getColor())}></div>

                    <div class="stats-player-lives game-stats-text">

                        {player.getCharacter().getHealth()}
                    </div>

                </div>
                ,
                <div class="stats-player">
                    <div class="portrait-dead image"></div>

                    <div class="stats-player-lives game-stats-text">
                        {player.getCharacter().getHealth()}
                    </div>

                </div>

            ),

            <div class="stats-player">

                <div class="portrait-dead image"></div>

                <div class="stats-player-lives game-stats-text"></div>

            </div>)
    );
};

/**
 * Returns the user character portrait based on their character color
 *
 * @param color - the color of the users character
 * @returns the correct background-image
 */
function getColoredImage(color: string): string {
    return `background-image: url(src/assets/images/${color}/${color}_portrait.png)`;
}

/**
 * Represents the game timer and the visual bar
 *
 * @param state - the application global state record
 * @returns VElement
 */
const Timer = (state: Record<string, unknown>): VElement => {
    return (
        <div class="game-stats-timer">

            <div class="stats-time game-stats-text">
                {/* @ts-expect-error state expected unknown*/}
                {formatTimer(state.gameCounter)}
            </div>

            <div class="stats-time-bar-container">
                {/* @ts-expect-error state expected unknown*/}
                <div class="stats-time-bar" style={barProgress(state.gameCounter)}></div>
            </div>

        </div>
    );
};

/**
 * Formats he current game time into a string
 *
 * @param time - the current game counter
 * @returns a formatted time string 0:00
 */
function formatTimer(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = time - minutes * 60;

    if (seconds < 10) {
        return `${minutes}:0${seconds}`;
    }
    else {
        return `${minutes}:${seconds}`;
    }
}

/**
 * Returns visual time bars progress based on the game counter time
 *
 * @param time - the game counter time
 * @returns a inline style string with percent
 */
function barProgress(time: number): string {
    const percent = time / gameDuration * 100;

    return `width: ${percent}%`;
}

/**
 * Global variable for holding game counter setInterval
 */
let gameCounter: any = undefined; // eslint-disable-line

/**
 * Starts the game stats counter
 */
export function startGameCounter(): void {
    store.gameCounter = gameDuration;
    gameCounter = setInterval(gameTimer, 1000);
}

/**
 * setInterval callBack function which will check if game counter has reached 0, after it has, sends out stop game signal through the websocket
 */
function gameTimer(): void {
    // @ts-expect-error state expected unknown
    store.gameCounter--;

    // @ts-expect-error state expected unknown
    if (store.gameCounter == 0 || Date.now() >= new Date(store.activeGame.getEndtime()).getTime()) {
        stopGameCounter();
    }
}

/**
 * Stops the game counter
 */
export function stopGameCounter(): void {
    clearInterval(gameCounter); // eslint-disable-line
    gameCounter = null;
    store.gameCounter = 0;
}

/**
 * Represents game stats music, fx and quit buttons.
 *
 * @param state - the application global state record
 * @returns VElement
 */
const Buttons = (state: Record<string, unknown>): VElement => {
    return (
        <div class="game-stats-buttons">

            <div class="o-button font h3 m-button" style={getMusicButtonStyle(state)} onClick={(): void => toggleMusic()}>
                Music
            </div>

            <div class="o-button font h3 fx-button" style={getFxButtonStyle(state)} onClick={(): void => toggleFx()}>
                FX
            </div>

            <div class="quit-button font h3" onClick={(): void => leaveGame()}>
                Quit
            </div>

        </div>
    );
};

/**
 * Returns a disabled look or enabled look for music toggle button
 *
 * @param state - the application global state record
 * @returns a style string
 */
function getMusicButtonStyle(state: Record<string, unknown>): string {
    if (!state.musicStatus) {
        return "filter: brightness(70%)";
    }
    return "";
}

/**
 * Returns a disabled look or enabled look for fx toggle button
 *
 * @param state - the application global state record
 * @returns a style string
 */
function getFxButtonStyle(state: Record<string, unknown>): string {
    if (!state.fxStatus) {
        return "filter: brightness(70%)";
    }
    return "";
}

/**
 * Asks for a confirmation to then either leave the game or not. Sends a socket message
 *
 * @param state - the application global state record
 */
function leaveGame(): void {
    SOUNDS?.playDing();

    if (confirm("Are you sure you want to leave the game?")) {

        // @ts-expect-error expected possible undefiend
        WS_CONNECTION.sendMessage("leaveGame");
        return;
    }

    return;
}