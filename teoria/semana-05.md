# Semana 5: Motores de Plantillas y Routers en Express

Hasta ahora nuestras rutas devolvian JSON. Eso es lo correcto cuando construis una API que consume una app React o movil. Pero hay casos donde el servidor directamente genera el HTML que se muestra en el navegador. Para eso existen los **motores de plantillas**.

Esta semana tambien vemos como manejar subida de archivos con Multer.

---

## 1. Integracion con vistas — Que es un motor de plantillas

Un **motor de plantillas** (template engine) es una herramienta que combina una plantilla HTML con datos dinamicos para generar el HTML final que se envia al navegador.

En lugar de esto:

```js
app.get("/usuario/:id", (req, res) => {
    res.json({ id: 1, nombre: "Ana" }); // solo datos, sin formato visual
});
```

Hacemos esto:

```js
app.get("/usuario/:id", (req, res) => {
    res.render("perfil", { nombre: "Ana" }); // genera y envia HTML completo
});
```

El archivo `perfil.hbs` podria ser:

```html
<h1>Bienvenida, {{nombre}}</h1>
```

Y lo que llega al navegador es:

```html
<h1>Bienvenida, Ana</h1>
```

La analogia es una carta con espacios en blanco: tenes el texto fijo impreso y completas los huecos con los datos del destinatario. El motor de plantillas hace ese proceso automaticamente.

Cuando usar vistas en lugar de JSON:
- Apps donde el servidor genera el HTML directamente (SSR — Server Side Rendering)
- Paneles de administracion simples
- Emails generados en el servidor
- Apps que no tienen un frontend separado

---

## 2. Handlebars — Configuracion

**Handlebars** es uno de los motores de plantillas mas populares para Express. Su sintaxis usa dobles llaves `{{ }}` para insertar datos.

```bash
npm install express-handlebars
```

Configuracion en `index.js`:

```js
const express = require("express");
const { engine } = require("express-handlebars");
const path = require("path");

const app = express();

// configurar handlebars como motor de vistas
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views")); // carpeta donde estan las plantillas

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // para parsear formularios HTML

app.listen(3000);
```

La estructura de carpetas esperada por Handlebars:

```
proyecto/
├── index.js
└── views/
    ├── home.handlebars        ← vista
    ├── productos.handlebars   ← vista
    └── layouts/
        └── main.handlebars    ← layout principal
```

### express.urlencoded

Fijate que ademas de `express.json()` agregamos `express.urlencoded({ extended: true })`. Esto parsea el cuerpo de los formularios HTML, que no usan JSON sino el formato `application/x-www-form-urlencoded`. Sin esto, `req.body` queda vacio cuando el usuario manda un formulario.

---

## 3. Layouts

Un **layout** es la estructura HTML compartida entre todas las vistas: el `<html>`, el `<head>`, la barra de navegacion, el footer. En lugar de repetirlo en cada archivo, lo defines una sola vez en el layout y cada vista solo escribe lo que es especifico de esa pagina.

`views/layouts/main.handlebars`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi App</title>
    <link rel="stylesheet" href="/css/estilos.css">
</head>
<body>
    <nav>
        <a href="/">Inicio</a>
        <a href="/productos">Productos</a>
    </nav>

    <main>
        {{{body}}}
    </main>

    <footer>
        <p>Mi App 2024</p>
    </footer>
</body>
</html>
```

`{{{body}}}` (con tres llaves) es donde Handlebars inyecta el contenido de cada vista. Las tres llaves desactivan el escape de HTML; si usaras dos llaves `{{body}}` el HTML de la vista apareceria como texto plano en lugar de renderizarse.

Cada vista solo necesita escribir su parte:

`views/home.handlebars`:

```html
<h1>Bienvenido, {{nombre}}</h1>
<p>Tenes {{cantidadProductos}} productos disponibles.</p>
```

Y en la ruta:

```js
app.get("/", (req, res) => {
    res.render("home", {
        nombre: "Ana",
        cantidadProductos: 42
    });
});
```

Handlebars automaticamente envuelve el contenido de `home.handlebars` dentro de `main.handlebars` en el lugar del `{{{body}}}`.

---

## 4. Sintaxis de Handlebars — Expresiones basicas

### Insertar valores

```html
<!-- escapa HTML por seguridad (convierte <, >, & en entidades) -->
<p>{{nombre}}</p>
<p>{{usuario.email}}</p>

<!-- NO escapa HTML (para insertar HTML generado en el servidor) -->
<p>{{{contenidoHtml}}}</p>
```

Usa `{{}}` siempre que estes insertando datos del usuario. Las dos llaves previenen ataques XSS escapando caracteres peligrosos. Solo usa `{{{}}}` cuando confies completamente en el contenido.

---

## 5. Condicionales con {{#if}}

```html
{{#if estaLogueado}}
    <p>Bienvenido, {{nombre}}</p>
    <a href="/logout">Cerrar sesion</a>
{{else}}
    <a href="/login">Iniciar sesion</a>
{{/if}}
```

```html
{{#if productos.length}}
    <p>Hay {{productos.length}} productos disponibles.</p>
{{else}}
    <p>No hay productos por el momento.</p>
{{/if}}
```

**Limitacion importante**: Handlebars no evalua expresiones dentro del `#if`. No podes hacer `{{#if precio > 1000}}`. Solo evalua si el valor es truthy o falsy. Para comparaciones necesitas preparar el dato en el servidor antes de pasarlo a la vista:

```js
// en la ruta
res.render("producto", {
    producto,
    esCarо: producto.precio > 1000  // calculamos en el server
});
```

```html
<!-- en la vista -->
{{#if esCaro}}
    <span class="precio-alto">Precio premium</span>
{{/if}}
```

---

## 6. Iteraciones con {{#each}}

```html
<ul>
    {{#each productos}}
        <li>{{this.nombre}} - ${{this.precio}}</li>
    {{/each}}
</ul>
```

Dentro del bloque `#each`, `this` hace referencia al elemento actual del array. Si los elementos son objetos, podes acceder a sus propiedades directamente con `{{nombre}}` o explicitamente con `{{this.nombre}}`.

`@index` y `@key` son variables especiales disponibles dentro del `#each`:

```html
<table>
    {{#each usuarios}}
    <tr>
        <td>{{@index}}</td>       <!-- indice numerico (0, 1, 2...) -->
        <td>{{this.nombre}}</td>
        <td>{{this.email}}</td>
    </tr>
    {{else}}
    <tr>
        <td colspan="3">No hay usuarios registrados</td>
    </tr>
    {{/each}}
</table>
```

El bloque `{{else}}` dentro del `#each` se renderiza cuando el array esta vacio.

### Acceder al contexto padre desde #each

Dentro de un `#each`, si necesitas acceder a una variable del contexto exterior (no del elemento actual), usas `../`:

```js
res.render("listado", {
    titulo: "Listado de productos",
    productos: [...]
});
```

```html
<h1>{{titulo}}</h1>
<ul>
    {{#each productos}}
        <li>{{this.nombre}} (de: {{../titulo}})</li>
    {{/each}}
</ul>
```

---

## 7. Renderizado dinamico de listas

Un patron muy comun: la ruta lee datos, los pasa a la vista, y la vista los renderiza con `#each`.

```js
// ruta
app.get("/productos", (req, res) => {
    const productos = [
        { id: 1, nombre: "Teclado", precio: 45000, stock: 10 },
        { id: 2, nombre: "Mouse", precio: 15000, stock: 0 },
        { id: 3, nombre: "Monitor", precio: 180000, stock: 5 },
    ];

    res.render("productos", { productos, titulo: "Nuestros Productos" });
});
```

`views/productos.handlebars`:

```html
<h1>{{titulo}}</h1>

{{#each productos}}
    <div class="producto">
        <h2>{{this.nombre}}</h2>
        <p>Precio: ${{this.precio}}</p>

        {{#if this.stock}}
            <span class="disponible">En stock ({{this.stock}} unidades)</span>
        {{else}}
            <span class="agotado">Sin stock</span>
        {{/if}}

        <a href="/productos/{{this.id}}">Ver detalle</a>
    </div>
{{else}}
    <p>No hay productos disponibles.</p>
{{/each}}
```

---

## 8. Archivos estaticos

Para servir archivos estaticos (CSS, imagenes, JavaScript del cliente), Express tiene un middleware incorporado:

```js
app.use(express.static(path.join(__dirname, "public")));
```

Con esto, cualquier archivo en la carpeta `public/` es accesible directamente desde el navegador:

```
public/css/estilos.css   →  http://localhost:3000/css/estilos.css
public/img/logo.png      →  http://localhost:3000/img/logo.png
```

---

## 9. Multer — Subida de archivos

**Multer** es un middleware para Express que maneja subida de archivos. Los formularios con archivos usan el tipo `multipart/form-data`, que ni `express.json()` ni `express.urlencoded()` pueden parsear. Multer se encarga de eso.

```bash
npm install multer
```

### Configuracion basica

```js
const multer = require("multer");
const path = require("path");

// configurar donde y como guardar los archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "public/uploads")); // carpeta destino
    },
    filename: (req, file, cb) => {
        // nombre unico: timestamp + nombre original
        const nombreUnico = `${Date.now()}-${file.originalname}`;
        cb(null, nombreUnico);
    }
});

const upload = multer({ storage });
```

El callback `cb` sigue la convencion de Node: primer argumento es el error (o `null` si no hay error), segundo argumento es el valor.

### Subir un archivo

```js
// upload.single("nombre_del_campo") es el middleware que procesa el archivo
app.post("/productos", upload.single("imagen"), (req, res) => {
    // req.body tiene los campos de texto del formulario
    const { nombre, precio } = req.body;

    // req.file tiene la informacion del archivo subido
    console.log(req.file);
    // {
    //   fieldname: 'imagen',
    //   originalname: 'teclado.jpg',
    //   mimetype: 'image/jpeg',
    //   filename: '1705000000000-teclado.jpg',
    //   path: '/proyecto/public/uploads/1705000000000-teclado.jpg',
    //   size: 245678
    // }

    const rutaImagen = `/uploads/${req.file.filename}`;

    res.json({ nombre, precio, imagen: rutaImagen });
});
```

El formulario HTML correspondiente:

```html
<form action="/productos" method="POST" enctype="multipart/form-data">
    <input type="text" name="nombre" placeholder="Nombre del producto">
    <input type="number" name="precio" placeholder="Precio">
    <input type="file" name="imagen" accept="image/*">
    <button type="submit">Guardar</button>
</form>
```

El atributo `enctype="multipart/form-data"` es obligatorio en formularios que suben archivos. Sin el, el archivo no se envia.

### Subir multiples archivos

```js
// hasta 5 archivos en el campo "fotos"
app.post("/galeria", upload.array("fotos", 5), (req, res) => {
    const rutas = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ archivos: rutas });
});
```

### Validacion de archivos

```js
const upload = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2 MB maximo
    },
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true); // aceptar el archivo
        } else {
            cb(new Error("Solo se permiten imagenes JPEG, PNG o WebP"));
        }
    }
});
```

El error que genera `fileFilter` llega al middleware de error de Express si lo tenes configurado, o rompe si no.

---

## Summary: Conceptos nuevos de la semana

| Concepto | Descripcion rapida |
|---|---|
| **Motor de plantillas** | Herramienta que combina HTML con datos dinamicos para generar el HTML final |
| **SSR** | Server Side Rendering: el servidor genera el HTML completo antes de enviarlo |
| **Handlebars** | Motor de plantillas que usa `{{}}` para insertar datos en HTML |
| **`res.render`** | Metodo de Express para renderizar una vista y enviarla como respuesta |
| **Layout** | Estructura HTML compartida entre vistas (header, nav, footer) |
| **`{{{body}}}`** | Marcador en el layout donde Handlebars inyecta el contenido de cada vista |
| **`{{expresion}}`** | Inserta un valor escapando HTML (seguro para datos del usuario) |
| **`{{{expresion}}}`** | Inserta un valor SIN escapar HTML (solo para contenido confiable) |
| **`{{#if}}`** | Condicional en Handlebars; solo evalua truthy/falsy, no expresiones |
| **`{{#each}}`** | Iteracion sobre arrays en Handlebars |
| **`this`** | Dentro de `#each`, hace referencia al elemento actual |
| **`@index`** | Indice numerico del elemento actual dentro de `#each` |
| **`../`** | Accede al contexto padre desde dentro de un bloque `#each` o `#if` |
| **`express.static`** | Middleware para servir archivos estaticos (CSS, imagenes, JS) |
| **`express.urlencoded`** | Middleware para parsear el body de formularios HTML |
| **Multer** | Middleware para manejar subida de archivos (`multipart/form-data`) |
| **`upload.single`** | Middleware de Multer para procesar un unico archivo |
| **`req.file`** | Informacion del archivo subido (nombre, ruta, tipo, tamaño) |
| **`req.files`** | Array de archivos cuando se suben multiples |
| **`fileFilter`** | Funcion de Multer para aceptar o rechazar archivos segun su tipo |

---

## Ejercicios

### Ejercicio 1 — Setup de Handlebars

Configura un proyecto Express con Handlebars:

1. Instala `express` y `express-handlebars`
2. Crea el layout `main.handlebars` con una barra de navegacion que tenga links a `/` y `/about`
3. Crea una vista `home.handlebars` que muestre un titulo y un mensaje de bienvenida dinamicos
4. Crea una vista `about.handlebars` con texto estatico sobre la app
5. Registra las rutas `GET /` y `GET /about` y pasales los datos necesarios
6. Agrega una carpeta `public/css/` con un archivo `estilos.css` basico y vinculalo desde el layout

---

### Ejercicio 2 — Renderizado de listas con #each

Tenes este array de peliculas en el servidor:

```js
const peliculas = [
    { id: 1, titulo: "Inception", año: 2010, disponible: true },
    { id: 2, titulo: "Interstellar", año: 2014, disponible: false },
    { id: 3, titulo: "The Dark Knight", año: 2008, disponible: true },
    { id: 4, titulo: "Dunkirk", año: 2017, disponible: true },
];
```

Crea una ruta `GET /peliculas` y una vista que:
1. Muestre el titulo de la pagina pasado desde la ruta
2. Muestre cada pelicula en una lista o tabla con su titulo y año
3. Muestre "Disponible" o "No disponible" segun el campo `disponible` usando `{{#if}}`
4. Si el array estuviera vacio, muestre un mensaje alternativo usando `{{else}}` del `#each`
5. Muestre el total de peliculas usando `{{peliculas.length}}`

---

### Ejercicio 3 — Condicionales y contexto

Crea una ruta `GET /perfil` que reciba un query param `?usuario=admin` o `?usuario=invitado`. Segun el valor:

- Si es `"admin"`: pasa `{ nombre: "Admin", esAdmin: true, secciones: ["usuarios", "reportes", "configuracion"] }` a la vista
- Cualquier otro valor: pasa `{ nombre: "Invitado", esAdmin: false, secciones: [] }`

La vista debe:
1. Mostrar el nombre del usuario
2. Si es admin, mostrar un panel con las secciones disponibles usando `#each`
3. Si no es admin, mostrar un mensaje de "acceso limitado"
4. Si no hay secciones disponibles (array vacio), mostrar "Sin secciones asignadas" usando el `{{else}}` del `#each`

---

### Ejercicio 4 — Formulario y POST

Crea un sistema simple de notas con vistas:

1. `GET /notas` — muestra todas las notas en una lista con `#each`
2. En la misma vista, incluye un formulario `<form method="POST" action="/notas">` con campos `titulo` y `contenido`
3. `POST /notas` — recibe el formulario, agrega la nota a un array en memoria, y redirige a `GET /notas` con `res.redirect("/notas")`
4. Muestra la fecha de creacion de cada nota (guardala como `new Date().toLocaleDateString()` al crearla)

Recordá que para que `req.body` tenga los campos del formulario necesitas `express.urlencoded({ extended: true })`.

---

### Ejercicio 5 — Multer: subida de imagen

Agrega al sistema de notas del ejercicio anterior la posibilidad de adjuntar una imagen:

1. Configura Multer con `diskStorage` para guardar en `public/uploads/`
2. Modifica el formulario para aceptar un campo `imagen` de tipo `file` con `enctype="multipart/form-data"`
3. En el POST, si se subio una imagen (`req.file`), guarda la ruta en la nota; si no, guarda `null`
4. En la vista, si la nota tiene imagen, mostrala con `<img>`; si no, muestra un placeholder

---

### Ejercicio 6 — Validacion de archivos

Extiende la configuracion de Multer del ejercicio anterior para:

1. Rechazar archivos que no sean `image/jpeg`, `image/png` o `image/gif`
2. Limitar el tamaño a 1 MB
3. Capturar el error de Multer en un middleware de error y mostrar un mensaje amigable en la vista (pista: los errores de Multer son instancias de `multer.MulterError`)

Testa subiendo un archivo `.txt` y uno muy grande para verificar que los errores se manejan correctamente.

---

### Ejercicio 7 — Integracion: vistas + CRUD + archivos

Construi una app de catalogo de productos con vistas Handlebars que tenga:

**Rutas y vistas:**
- `GET /productos` — lista todos los productos, con nombre, precio, stock e imagen
- `GET /productos/nuevo` — muestra un formulario para crear un producto
- `POST /productos` — procesa el formulario, guarda el producto (con imagen) y redirige a `/productos`
- `GET /productos/:id` — muestra el detalle de un producto

**Requisitos:**
- Estructura modular: router en `routes/productos.js`, vistas en `views/`
- Multer para la imagen (requerida, solo JPEG/PNG, max 2MB)
- Validacion del formulario: si falta nombre o precio, re-renderizar el formulario con un mensaje de error visible en la vista
- El layout debe ser compartido por todas las vistas
