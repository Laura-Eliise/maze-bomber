/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../../mist/index"; // eslint-disable-line 

export class Character {
    #userId: string;
    #color: string | undefined;

    #health: number;
    #x: number;
    #y: number;

    #animation: Animation | null;
    #currentDirection: string;

    /**
     * Class representing the physical character in the playing field.
     * @param user - user controlling this character.
     * @param speed - how quickly the character moves.
     * @param bombs - number of bombs player can place.
     * @param blastRadius - blast radius of a bomb.
     */
    constructor(userId: string, color?: string) {
        this.#userId = userId;
        this.#color = color;

        this.#health = 3;
        this.#x = 50;
        this.#y = 50;
        this.#currentDirection = "down";
        this.#animation = null;
    }


    /**
     * Transform the characters hex color code into human readable color name and returns it
     * @returns color
     */
    getColor(): string {
        switch (this.#color) {
        case "#D72C41":
            return "red";
        case "#A864CC":
            return "purple";

        case "#70C36D":
            return "green";

        case "#4284EF":
            return "blue";
        default:
            return "";
        }
    }

    /**
     * Get the player position.
     * @returns object with the players x ja y coordinates.
     */
    getPos(): Position {
        return {
            X: this.#x,
            Y: this.#y,
        };
    }

    /**
     * Gets the width and height of the character.
     * @returns size of the character.
     */
    getSize(): number {
        return 35;
    }

    /**
     * Gets the status of the player.
     * @returns object with the health and speed of the player.
     * Key is "health".
     */
    getHealth(): number {
        return this.#health;
    }
    /**
     * Gets the class of the character.
     * @internal
     * @returns class for html inline style.
     */
    #getClass(): string {
        if (this.#health > 0) {
            return `player-character player-character-${this.getColor()}`;
        }
        else {
            return "dead";
        }
    }

    /**
     * Gets the html of the character.
     * @returns html representation of the character.
     */
    getHTML(): VElement {
        const pos = `left: ${this.#x}px; top: ${this.#y}px;`;

        return (<div id={this.#userId} loading="eager" className={this.#getClass()} style={pos}></div>);
    }


    /**
     * Sets the x and y coordinate of the character.
     * @param pos - coordinates of the player.
     * @returns nothing.
     */
    setPos(pos: Position): void {
        this.#x = pos.X;
        this.#y = pos.Y;
    }

    /* Manipulate character */

    /**
     * Sets the coordinates of the player. Throws an error otherwise.
     * @param x - coordinate.
     * @param y - coordinate.
     * @param grid - game field.
     * @returns nothing.
     */
    move(x: number, y: number): void {
        this.#x = x;
        this.#y = y;
    }

    /**
     * Updates the amount of lives the player has.
     * @param amount - amount of lives the player has.
     */
    loseLife(lives: number): void {
        this.#health = lives;

        const character = document.getElementById(this.#userId);

        character?.classList.add("blink-character");

        setTimeout(() => {
            character?.classList.remove("blink-character");
        }, 3000);
    }

    /**
     * Updates the html of the character.
     * @returns nothing.
     */
    update(pos?: Position, direction?: string): void {
        const character = document.getElementById(this.#userId);
        const animationAttrs = {
            duration: 350,
            iterations: Infinity,
        };

        if (pos?.X !== undefined) this.#x = pos.X;
        if (pos?.Y !== undefined) this.#y = pos.Y;

        if (character !== null) {
            if (direction == "stop") {
                if (this.#animation) {
                    this.#animation.cancel();
                    this.#animation = null;
                }
            }
            else if (this.#currentDirection != direction) {

                if (this.#animation) {
                    this.#animation.cancel();
                    this.#animation = null;
                }

                if (direction == "up") {
                    this.#animation = character.animate(this.#getAnimation("up"), animationAttrs);
                    this.#currentDirection = "up";
                }

                if (direction == "right") {
                    this.#animation = character.animate(this.#getAnimation("side_r"), animationAttrs);
                    this.#currentDirection = "side_r";
                }

                if (direction == "left") {
                    this.#animation = character.animate(this.#getAnimation("side_l"), animationAttrs);
                    this.#currentDirection = "side_l";
                }

                if (direction == "down") {
                    this.#animation = character.animate(this.#getAnimation("down"), animationAttrs);
                    this.#currentDirection = "down";
                }
            }

            this.#currentDirection = direction ?? "down";
            character.style.left = `${this.#x}px`;
            character.style.top = `${this.#y}px`;
        }
    }

    #getAnimation(type: string): { backgroundImage: string, offset: number }[] {
        let image = "";

        switch (type) {
        case "up":
            image = "up";
            break;
        case "side_r":
            image = "side_r";
            break;
        case "down":
            image = "down";
            break;
        case "side_l":
            image = "side_l";
            break;
        }

        return [
            { backgroundImage: `url(src/assets/images/${this.getColor()}/${this.getColor()}_${image}3.png)`, offset: 0 },
            { backgroundImage: `url(src/assets/images/${this.getColor()}/${this.getColor()}_${image}2.png)`, offset: 0.5 },
            { backgroundImage: `url(src/assets/images/${this.getColor()}/${this.getColor()}_${image}1.png)`, offset: 1 },
        ];
    }
}

export class Death {
    #userId: string;
    #x: number;
    #y: number;
    #ms: number;

    /**
     * Represents one character death in a game
     *
     * @param pos - the users character position who died
     * @param uId - the users id who died
     */
    constructor(pos: Position, uId: string) {
        this.#x = pos.X;
        this.#y = pos.Y - 25;
        this.#userId = uId;
        this.#ms = 1000;
    }

    /**
     * Returns duration of the death animation in milliseconds
     *
     * @returns death animation duration
     */
    getMS(): number {
        return this.#ms;
    }

    /**
     * Gets the users id who just had a death
     *
     * @interal
     * @returns the users id who had a death
     */
    #getId(): string {
        return `${this.#userId}-dead`;
    }

    /**
     * Gets the death occurence position
     *
     * @internal
     * @returns a inline style of the absolute position
     */
    #getPos(): string {
        return `left:${this.#x}px; top:${this.#y}px`;
    }

    /**
     * Returns the death image to be displayed
     *
     * @returns death image
     */
    getHTML(): any {
        return <div id={this.#getId()} style={this.#getPos()} class="death-animation"></div>;
    }

    /**
     * Animated the death image
     */
    animate(): void {
        const html = document.getElementById(`${this.#getId()}`);
        const [, , , y] = [this.#x, this.#x - 3, this.#x + 3, this.#y];

        if (html) {
            const px = (x: number): string => `${x}px`;
            html.animate(
                {
                    "top": [px(y), px(y - 7.5), px(y - 15)],
                    "offset": [0, 0.5, 1],
                },
                {
                    duration: this.#ms,
                    fill: "forwards",
                });
        }
        else {
            console.log("couldn't get the html");
        }
    }
}

/**
 * Position holds the x and y coordinate.
 */
export interface Position {
    X: number,
    Y: number,
}
