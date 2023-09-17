/** @jsx jsxTransform */
import { force_update, jsxTransform, VElement } from "../../../mist/index"; // eslint-disable-line 
// Modules
import User from "./user";
import Grid from "./grid";
import BombGrid from "./bomb";
import { Position, Death } from "./character";
import Barrel from "./barrel";

export default class Game {
    #lobbyId: string | null;
    #users: Map<string, User>;
    #deaths: Map<string, Death>;
    #grid: Grid | null;
    #bombs: BombGrid | null;
    #endTime: string | null;
    /**
     * Class managing the entire game process.
     */
    constructor() {
        this.#lobbyId = null;
        this.#users = new Map();
        this.#deaths = new Map();
        this.#grid = null;
        this.#bombs = null;
        this.#endTime = null;
    }

    /**
     * Returns games end time
     *
     * @returns the games end tme
     */
    getEndtime(): string | null {
        return this.#endTime;
    }

    /**
     * Returns list of Users present in the game
     * @returns list of users in the game
     */
    getUsers(): User[] {
        const users = [];
        for (const [, user] of this.#users) {
            users.push(user);
        }
        return users;
    }

    /**
     * Get the html of the game.
     * @returns html representation of the game.
     */
    getHTML(): VElement[] {
        if (this.#grid && this.#bombs) {
            const players: unknown[] = [];
            for (const [, user] of this.#users) {
                players.push(user.getHTML());
            }
            for (const [, death] of this.#deaths) {
                players.push(death.getHTML());
            }
            return [
                <div id="players" className="player-container">{players}</div>,
                this.#bombs.getHTML(),
                this.#grid.getHTML(),
            ];
        }

        return <div id="GAME ERROR"></div>;
    }

    /**
    * Starts a new game session.
    * @param lobbyId - id of the lobby.
    * @param users - list of users playing the game.
    * @param gridData - 2D number array with the game board.
    * @param endTime - The time when the game ends .
    */
    start(lobbyId: string, gridData: number[][], endTime: string): void {
        this.#lobbyId = lobbyId;
        this.#endTime = endTime;
        this.#bombs = new BombGrid();
        this.#grid = new Grid();
        this.#deaths.clear();
        this.#grid.update(gridData);
    }

    /**
     * Adds a user to the game
     * @param user - user.
     */
    setUser(user: User): void {
        this.#users.set(user.getUserId(), user);
    }

    /**
     * Removes an user from the game
     *
     * @param userId - The users id who left
     */
    leave(userId: string): void {
        this.#users.delete(userId);
    }

    /**
     * Ends the game session and wipes the data.
     * @returns lobby id and user list to reset the lobby.
     */
    end(): Record<string, string | User[]> {
        if (this.#lobbyId !== null && this.#users !== null) {
            const data = {
                lobbyId: this.#lobbyId,
                users: this.getUsers(),
            };
            this.clear();

            return data;
        }
        throw Error("ended the game before it was even initialized.");
    }

    /**
     * Clears the game data.
     */
    clear(): void {
        this.#lobbyId = null;
        this.#users.clear();
        this.#deaths.clear();
        this.#grid = null;
        this.#bombs = null;
        this.#endTime = null;
    }

    /**
     * Updates the entire game session.
     * @param data - 2D list representing the updated grid.
     */
    update(data?: number[][]): void {
        if (data && this.#grid) this.#grid.update(data);

        for (const [, user] of this.#users) {
            if (user.getCharacter().getHealth() > 0) {
                user.getCharacter().update();
            }
        }

    }

    /**
     * Removes power up from the grid when a character steps on it.
     * @param userId - id of the user.
     */
    collision(userId: string): void {
        const user = this.#users.get(userId);
        if (this.#grid && user) {
            const character = user.getCharacter();
            this.#grid.collision(character.getPos(), character.getSize());
        }
    }

    /**
     * Removes an element from the grid.
     * @internal
     * @param pos - coordinates.
     */
    #remove(pos: Position): void {
        if (this.#grid) {
            this.#grid.remove(pos);
        }
    }

    /**
     * Moves the character depending on the x and y coordinate.
     * @param userId - id of the user.
     * @param x - coordinate.
     * @param y - coordinate.
     */
    move(userId: string, pos: Position, direction: string): void {
        const user = this.#users.get(userId);
        if (user && user.getCharacter().getHealth() > 0) {
            user.getCharacter().update(pos, direction);
            this.collision(user.getUserId());
        }
    }

    /**
     * Updates the lives of the user.
     * @param userId - if of the user.
     * @param lives - amount of lives the player has now.
     */
    loseLife(userId: string, lives: number): void {
        const user = this.#users.get(userId);

        if (user && user.getCharacter().getHealth() > lives) {
            if (lives < 0) {
                user.getCharacter().loseLife(0);
            }
            else {
                user.getCharacter().loseLife(lives);
            }
            const death = new Death(user.getCharacter().getPos(), userId);
            this.#deaths.set(userId, death);
            force_update();

            death.animate();

            setTimeout(() => {
                this.#deaths.delete(userId);
            }, death.getMS());
        }
    }

    /**
     * Places down a bomb to the grid.
     * @param user - The current user.
     * @param x - coordinate.
     * @param y - coordinate.
     */
    placeBomb(userId: string, pos: Position): void {
        const user = this.#users.get(userId);
        if (this.#bombs && user) {
            this.#bombs.placeBomb(user.getColorName(), pos);
        }
    }

    /**
     * Creates an explosion effect on the grid and updates the grid afterwards.
     * @param userId - id of the user who placed the bomb.
     * @param pos - coordinates.
     * @param explosionArea - 2d array with coordinates of the explosion.
     * @param grid - grid update.
     */
    explodeBomb(userId: string, pos: Position, explosionArea: Position[][], grid: number[][]): void {
        const user = this.#users.get(userId);
        if (this.#bombs && user) {
            const timer = this.#bombs.explodeBomb(user.getColorName(), pos, explosionArea);

            setTimeout(() => {
                this.update(grid);
                explosionArea.forEach((dir) => {
                    if (dir.length !== 0 && this.#grid) {
                        const tile = this.#grid.getTile(dir[dir.length - 1]);
                        if (tile !== null && tile instanceof Barrel) {
                            this.#remove(tile.getPos());
                        }
                    }
                });
            }, timer);
        }
    }
}