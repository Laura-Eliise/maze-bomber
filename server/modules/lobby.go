package modules

import (
	"strings"
)

// CreateLobby creates new game
func CreateLobby(data Data) {
	gameConfig := NewGameConfig()
	game := NewGame(gameConfig)

	user := GlobalClients.GetUser(UserId(data.UserId))
	user.ReadyState = false

	GlobalGames.Add(&game)

	LeaveLobby(data)

	data.GameId = string(game.GameId)
	JoinLobby(data)
}

// QuickPlay joins first lobby that has a free spot or creates a new lobby if all current lobbies are full
func QuickPlay(data Data) {
	games := GlobalGames.List()

	if len(games) == 1 {
		CreateLobby(data)
		return
	}

	for _, game := range games {

		game := GlobalGames.GetGame(GameId(game.GameId))

		if game.GameId == "global" {
			continue
		}
		if len(game.Players) < 4 && game.Status != InGame {
			LeaveLobby(data)
			data.GameId = string(game.GameId)
			JoinLobby(data)
			return
		}
	}
	
	CreateLobby(data)
}

// JoinLobby adds player to game lobby and send out messages to other players
func JoinLobby(data Data) {
	game := GlobalGames.GetGame(GameId(data.GameId))
	user := GlobalClients.GetUser(UserId(data.UserId))

	// Check if game is already full
	if (len(game.Players) >= 4 && game.GameId != "global") || game.Status == InGame {
		err := user.Conn.Send(Data{
			Type:    "lobbyError",
			Message: "Lobby is full or already in game!",
		})
		HandleError(err)
	}

	user.Time = CurrentTime()
	user.GameId = string(game.GameId)
	user.Color = RandColor(data.GameId)
	user.Lives = game.Config.Lives
	user.Powerups = NewPlayerPowerUps()
	GlobalGames.AddPlayer(game.GameId, user)

	// name for systemMessage 'Message' field
	chatName := "lobby"
	if game.GameId == "global" {
		chatName = "global"
	}

	err := user.Conn.Send(Data{
		Type:     "joinChat",
		Username: user.Username,
		Color:    user.Color,
		Message:  "Joined " + chatName + " chat",
		Date:     CurrentTime(),
	})
	HandleError(err)

	if game.GameId == "global" {
		return
	}

	err = GlobalGames.BroadcastToOtherGamePlayers(game.GameId, user.UserId, Data{
		Type:     "userJoinedLobby",
		Username: user.Username,
		UserId:   string(user.UserId),
		GameId:   string(game.GameId),
		Message:  user.Username + " joined the lobby",
		Color:    user.Color,
		Users:    GlobalGames.ListGamePlayers(game.GameId),
	})
	HandleError(err)

	err = user.Conn.Send(Data{
		Type:     "joinLobby",
		Username: user.Username,
		GameId:   string(game.GameId),
		Message:  user.Username + " joined the lobby",
		Color:    user.Color,
		UserId:   string(user.UserId),
		Users:    GlobalGames.ListGamePlayers(game.GameId),
	})
	HandleError(err)
}

// LeaveLobby removes player from game in GlobalGames and sends message to other players
func LeaveLobby(data Data) {
	user := GlobalClients.GetUser(UserId(data.UserId))

	GlobalGames.RemovePlayer(GameId(user.GameId), user.UserId)
	game := GlobalGames.GetGame(GameId(user.GameId))
	user.ReadyState = false

	msgType := "Lobby"
	if game.Status == InGame {
		msgType = "Game"
	}

	if game.GameId == "global" {
		return
	}

	if len(game.Players) == 0 {
		GlobalGames.Del(game.GameId)
	} else {
		err := GlobalGames.BroadcastToGame(GameId(user.GameId), Data{
			Type:     "userLeft" + msgType,
			UserId:   string(user.UserId),
			Message:  user.Username + " left the chat",
			Username: user.Username,
			GameId:   user.GameId,
			Date:     CurrentTime(),
			Color:    user.Color,
			Users:    GlobalGames.ListGamePlayers(game.GameId),
		})
		HandleError(err)

		ReadyToPlay(data)
		if game.Status == InGame && len(game.AlivePlayers()) == 1 {
			GameOver(game.GameId)
		}
	}

	chat := Data{
		Type:     "leave" + msgType,
		Message:  user.Username + " left the chat",
		Username: user.Username,
		Date:     CurrentTime(),
		Color:    user.Color,
	}

	err := user.Conn.Send(chat)
	HandleError(err)
}

// LobbyExists check if lobby exist in GlobalGames
func LobbyExists(data Data, conn *Connection) bool {
	gameId := GameId(strings.ToLower(data.GameId))
	gameExists := GlobalGames.Exists(gameId)
	if !gameExists {
		message := Data{Type: "lobbyError", Message: "Lobby does not exist!"}
		err := conn.Send(message)
		HandleError(err)
	}
	return gameExists
}
