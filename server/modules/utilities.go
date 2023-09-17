package modules

import (
	"bomberman_dom/server/logger"
	"math/rand"
	"time"
)

var letters = []rune("abcdefghijklmnpqrtuvwxyz12346789")

// HandleError displays error message in terminal
func HandleError(err error) {
	if err != nil {
		logger.Error(err)
	}
}

// RandCode generates random 5 letter/number code and returns string
func RandCode() string {
	code := make([]rune, 5)
	for i := range code {
		code[i] = letters[rand.Intn(len(letters))]
	}
	if GlobalGames.Exists(GameId(code)) {
		return RandCode()
	}
	return string(code)
}

// RandColor picks one color, blue, red, purple or green and returns it
func RandColor(gameId string) string {
	var colors = []string{"#D72C41", "#A864CC", "#70C36D", "#4284EF"}

	for _, user := range GlobalGames.ListGamePlayers(GameId(gameId)) {
		for j, color := range colors {

			if user.Color == color {
				colors = append(colors[:j], colors[j+1:]...)
			}

		}
	}

	rand.Seed(time.Now().Unix()) // initialize global pseudo random generator
	randColor := colors[rand.Intn(len(colors))]

	return randColor
}

// CurrentTime Returns current time in "2006-01-02 15:04:05" format
func CurrentTime() string {
	return time.Now().Format("2006-01-02 15:04:05")
}


// Send Sends data to certain connection
func (conn *Connection) Send(data Data) error {
	conn.mut.Lock()
	defer conn.mut.Unlock()
	return conn.Conn.WriteJSON(data)
}