import { Router } from "express"
import ViewsController from "../controllers/views.controller.js"

const router = Router()

router.get("/productos", ViewsController.getProducts)

export default router