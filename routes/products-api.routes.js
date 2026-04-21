import { Router } from "express"
import ProductsController from "../controllers/productos.controller.js"

const router = Router()

//router.get("/", (req, res) => {
    //req es el pedido del cliente (browser, postman, etc)
    //req.body -> datos enviados por el cliente en el body del request
    //req.query -> datos enviados por el cliente en la URL despues de "?"
    //req.params -> datos enviados por el cliente en la URL despues de "?"
    //res.send("Hola desde la ruta de /api/products")
//})
router.get("/", ProductsController.getProducts)

router.get("/:id", (req, res) => {

    /* console.log(req.body)
    console.log(req.query)
    console.log(req.params) */

    res.send("Hola desde la ruta de /api/products/:id")
})

router.post("/", ProductsController.createProduct)

router.put("/:id", (req, res) => {
    res.send("Hola desde la ruta de PUT /api/products/:id")
})

router.delete("/:id", (req, res) => {
    res.send("Hola desde la ruta de DELETE /api/products/:id")
})

export default router