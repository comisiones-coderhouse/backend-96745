//const Usuario = require("./Usuario.js")
import Usuario from "./Usuario.js"

//import path from "path"
//const resultado = path.join("carpeta1", "carpeta2", "archivo.txt")

const usuario_uno = new Usuario("Horacio", "horacio@ejemplo.com", "123456");

const resultado_de_saludar = usuario_uno.saludar()

console.log("🚀 ~ resultado_de_saludar:", resultado_de_saludar)
