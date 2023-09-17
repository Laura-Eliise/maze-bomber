/**
 * Creates a virtual node i.e. the JS representation of a DOM element
 * @example
 * Example of creating an Image Element
 * ```ts
 * jsxTransform("image", {src: "image.jpg"}) // {tagName: "image", props: {src: "image.jpg"}, children: [], text: null}
 * jsxTransform({ tagName: "button", props: {onClick: () => state.count++ }, children: ["Press!"] }); // {tagName: "button", props: {onClick: () => state.count++}, children: [{tagname: "", props: {}, children: [], text: "Press!"}]}
 *
 * ```
 * @remarks The properties of VElement are private, so console logging it would reveal undefined values
 *
 * @param tagName - The type of element to create
 * @param props - The properties to be given to the created element
 * @param children - The children nodes of the created element
 * @returns instance of the VElement class
 */
export const jsxTransform = (tagName: string, props: Props | null, ...children: vNode[]): VElement => {
    if (props === null) props = {};
    return new VElement({ tagName, props, children });
};

/**
 * Represents a virtual element that can updated, rendered and mounted
 */
export class VElement {
    #tagName = "";
    #props: Props = {};
    #children: VElement[] = [];
    #text: string | null = null;

	#el: Text | Element = document.createElement("div");
    /**
     * Creates a virtual element from {@link vNode}
     *
     * @example
     * Example of creating a virtual element
     * ```ts
     * let el1 = new VElement("Hello, world!");
     * let el2 = new VElement({ tagName: "button", props: {onClick: () => state.count++ }, children: ["Press!"] });
     * let el3 = new VElement({ tagName: "div", props: {}, children: [el2] });
     * let el4 = new VElement({ tagName: "div", props: {}, children: [{ tagName: "span", props: {}}, children: ["Message"] }] })
     * ```
     *
     * @param node - The properties to be given to the element
     */
    constructor(node: vNode) {
        this.#set(node);
    }
    /**
     * Sets the properties of this VElement based on the given {@link vNode}
     * @internal
     *
     * @param node - The properties to be given to the element
     */
    #set(node: VElement | vNode): void {
        let params;
        if (node instanceof VElement) {
            params = node.get();
        }
        else {
            params = node;
        }

        this.#tagName = "";
        this.#props = {};
        this.#children = [];
        this.#text = null;

        if (typeof params === "object" && !Array.isArray(params)) {
            if (!params.tagName) {
                throw new Error("ERROR: failed to set VElement properties: Element has undefined object values");
            }
            this.#tagName = params.tagName;
            this.#props = params.props;
            this.#children = params.children.flat().map((child: vNode | VElement) => {
                return child instanceof VElement ? child : new VElement(child);
            });
        }
        else if (typeof params === "string") {
            this.#text = params;
        }
        else if (typeof node === "number") {
            this.#text = String(params);
        }
        else {
            throw new Error("ERROR: failed to set VElement properties: Element is undefined");
        }
    }
    /**
     * Gets the properties of the element
     *
     * ```ts
     * let el1: VElement = jsxTransform("image", {src: "image.jpg"});
     * let el2: VElement = jsxTransform({ tagName: "button", props: {onClick: () => state.count++ }, children: ["Press!"] });
     *
     * el1.get() // {tagName: "image", props: {src : "image.jpg"}, children: []}
     * el2.get() // {tagName: "button", props: {onClick: () => state.count++}, children: ["Press!"]}
     * ```
     * @returns - The properties of the element
     */
    get(): vNode {
        if (this.#text !== null) {
            return this.#text;
        }
        else {
            return {
                tagName: this.#tagName,
                props: this.#props,
                children: this.#children,
            };
        }
    }

    /**
     * Updates the DOM by comparing the tag name, properties and children of 2 virtual nodes.
     *
     * @example
     * Example of updating
     * ```ts
     * let el1 = new VElement({tagName: "button", props: {onClick: () => state.count++ }, children: ["Press!"]});
     * let el2 = new VElement({tagName: "button", props: {}, children: ["Press now!"]});
     * let app = new VElement({tagName: "div", props: {}, children: [el1]});
     * el1.update(app.render(), el2);
     * ```
     *
     * @param newNode - representation of the current element after changes
     */
    update(newNode: VElement | undefined): void {
        if (!newNode) {
			this.#el.parentNode?.removeChild(this.#el)
            return;
        }

		const el = (newNode.#el = this.#el);
        /** If element is an object and new node is a string then element has to be replaced. */
        if (this.#text !== null || newNode.#text !== null) {
            if (this.#text !== newNode.#text) {
                this.#set(newNode);
				el.parentNode?.replaceChild(newNode.render(), el)
            }
            return;
        }

        /** If elements have different tag names then they have to be replaced. */
        if (this.#isDifferentElement(newNode)) {
            this.#set(newNode);
            el.parentNode?.replaceChild(newNode.render(), el);
            return;
        }

		if (this.#el instanceof Text) return;
		
        /** Updating Properties */
		this.#updateProps(this.#el, newNode.#props)

		/** Exception for handling <ul> so that children are compared correctly*/
 		if ( this.#tagName === "ul" && newNode.#tagName === "ul") {
            if (this.#children.length > newNode.#children.length) {
				this.#children = this.#diffList(newNode);
            }
		}

        /** Updating children recursively */
        const newChildCount = newNode.#children.length;
        const oldChildCount = this.#children.length;

        /** Update Common Children */
        for (let i = 0; i < newChildCount && i < oldChildCount; i++) {
   	        this.#children[i].update( newNode.#children[i] );
        }
        /** Remove Unneeded Children */
        if (oldChildCount > newChildCount) {
            for (let i = newChildCount; i < oldChildCount; i++) {
                el.removeChild(this.#children[i].#el)
            }
        }

        /** Add addtional Children */
        if (newChildCount > oldChildCount) {
            for (let i = oldChildCount; i < newChildCount; i++) {
				el.appendChild(newNode.#children[i].render())
            }
        }
    }
    
	/**
	 * Compares two unordered list elements and correctly makes changes between them
     * @internal
     * 
	 * @param newNode - new VElement that is a unordered list
	 * @returns - An updated list of VElements
	 */
    #diffList(newNode: VElement): VElement[] {
        const newList: VElement[] = [];

		for ( const child of this.#children ) {
            const match: VElement | undefined = newNode.#children.find(newChild => child.#props.id === newChild.#props.id);

			if (match) {
				newList.push(child)
			} else {
				this.#el.removeChild(child.#el)
			}
		}
		return newList;
    }

    /**
     * Compares two elements
     * @internal
     *
     * @param node - element to compare
     * @returns 'true' if the elements are different, 'false' otherwise
     */
    #isDifferentElement(node: VElement): boolean {
        return this.#tagName != node.#tagName;
    }

    /**
     * Renders the element
     *
     * @example
     * Example of rendering
     * ```ts
     * let el = new VElement({tagName: "button", props: {onClick: () => state.count++ }, children: ["Press!"]});
     * let text = el.render();
     * ```
     *
     * @returns Html Text or HTML Element based on the VElement
     */
    render() {
        if (this.#text != null) {
			let el = document.createTextNode(this.#text);
			this.#el = el;
			return el;
        }

        const el = document.createElement(this.#tagName);
        /** Set Properties */
        for (const [k, v] of Object.entries(this.#props)) {
            this.#setProp(el, k, v);
        }
        this.#addEventListeners(el, this.#props);
        /** Render Children recursively */
        for (const child of this.#children) {
            el.appendChild(child.render());
        }
		this.#el = el;
        return el;
    }

    /**
     * Mounts a HTML element to a container.
     *
     * @example
     * Example of mountinghello
     * ```ts
     * let el = new VElement({tagName: "button", props: {onClick: () => state.count++ }, children: ["Press!"]});
     * el.mount("app")
     * ```
     *  Example
     * @param targetIdentifier - Name of the container
     * @param $node - HTML element that will be appended into the container
     * @defaultValue $node = this.{@link render}()
     * @returns HTML element that is the parent of the mounted $node
     */
    mount(targetIdentifier: string, $node: Text | Element = this.render()): Element {
    // mount(targetIdentifier: string): Element {
        const $target = document.querySelector(targetIdentifier);

        if ($target === null) {
            throw new Error(`Mount point ${targetIdentifier} not found.`);
        }

        while ($target.lastChild) {
            $target.removeChild($target.lastChild);
        }

        $target.appendChild($node);
        return $target;
    }

    /* Methods related to updating the properties */

    /**
     * Updates the properties of an HTML element
     * @internal
     *
     * @param $target - HTML element
     * @param newProps - new properties
     */
    #updateProps($target: Element, newProps: Props): void {
        const props = Object.assign({}, newProps, this.#props);
        Object.keys(props).forEach(name => {
            const newValue = newProps[name];
            const oldValue = this.#props[name];

            if (newValue === undefined) {
                this.#removeProp($target, name, oldValue);
            }
            else if (oldValue === undefined || newValue !== oldValue) {
                this.#setProp($target, name, newValue);
            }
        });
    }
    /**
     * Sets a given non event property to an HTML element
     * @internal
     *
     * @param $target - HTML element
     * @param name - name of the property
     * @param value - value assigned to the property
     */
    #setProp($target: Element, name: string, value: unknown): void {

        if (this.#isEventProp(name, value)) {
            return;
        }
        else if (name === "className") {
            if (typeof value === "string") {
                $target.setAttribute("class", value);
            }
        } 
		else if ( name === "checked" && typeof value === "boolean") {
			($target as HTMLInputElement).checked = value;
		}
        else {
            $target.setAttribute(name, String(value));
        }
    }
    /**
     * Removes a given (non event) property from an HTML element
     * @internal
     *
     * @param $target - HTML element
     * @param name - name of the property
     * @param value - value to be removed from the property
     */
    #removeProp($target: Element, name: string, value: unknown): void {
        if (this.#isEventProp(name, value)) {
            return;
        }
        else if (name === "className") {
            $target.removeAttribute("class");
        }
        else {
            $target.removeAttribute(name);
        }
    }
    /**
     * Checks if the given property is an event property
     * @internal
     *
     * @param name - name of the property
     * @param value - value of a property
     * @returns 'true' if its an event property, 'false' otherwise
     */
    #isEventProp(name: string, value: unknown): boolean {
        if (name.startsWith("on")) {
            if (typeof value !== "function") {
                throw new Error(`eventListener ${name} has to have function as value`);
            }
            return true;
        }
        return false;
    }

    /**
     * Adds event listeners to the target
     * @internal
     *
     * @param $target - HTML element the properties will be added to
     * @param props - Properties
     */
    #addEventListeners($target: Element | Text, props: Props): void {
        Object.keys(props).forEach(name => {
            const value = props[name];
            if (this.#isEventProp(name, value) && typeof value === "function") {
                $target.addEventListener(
                    this.#extractEventName(name),
                    value
                );
            }
        });
    }
    /**
     * Extracts the name of the event from a string
     * @internal
     *
     * @param name - string
     * @returns extracted property name
     */
    #extractEventName(name: string): string {
        return name.slice(2).toLowerCase();
    }
}

/**
 * Virtual Node type is either an Element node or a plain Text node
 * @typeParam elNode - {@link elNode}
 */
export type vNode = string | elNode;

/** Virtual Element node */
export interface elNode {
    tagName: string;
    props: Props;
    children: vNode[] | VElement[];
}

/** Properties of a virtual node */
export type Props = Record<string, string | number | (() => void)>;