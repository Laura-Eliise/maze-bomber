/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../../mist/index"; // eslint-disable-line 
import { Position } from "./character";

export default class Wall {
    #pos: Position;

    /**
     * Creates an instance of a wall.
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
     * Gets the JSX of the given wall. Id is it's place in the grid and class
     * being set to wall by default.
     * @internal
     *
     * @returns JSX representation of the wall
     */
    getHTML(): VElement {
        return (
            <div className="wall" id={this.#getId()} ></div>
        );
    }
}