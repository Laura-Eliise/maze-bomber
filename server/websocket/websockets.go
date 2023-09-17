package websocket

import (
	"bomberman_dom/server/logger"
	mod "bomberman_dom/server/modules"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// WsEndpoint creates a WS connection from a HTTP request
func WsEndpoint(w http.ResponseWriter, r *http.Request) {

	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	wsconn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		mod.HandleError(err)
	}

	logger.Log("New user connected")
	conn := mod.Connection{
		Conn: wsconn,
	}

	user := mod.User{
		Conn:   &conn,
		UserId: mod.UserId(uuid.NewString()),
		GameId: "global",
	}

	mod.GlobalClients.Add(&user)
	data := mod.Data{
		UserId: string(user.UserId),
		GameId: user.GameId,
	}
	mod.JoinLobby(data)

	WsReader(&conn, user.UserId)
}

// WebsocketClosed removes player when ws connection has been stopped
func WebsocketClosed(uId mod.UserId, conn *mod.Connection) {
	user := mod.GlobalClients.GetUser(uId)

	data := mod.Data{
		UserId: string(uId),
		GameId: user.GameId,
	}

	mod.LeaveLobby(data)
	// if current game was not global then remove player from global 'game' (lobby) as well
	if user.GameId != "global" {
		user.GameId = "global"
		mod.LeaveLobby(data)
	}

	mod.GlobalClients.Del(uId)
	conn.Conn.Close()
}

// WsReader recieves all incoming data from client
func WsReader(conn *mod.Connection, userId mod.UserId) {
	go func() {
		for {
			var data mod.Data

			err := conn.Conn.ReadJSON(&data)
			data.UserId = string(userId)
			if err != nil {
				WebsocketClosed(userId, conn)
				return
			}

			switch data.Type {

			/* ======================== CHATS ========================*/
			case "authenticate":
				mod.Authenticate(data)
			case "sendMessage":
				mod.SendMessage(data)

			/* ======================== LOBBIES ========================*/
			case "joinLobby":
				if !(mod.LobbyExists(data, conn)) {
					break
				}
				mod.LeaveLobby(data)
				mod.JoinLobby(data)
			case "createLobby":
				mod.CreateLobby(data)
			case "quickPlay":
				mod.QuickPlay(data)
			case "userToggleReady":
				mod.ToggleUserReady(data)
				mod.ReadyToPlay(data)
			case "startGame":
				mod.StartGame(data)
			case "leaveGame":
				fallthrough
			case "leaveLobby":
				mod.LeaveLobby(data)
				data.GameId = "global"
				mod.JoinLobby(data)

			/* ======================== IN GAME ========================*/
			case "move":
				mod.MovePlayer(data)
			case "bombPlaced":
				mod.BombPlaced(data)

			default:
				logger.Error(err)
			}
		}
	}()
}
