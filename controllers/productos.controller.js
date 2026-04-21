import productsModel from "../models/products.model.js"

class ProductsController {
    static getProducts = (req, res) => {
        productsModel.find()
            .then((data) => {
                res.send(data)
            })
            .catch((err) => {
                console.log(err)
                return res.status(500).send("Hubo un error")
            })
    }

    static createProduct = (req, res) => {
        productsModel.create(req.body)
            .then(() => {
                return res.send("OK")
            })
            .catch((err) => {
                console.log(err)
                return res.status(500).send("Hubo un error")
            })
    }
}

export default ProductsController