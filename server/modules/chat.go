package modules

// Authenticate checks and registers user
func Authenticate(data Data) {
	uId := UserId(data.UserId)
	user := GlobalClients.GetUser(uId)

	user.Username = data.Username
	user.Color = data.Color

	err := user.Conn.Send(Data{
		Type:     "createUser",
		Username: user.Username,
		Color:    user.Color,
		UserId:   string(user.UserId),
	})
	HandleError(err)

}

// SendMesage sends chat message to all players in the lobby
func SendMessage(data Data) {
	chat := Data{
		Type:     "message",
		Message:  data.Message,
		Username: data.Username,
		Date:     CurrentTime(),
		Color:    data.Color,
	}

	user := GlobalClients.GetUser(UserId(data.UserId))
	err := GlobalGames.BroadcastToGame(GameId(user.GameId), chat)
	HandleError(err)
}
