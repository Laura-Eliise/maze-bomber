// Components
import User from "./user";

// Modules
import { startUserCounter, stopUserCounter } from "../websocket/responses";
import { store } from "../../../mist";

export default class Lobby {
    #lobbyId: string;
    #users: Map<string, User>;

    /**
     * Class representing the current active lobby.
     * 
     * @param lobbyId lobby id
     * @param users the users that are part of the lobby
     */
    constructor(lobbyId: string, users: User[]) {
        this.#lobbyId = lobbyId
        this.#users = new Map<string, User>()
        users.forEach(user => {
            this.addUser(user)
        })
    }

    /**
    *  Returns the lobbyId
    * 
    *  @return Returns lobbyId {string}
    */
    getLobbyId(): string {
        return this.#lobbyId
    }

    /**
    *  Returns the users of the lobby
    * 
    *  @return Returns users {Map<string, User>}
    */
    getUsers(): Map<string, User>{
        return this.#users
    }

    /**
     *  Returns the wanted users ready status in the lobby
     * 
     *  @param user the user whose ready status is wanted
     * 
     *  @return Returns a boolean indicating users ready status
     */
    getUserReadyState(user: User): boolean | undefined {
        if (!user) return;

        let u = this.#users.get(user.getUserId())

        return u?.getReadyState()
    }

    /**
     *  Adds a user to the lobby
     * 
     *  @param user the user to be added
     * 
     */
    addUser(user: User): void {
        this.#users.set(user.getUserId(), user)
    }

    /**
     *  Removes a user from the lobby
     * 
     *  @param user the user to be removed
     * 
     */
    removeUser(user: User): void {
        this.#users.delete(user.getUserId())
    }

    /**
     *  Returns the wanted users ready status in the lobby
     * 
     *  @param u the user whose ready status is wanted
     * 
     *  @return Returns a boolean indicating users ready status
     */
    toggleUserReady(u: User, isReady: boolean): void {
        let user = this.#users.get(u.getUserId())
        if (user === undefined) return;

        user.changeReadyState(isReady)
        //@ts-expect-error
        if (user.getUserId() != store.user.getUserId()) return

        if (!user.getReadyState()) {
            startUserCounter()
            return
        } else if (user.getReadyState()) {
            stopUserCounter()
        }
    }

    /**
     *  Leaves the lobby by creating a placeholder lobby and returning it.
     * 
     *  @return A placeholder lobby
     */
    leaveLobby(): Lobby {
        const placeHolderUser = new User("example", "example", "example")

        const placeHolderLobby = new Lobby("example", [placeHolderUser])

        return placeHolderLobby
    }
}