import { store } from "../../../mist";
import { WS_CONNECTION } from "./websocket";

/**
 * This checker makes sure that only one request to place down a bomb is sent
 * to the backend when the user is holding down space bar.
 */
let placeBomb = false;

/**
 * Object that stores the directions the user is moving and how many frames have
 * passed since the last character movement.
 */
let movement = {
  left: false,
  right: false,
  up: false,
  down: false,
  frames: 0,
}

/**
 * Callback function for request animation frame. Moves the player as long as the 
 * state is "game".
 */
export function move(): void {
  if (movement.frames === 1) {
    movement.frames = 0;

    if (movement.up && !movement.down) {
      WS_CONNECTION?.sendMessage("move", "", "", "", "up");
    }
    if (movement.down && !movement.up) {
      WS_CONNECTION?.sendMessage("move", "", "", "", "down");
    }
    if (movement.left && !movement.right) {
      WS_CONNECTION?.sendMessage("move", "", "", "", "left");
    }
    if (movement.right && !movement.left) {
      WS_CONNECTION?.sendMessage("move", "", "", "", "right");
    }
  } else {
    movement.frames++;
  }

  if (store.gameState === "game") {
    requestAnimationFrame(move)
  }
}

/**
 * Sets movement to left, right, up or down or places down a bomb. 
 * Valid inputs are arrow keys and ASDW.
 */
document.body.addEventListener("keydown", (e) => {
  const input = document.getElementById("chat-input")

  if (store.gameState == "game" && input != document.activeElement) {

    switch (e.code) {
      case "ArrowUp":
      case "KeyW": {
        movement.up = true;
        break
      }
      case "ArrowDown":
      case "KeyS": {
        movement.down = true;
        break
      }
      case "ArrowLeft":
      case "KeyA": {
        movement.left = true;
        break
      }
      case "ArrowRight":
      case "KeyD": {
        movement.right = true;
        break
      }
      case "Space": {
        if (!placeBomb) {
          placeBomb = true;
          /* @ts-expect-error */
          // store.activeGame.placeBomb(store.user.getUserId(), {x: 1, y: 1});
          WS_CONNECTION?.sendMessage("bombPlaced", store.user.getUserId());
        }
        break

      }
    }
  }
})

/**
 * Stops movement to left, right, up or down or makes it possible to place another bomb. 
 * Valid inputs are arrow keys and ASDW.
 */
document.body.addEventListener("keyup", (e) => {

  const input = document.getElementById("chat-input")

  if (store.gameState == "game" && input != document.activeElement) {
    
    switch (e.code) {
      case "ArrowUp":
      case "KeyW": {
        movement.up = false;
        if (noMovement()) {
          WS_CONNECTION?.sendMessage("move", "", "", "", "stop");
        }
        break
      }
      case "ArrowDown":
      case "KeyS": {
        movement.down = false;
        if (noMovement()) {
          WS_CONNECTION?.sendMessage("move", "", "", "", "stop");
        }
        break
      }
      case "ArrowLeft":
      case "KeyA": {
        movement.left = false;
        if (noMovement()) {
          WS_CONNECTION?.sendMessage("move", "", "", "", "stop");
        }
        break
      }
      case "ArrowRight":
      case "KeyD": {
        movement.right = false;
        if (noMovement()) {
          WS_CONNECTION?.sendMessage("move", "", "", "", "stop");
        }
        break
      }
      case "Space": {
        if (store.gameState == "game") {
          placeBomb = false;
          break
        }
      }
    }
  }
})

/**
 * Checks whether theree is movement or not
 * 
 * @returns a boolean whether a player is moving or not
 */
function noMovement(): boolean {
  return Object.values(movement)
    .filter(element => typeof element == "boolean")
    .every(value => value == false)
}