import userModel from "../models/usuarios.model.js"

class UsersController {
    static getUsers = (req, res) => {
        userModel.find()
            .then((data) => {
                res.send(data)
            })
            .catch((err) => {
                console.log(err)
                return res.status(500).send("Hubo un error")
            })
    }
    
    static createUser = (req, res) => {
        //userModel.create({ nombre: req.body.nombre })
        userModel.create(req.body)
            .then(() => {
                return res.send("OK")
            })
            .catch((err) => {
                console.log(err)
                return res.status(500).send("Hubo un error")
            })
    }
}

export default UsersController