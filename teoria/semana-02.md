# Semana 2: Programacion Backend Avanzada

Esta semana damos un salto importante. Seguimos con JavaScript pero entramos en la parte que mas define al backend moderno: como manejar operaciones que toman tiempo (leer archivos, consultar bases de datos, hacer pedidos a otras APIs) sin que el servidor se congele esperando.

Tambien vemos mejoras del lenguaje que van de ES7 a ES11: sintaxis que hace el codigo mas limpio, mas expresivo y mas seguro.

---

## 1. ES7 y ES8 — Sintaxis Moderna

JavaScript evoluciona constantemente. Cada año sale una nueva version del estandar (ES2017 = ES8, ES2018 = ES9, etc.) con nuevas funcionalidades. No necesitas memorizar que funcion salio en que año, pero si conocerlas porque las vas a ver en todo codigo moderno.

### ES7 — includes y el operador de exponenciacion

**`Array.prototype.includes`** reemplaza al viejo patron de usar `indexOf !== -1` para verificar si un elemento existe en un array:

```js
const roles = ["admin", "editor", "viewer"];

// forma vieja
if (roles.indexOf("admin") !== -1) { ... }

// con includes
if (roles.includes("admin")) {
    console.log("es admin");
}

console.log(roles.includes("superadmin")); // false
```

`includes` tambien funciona con `NaN`, cosa que `indexOf` no puede hacer:

```js
const datos = [1, NaN, 3];
console.log(datos.indexOf(NaN));   // -1 (no lo encuentra)
console.log(datos.includes(NaN));  // true
```

El **operador de exponenciacion** `**` es azucar sintactica sobre `Math.pow`:

```js
console.log(2 ** 10); // 1024
console.log(Math.pow(2, 10)); // lo mismo, pero mas verboso
```

### ES8 — Object.entries, Object.values y padding de strings

Cuando tenes un objeto y necesitas iterar sus propiedades, `Object.entries` y `Object.values` son tus amigos:

```js
const precios = {
    manzana: 200,
    naranja: 150,
    pera: 300
};

// Object.values: solo los valores
console.log(Object.values(precios)); // [200, 150, 300]

// Object.entries: array de [clave, valor]
for (const [fruta, precio] of Object.entries(precios)) {
    console.log(`${fruta}: $${precio}`);
}
// manzana: $200
// naranja: $150
// pera: $300
```

`padStart` y `padEnd` sirven para rellenar strings hasta una longitud determinada. Util para formatear numeros o IDs:

```js
console.log("5".padStart(3, "0"));  // "005"
console.log("42".padStart(5, "0")); // "00042"
console.log("hola".padEnd(10, ".")); // "hola......"
```

---

## 2. ES9 — Rest/Spread y finally

### Operadores rest y spread

El operador `...` tiene dos usos opuestos segun el contexto: **spread** (expandir) y **rest** (agrupar).

**Spread** expande un array u objeto en sus elementos individuales:

```js
const a = [1, 2, 3];
const b = [4, 5, 6];

const combinado = [...a, ...b]; // [1, 2, 3, 4, 5, 6]
const copia = [...a];           // copia superficial del array

// tambien funciona con objetos
const base = { nombre: "Ana", edad: 25 };
const actualizado = { ...base, edad: 26, ciudad: "Rosario" };
// { nombre: "Ana", edad: 26, ciudad: "Rosario" }
```

Fijate que en el objeto `actualizado`, como `edad` aparece dos veces, el ultimo valor gana. Esta es la forma mas comun de actualizar un objeto sin mutarlo:

```js
const usuario = { id: 1, nombre: "Carlos", activo: true };
const usuarioDesactivado = { ...usuario, activo: false };
// el original no cambia
```

**Rest** hace lo contrario: agrupa el "resto" de los elementos en un array o en un objeto:

```js
// en funciones: captura todos los argumentos sobrantes
function sumar(primero, segundo, ...resto) {
    console.log(primero); // 1
    console.log(segundo); // 2
    console.log(resto);   // [3, 4, 5]
}
sumar(1, 2, 3, 4, 5);

// en destructuring: captura las propiedades sobrantes
const { nombre, ...datosExtra } = { nombre: "Ana", edad: 25, ciudad: "Rosario" };
console.log(nombre);      // "Ana"
console.log(datosExtra);  // { edad: 25, ciudad: "Rosario" }
```

### finally en promesas

`finally` es un bloque que se ejecuta *siempre* despues de una promesa, sin importar si se resolvio o rechazo. Es util para operaciones de limpieza: cerrar una conexion, ocultar un spinner de carga, liberar un recurso.

```js
fetch("https://api.ejemplo.com/datos")
    .then(respuesta => respuesta.json())
    .then(datos => console.log(datos))
    .catch(error => console.error("Error:", error))
    .finally(() => {
        console.log("La operacion termino, exito o error");
        // aca va el codigo de limpieza
    });
```

Lo veremos mas en detalle cuando hablemos de promesas.

---

## 3. Sincronismo vs. Asincronismo

Este es el concepto mas importante de esta semana. Entenderlo bien es lo que separa a alguien que "escribe JavaScript" de alguien que entiende como funciona realmente.

### El problema del sincronismo

JavaScript es **single-threaded**: tiene un solo hilo de ejecucion. Eso significa que solo puede hacer una cosa a la vez. Las instrucciones se ejecutan una tras otra, en orden.

En el browser o en el servidor, muchas operaciones toman tiempo: leer un archivo del disco, consultar una base de datos, hacer una peticion HTTP a otra API. Si el lenguaje esperara que cada una terminara antes de continuar (comportamiento **sincronico**), el servidor quedaria bloqueado durante cada operacion.

Imagina un cajero de banco que atiende a una sola persona a la vez y no llama al siguiente hasta que termina de resolver *todos* los tramites del actual. Si un tramite lleva 10 minutos, todos los demas esperan. Eso es sincronismo bloqueante.

```js
// ejemplo SINCRONO (pseudocodigo con operacion lenta)
const datos = leerArchivoDelDisco("enorme.csv"); // bloquea todo hasta terminar
console.log("esto no se ejecuta hasta que el archivo este leido");
procesarDatos(datos);
```

### La solucion: asincronismo

El modelo **asincrono** permite lanzar una operacion lenta y continuar ejecutando el resto del codigo mientras se espera el resultado. Cuando la operacion termina, se ejecuta una funcion de respuesta (callback) con el resultado.

El mismo cajero, pero ahora le dice al cliente: "Tu tramite va a tardar 10 minutos, pasame tus datos y te aviso cuando este listo". Mientras tanto, puede atender al siguiente.

JavaScript logra esto con el **event loop**: un mecanismo que monitorea una cola de tareas pendientes y las ejecuta cuando el hilo principal esta libre. No necesitas implementarlo vos; es parte del motor de JS. Pero si entender que cuando una operacion asincronica termina, su respuesta se pone en la cola y se procesa cuando le toca.

```
Hilo principal:  [tarea1] [tarea2] [tarea3] ---------> libre
Event loop:                   [respuesta de operacion async] --> se ejecuta aca
```

### setTimeout y setInterval

La forma mas simple de ver el event loop en accion es con `setTimeout`. Le decis: "ejecuta esta funcion despues de N milisegundos". El hilo principal no se bloquea; sigue corriendo y cuando pasa el tiempo, el callback se pone en la cola del event loop.

```js
console.log("uno");

setTimeout(() => {
    console.log("tres (llega despues)");
}, 1000); // 1000ms = 1 segundo

console.log("dos");

// imprime: "uno", "dos", y un segundo despues "tres (llega despues)"
```

Fijate el orden: `"dos"` se imprime antes que `"tres"` aunque el setTimeout este escrito antes en el codigo. Eso es el modelo asincrono en accion.

`setInterval` funciona igual pero se repite cada N milisegundos hasta que lo cancelas con `clearInterval`:

```js
let contador = 0;
const intervalo = setInterval(() => {
    contador++;
    console.log(`tick ${contador}`);
    if (contador === 3) clearInterval(intervalo);
}, 500);
// imprime "tick 1", "tick 2", "tick 3" con medio segundo de pausa entre cada uno
```

`setTimeout` con 0ms de delay no ejecuta el callback inmediatamente: lo pone en la cola del event loop para que se ejecute despues de que el codigo sincrono actual termine. Este comportamiento tiene usos avanzados, pero por ahora lo importante es entender que *ningun* callback de `setTimeout` interrumpe el codigo que ya esta corriendo.

---

## 4. Callbacks, Promesas y Async/Await

Son tres formas de manejar codigo asincrono en JavaScript, cada una mejorando la anterior.

### Callbacks

Un **callback** es simplemente una funcion que le pasas a otra funcion para que la llame cuando termine. Es el mecanismo asincrono mas basico.

```js
const fs = require("fs");

// fs.readFile es asincrona: no bloquea, llama al callback cuando termina
fs.readFile("datos.txt", "utf-8", function(error, contenido) {
    if (error) {
        console.error("Error al leer:", error);
        return;
    }
    console.log("Contenido:", contenido);
});

console.log("Esto se ejecuta ANTES de que el archivo se lea");
```

El problema con los callbacks aparece cuando necesitas encadenar varias operaciones asincronicas: leer un archivo, parsear su contenido, consultarlo en la base de datos, y guardar el resultado. Terminas con callbacks anidados dentro de callbacks, lo que se llama **callback hell**:

```js
leerArchivo("config.txt", function(error, config) {
    if (error) return manejarError(error);
    parsearConfig(config, function(error, datos) {
        if (error) return manejarError(error);
        consultarDB(datos, function(error, resultado) {
            if (error) return manejarError(error);
            guardarResultado(resultado, function(error) {
                if (error) return manejarError(error);
                console.log("todo salio bien");
                // ... y podria seguir
            });
        });
    });
});
```

Esto es dificil de leer, de testear y de mantener. Por eso surgieron las promesas.

### Promesas

Una **promesa** (Promise) es un objeto que representa el resultado eventual de una operacion asincronica. Puede estar en uno de tres estados:

- **pending** — la operacion todavia no termino
- **fulfilled** — la operacion termino con exito (tiene un valor)
- **rejected** — la operacion fallo (tiene un error)

```js
// crear una promesa
const miPromesa = new Promise((resolve, reject) => {
    const exito = true; // simulamos el resultado

    if (exito) {
        resolve("operacion exitosa");   // pasa a fulfilled
    } else {
        reject(new Error("algo fallo")); // pasa a rejected
    }
});

// consumir la promesa
miPromesa
    .then(resultado => console.log(resultado))  // si fulfills
    .catch(error => console.error(error))        // si rejects
    .finally(() => console.log("termino"));      // siempre
```

Lo que hace que las promesas sean mejores que los callbacks es que son **encadenables**. El valor que devuelve un `.then` se convierte en el input del siguiente:

```js
fetch("https://api.ejemplo.com/usuario/1")
    .then(respuesta => respuesta.json())    // convierte a JSON
    .then(usuario => {
        console.log(usuario.nombre);
        return fetch(`/api/pedidos?userId=${usuario.id}`); // otra promesa
    })
    .then(respuesta => respuesta.json())
    .then(pedidos => console.log(pedidos))
    .catch(error => console.error("Error en algún paso:", error));
```

Con promesas, el manejo de errores tambien mejora: un solo `.catch` captura el error de cualquier paso de la cadena.

### Async/Await

`async/await` es la forma mas moderna de trabajar con promesas. No reemplaza a las promesas (por debajo sigue usando promesas), sino que cambia la sintaxis para que el codigo asincrono se parezca al sincrono y sea mas facil de leer.

Regla: `await` solo puede usarse dentro de una funcion marcada con `async`. `await` "pausa" la funcion hasta que la promesa se resuelva (sin bloquear el hilo principal).

```js
// con promesas encadenadas
function obtenerDatos() {
    return fetch("/api/usuario")
        .then(r => r.json())
        .then(usuario => {
            return fetch(`/api/pedidos?userId=${usuario.id}`);
        })
        .then(r => r.json());
}

// con async/await: se lee como codigo sincrono
async function obtenerDatos() {
    const respuesta = await fetch("/api/usuario");
    const usuario = await respuesta.json();

    const respuestaPedidos = await fetch(`/api/pedidos?userId=${usuario.id}`);
    const pedidos = await respuestaPedidos.json();

    return pedidos;
}
```

El manejo de errores con async/await usa `try/catch`, que es familiar para cualquiera que haya visto manejo de excepciones:

```js
async function obtenerUsuario(id) {
    try {
        const respuesta = await fetch(`/api/usuarios/${id}`);

        if (!respuesta.ok) {
            throw new Error(`HTTP error: ${respuesta.status}`);
        }

        const usuario = await respuesta.json();
        return usuario;

    } catch (error) {
        console.error("No se pudo obtener el usuario:", error.message);
        throw error; // re-lanzamos para que el llamador lo maneje
    } finally {
        console.log("Intento de obtencion terminado");
    }
}

// llamar a una funcion async devuelve una promesa
obtenerUsuario(1)
    .then(usuario => console.log(usuario))
    .catch(error => console.error(error));
```

Una cosa importante: cuando tengas varias operaciones asincronicas que son *independientes entre si*, no las hagas una a la vez con `await`. Usá `Promise.all` para lanzarlas en paralelo:

```js
// MAL: espera una, despues la otra (doble tiempo)
const usuario = await obtenerUsuario(1);
const productos = await obtenerProductos();

// BIEN: las lanza al mismo tiempo, espera que ambas terminen
const [usuario, productos] = await Promise.all([
    obtenerUsuario(1),
    obtenerProductos()
]);
```

---

## 5. ES10 — Dinamicidad y Optimizacion

### flat y flatMap

`flat` aplana arrays anidados hasta el nivel que le indiques:

```js
const anidado = [1, [2, 3], [4, [5, 6]]];
console.log(anidado.flat());    // [1, 2, 3, 4, [5, 6]]  (un nivel)
console.log(anidado.flat(2));   // [1, 2, 3, 4, 5, 6]    (dos niveles)
console.log(anidado.flat(Infinity)); // aplana todo sin importar la profundidad
```

`flatMap` es como hacer `map` y despues `flat(1)` en un solo paso. Util cuando tu funcion de transformacion devuelve arrays:

```js
const oraciones = ["hola mundo", "como estas"];
const palabras = oraciones.flatMap(o => o.split(" "));
console.log(palabras); // ["hola", "mundo", "como", "estas"]
```

### Object.fromEntries

Es la operacion inversa de `Object.entries`: convierte un array de pares `[clave, valor]` en un objeto. Muy util para transformar objetos:

```js
const precios = { manzana: 200, naranja: 150, pera: 300 };

// duplicar todos los precios
const preciosDobles = Object.fromEntries(
    Object.entries(precios).map(([fruta, precio]) => [fruta, precio * 2])
);
// { manzana: 400, naranja: 300, pera: 600 }
```

### trimStart y trimEnd

Complementan al `trim()` existente pero solo de un lado:

```js
const texto = "   hola mundo   ";
console.log(texto.trimStart()); // "hola mundo   "
console.log(texto.trimEnd());   // "   hola mundo"
console.log(texto.trim());      // "hola mundo"
```

---

## 6. Gestion de Eventos en JavaScript

En el backend con Node.js, los eventos son fundamentales. Node usa un patron llamado **EventEmitter** para notificar que algo sucedio sin bloquear el flujo de ejecucion.

Pensa en un sistema de notificaciones: cuando un usuario hace una compra, queres enviar un email, actualizar el inventario, y registrar la transaccion. En vez de llamar esas tres funciones directamente desde el codigo de compra, podrias emitir un evento `"compra_realizada"` y que cada modulo interesado escuche ese evento por separado.

```js
const EventEmitter = require("events");

const emisor = new EventEmitter();

// registrar un listener (escuchador)
emisor.on("mensaje", (texto) => {
    console.log(`Mensaje recibido: ${texto}`);
});

// registrar un listener que solo se ejecuta una vez
emisor.once("conexion", () => {
    console.log("Primera conexion establecida");
});

// emitir eventos
emisor.emit("mensaje", "Hola desde el emisor");
emisor.emit("mensaje", "Segundo mensaje");
emisor.emit("conexion"); // se ejecuta
emisor.emit("conexion"); // no hace nada: once ya fue
```

Podes tener multiples listeners para el mismo evento:

```js
const emisor = new EventEmitter();

emisor.on("compra", (datos) => {
    console.log(`[Email] Enviando confirmacion a ${datos.cliente}`);
});

emisor.on("compra", (datos) => {
    console.log(`[Stock] Actualizando inventario del producto ${datos.productoId}`);
});

emisor.on("compra", (datos) => {
    console.log(`[Log] Registrando transaccion: $${datos.total}`);
});

emisor.emit("compra", {
    cliente: "ana@ejemplo.com",
    productoId: 42,
    total: 15000
});
```

Cuando express recibe una peticion HTTP, internamente esta emitiendo eventos. Los middlewares y handlers que registras son listeners. El patron es el mismo.

---

## 7. ES11 — Nullish y Variables Privadas

### Optional chaining (?.)

Cuando accedes a propiedades anidadas de un objeto, si alguna de las propiedades intermedias es `null` o `undefined`, JavaScript lanza un error. `?.` hace que la cadena "cortocircuite" y devuelva `undefined` en vez de crashear:

```js
const usuario = {
    nombre: "Ana",
    direccion: {
        ciudad: "Rosario"
    }
};

// sin optional chaining: crash si direccion es null/undefined
console.log(usuario.direccion.ciudad);         // "Rosario"
console.log(usuario.direccion.codigoPostal);   // undefined (no crashea, la prop simplemente no existe)
console.log(usuario.telefono.numero);          // ERROR: Cannot read properties of undefined

// con optional chaining
console.log(usuario.telefono?.numero);         // undefined (no crashea)
console.log(usuario?.direccion?.ciudad);       // "Rosario"
console.log(usuario?.suscripcion?.plan?.precio); // undefined
```

Tambien funciona con llamadas a funciones y acceso por indice:

```js
const lista = null;
console.log(lista?.[0]);          // undefined
console.log(lista?.filter(x => x > 0)); // undefined
```

### Nullish coalescing (??)

El operador `??` devuelve el lado derecho *solo si* el lado izquierdo es `null` o `undefined`. Es diferente al `||` que tambien considera `0`, `""` y `false` como falsy:

```js
const config = {
    timeout: 0,
    nombre: ""
};

// con || : problema, 0 y "" son falsy
console.log(config.timeout || 5000);  // 5000 (INCORRECTO: 0 es un valor valido)
console.log(config.nombre || "anon"); // "anon" (INCORRECTO: "" puede ser intencional)

// con ?? : solo null/undefined activan el fallback
console.log(config.timeout ?? 5000);  // 0 (correcto)
console.log(config.nombre ?? "anon"); // "" (correcto)
console.log(config.limite ?? 100);    // 100 (limite no existe, es undefined)
```

La regla es: usa `??` cuando quieras un valor por defecto pero `0`, `""` o `false` son valores validos.

### Variables privadas en clases (#)

Antes de ES11, "privado" en clases de JavaScript era una convencion (usar `_nombreVariable`) pero cualquiera podia acceder igual. Con `#`, la privacidad es real a nivel de lenguaje:

```js
class CuentaBancaria {
    #saldo = 0;            // campo privado
    #historial = [];       // campo privado

    constructor(saldoInicial) {
        this.#saldo = saldoInicial;
    }

    depositar(monto) {
        if (monto <= 0) throw new Error("El monto debe ser positivo");
        this.#saldo += monto;
        this.#historial.push({ tipo: "deposito", monto });
    }

    retirar(monto) {
        if (monto > this.#saldo) throw new Error("Saldo insuficiente");
        this.#saldo -= monto;
        this.#historial.push({ tipo: "retiro", monto });
    }

    get saldo() {
        return this.#saldo; // acceso controlado via getter
    }

    get historial() {
        return [...this.#historial]; // devuelve copia, no la referencia original
    }
}

const cuenta = new CuentaBancaria(1000);
cuenta.depositar(500);
console.log(cuenta.saldo);     // 1500
console.log(cuenta.#saldo);    // ERROR: campo privado, no accesible desde afuera
```

Los **getters** (`get nombre()`) son metodos que se llaman como si fueran propiedades, sin parentesis. Son utiles para exponer datos privados de forma controlada.

---

## Summary: Conceptos nuevos de la semana

| Concepto | Descripcion rapida |
|---|---|
| **`includes`** | Verifica si un valor existe en un array, funciona con NaN |
| **spread `...`** | Expande un array u objeto en sus elementos individuales |
| **rest `...`** | Agrupa elementos sobrantes en un array (en params o destructuring) |
| **`finally`** | Bloque que se ejecuta siempre al final de una promesa |
| **Single-threaded** | JS tiene un hilo de ejecucion; solo hace una cosa a la vez |
| **Asincronia** | Mecanismo para lanzar operaciones lentas sin bloquear el hilo |
| **Event loop** | Motor que gestiona la cola de callbacks/promesas pendientes |
| **`setTimeout` / `setInterval`** | Ejecutan un callback despues de un delay o en intervalos; no bloquean el hilo |
| **Callback** | Funcion que se pasa como argumento para llamarla cuando algo termina |
| **Callback hell** | Anidamiento excesivo de callbacks; problema de legibilidad y mantenimiento |
| **Promise** | Objeto que representa el resultado eventual de una operacion async |
| **`async/await`** | Sintaxis sobre promesas que hace el codigo async parecer sincrono |
| **`Promise.all`** | Lanza multiples promesas en paralelo y espera que todas terminen |
| **`flat` / `flatMap`** | Aplanan arrays anidados; flatMap combina map + flat(1) |
| **`Object.fromEntries`** | Convierte array de [clave, valor] en objeto (inverso de entries) |
| **EventEmitter** | Patron de Node.js para emitir y escuchar eventos desacoplados |
| **Optional chaining `?.`** | Acceso seguro a propiedades anidadas; devuelve undefined si algo es null |
| **Nullish coalescing `??`** | Valor por defecto que solo activa si el lado izquierdo es null/undefined |
| **Campos privados `#`** | Propiedades realmente inaccesibles desde fuera de la clase |
| **Getter** | Metodo que se invoca como propiedad (sin parentesis) |

---

## Ejercicios

### Ejercicio 1 — Spread y rest

1. Tenes dos arrays de IDs de usuarios: `const online = [1, 3, 5]` y `const offline = [2, 4, 6]`. Crealos y luego creá un tercer array `todos` que los combine usando spread.
2. Escribi una funcion `promediar(...numeros)` que use rest para recibir cualquier cantidad de numeros y devuelva su promedio. Probala con 3, 4 y 6 argumentos.
3. Tenes el objeto `const config = { host: "localhost", port: 3000, debug: true }`. Crea un objeto nuevo `produccion` que sea igual pero con `debug: false` y un campo nuevo `ssl: true`, sin mutar el original.

---

### Ejercicio 2 — Promesas basicas

Crea una funcion `esperar(ms)` que devuelva una promesa que se resuelve despues de `ms` milisegundos (usa `setTimeout` adentro). Luego:

1. Llamala con `.then` y mostra "Listo despues de 1 segundo" al resolverse
2. Crea una funcion `obtenerDato(valor, ms, debefallar)` que espere `ms` ms y luego resuelva con `valor` o rechace con un error segun `debeFallar`. Probala con exito y con falla, manejando ambos casos con `.catch`

```js
// Pista para setTimeout con promesas:
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

---

### Ejercicio 3 — Async/Await con manejo de errores

Dado el siguiente array de usuarios:

```js
const usuarios = [
    { id: 1, nombre: "Ana", activo: true },
    { id: 2, nombre: "Carlos", activo: false },
    { id: 3, nombre: "Maria", activo: true }
];
```

Crea una funcion asincronica `buscarUsuario(id)` que:
- Simule un retardo de 500ms con la funcion `esperar` del ejercicio anterior
- Si encuentra el usuario y esta activo, resuelve con el objeto
- Si el usuario no existe, rechaza con `new Error("Usuario no encontrado")`
- Si el usuario existe pero no esta activo, rechaza con `new Error("Usuario inactivo")`

Llama a la funcion con diferentes IDs usando async/await y maneja los errores con try/catch.

---

### Ejercicio 4 — Promise.all vs secuencial

Simula la busqueda de datos de tres fuentes independientes. Cada una tarda un tiempo diferente:

```js
const obtenerPerfil = () => esperar(300).then(() => ({ nombre: "Ana" }));
const obtenerPedidos = () => esperar(500).then(() => [{ id: 1 }, { id: 2 }]);
const obtenerPreferencias = () => esperar(200).then(() => ({ tema: "oscuro" }));
```

1. Implementa `cargarDashboard` de forma **secuencial** (un await tras otro) y mide cuanto tarda con `Date.now()` antes y despues
2. Implementa `cargarDashboard` usando `Promise.all` y mide el tiempo
3. Compara los tiempos y explica la diferencia en un comentario

---

### Ejercicio 5 — Optional chaining y Nullish coalescing

Tenes este objeto que representa la respuesta de una API externa (algunos campos pueden faltar):

```js
const respuesta = {
    usuario: {
        nombre: "Carlos",
        suscripcion: null
    },
    configuracion: {
        tema: "claro",
        notificaciones: {
            email: false,
            sms: undefined
        }
    }
};
```

Sin usar if/else, usa `?.` y `??` para obtener de forma segura:

1. El nombre del usuario (deberia ser "Carlos")
2. El tipo de plan de suscripcion del usuario (deberia ser `"gratuito"` si no tiene suscripcion)
3. Si el usuario tiene notificaciones por sms activas (deberia ser `false` si es undefined — ojo con `||` vs `??`)
4. La cantidad de miembros del equipo del usuario (deberia ser `0` si no existe esa propiedad)
5. El nombre del administrador del equipo (deberia ser `"sin admin"` si no existe)

---

### Ejercicio 6 — EventEmitter

Crea un sistema de notificaciones simple con EventEmitter:

1. Crea un emisor de eventos
2. Registra listeners para estos eventos: `"nuevo_usuario"`, `"nueva_compra"`, `"error_pago"`
3. Cada listener debe mostrar un mensaje descriptivo por consola con los datos que recibe
4. Emite los tres tipos de eventos con datos de prueba
5. Agrega un segundo listener para `"nueva_compra"` que actualice un array `historialCompras` (definido afuera)
6. Usa `once` para registrar un listener que solo se ejecute la primera vez que se emite `"servidor_iniciado"`

---

### Ejercicio 7 — Clase con campos privados (ES11 + herencia)

Retomando la clase `Producto` de la semana pasada, reescribila usando campos privados:

```js
class Producto {
    #nombre;
    #precio;
    #stock;
    // ...
}
```

Agrega:
- Getters para `nombre`, `precio` y `stock`
- Un setter para `precio` que lance un error si el precio es negativo
- Un setter para `stock` que lance un error si el stock es negativo
- Un metodo `vender(cantidad)` que reduzca el stock y use el setter para validar

Luego crea una clase `ProductoConDescuento` que extienda `Producto` y tenga:
- Un campo privado `#descuento` (porcentaje del 0 al 100)
- Un getter `precioFinal` que calcule el precio con el descuento aplicado
- Un setter para `descuento` que valide que este entre 0 y 100

---

### Ejercicio 8 — Integracion: async + objetos + clases

Crea una clase `TiendaAsync` que simule operaciones asincronicas de una tienda:

```js
class TiendaAsync {
    #productos = [];

    async cargarProductos() { ... }  // simula fetch con setTimeout
    async buscarPorNombre(nombre) { ... }
    async agregarProducto(producto) { ... }
    async actualizarPrecio(id, nuevoPrecio) { ... }
}
```

Cada metodo debe:
- Esperar 200-400ms (simular latencia de red o base de datos)
- Usar async/await internamente
- Manejar errores apropiadamente (lanzar error si no se encuentra el producto, etc.)

Luego, en una funcion `main` async, ejecuta una secuencia de operaciones: cargar productos, buscar uno, actualizar su precio, y mostrar el resultado final. Usa `Promise.all` donde pueda ejecutarse en paralelo.
