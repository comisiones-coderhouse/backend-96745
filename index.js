import express from "express"
import { engine } from 'express-handlebars'
import { createServer } from "http";
import { Server } from "socket.io";

//Inicializaciones
//mi_servidor es la instancia del servidor Express
const mi_aplicacion = express()
// http://localhost:3000
const mi_servidor = createServer(mi_aplicacion)
// ws://localhost:3000
const io_servidor = new Server(mi_servidor)


//Middleware
//con esto podemos apuntar todos los pedidos del servidor que NO COINCIDAN con las rutas a la carpeta public
mi_aplicacion.use(express.static("public"))
//con esto podemos recibir objetos JSON desde el frontend (en el body de la petición)
mi_aplicacion.use(express.json())

//Configuraciones (para el frontend (html))
//con esto le decimos a Express qué cosa es "handlebars"
mi_aplicacion.engine('handlebars', engine());
//con esto le decimos a Express que use Handlebars como motor de plantillas
mi_aplicacion.set('view engine', 'handlebars');


const usuarios = [
    { id: 1, nombre: "Horacio" },
    { id: 2, nombre: "Santiago" }
]

//Rutas
mi_aplicacion.get("/", (req, res) => {
    res.render("index")
})

mi_aplicacion.get("/productos", (req, res) => {
    res.render("productos")
})

mi_aplicacion.get("/usuarios", (req, res) => {
    res.send(usuarios)
})

mi_aplicacion.post("/usuarios", (req, res) => {
    //console.log(req.body)
    usuarios.push(req.body)
    res.send("OK")
})


//io_servidor.addEventListener()
//io_servidor.addListener()
io_servidor.on("connection", (req) => { 
    console.log("Nuevo cliente conectado")
})

//Apertura de puertos + conexion a DB
//mi_servidor.listen(PORT,callback)
mi_servidor.listen(3000, () => {
    console.log("Server up and running!")
})