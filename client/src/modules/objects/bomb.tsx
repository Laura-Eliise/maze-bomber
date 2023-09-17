/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../../mist/index"; // eslint-disable-line 
import { Position } from "./character";
import { force_update } from "../../../mist/index";
// Modules
import { SOUNDS } from "./sounds";

export default class BombGrid {
    #bombs: Map<string, Bomb>;
    #explosions: Map<string, Explode>;
    #explosion_timer: number;

    /**
     * Class managing the entire bomb explosion process.
     */
    constructor() {
        this.#bombs = new Map();
        this.#explosions = new Map();
        this.#explosion_timer = 1000;
    }

    /**
     * Gets the html of the bombs and explosions.
     * @returns html representation of the bombs and explosions.
     */
    getHTML(): VElement {
        const arr = [];

        for (const [, bomb] of this.#bombs) {
            arr.push(bomb.getHTML());
        }
        for (const [, explosion] of this.#explosions) {
            arr.push(explosion.getHTML());
        }

        return (
            <div class="bomb-container">{arr}</div>
        );
    }

    /**
     * Places a bomb onto the grid.
     * @param color - color of the bomb.
     * @param x - coordinate.
     * @param y - coordinate.
     */
    placeBomb(color: string, pos: Position): void {
        const bombId = id(pos, "bomb");
        const bomb = new Bomb(pos, color);

        this.#bombs.set(bombId, bomb);
        force_update();

        this.#getAnimation(bomb);
    }

    /**
     * Starts and sets the animation on a selected bomb
     *
     * @param bomb - the bomb which needs an animation
     */
    #getAnimation(bomb: Bomb): void {
        const ms = 3000;
        for (let i = 0; i < 1; i += 0.1) {
            setTimeout(() => {
                switch (Math.round(i * 10)) {
                case 0: case 2: case 4: case 6: {
                    bomb.setBackground(1);
                    break;
                }
                case 1: case 3: case 5: case 7: {
                    bomb.setBackground(2);
                    break;
                }
                case 8: case 9: {
                    bomb.setBackground(3);
                    break;
                }
                }
                force_update();
            }, ms * i);
        }
    }


    /**
     * Sets off explosions for the bomb and removes them afterwards.
     * @param color - color of the bomb.
     * @param pos - coordinates.
     * @param data - list of positions for the bombs
     * @returns time when the bomb will explode in ms.
     */
    explodeBomb(color: string, pos: Position, data: Position[][]): number {
        const set_boom = (pos: Position, type: string): void => {
            this.#explosions.set(id(pos, "exp"), new Explode(pos, color, type));
        };

        this.#bombs.delete(id(pos, "bomb"));
        force_update();

        set_boom(pos, "center");

        data[0].forEach((pos, i) => { // eslint-disable-line 
            i === data[0].length - 1 ? set_boom(pos, "right") : set_boom(pos, "ver");
        });
        data[1].forEach((pos, i) => { // eslint-disable-line 
            i === data[1].length - 1 ? set_boom(pos, "left") : set_boom(pos, "ver");
        });
        data[2].forEach((pos, i) => { // eslint-disable-line 
            i === data[2].length - 1 ? set_boom(pos, "down") : set_boom(pos, "hor");
        });
        data[3].forEach((pos, i) => { // eslint-disable-line 
            i === data[3].length - 1 ? set_boom(pos, "top") : set_boom(pos, "hor");
        });

        SOUNDS?.playExplosion();

        setTimeout(() => {
            this.#explosions.delete(id(pos, "exp"));
            data.forEach(direction => {
                direction.forEach(ex_pos => {
                    this.#explosions.delete(id(ex_pos, "exp"));
                });
            });
        }, this.#explosion_timer);

        return this.#explosion_timer;
    }
}

export class Bomb {
    #pos: Position;
    #color: string;
    #background: number;

    /**
     * Class holding info on a single bomb.
     * @param pos - coordinates.
     * @param color - color of the bomb.
     */
    constructor(pos: Position, color: string) {
        this.#pos = pos;
        this.#color = color;
        this.#background = 1;
    }

    /**
     * Sets the bomb background to the corresponding number which then grid class can transorm into a tile
     * @param num - good number
     */
    setBackground(num: number): void {
        this.#background = num;
    }

    /**
     * Gets the position of the character for HTML inline styles.
     * @internal
     * @returns string for inline style.
     */
    getStyle(): string {
        return `
        position: absolute; 
        left: ${this.#pos.X * 44}px; 
        top:${this.#pos.Y * 44}px; 
        background-image: url(src/assets/images/${this.#color}/${this.#color}_bomb${this.#background}.png);
        `;
    }

    /**
     * Gets the class of the bomb for HTML inline styles.
     * @internal
     * @returns string for inline style.
     */
    #getClass(): string {
        return `bomb`;
    }

    /**
     * Gets the html of the bomb.
     * @returns html representation of the bomb.
     */
    getHTML(): VElement {
        return (
            <div id={id(this.#pos, "bomb")} class={this.#getClass()} style={this.getStyle()}></div>
        );
    }
}

class Explode {
    #pos: Position;
    #color: string;
    #type: string;

    /**
     * Class holding info of a single tile of explosion.
     * @param pos - coordinates.
     * @param color - color of the explosion.
     * @param type - identifier for center, side or end piece of the explosion.
     */
    constructor(pos: Position, color: string, type: string) {
        this.#pos = pos;
        this.#color = color;
        this.#type = type;
    }

    /**
     * Gets the position of an explosion for HTML inline styles.
     * @internal
     * @returns string for inline style.
     */
    #getPosition(): string {
        const tileSize = 44;
        let deg = 0;
        switch (this.#type) {
        case "hor":
        case "top": deg = 90; break;
        case "right": deg = 180; break;
        case "down": deg = 270; break;
        }
        return `
            position: absolute; 
            left: ${this.#pos.X * tileSize}px; 
            top:${this.#pos.Y * tileSize}px;
            transform: rotate(${deg}deg)
        `;
    }

    /**
     * Gets the class of an explosion for HTML inline styles.
     * @internal
     * @returns string for inline style.
     */
    #getClass(): string {
        let type;
        switch (this.#type) {
        case "center": {
            type = "center";
            break;
        }
        case "hor": case "ver": {
            type = "side";
            break;
        }
        case "top": case "right": case "down": case "left": {
            type = "end";
            break;
        }
        }
        return `${this.#color} explosion ${type}`;
    }

    /**
     * Gets the html of an explosion.
     * @returns html representation of an explosion.
     */
    getHTML(): VElement {
        return (
            <div id={id(this.#pos, "exp")} class={this.#getClass()} style={this.#getPosition()}></div>
        );
    }
}

/**
 * Generates an id for the HTML id property based on the x and y coordinate.
 * Optional extra identifier is available.
 * @param pos - coordinates.
 * @param identifier - extra identifier.
 * @returns coordinates for HTML id.
 */
const id = (pos: Position, identifier: string): string => {
    return `${identifier} ${pos.X},${pos.Y}`;
};
