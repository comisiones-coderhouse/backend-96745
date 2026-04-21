const btn = document.querySelector("#btn")//<button/>
const userForm = document.querySelector("#user-form")//<form/>

btn.addEventListener("click", () => {
    fetch("/api/products")
        .then((res) => {
            return res.json()
        })
        .then((data) => {
            const productsList = document.querySelector("#products-list")

            data.forEach((product)=>{

                const li = document.createElement("li")
                li.innerText = `${product.title} - $${product.price || 0}`
                productsList.appendChild(li)

            })

        })
        .catch(() => {
            console.log("hubo un error")
        })
})

userForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const input = userForm.querySelector("input")
    const valor = input.value //"Alan"
    const usuario = { name: valor } //{name:"Alan"}
    const usuarioEnString = JSON.stringify(usuario)

    //axios()
    fetch("/usuarios", {
        method: "POST",
        headers: {
            "Content-Type" : "application/json"
        },
        body: usuarioEnString
    })
})