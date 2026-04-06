# Semana 7: CRUD y Manejo de Bases de Datos con MongoDB

Hasta ahora guardamos datos en arrays en memoria: cada vez que reinicias el servidor todo se pierde. Esta semana incorporamos una base de datos real. MongoDB es la base de datos mas usada en el ecosistema Node.js porque sus datos tienen la misma forma que los objetos de JavaScript: sin tablas, sin columnas fijas, solo documentos JSON.

---

## 1. Bases de datos NoSQL y modelo de documentos en MongoDB

Las bases de datos se dividen en dos grandes familias:

| | SQL (relacional) | NoSQL (no relacional) |
|---|---|---|
| Estructura | Tablas con columnas fijas | Colecciones de documentos flexibles |
| Lenguaje | SQL | Depende del motor (MongoDB usa su propia API) |
| Esquema | Rigido: todos los registros tienen las mismas columnas | Flexible: cada documento puede tener campos distintos |
| Escalado | Vertical (mejor hardware) | Horizontal (mas servidores) |
| Ejemplos | PostgreSQL, MySQL, SQLite | MongoDB, Redis, Firebase |

**MongoDB es NoSQL de tipo documental**: los datos se guardan como documentos BSON (Binary JSON), que son esencialmente objetos JavaScript extendidos.

```json
{
  "_id": "64a1f2c3e4b09d1234567890",
  "nombre": "Ada Lovelace",
  "edad": 28,
  "habilidades": ["JavaScript", "Node.js", "MongoDB"],
  "direccion": {
    "ciudad": "Buenos Aires",
    "pais": "Argentina"
  }
}
```

Analogia: si SQL es una planilla de Excel (columnas fijas, una fila por registro), MongoDB es una carpeta de fichas donde cada ficha puede tener la informacion que necesite.

---

## 2. Estructura: bases de datos, colecciones y documentos

MongoDB organiza los datos en tres niveles:

```
Servidor MongoDB
└── Base de datos (database)
    └── Coleccion (collection)
        └── Documento (document)
```

- **Base de datos**: agrupa colecciones relacionadas. Un servidor puede tener muchas.
- **Coleccion**: equivalente a una tabla en SQL. Agrupa documentos del mismo tipo (usuarios, productos, pedidos).
- **Documento**: equivalente a una fila. Es un objeto JSON con un campo `_id` unico generado automaticamente.

```
Base de datos: "tienda"
├── Coleccion: "productos"
│   ├── { _id: ..., nombre: "Teclado", precio: 5000 }
│   ├── { _id: ..., nombre: "Mouse", precio: 2000, color: "negro" }
│   └── { _id: ..., nombre: "Monitor", precio: 45000, pulgadas: 24 }
└── Coleccion: "clientes"
    ├── { _id: ..., nombre: "Juan", email: "juan@mail.com" }
    └── { _id: ..., nombre: "Maria", email: "maria@mail.com", plan: "premium" }
```

Nota que `Mouse` tiene `color` y `Monitor` tiene `pulgadas` pero `Teclado` no: MongoDB lo permite. No hay columnas obligatorias (salvo `_id`).

---

## 3. Insercion y lectura de documentos en MongoDB

### Instalacion y conexion

```bash
npm install mongodb
```

```js
const { MongoClient } = require("mongodb");

const URI = "mongodb://localhost:27017"; // conexion local
const cliente = new MongoClient(URI);

async function conectar() {
    await cliente.connect();
    console.log("Conectado a MongoDB");

    const db = cliente.db("tienda");              // selecciona (o crea) la base de datos
    const productos = db.collection("productos"); // selecciona (o crea) la coleccion

    return productos;
}
```

MongoDB crea la base de datos y la coleccion automaticamente la primera vez que insertas un documento. No hace falta crearlas de antemano.

### Insertar documentos

```js
// insertar uno
const resultado = await productos.insertOne({
    nombre: "Teclado",
    precio: 5000,
    stock: 10
});

console.log("ID generado:", resultado.insertedId);
// resultado.insertedId es un ObjectId, el identificador unico del documento

// insertar varios
const resultados = await productos.insertMany([
    { nombre: "Mouse", precio: 2000, stock: 25 },
    { nombre: "Monitor", precio: 45000, stock: 5 }
]);

console.log("IDs generados:", resultados.insertedIds);
```

### Leer documentos

```js
// leer todos los documentos de la coleccion
const todos = await productos.find().toArray();
console.log(todos); // array de objetos

// leer uno por filtro
const unProducto = await productos.findOne({ nombre: "Mouse" });
console.log(unProducto); // el primer documento que coincida, o null

// leer varios con filtro
const baratos = await productos.find({ precio: { $lt: 3000 } }).toArray();
```

`find()` devuelve un **cursor** (una referencia al resultado), no el array directamente. Llamar `.toArray()` lo convierte en un array de objetos.

---

## 4. Consultas avanzadas con operadores y condiciones logicas

MongoDB tiene operadores de comparacion y logicos para construir filtros complejos. Todos empiezan con `$`.

### Operadores de comparacion

```js
// igual (equivalente a { precio: 5000 })
await productos.find({ precio: { $eq: 5000 } }).toArray();

// distinto
await productos.find({ precio: { $ne: 5000 } }).toArray();

// mayor que / mayor o igual
await productos.find({ precio: { $gt: 3000 } }).toArray();
await productos.find({ precio: { $gte: 3000 } }).toArray();

// menor que / menor o igual
await productos.find({ precio: { $lt: 10000 } }).toArray();
await productos.find({ precio: { $lte: 10000 } }).toArray();

// esta en una lista de valores
await productos.find({ nombre: { $in: ["Mouse", "Teclado"] } }).toArray();

// NO esta en la lista
await productos.find({ nombre: { $nin: ["Monitor"] } }).toArray();
```

### Operadores logicos

```js
// AND implicito: campos distintos en el mismo objeto ya se evaluan como AND
await productos.find({ precio: { $lt: 10000 }, stock: { $gt: 5 } }).toArray();

// AND explicito con $and (util cuando el mismo campo aparece dos veces)
await productos.find({
    $and: [
        { precio: { $gte: 2000 } },
        { precio: { $lte: 8000 } }
    ]
}).toArray();

// OR: devuelve documentos que cumplan al menos una condicion
await productos.find({
    $or: [
        { precio: { $lt: 2500 } },
        { nombre: "Monitor" }
    ]
}).toArray();

// NOT
await productos.find({
    precio: { $not: { $gt: 10000 } }
}).toArray();
```

### Buscar en campos anidados

```js
// documento: { nombre: "Ada", direccion: { ciudad: "Buenos Aires" } }
// usar punto para acceder a campos anidados
await clientes.find({ "direccion.ciudad": "Buenos Aires" }).toArray();

// buscar en arrays: devuelve documentos donde el array contiene el valor
await clientes.find({ habilidades: "MongoDB" }).toArray();
```

---

## 5. Proyecciones y ordenamiento de resultados

### Proyecciones — elegir que campos devolver

Por defecto `find()` devuelve todos los campos. Con una proyeccion podemos incluir o excluir campos especificos:

```js
// incluir solo nombre y precio (1 = incluir, 0 = excluir)
// _id se incluye siempre salvo que lo excluyas explicitamente
const resultado = await productos.find(
    {},                          // filtro (vacio = todos)
    { projection: { nombre: 1, precio: 1, _id: 0 } }
).toArray();

// resultado: [{ nombre: "Teclado", precio: 5000 }, ...]

// excluir un campo especifico
const sinStock = await productos.find(
    {},
    { projection: { stock: 0 } }
).toArray();
```

Regla: no mezcles 1 y 0 en la misma proyeccion (salvo con `_id`). O incluyes lo que queres, o excluyes lo que no queres.

### Ordenamiento

```js
// ordenar por precio ascendente (1 = ASC, -1 = DESC)
const ordenados = await productos.find().sort({ precio: 1 }).toArray();

// ordenar por precio descendente
const masCaros = await productos.find().sort({ precio: -1 }).toArray();

// ordenar por multiples campos
const resultado = await productos.find()
    .sort({ categoria: 1, precio: -1 }) // primero por categoria ASC, luego precio DESC
    .toArray();
```

---

## 6. Consultas con filtros y operadores basicos

Combinando todo lo anterior, un flujo tipico de consulta con filtros:

```js
// productos de la categoria "electronica" con precio menor a 20000
// devolver solo nombre y precio, ordenados por precio ascendente
const resultado = await productos.find(
    { categoria: "electronica", precio: { $lt: 20000 } },
    { projection: { nombre: 1, precio: 1, _id: 0 } }
)
.sort({ precio: 1 })
.toArray();
```

### Buscar por ObjectId

Los `_id` en MongoDB son del tipo `ObjectId`, no strings comunes. Para buscar por id tenes que convertirlo:

```js
const { ObjectId } = require("mongodb");

const producto = await productos.findOne({
    _id: new ObjectId("64a1f2c3e4b09d1234567890")
});
```

Si pasas el string directamente sin `new ObjectId(...)`, la consulta no va a encontrar nada porque los tipos no coinciden.

---

## 7. Paginacion y optimizacion de consultas

Cuando una coleccion tiene miles de documentos no conviene traer todos a la vez. La paginacion divide los resultados en paginas.

### limit y skip

```js
const PAGINA = 1;    // pagina solicitada (desde 1)
const POR_PAGINA = 10;

const documentos = await productos.find()
    .sort({ nombre: 1 })
    .skip((PAGINA - 1) * POR_PAGINA)   // cuantos saltar
    .limit(POR_PAGINA)                  // cuantos traer
    .toArray();
```

Para saber el total de paginas necesitas el conteo total:

```js
const total = await productos.countDocuments({ categoria: "electronica" });
const totalPaginas = Math.ceil(total / POR_PAGINA);
```

Endpoint tipico en Express:

```js
app.get("/productos", async (req, res) => {
    const pagina = parseInt(req.query.pagina) || 1;
    const porPagina = 10;

    const [items, total] = await Promise.all([
        db.collection("productos")
            .find()
            .sort({ nombre: 1 })
            .skip((pagina - 1) * porPagina)
            .limit(porPagina)
            .toArray(),
        db.collection("productos").countDocuments()
    ]);

    res.json({
        datos: items,
        pagina,
        totalPaginas: Math.ceil(total / porPagina),
        total
    });
});
```

### Indices

Un **indice** es una estructura auxiliar que hace las busquedas mucho mas rapidas. Sin indice, MongoDB recorre todos los documentos para encontrar los que coinciden (full collection scan). Con indice, va directo.

```js
// crear indice en el campo "email" (util para buscar usuarios por email)
await clientes.createIndex({ email: 1 });

// indice unico: no permite dos documentos con el mismo valor
await clientes.createIndex({ email: 1 }, { unique: true });

// indice compuesto
await productos.createIndex({ categoria: 1, precio: -1 });
```

Regla general: crea indices en los campos que usas frecuentemente en filtros, ordenamientos o joins. No abuses: cada indice tiene un costo en escrituras y memoria.

---

## 8. Actualizacion y eliminacion de documentos

### Actualizar

```js
// actualizar el primer documento que coincida
await productos.updateOne(
    { nombre: "Mouse" },          // filtro
    { $set: { precio: 2500 } }   // operacion de actualizacion
);

// actualizar todos los documentos que coincidan
await productos.updateMany(
    { stock: { $lt: 5 } },
    { $set: { disponible: false } }
);
```

**Operadores de actualizacion mas comunes:**

```js
// $set: agrega o modifica campos
{ $set: { precio: 3000, descripcion: "Nuevo modelo" } }

// $unset: elimina un campo del documento
{ $unset: { descripcion: "" } }

// $inc: incrementa o decrementa un numero
{ $inc: { stock: -1 } }   // restar 1 al stock
{ $inc: { visitas: 1 } }  // sumar 1 a visitas

// $push: agrega un elemento a un array
{ $push: { etiquetas: "oferta" } }

// $pull: elimina un elemento de un array
{ $pull: { etiquetas: "oferta" } }
```

### Upsert — insertar si no existe

```js
// si existe un producto con ese nombre, lo actualiza; si no, lo inserta
await productos.updateOne(
    { nombre: "Webcam" },
    { $set: { precio: 8000, stock: 3 } },
    { upsert: true }
);
```

### Eliminar

```js
// eliminar el primer documento que coincida
await productos.deleteOne({ nombre: "Mouse" });

// eliminar todos los que coincidan
await productos.deleteMany({ stock: 0 });

// eliminar todos los documentos (vaciar la coleccion)
await productos.deleteMany({});
```

---

## 9. Primeras consultas CRUD en MongoDB desde Node.js

Juntando todo en un modulo reutilizable con Express:

```js
// db.js — conexion reutilizable
const { MongoClient } = require("mongodb");

const cliente = new MongoClient("mongodb://localhost:27017");
let db;

async function conectar() {
    if (!db) {
        await cliente.connect();
        db = cliente.db("tienda");
    }
    return db;
}

module.exports = { conectar };
```

```js
// index.js
const express = require("express");
const { ObjectId } = require("mongodb");
const { conectar } = require("./db");

const app = express();
app.use(express.json());

// GET /productos — listar todos
app.get("/productos", async (req, res) => {
    const db = await conectar();
    const productos = await db.collection("productos").find().toArray();
    res.json(productos);
});

// GET /productos/:id — obtener uno por id
app.get("/productos/:id", async (req, res) => {
    const db = await conectar();
    const producto = await db.collection("productos").findOne({
        _id: new ObjectId(req.params.id)
    });

    if (!producto) return res.status(404).json({ error: "No encontrado" });
    res.json(producto);
});

// POST /productos — crear uno nuevo
app.post("/productos", async (req, res) => {
    const db = await conectar();
    const resultado = await db.collection("productos").insertOne(req.body);
    res.status(201).json({ insertedId: resultado.insertedId });
});

// PUT /productos/:id — actualizar
app.put("/productos/:id", async (req, res) => {
    const db = await conectar();
    const resultado = await db.collection("productos").updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
    );

    if (resultado.matchedCount === 0) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Actualizado" });
});

// DELETE /productos/:id — eliminar
app.delete("/productos/:id", async (req, res) => {
    const db = await conectar();
    const resultado = await db.collection("productos").deleteOne({
        _id: new ObjectId(req.params.id)
    });

    if (resultado.deletedCount === 0) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Eliminado" });
});

app.listen(3000, () => console.log("Servidor en http://localhost:3000"));
```

Este patron — un modulo `db.js` que maneja la conexion y un `index.js` que define las rutas — es el punto de partida de cualquier API REST con MongoDB.

---

## Summary: Conceptos nuevos de la semana

| Concepto | Descripcion rapida |
|---|---|
| **NoSQL** | Familia de bases de datos sin tablas ni esquema rigido |
| **MongoDB** | Base de datos documental, los datos se guardan como JSON |
| **BSON** | Formato binario de MongoDB, extension de JSON con tipos extra |
| **Base de datos** | Agrupa colecciones relacionadas en MongoDB |
| **Coleccion** | Agrupacion de documentos del mismo tipo (como una tabla en SQL) |
| **Documento** | Objeto JSON con un `_id` unico; la unidad basica de datos |
| **`_id` / ObjectId** | Identificador unico generado automaticamente por MongoDB |
| **`insertOne` / `insertMany`** | Insertar uno o varios documentos en una coleccion |
| **`find` / `findOne`** | Leer documentos; `find` devuelve cursor, `findOne` devuelve un objeto o null |
| **`.toArray()`** | Convierte el cursor de `find()` en un array de objetos |
| **`$eq`, `$ne`, `$gt`, `$lt`** | Operadores de comparacion en filtros |
| **`$in`, `$nin`** | El campo esta (o no esta) en una lista de valores |
| **`$and`, `$or`, `$not`** | Operadores logicos para combinar condiciones |
| **Proyeccion** | Especificar que campos incluir o excluir en los resultados |
| **`.sort()`** | Ordenar resultados (1 = ASC, -1 = DESC) |
| **`.skip()` / `.limit()`** | Saltear y limitar documentos; base de la paginacion |
| **`countDocuments()`** | Contar documentos que coinciden con un filtro |
| **Indice** | Estructura que acelera las busquedas en un campo |
| **`updateOne` / `updateMany`** | Modificar uno o varios documentos |
| **`$set`** | Actualizar o agregar campos sin tocar los demas |
| **`$inc`** | Incrementar o decrementar un campo numerico |
| **`$push` / `$pull`** | Agregar o quitar elementos de un array dentro de un documento |
| **upsert** | Insertar el documento si no existe, actualizar si existe |
| **`deleteOne` / `deleteMany`** | Eliminar uno o varios documentos |
| **`new ObjectId(id)`** | Convertir un string a ObjectId para buscar por `_id` |

---

## Ejercicios

### Ejercicio 1 — Conexion y primera insercion

Conectate a MongoDB e inserta al menos 5 productos en una coleccion llamada `"productos"`. Cada producto debe tener: `nombre`, `precio`, `stock` y `categoria`.

Despues de insertar, usa `find().toArray()` para leer todos e imprimirlos en consola.

---

### Ejercicio 2 — Filtros basicos

Sobre la coleccion del ejercicio anterior, hace las siguientes consultas por separado e imprime los resultados:

1. Productos con precio mayor a 3000
2. Productos con stock igual a 0
3. Productos cuyo nombre sea "Mouse" o "Teclado" (usa `$in`)
4. Productos con precio entre 1000 y 10000 (usa `$and`)

---

### Ejercicio 3 — Proyeccion y orden

Sobre la misma coleccion:

1. Traer todos los productos pero mostrar solo `nombre` y `precio` (sin `_id`)
2. Ordenarlos por precio de mayor a menor
3. Traer el producto mas caro con `findOne` y `.sort({ precio: -1 })`

---

### Ejercicio 4 — Paginacion

Crea un endpoint `GET /productos?pagina=1` que devuelva 3 productos por pagina. La respuesta debe incluir:

```json
{
  "datos": [...],
  "pagina": 1,
  "totalPaginas": 4,
  "total": 12
}
```

Proba los endpoints `?pagina=1`, `?pagina=2`, `?pagina=3` para verificar que funcionan.

---

### Ejercicio 5 — Actualizacion

1. Actualizá el precio de un producto especifico usando `updateOne` y `$set`
2. Usa `$inc` para restar 1 al stock de ese producto (simulando una venta)
3. Marcá todos los productos con `stock: 0` como `{ disponible: false }` con `updateMany`
4. Verifica los cambios con `findOne`

---

### Ejercicio 6 — Eliminacion y upsert

1. Elimina un producto por su `_id` (tenes que obtener el id de una consulta previa y pasarlo con `new ObjectId(id)`)
2. Usa `deleteMany` para eliminar todos los productos de una categoria especifica
3. Usa `upsert: true` para insertar un producto si no existe, o actualizar su precio si ya existe

---

### Ejercicio 7 — API REST completa

Construi una API REST completa para un CRUD de productos con Express y MongoDB:

**Rutas:**
- `GET /productos` — listar todos (con soporte de `?pagina=N`)
- `GET /productos/:id` — obtener uno por id
- `POST /productos` — crear uno nuevo
- `PUT /productos/:id` — actualizar campos con `$set`
- `DELETE /productos/:id` — eliminar

**Requerimientos:**
- Usar un modulo `db.js` separado para la conexion
- Devolver `404` cuando el documento no existe
- Convertir el `id` a `ObjectId` correctamente en las rutas que lo necesiten
- Probar todos los endpoints con un cliente HTTP (Thunder Client, Postman, o curl)
