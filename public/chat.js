//esto inicia una conexion con un servidor de web socket en la direccion : ws://localhost:3000
const socket = io()

const sendBtn = document.querySelector("#send-btn");
const messageText = document.querySelector("#message");
const messageList = document.querySelector("#message-list");

sendBtn.addEventListener("click", () => {

    const mensaje = messageText.value;
    const li = document.createElement("li");
    li.textContent = mensaje

    //btn.addEventListener("click",()=>{})
    socket.emit("chat-message", mensaje)

    messageText.value = ""
    messageText.focus()
    messageList.append(li)

})

socket.on("chat-message-server", (data) => {
    const li = document.createElement("li");
    li.textContent = data
    messageList.append(li)
})