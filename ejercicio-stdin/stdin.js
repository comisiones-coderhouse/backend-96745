//console.log(process)
//console.dir(process, { depth: 0 })


let maintenanceMode = false
//process.stdin.addEventListener("click",()=>{})
//process.stdin.addListener()
process.stdin.on("data", (chunk) => {

    const input = chunk.toString().trim()

    if (input === "maintenance on") {
        maintenanceMode = true
    } else if (input === "maintenance off") {
        maintenanceMode = false
    }

    if (maintenanceMode === true) {
        process.stdout.write("Entrando en modo mantenimiento...")
    } else {
        process.stdout.write(`Recibí: ${input}`)
    }
})

/* 

process.stdout */