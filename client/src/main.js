import { createApp, createStore } from "../mist/index";
import router from "./router/index.js";
import { connectWs } from "./modules/websocket/websocket";
import User from "./modules/objects/user";
import Lobby from "./modules/objects/lobby";
import Game from "./modules/objects/game"
import { setupSounds, SOUNDS } from "./modules/objects/sounds";

/** Establish Websocket connection to backend */
connectWs()

/* Launch application sounds */
setupSounds()

const placeHolderUser = new User("example", "#70C36D", "example")

export const placeHolderLobby = new Lobby("example", [placeHolderUser])
const placeHolderGame = new Game()

/** Initialize state */
createStore({
    /* --------------------- GAME STATE --------------------- */

    gameState: "pre-menu",

    /* --------------------- CHAT --------------------- */
   
    messages: [],

    /* --------------------- USER --------------------- */
    
    user: null,

    /* --------------------- LOBBY --------------------- */
   
    activeLobby: placeHolderLobby,
    readyCounter: 0,
    gameReadyCounter: 0,

    /* --------------------- GAME --------------------- */
    
    activeGame: placeHolderGame,
    gameCounter: 0,
    winner: placeHolderUser,

    /* --------------------- SOUNDS  --------------------- */
    
    musicStatus: SOUNDS.getMusicStatus(),
    fxStatus: SOUNDS.getFxStatus()
});

createApp("#app", router);