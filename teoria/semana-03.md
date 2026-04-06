# Semana 3: Desarrollo Avanzado de Backend con Node.js

Esta semana salimos de JavaScript puro y empezamos a construir cosas reales con Node.js. Vamos a ver como leer y escribir archivos, manejar rutas del sistema, crear un servidor HTTP desde cero, y entender como se organiza un proyecto profesional con npm y Git.

---

## 1. Modulos nativos de Node.js

Cuando instalas Node.js, vienen incluidos una serie de **modulos nativos**: bibliotecas listas para usar que cubren las necesidades mas comunes del backend. No necesitas instalar nada; simplemente los importas con `require`.

Los mas importantes son:

| Modulo | Para que sirve |
|--------|---------------|
| `fs` | Leer y escribir archivos del sistema |
| `path` | Manejar rutas de archivos de forma segura |
| `http` | Crear servidores HTTP |
| `os` | Informacion del sistema operativo |
| `crypto` | Hashing, cifrado y generacion de datos aleatorios |
| `events` | EventEmitter (ya lo vimos la semana pasada) |

Para usar cualquiera de ellos:

```js
const fs = require("fs");
const path = require("path");
const http = require("http");
```

`require` es la forma de importar modulos en Node.js. Es sincrona y devuelve el objeto exportado por el modulo. (En versiones modernas de Node tambien se puede usar `import`, pero `require` sigue siendo lo mas comun en proyectos backend reales.)

---

## 2. El modulo fs — Leer y escribir archivos

El modulo **`fs`** (file system) permite interactuar con el sistema de archivos: leer, escribir, eliminar, renombrar archivos y directorios.

Cada operacion tiene dos versiones: sincrona (bloquea el hilo hasta terminar) y asincrona (usa callback o promesas). En un servidor real siempre usas la version asincrona para no bloquear el hilo mientras se lee el disco.

### Leer archivos

```js
const fs = require("fs");

// VERSION ASINCRONA CON CALLBACK (la mas comun en codigo legacy)
fs.readFile("datos.txt", "utf-8", (error, contenido) => {
    if (error) {
        console.error("No se pudo leer el archivo:", error.message);
        return;
    }
    console.log(contenido);
});

console.log("esto se imprime ANTES de que termine de leer");
```

El segundo argumento `"utf-8"` indica la codificacion del texto. Sin ese argumento, `readFile` devuelve un Buffer (datos binarios), no un string.

Tambien podes usar la version con promesas, que va perfecto con `async/await`:

```js
const fs = require("fs/promises"); // submódulo con version promisificada

async function leerArchivo() {
    try {
        const contenido = await fs.readFile("datos.txt", "utf-8");
        console.log(contenido);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

leerArchivo();
```

### Escribir archivos

```js
const fs = require("fs/promises");

async function guardarDatos() {
    const datos = JSON.stringify({ usuario: "Ana", edad: 25 }, null, 2);

    // writeFile crea el archivo si no existe, y lo SOBREESCRIBE si ya existe
    await fs.writeFile("usuario.json", datos, "utf-8");
    console.log("Archivo guardado");
}

// appendFile agrega contenido al final sin sobreescribir
async function agregarLog(mensaje) {
    const linea = `[${new Date().toISOString()}] ${mensaje}\n`;
    await fs.appendFile("logs.txt", linea, "utf-8");
}
```

`JSON.stringify(objeto, null, 2)` convierte un objeto JavaScript a texto JSON con una indentacion de 2 espacios. El `null` del medio es para el parametro `replacer` que raramente se usa.

### Verificar si un archivo existe

```js
const fs = require("fs/promises");

async function existeArchivo(ruta) {
    try {
        await fs.access(ruta);
        return true;
    } catch {
        return false;
    }
}
```

### Leer el contenido de un directorio

```js
const fs = require("fs/promises");

async function listarArchivos(directorio) {
    const archivos = await fs.readdir(directorio);
    console.log(archivos); // array de nombres de archivos
}
```

---

## 3. El modulo path — Manejar rutas de forma segura

Las rutas de archivos son diferentes en cada sistema operativo: Windows usa `\`, mientras que Linux y Mac usan `/`. Si hardcodeas rutas con barras, tu codigo puede romperse en otro sistema.

El modulo **`path`** resuelve esto construyendo rutas de forma segura y cross-platform.

```js
const path = require("path");

// path.join une segmentos de ruta con el separador correcto segun el SO
const ruta = path.join("usuarios", "ana", "documentos", "archivo.txt");
// en Linux/Mac: "usuarios/ana/documentos/archivo.txt"
// en Windows:   "usuarios\ana\documentos\archivo.txt"

// path.resolve convierte una ruta relativa en absoluta
const rutaAbsoluta = path.resolve("datos.txt");
// algo como: "/Users/ana/proyecto/datos.txt"

// __dirname es una variable global de Node: el directorio del archivo actual
const rutaAlArchivo = path.join(__dirname, "datos", "config.json");
```

**`__dirname`** es clave: te da la ruta absoluta del directorio donde esta el archivo `.js` que se esta ejecutando. Con eso, las rutas siempre son relativas a tu proyecto y no dependen de desde donde corras el comando:

```js
const fs = require("fs/promises");
const path = require("path");

// MALO: ruta relativa, depende de donde corras "node"
const config = await fs.readFile("config.json", "utf-8");

// BUENO: siempre apunta al mismo lugar sin importar donde corras el script
const config = await fs.readFile(path.join(__dirname, "config.json"), "utf-8");
```

Otros metodos utiles de `path`:

```js
const ruta = "/proyecto/src/utils/helpers.js";

path.basename(ruta);           // "helpers.js" (nombre del archivo)
path.basename(ruta, ".js");    // "helpers" (sin extension)
path.dirname(ruta);            // "/proyecto/src/utils" (directorio)
path.extname(ruta);            // ".js" (extension)

// separar en sus partes
path.parse(ruta);
// { root: '/', dir: '/proyecto/src/utils', base: 'helpers.js', ext: '.js', name: 'helpers' }
```

---

## 4. NPM y package.json

**NPM** (Node Package Manager) es el gestor de paquetes de Node.js. Tiene dos funciones principales: instalar paquetes de terceros en tu proyecto, y manejar la configuracion y scripts del proyecto.

El corazon de cualquier proyecto Node es el archivo **`package.json`**: un archivo JSON que describe el proyecto, sus dependencias, y los comandos disponibles.

### Crear un proyecto nuevo

```bash
# crea un package.json interactivo
npm init

# crea un package.json con valores por defecto (mas rapido)
npm init -y
```

Un `package.json` tipico se ve asi:

```json
{
  "name": "mi-backend",
  "version": "1.0.0",
  "description": "API REST de ejemplo",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Dependencias vs devDependencies

- **`dependencies`**: paquetes que el proyecto necesita para *funcionar en produccion* (Express, Mongoose, etc.)
- **`devDependencies`**: paquetes que solo se necesitan durante el desarrollo (Nodemon, Jest, ESLint, etc.)

```bash
npm install express          # agrega a dependencies
npm install --save-dev nodemon  # agrega a devDependencies
npm install -D nodemon          # shorthand para --save-dev
```

### node_modules y .gitignore

Cuando instalas paquetes, npm los descarga en la carpeta `node_modules`. Esta carpeta puede pesar cientos de megabytes y tiene miles de archivos. **Nunca se sube al repositorio**.

En cambio, el `package.json` y el `package-lock.json` si se suben. El `package-lock.json` es un registro exacto de que version de cada paquete se instalo: garantiza que cualquiera que clone el proyecto instale exactamente las mismas versiones.

```bash
# para regenerar node_modules en un proyecto clonado
npm install
```

El archivo `.gitignore` le dice a Git que ignorar. En proyectos Node siempre incluye:

```
node_modules/
.env
```

### Scripts de npm

Los scripts del `package.json` son atajos para comandos que usas seguido:

```json
"scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
}
```

```bash
npm start       # corre el script "start"
npm run dev     # corre el script "dev"
npm test        # corre el script "test" (shorthand especial)
```

---

## 5. Git y GitHub

**Git** es un sistema de control de versiones: te permite guardar el historial de cambios de tu proyecto, volver atras si algo se rompe, y trabajar en equipo sin pisarte los cambios con otros.

**GitHub** es una plataforma web que aloja repositorios Git remotos. Es donde se suben los proyectos para compartirlos y colaborar.

### Flujo basico de Git

```bash
# inicializar un repo en el directorio actual
git init

# ver el estado: que archivos cambiaron, cuales estan listos para commitear
git status

# agregar archivos al "staging area" (preparados para el commit)
git add archivo.js          # un archivo especifico
git add .                   # todos los cambios del directorio actual

# guardar un snapshot con un mensaje descriptivo
git commit -m "feat: agregar endpoint de usuarios"

# ver el historial de commits
git log --oneline
```

El flujo tipico es: modificas archivos → `git add` para preparar los cambios → `git commit` para guardar el snapshot. Cada commit es un punto en la historia al que podes volver.

### Conectar con GitHub

```bash
# conectar el repo local con uno remoto en GitHub
git remote add origin https://github.com/usuario/mi-proyecto.git

# subir los commits al remoto (la primera vez)
git push -u origin main

# subir commits posteriores
git push

# bajar cambios del remoto
git pull
```

### Ramas (branches)

Las ramas permiten trabajar en una funcionalidad nueva sin tocar el codigo principal:

```bash
# crear una rama nueva y moverse a ella
git checkout -b feature/login

# hacer cambios, commits, etc.
# cuando esta lista, volver a main y mergear
git checkout main
git merge feature/login
```

### .gitignore

El archivo `.gitignore` en la raiz del proyecto le dice a Git que archivos o carpetas ignorar. Lo mas importante en proyectos Node:

```
node_modules/
.env
*.log
dist/
```

---

## 6. El modulo crypto — Hashing

El modulo **`crypto`** viene con Node y permite hacer operaciones criptograficas. Una de las mas comunes en backend es el **hashing**: transformar un dato (como una contrasena) en una cadena de longitud fija que no se puede revertir.

Por que hashear contrasenas? Porque si la base de datos es comprometida, el atacante no obtiene las contrasenas reales, solo los hashes. Y si dos usuarios tienen la misma contrasena, sus hashes son diferentes gracias a la **sal** (salt).

```js
const crypto = require("crypto");

// hash SHA-256 simple
const hash = crypto.createHash("sha256").update("mi contrasena").digest("hex");
console.log(hash);
// "f2ca1bb6c7e907d06dafe4687e579fce76b37e4e93b7605022da52e6ccc26fd2"

// con sal: agrega datos aleatorios antes de hashear para que dos contrasenas
// iguales produzcan hashes distintos
function hashearContrasena(contrasena) {
    const sal = crypto.randomBytes(16).toString("hex"); // 16 bytes aleatorios
    const hash = crypto
        .createHash("sha256")
        .update(sal + contrasena)
        .digest("hex");
    return { hash, sal };
}

function verificarContrasena(contrasena, hashGuardado, salGuardada) {
    const hashIntento = crypto
        .createHash("sha256")
        .update(salGuardada + contrasena)
        .digest("hex");
    return hashIntento === hashGuardado;
}

const { hash: h, sal } = hashearContrasena("mi clave secreta");
console.log(verificarContrasena("mi clave secreta", h, sal)); // true
console.log(verificarContrasena("clave incorrecta", h, sal)); // false
```

> Nota: para proyectos reales de produccion se usa `bcrypt` o `argon2` en lugar de SHA-256 con sal manual. Esos algoritmos estan disenados especificamente para contrasenas y son mucho mas resistentes a ataques de fuerza bruta. Lo que vemos aca es para entender el concepto.

---

## 7. Servidor HTTP minimal con Node

El modulo **`http`** permite crear un servidor web desde cero, sin Express ni ninguna dependencia externa. Es la base sobre la que frameworks como Express estan construidos.

```js
const http = require("http");

const servidor = http.createServer((req, res) => {
    // req: el pedido del cliente (Request)
    // res: la respuesta que vamos a enviar (Response)

    console.log(`${req.method} ${req.url}`);

    // setear el codigo de estado y los headers de la respuesta
    res.writeHead(200, { "Content-Type": "text/plain" });

    // enviar el cuerpo de la respuesta y cerrar la conexion
    res.end("Hola mundo desde Node!");
});

const PUERTO = 3000;
servidor.listen(PUERTO, () => {
    console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});
```

`createServer` recibe un callback que se ejecuta cada vez que llega un pedido. `req` tiene informacion sobre el pedido (metodo HTTP, URL, headers, cuerpo) y `res` tiene los metodos para enviar la respuesta.

### Rutas basicas

Para manejar diferentes URLs, inspeccionamos `req.url`:

```js
const http = require("http");

const servidor = http.createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ mensaje: "bienvenido" }));

    } else if (req.url === "/usuarios" && req.method === "GET") {
        const usuarios = [{ id: 1, nombre: "Ana" }, { id: 2, nombre: "Carlos" }];
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(usuarios));

    } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Ruta no encontrada" }));
    }
});

servidor.listen(3000, () => console.log("Servidor en puerto 3000"));
```

Esto se vuelve inmanejable rapido cuando tenes muchas rutas. Por eso existe Express, que lo veremos la semana que viene. Pero es importante ver una vez como funciona por debajo.

---

## Summary: Conceptos nuevos de la semana

| Concepto | Descripcion rapida |
|---|---|
| **Modulos nativos** | Bibliotecas incluidas en Node.js; se importan con `require` sin instalar nada |
| **`require`** | Funcion de Node para importar modulos (nativos, locales o de npm) |
| **`fs`** | Modulo para leer, escribir y manipular archivos del sistema |
| **`fs/promises`** | Version del modulo fs que devuelve promesas en lugar de usar callbacks |
| **`path`** | Modulo para construir rutas de archivos de forma cross-platform |
| **`__dirname`** | Variable global de Node: ruta absoluta al directorio del archivo actual |
| **`JSON.stringify`** | Convierte un objeto JS a string JSON |
| **`JSON.parse`** | Convierte un string JSON a objeto JS |
| **NPM** | Gestor de paquetes de Node: instala y gestiona dependencias |
| **`package.json`** | Archivo de configuracion del proyecto: dependencias, scripts, metadata |
| **`package-lock.json`** | Registro exacto de versiones instaladas; garantiza reproducibilidad |
| **`node_modules`** | Carpeta donde npm instala los paquetes; nunca se sube al repo |
| **`dependencies`** | Paquetes necesarios en produccion |
| **`devDependencies`** | Paquetes solo necesarios en desarrollo |
| **Git** | Sistema de control de versiones distribuido |
| **Commit** | Snapshot del estado del proyecto en un momento dado |
| **Branch** | Rama de desarrollo independiente del codigo principal |
| **`.gitignore`** | Archivo que le dice a Git que ignorar |
| **GitHub** | Plataforma web para alojar repositorios Git remotos |
| **Hashing** | Transformacion de datos en una cadena de longitud fija, no reversible |
| **Salt** | Dato aleatorio que se agrega al hashear para evitar hashes identicos |
| **`http.createServer`** | Crea un servidor HTTP desde cero en Node.js |
| **`req` / `res`** | Objetos de la peticion (Request) y respuesta (Response) del servidor |

---

## Ejercicios

### Ejercicio 1 — Leer y escribir archivos

1. Crea un archivo `notas.txt` manualmente con algunas lineas de texto.
2. Escribi un script `leer.js` que lea ese archivo e imprima su contenido en consola usando `fs/promises` y `async/await`.
3. Extendelo para que cuente cuantas lineas tiene el archivo (pista: `contenido.split("\n")`).
4. Escribi otro script `agregar.js` que reciba un texto por argumento (`process.argv[2]`) y lo agregue como una nueva linea al final de `notas.txt` usando `appendFile`.

---

### Ejercicio 2 — Rutas con path

Crea un script que imprima por consola:

1. La ruta absoluta del archivo que se esta ejecutando (usando `__filename`)
2. El directorio donde esta ese archivo (`__dirname`)
3. La ruta absoluta a un archivo `config.json` que estaria en una subcarpeta `config/` dentro del mismo proyecto (usando `path.join`)
4. El nombre del archivo actual sin extension (usando `path.parse` o `path.basename`)

Luego usa `path.join` para construir la ruta a un archivo y `fs/promises` para verificar si existe. Imprime `"existe"` o `"no existe"` segun corresponda.

---

### Ejercicio 3 — JSON en disco

Simula una base de datos simple en un archivo JSON:

1. Si el archivo `usuarios.json` no existe, crealo con un array vacio `[]`
2. Crea una funcion `async leerUsuarios()` que lea el archivo y devuelva el array parseado
3. Crea una funcion `async guardarUsuarios(usuarios)` que serialice y guarde el array
4. Crea una funcion `async agregarUsuario(nombre, email)` que:
   - Lea los usuarios existentes
   - Genere un `id` autoincremental (el maximo id existente + 1, o 1 si no hay ninguno)
   - Agregue el nuevo usuario al array
   - Guarde el array actualizado
5. Llama a `agregarUsuario` tres veces con datos distintos y mostra el contenido final del archivo

---

### Ejercicio 4 — Hashing de contrasenas

Crea un modulo `auth.js` que exporte tres funciones usando el modulo `crypto`:

1. `generarSal()` — devuelve 16 bytes aleatorios como string hex
2. `hashear(contrasena, sal)` — devuelve el hash SHA-256 de `sal + contrasena` en hex
3. `verificar(contrasena, hashGuardado, salGuardada)` — devuelve `true` si la contrasena coincide

Luego en un archivo separado `test-auth.js`:
- Importa las tres funciones
- "Registra" un usuario: genera sal, hashea la contrasena y guarda `{ usuario, hash, sal }` en un array
- Simula un "login" verificando una contrasena correcta (debe retornar `true`) y una incorrecta (debe retornar `false`)
- Muestra que dos usuarios con la misma contrasena tienen hashes distintos gracias a la sal

---

### Ejercicio 5 — Servidor HTTP con rutas

Crea un servidor HTTP con el modulo `http` que maneje estas rutas:

| Metodo | URL | Respuesta |
|--------|-----|-----------|
| GET | `/` | `{ mensaje: "API funcionando" }` |
| GET | `/productos` | Un array de al menos 3 productos (id, nombre, precio) |
| GET | `/productos/1` | El producto con id 1, o error 404 si no existe |
| `*` | Cualquier otra ruta | `{ error: "Ruta no encontrada" }` con status 404 |

Todos los responses deben ser JSON con el header `Content-Type: application/json`.

Pista: para extraer el id de `/productos/1`, podes usar `req.url.startsWith("/productos/")` y `req.url.split("/")[2]`.

---

### Ejercicio 6 — Servidor + archivos (integracion)

Crea un servidor HTTP que use el archivo `usuarios.json` del ejercicio 3 como "base de datos":

- `GET /usuarios` — lee el JSON del disco y devuelve todos los usuarios
- `GET /usuarios/:id` — devuelve el usuario con ese id o 404 si no existe

Como `http.createServer` es sincrono en su definicion pero las operaciones de archivo son asincronas, el handler tiene que ser una funcion `async`:

```js
const servidor = http.createServer(async (req, res) => {
    // aca podes usar await
});
```

---

### Ejercicio 7 — Package.json y scripts (reflexion)

1. Inicia un proyecto Node con `npm init -y`
2. Crea un `index.js` con un `console.log("servidor iniciado")`
3. Agrega un script `"start"` en el `package.json` que corra `node index.js`
4. Corre el script con `npm start` y verifica que funciona
5. Instala `nodemon` como devDependency (`npm install -D nodemon`)
6. Agrega un script `"dev"` que use `nodemon index.js`
7. Crea un `.gitignore` que excluya `node_modules/` y cualquier archivo `.env`
8. Responde en un comentario en el codigo: por que `package-lock.json` SI se sube al repo pero `node_modules` NO?
