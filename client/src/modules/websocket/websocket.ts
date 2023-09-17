import { force_update, store } from "../../../mist";
import { stopGameCounter } from "../../components/gameStats";

// Modules
import User from "../objects/user";
import { joinLobby, sendMessage, sendSystem, startUserCounter, startGameReadyCounter, stopUserCounter, stopGameReadyCounter, startGame } from "./responses";
import Game from "../objects/game"
import { move } from "./movement";
import { SOUNDS } from "../objects/sounds";

export class WSConnection {
  connection = new WebSocket(`ws://localhost:${import.meta.env.VITE_BACKEND_PORT}/websocket`);

  /**
   * Represents a Web Socket connection to a socket server
   * 
   */
  constructor() {
    this.connection.onmessage = this.onMessage;
  }

  /**
   * Listens to Web Socket MessageEvents
   * 
   * @param ev the event that comes through the socket
   */
  onMessage = async (ev: MessageEvent): Promise<void> => {
    let data = JSON.parse(ev.data);


    switch (data.Type) {
      /* ------------------------- USER -------------------------*/
      case "createUser":
        const user = new User(data.Username, data.Color, data.UserId)
        store.user = user
        store.gameState = "menu"
        break;

      /* ------------------------- CHAT -------------------------*/
      case "joinChat":
        sendSystem(data)
        break;

      case "message":
        sendMessage(data)
        break;

      /* ------------------------- LOBBY -------------------------*/
      case "joinLobby":
        joinLobby(data)
        startUserCounter()
        break;

      case "lobbyError":
        alert(data.Message);
        break;

      case "leaveLobby":
        //@ts-expect-error
        store.activeLobby = store.activeLobby.leaveLobby();
        store.gameState = "menu";
        if (SOUNDS?.getMusicStatus()) {
          SOUNDS.playMusic()
        }
        stopUserCounter()
        stopGameReadyCounter()
        force_update()
        break;

      case "userJoinedLobby":
        joinLobby(data)
        stopGameReadyCounter()
        force_update()
        break;

      case "userLeftLobby":
        joinLobby(data)
        stopGameReadyCounter()
        force_update()
        break;

      case "userToggleReady":
        const currentU = new User(data.Username, data.Color, data.UserId)
        //@ts-expect-error
        store.activeLobby.toggleUserReady(currentU, data.ReadyState)

        if (data.Message == "All players are ready to play") {
          startGameReadyCounter()
        }

        if (!data.ReadyState) {
          stopGameReadyCounter()
        }

        force_update()
        break

      /* ------------------------- GAME -------------------------*/
      case "startGame":
        startGame(data)
        requestAnimationFrame(move)
        break

      case "userLeftGame":
        force_update()
        break

      case "leaveGame":
        store.gameState = "menu";
        store.activeGame = new Game()
        if (SOUNDS?.getMusicStatus()) {
          SOUNDS.playMusic()
        }
        stopGameCounter()
        force_update()
        break

      case "shrinkMap":
        /* @ts-expect-error */
        store.activeGame.update(data.GameInfo.Grid);
        /* @ts-expect-error */
        store.activeGame.move(data.UserId, data.Position, data.Message);
        break

      case "move":
        /* @ts-expect-error */
        store.activeGame.move(data.UserId, data.Position, data.Message);
        break

      case "loseLife":
        /* @ts-expect-error */
        store.activeGame.loseLife(data.UserId, data.GameInfo.Players[data.UserId].Lives)
        break

      case "bombPlaced":
        /* @ts-expect-error */
        store.activeGame.placeBomb(data.UserId, data.Bomb.Position);
        break

      case "bombExploded":
        /* @ts-expect-error */
        store.activeGame.explodeBomb(data.Bomb.UserId, data.Bomb.Position, data.Bomb.ExplosionArea, data.GameInfo.Grid)
        break

      case "updateGrid":
        /* @ts-expect-error */
        store.activeGame.update(data.GameInfo.Grid)
        break
      case "gameOver":
        stopGameCounter()

        store.gameState = "winner"

        if (data.Message == "win") {

          store.winner = new User(data.Users[0].Username, data.Users[0].Color, data.Users[0].userId)

        } else {
          store.winner = "draw"
        }

        force_update()
    }
  };


  /**
   * Method to send data through the socket to the socket server
   * 
   * @param type - the type of socket message
   * @param username - the users username
   * @param color - the users color
   * @param gameId - the game id
   * @param message - the message
   * @param readyState - the ready status of the user
   */
  sendMessage = (
    type: string,
    username?: string,
    color?: string,
    gameId?: string,
    message?: string,
    readyState?: boolean,
  ): void => {
    this.connection.send(
      JSON.stringify({
        Type: type,
        Username: username,
        Color: color,
        GameId: gameId,
        Message: message,
        ReadyStatus: readyState,
      })
    );
  };
}

/**
 * Initiated a new websocket connection to designated address and assigns it to a global variable
 */
export const connectWs = (): void => {
  WS_CONNECTION = new WSConnection();
};

/**
 * Holds a global websocket connection
 */
export let WS_CONNECTION: WSConnection | undefined;
