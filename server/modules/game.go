package modules

import (
	"bomberman_dom/server/logger"
	"errors"
	"fmt"
	"time"
)

const (
	InLobby GameStatus = iota
	InGame
	GameEnded
)

type GameStatus int

// Game contains game data
type Game struct {
	GameId           GameId
	Status           GameStatus
	Players          map[UserId]*User
	Grid             Grid
	ActivePowerUps   Grid
	Config           GameConfig
	BarrelsBroken    int
	BarrelContents   []PowerupName
	ActiveExplosions Grid
}

// GameConfig contains variables which affect the game that will be created
type GameConfig struct {
	Powerups      map[PowerupName]Powerup
	GridConfig    GridConfig
	GameId        GameId
	CharacterSize int
	Lives         int
}

// ReadyToPlay checks and sends back message about lobby player ready state
func ReadyToPlay(data Data) {
	user := GlobalClients.GetUser(UserId(data.UserId))
	game := GlobalGames.GetGame(GameId(user.GameId))
	message := "All players are ready to play"

	for _, player := range game.Players {
		if !player.ReadyState {
			message = "All players must be ready to play"
		}
	}

	if len(game.Players) == 1 {
		message = "You need one more player to start the game!"
	}

	sendData := Data{
		Type:       "userToggleReady",
		Username:   user.Username,
		GameId:     string(game.GameId),
		UserId:     string(user.UserId),
		ReadyState: user.ReadyState,
		Message:    message,
		Color:      user.Color,
	}

	err := GlobalGames.BroadcastToGame(game.GameId, sendData)
	HandleError(err)
}

// ToggleUserReady Changes user ready state to opposite
func ToggleUserReady(data Data) {
	user := GlobalClients.GetUser(UserId(data.UserId))
	user.ReadyState = !user.ReadyState
}

// StartGame Set player positions, starts game timer
func StartGame(data Data) {
	user := GlobalClients.GetUser(UserId(data.UserId))
	game := GlobalGames.GetGame(GameId(user.GameId))
	if game.Status == InGame {
		logger.Log("WTF")
		return
	}

	game.Status = InGame
	// set all users positions
	game.SetPlayerPositions()

	// Send back game info, and end time of the game
	sendData := Data{
		Type:     "startGame",
		GameInfo: game.PrepareForSend(),
		Date:     time.Now().Add(time.Minute * 3).Format("2006-01-02 15:04:05"),
	}

	err := GlobalGames.BroadcastToGame(game.GameId, sendData)
	HandleError(err)

	GameTimer(game)
}

// GameTimer Checks timer, skrinks map after specific time, updates grid with wall blocks, removes player lifes, if caught in the wall 
func GameTimer(game *Game) {
	shrinkOrder := game.ShrinkGridOrder()
	innerArea := (game.Config.GridConfig.Width - 6) * (game.Config.GridConfig.Height - 6)
	outerCirclesTileAmount := (game.Config.GridConfig.Width-2)*(game.Config.GridConfig.Height-2) - innerArea

	gridShrinkTime := 90 * time.Second
	gameEndTime := 3 * time.Minute
	endShrinkTime := gameEndTime - time.Duration((innerArea*50))*time.Millisecond

	// Outer 2 circle shrink
	go func() {
		time.Sleep(gridShrinkTime)
		timeToWait := (30 * time.Second) / time.Duration(outerCirclesTileAmount)
		for i := 0; i < outerCirclesTileAmount; i++ {
			if !GlobalGames.Exists(game.GameId) {
				return
			}
			// Change tile to wall Block
			var X, Y = shrinkOrder[i].X, shrinkOrder[i].Y
			game.Grid[Y][X] = game.Config.GridConfig.WallBlock
			game.ActivePowerUps[Y][X] = game.Config.GridConfig.EmptyBlock

			// Send new game map to players
			err := GlobalGames.BroadcastToGame(game.GameId, Data{
				Type:     "shrinkMap",
				GameInfo: game.PrepareForSend(),
			})
			HandleError(err)

			var tileSize = game.Config.GridConfig.Tilesize
			var userSize = game.Config.CharacterSize
			var tileX, tileY = X * tileSize, Y * tileSize

			// If any user inside block, lose all lives
			for _, user := range GlobalGames.ListGamePlayers(game.GameId) {
				var userX, userY = user.Position.X, user.Position.Y
				if userX+userSize > tileX && userX < tileX+tileSize &&
					userY+userSize > tileY && userY < tileY+tileSize {
					// Lose all lives
					game.LoseLife(GlobalClients.GetUser(user.UserId), game.Config.Lives)
				}
			}

			time.Sleep(timeToWait)
		}
	}()
	
	go func() {
		time.Sleep(endShrinkTime)
		for i := outerCirclesTileAmount; i < len(shrinkOrder); i++ {
			if !GlobalGames.Exists(game.GameId) {
				return
			}

			// Change tile to wall Block
			var X, Y = shrinkOrder[i].X, shrinkOrder[i].Y
			game.Grid[Y][X] = game.Config.GridConfig.WallBlock

			// Send new game map to players
			err := GlobalGames.BroadcastToGame(game.GameId, Data{
				Type:     "shrinkMap",
				GameInfo: game.PrepareForSend(),
			})
			HandleError(err)

			time.Sleep(50 * time.Millisecond)
		}
		GameOver(game.GameId)
	}()
}

// NewGameConfigs returns a GameConfig filled with default values
func NewGameConfig() GameConfig {
	return GameConfig{
		Powerups: map[PowerupName]Powerup{
			"Bomb": {
				Name:   "Bomb",
				Amount: 5,
				Icon:   7,
			},
			"Flame": {
				Name:   "Flame",
				Amount: 5,
				Icon:   8,
			},
			"Speed": {
				Name:   "Speed",
				Amount: 5,
				Icon:   9,
			},
			"Nothing": {
				Name: "Nothing",
				Icon: 0,
			},
		},
		GridConfig:    NewGridConfig(),
		GameId:        GameId(RandCode()),
		Lives:         3,
		CharacterSize: 35,
	}
}

// NewGame returns a new Game instance based on the GameConfig provided
func NewGame(config GameConfig) Game {
	return Game{
		GameId:           config.GameId,
		Status:           InLobby,
		Grid:             config.GridConfig.NewGrid(),
		ActivePowerUps:   config.GridConfig.NewEmptyGrid(),
		Config:           config,
		BarrelsBroken:    0,
		BarrelContents:   config.GetRandomPowerups(),
		Players:          make(map[UserId]*User),
		ActiveExplosions: config.GridConfig.NewEmptyGrid(),
	}
}

// SetPlayerPositions sets all the players coordinates
func (game Game) SetPlayerPositions() {
	const padding = 6
	var tileSize = game.Config.GridConfig.Tilesize

	for index, usr := range GlobalGames.ListGamePlayers(game.GameId) {
		user := GlobalClients.GetUser(usr.UserId)
		var position = Position{
			X: tileSize + padding,
			Y: tileSize + padding,
		}

		switch index {
		case 1:
			position.X += (game.Config.GridConfig.Width - 3) * tileSize
			position.Y += (game.Config.GridConfig.Height - 3) * tileSize
		case 2:
			position.Y += (game.Config.GridConfig.Height - 3) * tileSize
		case 3:
			position.X += (game.Config.GridConfig.Width - 3) * tileSize
		}
		user.Position = position
	}
}

// GameOver Gets winner, dissambles lobby and add all players to new lobby
func GameOver(gameId GameId) {
	game := GlobalGames.GetGame(gameId)

	if game.Status == GameEnded {
		return
	}
	game.Status = GameEnded

	winners, err := game.GetWinner()
	if err != nil {
		logger.Error(err)
		return
	}

	gameResult := "win"
	if len(winners) > 1 {
		gameResult = "tie"
	}
	logger.Log(fmt.Sprintf("Game '%s' over, result %s by %s", game.GameId, gameResult, winners[0].Username))
	// Send message "GameEnd" with winner
	err = GlobalGames.BroadcastToGame(gameId, Data{
		Type:     "gameOver",
		Message:  gameResult,
		Users:    winners,
		GameInfo: game.PrepareForSend(),
	})
	HandleError(err)

	go func() {
		// Wait 5 seconds, then create new game and make all players join that one
		time.Sleep(5 * time.Second)
		if !GlobalGames.Exists(game.GameId) {
			return
		}

		newConfig := NewGameConfig()
		newGame := NewGame(newConfig)
		GlobalGames.Add(&newGame)

		for _, player := range GlobalGames.ListGamePlayers(game.GameId) {
			// Leave current lobby
			LeaveLobby(Data{GameId: string(game.GameId), UserId: string(player.UserId)})
			GlobalClients.GetUser(player.UserId).ReadyState = false
			// Join new lobby
			JoinLobby(Data{GameId: string(newGame.GameId), UserId: string(player.UserId)})
		}
	}()
}

// GetWinner Gets last standing players in game
func (game *Game) GetWinner() (winners []User, err error) {
	alive := game.AlivePlayers()
	if len(alive) == 0 {
		return winners, errors.New("no alive players left")
	}

	return alive, nil
}

// AlivePlayers List of all alive players in the game and their data 
func (game *Game) AlivePlayers() (alive []User) {
	for _, player := range GlobalGames.ListGamePlayers(game.GameId) {
		if player.Lives > 0 {
			alive = append(alive, player)
		}
	}

	return alive
}

// PrepareForSend Send game info and grid with powerUps
func (game *Game) PrepareForSend() Game {
	var safeGame = Game{
		GameId:  game.GameId,
		Status:  game.Status,
		Players: game.Players,
	}

	for index, row := range game.Grid {
		safeGame.Grid = append(safeGame.Grid, []int{})
		safeGame.Grid[index] = append(safeGame.Grid[index], row...)
	}

	for y, row := range game.ActivePowerUps {
		for x, powerup := range row {
			if powerup != game.Config.Powerups["Nothing"].Icon {
				safeGame.Grid[y][x] = powerup
			}
		}
	}

	return safeGame
}
