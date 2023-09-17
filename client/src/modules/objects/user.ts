// Modules
import { VElement } from "../../../mist";
import { Character, Position } from "./character";
import Grid from "./grid";

export default class User {
    #username: string;
    #userId: string;
    #color: string;
    #character: Character;
    #readyState: boolean;
    #joinDate: string;

    /**
     * Class representing the setting of the current user.
     *
     * @param username - name of the user
     * @param color - color picked by the user. Need to be 3 rgb values
     */
    constructor(username: string, color: string, userId: string, readyState = false, joinDate?: string) {
        this.#color = color;
        this.#username = username;
        this.#userId = userId;
        this.#character = new Character(userId, color);
        this.#readyState = readyState;
        this.#joinDate = joinDate || "";
    }

    /* ----------------------- GETTERS ----------------------- */

    /**
     * Gets the username.
     * @returns username.
     */
    getUsername(): string {
        return this.#username;
    }

    /**
     * Gets the users active lobby join date.
     * @returns join date
     */
    getJoinDate(): string {
        return this.#joinDate;
    }

    /**
     * Gets the users color in hex.
     * @returns hex code of color.
     */
    getColor(): string {
        return this.#color;
    }
    
    /**
     * Gets the user color in the general color name.
     * @return name of color.
     */
    getColorName(): string {
        switch (this.#color) {
            case "#D72C41": return "red"
            case "#70C36D": return "green"
            case "#A864CC": return "purple"
            case "#4284EF": return "blue"
        }
        return "COLOR ERROR"
    }

    /**
     * Gets the user id.
     * @returns user id.
     */
    getUserId(): string {
        return this.#userId;
    }

    /**
     * Gets the users character.
     * @returns character.
     */
    getCharacter(): Character {
        return this.#character;
    }

    /**
     * Gets the user ready state inside a lobby
     * @returns a ready state.
     */
    getReadyState(): boolean {
        return this.#readyState;
    }

    /* ----------------------- SETTERS ----------------------- */


    /**
     * Sets the color of the user.
     * @param newColor new color of the user.
     * @returns nothing.
     */
    setColor(newColor: string): void {
        this.#color = newColor;
    }

    /**
     * Changes the ready state.
     * @returns nothing.
     */
    changeReadyState(ready: boolean): void {
        this.#readyState = ready;
    }

    /* Manipulating the character */

    /**
     * Resets the character after the game session has ended.
     * @returns nothing.
     */
    reset(): void {
        this.#character = new Character(this.#userId);
    }

    /**
     * Updates the html of the player.
     * @returns nothing.
     */
    update(): void {
        this.#character.update();
    }

    /**
     * Moves the player forward depending on the x and y coordinate passed.
     * @param x coordinate.
     * @param y coordinate.
     * @param grid game grid.
     * @returns nothing.
     */
    move(x: number, y: number): void {
        this.#character.move(x, y);
    }

    /**
     * Gets the html of the users character.
     * @returns html representation of the users character.
     */
    getHTML(): VElement {
        return this.#character.getHTML();
    }
}