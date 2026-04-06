# Semana 6: Desarrollo de Aplicaciones en Tiempo Real con WebSockets

Hasta ahora todo lo que construimos sigue el modelo request-response: el cliente pide, el servidor responde, y la conexion se cierra. Ese modelo funciona bien para la mayoria de las cosas, pero hay casos donde necesitas que el servidor le envie informacion al cliente *sin que el cliente la haya pedido*. Para eso existen los WebSockets.

---

## 1. HTTP vs WebSockets

Con **HTTP** el flujo es siempre unidireccional iniciado por el cliente:

```
Cliente                    Servidor
  |---  GET /mensajes  -->    |
  |<-- 200 [datos] ------     |
  |  (conexion se cierra)     |
```

Si queres ver mensajes nuevos, tenes que volver a hacer el request. Una tecnica vieja para simular tiempo real es el **polling**: hacer requests repetidos cada N segundos. Es ineficiente: genera trafico innecesario y la "actualizacion" siempre llega tarde.

Con **WebSockets** se establece una conexion persistente y bidireccional:

```
Cliente                    Servidor
  |--- Handshake HTTP -->     |
  |<-- 101 Switching  ---     |
  |                           |
  |<-- mensaje nuevo ----     |  (servidor envia sin que el cliente pida)
  |--- respuesta ------->     |
  |<-- otro mensaje ----      |
  |           ...             |
  |--- close ---------->      |
```

El "handshake" inicial usa HTTP, pero despues la conexion se convierte a WebSocket y se queda abierta. Tanto el cliente como el servidor pueden enviar mensajes en cualquier momento.

| | HTTP | WebSocket |
|---|---|---|
| Conexion | Se abre y cierra en cada request | Persistente |
| Direccion | Siempre del cliente al servidor | Bidireccional |
| Cuando usar | APIs REST, recursos estaticos | Chat, notificaciones, juegos, dashboards en vivo |
| Overhead por mensaje | Alto (headers completos) | Bajo (trama liviana) |

---

## 2. Socket.io

**Socket.io** es la biblioteca mas popular para trabajar con WebSockets en Node.js. Agrega una capa sobre WebSockets nativos que incluye:

- Reconexion automatica si se cae la conexion
- Fallback a polling HTTP en redes que bloquean WebSockets
- **Rooms**: grupos de clientes que reciben los mismos mensajes
- **Eventos**: modelo de comunicacion basado en nombres de eventos (como EventEmitter)

```bash
npm install socket.io
```

Socket.io tiene dos partes: el servidor (Node.js) y el cliente (navegador). Ambos deben estar instalados o importados.

---

## 3. Configuracion del servidor

Socket.io necesita adjuntarse al servidor HTTP. La forma mas comun con Express:

```js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app); // creamos el servidor HTTP manualmente
const io = new Server(httpServer);         // socket.io se adjunta al mismo servidor

app.use(express.static("public"));

// evento principal: cuando un cliente se conecta
io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // socket.id es un identificador unico para cada cliente conectado

    // cuando el cliente se desconecta
    socket.on("disconnect", () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});

httpServer.listen(3000, () => {
    console.log("Servidor en http://localhost:3000");
});
```

**Importante**: en lugar de `app.listen(3000)` usamos `httpServer.listen(3000)`. Esto es porque Socket.io necesita el servidor HTTP subyacente, no la instancia de Express.

---

## 4. El cliente WebSocket en el navegador

Socket.io provee automaticamente el script del cliente en la ruta `/socket.io/socket.io.js`. Solo necesitas incluirlo en tu HTML:

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Chat</title>
</head>
<body>
    <ul id="mensajes"></ul>
    <form id="formulario">
        <input id="input" type="text" placeholder="Escribi un mensaje...">
        <button type="submit">Enviar</button>
    </form>

    <!-- script del cliente de socket.io (lo sirve automaticamente el servidor) -->
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io(); // se conecta al servidor

        socket.on("connect", () => {
            console.log("Conectado con id:", socket.id);
        });
    </script>
</body>
</html>
```

`io()` sin argumentos se conecta al mismo servidor que sirvio la pagina.

---

## 5. Emitir y escuchar eventos

El modelo de Socket.io esta basado en eventos con nombre. Tanto el servidor como el cliente pueden emitir eventos y escucharlos.

### Desde el cliente al servidor

```html
<script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io();

    const formulario = document.getElementById("formulario");
    const input = document.getElementById("input");

    formulario.addEventListener("submit", (e) => {
        e.preventDefault();

        if (input.value.trim()) {
            // emitir un evento llamado "mensaje" con el texto
            socket.emit("mensaje", input.value);
            input.value = "";
        }
    });

    // escuchar eventos que llegan del servidor
    socket.on("mensaje", (texto) => {
        const lista = document.getElementById("mensajes");
        const item = document.createElement("li");
        item.textContent = texto;
        lista.appendChild(item);
    });
</script>
```

### Desde el servidor

```js
io.on("connection", (socket) => {

    // escuchar el evento "mensaje" que manda el cliente
    socket.on("mensaje", (texto) => {
        console.log(`Mensaje recibido de ${socket.id}: ${texto}`);

        // io.emit envia a TODOS los clientes conectados
        io.emit("mensaje", texto);
    });

});
```

### Formas de emitir desde el servidor

Esta es la parte mas importante de entender:

```js
io.on("connection", (socket) => {

    // a TODOS los clientes (incluido el que mando el mensaje)
    io.emit("evento", datos);

    // a TODOS los clientes EXCEPTO el que mando el mensaje
    socket.broadcast.emit("evento", datos);

    // SOLO al cliente que mando el mensaje
    socket.emit("evento", datos);

});
```

La diferencia entre `io.emit` y `socket.emit` es clave: `io` es el servidor global (todos los clientes), `socket` es la conexion individual con un cliente especifico.

---

## 6. Rooms — Grupos de clientes

Las **rooms** permiten agrupar sockets para que reciban los mismos mensajes. Es el mecanismo detras de "salas de chat", "partidas de juego", "canales".

```js
io.on("connection", (socket) => {

    // unirse a una sala
    socket.on("unirseASala", (nombreSala) => {
        socket.join(nombreSala);
        console.log(`${socket.id} se unio a la sala "${nombreSala}"`);

        // notificar a los demas en la sala (no al que se unio)
        socket.to(nombreSala).emit("notificacion", `Un usuario se unio a ${nombreSala}`);
    });

    socket.on("mensajeSala", ({ sala, texto }) => {
        // emitir a todos en la sala (incluido el emisor)
        io.to(sala).emit("mensajeSala", { texto, autor: socket.id });
    });

    socket.on("salirDeSala", (nombreSala) => {
        socket.leave(nombreSala);
    });

});
```

```js
// desde el cliente
socket.emit("unirseASala", "sala-general");
socket.emit("mensajeSala", { sala: "sala-general", texto: "Hola a todos!" });

socket.on("mensajeSala", ({ texto, autor }) => {
    console.log(`[sala] ${autor}: ${texto}`);
});
```

Cada socket ya pertenece automaticamente a una room con su propio `socket.id`. Eso permite enviarle un mensaje a un cliente especifico con `io.to(socket.id).emit(...)`.

---

## 7. Autenticacion basica con SweetAlert2

**SweetAlert2** es una biblioteca que reemplaza los `alert`, `confirm` y `prompt` del navegador con modales mucho mas vistosos.

```html
<!-- incluir desde CDN -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
```

```js
// alert simple
Swal.fire("Mensaje enviado!");

// con titulo y tipo
Swal.fire({
    title: "Exito",
    text: "Tu mensaje fue enviado.",
    icon: "success"
});

// modal con input (para pedir el nombre de usuario al conectar)
Swal.fire({
    title: "Bienvenido al chat",
    input: "text",
    inputLabel: "Tu nombre de usuario",
    inputPlaceholder: "Escribe tu nombre...",
    allowOutsideClick: false,
    inputValidator: (valor) => {
        if (!valor.trim()) return "El nombre no puede estar vacio";
    }
}).then((resultado) => {
    if (resultado.isConfirmed) {
        const nombreUsuario = resultado.value;

        // recien aca conectamos el socket con el nombre
        socket.emit("registrarUsuario", nombreUsuario);
    }
});
```

Este patron — pedir el nombre con SweetAlert2 antes de conectar al chat — es el flujo de "autenticacion basica" mas comun para ejercicios de chat en tiempo real.

En el servidor:

```js
// guardamos el nombre en el objeto socket para poder usarlo despues
io.on("connection", (socket) => {

    socket.on("registrarUsuario", (nombre) => {
        socket.data.nombre = nombre; // socket.data es un objeto para guardar datos del cliente
        io.emit("notificacion", `${nombre} se conecto al chat`);
    });

    socket.on("mensaje", (texto) => {
        const nombre = socket.data.nombre || "Anonimo";
        io.emit("mensaje", { autor: nombre, texto });
    });

    socket.on("disconnect", () => {
        const nombre = socket.data.nombre || "Anonimo";
        io.emit("notificacion", `${nombre} se desconecto`);
    });

});
```

---

## 8. Flujo completo de una app de chat

Juntando todo, el flujo completo de una app de chat minima es:

**1. Usuario abre la pagina** → el navegador carga el HTML y el script de Socket.io

**2. SweetAlert2 pide el nombre** → el usuario ingresa su nombre

**3. Cliente emite `registrarUsuario`** → el servidor guarda el nombre en `socket.data`

**4. Usuario escribe un mensaje y lo envia** → el cliente emite `mensaje`

**5. Servidor recibe `mensaje`** → emite a todos con `io.emit("mensaje", { autor, texto })`

**6. Todos los clientes reciben el evento** → agregan el mensaje al DOM

**7. Usuario cierra el navegador** → se dispara el evento `disconnect` en el servidor, que notifica a los demas

```
[Navegador A]                [Servidor]              [Navegador B]
     |-- registrarUsuario -->    |
     |                          |-- notificacion -->    |
     |-- mensaje "hola" ------>  |
     |                          |-- mensaje -------->   |
     |<-- mensaje -------------- |
```

---

## Summary: Conceptos nuevos de la semana

| Concepto | Descripcion rapida |
|---|---|
| **WebSocket** | Protocolo de conexion persistente y bidireccional entre cliente y servidor |
| **Handshake** | Negociacion inicial con HTTP para establecer la conexion WebSocket |
| **Polling** | Tecnica de hacer requests repetidos para simular tiempo real; ineficiente |
| **Socket.io** | Biblioteca que agrega una capa sobre WebSockets con eventos, rooms y reconexion |
| **`io.on("connection")`** | Se ejecuta cada vez que un nuevo cliente se conecta |
| **`socket`** | Objeto que representa la conexion individual con un cliente |
| **`socket.id`** | Identificador unico generado automaticamente para cada cliente |
| **`socket.emit`** | Envia un evento SOLO al cliente representado por ese socket |
| **`io.emit`** | Envia un evento a TODOS los clientes conectados |
| **`socket.broadcast.emit`** | Envia a todos EXCEPTO al cliente que origino el evento |
| **`socket.on("disconnect")`** | Se ejecuta cuando el cliente se desconecta |
| **Room** | Grupo de sockets que reciben los mismos mensajes |
| **`socket.join(sala)`** | Agrega el socket a una room |
| **`io.to(sala).emit`** | Envia un evento a todos los sockets de una room |
| **`socket.to(sala).emit`** | Envia a la room excepto al socket emisor |
| **`socket.data`** | Objeto para guardar datos asociados a un socket (como el nombre de usuario) |
| **SweetAlert2** | Biblioteca para modales con inputs en el navegador |

---

## Ejercicios

### Ejercicio 1 — Conexion y desconexion

Crea un servidor Express + Socket.io donde:

1. Cada vez que un cliente se conecta, el servidor imprime en consola `"Cliente conectado: [id]"` y emite un evento `"bienvenida"` SOLO a ese cliente con el mensaje `"Bienvenido, tu id es [id]"`
2. El cliente muestra ese mensaje en un `<div>` al recibirlo
3. Cuando el cliente se desconecta, el servidor imprime `"Cliente desconectado: [id]"`
4. Abre dos pestanas del navegador y observa como cambia el id en cada una

---

### Ejercicio 2 — Contador de usuarios conectados

Extiende el servidor del ejercicio anterior para mantener un contador de usuarios conectados:

1. Incrementa el contador cuando alguien se conecta y decrementalo cuando se desconecta
2. Cada vez que el contador cambia, emite un evento `"usuariosConectados"` a TODOS los clientes con el numero actual
3. El cliente muestra `"Usuarios conectados: N"` y lo actualiza en tiempo real
4. Abre y cierra pestanas para verificar que el numero cambia en todas las ventanas abiertas

---

### Ejercicio 3 — Chat basico

Construi un chat donde cualquier mensaje enviado por un cliente se muestra en todos los navegadores conectados:

1. El cliente tiene un formulario con un input de texto y un boton enviar
2. Al enviar, emite el evento `"mensaje"` con el texto
3. El servidor recibe el mensaje y lo reemite a todos con `io.emit`
4. Todos los clientes escuchan `"mensaje"` y agregan el texto a una lista en el DOM
5. El input se limpia despues de enviar

Probalo abriendo dos ventanas del navegador: lo que escribis en una debe aparecer en la otra.

---

### Ejercicio 4 — Chat con nombre de usuario

Modifica el chat del ejercicio anterior para que cada mensaje muestre quien lo escribio:

1. Al cargar la pagina, usa `prompt()` del navegador (o SweetAlert2 si lo instalaste) para pedir el nombre
2. El cliente emite `"registrarUsuario"` con el nombre al conectarse
3. El servidor guarda el nombre en `socket.data.nombre`
4. Cuando llega un mensaje, el servidor emite a todos `{ autor: nombre, texto }` en lugar de solo el texto
5. El cliente renderiza cada mensaje como `"[nombre]: [texto]"`
6. Cuando alguien se desconecta, el servidor emite una notificacion a todos: `"[nombre] salio del chat"`

---

### Ejercicio 5 — Distinguir mensajes propios

En el chat, diferencia visualmente los mensajes que escribiste vos de los de los demas:

El truco es comparar el `socket.id` del emisor con el propio. Una forma es que el servidor incluya el `socketId` del autor en el evento:

```js
io.emit("mensaje", { autor: nombre, texto, socketId: socket.id });
```

Y el cliente compara:

```js
socket.on("mensaje", ({ autor, texto, socketId }) => {
    const esMio = socketId === socket.id;
    // agregar clase CSS diferente segun esMio
});
```

Agrega estilos CSS para que tus mensajes aparezcan a la derecha y los de los demas a la izquierda (como WhatsApp).

---

### Ejercicio 6 — Rooms: salas de chat

Extiende el chat para que tenga salas separadas:

1. Al conectarse, el usuario elige un nombre y una sala (`"general"`, `"tecnologia"`, `"musica"`)
2. El cliente emite `"unirseASala"` con `{ nombre, sala }`
3. El servidor hace `socket.join(sala)` y emite una notificacion a la sala: `"[nombre] se unio"`
4. Los mensajes que envia un usuario llegan SOLO a los demas en su misma sala (usa `io.to(sala).emit`)
5. Abre dos ventanas en la misma sala y dos en salas distintas para verificar el aislamiento

---

### Ejercicio 7 — Integracion: chat completo con Express y vistas

Construi una app de chat completa que use Express para servir la pagina y Socket.io para la comunicacion:

**Estructura:**
```
chat/
├── index.js
└── public/
    ├── index.html
    └── css/
        └── estilos.css
```

**Funcionalidades:**
- SweetAlert2 para pedir nombre y sala al conectar
- Contador de usuarios en la sala visible en tiempo real
- Lista de mensajes con nombre del autor, texto y hora (`new Date().toLocaleTimeString()`)
- Notificaciones cuando alguien entra o sale de la sala
- Estilos que diferencien mensajes propios de los de otros usuarios
- Cuando el usuario escribe, emitir un evento `"escribiendo"` al servidor que reemita a la sala (excepto al que escribe). Mostrar `"[nombre] esta escribiendo..."` que desaparece a los 2 segundos con `setTimeout`
