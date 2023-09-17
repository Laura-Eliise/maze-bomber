package modules

import (
	"sync"
)
// GlobalClients stores all the current clients and their websocket connnections
var GlobalClients = globalClients{Data: make(map[UserId]*User), RWMutex: &sync.RWMutex{}}

type globalClients struct {
	Data map[UserId]*User
	*sync.RWMutex
}

type UserId string
// Add adds a new client to the map
func (gc *globalClients) Add(user *User) {
	gc.Lock()
	defer gc.Unlock()
	gc.Data[user.UserId] = user
}
// Del removes a client from the map
func (gc *globalClients) Del(uId UserId) {
	gc.Lock()
	defer gc.Unlock()
	delete(gc.Data, uId)
}
// List lists all the clients in the map
func (gc *globalClients) List() []User {
	gc.RLock()
	defer gc.RUnlock()
	out := []User{}

	for _, user := range gc.Data {
		out = append(out, *user)
	}

	return out
}
// GetUser returns a pointer to a user specified by the UserId provided
func (gc *globalClients) GetUser(uId UserId) *User {
	gc.RLock()
	defer gc.RUnlock()

	user := gc.Data[uId]

	return user
}

// Exists returns a boolean indicating wheteher a user with a given UserId exists
func (gc *globalClients) Exists(userId UserId) bool {
	gc.RLock()
	defer gc.RUnlock()

	_, ok := gc.Data[userId]
	
	return ok
}
