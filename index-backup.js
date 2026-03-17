//import http from "http"
import express from "express"
import { fileURLToPath } from 'url';
import path from 'path'
import { engine } from 'express-handlebars'


//Inicializaciones
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//const mi_servidor = http.createServer()
//const mi_servidor = new Express()
const mi_servidor = express()


//Configuraciones
mi_servidor.engine('handlebars', engine());
mi_servidor.set('view engine', 'handlebars');




//Rutas
//Creacion de end point nuevo : 
//if(req.url === "" && req.method == "") {...}
//Express.method(URL,callback)
mi_servidor.get("/", (req, res) => {

    const plantilla = `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backend Coderhouse</title>
</head>
<body>
    <h1>Soy el server de Express</h1>
</body>
</html>
    `

    //res.send("Hola Mundo")
    //res.send(plantilla)
    //const laRutaDelArchivo = path.join(__dirname, "index.html")

    //res.sendFile(laRutaDelArchivo)
    res.render("index")

})

mi_servidor.get("/usuarios", (req, res) => {
    res.send([{ id: 1, nombre: "Horacio" }, { id: 2, nombre: "Santiago" }])
})




//Apertura de puertos + conexion a DB
//mi_servidor.listen(PORT,callback)
mi_servidor.listen(3000, () => {
    console.log("Server up and running!")
})