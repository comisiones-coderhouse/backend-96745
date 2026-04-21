import mongoose from "mongoose";
import validator from "validator"
//yup - zod

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        validate: {
            validator: (data) => {
                const isAlphaName = validator.isAlphanumeric(data, "es-ES", { ignore: " " }) //true | false
                return isAlphaName
            },
            message: "Hubo un error de validacion en los datos del producto"
        }
    }
}, {
    timestamps: true
})

const productModel = mongoose.model("product", productSchema)

export default productModel