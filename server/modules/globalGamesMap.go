package modules

import (
	"sync"
)

// GlobalGames is a map that stores games that are currently in use
var GlobalGames = globalGames{Data: make(map[GameId]*Game), RWMutex: &sync.RWMutex{}}

type globalGames struct {
	Data map[GameId]*Game
	*sync.RWMutex
}

type GameId string

// Add adds a game to the map
func (gg *globalGames) Add(game *Game) {
	gg.Lock()
	defer gg.Unlock()
	gg.Data[game.GameId] = game
}

// Del removes a game from the map
func (gg *globalGames) Del(gameId GameId) {
	gg.Lock()
	defer gg.Unlock()
	delete(gg.Data, gameId)
}

// List lists all the games in the map
func (gg *globalGames) List() []Game {
	gg.RLock()
	defer gg.RUnlock()
	out := []Game{}

	for _, game := range gg.Data {
		out = append(out, *game)
	}

	return out
}

// GetGame returns a pointer to a game specific to the GameId provided
func (gg *globalGames) GetGame(gameId GameId) *Game {
	gg.RLock()
	defer gg.RUnlock()

	game := gg.Data[gameId]

	return game
}

// ListGamePlayers returns a list of users of the game specified by the provided GameId
func (gg *globalGames) ListGamePlayers(gameId GameId) []User {
	gg.RLock()
	defer gg.RUnlock()
	out := []User{}

	game := gg.GetGame(gameId)

	for _, user := range game.Players {
		out = append(out, *user)
	}

	return out
}

// BroadcastToGame sends data to all game players
func (gg *globalGames) BroadcastToGame(gameId GameId, data Data) error {
	for _, client := range gg.ListGamePlayers(gameId) {
		client.Conn.Send(data)
	}

	return nil
}

// AddPlayer adds a user to the game specified by the GameId provided
func (gg *globalGames) AddPlayer(gameId GameId, user *User) {
	gg.Lock()
	defer gg.Unlock()
	gg.Data[gameId].Players[user.UserId] = user
}

// RemovePlayer removes a player from the game based on the GameId and UserId provided
func (gg *globalGames) RemovePlayer(gameId GameId, cid UserId) {
	gg.Lock()
	defer gg.Unlock()

	_, ok := gg.Data[gameId].Players[cid]
	if !ok {
		return
	}

	delete(gg.Data[gameId].Players, cid)
}

// Exists returns a boolean indicating wheteher a game with a given GameId exists
func (gg *globalGames) Exists(gameId GameId) bool {
	gg.RLock()
	defer gg.RUnlock()

	_, ok := gg.Data[gameId]

	return ok
}

// PlayerExists returns a boolean idicating whether a user is in a game players list
func (gg *globalGames) PlayerExists(gameId GameId, cid UserId) bool {
	gg.RLock()
	defer gg.RUnlock()

	_, ok := gg.Data[gameId].Players[cid]

	return ok
}

// BroadcastToOtherGamePlayers send data to other game players
func (gg *globalGames) BroadcastToOtherGamePlayers(gameId GameId, cid UserId, data Data) error {
	for _, client := range gg.ListGamePlayers(gameId) {
		if client.UserId != cid {
			client.Conn.Send(data)
		}
	}
	
	return nil
}
