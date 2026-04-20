import { Router } from "express"
import ViewsController from "../controllers/views.controller.js"

const router = Router()

router.get("/chat", ViewsController.getChat)

export default router