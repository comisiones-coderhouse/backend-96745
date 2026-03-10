/* 
Servidores NET 
Servidores Web (HTTP)

HTTP 

Cliente/Request
Method URL/IP:PORT httpVersion*
Headers*
Body*

Servidor/Response
httpVersion* statusCode <-> statusMessage
Headers*
Body*


*/

import http from "http"

console.log("Booting up server, please wait...")
const mi_servidor = http.createServer(/* (req,res) => {
    console.log("Hubo un pedido")
    } */)

//document.addEventListener("click",()=>{})
//mi_servidor.addListener("")
mi_servidor.on("request", (req, res) => {
    console.log("Hubo un pedido")
    console.log("URL", req.url)
    console.log("METHOD", req.method)
    console.log("HTTP VERSION", req.httpVersion)

    if (req.method === "GET" && req.url === "/") {
        res.end("Me pediste la landing")
    }

    if (req.method === "GET" && req.url === "/usuarios") {
        res.end("Me pediste un array de usuarios")
    }

    //MIME Type
    //res.end("Hola Mundo")
})


mi_servidor.listen(3000, () => {
    console.log("Server up and running!")
})