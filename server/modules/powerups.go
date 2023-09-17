package modules

import (
	"math"
	"math/rand"
	"time"
)

// Powerup represents powerups in the game
type Powerup struct {
	Name   PowerupName
	Amount int
	Icon   int
}

type PowerupName string

// PlayerPowerUps represents number of powerups player has
type PlayerPowerUps struct {
	Bombs int
	Flame int
	Speed int
}

// GetRandomPowerups returns an array of integers which represent powerups with the integer that is in their Powerup.Icon field
func (config GameConfig) GetRandomPowerups() []PowerupName {
	// get barrel amount
	var nonWallAmount = config.GridConfig.GetEmptySpaces()
	var barrelAmount = int(math.Round(float64(nonWallAmount) * config.GridConfig.FillPercentage))
	var emptyBarrel = PowerupName("Nothing")

	var powerups []PowerupName
	for name, powerup := range config.Powerups {
		if name == "Nothing" {
			continue
		}
		for i := 0; i < powerup.Amount; i++ {
			powerups = append(powerups, name)
		}
	}

	var emptyBarrels = barrelAmount - len(powerups)
	for i := 0; i < emptyBarrels; i++ {
		powerups = append(powerups, emptyBarrel)
	}

	// seed rand with current time
	rand.Seed(time.Now().UnixNano())
	// shuffle powerups
	rand.Shuffle(len(powerups), func(i, j int) {
		powerups[i], powerups[j] = powerups[j], powerups[i]
	})
	
	return powerups
}

// NewPlayerPowerUps sets default values for new player powerups
func NewPlayerPowerUps() PlayerPowerUps {
	return PlayerPowerUps{
		Bombs: 1,
		Flame: 1,
		Speed: 4,
	}
}

// AddPowerUp Adds powerUps to player 
func (user *User) AddPowerUp(powerupIcon int, game *Game) {
	switch powerupIcon {
	case game.Config.Powerups["Speed"].Icon:
		user.Powerups.Speed += 2
	case game.Config.Powerups["Flame"].Icon:
		user.Powerups.Flame += 1
	case game.Config.Powerups["Bomb"].Icon:
		user.Powerups.Bombs += 1
	}
}
