//import Usuario from "./Usuario.js"
const Usuario = require("./Usuario.js")
/* 

Sintaxis de clases 

class <NombreDeClase> {

    //propiedades privadas
    [#nombreDeProp;]

    //metodo constructor
    [constructor(){}]

    //otros metodos
    [<nombreDelMetodo>(){}]

}

*/


//Instancia : Instancie la clase Usuario, osea, cree un objeto nuevo
const instancia_1 = new Usuario("Horacio", "horacio@email.com", "123456")//
const instancia_2 = new Usuario("Juan", "juan@email.com", "123456")
const instancia_generico = {}

console.log(instancia_1)//Usuario{}
console.log(instancia_2)//Usuario{}
console.log(instancia_generico)//{}

//{nombre,edad,#password,password}

//instancia_1.password = "789012"
//instancia_1.#password = "789012"

//console.log(instancia_1.#password)//No se puede .#


instancia_1.getPassword();