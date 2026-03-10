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

    //async / await
    //saludar = async () => {}
    async saludar() {
        console.log("Guardando el saludo en DB...")

        /* const promesa_uno = new Promise((res, rej) => {
            setTimeout(() => {
                res()
            }, 2000)
        })

        promesa_uno
            .then(() => {
                const promesa_dos = new Promise((res, rej) => {
                    setTimeout(() => {
                        res()
                    }, 2000)
                })

                return promesa_dos
            })
            .then(()=>{
                console.log("Segunda promesa resuelta")
            })
            .catch(() => {
                console.log("Error al guardar el saludo en DB")
            })
            .finally(() => {
                console.log("Termino la promesa")
            }) */


        try {

            const promesa_uno = await new Promise((res, rej) => {
                setTimeout(() => {
                    res()
                }, 2000)
            })

            const promesa_dos = await new Promise((res, rej) => {
                setTimeout(() => {
                    res()
                }, 2000)
            })
            console.log("Segunda promesa resuelta")


        } catch (error) {
            console.log("Hubo un error")
        }


        console.log("Envio mensaje a el receptor")
        //return undefined;
    }

    getPassword() {
        //***456
        console.log(this.#password)
    }

}


export default Usuario;
//module.exports = Usuario;