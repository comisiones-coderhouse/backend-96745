//import http from "http"
import express from "express"

console.log("Booting up server, please wait...")

//const mi_servidor = http.createServer()
//const mi_servidor = new Express()
const mi_servidor = express()

//Creacion de end point nuevo : 
//if(req.url === "" && req.method == "") {...}
//Express.method(URL,callback)
mi_servidor.get("/", (req, res) => {
    res.send("Hola Mundo")
})

mi_servidor.get("/usuarios", (req, res) => {
    res.send([{ id: 1, nombre: "Horacio" }, { id: 2, nombre: "Santiago" }])
})


//mi_servidor.listen(PORT,callback)
mi_servidor.listen(3000, () => {
    console.log("Server up and running!")
})