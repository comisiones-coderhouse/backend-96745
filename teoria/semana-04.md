# Semana 4: Desarrollo de Backend Avanzado

Esta semana armamos nuestra primera API real con Express. Vamos a entender como funciona el modelo REST, que significan los codigos de estado HTTP, y como estructurar un servidor con rutas, middlewares y manejo de errores.

---

## 1. Arquitectura Cliente-Servidor y REST

Cuando una app web hace un pedido a un servidor, sigue un modelo llamado **cliente-servidor**: hay una parte que pide (el cliente, por ejemplo el navegador o una app movil) y una parte que responde (el servidor).

**REST** (Representational State Transfer) es un estilo arquitectonico para disenar APIs web. No es un protocolo ni un estandar estricto: es un conjunto de convenciones que, cuando se siguen, hace que las APIs sean predecibles y faciles de usar.

Las ideas centrales de REST son:

**Recursos**: todo se modela como un recurso identificado por una URL. Un usuario es un recurso (`/usuarios`), un producto es un recurso (`/productos`), un pedido es un recurso (`/pedidos`). Los recursos son sustantivos, no verbos.

```
✅ GET /usuarios        (correcto: recurso en plural)
✅ GET /productos/42    (correcto: recurso especifico por id)
❌ GET /obtenerUsuarios (incorrecto: no uses verbos en las rutas)
❌ POST /crearProducto  (incorrecto: el verbo ya esta en el metodo HTTP)
```

**Metodos HTTP como verbos**: el *que queres hacer* se expresa con el metodo HTTP, no con la URL.

| Metodo | Accion | Ejemplo |
|--------|--------|---------|
| `GET` | Leer/obtener | `GET /productos` — lista todos |
| `POST` | Crear | `POST /productos` — crea uno nuevo |
| `PUT` | Reemplazar completo | `PUT /productos/5` — reemplaza el producto 5 |
| `PATCH` | Actualizar parcial | `PATCH /productos/5` — modifica algunos campos |
| `DELETE` | Eliminar | `DELETE /productos/5` — elimina el producto 5 |

**Sin estado (stateless)**: cada request contiene toda la informacion necesaria para procesarlo. El servidor no recuerda requests anteriores. Si necesitas autenticacion, tenes que enviarla en *cada* request (por eso existen los tokens JWT).

---

## 2. Codigos de estado HTTP

Los **codigos de estado** son numeros de tres digitos que el servidor incluye en cada respuesta para indicar que paso. Son parte del protocolo HTTP y tienen significados estandarizados.

Se agrupan por su primer digito:

### 2xx — Exito

| Codigo | Nombre | Cuando usarlo |
|--------|--------|---------------|
| `200` | OK | Request exitoso generico (GET, PUT, PATCH) |
| `201` | Created | Se creo un recurso nuevo (POST exitoso) |
| `204` | No Content | Exito pero sin cuerpo en la respuesta (DELETE exitoso) |

### 4xx — Error del cliente

El cliente mando algo mal. Es su culpa, no del servidor.

| Codigo | Nombre | Cuando usarlo |
|--------|--------|---------------|
| `400` | Bad Request | El body o los parametros tienen formato invalido |
| `401` | Unauthorized | No esta autenticado (no mando token o es invalido) |
| `403` | Forbidden | Esta autenticado pero no tiene permiso |
| `404` | Not Found | El recurso no existe |
| `409` | Conflict | Conflicto con el estado actual (ej: email ya registrado) |
| `422` | Unprocessable Entity | Datos con formato correcto pero semanticamente invalidos |

### 5xx — Error del servidor

Algo fallo del lado del servidor. El cliente mando bien el request.

| Codigo | Nombre | Cuando usarlo |
|--------|--------|---------------|
| `500` | Internal Server Error | Error inesperado en el servidor |
| `503` | Service Unavailable | El servidor no puede atender (sobrecarga, mantenimiento) |

La diferencia entre 401 y 403 confunde a muchos: **401** significa "no se quien sos" (falta autenticacion), **403** significa "se quien sos, pero no tenes permiso" (falta autorizacion).

---

## 3. Express — Introduccion

El modulo `http` de Node nos dejo crear un servidor, pero manejar rutas con `if/else` sobre `req.url` no escala. **Express** es un framework minimalista que agrega una capa de estructura sobre `http` para hacer esto manejable.

```bash
npm install express
```

Un servidor Express basico:

```js
const express = require("express");

const app = express();

// middleware para parsear el body de los requests como JSON
app.use(express.json());

// una ruta GET en "/"
app.get("/", (req, res) => {
    res.json({ mensaje: "API funcionando" });
});

// iniciar el servidor
app.listen(3000, () => {
    console.log("Servidor en http://localhost:3000");
});
```

`express()` crea una instancia de la aplicacion. `app.use(...)` registra middlewares (lo vemos enseguida). `app.get(ruta, handler)` registra un handler para `GET` en esa ruta.

### Metodos de enrutamiento

Express tiene un metodo por cada verbo HTTP:

```js
app.get("/productos", (req, res) => { ... });
app.post("/productos", (req, res) => { ... });
app.put("/productos/:id", (req, res) => { ... });
app.patch("/productos/:id", (req, res) => { ... });
app.delete("/productos/:id", (req, res) => { ... });
```

### Parametros de ruta

El `:id` en la ruta es un **parametro dinamico**. Su valor se accede en `req.params`:

```js
app.get("/productos/:id", (req, res) => {
    const { id } = req.params; // siempre es un string
    const idNumerico = parseInt(id);
    // ...
});
```

### Query strings

Los parametros de query (lo que va despues de `?` en la URL) se acceden en `req.query`:

```js
// GET /productos?categoria=electronica&precioMax=50000
app.get("/productos", (req, res) => {
    const { categoria, precioMax } = req.query;
    console.log(categoria);  // "electronica"
    console.log(precioMax);  // "50000" (string)
});
```

### Body del request

El cuerpo del request (para POST, PUT, PATCH) se accede en `req.body`. Pero primero hay que registrar el middleware `express.json()` que parsea el JSON entrante:

```js
app.use(express.json()); // esto va antes de las rutas

app.post("/productos", (req, res) => {
    const { nombre, precio } = req.body;
    // ...
});
```

Sin `express.json()`, `req.body` es `undefined`.

### Metodos de respuesta

```js
res.json(objeto)           // envia JSON (setea Content-Type automaticamente)
res.status(404).json(...)  // setea el codigo de estado y envia JSON
res.send("texto")          // envia texto plano
res.sendStatus(204)        // envia solo el codigo, sin cuerpo
```

---

## 4. Middlewares

Un **middleware** es una funcion que se ejecuta en el medio del ciclo request-response. Recibe `req`, `res`, y una funcion `next` que le cede el control al siguiente middleware o al handler de la ruta.

```js
function miMiddleware(req, res, next) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next(); // si no llamas a next(), el request se queda colgado
}

app.use(miMiddleware); // aplica a TODAS las rutas
```

Pensa en los middlewares como una cadena de funciones por las que pasa cada request antes de llegar al handler final. Cada una puede:
- Modificar `req` o `res`
- Terminar el ciclo (enviando una respuesta sin llamar a `next`)
- Pasar el control al siguiente con `next()`

```
Request --> [logger] --> [autenticacion] --> [validacion] --> [handler] --> Response
```

### Middlewares de aplicacion vs de ruta

`app.use(fn)` aplica el middleware a todas las rutas. Podes limitarlo a una ruta especifica:

```js
app.use("/admin", verificarAdmin); // solo rutas que empiecen con /admin
app.post("/productos", validarProducto, crearProducto); // solo este endpoint
```

### Middleware de validacion

Un patron muy comun es escribir un middleware que valide el body antes de que llegue al handler:

```js
function validarProducto(req, res, next) {
    const { nombre, precio } = req.body;

    if (!nombre || typeof nombre !== "string") {
        return res.status(400).json({ error: "nombre es requerido y debe ser string" });
    }

    if (!precio || typeof precio !== "number" || precio <= 0) {
        return res.status(400).json({ error: "precio debe ser un numero positivo" });
    }

    next(); // datos validos, seguimos
}

app.post("/productos", validarProducto, (req, res) => {
    // si llegamos aca, el body ya fue validado
    const { nombre, precio } = req.body;
    // crear el producto...
});
```

---

## 5. Manejo de errores en Express

Express tiene un mecanismo especial para el manejo de errores: un middleware con **cuatro parametros** `(err, req, res, next)`. Express lo reconoce por la aridad y lo llama solo cuando se le pasa un error.

```js
// middleware de error: siempre va al FINAL, despues de todas las rutas
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: err.message || "Error interno del servidor"
    });
});
```

Para disparar este middleware desde cualquier handler o middleware, usas `next(error)`:

```js
app.get("/productos/:id", (req, res, next) => {
    try {
        const producto = obtenerProducto(req.params.id);
        if (!producto) {
            const error = new Error("Producto no encontrado");
            error.status = 404;
            return next(error); // le pasamos el control al middleware de error
        }
        res.json(producto);
    } catch (err) {
        next(err); // cualquier error inesperado tambien va al middleware
    }
});
```

En handlers async, los errores no llegan automaticamente al middleware de error: tenes que catchearlos y pasarlos con `next`:

```js
app.get("/productos", async (req, res, next) => {
    try {
        const productos = await obtenerTodos();
        res.json(productos);
    } catch (err) {
        next(err);
    }
});
```

---

## 6. Estructura modular con Router

A medida que el proyecto crece, tener todas las rutas en un solo archivo se vuelve inmanejable. Express tiene **Router**, un mini-servidor que agrupa rutas relacionadas:

```
proyecto/
├── index.js
└── routes/
    ├── productos.js
    └── usuarios.js
```

`routes/productos.js`:
```js
const express = require("express");
const router = express.Router();

// aca las rutas son relativas al prefijo que se defina en index.js
router.get("/", (req, res) => {
    res.json(productos);
});

router.get("/:id", (req, res) => {
    // ...
});

router.post("/", validarProducto, (req, res) => {
    // ...
});

module.exports = router;
```

`index.js`:
```js
const express = require("express");
const productosRouter = require("./routes/productos");
const usuariosRouter = require("./routes/usuarios");

const app = express();
app.use(express.json());

// montar los routers con su prefijo
app.use("/productos", productosRouter);
app.use("/usuarios", usuariosRouter);

// las rutas reales quedan: GET /productos, GET /productos/:id, POST /productos, etc.

app.listen(3000);
```

---

## 7. CRUD en memoria

Un **CRUD** es el conjunto de operaciones basicas sobre un recurso: **C**reate, **R**ead, **U**pdate, **D**elete. Antes de conectar una base de datos, es util implementarlo con un array en memoria para concentrarse en la logica de las rutas.

```js
const express = require("express");
const router = express.Router();

// "base de datos" en memoria
let productos = [
    { id: 1, nombre: "Teclado mecanico", precio: 45000, stock: 10 },
    { id: 2, nombre: "Mouse gamer", precio: 15000, stock: 25 },
];
let proximoId = 3;

// READ — obtener todos
router.get("/", (req, res) => {
    res.json(productos);
});

// READ — obtener uno por id
router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const producto = productos.find(p => p.id === id);

    if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(producto);
});

// CREATE
router.post("/", (req, res) => {
    const { nombre, precio, stock } = req.body;

    const nuevo = { id: proximoId++, nombre, precio, stock };
    productos.push(nuevo);

    res.status(201).json(nuevo);
});

// UPDATE — reemplazar completo
router.put("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const indice = productos.findIndex(p => p.id === id);

    if (indice === -1) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    const actualizado = { id, ...req.body };
    productos[indice] = actualizado;

    res.json(actualizado);
});

// UPDATE — parcial
router.patch("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const indice = productos.findIndex(p => p.id === id);

    if (indice === -1) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    // spread del original, pisado por los campos nuevos
    productos[indice] = { ...productos[indice], ...req.body };

    res.json(productos[indice]);
});

// DELETE
router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const indice = productos.findIndex(p => p.id === id);

    if (indice === -1) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }

    productos.splice(indice, 1);
    res.sendStatus(204);
});

module.exports = router;
```

Fijate el uso de `findIndex` para el update y delete: necesitamos la posicion en el array para modificarlo, no solo el objeto. Y el spread `{ ...productos[indice], ...req.body }` en el PATCH permite actualizar solo los campos que llegaron en el body sin perder los que no se mandaron.

---

## Summary: Conceptos nuevos de la semana

| Concepto | Descripcion rapida |
|---|---|
| **REST** | Estilo arquitectonico para APIs: recursos en URLs, verbos HTTP, sin estado |
| **Recurso** | Entidad identificada por una URL (`/usuarios`, `/productos/5`) |
| **Codigos de estado HTTP** | Numeros que indican el resultado del request (2xx exito, 4xx error cliente, 5xx error servidor) |
| **Express** | Framework web minimalista para Node.js |
| **`express.json()`** | Middleware que parsea el body JSON de los requests |
| **`req.params`** | Parametros dinamicos de la ruta (`:id`) |
| **`req.query`** | Parametros de query string (`?clave=valor`) |
| **`req.body`** | Cuerpo del request (requiere `express.json()`) |
| **`res.json()`** | Envia una respuesta JSON |
| **`res.status()`** | Setea el codigo de estado de la respuesta |
| **Middleware** | Funcion `(req, res, next)` que intercepta el ciclo request-response |
| **`next()`** | Funcion que cede el control al siguiente middleware o handler |
| **`next(error)`** | Pasa un error al middleware de manejo de errores |
| **Middleware de error** | Middleware con 4 parametros `(err, req, res, next)` para manejar errores globalmente |
| **Router** | Mini-app de Express para agrupar rutas relacionadas |
| **`module.exports`** | Exporta un valor desde un modulo de Node para que otros lo importen con `require` |
| **CRUD** | Operaciones basicas: Create (POST), Read (GET), Update (PUT/PATCH), Delete (DELETE) |
| **`Array.find`** | Devuelve el primer elemento que cumple una condicion |
| **`Array.findIndex`** | Devuelve el indice del primer elemento que cumple una condicion |

---

## Ejercicios

### Ejercicio 1 — Codigos de estado

Sin escribir codigo, responde para cada situacion cual seria el codigo de estado HTTP correcto y por que:

1. Un usuario pide `GET /usuarios/99` pero ese usuario no existe
2. Un usuario manda `POST /productos` con un body bien formado y el producto se crea
3. Un usuario manda `POST /usuarios` con un body sin el campo `email` que es obligatorio
4. Un usuario manda `DELETE /pedidos/5` y el pedido se elimina correctamente
5. El servidor intenta leer un archivo de configuracion que no existe y crashea
6. Un usuario intenta acceder a `GET /admin/reportes` sin haber iniciado sesion
7. Un usuario autenticado intenta acceder a `GET /admin/reportes` pero su rol no tiene permiso

---

### Ejercicio 2 — Express basico

Crea una app Express con estas rutas:

- `GET /` — devuelve `{ mensaje: "Bienvenido a la API" }`
- `GET /saludo/:nombre` — devuelve `{ mensaje: "Hola, [nombre]!" }`
- `GET /suma` — recibe dos query params `a` y `b`, devuelve `{ resultado: a + b }`. Si alguno falta o no es numero, devuelve 400 con un mensaje de error claro.

Probala con un cliente HTTP (Postman, Thunder Client en VSCode, o `curl`).

---

### Ejercicio 3 — Middleware de logging

Crea un middleware de logging que, para cada request que llegue al servidor, imprima en consola:

```
[2024-01-15T10:30:00.000Z] GET /productos - 200 - 12ms
```

El middleware debe:
- Registrar el momento en que llega el request
- Llamar a `next()` para que continue
- Despues de que la respuesta se envia, calcular cuanto tardo (pista: podes sobreescribir `res.json` para interceptar el momento en que se envia la respuesta, o usar el evento `res.on("finish", ...)`)

Registralo con `app.use` para que aplique a todas las rutas.

---

### Ejercicio 4 — CRUD completo en memoria

Implementa un CRUD completo para un recurso `tareas` con esta estructura:

```js
{ id: 1, titulo: "string", completada: false, prioridad: "alta" | "media" | "baja" }
```

Rutas a implementar:
- `GET /tareas` — lista todas. Acepta query param `?completada=true/false` para filtrar
- `GET /tareas/:id` — devuelve una tarea o 404
- `POST /tareas` — crea una tarea. Campos requeridos: `titulo`, `prioridad`
- `PATCH /tareas/:id` — actualiza campos parcialmente
- `DELETE /tareas/:id` — elimina y responde 204

Incluye un middleware de validacion para el POST que verifique:
- `titulo` es string no vacio
- `prioridad` es uno de `"alta"`, `"media"`, `"baja"`

---

### Ejercicio 5 — Estructura modular

Toma el CRUD del ejercicio anterior y reorganizalo con esta estructura:

```
proyecto/
├── index.js          ← solo inicializa la app y monta los routers
├── routes/
│   └── tareas.js     ← router con todas las rutas de tareas
└── middlewares/
    └── validar.js    ← middleware de validacion exportado
```

Cada archivo debe exportar lo que necesita con `module.exports` e importar lo que usa con `require`. El `index.js` final no debe contener logica de negocio: solo configuracion y montaje.

---

### Ejercicio 6 — Manejo de errores global

Extiende el proyecto del ejercicio anterior para que tenga un middleware de manejo de errores global al final de `index.js`. Luego:

1. En el handler de `GET /tareas/:id`, si el id no es un numero valido (`isNaN`), crea un error con status 400 y pasalo con `next(error)`
2. El middleware de error debe responder siempre con `{ error: mensaje }` y el status apropiado
3. Simula un error 500 creando una ruta `GET /error-test` que llame a `next(new Error("error simulado"))` y verifica que el middleware lo captura

---

### Ejercicio 7 — Integracion: CRUD + persistencia en archivo

Combina lo de semana 3 con lo de esta semana:

Toma el CRUD de tareas y en lugar de guardar en un array en memoria, leer y guardar en un archivo `tareas.json`. Cada operacion de escritura (POST, PATCH, DELETE) debe persistir los cambios en el archivo usando `fs/promises`.

Crea funciones auxiliares `leerTareas()` y `guardarTareas(tareas)` que encapsulen la logica de archivo, y usalas desde los handlers (que deberan ser `async`).
