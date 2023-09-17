import { store } from "./state/store";
import { watchEffect } from "./state/store";
import { Router } from "./router/router";

/**
 * Renders and mounts the app and updates it if state or the url is changed.
 * @param targetSelector - The element in the html file where the app should be mounted.
 * @param router - Router that specifies which template should be rendered on which route. Minimum 1 route.
 * @example
 * ```js
 * const router = createRouter([
 *	{
 *		path: "/",
 *		name: "home",
 *		title: "Home",
 *		view: Body
 *	}
 *	])
 * createApp("#app", router);
 * ```
 */
export const createApp = (targetSelector: string, router: Router): void => {
    let route = router.locationHandler({ type: "path", value: window.location.pathname });

    /** Transforms JSX to valid JS */
    let app = route.view(store);
    /** Renders the app and mounts it to the specified element */
	app.mount(targetSelector, app.render());

    /** Listens for state changes and updates the page */
    watchEffect(() => {
        const newApp = route.view(store);
        app.update(newApp);
        app = newApp;
    });

    /** Listens for popstate event which is triggered when using browser forward/backwards buttons */
    window.addEventListener("popstate", () => {
        document.dispatchEvent(new Event("routerPush"));
    });

    /** Listens for URL changes and updates the page */
    document.addEventListener("routerPush", () => {
        route = router.locationHandler({ type: "path", value: window.location.pathname });
        const newApp = route.view(store);

        app.mount(targetSelector, newApp.render());
        app = newApp;
    });
};