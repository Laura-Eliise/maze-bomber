/** @jsx jsxTransform */
import { jsxTransform, VElement } from "../../mist/index"; // eslint-disable-line 

// Modules
import { SOUNDS } from "../modules/objects/sounds";

/**
 * Represents the music and fx buttons
 *
 * @param state - the application global state record
 *
 * @returns VElement
 */
const SoundButtons = (state: Record<string, unknown>): VElement => {
    return (
        <div class="flex-column">
            <div class="sound-buttons">
                <div class="font h3 sound-button" style={getMusicButtonStyle(state)} onClick={(): void => toggleMusic()}>Music</div>
                <div class="font h3 sound-button" style={getFxButtonStyle(state)} onClick={(): void => toggleFx()}>FX</div>
            </div>
        </div>
    );
};

export default SoundButtons;

/**
 * Toggles music and plays ding if enabled
 */
export function toggleMusic(): void {
    SOUNDS?.toggleMusicStatus();
    SOUNDS?.playDing();
}

/**
 * Toggles fx and plays ding if enabled
 */
export function toggleFx(): void {
    SOUNDS?.toggleFxStatus();
    SOUNDS?.playDing();
}

/**
 * Returns a disabled look or enabled look for music toggle button
 *
 * @param state - the application global state record
 * @returns a style string
 */
function getMusicButtonStyle(state: Record<string, unknown>): string {
    if (!state.musicStatus) {
        return "filter: brightness(50%)";
    }
    return "";
}

/**
 * Returns a disabled look or enabled look for fx toggle button
 *
 * @param state - the application global state record
 * @returns a style string
 */
function getFxButtonStyle(state: Record<string, unknown>): string {
    if (!state.fxStatus) {
        return "filter: brightness(50%)";
    }
    return "";
}