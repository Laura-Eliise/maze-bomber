package modules

import (
	"math"
	"math/rand"
	"time"
)

// GridConfig specifies variables which will be used when creating a new grid
type GridConfig struct {
	Width          int // Has to be odd
	Height         int // Has to be odd
	Tilesize       int
	EmptyBlock     int
	WallBlock      int
	BarrelBlock    int
	FillPercentage float64
	CornerArea     int // How many blocks to leave empty next to the corner - Will be the same vertically & horizontally. Max is (shorter side - 5) / 2
}

type Grid [][]int

// NewGridConfig returns a GridConfig filled with default values
func NewGridConfig() GridConfig {
	return GridConfig{
		Width:          15,
		Height:         13,
		Tilesize:       44,
		EmptyBlock:     0,
		WallBlock:      1,
		BarrelBlock:    2,
		FillPercentage: 0.8,
		CornerArea:     1,
	}
}

// NewGrid returns a new Grid instance based on the GridConfig provided
func (config GridConfig) NewGrid() Grid {
	var grid = config.NewEmptyGrid()
	grid = grid.PlaceWalls(config)
	grid = grid.PlaceBarrels(config)

	return grid
}

func (config GridConfig) NewEmptyGrid() Grid {
	var grid Grid
	for i := 0; i < config.Height; i++ {
		var row = []int{}
		for i := 0; i < config.Width; i++ {
			row = append(row, config.EmptyBlock)
		}
		grid = append(grid, row)
	}

	return grid
}

// GetRandomBarrels returns a randomized array of integers which symbolize barrels and empty blocks
func (grid Grid) GetRandomBarrels(config GridConfig) []int {
	var nonWallAmount = config.GetEmptySpaces()
	var barrelAmount = int(math.Round(float64(nonWallAmount) * config.FillPercentage))
	var emptyAmount = nonWallAmount - barrelAmount

	var random []int
	for i := 0; i < barrelAmount; i++ {
		random = append(random, config.BarrelBlock)
	}
	for i := 0; i < emptyAmount; i++ {
		random = append(random, config.EmptyBlock)
	}

	// seed rand with current time
	rand.Seed(time.Now().UnixNano())
	// shuffle barrels and empty blocks
	rand.Shuffle(len(random), func(i, j int) {
		random[i], random[j] = random[j], random[i]
	})

	return random
}

// PlaceBarrels fills the appropriate squares of the grid with randomly generated barrels
func (grid Grid) PlaceBarrels(config GridConfig) Grid {
	randomOrder := grid.GetRandomBarrels(config)
	var index = 0

	// fill all rows in the center area which don't have walls
	for y := 3; y < config.Height-2; y += 2 {
		for x := 2; x < config.Width-2; x++ {
			grid[y][x] = randomOrder[index]
			index++
		}
	}
	// fill all rows in the center area which have walls
	for y := 2; y < config.Height-2; y += 2 {
		for x := 3; x < config.Width-2; x += 2 {
			grid[y][x] = randomOrder[index]
			index++
		}
	}

	// exclude the corner areas on the outer rows and columns, to calculate which spaces could be filled
	var start = 2 + config.CornerArea
	var rowEnd = config.Width - 2 - config.CornerArea
	var colEnd = config.Height - 2 - config.CornerArea
	// fill first and last row
	for x := start; x < rowEnd; x++ {
		if x == start || x == rowEnd - 1 {
			grid[1][x] = config.BarrelBlock
			grid[config.Height-2][x] = config.BarrelBlock
			continue
		}
		grid[1][x] = randomOrder[index]
		index++
		grid[config.Height-2][x] = randomOrder[index]
		index++
	}

	// fill first and last column
	for y := start; y < colEnd; y++ {
		if y == start || y == colEnd - 1 {
			grid[y][1] = config.BarrelBlock
			grid[y][config.Width-2] = config.BarrelBlock
			continue
		}
		grid[y][1] = randomOrder[index]
		index++
		grid[y][config.Width-2] = randomOrder[index]
		index++
	}

	return grid
}

// PlaceWalls places walls on the grid
// Walls are placed on:
// - every edge block
// - in the middle every second block vertically and horizontally
func (grid Grid) PlaceWalls(config GridConfig) Grid {
	// Center Area
	for y := 0; y < config.Height; y += 2 {
		for x := 0; x < config.Width; x += 2 {
			grid[y][x] = config.WallBlock
		}
	}

	// Top & Bottom Edges
	for x := 0; x < config.Width; x++ {
		grid[0][x] = config.WallBlock
		grid[config.Height-1][x] = config.WallBlock
	}

	// Left & Right Edges
	for y := 0; y < config.Height; y++ {
		grid[y][0] = config.WallBlock
		grid[y][config.Width-1] = config.WallBlock
	}

	return grid
}

// Calculates available space where barrels could be placed, excludes corner areas.
func (config GridConfig) GetEmptySpaces() int {
	var gridNoSurroundingWalls = (config.Width - 2) * (config.Height - 2)
	var CornerArea = (1 + 2*(config.CornerArea + 1)) * 4
	var filledWalls = ((config.Width-4)/2 + 1) * ((config.Height-4)/2 + 1)

	return gridNoSurroundingWalls - CornerArea - filledWalls
}

// ShrinkGridOrder returns an array of coordinates, which represent tiles that are changed in order to shrink the grid
func (game *Game) ShrinkGridOrder() []Position {
	var width = game.Config.GridConfig.Width
	var height = game.Config.GridConfig.Height
	
	var shrinkOrder = []Position{}

	var circle = 1
	for {
		var right, down, left, up = []Position{}, []Position{}, []Position{}, []Position{}

		for i := circle; i < width-circle; i++ {
			right = append(right, Position{i, circle})
			left = append(left, Position{width - 1 - i, height - 1 - circle})
		}

		for i := circle; i < height-circle; i++ {
			down = append(down, Position{width - 1 - circle, i})
			up = append(up, Position{circle, height - 1 - i})
		}

		if circle > width/2 - 1 || circle > height/2 - 1 {
			if width >= height {
				shrinkOrder = append(shrinkOrder, right...)
			} else if height > width {
				shrinkOrder = append(shrinkOrder, down...)
			}
			break
		}

		shrinkOrder = append(shrinkOrder, right...)
		shrinkOrder = append(shrinkOrder, down[1:len(down)-1]...)
		shrinkOrder = append(shrinkOrder, left...)
		shrinkOrder = append(shrinkOrder, up[1:len(up)-1]...)
		circle++
	}

	return shrinkOrder
}