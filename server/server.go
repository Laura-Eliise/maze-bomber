package main

import (
	"bomberman_dom/server/logger"
	mod "bomberman_dom/server/modules"
	ws "bomberman_dom/server/websocket"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {

	// Load environment variables
	err := godotenv.Load("../.env")
	if err != nil {
		logger.Error(err)
	}

	// Handle routes
	http.HandleFunc("/websocket", ws.WsEndpoint)

	// Add global chat lobby
	gameConfig := mod.NewGameConfig()
	gameConfig.GameId = "global"
	game := mod.NewGame(gameConfig)
	mod.GlobalGames.Add(&game)

	// Port
	port := os.Getenv("VITE_BACKEND_PORT")
	if len(port) < 2 {
		logger.Warning("Provided port is empty, is this intentional?")
	}

	// Server
	logger.Log("Serving on http://localhost:" + os.Getenv("VITE_BACKEND_PORT") + "/")
	err1 := http.ListenAndServe(":"+port, nil)
	if err1 != nil {
		logger.Fatal(err1)
	}
}
