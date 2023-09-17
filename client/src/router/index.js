import { createRouter } from "../../mist/index";
import Bomberman from "../views/bomberman";

const router = createRouter([
	{
		path: "/",
		name: "home",
		title: "Bomberman",
		view: Bomberman
	}
]);

export default router;