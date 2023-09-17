import { VElement } from "../dom/node";

/** Represents a  single route in {@link Router}. */
export interface Route {
    path: string,
    name: string,
    view: (state: Record<string, unknown>) => VElement,
    title?: string,
}


/** Holds global router created in {@link createRouter}. */
export let router: Router;

/**
 * Creates {@link Router}, binds it to {@link router} and returns it.
 *
 * @example
 * ```ts
 * import Home from "../views/home.jsx"
 *
 * const router = createRouter([
 *    {
 *      path: "/",
 *      name: "home",
 *      title: "Home",
 *      view: Home
 *    }
 * ])
 * ```
 * @param routes - The defined routes
 * @returns The created router.
 */
export const createRouter = (routes: Route[]): Router => {
    router = new Router(routes);
    return router;
};

/** Represents a Router that contains routes and methods to manipulate browser history via URL and keeps track of it. */
export class Router {
    /** Contains all the routes in the Router. */
    routes: Route[];

    /**
     * Creates a Router that contains routes and methods to manipulate browser history via URL.
     *
     * @param routes - The defined routes
     */
    constructor(routes: Route[]) {
        this.routes = routes;
    }

    /**
     * Pushes a new state to window.history stack and then emits a "routerPush" event that then triggers template to be rerendered in {@link createApp}.
     * @param props - Route params
     *  @example
     * ```html
     *   <button onClick={() => router.push({ type: "path", value: "/profile" })}>Profile</button>
     * ```
     */
    push(props: { type: string, value: string }): void {
        const route = this.locationHandler(props);

        const currentPath = window.location.pathname;
        if (currentPath === route.path) return;

        window.history.pushState({}, "", route.path);

        const event = new Event("routerPush");
        document.dispatchEvent(event);
    }

    /**
     * Looks for a {@link Route} if wrong type is provided, throws an error.
     * @param props - Route params
     * @example
     * ```ts
     * let route = this.getRoute({ type: "name", value: "profile" }) // Route {path: "/", name: "profile", title: "Profile", view: Profile}
     * ```
     * @internal
     * @returns
     */
    #getRoute(props: { type: string, value: string }): Route | undefined {
        switch (props.type) {
        case "path":
            return this.routes.find(route => route.path === props.value);
        case "name":
            return this.routes.find(route => route.name === props.value);
        default:
            throw new Error("Wrong router type provided");
        }
    }

    /**
     * Looks for a {@link Route}, throws an error if 404 route is not defined and no route is found.
     *
     * @param props - Route params
     * @example
     * ```ts
     *      route = router.locationHandler({type: "path", value: window.location.pathname})
     *      const newApp = route.view(store)
     *      app.mount(targetSelector, newApp.render())
     *      app = newApp
     *
     * ```
     * @internal
     */
    locationHandler = (props: { type: string, value: string }): Route => {
        let route = this.#getRoute(props);

        if (!route) {
            route = this.#getRoute({ type: "name", value: "404" });

            if (!route) {
                throw new Error(`Can't find any defined routes with ${props.type} of '${props.value}'`);
            }
        }
        document.title = route.title ?? window.location.href;

        return route;
    };
}