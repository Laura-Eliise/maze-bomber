package modules

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Data struct {
	Type       string
	UserId     string
	Username   string
	Color      string
	GameId     string
	ReadyState bool
	Action     string
	Message    string
	Date       string
	Bomb       Bomb
	PowerUp    []Powerup
	GameInfo   Game
	Users      []User
	Move       string
	Position   Position
}
type Position struct {
	X int
	Y int
}
type User struct {
	UserId     UserId
	GameId     string
	Username   string
	Color      string
	Time       string
	ReadyState bool
	Powerups   PlayerPowerUps
	// Conn       *websocket.Conn
	Conn     *Connection
	Position Position
	Lives    int
	Invincibility time.Time
}

type Bomb struct {
	Position      Position
	UserId        UserId
	ExplosionArea [][]Position
}

type Connection struct {
	Conn *websocket.Conn
	mut  sync.Mutex
}
