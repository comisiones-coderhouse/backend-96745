# Evaluación Final: API de E-Commerce con Node.js, Express, MongoDB y WebSockets

Llegaste a la instancia final del curso, donde vas a integrar todo lo aprendido en el desarrollo de un proyecto backend completo. A lo largo de la cursada trabajaste sobre la construcción progresiva de una aplicación, incorporando desde lógica de programación hasta persistencia de datos y comunicación en tiempo real. En esta evaluación, deberás llevar ese proyecto a una versión más robusta y profesional, aplicando buenas prácticas de desarrollo backend.

Esta es la instancia donde conectás todas las piezas: servidor, rutas, modelos, persistencia, vistas y tiempo real. El objetivo no es empezar desde cero, sino tomar el proyecto que ya tenés y llevarlo a una versión completa y profesional. Esta guía te orienta paso a paso en cada parte que debés completar o mejorar.

---

## 1. Qué se espera del proyecto final

El proyecto es una **API de e-commerce** que gestiona productos y carritos de compra. Tiene que funcionar de dos formas: como API REST (consumible desde Postman o un frontend) y como aplicación web con vistas renderizadas en el servidor.

En este proyecto pondrás en juego los principales conceptos trabajados durante el curso:

- Desarrollo de servidores con Node.js y Express
- Organización de rutas mediante Express Router
- Manejo de asincronía con `async/await`
- Persistencia de datos con FileSystem y MongoDB (Mongoose)
- Modelado de datos y relaciones
- Implementación de CRUD completo
- Uso de WebSockets para actualización en tiempo real
- Optimización de consultas mediante filtros, paginación y ordenamiento

El checklist de funcionalidades es:

| Área | Requerimiento |
|---|---|
| Servidor | Express en puerto **8080** |
| Rutas API | `/api/products` y `/api/carts` |
| Productos | CRUD completo + paginación + filtros + ordenamiento |
| Carritos | CRUD completo + populate de productos |
| Persistencia | MongoDB con Mongoose (base de datos `ecommerce`) |
| Persistencia legada | FileSystem: **no eliminar**, mantener ambas implementaciones |
| Vistas | `/products`, `/products/:pid`, `/carts/:cid` |
| Tiempo real | WebSockets: cambios en productos se reflejan en la vista automáticamente |
| Arquitectura | Carpeta `dao`, carpeta `models`, código modular |

---

## 2. Estructura recomendada del proyecto

Antes de escribir código, organizá bien las carpetas. Una estructura clara separa responsabilidades y facilita el mantenimiento. La separación en capas (rutas → controllers → DAO → modelos) es lo que hace que el código sea modular y fácil de entender.

```
mi-proyecto/
├── .env                          ← variables de entorno (no subir a git)
├── .gitignore
├── package.json
├── index.js                      ← arranque: conexión a DB + servidor + socket.io
├── app.js                        ← configuración de Express: middlewares y rutas
│
├── dao/                          ← capa de acceso a datos (Data Access Object)
│   ├── fs/
│   │   ├── products.fs.dao.js    ← implementación con FileSystem
│   │   └── carts.fs.dao.js
│   └── mongo/
│       ├── products.mongo.dao.js ← implementación con MongoDB/Mongoose
│       └── carts.mongo.dao.js
│
├── models/                       ← schemas de Mongoose
│   ├── product.model.js
│   └── cart.model.js
│
├── routes/
│   ├── api/
│   │   ├── products.api.routes.js
│   │   └── carts.api.routes.js
│   └── views/
│       └── views.routes.js
│
├── controllers/
│   ├── products.controller.js
│   ├── carts.controller.js
│   └── views.controller.js
│
├── views/                        ← templates de Handlebars
│   ├── layouts/
│   │   └── main.handlebars
│   ├── products.handlebars
│   ├── productDetail.handlebars
│   └── cart.handlebars
│
└── public/                       ← archivos estáticos del cliente
    └── js/
        └── realtime.js           ← código socket del lado del cliente
```

La separación entre `dao/fs` y `dao/mongo` es clave: permite usar cualquiera de las dos implementaciones sin cambiar ni las rutas ni los controllers. El controller llama al DAO, el DAO se encarga de hablar con el archivo o con la base de datos. Si en el futuro querés cambiar a otro motor de base de datos, solo reemplazás el DAO.

---

## 3. Modelos con Mongoose

Los modelos son la base de toda la persistencia con MongoDB. Definen la forma que deben tener los documentos antes de que lleguen a la base de datos, y Mongoose rechaza cualquier dato que no cumpla con esas reglas.

### 3.1 Modelo de Producto

El schema define exactamente qué campos acepta un producto y cuáles son obligatorios. El `_id` lo genera MongoDB automáticamente: **no lo definas vos** en el schema.

```js
// models/product.model.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "El título es obligatorio"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "La descripción es obligatoria"]
    },
    code: {
        type: String,
        required: [true, "El código es obligatorio"],
        unique: true,          // no pueden existir dos productos con el mismo código
        uppercase: true,
        trim: true
    },
    price: {
        type: Number,
        required: [true, "El precio es obligatorio"],
        min: [0, "El precio no puede ser negativo"]
    },
    status: {
        type: Boolean,
        default: true          // los productos se crean activos por defecto
    },
    stock: {
        type: Number,
        required: [true, "El stock es obligatorio"],
        min: [0, "El stock no puede ser negativo"],
        default: 0
    },
    category: {
        type: String,
        required: [true, "La categoría es obligatoria"],
        trim: true
    },
    thumbnails: {
        type: [String],        // array de URLs o paths de imágenes
        default: []
    }
}, {
    timestamps: true           // agrega createdAt y updatedAt automáticamente
});

const productModel = mongoose.model("product", productSchema);

export default productModel;
```

### 3.2 Modelo de Carrito

El carrito tiene una **relación** con los productos: cada ítem del carrito es un objeto que referencia un producto por su `_id` y tiene una cantidad. Esta referencia (`ref: "product"`) es lo que permite usar `populate` después para traer los datos completos del producto en lugar de solo el ID.

```js
// models/cart.model.js
import mongoose from "mongoose";

// sub-schema para cada ítem dentro del carrito
// { _id: false } evita que Mongoose genere un _id para cada ítem
const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,  // referencia al _id de un producto
        ref: "product",                         // "product" es el nombre del modelo
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, "La cantidad mínima es 1"],
        default: 1
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    products: {
        type: [cartItemSchema],
        default: []             // carrito vacío por defecto
    }
}, {
    timestamps: true
});

const cartModel = mongoose.model("cart", cartSchema);

export default cartModel;
```

Cuando llamás `.populate("products.product")`, Mongoose automáticamente reemplaza cada `ObjectId` con el documento completo del producto. Esto es lo que permite mostrar título, precio e imagen en la vista del carrito sin hacer consultas adicionales.

---

## 4. La capa DAO (Data Access Object)

DAO es un patrón de diseño que encapsula toda la lógica de acceso a datos en una clase o módulo separado. Los controllers no saben si los datos vienen de un archivo JSON o de MongoDB: solo llaman métodos del DAO como `getAll()`, `getById()`, `create()`, etc. Si mañana querés cambiar de base de datos, solo cambiás el DAO.

### 4.1 DAO de Productos con MongoDB

Este DAO encapsula todas las operaciones con Mongoose para la colección de productos. La lógica de paginación, filtros y ordenamiento vive acá, no en los controllers.

```js
// dao/mongo/products.mongo.dao.js
import productModel from "../../models/product.model.js";

class ProductsMongoDAO {

    // Obtener todos con paginación, filtro y ordenamiento
    // options: { limit, page, query, sort }
    async getAll(options = {}) {
        const { limit = 10, page = 1, query = null, sort = null } = options;

        // construir el filtro de MongoDB a partir del query string
        // el parámetro query puede ser una categoría ("electronica") o la disponibilidad ("true"/"false")
        let filter = {};
        if (query) {
            if (query === "true" || query === "false") {
                filter.status = query === "true";
            } else {
                filter.category = query;
            }
        }

        // construir el criterio de ordenamiento por precio
        let sortCriteria = {};
        if (sort === "asc") sortCriteria.price = 1;
        if (sort === "desc") sortCriteria.price = -1;

        const skip = (page - 1) * limit;

        // ejecutar la consulta y el conteo en paralelo con Promise.all
        // es más eficiente que hacerlos secuencialmente
        const [docs, totalDocs] = await Promise.all([
            productModel.find(filter).sort(sortCriteria).skip(skip).limit(limit),
            productModel.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(totalDocs / limit);

        return {
            docs,
            totalDocs,
            limit,
            totalPages,
            page,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null
        };
    }

    async getById(id) {
        return productModel.findById(id);
    }

    async create(productData) {
        return productModel.create(productData);
    }

    async update(id, productData) {
        // { new: true } devuelve el documento ya actualizado (no el anterior)
        // runValidators: true aplica las validaciones del schema al actualizar
        return productModel.findByIdAndUpdate(
            id,
            { $set: productData },
            { new: true, runValidators: true }
        );
    }

    async delete(id) {
        return productModel.findByIdAndDelete(id);
    }
}

export default new ProductsMongoDAO();
```

### 4.2 DAO de Productos con FileSystem (mantener)

Esta implementación debe coexistir con la de MongoDB. Cumple con el requisito de no eliminar la implementación previa con FileSystem.

```js
// dao/fs/products.fs.dao.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE_PATH = path.join(__dirname, "../../data/products.json");

class ProductsFSDAO {

    async _readFile() {
        try {
            const content = await fs.readFile(FILE_PATH, "utf-8");
            return JSON.parse(content);
        } catch {
            return [];  // si el archivo no existe, devolver array vacío
        }
    }

    async _writeFile(data) {
        await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2));
    }

    async getAll({ limit = 10, page = 1 } = {}) {
        const all = await this._readFile();
        const skip = (page - 1) * limit;
        const docs = all.slice(skip, skip + limit);
        const totalDocs = all.length;
        const totalPages = Math.ceil(totalDocs / limit);
        return {
            docs,
            totalDocs,
            limit,
            totalPages,
            page,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null
        };
    }

    async getById(id) {
        const all = await this._readFile();
        return all.find(p => p.id === id) || null;
    }

    async create(productData) {
        const all = await this._readFile();
        // generar ID numérico autoincremental
        const newId = all.length > 0 ? Math.max(...all.map(p => p.id)) + 1 : 1;
        const newProduct = { id: newId, ...productData };
        all.push(newProduct);
        await this._writeFile(all);
        return newProduct;
    }

    async update(id, productData) {
        const all = await this._readFile();
        const index = all.findIndex(p => p.id === id);
        if (index === -1) return null;
        // no modificar el id aunque venga en el body
        all[index] = { ...all[index], ...productData, id: all[index].id };
        await this._writeFile(all);
        return all[index];
    }

    async delete(id) {
        const all = await this._readFile();
        const index = all.findIndex(p => p.id === id);
        if (index === -1) return null;
        const [deleted] = all.splice(index, 1);
        await this._writeFile(all);
        return deleted;
    }
}

export default new ProductsFSDAO();
```

### 4.3 DAO de Carritos con MongoDB

Los carritos tienen lógica más específica: agregar un producto incrementa la cantidad si ya existe, y el `getById` siempre usa `populate` para traer los datos completos del producto.

```js
// dao/mongo/carts.mongo.dao.js
import cartModel from "../../models/cart.model.js";

class CartsMongoDAO {

    async create() {
        return cartModel.create({ products: [] });
    }

    // populate reemplaza los ObjectId de cada ítem con los documentos completos
    async getById(id) {
        return cartModel.findById(id).populate("products.product");
    }

    async addProduct(cartId, productId) {
        const cart = await cartModel.findById(cartId);
        if (!cart) return null;

        // buscar si el producto ya está en el carrito
        const existingItem = cart.products.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            // si ya existe, incrementar la cantidad en 1
            existingItem.quantity += 1;
        } else {
            // si no existe, agregar el ítem nuevo con cantidad 1
            cart.products.push({ product: productId, quantity: 1 });
        }

        await cart.save();
        // después de guardar, poblar los productos antes de devolver
        return cartModel.findById(cartId).populate("products.product");
    }

    async removeProduct(cartId, productId) {
        const cart = await cartModel.findById(cartId);
        if (!cart) return null;
        cart.products = cart.products.filter(
            item => item.product.toString() !== productId
        );
        await cart.save();
        return cart;
    }

    // reemplaza todos los productos del carrito
    // products debe ser un array de { product: id, quantity: N }
    async updateProducts(cartId, products) {
        return cartModel.findByIdAndUpdate(
            cartId,
            { products },
            { new: true }
        ).populate("products.product");
    }

    async updateProductQuantity(cartId, productId, quantity) {
        const cart = await cartModel.findById(cartId);
        if (!cart) return null;
        const item = cart.products.find(
            item => item.product.toString() === productId
        );
        if (!item) return null;
        item.quantity = quantity;
        await cart.save();
        return cart;
    }

    async clearCart(cartId) {
        return cartModel.findByIdAndUpdate(
            cartId,
            { products: [] },
            { new: true }
        );
    }
}

export default new CartsMongoDAO();
```

---

## 5. API de Productos: el endpoint GET con paginación

El `GET /api/products` es el endpoint más complejo porque combina filtros, paginación y ordenamiento simultáneamente, y exige un formato de respuesta específico que el evaluador va a verificar.

### 5.1 Formato de respuesta requerido

La respuesta debe tener exactamente esta estructura, con todos estos campos aunque algunos sean `null`:

```json
{
    "status": "success",
    "payload": [...],
    "totalPages": 5,
    "prevPage": null,
    "nextPage": 2,
    "page": 1,
    "hasPrevPage": false,
    "hasNextPage": true,
    "prevLink": null,
    "nextLink": "http://localhost:8080/api/products?page=2&limit=10"
}
```

Los campos `prevLink` y `nextLink` son URLs completas que el cliente puede usar directamente para navegar entre páginas. Si no hay página previa o siguiente, el valor es `null`, no una cadena vacía.

### 5.2 Controller de Productos

El controller recibe los query params, llama al DAO y construye la respuesta con el formato correcto. La lógica de acceso a datos NO va en el controller: eso es responsabilidad del DAO.

```js
// controllers/products.controller.js
import productsDAO from "../dao/mongo/products.mongo.dao.js";
// para cambiar a FileSystem, solo cambiás esta importación:
// import productsDAO from "../dao/fs/products.fs.dao.js";

class ProductsController {

    static getAll = async (req, res) => {
        try {
            const { limit = 10, page = 1, query, sort } = req.query;

            const result = await productsDAO.getAll({
                limit: parseInt(limit),
                page: parseInt(page),
                query: query || null,
                sort: sort || null
            });

            // construir los links de paginación preservando todos los filtros activos
            const baseUrl = `${req.protocol}://${req.get("host")}/api/products`;
            const buildLink = (pageNum) => {
                const params = new URLSearchParams({
                    limit,
                    page: pageNum,
                    ...(query && { query }),
                    ...(sort && { sort })
                });
                return `${baseUrl}?${params.toString()}`;
            };

            return res.json({
                status: "success",
                payload: result.docs,
                totalPages: result.totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevLink: result.hasPrevPage ? buildLink(result.prevPage) : null,
                nextLink: result.hasNextPage ? buildLink(result.nextPage) : null
            });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    };

    static getById = async (req, res) => {
        try {
            const product = await productsDAO.getById(req.params.pid);
            if (!product) {
                return res.status(404).json({ status: "error", message: "Producto no encontrado" });
            }
            return res.json({ status: "success", payload: product });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    };

    static create = async (req, res) => {
        try {
            const { title, description, code, price, status, stock, category, thumbnails } = req.body;

            // validación de campos obligatorios
            if (!title || !description || !code || price === undefined || stock === undefined || !category) {
                return res.status(400).json({
                    status: "error",
                    message: "Faltan campos obligatorios: title, description, code, price, stock, category"
                });
            }

            const newProduct = await productsDAO.create({
                title, description, code,
                price: Number(price),
                status: status !== undefined ? Boolean(status) : true,
                stock: Number(stock),
                category,
                thumbnails: thumbnails || []
            });

            // emitir el evento de nuevo producto por socket.io a todos los clientes conectados
            // req.app.get("io") accede a la instancia de socket guardada en app
            const io = req.app.get("io");
            if (io) io.emit("product-created", newProduct);

            return res.status(201).json({ status: "success", payload: newProduct });
        } catch (err) {
            if (err.name === "ValidationError") {
                const messages = Object.values(err.errors).map(e => e.message);
                return res.status(400).json({ status: "error", messages });
            }
            return res.status(500).json({ status: "error", message: err.message });
        }
    };

    static update = async (req, res) => {
        try {
            // desestructurar el body excluyendo _id para que no se pueda pisar
            const { _id, ...updateData } = req.body;

            const updated = await productsDAO.update(req.params.pid, updateData);
            if (!updated) {
                return res.status(404).json({ status: "error", message: "Producto no encontrado" });
            }

            const io = req.app.get("io");
            if (io) io.emit("product-updated", updated);

            return res.json({ status: "success", payload: updated });
        } catch (err) {
            if (err.name === "ValidationError") {
                const messages = Object.values(err.errors).map(e => e.message);
                return res.status(400).json({ status: "error", messages });
            }
            return res.status(500).json({ status: "error", message: err.message });
        }
    };

    static delete = async (req, res) => {
        try {
            const deleted = await productsDAO.delete(req.params.pid);
            if (!deleted) {
                return res.status(404).json({ status: "error", message: "Producto no encontrado" });
            }

            const io = req.app.get("io");
            if (io) io.emit("product-deleted", { id: req.params.pid });

            return res.json({ status: "success", payload: deleted });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    };
}

export default ProductsController;
```

### 5.3 Router de Productos API

```js
// routes/api/products.api.routes.js
import { Router } from "express";
import ProductsController from "../../controllers/products.controller.js";

const router = Router();

router.get("/", ProductsController.getAll);
router.get("/:pid", ProductsController.getById);
router.post("/", ProductsController.create);
router.put("/:pid", ProductsController.update);
router.delete("/:pid", ProductsController.delete);

export default router;
```

Y en `app.js` lo montás bajo `/api/products`:

```js
import productsApiRouter from "./routes/api/products.api.routes.js";
app.use("/api/products", productsApiRouter);
```

Con esta configuración, el router maneja `/api/products`, `/api/products/:pid` y todo lo demás internamente.

---

## 6. API de Carritos

Los carritos tienen lógica más compleja: gestionan una relación entre el carrito y los productos, y cuando pedís un carrito querés ver los datos completos de cada producto, no solo su ID.

### 6.1 Controller de Carritos

```js
// controllers/carts.controller.js
import cartsDAO from "../dao/mongo/carts.mongo.dao.js";

class CartsController {

    static create = async (req, res) => {
        try {
            const newCart = await cartsDAO.create();
            return res.status(201).json({ status: "success", payload: newCart });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    };

    static getById = async (req, res) => {
        try {
            const cart = await cartsDAO.getById(req.params.cid);
            if (!cart) {
                return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
            }
            return res.json({ status: "success", payload: cart });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    };

    static addProduct = async (req, res) => {
        try {
            const { cid, pid } = req.params;
            const cart = await cartsDAO.addProduct(cid, pid);
            if (!cart) {
                return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
            }
            return res.json({ status: "success", payload: cart });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    };

    static removeProduct = async (req, res) => {
        try {
            const { cid, pid } = req.params;
            const cart = await cartsDAO.removeProduct(cid, pid);
            if (!cart) {
                return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
            }
            return res.json({ status: "success", payload: cart });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    };

    // reemplaza todos los productos del carrito
    // el body debe ser un array: [{ "product": "id", "quantity": 2 }, ...]
    static updateProducts = async (req, res) => {
        try {
            const cart = await cartsDAO.updateProducts(req.params.cid, req.body);
            if (!cart) {
                return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
            }
            return res.json({ status: "success", payload: cart });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    };

    // actualiza únicamente la cantidad de un producto específico del carrito
    static updateProductQuantity = async (req, res) => {
        try {
            const { cid, pid } = req.params;
            const { quantity } = req.body;
            if (!quantity || quantity < 1) {
                return res.status(400).json({ status: "error", message: "La cantidad debe ser mayor a 0" });
            }
            const cart = await cartsDAO.updateProductQuantity(cid, pid, quantity);
            if (!cart) {
                return res.status(404).json({ status: "error", message: "Carrito o producto no encontrado" });
            }
            return res.json({ status: "success", payload: cart });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    };

    static clearCart = async (req, res) => {
        try {
            const cart = await cartsDAO.clearCart(req.params.cid);
            if (!cart) {
                return res.status(404).json({ status: "error", message: "Carrito no encontrado" });
            }
            return res.json({ status: "success", payload: cart });
        } catch (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
    };
}

export default CartsController;
```

### 6.2 Router de Carritos API

Prestá atención al orden y los métodos HTTP: `POST /:cid/products/:pid` agrega un producto, `PUT /:cid/products/:pid` actualiza solo la cantidad, `DELETE /:cid/products/:pid` elimina el producto, y `DELETE /:cid` vacía todo el carrito.

```js
// routes/api/carts.api.routes.js
import { Router } from "express";
import CartsController from "../../controllers/carts.controller.js";

const router = Router();

router.post("/", CartsController.create);
router.get("/:cid", CartsController.getById);
router.post("/:cid/products/:pid", CartsController.addProduct);
router.delete("/:cid/products/:pid", CartsController.removeProduct);
router.put("/:cid", CartsController.updateProducts);
router.put("/:cid/products/:pid", CartsController.updateProductQuantity);
router.delete("/:cid", CartsController.clearCart);

export default router;
```

---

## 7. Configuración del servidor completo

El servidor principal necesita configurar Express, Mongoose, Socket.io y arrancar todo en el puerto 8080.

### 7.1 app.js

`app.js` solo configura Express: middlewares, motor de vistas y rutas. No sabe nada de base de datos ni de sockets. Esto permite importarlo en tests sin arrancar el servidor.

```js
// app.js
import express from "express";
import { engine } from "express-handlebars";
import productsApiRouter from "./routes/api/products.api.routes.js";
import cartsApiRouter from "./routes/api/carts.api.routes.js";
import viewsRouter from "./routes/views/views.routes.js";

const app = express();

// middlewares esenciales
app.use(express.static("public"));           // servir archivos estáticos desde /public
app.use(express.json());                     // parsear body con Content-Type: application/json
app.use(express.urlencoded({ extended: true })); // parsear formularios HTML

// configurar el motor de plantillas Handlebars con helpers personalizados
app.engine("handlebars", engine({
    helpers: {
        multiply: (a, b) => a * b,    // para calcular subtotales en el carrito
        eq: (a, b) => a === b         // para comparar valores en los templates
    }
}));
app.set("view engine", "handlebars");
app.set("views", "./views");

// rutas de la API REST
app.use("/api/products", productsApiRouter);
app.use("/api/carts", cartsApiRouter);

// rutas de vistas renderizadas
app.use("/", viewsRouter);

export default app;
```

### 7.2 index.js

`index.js` es el punto de entrada: conecta a la base de datos y arranca el servidor **solo después** de que la conexión está establecida. También crea el servidor HTTP y Socket.io.

```js
// index.js
import "dotenv/config";                // cargar variables de entorno PRIMERO
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import app from "./app.js";

const httpServer = createServer(app);
const io = new Server(httpServer);

// guardar la instancia de io en app para que los controllers puedan accederla
// con req.app.get("io")
app.set("io", io);

// eventos de socket.io del lado del servidor
io.on("connection", (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`Socket desconectado: ${socket.id}`);
    });
});

// URI de MongoDB desde variable de entorno, con fallback a local
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce";

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("Conectado a MongoDB - base de datos: ecommerce");

        // arrancar el servidor SOLO después de conectar a la DB
        // si la DB falla, el servidor no arranca
        httpServer.listen(8080, () => {
            console.log("Servidor corriendo en http://localhost:8080");
        });
    })
    .catch((err) => {
        console.error("Error al conectar a MongoDB:", err.message);
        process.exit(1);   // terminar el proceso con código de error
    });
```

La línea `app.set("io", io)` es el truco que permite acceder a Socket.io desde cualquier controller con `req.app.get("io")`. Es la forma más limpia de compartir la instancia sin tener que importarla directamente en cada archivo.

---

## 8. Vistas con Handlebars

Las tres vistas requeridas son: listado de productos con paginación, detalle de producto con opción para agregar al carrito, y visualización de un carrito específico.

### 8.1 Controller de Vistas

```js
// controllers/views.controller.js
import productsDAO from "../dao/mongo/products.mongo.dao.js";
import cartsDAO from "../dao/mongo/carts.mongo.dao.js";

class ViewsController {

    // GET /products — listado paginado con filtros
    static getProducts = async (req, res) => {
        try {
            const { limit = 10, page = 1, query, sort } = req.query;

            const result = await productsDAO.getAll({
                limit: parseInt(limit),
                page: parseInt(page),
                query: query || null,
                sort: sort || null
            });

            // .toObject() convierte los documentos de Mongoose a objetos planos de JS
            // Handlebars no puede iterar sobre documentos de Mongoose directamente
            const products = result.docs.map(p => p.toObject());

            return res.render("products", {
                products,
                page: result.page,
                totalPages: result.totalPages,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                query: query || "",
                sort: sort || ""
            });
        } catch (err) {
            return res.status(500).render("error", { message: err.message });
        }
    };

    // GET /products/:pid — detalle de un producto
    static getProductById = async (req, res) => {
        try {
            const product = await productsDAO.getById(req.params.pid);
            if (!product) {
                return res.status(404).render("error", { message: "Producto no encontrado" });
            }
            return res.render("productDetail", { product: product.toObject() });
        } catch (err) {
            return res.status(500).render("error", { message: err.message });
        }
    };

    // GET /carts/:cid — visualización del carrito con populate
    static getCartById = async (req, res) => {
        try {
            const cart = await cartsDAO.getById(req.params.cid);
            if (!cart) {
                return res.status(404).render("error", { message: "Carrito no encontrado" });
            }

            const cartObj = cart.toObject();
            // calcular el total sumando precio × cantidad de cada ítem
            const total = cartObj.products.reduce(
                (acc, item) => acc + (item.product.price * item.quantity), 0
            );

            return res.render("cart", { cart: cartObj, total });
        } catch (err) {
            return res.status(500).render("error", { message: err.message });
        }
    };
}

export default ViewsController;
```

### 8.2 Router de Vistas

```js
// routes/views/views.routes.js
import { Router } from "express";
import ViewsController from "../../controllers/views.controller.js";

const router = Router();

router.get("/products", ViewsController.getProducts);
router.get("/products/:pid", ViewsController.getProductById);
router.get("/carts/:cid", ViewsController.getCartById);

export default router;
```

### 8.3 Template de listado de productos

```html
<!-- views/products.handlebars -->
<h1>Productos</h1>

<!-- formulario de búsqueda y ordenamiento -->
<form method="GET" action="/products">
    <input type="text" name="query" value="{{query}}" placeholder="Filtrar por categoría o 'true'/'false'">
    <select name="sort">
        <option value="">Sin ordenar</option>
        <option value="asc" {{#if (eq sort "asc")}}selected{{/if}}>Precio: menor a mayor</option>
        <option value="desc" {{#if (eq sort "desc")}}selected{{/if}}>Precio: mayor a menor</option>
    </select>
    <button type="submit">Buscar</button>
</form>

<!-- listado de productos, con id para actualizaciones en tiempo real -->
<div id="products-list">
    {{#each products}}
    <div class="product-card" id="product-{{_id}}">
        <h3><a href="/products/{{_id}}">{{title}}</a></h3>
        <p>Precio: ${{price}}</p>
        <p>Stock: {{stock}}</p>
        <p>Categoría: {{category}}</p>
    </div>
    {{else}}
    <p>No hay productos disponibles.</p>
    {{/each}}
</div>

<!-- controles de paginación -->
<div class="pagination">
    {{#if hasPrevPage}}
        <a href="/products?page={{prevPage}}&limit=10&query={{query}}&sort={{sort}}">← Anterior</a>
    {{/if}}
    <span>Página {{page}} de {{totalPages}}</span>
    {{#if hasNextPage}}
        <a href="/products?page={{nextPage}}&limit=10&query={{query}}&sort={{sort}}">Siguiente →</a>
    {{/if}}
</div>

<!-- scripts de socket.io: el primero lo sirve automáticamente socket.io -->
<script src="/socket.io/socket.io.js"></script>
<script src="/js/realtime.js"></script>
```

### 8.4 Template de detalle de producto

```html
<!-- views/productDetail.handlebars -->
<h1>{{product.title}}</h1>
<p>{{product.description}}</p>
<p><strong>Precio:</strong> ${{product.price}}</p>
<p><strong>Stock:</strong> {{product.stock}}</p>
<p><strong>Categoría:</strong> {{product.category}}</p>
<p><strong>Código:</strong> {{product.code}}</p>

{{#if product.thumbnails.length}}
<div class="thumbnails">
    {{#each product.thumbnails}}
    <img src="{{this}}" alt="Imagen del producto">
    {{/each}}
</div>
{{/if}}

<!-- formulario para agregar al carrito -->
<form id="add-to-cart-form">
    <input type="text" id="cart-id" placeholder="ID del carrito">
    <button type="submit">Agregar al carrito</button>
</form>

<a href="/products">← Volver al listado</a>

<script>
document.getElementById("add-to-cart-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const cartId = document.getElementById("cart-id").value.trim();
    const productId = "{{product._id}}";

    if (!cartId) {
        alert("Ingresá el ID del carrito");
        return;
    }

    const res = await fetch(`/api/carts/${cartId}/products/${productId}`, {
        method: "POST"
    });

    if (res.ok) {
        alert("Producto agregado al carrito");
    } else {
        const data = await res.json();
        alert("Error: " + (data.message || "No se pudo agregar"));
    }
});
</script>
```

### 8.5 Template del carrito

```html
<!-- views/cart.handlebars -->
<h1>Carrito</h1>

{{#if cart.products.length}}
<table>
    <thead>
        <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th>Subtotal</th>
        </tr>
    </thead>
    <tbody>
        {{#each cart.products}}
        <tr>
            <td>{{this.product.title}}</td>
            <td>${{this.product.price}}</td>
            <td>{{this.quantity}}</td>
            <td>${{multiply this.product.price this.quantity}}</td>
        </tr>
        {{/each}}
    </tbody>
</table>

<p><strong>Total: ${{total}}</strong></p>

<button id="clear-cart">Vaciar carrito</button>

<script>
document.getElementById("clear-cart").addEventListener("click", async () => {
    const cartId = "{{cart._id}}";
    const res = await fetch(`/api/carts/${cartId}`, { method: "DELETE" });
    if (res.ok) {
        location.reload();
    }
});
</script>
{{else}}
<p>El carrito está vacío.</p>
{{/if}}

<a href="/products">Seguir comprando</a>
```

El helper `multiply` que se usa en el template lo registrás en `app.js` al configurar el engine (ya está en el ejemplo de `app.js` de la sección 7.1).

---

## 9. WebSockets: actualización en tiempo real

Cuando se crea, actualiza o elimina un producto desde la API, todos los clientes conectados a `/products` deben ver el cambio sin recargar la página.

El flujo completo es:
1. Un cliente hace `POST /api/products` → el controller crea el producto
2. El controller llama `io.emit("product-created", nuevoProducto)` → el servidor difunde ese evento a todos los sockets conectados
3. El script `public/js/realtime.js` en el cliente escucha el evento y agrega la tarjeta al DOM

```js
// public/js/realtime.js
const socket = io();  // conecta automáticamente al servidor donde está la página

// cuando se crea un producto nuevo, agregarlo al principio de la lista
socket.on("product-created", (product) => {
    const list = document.getElementById("products-list");
    if (!list) return;  // si no estamos en la vista de listado, no hacer nada

    const card = document.createElement("div");
    card.classList.add("product-card");
    card.id = `product-${product._id}`;
    card.innerHTML = `
        <h3><a href="/products/${product._id}">${product.title}</a></h3>
        <p>Precio: $${product.price}</p>
        <p>Stock: ${product.stock}</p>
        <p>Categoría: ${product.category}</p>
    `;
    list.prepend(card);  // insertar al principio para verlo inmediatamente
});

// cuando se elimina un producto, quitarlo del DOM
socket.on("product-deleted", ({ id }) => {
    const card = document.getElementById(`product-${id}`);
    if (card) card.remove();
});

// cuando se actualiza un producto, reflejar los cambios
socket.on("product-updated", (product) => {
    const card = document.getElementById(`product-${product._id}`);
    if (!card) return;
    // actualizar el contenido de la tarjeta sin recargar la página
    card.querySelector("h3 a").textContent = product.title;
    card.querySelector("p:nth-child(2)").textContent = `Precio: $${product.price}`;
});
```

Los controllers emiten los eventos con `req.app.get("io").emit(...)`. Los clientes reciben esos eventos a través del socket y modifican el DOM directamente. No hace falta recargar la página.

---

## 10. Variables de entorno

Nunca pongas credenciales de base de datos directamente en el código. Usá un archivo `.env`:

```
# .env — este archivo NO se sube a git
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/ecommerce
PORT=8080
```

```js
// en index.js, la primera línea del archivo:
import "dotenv/config";
```

Y en `.gitignore`:

```
node_modules/
.env
data/
```

Si usás MongoDB Atlas (en la nube), la URI tiene este formato:
```
mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/ecommerce
```

Para obtenerla: MongoDB Atlas → tu cluster → Connect → Drivers → Node.js → copiar URI.

---

## 11. Flujo completo de un request

Una vez que todo está conectado, el flujo de un request a través de la aplicación es:

```
Request HTTP
  └─→ index.js (servidor HTTP + socket.io, puerto 8080)
        └─→ app.js (middlewares de Express: json, static, urlencoded)
              ├─→ /api/products  → products.api.routes.js
              │                       └─→ ProductsController
              │                             └─→ ProductsMongoDAO
              │                                   └─→ productModel (Mongoose)
              │                                         └─→ MongoDB (colección "products")
              │                                               └─→ Response JSON
              │
              ├─→ /api/carts     → carts.api.routes.js
              │                       └─→ CartsController
              │                             └─→ CartsMongoDAO
              │                                   └─→ cartModel + populate
              │                                         └─→ MongoDB (colección "carts")
              │                                               └─→ Response JSON
              │
              └─→ /products      → views.routes.js
                                      └─→ ViewsController
                                            └─→ DAO → MongoDB
                                                  └─→ Handlebars (template .handlebars)
                                                        └─→ Response HTML
```

---

## 12. Pruebas con Postman o Thunder Client

Para probar todos los endpoints antes de preparar la presentación, usá este orden:

### Productos

| Método | URL | Body (JSON) |
|---|---|---|
| GET | `/api/products` | — |
| GET | `/api/products?limit=5&page=2` | — |
| GET | `/api/products?query=electronica&sort=asc` | — |
| GET | `/api/products?query=true` | — (filtra por status activo) |
| GET | `/api/products/:pid` | — |
| POST | `/api/products` | `{ "title": "Teclado", "description": "Mecánico RGB", "code": "TEC001", "price": 8500, "stock": 10, "category": "electronica" }` |
| PUT | `/api/products/:pid` | `{ "price": 9000, "stock": 8 }` |
| DELETE | `/api/products/:pid` | — |

### Carritos

| Método | URL | Body (JSON) |
|---|---|---|
| POST | `/api/carts` | — |
| GET | `/api/carts/:cid` | — |
| POST | `/api/carts/:cid/products/:pid` | — |
| POST | `/api/carts/:cid/products/:pid` (segunda vez) | — (debe incrementar quantity a 2) |
| PUT | `/api/carts/:cid/products/:pid` | `{ "quantity": 5 }` |
| PUT | `/api/carts/:cid` | `[{ "product": "pid", "quantity": 2 }]` |
| DELETE | `/api/carts/:cid/products/:pid` | — |
| DELETE | `/api/carts/:cid` | — (vacía el carrito) |

Guardá las capturas de cada request y su respuesta: son el material principal para las slides de evidencia técnica.

---

## 13. Checklist de entrega

Verificá punto por punto antes de preparar la presentación:

**Servidor y configuración:**
- [ ] El servidor corre en el puerto `8080`
- [ ] Los routers están organizados con Express Router
- [ ] `express.json()` está configurado como middleware
- [ ] `dotenv` carga las variables de entorno

**Rutas de productos (`/api/products`):**
- [ ] `GET /api/products` devuelve la estructura con `status`, `payload`, `totalPages`, `prevLink`, `nextLink`
- [ ] El parámetro `limit` funciona (default 10)
- [ ] El parámetro `page` funciona (default 1)
- [ ] El parámetro `query` filtra por categoría o por `status`
- [ ] El parámetro `sort` ordena por precio (`asc` / `desc`)
- [ ] `GET /api/products/:pid` devuelve el producto o `404`
- [ ] `POST /api/products` crea con ID autogenerado
- [ ] `PUT /api/products/:pid` actualiza sin modificar el `_id`
- [ ] `DELETE /api/products/:pid` elimina y devuelve el producto eliminado

**Rutas de carritos (`/api/carts`):**
- [ ] `POST /api/carts` crea un carrito vacío
- [ ] `GET /api/carts/:cid` usa `populate` (los productos muestran título y precio, no solo ID)
- [ ] `POST /api/carts/:cid/products/:pid` agrega o incrementa cantidad si ya existe
- [ ] `DELETE /api/carts/:cid/products/:pid` elimina el ítem
- [ ] `PUT /api/carts/:cid` reemplaza todos los productos
- [ ] `PUT /api/carts/:cid/products/:pid` actualiza solo la cantidad
- [ ] `DELETE /api/carts/:cid` vacía el carrito (no lo elimina)

**Persistencia:**
- [ ] MongoDB conecta a la base de datos `ecommerce`
- [ ] Existen las colecciones `products` y `carts`
- [ ] La carpeta `dao` existe con implementaciones separadas para FS y MongoDB
- [ ] La carpeta `models` existe con los schemas de Mongoose
- [ ] Los archivos de FileSystem (`.json`) siguen existiendo

**Vistas:**
- [ ] `/products` muestra el listado con paginación y formulario de filtros
- [ ] `/products/:pid` muestra el detalle y tiene opción para agregar al carrito
- [ ] `/carts/:cid` muestra los productos con datos completos (título, precio, cantidad)

**WebSockets:**
- [ ] Al crear un producto desde Postman, aparece en la vista sin recargar
- [ ] Al eliminar un producto desde Postman, desaparece de la vista sin recargar

---

## 14. Guía para la presentación en Google Slides

La evaluación se realiza por slides, no por código directo. La presentación tiene que ser suficientemente clara para que quien la revise pueda entender qué construiste y cómo funciona, sin acceso al repositorio.

**Estructura sugerida (10-15 slides):**

1. **Portada** — nombre del proyecto, tu nombre, fecha
2. **Definición del proyecto** — qué es, qué problema resuelve, para quién es (administradores de tienda, compradores)
3. **Estructura de carpetas** — captura del árbol de archivos con una frase explicando cada capa
4. **Modelos** — schema de `product` y `cart` con la explicación de por qué `ref: "product"` habilita el populate
5. **API de Productos: GET con paginación** — captura de Postman mostrando `?limit=5&page=2&query=electronica&sort=asc` y la respuesta completa con `prevLink`, `nextLink`
6. **API de Productos: CRUD** — capturas de POST, PUT y DELETE con sus respectivas respuestas
7. **API de Carritos: GET con populate** — captura del `GET /api/carts/:cid` mostrando que los productos tienen todos sus datos, no solo el ID
8. **API de Carritos: operaciones** — capturas de agregar, actualizar cantidad y vaciar
9. **Vistas en el navegador** — capturas de `/products` (con paginación visible), `/products/:pid` (con el botón de agregar), `/carts/:cid` (tabla con subtotales)
10. **WebSockets en tiempo real** — GIF o video de la lista actualizándose en el navegador mientras creás desde Postman
11. **MongoDB Atlas** — captura del panel de Atlas mostrando las colecciones `products` y `carts` con datos reales
12. **FileSystem** — captura del archivo `products.json` o `carts.json` para demostrar que la implementación previa sigue existiendo
13. **Dificultades y soluciones** — 2-3 problemas concretos que enfrentaste y cómo los resolviste
14. **Mejoras futuras** — autenticación con JWT, sistema de pagos, búsqueda fulltext, roles de usuario
15. **Repositorio** — link a GitHub

**Consejos para las capturas:**
- Cada captura de Postman debe mostrar claramente: URL completa, método HTTP, body enviado y respuesta recibida. No cortés la URL.
- Para el video de WebSockets: abrí la vista `/products` en el navegador en una ventana y Postman en la otra. Grabá mientras creás un producto por Postman y se ve aparecer en el navegador sin recargar.
- No pongas fragmentos de código muy largos en las slides. Cortá los bloques más relevantes y agregá una frase que explique qué hace cada parte.
- El slide de estructura de carpetas es muy importante: demuestra que el proyecto tiene arquitectura clara y separación de responsabilidades.

---

## Summary: Mapa de conceptos del proyecto final

| Concepto | Dónde se aplica en el proyecto |
|---|---|
| **Express Router** | `routes/api/` y `routes/views/` — cada dominio tiene su router |
| **Middleware** | `express.json()`, `express.static()`, `express.urlencoded()` en `app.js` |
| **async/await** | Todos los métodos de DAO y controllers |
| **Mongoose Schema** | `models/product.model.js` y `models/cart.model.js` |
| **Mongoose Model** | Clase que interactúa con la colección de MongoDB |
| **`ref` y `populate`** | `ref: "product"` en cart.model.js + `.populate("products.product")` en el DAO |
| **Paginación** | `.skip()` y `.limit()` en `products.mongo.dao.js` |
| **Filtros por query** | Objeto `filter` construido desde `req.query.query` |
| **Ordenamiento** | `sortCriteria` construido desde `req.query.sort` |
| **Pattern DAO** | Capa que abstrae el acceso a datos y permite intercambiar FS por MongoDB |
| **FileSystem** | Implementación alternativa en `dao/fs/` — coexiste con MongoDB |
| **`io.emit()`** | Los controllers emiten eventos de socket tras cada mutación |
| **`socket.on()`** | `public/js/realtime.js` escucha eventos y modifica el DOM |
| **Handlebars** | Motor de plantillas para renderizar las vistas en el servidor |
| **dotenv** | Variables de entorno: URI de MongoDB y puerto |
| **`app.set("io", io)`** | Comparte la instancia de socket.io con los controllers via `req.app.get("io")` |
| **`{ new: true }`** | Opción de `findByIdAndUpdate` para devolver el documento ya actualizado |
| **`runValidators: true`** | Activa las validaciones del schema al actualizar (desactivadas por defecto) |
| **`.toObject()`** | Convierte documentos de Mongoose a objetos planos para Handlebars |
| **`Promise.all`** | Ejecuta la consulta y el conteo de documentos en paralelo para mejor rendimiento |
