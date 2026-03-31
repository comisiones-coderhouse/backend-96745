import express from "express"

const app = express()

app.use(express.json()) // Middleware para parsear JSON en el cuerpo de las solicitudes

app.get("/", (req, res) => {
    //res.send(["Welcome to my API"])
    //res.send({ message: "Welcome to my API" })
    //res.json(["Welcome to my API"])
    res.json({ message: "Welcome to my API" })
})

app.post("/echo", (req, res) => {
    //req.params = "/echo/:id"
    //req.query = "/echo?name=John"
    //req.body = { "name": "John" }
    console.log(req.body) //{}
    res.send(req.body)
})

app.listen(3000, () => {
    console.log("Servidor escuchando en el puerto 3000")
})