//Clase
class Usuario {

    #password

    //"Horacio", "horacio@email.com"
    constructor(nombreInput, emailInput, passwordInput) {
        //const this = {}
        this.nombre = nombreInput
        this.email = emailInput
        this.#password = passwordInput
        //return this;
    }

    saludar() {
        console.log("Hola")
    }

    getPassword(){
        //***456
        console.log(this.#password)
    }

}


//export default Usuario;
module.exports = Usuario;