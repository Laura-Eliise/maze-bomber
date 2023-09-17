/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../../mist/index"; // eslint-disable-line 

// Modules
import Wall from "./wall";
import Barrel from "./barrel";
import PowerUp from "./powerUp";
import { Position } from "./character";
import { Bomb } from "./bomb";


export default class Grid {
    #tileSize: number;
    #width: number;
    #height: number;
    #layout: Tile[][];

    /**
     * Grid of a game.
     * @param width - width of the grid.
     * @param height - height of the grid.
     * @param tileSize - size of a single tile on the grid.
     */
    constructor(width?: number, height?: number, tileSize?: number) {
        if (width && width < 5) {
            throw Error("width of the grid can't be less than 5");
        }
        if (height && height < 5) {
            throw Error("height of the grid can't be less than 5");
        }
        if (tileSize && tileSize < 1) {
            throw Error("size of the tile can't be less than 1");
        }


        this.#tileSize = tileSize ?? 44;
        this.#width = width ?? 15;
        this.#height = height ?? 13;
        this.#layout = this.#defaultLayout(this.#width, this.#height);
    }

    /**
     * Sets the default layout of the grid. It sets unbreakable walls around
     * the perimeter of the grid and pillars with gaps of 1 in the grid. The
     * height and width of the grid has to be a uneven number.
     * @internal
     *
     * @param width - width of the grid.
     * @param height - height of the grid.
     * @returns 2D tile array that represents the default layout.
     */
    #defaultLayout(width: number, height: number): Tile[][] {
        const layout: Tile[][] = [];
        if (width % 2 == 0 || height % 2 == 0) {
            throw Error("the grids height and width have to be uneven numbers");
        }
        // Create an empty grid with the right dimensions.
        for (let i = 0; i < height; i++) {
            const arr: Tile[] = [];
            for (let j = 0; j < width; j++) {
                arr.push(null);
            }
            layout.push(arr);
        }
        // Placing indestructible walls.
        for (let i = 0; i < height; i++) {
            if (i == 0 || i == height - 1) {
                for (let j = 0; j < width; j++) {
                    layout[i][j] = new Wall({ X: i, Y: j });
                }
                continue;
            }
            for (let j = 0; j < width; j += 2) {
                if (j == 0 || j == layout[0].length - 1 || i % 2 == 0) {
                    layout[i][j] = new Wall({ X: i, Y: j });
                }
            }
        }
        return layout;
    }

    /**
     * Gets the html of the grid.
     * @returns html representation of the grid.
     */
    getHTML(): VElement {
        const arr = [];

        for (let col = 0; col < this.#layout.length; col++) {
            for (let row = 0; row < this.#layout[col].length; row++) {
                const el = this.#layout[col][row];

                if (el !== null) {
                    arr.push(el.getHTML());
                }
                else {
                    const id = `${row},${col}`;
                    arr.push(<div id={id} className="empty"></div>);
                }
            }
        }

        return (
            <div id="grid" className="grid">{arr}</div>
        );
    }

    /**
     * Return the grid size in pixels in relation to the tile size.
     *
     * @returns object where the keys are "width" and "height".
     */
    getGridSize(): Record<string, number> {
        return {
            width: this.#width * this.#tileSize,
            height: this.#height * this.#tileSize,
        };
    }

    /**
     * Return the size of 1 tile in the grid.
     * @returns tile size.
     */
    getTileSize(): number {
        return this.#tileSize;
    }

    /**
     * Gets a tile at the give coordinates.
     * @param pos - coordinates.
     * @returns tile at the given coordinate.
     */
    getTile(pos: Position): Tile {
        return this.#layout[pos.Y][pos.X];
    }

    /**
     * Return the current grid layout in a 2d number grid.
     * 0 - empty tile,
     * 1 - unbreakable wall,
     * 2 - barrel,
     * 3 - some power up (work in progress).
     *
     * @returns grid layout in a 2d number grid
     */
    getLayout(): number[][] {
        const layout: number[][] = [];

        for (const col of this.#layout) {
            const arr: number[] = [];
            for (const obj of col) {
                if (obj == null) {
                    arr.push(0);
                }
                else if (obj instanceof Wall) {
                    arr.push(1);
                }
                else if (obj instanceof Barrel) {
                    arr.push(2);
                }
                else if (obj instanceof PowerUp) {
                    switch (obj.getType()) {
                    case "bomb": arr.push(7); break;
                    case "thunder": arr.push(8); break;
                    case "speed": arr.push(9); break;
                    }

                }
                else {
                    throw Error("there isn't number assigned to this object");
                }
            }
            layout.push(arr);
        }

        return layout;
    }


    /**
     * Updates the grid layout based on a 2d number grid.
     * 0 - empty tile,
     * 1 - unbreakable wall,
     * 2 - barrel,
     * 7 - power up: bomb
     * 8 - power up: thunder
     * 9 - power up: speed
     * @param layout - new layout of the grid.
     */
    update(layout: number[][] = this.getLayout()): void {
        if (layout.length !== this.#layout.length ||
            layout[0].length !== this.#layout[0].length) {
            this.#layout = this.#defaultLayout(layout[0].length, layout.length);
        }

        for (let col = 0; col < layout.length; col++) {
            for (let row = 0; row < layout[0].length; row++) {
                const tile = layout[col][row];
                switch (true) {

                case (tile === 0): {
                    if (this.#layout[col][row] !== null) {
                        this.#layout[col][row] = null;
                    }
                    break;
                }

                case (tile === 1): {
                    if (!(this.#layout[col][row] instanceof Wall)) {
                        this.#layout[col][row] = new Wall({ X: row, Y: col });
                    }
                    break;
                }

                case (tile === 2): {
                    if (!(this.#layout[col][row] instanceof Barrel)) {
                        this.#layout[col][row] = new Barrel({ X: row, Y: col });
                    }
                    break;
                }

                case (tile > 6 && tile < 10): {
                    if (!(this.#layout[col][row] instanceof PowerUp)) {
                        let type;
                        switch (tile) {
                        case 7: type = "bomb"; break;
                        case 8: type = "thunder"; break;
                        case 9: type = "speed"; break;
                        default: type = "ERROR";
                        }
                        this.#layout[col][row] = new PowerUp({ X: row, Y: col }, type);
                    }
                    break;
                }

                default: {
                    throw Error(`update(): there is no object assigned to number ${tile}`);
                }
                }
            }
        }
    }

    /**
     * Check if the player is colliding with a power up. If so, then remove
     * then power up from the grid.
     * @param pos - coordinates.
     * @param size - width and height of player character.
     */
    collision(pos: Position, size: number): void {
        const [left, top] = [Math.round((pos.X - size / 2) / 44), Math.round((pos.Y - size / 2) / 44)];
        const [right, bottom] = [Math.round((pos.X + size / 2 - 2) / 44), Math.round((pos.Y + size / 2 - 2) / 44)];
        const [x, y] = [Math.round(pos.X / 44), Math.round(pos.Y / 44)];

        if (this.#layout[y][left] instanceof PowerUp) {
            this.#layout[y][left] = null;
        }
        if (this.#layout[y][right] instanceof PowerUp) {
            this.#layout[y][right] = null;
        }
        if (this.#layout[top][x] instanceof PowerUp) {
            this.#layout[top][x] = null;
        }
        if (this.#layout[bottom][x] instanceof PowerUp) {
            this.#layout[bottom][x] = null;
        }
    }

    /**
     * Removes a tile at the given coordinate.
     * @param pos - coordinates
     * @returns nothing.
     */
    remove(pos: Position): void {
        this.#layout[pos.Y][pos.X] = null;
    }
}

/**
 * Tile in the grid. Can be a wall, barrel, bomb, power up or empty.
 */
type Tile = Wall | Barrel | Bomb | PowerUp | null;