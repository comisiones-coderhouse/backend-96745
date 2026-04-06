# Semana 8: Desarrollo Avanzado de Backend con Node.js y MongoDB

La semana pasada usamos el driver oficial de MongoDB directamente. Funciona, pero nos obliga a escribir mucho codigo repetitivo y no tenemos ninguna garantia sobre la forma de los datos que guardamos. Esta semana incorporamos **Mongoose**, un ODM (Object Document Mapper) que agrega una capa de estructura y validacion sobre MongoDB, y conectamos nuestra base de datos a la nube con **MongoDB Atlas**.

---

## 1. Conceptos clave de Mongoose y ODM en MongoDB

**ODM** significa *Object Document Mapper*. Es el equivalente NoSQL de un ORM (Object Relational Mapper). Su funcion es mapear documentos de MongoDB a objetos de JavaScript con una forma definida.

Sin Mongoose, MongoDB acepta cualquier cosa:

```js
// driver nativo: no hay nada que impida esto
await productos.insertOne({ nombre: "Teclado" });
await productos.insertOne({ NOMBRE: "Mouse", preco: "dos mil" }); // typo, nadie se queja
await productos.insertOne({ precio: true });                       // tipo incorrecto, igual entra
```

Con Mongoose, definimos un **Schema** que describe exactamente como debe ser cada documento. Si los datos no cumplen, Mongoose rechaza la operacion antes de que llegue a la base de datos.

**Conceptos clave de Mongoose:**

| Concepto | Descripcion |
|---|---|
| **Schema** | Define la forma de los documentos: campos, tipos y validaciones |
| **Model** | Clase generada a partir de un Schema; es la interfaz para operar con la coleccion |
| **Document** | Instancia de un Model; representa un documento individual de MongoDB |
| **Validacion** | Reglas que Mongoose aplica antes de guardar (required, min, max, enum, etc.) |
| **Middleware (hooks)** | Funciones que se ejecutan antes o despues de operaciones como `save` o `find` |

---

## 2. Instalacion y configuracion de Mongoose en Node.js

```bash
npm install mongoose
```

### Conexion a MongoDB

```js
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/tienda")
    .then(() => console.log("Conectado a MongoDB con Mongoose"))
    .catch((err) => console.error("Error de conexion:", err));
```

`mongoose.connect` devuelve una promesa. Una vez conectado, Mongoose mantiene la conexion abierta y la reutiliza automaticamente en todas las operaciones.

A diferencia del driver nativo donde habia que pasar la coleccion a cada funcion, con Mongoose la conexion es global: se establece una vez y todos los modelos la usan.

---

## 3. Schemas, modelos y validaciones en Mongoose

### Definir un Schema

```js
const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,        // campo obligatorio
        trim: true             // elimina espacios al inicio y al final
    },
    precio: {
        type: Number,
        required: true,
        min: [0, "El precio no puede ser negativo"]
    },
    stock: {
        type: Number,
        default: 0,            // valor por defecto si no se provee
        min: 0
    },
    categoria: {
        type: String,
        enum: ["electronica", "ropa", "hogar", "alimentos"], // solo estos valores
        required: true
    },
    disponible: {
        type: Boolean,
        default: true
    },
    etiquetas: [String],       // array de strings
    creadoEn: {
        type: Date,
        default: Date.now      // se setea automaticamente al crear
    }
});
```

### Crear el Model

```js
// mongoose.model("NombreSingular", schema)
// Mongoose crea automaticamente la coleccion "productos" (plural, minuscula)
const Producto = mongoose.model("Producto", productoSchema);

module.exports = Producto;
```

El nombre del modelo en singular (`"Producto"`) es el que Mongoose usa internamente. La coleccion en MongoDB se llama `productos` (Mongoose la pluraliza y la pone en minusculas automaticamente).

### Validaciones disponibles

```js
const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, "El nombre es obligatorio"],  // mensaje de error personalizado
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,    // crea un indice unico en MongoDB
        lowercase: true, // convierte a minusculas antes de guardar
        match: [/^\S+@\S+\.\S+$/, "Email invalido"] // validacion con regex
    },
    edad: {
        type: Number,
        min: 18,
        max: 120
    },
    rol: {
        type: String,
        enum: ["usuario", "admin", "moderador"],
        default: "usuario"
    }
});
```

---

## 4. Operaciones CRUD: Create y Read con Mongoose

### Create — crear documentos

```js
const Producto = require("./models/Producto");

// metodo 1: new + save
const nuevoProducto = new Producto({
    nombre: "Teclado Mecanico",
    precio: 8500,
    categoria: "electronica"
});

const guardado = await nuevoProducto.save();
console.log("Guardado:", guardado._id);

// metodo 2: create (equivalente pero mas corto)
const otroProducto = await Producto.create({
    nombre: "Mouse Inalambrico",
    precio: 3200,
    categoria: "electronica"
});

// insertar varios
const productos = await Producto.insertMany([
    { nombre: "Monitor 24\"", precio: 45000, categoria: "electronica" },
    { nombre: "Auriculares", precio: 6000, categoria: "electronica" }
]);
```

Si los datos no pasan las validaciones del Schema, Mongoose lanza un `ValidationError` antes de tocar la base de datos.

### Read — leer documentos

```js
// leer todos
const todos = await Producto.find();

// con filtro
const electronicos = await Producto.find({ categoria: "electronica" });

// un solo documento
const producto = await Producto.findById("64a1f2c3e4b09d1234567890");
const otroProducto = await Producto.findOne({ nombre: "Mouse Inalambrico" });

// con operadores de MongoDB (los mismos que aprendimos la semana anterior)
const baratos = await Producto.find({ precio: { $lt: 5000 } });

// proyeccion: seleccionar campos
const soloNombres = await Producto.find({}, "nombre precio -_id");
// o con objeto
const resultado = await Producto.find({}, { nombre: 1, precio: 1, _id: 0 });

// ordenar, skip, limit (paginacion)
const pagina = await Producto.find()
    .sort({ precio: -1 })
    .skip(0)
    .limit(10);
```

Con Mongoose no necesitas `.toArray()`: los metodos de consulta ya devuelven arrays de Documents (o un Document en el caso de `findById` / `findOne`).

---

## 5. Clientes de base de datos y DBaaS con MongoDB Atlas

Hasta ahora usamos MongoDB instalado localmente. En produccion, la base de datos vive en un servidor dedicado. **MongoDB Atlas** es el servicio en la nube oficial de MongoDB (DBaaS: Database as a Service).

### Ventajas de Atlas

- No necesitas instalar ni mantener MongoDB en tu servidor
- Backups automaticos, escalado, monitoreo
- Tiene un tier gratuito (M0) ideal para desarrollo y proyectos pequenos
- Accesible desde cualquier lugar con una URI de conexion

### Obtener la URI de conexion

1. Crear cuenta en [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crear un cluster (el tier M0 es gratuito)
3. Crear un usuario de base de datos (Database Access)
4. Permitir tu IP (Network Access → Add IP Address)
5. Conectar → Drivers → Node.js → copiar la URI

La URI tiene este formato:

```
mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/nombreBaseDeDatos
```

### Conectar con Mongoose a Atlas

```js
const mongoose = require("mongoose");

// guardar la URI en una variable de entorno, nunca hardcodearla
const URI = process.env.MONGODB_URI;

mongoose.connect(URI)
    .then(() => console.log("Conectado a MongoDB Atlas"))
    .catch((err) => console.error("Error:", err));
```

### Variables de entorno con dotenv

Para no exponer credenciales en el codigo, usamos un archivo `.env`:

```bash
npm install dotenv
```

```
# .env  (este archivo NO se sube a git)
MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/tienda
PORT=3000
```

```js
// al inicio del archivo principal, antes de todo
require("dotenv").config();

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI);
```

Agregar `.env` al `.gitignore`:

```
# .gitignore
node_modules/
.env
```

---

## 6. Creacion y configuracion de un proyecto Node.js

Estructura recomendada para un proyecto con Express + Mongoose:

```
mi-proyecto/
├── .env
├── .gitignore
├── package.json
├── index.js              ← entrada: conexion a DB y arranque del servidor
├── app.js                ← configuracion de Express (middlewares, rutas)
├── models/
│   ├── Producto.js       ← Schema + Model de productos
│   └── Usuario.js
└── routes/
    ├── productos.js      ← rutas de la API de productos
    └── usuarios.js
```

```js
// app.js
const express = require("express");
const productosRouter = require("./routes/productos");

const app = express();

app.use(express.json());
app.use("/productos", productosRouter);

module.exports = app;
```

```js
// index.js
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Conectado a MongoDB");
        app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error("Error al conectar a MongoDB:", err);
        process.exit(1);
    });
```

Separar `app.js` de `index.js` es una buena practica: `app.js` solo configura Express, `index.js` maneja la conexion y el arranque. Esto facilita los tests (podes importar `app` sin arrancar el servidor).

---

## 7. Estructura de rutas y flujo del CRUD en Node.js

Con la estructura separada, cada archivo de rutas importa el modelo que necesita y define los handlers:

```js
// routes/productos.js
const express = require("express");
const router = express.Router();
const Producto = require("../models/Producto");

// GET /productos — listar todos (con paginacion opcional)
router.get("/", async (req, res) => {
    const pagina = parseInt(req.query.pagina) || 1;
    const porPagina = 10;

    const [productos, total] = await Promise.all([
        Producto.find()
            .sort({ creadoEn: -1 })
            .skip((pagina - 1) * porPagina)
            .limit(porPagina),
        Producto.countDocuments()
    ]);

    res.json({ datos: productos, pagina, total, totalPaginas: Math.ceil(total / porPagina) });
});

// GET /productos/:id — obtener uno
router.get("/:id", async (req, res) => {
    const producto = await Producto.findById(req.params.id);
    if (!producto) return res.status(404).json({ error: "No encontrado" });
    res.json(producto);
});

// POST /productos — crear
router.post("/", async (req, res) => {
    const producto = await Producto.create(req.body);
    res.status(201).json(producto);
});

// PUT /productos/:id — actualizar
router.put("/:id", async (req, res) => {
    const producto = await Producto.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true } // new: devuelve el doc actualizado; runValidators: re-valida
    );
    if (!producto) return res.status(404).json({ error: "No encontrado" });
    res.json(producto);
});

// DELETE /productos/:id — eliminar
router.delete("/:id", async (req, res) => {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Eliminado" });
});

module.exports = router;
```

El flujo completo de un request en esta arquitectura:

```
Request HTTP
    └── index.js (servidor escucha)
        └── app.js (middlewares de Express)
            └── routes/productos.js (router selecciona el handler)
                └── models/Producto.js (Mongoose valida y ejecuta en MongoDB)
                    └── Response HTTP
```

---

## 8. Operaciones CRUD: Update y Delete con Mongoose

Mongoose ofrece varios metodos para actualizar y eliminar. La diferencia principal esta en si necesitas el documento antes o despues de la operacion.

### Actualizar

```js
// findByIdAndUpdate: busca por id y actualiza en una sola operacion
const actualizado = await Producto.findByIdAndUpdate(
    id,
    { $set: { precio: 9000 } },
    { new: true }  // sin esto devuelve el documento ANTES de actualizar
);

// findOneAndUpdate: busca por cualquier filtro
const resultado = await Producto.findOneAndUpdate(
    { nombre: "Mouse" },
    { $inc: { stock: -1 } },
    { new: true, runValidators: true }
);

// updateOne / updateMany: no devuelven el documento, solo el resultado
const res = await Producto.updateOne(
    { _id: id },
    { $set: { disponible: false } }
);
console.log(res.modifiedCount); // cuantos documentos fueron modificados

await Producto.updateMany(
    { stock: 0 },
    { $set: { disponible: false } }
);
```

### Eliminar

```js
// findByIdAndDelete: devuelve el documento eliminado
const eliminado = await Producto.findByIdAndDelete(id);
if (!eliminado) return res.status(404).json({ error: "No encontrado" });

// deleteOne / deleteMany: no devuelven el documento
await Producto.deleteOne({ nombre: "Mouse" });
await Producto.deleteMany({ disponible: false });
```

### Cuando usar cada uno

| Metodo | Devuelve doc | Usa para |
|---|---|---|
| `findByIdAndUpdate` | Si (`new: true`) | PUT de un recurso, necesitas el doc actualizado |
| `findByIdAndDelete` | Si | DELETE, necesitas confirmar que existia |
| `updateMany` | No | Actualizaciones masivas en background |
| `deleteMany` | No | Limpieza masiva de registros |

### Manejo de errores de validacion

```js
router.post("/", async (req, res) => {
    try {
        const producto = await Producto.create(req.body);
        res.status(201).json(producto);
    } catch (err) {
        if (err.name === "ValidationError") {
            // extraer los mensajes de cada campo que fallo
            const errores = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ errores });
        }
        res.status(500).json({ error: "Error interno del servidor" });
    }
});
```

---

## Summary: Conceptos nuevos de la semana

| Concepto | Descripcion rapida |
|---|---|
| **ODM** | Object Document Mapper; mapea documentos de MongoDB a objetos de JS con estructura definida |
| **Mongoose** | ODM para MongoDB en Node.js; agrega schemas, validaciones y metodos de consulta |
| **Schema** | Define los campos, tipos y reglas de validacion de una coleccion |
| **Model** | Clase generada desde un Schema; interfaz principal para operar con la coleccion |
| **Document** | Instancia de un Model; representa un documento de MongoDB |
| **`required`** | Validacion: el campo es obligatorio |
| **`default`** | Valor que se asigna automaticamente si el campo no se provee |
| **`enum`** | Validacion: el valor debe estar en una lista fija |
| **`min` / `max`** | Validacion: rango numerico o de longitud |
| **`unique`** | Crea un indice unico; no permite valores duplicados |
| **`trim` / `lowercase`** | Transformaciones automaticas antes de guardar |
| **`Modelo.create()`** | Crea y guarda un documento en una sola operacion |
| **`new Modelo() + .save()`** | Alternativa a `create`; util cuando necesitas manipular el doc antes de guardar |
| **`Modelo.find()`** | Devuelve array de Documents (no necesita `.toArray()`) |
| **`Modelo.findById(id)`** | Busca por `_id`; acepta string directamente (Mongoose convierte a ObjectId) |
| **`Modelo.findOne(filtro)`** | Devuelve el primer Document que coincide o `null` |
| **`findByIdAndUpdate`** | Busca y actualiza; con `{ new: true }` devuelve el doc actualizado |
| **`findByIdAndDelete`** | Busca y elimina; devuelve el documento eliminado |
| **`runValidators: true`** | Activa las validaciones del Schema al actualizar (no estan activas por defecto) |
| **`ValidationError`** | Error que lanza Mongoose cuando los datos no pasan las validaciones |
| **MongoDB Atlas** | Servicio en la nube de MongoDB (DBaaS); tiene tier gratuito |
| **URI de conexion** | String que contiene host, usuario, password y nombre de la base de datos |
| **dotenv** | Biblioteca para cargar variables de entorno desde un archivo `.env` |
| **`.env`** | Archivo local con variables sensibles; nunca debe subirse al repositorio |

---

## Ejercicios

### Ejercicio 1 — Primer Schema y Model

Crea un Schema para una coleccion `"tareas"` con los campos:
- `titulo`: string, obligatorio, minimo 3 caracteres
- `descripcion`: string, opcional
- `completada`: boolean, default `false`
- `prioridad`: string, enum con los valores `"baja"`, `"media"`, `"alta"`, default `"media"`
- `creadaEn`: Date, default `Date.now`

Exporta el Model y usalo para insertar 3 tareas con `create()`. Imprime los documentos insertados.

---

### Ejercicio 2 — Validaciones

Intenta insertar los siguientes documentos invalidos y observa los errores que lanza Mongoose:

1. Una tarea sin `titulo`
2. Una tarea con `titulo: "ab"` (menos de 3 caracteres)
3. Una tarea con `prioridad: "urgente"` (no esta en el enum)

Para cada caso, captura el error con `try/catch` e imprime `err.name` y los mensajes de `err.errors`.

---

### Ejercicio 3 — CRUD basico

Usando el modelo de tareas:

1. Crear 5 tareas con distintas prioridades
2. Leer todas las tareas
3. Leer solo las tareas con `prioridad: "alta"`
4. Buscar una tarea por su `_id` con `findById`
5. Actualizar el campo `completada` a `true` en una tarea con `findByIdAndUpdate`
6. Eliminar una tarea con `findByIdAndDelete`

---

### Ejercicio 4 — Conexion a MongoDB Atlas

1. Crea una cuenta en MongoDB Atlas y configura un cluster gratuito (M0)
2. Crea un usuario de base de datos y permite tu IP
3. Obtene la URI de conexion
4. Crea un archivo `.env` con la variable `MONGODB_URI`
5. Instala `dotenv` y conecta tu app a Atlas en lugar de a MongoDB local
6. Verifica que los documentos que insertes aparecen en el panel de Atlas (Collections)

---

### Ejercicio 5 — Estructura de proyecto

Reorganiza tu proyecto con la estructura recomendada:

```
proyecto/
├── .env
├── .gitignore
├── index.js
├── app.js
├── models/
│   └── Tarea.js
└── routes/
    └── tareas.js
```

- `app.js` configura Express y monta el router de tareas en `/tareas`
- `index.js` conecta a MongoDB y arranca el servidor
- `routes/tareas.js` tiene los 5 endpoints del CRUD
- `models/Tarea.js` exporta el Model

---

### Ejercicio 6 — Manejo de errores

Agrega manejo de errores a los endpoints del ejercicio anterior:

1. En `POST /tareas`: captura `ValidationError` y devuelve `400` con los mensajes de error
2. En `GET /tareas/:id`, `PUT /tareas/:id`, `DELETE /tareas/:id`: devuelve `404` si el documento no existe
3. En `PUT /tareas/:id`: usa `runValidators: true` para que las validaciones corran al actualizar

Proba los casos de error con Thunder Client o Postman enviando datos invalidos.

---

### Ejercicio 7 — API completa con Atlas

Construi una API REST de notas (`GET`, `POST`, `PUT`, `DELETE`) con:

- Conexion a MongoDB Atlas via `.env`
- Schema con validaciones: `titulo` (obligatorio), `contenido`, `categoria` (enum), `favorita` (boolean, default false)
- Paginacion en `GET /notas?pagina=N`
- Manejo de `ValidationError` en `POST` y `PUT`
- Respuesta `404` cuando la nota no existe

Subi el proyecto a GitHub **sin el `.env`** (verificar que esta en `.gitignore`).
