import { force_update, store } from "../../../mist";
import { startGameCounter } from "../../components/gameStats";

// Modules
import { getRandomColour } from "../../components/pre-menu";
import Lobby from "../objects/lobby";
import { SOUNDS } from "../objects/sounds";
import User from "../objects/user";
import { WS_CONNECTION } from "./websocket";

/**
 * Creates a new lobby in the state with the data received from backend WS connection
 * 
 * @param data data received through websocket connection
 */
export function joinLobby(data: Record<string, unknown>): void {
    let users: User[] = [];
    // let readyStates = new Map<User, boolean>([])

    //@ts-expect-error
    for (const user of data.Users) {
        const tempU = new User(user.Username, user.Color, user.UserId, user.ReadyState, user.Time)

        //@ts-expect-error
        if (tempU.getUserId() == store.user.getUserId()) {
            //@ts-expect-error
            store.user.setColor(tempU.getColor())
        }

        users.push(tempU)
    }

    //@ts-expect-error
    store.activeLobby = new Lobby(data.GameId, users)

    store.gameState = "lobby"
    force_update()
}

/**
 * Adds a system message into global state 
 * 
 * @param data data recieved through websocket connection
 */
export function sendSystem(data: Record<string, unknown>): void {

    //@ts-expect-error
    store.messages.unshift({
        system: true,
        sender: "system",
        content: data.Message,
        color: "gray",
        date: data.Date,
    });

    if (store.user && data.Message == "Joined global chat") {
        //@ts-expect-error
        store.user.setColor(getRandomColour())
    }

    force_update()
}

/**
 * Adds a user message into global state 
 * 
 * @param data data recieved through websocket connection
 */
export function sendMessage(data: Record<string, unknown>): void {
    //@ts-expect-error
    store.messages.unshift({
        system: false,
        sender: data.Username,
        content: data.Message,
        color: data.Color,
        date: data.Date,
    })

    force_update()
}

/**
 * Holds users lobby local ready counter
 */
let userReadyCounter: any = undefined

/**
 * Holds the lobbys game counter
 */
let gameReadyCounter: any = undefined

/**
 * Starts the user ready counter inside the lobby
 */
export function startUserCounter(): void {
    store.readyCounter = 20
    userReadyCounter = setInterval(userTimer, 1000)
}

/**
 * setInterval callBack function which will check if ready counter has reached 0, after it has, sends out userToggleReady signal through the websocket
 */
export function userTimer(): void {
    //@ts-expect-error
    store.readyCounter--
    if (store.readyCounter == 0) {
        stopUserCounter()
        //@ts-expect-error
        WS_CONNECTION?.sendMessage("userToggleReady", store.user.getUsername(), store.user.getColor(), store.activeLobby.getLobbyId(), null, store.activeLobby.getUserReadyState(store.user))
    }
}

/**
 * Stops the user ready counter inside the lobby
 */
export function stopUserCounter(): void {
    clearInterval(userReadyCounter)
    userReadyCounter = null
    store.readyCounter = 0
}

/**
 * Starts the game countdown counter
 */
export function startGameReadyCounter(): void {
    store.gameReadyCounter = 10
    gameReadyCounter = setInterval(gameTimer, 1000)
}

/**
 * setInterval callBack funcion which will check if game counter has reached 0, after it has, sends out start game signal through the websocket
 */
export async function gameTimer(): Promise<void> {
    //@ts-expect-error
    store.gameReadyCounter--
    if (store.gameReadyCounter == 0) {
        stopGameReadyCounter()
        
		//@ts-expect-error
		WS_CONNECTION?.sendMessage("startGame", store.user.username, store.user.color, store.activeLobby.getLobbyId())
    }
}

/**
 * Stops the game countdown counter
 */
export function stopGameReadyCounter(): void {
    clearInterval(gameReadyCounter)
    gameReadyCounter = null
    store.gameReadyCounter = 0
}

/**
 * Sets the game up and starts the game
 * 
 * @param data - socket data
 */
export function startGame(data: unknown): void {
    //@ts-expect-error
    store.activeGame.clear();
    
    //@ts-expect-error
    Object.values(data.GameInfo.Players).forEach(element => {
		// @ts-expect-error
        store.activeGame.setUser(new User(element.Username, element.Color, element.UserId))
    	//@ts-expect-error
		store.activeGame.move(element.UserId, element.Position);
    });
    
    //@ts-expect-error
    store.activeGame.start(store.lobbyId, data.GameInfo.Grid, data.Date);
    store.gameState = "game"

    if (SOUNDS?.getMusicStatus()) {
        SOUNDS.playMusic()
    }

    startGameCounter()
}