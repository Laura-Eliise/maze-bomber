import { store } from "../../../mist";

export class Sounds {
    #musicStatus: boolean;
    #fxStatus: boolean;
    #dingAudio = new Audio("src/assets/sounds/ding.mp3")
    #explosionAudio = new Audio("src/assets/sounds/explosion.mp3")
    #menuMusicAudio = new Audio("src/assets/sounds/menu-music.mp3")
    #gameMusicAudio = new Audio("src/assets/sounds/game-music.mp3")

    /**
     * Represents application sounds and settings
     */
    constructor() {
        let musicData = localStorage.getItem("music")

        this.#musicStatus = musicData ? JSON.parse(musicData) : true

        let fxData = localStorage.getItem("fx")

        this.#fxStatus = fxData ? JSON.parse(fxData) : true

        this.#addListeners()
    }

    /**
     * Adds event listeners to both music variables to create a smooth music loop
     * 
     * @internal
     */
    #addListeners() {
        this.#menuMusicAudio.addEventListener('timeupdate', function () {
            // 0.478
            const buffer = 0.39
            if (this.currentTime > this.duration - buffer) {
                this.currentTime = 0.0  
                this.play()
            }
        })

        this.#gameMusicAudio.addEventListener('timeupdate', function () {
            const buffer = 0.39
            if (this.currentTime > this.duration - buffer) {
                this.currentTime = 0.2
                this.play()
            }
        })
    }

    /**
     * Returns music status whether it is on or off
     * 
     * @returns music status
     */
    getMusicStatus(): boolean {
        return this.#musicStatus
    }

    /**
     * Returns fx music status whether it is on or off
     * 
     * @returns fx status
     */
    getFxStatus(): boolean {
        return this.#fxStatus
    }

    /**
    * Toggles the music status on | off
    */
    toggleMusicStatus(): void {
        this.#musicStatus = !this.#musicStatus

        localStorage.setItem("music", this.#musicStatus.toString())

        store.musicStatus = this.getMusicStatus()

        this.playMusic()
    }

    /**
     * Toggles the fx status on | off
     */
    toggleFxStatus(): void {
        this.#fxStatus = !this.#fxStatus

        localStorage.setItem("fx", this.#fxStatus.toString())

        store.fxStatus = this.getFxStatus()
    }

    /**
     * Plays the ding audio
     */
    playDing(): void {
        if (this.#fxStatus) {
        this.#dingAudio.play()
        }
    }

    /**
     * Plays the explosion audio
     */
    playExplosion(): void {
        if (this.#fxStatus) {
            this.#explosionAudio.play()
        }
    }

    /**
     * Plays the music loop if music is enabled
     */
    playMusic(): void {
        if (this.#musicStatus) {
            if (store.gameState != "game") {
                this.#menuMusicAudio.play()
                this.#gameMusicAudio.pause()
                return
            }

            if (store.gameState == "game") {
                this.#gameMusicAudio.play()
                this.#menuMusicAudio.pause()
                return
            }
        }

        this.#menuMusicAudio.pause()
        this.#gameMusicAudio.pause()
    }
}

/**
 * Holds global application sounds
 */
export let SOUNDS: Sounds | undefined;

/**
 * Initializes new application sounds and assigns it to global variable + starts music loop
 */
export const setupSounds = (): void => {
    SOUNDS = new Sounds();
};