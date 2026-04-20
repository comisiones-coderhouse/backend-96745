import mongoose from "mongoose";
import validator from "validator"
//yup - zod

const userSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        validate: {
            validator: (data) => {
                const isAlphaName = validator.isAlpha(data, "es-ES", { ignore: " " }) //true | false
                return isAlphaName
            },
            message: "Hubo un error de validacion en el 'nombre'"
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (data) => {
                const isValidEmail = validator.isEmail(data)
                return isValidEmail
            },
            message: "Hubo un error de validacion en el 'email'"
        }
    }
}, {
    timestamps: true
})

const userModel = mongoose.model("user", userSchema)

export default userModel