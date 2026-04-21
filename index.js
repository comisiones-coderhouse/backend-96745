import { createServer } from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import mi_aplicacion from './app.js';


//Inicializaciones
const mi_servidor = createServer(mi_aplicacion)
const io_servidor = new Server(mi_servidor)

io_servidor.on("connection", (socket) => {

    console.log("New socket connected!")

    socket.on("chat-message", (data) => {

        socket.broadcast.emit("chat-message-server", data)

    })
})

mongoose.connect("mongodb://127.0.0.1:27017/ecommerce")
    .then(() => {
        console.log("Connected to DB")
    })
    .catch(() => {
        console.log("Hubo un problema")
    })

mi_servidor.listen(3000, () => {
    console.log("Server up and running!")
})