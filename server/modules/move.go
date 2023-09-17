package modules

import (
	"bomberman_dom/server/logger"
	"fmt"
)

const (
	Row rowOrCol = iota
	Col
)

type rowOrCol int

type AbsolutePosition Position

type GridPosition Position


// MovePlayer Checks if possible to move player 
func MovePlayer(data Data) {
	user := GlobalClients.GetUser(UserId(data.UserId))
	game := GlobalGames.GetGame(GameId(user.GameId))

	if user.Lives <= 0 {
		return
	}

	if !game.Move(user, data.Message, user.Powerups.Speed) {
		distance, err := game.DistanceToTileEdge(AbsolutePosition(user.Position), data.Message)
		if err != nil {
			logger.Error(err)
			return
		}
		if distance < user.Powerups.Speed && distance < game.Config.GridConfig.Tilesize && distance != 0 {
			game.Move(user, data.Message, distance)
		}
	}

	data = Data{
		Type:     "move",
		Message:  data.Message,
		UserId:   string(user.UserId),
		GameInfo: game.PrepareForSend(),
		Position: user.Position,
	}

	// send new coordinates to all game players
	err := GlobalGames.BroadcastToGame(game.GameId, data)
	HandleError(err)
}

// GetUserCollidingTiles Check 3x3 neighbouring tiles, return x,y coordinates 
func (game *Game) GetUserCollidingTiles(userPosition AbsolutePosition) (collidingTiles []Position) {
	var userX, userY = userPosition.X, userPosition.Y
	var userSize, tileSize = game.Config.CharacterSize, game.Config.GridConfig.Tilesize

	var currentTile = game.CurrentTileOnGrid(userPosition)

	// loop through current and all neighbouring tiles, so 3x3 area
	for y := currentTile.Y; y <= currentTile.Y+1; y++ {
		for x := currentTile.X; x <= currentTile.X+1; x++ {
			var tileX, tileY = x * tileSize, y * tileSize
			// check if colliding with tile
			if userX+userSize > tileX && userX < tileX+tileSize &&
				userY+userSize > tileY && userY < tileY+tileSize {
				collidingTiles = append(collidingTiles, Position{X: x, Y: y})
			}
		}
	}

	return collidingTiles
}

// CurrentTileOnGrid translates absolute coordinates to grid coordinates by dividing with tileSize
func (game *Game) CurrentTileOnGrid(position AbsolutePosition) GridPosition {
	x := position.X / game.Config.GridConfig.Tilesize
	y := position.Y / game.Config.GridConfig.Tilesize

	width := game.Config.GridConfig.Width
	height := game.Config.GridConfig.Height

	if x > width {
		x = width - 1 
	} else if x < 0 {
		x =  0
	} 

	if y > height {
		y = height - 1
	} else if x < 0 {
		y = 0
	} 

	return GridPosition{
		X: x,
		Y: y,
	}
}

// Move moves the player and picks up powerups if there are any intersecting with the new position.
// Returns true if move was successful, false otherwise.
func (game *Game) Move(user *User, direction string, distance int) bool {
	var newPosition = AbsolutePosition(user.Position)

	switch direction {
	case "up":
		newPosition.Y -= distance
	case "right":
		newPosition.X += distance
	case "down":
		newPosition.Y += distance
	case "left":
		newPosition.X -= distance
	case "stop":
		return true
	default:
		return false
	}

	var emptyBlock = game.Config.GridConfig.EmptyBlock
	var collidingTiles = game.GetUserCollidingTiles(AbsolutePosition(newPosition))
	// Check if new user position is valid (not in any non-empty blocks)
	for _, pos := range collidingTiles {
		// check if colliding tile is not empty
		var tile = game.Grid[pos.Y][pos.X]
		if tile != emptyBlock {
			return false
		}
	}
	// Change users position to new position
	user.Position = Position(newPosition)

	for _, pos := range collidingTiles {
		// Check if new user position overlaps with any active powerups on the grid
		if game.ActivePowerUps[pos.Y][pos.X] != emptyBlock {
			// Add Powerup to user
			user.AddPowerUp(game.ActivePowerUps[pos.Y][pos.X], game)
			// Remove Powerup from ActivePowerUp grid
			game.ActivePowerUps[pos.Y][pos.X] = emptyBlock
		}
		// check if walked into expolsion
		if game.ActiveExplosions[pos.Y][pos.X] == Explosion {
			game.LoseLife(user, 1)
		}
	}
	
	return true
}

// DistanceToTileEdge Checks distance to tile edge
func (game *Game) DistanceToTileEdge(userPos AbsolutePosition, direction string) (int, error) {
	var charSize = game.Config.CharacterSize
	var tileSize = game.Config.GridConfig.Tilesize

	switch direction {
	case "up":
		var tileGridPos = game.CurrentTileOnGrid(userPos)
		var tileAbsPos = game.TileAbsolutePosition(tileGridPos)
		return userPos.Y - tileAbsPos.Y, nil
	case "right":
		var tileGridPos = game.CurrentTileOnGrid(AbsolutePosition{X: userPos.X + charSize, Y: userPos.Y})
		var tileAbsPos = game.TileAbsolutePosition(tileGridPos)
		return (tileAbsPos.X + tileSize) - (userPos.X + charSize), nil
	case "down":
		var tileGridPos = game.CurrentTileOnGrid(AbsolutePosition{X: userPos.X, Y: userPos.Y + charSize})
		var tileAbsPos = game.TileAbsolutePosition(tileGridPos)
		return (tileAbsPos.Y + tileSize) - (userPos.Y + charSize), nil
	case "left":
		var tileGridPos = game.CurrentTileOnGrid(userPos)
		var tileAbsPos = game.TileAbsolutePosition(tileGridPos)
		return userPos.X - tileAbsPos.X, nil
	case "stop":
		return 0, nil
	default:
		return -1, fmt.Errorf("'%s' is not a valid direction ", direction)
	}
}

// TileAbsolutePosition Absolute position on grid in tiles
func (game *Game) TileAbsolutePosition(pos GridPosition) AbsolutePosition {
	return AbsolutePosition{
		X: pos.X * game.Config.GridConfig.Tilesize,
		Y: pos.Y * game.Config.GridConfig.Tilesize,
	}
}
