package modules

import (
	"sync"
	"time"
)

const (
	Nothing = iota
	Explosion
)

// Game contains game data

// BombPlaced Places bomb on grid, activates BombExploded function func after 3 seconds 
func BombPlaced(data Data) {
	user := GlobalClients.GetUser(UserId(data.UserId))
	if user.Powerups.Bombs <= 0 {
		return
	}
	game := GlobalGames.GetGame(GameId(user.GameId))

	characterCenter := game.Config.CharacterSize / 2
	var currentTile = game.CurrentTileOnGrid(AbsolutePosition{X: user.Position.X + characterCenter, Y: user.Position.Y + characterCenter})

	data.Bomb.UserId = UserId(data.UserId)
	data.Bomb.Position.X = currentTile.X
	data.Bomb.Position.Y = currentTile.Y

	user.Powerups.Bombs -= 1

	bomb := data.Bomb
	bomb.UserId = UserId(data.UserId)

	sendData := Data{
		Type:     "bombPlaced",
		UserId:   data.UserId,
		GameInfo: game.PrepareForSend(),
		Bomb:     data.Bomb,
	}
	err := GlobalGames.BroadcastToGame(game.GameId, sendData)
	HandleError(err)

	go func() {
		time.Sleep(3 * time.Second)

		if GlobalClients.Exists(user.UserId) && GlobalGames.Exists(GameId(user.GameId)) {
			BombExploded(data)
		}
	}()
}

// BombExploded Updates game and explosion area grid, send back data to client
func BombExploded(data Data) {
	user := GlobalClients.GetUser(UserId(data.UserId))
	game := GlobalGames.GetGame(GameId(user.GameId))
	// recieve coordinates of bomb and player who put it
	bomb := GetExplosionArea(data)
	game.AddExplosionToGrid(bomb)
	go func() {
		time.Sleep(1 * time.Second)
		if GlobalGames.Exists(game.GameId) {
			game.RemoveExplosionFromGrid(bomb)
		}
	}()	
	bomb.UserId = UserId(data.UserId)
	// check if any player is in the explosion area
	for _, gamePlayer := range GlobalGames.ListGamePlayers(game.GameId) {
		player := GlobalClients.GetUser(gamePlayer.UserId)
		if game.PlayerInExplosion(*player, bomb) {
			// lose 1 life
			game.LoseLife(player, 1)	
		}
	}
	user.Powerups.Bombs += 1

	err := GlobalGames.BroadcastToGame(game.GameId, Data{
		Type:     "bombExploded",
		UserId:   string(user.UserId),
		// GameInfo: game.PrepareForSend(),
		Bomb:     bomb,
	})
	HandleError(err)

	time.Sleep(1500 * time.Millisecond)

	err = GlobalGames.BroadcastToGame(game.GameId, Data{
		Type:     "updateGrid",
		UserId:   data.UserId,
		GameInfo: game.PrepareForSend(),
		Bomb:     data.Bomb,
	})
	HandleError(err)
}

// AddExplosionToGrid Add explosion to ActiveExplosions grid
func (game *Game) AddExplosionToGrid(bomb Bomb) {
	for _, dir := range bomb.ExplosionArea {
		for _, pos := range dir {
			game.ActiveExplosions[pos.Y][pos.X] = Explosion
		}
	}
}

// RemoveExplosionFromGrid Remove explosion area from ActiveExplosions grid
func (game *Game) RemoveExplosionFromGrid(bomb Bomb) {
	for _, dir := range bomb.ExplosionArea {
		for _, pos := range dir {
			game.ActiveExplosions[pos.Y][pos.X] = Nothing
		}
	}
}

// GetExplosionArea calculates explosion area to each direction
func GetExplosionArea(data Data) Bomb {
	user := GlobalClients.GetUser(UserId(data.UserId))
	game := GlobalGames.GetGame(GameId(user.GameId))
	var wall, barrel = game.Config.GridConfig.WallBlock, game.Config.GridConfig.BarrelBlock
	explosionRange := user.Powerups.Flame
	bomb := data.Bomb

	wg := new(sync.WaitGroup)
	wg.Add(4)

	for i := 0; i < 4; i++ {
		bomb.ExplosionArea = append(bomb.ExplosionArea, []Position{})
	}
	// The square the bomb is on
	CheckTile(bomb.Position, game)

	// right
	go func() {
		defer wg.Done()
		for x := bomb.Position.X + 1; x <= bomb.Position.X+explosionRange; x++ {
			tile := CheckTile(Position{x, bomb.Position.Y}, game)
			if tile == wall {
				break
			}
			bomb.ExplosionArea[0] = append(bomb.ExplosionArea[0], Position{X: x, Y: bomb.Position.Y})
			if tile == barrel {
				break
			}
		}
	}()
	// left
	go func() {
		defer wg.Done()
		for x := bomb.Position.X - 1; x >= bomb.Position.X-explosionRange; x-- {
			tile := CheckTile(Position{x, bomb.Position.Y}, game)
			if tile == wall {
				break
			}
			bomb.ExplosionArea[1] = append(bomb.ExplosionArea[1], Position{X: x, Y: bomb.Position.Y})
			if tile == barrel {
				break
			}
		}
	}()
	//down
	go func() {
		defer wg.Done()
		for y := bomb.Position.Y + 1; y <= bomb.Position.Y+explosionRange; y++ {
			tile := CheckTile(Position{bomb.Position.X, y}, game)
			if tile == wall {
				break
			}
			bomb.ExplosionArea[2] = append(bomb.ExplosionArea[2], Position{X: bomb.Position.X, Y: y})
			if tile == barrel {
				break
			}
		}
	}()
	//up
	go func() {
		defer wg.Done()
		for y := bomb.Position.Y - 1; y >= bomb.Position.Y-explosionRange; y-- {
			tile := CheckTile(Position{bomb.Position.X, y}, game)
			if tile == wall {
				break
			}
			bomb.ExplosionArea[3] = append(bomb.ExplosionArea[3], Position{X: bomb.Position.X, Y: y})
			if tile == barrel {
				break
			}
		}
	}()

	wg.Wait()
	return bomb
}

// PlayerInExpolsion checks whether a users coordinates and the bomb explosion area intersect
func (game *Game) PlayerInExplosion(user User, bomb Bomb) bool {
	var userX, userY = user.Position.X, user.Position.Y
	var userSize, tileSize = game.Config.CharacterSize, game.Config.GridConfig.Tilesize
	// Check bomb tile
	var tileX, tileY = bomb.Position.X * tileSize, bomb.Position.Y * tileSize
	if userX+userSize > tileX && userX < tileX+tileSize &&
		userY+userSize > tileY && userY < tileY+tileSize {
		return true
	}

	// Check explosion area
	for _, direction := range bomb.ExplosionArea {
		for _, tile := range direction {
			tileX, tileY = tile.X * tileSize, tile.Y * tileSize

			if userX+userSize > tileX && userX < tileX+tileSize &&
				userY+userSize > tileY && userY < tileY+tileSize {
				return true
			}
		}
	}
	return false
}

// Checktile checks if a tile can be exploded, edits the grid accordingly and if the tile was a barrel checks whether a powerup was in it
// returns 0 for empty, 1 for wall and 2 barrel 
func CheckTile(pos Position, game *Game) int {
	var wall, empty, barrel = game.Config.GridConfig.WallBlock, game.Config.GridConfig.EmptyBlock, game.Config.GridConfig.BarrelBlock

	if game.Grid[pos.Y][pos.X] == empty {
		return empty
	}
	if game.Grid[pos.Y][pos.X] == wall {
		return wall
	}

	// Change Barrel to empty on grid
	go changeBarrelsToEmpty(pos, game)
	// Check Barrel contents
	powerupName := game.BarrelContents[game.BarrelsBroken]
	game.BarrelsBroken++
	if powerupName != "Nothing" {
		game.ActivePowerUps[pos.Y][pos.X] = game.Config.Powerups[powerupName].Icon
	}
	return barrel
}

// LoseLife player loses 1 life
func (game *Game) LoseLife(user *User, amount int) {
	if time.Now().Before(user.Invincibility) {
		return
	}
	// set invincibility for some time
	user.Invincibility = time.Now().Add(3 * time.Second)
	// lose life
	GlobalClients.GetUser(user.UserId).Lives -= amount
	// Let frontend know that user lost life
	err := GlobalGames.BroadcastToGame(game.GameId, Data{
		Type:     "loseLife",
		UserId:   string(user.UserId),
		GameInfo: game.PrepareForSend(),
	})
	HandleError(err)

	if len(game.AlivePlayers()) == 1 {
		GameOver(game.GameId)
	}
}

// changeBarrelsToEmpty Change grid barrels to empty tiles
func changeBarrelsToEmpty(pos Position, game *Game)  {
	time.Sleep(1300 * time.Millisecond)
	game.Grid[pos.Y][pos.X] = game.Config.GridConfig.EmptyBlock
}