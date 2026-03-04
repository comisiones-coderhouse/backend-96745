console.log("Hola mundo");

//let nombre = "Facundo";
//const nombre = "Facundo";
//const email = "facu@email.com";
/* 
const usuarios = {
    [nombre : "Ariel", email : "facu@email.com"],
    [nombre: "Diego", email : "facu@email.com"],
} 
*/
/* 
const usuarios = [
    {
        nombre: "ariel",
        email: "ariel@email",
    },
    {
        nombre:"facundo",
        email:"facu@email",
    }
] 
*/
const usuario_1 = {
    nombre: "ariel",
    email: "ariel@email",
};

const usuario_2 = {
    nombre: "facundo",
    email: "facu@email",
};

const usuarios = [usuario_1, usuario_2];



/* 
Sintaxis generica de funciones

Estandar : 

function <un_nombre> (param1,param2) {}


Flecha : 

const <un_nombre> = (param1,param2) => {}

*/


//const usuario => {[nombre , email]} ;
/* 

function usuarios (nombre, email) {
    console.log (nombre + " " + email)
}

const usuarios  = (nombre, email) => {
    console.log (nombre + " " + email)
}

*/

/* function saludar(nombre){
    console.log("Hola, soy " + nombre)
    //return undefined;
} */

/* const saludar = (nombre) => {
    console.log("Hola, soy " + nombre)
    //return undefined;
}
 */
/* const saludar = (nombre,edad) => {
    console.log("Hola, soy " + nombre)
    //return undefined;
}
 */
/* const saludar = nombre => {
    console.log("Hola, soy " + nombre)
    //return undefined;
} */

//const saludar = nombre => /* return */ console.log("Hola, soy " + nombre)


//Pasar por referencia
const obj = { x : 1 }
const copia = obj

console.log(obj)
console.log(copia)

copia.x = 2

console.log(obj)
console.log(copia)


function fabricarUsuario(param1,param2){

    const persona = {
        nombre : param1,
        email : param2,
        saludar : function(){
            console.log("Hola")
        }
    }

    return persona
}

const res_1 = fabricarUsuario("horacio","horacio@email.com")
const res_2 = fabricarUsuario("juan","juan@email.com")

console.log(res_1)
console.log(res_2)

res_2.nombre = "Juancito"

console.log(res_1)
console.log(res_2)

res_1.saludar()
res_2.saludar()