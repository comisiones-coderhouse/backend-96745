import express from "express"
import { engine } from 'express-handlebars'

import landingRoutes from "./routes/landing.routes.js"
import productsRoutes from "./routes/products.routes.js"
import chatRoutes from "./routes/chat.routes.js"
import userRoutes from "./routes/usuarios.routes.js"

//Init
const mi_aplicacion = express()

//Middlewares
mi_aplicacion.use(express.static("public"))
mi_aplicacion.use(express.json())

//View settings
mi_aplicacion.engine('handlebars', engine());
mi_aplicacion.set('view engine', 'handlebars');

mi_aplicacion.use(landingRoutes)
mi_aplicacion.use(productsRoutes)
mi_aplicacion.use(chatRoutes)
mi_aplicacion.use(userRoutes)

export default mi_aplicacion