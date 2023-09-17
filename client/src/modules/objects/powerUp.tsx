/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../../mist/index"; // eslint-disable-line 
import { Position } from "./character";

export default class PowerUp {
    #pos: Position;
    #type: string;

    /**
     * Creates an instance of a power up.
     * @param pos - coordinates.
     */
    constructor(pos: Position, type: string) {
        this.#pos = pos;
        this.#type = type;
    }

    /**
     * Gets the coordinates.
     * @returns coordinates.
     */
    getPos(): Position {
        return this.#pos;
    }

    /**
     * Gets the type of the power up.
     * @returns type.
     */
    getType(): string {
        return this.#type;
    }

    /**
     * Gets the classes for power up.
     * @internal
     * @returns classes.
     */
    #getClass(): string {
        return `power-up-${this.#type}`;
    }

    /**
     * Formats the id.
     * @internal
     * @returns id.
     */
    #getId():string {
        return `${this.#pos.X},${this.#pos.Y}`;
    }

    /**
     * Gets the html of the power up.
     * @returns html representation of the power up.
     */
    getHTML(): VElement {
        return (
            <div id={this.#getId()} className="power-up-background"><div className={this.#getClass()}></div></div>
        );
    }
}