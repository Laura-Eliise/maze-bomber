/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../../mist/index"; // eslint-disable-line 
import { Position } from "./character";

export default class Barrel {
    #pos: Position;

    /**
     * Barrel is a destructible object that has the change to drop a power up.
     * @param pos - coordinates.
     */
    constructor(pos: Position) {
        this.#pos = pos;
    }

    /**
     * Gets the coordinates.
     * @returns coordinates.
     */
    getPos(): Position {
        return this.#pos;
    }

    /**
     * Formats the id.
     * @internal
     * @returns id.
     */
    #getId(): string {
        return `${this.#pos.X},${this.#pos.Y}`;
    }

    /**
     * Gets the html of the barrel.
     * @returns html representation of the barrel
     */
    getHTML(): VElement {
        return (
            <div id={this.#getId()} className="barrel"></div>
        );
    }
}