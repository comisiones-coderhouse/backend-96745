import express from "express"
import { fileURLToPath } from 'url';
import path from 'path'
import { engine } from 'express-handlebars'


//Inicializaciones
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mi_servidor = express()


//Middleware
// middleware ----->  aca pasa algo  ----> callback
/* 
Express.use(function(req,res,next){

    next()
})
*/
/* mi_servidor.use(function(req,res,next){
    console.log("Pase por el middleware")
    next()
}) */
mi_servidor.use(express.static("public"))
mi_servidor.use(express.json())

//Configuraciones
mi_servidor.engine('handlebars', engine());
mi_servidor.set('view engine', 'handlebars');


const usuarios = [
    { id: 1, nombre: "Horacio" }, 
    { id: 2, nombre: "Santiago" }
]


//Rutas
mi_servidor.get("/", (req, res) => {
    res.render("index")
})

mi_servidor.get("/productos", (req, res) => {
    res.render("productos")
})

mi_servidor.get("/usuarios", (req, res) => {
    res.send(usuarios)
})

mi_servidor.post("/usuarios", (req, res) => {
    //console.log(req.body)
    usuarios.push(req.body)
    res.send("OK")
})

//Apertura de puertos + conexion a DB
//mi_servidor.listen(PORT,callback)
mi_servidor.listen(3000, () => {
    console.log("Server up and running!")
})