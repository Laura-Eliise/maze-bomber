/**
 * Holds the application state i.e. the data used by the app.
 * @internal
 */
export let store: Record<string, unknown> = {};

/** 
 * The function that is currently being run, due to a state update. 
 * @internal
 */
export let activeEffect: (() => void) | null;
export let forceUpdate: (() => void) | null;
/**
 * Sets a function as {@link activeEffect} while it is run, called when some part of state is updated.
 * @internal
 */
export const watchEffect = (fn: () => void): void => {
    activeEffect = fn;
	forceUpdate = fn;
    fn();
    activeEffect = null;
};

/**
 *  Represents a Dependency, used to set functions on the state that should be called when the state is updated.
 *  @internal
 */
export class Dependency {
    /** The functions that should be called once state is changed. */
    subscribers = new Set<() => void>;
    /**
     *  Adds a function to a state' subscriber list.
     *  @internal
     */
    depend(): void {
        if (activeEffect) this.subscribers.add(activeEffect);
    }
    /** 
     * Calls all functions in the states subscribers list. 
     * @internal
     */
    notify(): void {
        this.subscribers.forEach(sub => sub());
    }
}

/**
 * Createas a store object, where updating data will trigger a page update.
 * @param obj - the inital state object.
 */
export const createStore = (obj: Record<string, unknown>): void => {
	store = addDependencies(obj)
};

/**
 * Sets getters and setters on each key of the provided object.
 * Setters are used to trigger page updates when state is updated.
 * @param obj - The state object
 * @returns The object with getters and setters set.
 * @example
 * ```js
 * createStore({
 *  count: 0,
 *  xPos: 24,
 *  name: Albert
 * })
 * ```
 */
const addDependencies = (obj: Record<string, unknown>): Record<string, unknown> => {
    Object.keys(obj).forEach(key => {
        const dep = new Dependency();
        let value = obj[key];
		if (typeof value === "object" && !Array.isArray(value) && value !== null) {
			// @ts-ignore Not sure if safe to ignore, should check object sigature here, to make sure that the keys are strings, but don't know how to do it
			obj[key] = addDependencies(value) 
		}
		Object.defineProperty(obj, key, {
			get() {
				dep.depend();
				return value;
			},
			set(newValue: unknown) {
				if (newValue === value) return; 
				value = newValue;
				dep.notify();
			},
		});
    });
    return obj;
}