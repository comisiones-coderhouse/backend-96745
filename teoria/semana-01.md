# Semana 1: Principios Basicos de JavaScript y Backend

En esta primera semana arrancamos desde cero. La idea es entender que es el backend, por que usamos JavaScript para construirlo, y dominar los bloques fundamentales del lenguaje antes de empezar a construir servidores y APIs.

No asumimos ningun conocimiento previo de backend. Si ya programaste un poco en JS, bien, vas a ir rapido. Si es tu primera vez, tambien esta bien: vamos a ir paso a paso.

---

## 1. Introduccion al Backend y JavaScript

Cuando abris una app o un sitio web, hay dos mundos funcionando al mismo tiempo: el **frontend** y el **backend**.

El **frontend** es todo lo que ves: los botones, el texto, los colores, la pantalla. Corre en tu navegador o en tu telefono.

El **backend** es todo lo que *no ves*: el servidor que guarda tus datos, la logica que decide que informacion mostrarte, la base de datos que recuerda tu contrasena o tus compras. Cuando metes tu usuario y contrasena en una app, alguien del otro lado tiene que verificar si es correcta. Ese "alguien" es el backend.

Una analogia util: pensa en un restaurante. El frontend es el salon: el mozo, las mesas, el menu que ves. El backend es la cocina: ahi se decide que se cocina, como, con que ingredientes, y se prepara lo que el cliente pidio. El cliente nunca entra a la cocina, pero sin ella no hay comida.

### Por que JavaScript para el backend?

JavaScript nacio como lenguaje del navegador, pero en 2009 aparecio **Node.js**, que permite correr JavaScript *fuera* del navegador, directamente en el servidor. Esto fue un cambio importante porque:

- Podes usar el mismo lenguaje en frontend y backend
- Tiene un ecosistema enorme (millones de paquetes en npm)
- Es muy bueno para manejar muchas conexiones al mismo tiempo (lo vemos mas adelante cuando veamos asincronia)

Cuando corremos JS en el navegador, el motor que lo interpreta es el del browser (como V8 en Chrome). Cuando corremos JS con Node.js, usamos ese mismo motor V8 pero en el servidor. La sintaxis es exactamente la misma; lo que cambia es el entorno y las herramientas disponibles.

---

## 2. Variables y Estructuras en JavaScript

Una **variable** es un espacio con nombre donde guardamos un valor para poder usarlo despues. En JavaScript hay tres formas de declararlas: `var`, `let` y `const`. Las diferencias importan.

### var, let y const

```js
var nombre = "Ana";     // la forma vieja, con comportamiento raro de scope
let edad = 25;          // valor que puede cambiar
const pais = "Argentina"; // valor que NO puede reasignarse
```

La regla practica es esta: **usa `const` siempre que puedas, y `let` cuando necesites cambiar el valor**. Olvida `var` por ahora: tiene un comportamiento de scope que confunde a todos y no tiene ventajas sobre `let` en codigo moderno.

Por que importa la diferencia?

```js
const limite = 100;
limite = 200; // ERROR: no podemos reasignar una constante
```

```js
let contador = 0;
contador = 1;  // esto esta bien
contador++;    // esto tambien
```

Fijate que `const` no significa que el valor es "inmutable para siempre". Significa que *no podemos reasignar la variable a otro valor*. Si la variable apunta a un objeto o un array, ese objeto si puede cambiar:

```js
const usuario = { nombre: "Ana" };
usuario.nombre = "Carlos"; // esto funciona: estamos modificando el objeto, no reasignando la variable
usuario = { nombre: "Pedro" }; // ERROR: esto reasigna la variable, no esta permitido
```

### Arrays

Un **array** es una lista ordenada de valores. Cada elemento tiene un indice numerico que empieza en 0.

```js
const frutas = ["manzana", "naranja", "pera"];

console.log(frutas[0]); // "manzana"
console.log(frutas[2]); // "pera"
console.log(frutas.length); // 3

frutas.push("uva");         // agrega al final
frutas.pop();               // saca el ultimo
frutas.unshift("limon");    // agrega al principio
frutas.shift();             // saca el primero
```

En la practica del backend vas a usar arrays todo el tiempo: listas de usuarios, productos, pedidos, mensajes. Saber manipularlos con soltura es clave.

Ademas de los metodos basicos, hay tres metodos de array que vas a usar constantemente porque reciben una funcion como argumento (un **callback**) y operan sobre cada elemento:

**`filter`** — devuelve un nuevo array solo con los elementos que cumplen una condicion:

```js
const numeros = [3, 7, 2, 15, 8, 4];

const mayoresDeSeis = numeros.filter(n => n > 6);
console.log(mayoresDeSeis); // [7, 15, 8]
// el array original no se modifica
```

**`map`** — devuelve un nuevo array aplicando una transformacion a cada elemento:

```js
const precios = [100, 200, 300];

const preciosConIva = precios.map(p => p * 1.21);
console.log(preciosConIva); // [121, 242, 363]
```

**`reduce`** — acumula todos los elementos en un unico valor. Recibe una funcion y un valor inicial del acumulador:

```js
const ventas = [1500, 2300, 800, 4200];

const totalVentas = ventas.reduce((acumulador, venta) => acumulador + venta, 0);
console.log(totalVentas); // 8800
```

Estos tres metodos se pueden encadenar:

```js
// sumar solo los precios mayores a 150, ya con IVA
const resultado = precios
    .filter(p => p > 150)
    .map(p => p * 1.21)
    .reduce((acc, p) => acc + p, 0);

console.log(resultado); // (200 + 300) * 1.21 = 605
```

### Objetos

Un **objeto** es una coleccion de pares clave-valor. Representa una entidad con propiedades.

```js
const producto = {
    nombre: "Teclado mecanico",
    precio: 45000,
    stock: 12,
    activo: true
};

console.log(producto.nombre);       // "Teclado mecanico"
console.log(producto["precio"]);    // 45000 (forma alternativa con corchetes)

producto.precio = 48000;            // modificar una propiedad
producto.categoria = "Perifericos"; // agregar una propiedad nueva
delete producto.activo;             // eliminar una propiedad
```

Los objetos pueden tener arrays adentro, y los arrays pueden tener objetos adentro. Esto es lo que en JSON (el formato de datos mas comun en backend) se llama estructuras anidadas:

```js
const pedido = {
    id: 1,
    cliente: "Ana",
    items: [
        { producto: "Teclado", cantidad: 1 },
        { producto: "Mouse", cantidad: 2 }
    ],
    total: 60000
};

console.log(pedido.items[0].producto); // "Teclado"
```

Esta estructura — un objeto con un array de objetos adentro — la vas a ver en *todas* las APIs que construyas o consumas.

---

## 3. Template Strings y Clases

### Template Strings

Antes de los template strings, para armar un texto con variables habia que concatenar con `+`, lo cual se volvia feo rapido:

```js
const nombre = "Carlos";
const edad = 30;

// forma vieja
console.log("Hola, me llamo " + nombre + " y tengo " + edad + " años.");

// con template strings
console.log(`Hola, me llamo ${nombre} y tengo ${edad} años.`);
```

Los **template strings** (o template literals) usan comillas invertidas `` ` `` y permiten insertar expresiones dentro del texto con `${}`. Dentro de las llaves podes poner cualquier expresion JavaScript valida:

```js
const a = 10;
const b = 5;
console.log(`La suma de ${a} y ${b} es ${a + b}`);
// "La suma de 10 y 5 es 15"

const activo = true;
console.log(`El usuario esta ${activo ? "activo" : "inactivo"}`);
// "El usuario esta activo"
```

Ademas, los template strings respetan los saltos de linea, lo que los hace utiles para generar HTML o texto con formato:

```js
const html = `
    <div>
        <h1>Bienvenido, ${nombre}</h1>
        <p>Edad: ${edad}</p>
    </div>
`;
```

### Clases

Las **clases** en JavaScript son una forma de definir un "molde" para crear objetos que tienen la misma estructura y comportamiento. Son parte de ES6 y hacen que el codigo orientado a objetos sea mas legible.

Pensa en esto: si tenes una aplicacion de e-commerce, vas a tener muchos productos. Todos los productos tienen nombre, precio y stock. En vez de crear cada objeto a mano, defines una clase `Producto` y creas instancias de ella.

```js
class Producto {
    // el constructor se ejecuta cuando creamos una instancia con "new"
    constructor(nombre, precio, stock) {
        this.nombre = nombre;
        this.precio = precio;
        this.stock = stock;
    }

    // metodo de la clase
    tieneStock() {
        return this.stock > 0;
    }

    // otro metodo
    aplicarDescuento(porcentaje) {
        this.precio = this.precio * (1 - porcentaje / 100);
    }

    // metodo que devuelve un string descriptivo
    descripcion() {
        return `${this.nombre} - $${this.precio} (stock: ${this.stock})`;
    }
}

// crear instancias
const teclado = new Producto("Teclado mecanico", 45000, 12);
const mouse = new Producto("Mouse gamer", 15000, 0);

console.log(teclado.tieneStock());   // true
console.log(mouse.tieneStock());     // false
console.log(teclado.descripcion());  // "Teclado mecanico - $45000 (stock: 12)"

teclado.aplicarDescuento(10);
console.log(teclado.precio);         // 40500
```

### Herencia

Una clase puede **extender** otra para heredar su comportamiento y agregar o sobreescribir lo que necesite:

```js
class ProductoDigital extends Producto {
    constructor(nombre, precio, urlDescarga) {
        super(nombre, precio, Infinity); // llama al constructor del padre
        this.urlDescarga = urlDescarga;
    }

    // sobreescribimos el metodo heredado
    tieneStock() {
        return true; // los productos digitales siempre tienen stock
    }

    descripcion() {
        return `${super.descripcion()} - Descarga: ${this.urlDescarga}`;
    }
}

const curso = new ProductoDigital("Curso de Node.js", 9999, "https://ejemplo.com/curso");
console.log(curso.tieneStock());    // true
console.log(curso.descripcion());   // "Curso de Node.js - $9999 (stock: Infinity) - Descarga: ..."
```

`super` hace referencia a la clase padre. `super(...)` llama al constructor del padre, y `super.metodo()` llama a un metodo del padre.

---

## 4. Funciones y Scopes

### Tipos de funciones

En JavaScript hay tres formas principales de definir una funcion:

**Function declaration:**
```js
function saludar(nombre) {
    return `Hola, ${nombre}!`;
}
```

**Function expression:**
```js
const saludar = function(nombre) {
    return `Hola, ${nombre}!`;
};
```

**Arrow function (funcion flecha):**
```js
const saludar = (nombre) => {
    return `Hola, ${nombre}!`;
};

// version corta si solo hay una expresion a retornar
const saludar = (nombre) => `Hola, ${nombre}!`;
```

La diferencia practica mas importante entre las arrow functions y las otras es el comportamiento de `this`, que importa cuando trabajas con clases y eventos. Por ahora, usa arrow functions para funciones cortas y callbacks, y function declarations o expressions para funciones con logica mas compleja.

### Scope

El **scope** (o ambito) define desde donde es accesible una variable. En JavaScript moderno con `let` y `const`, el scope es de **bloque**: una variable declarada dentro de `{}` solo existe dentro de ese bloque.

```js
const mensaje = "afuera"; // scope global (de este modulo)

function ejemplo() {
    const mensaje = "adentro"; // scope local a la funcion
    console.log(mensaje); // "adentro"
}

ejemplo();
console.log(mensaje); // "afuera"
```

```js
if (true) {
    const x = 10;
    console.log(x); // 10, funciona
}
console.log(x); // ERROR: x no existe aqui fuera
```

Una funcion puede acceder a las variables del scope exterior (el scope donde fue *definida*), pero no al reves:

```js
const limite = 100;

function validarEdad(edad) {
    // puede ver "limite" porque esta en el scope exterior
    if (edad < limite) {
        return "menor de edad para este contexto";
    }
    return "ok";
}
```

### Closures

Un **closure** es cuando una funcion "recuerda" las variables del scope donde fue creada, incluso despues de que esa funcion ya termino de ejecutarse. Es uno de los conceptos mas poderosos (y a veces confusos) de JavaScript.

```js
function crearContador() {
    let contador = 0; // esta variable "vive" en el closure

    return function() {
        contador++;
        return contador;
    };
}

const contar = crearContador();
console.log(contar()); // 1
console.log(contar()); // 2
console.log(contar()); // 3

const otroContador = crearContador(); // contador independiente
console.log(otroContador()); // 1
```

Cada vez que llamamos a `crearContador()`, se crea un nuevo closure con su propio `contador`. `contar` y `otroContador` no comparten estado.

En el backend vas a usar closures sin darte cuenta todo el tiempo: en middlewares de Express, en callbacks de base de datos, en event handlers. Lo importante por ahora es entender que una funcion puede acceder y modificar variables del scope donde fue creada.

---

## Summary: Conceptos nuevos de la semana

| Concepto | Descripcion rapida |
|---|---|
| **Backend** | La parte del sistema que corre en el servidor: logica de negocio, base de datos, APIs |
| **Node.js** | Entorno que permite correr JavaScript fuera del navegador |
| **`var` / `let` / `const`** | Formas de declarar variables; preferir `const` y `let` |
| **Array** | Lista ordenada de valores con indice numerico desde 0 |
| **`filter` / `map` / `reduce`** | Metodos de array que reciben un callback y devuelven un resultado transformado |
| **Objeto** | Coleccion de pares clave-valor para representar entidades |
| **Template string** | Texto con comillas invertidas que permite interpolacion con `${}` |
| **Clase** | Molde para crear objetos con estructura y comportamiento definidos |
| **`constructor`** | Metodo especial que se ejecuta al crear una instancia con `new` |
| **Herencia** | Una clase puede extender otra con `extends` y acceder al padre con `super` |
| **Scope** | El ambito donde una variable es accesible |
| **Closure** | Una funcion que recuerda las variables del scope donde fue definida |
| **Arrow function** | Sintaxis corta para funciones: `(params) => expresion` |

---

## Ejercicios

### Ejercicio 1 — Variables y tipos

Declara tres variables usando `const`, `let`, y `var` respectivamente. Despues intenta reasignar cada una. Anota que pasa con cada una y por que. Luego, crea un objeto `persona` con al menos 4 propiedades (nombre, apellido, edad, profesion) y mostralo por consola con un template string que diga algo como: "Nombre completo: Juan Perez, 28 años, trabaja como diseñador."

---

### Ejercicio 2 — Manipulacion de arrays

Tenes este array de tareas pendientes:

```js
const tareas = ["Estudiar Node", "Hacer ejercicios", "Revisar apuntes"];
```

Sin reemplazar el array original:
1. Agrega la tarea `"Practica con Express"` al final
2. Agrega `"Repasar closures"` al principio
3. Saca la primera tarea del array
4. Mostra por consola la cantidad de tareas que quedaron
5. Mostra cada tarea numerada usando un `for` o `forEach`

---

### Ejercicio 3 — Objetos anidados

Crea un objeto `orden` que represente un pedido de e-commerce con esta estructura:
- `id`: numero
- `cliente`: objeto con `nombre` y `email`
- `items`: array de al menos 2 productos (cada uno con `nombre`, `precio`, `cantidad`)
- `estado`: string (`"pendiente"`, `"enviado"`, etc.)

Luego:
1. Mostra el nombre del cliente con un template string
2. Calcula el total sumando `precio * cantidad` de cada item
3. Cambia el estado a `"enviado"`
4. Agrega un item nuevo al array

---

### Ejercicio 4 — Clases

Crea una clase `Empleado` con:
- Constructor que recibe `nombre`, `puesto` y `salario`
- Metodo `presentarse()` que devuelva un string como: `"Soy Ana, trabajo como diseñadora y cobro $80000"`
- Metodo `aumentar(porcentaje)` que aumente el salario en el porcentaje dado
- Metodo `toString()` que devuelva el nombre y el salario actual

Luego crea una clase `Gerente` que extienda `Empleado` y tenga:
- Un array `equipo` (inicialmente vacio) en el constructor
- Metodo `agregarAlEquipo(empleado)` que agregue un `Empleado` al array
- Metodo `mostrarEquipo()` que muestre el nombre y puesto de cada miembro

Crea al menos un gerente y dos empleados, agrega los empleados al equipo del gerente y mostralo.

---

### Ejercicio 5 — Arrow functions y callbacks

Tenes este array de numeros:

```js
const numeros = [3, 7, 2, 15, 8, 4, 21, 6];
```

Usando los metodos de array `filter`, `map` y `reduce` (todos reciben una arrow function):

1. Filtra solo los numeros mayores a 6
2. Multiplica cada numero del array original por 3 y guarda el resultado en un array nuevo
3. Suma todos los numeros del array original
4. Encadena los tres pasos: filtra los mayores a 6, multiplicalos por 2, y suma el resultado

---

### Ejercicio 6 — Scope

Copia este codigo y antes de correrlo, predice que va a imprimir cada `console.log`. Despues correrlo y verifica si tenias razon:

```js
const x = "global";

function primera() {
    const x = "primera";
    console.log(x); // ?

    function segunda() {
        console.log(x); // ?
    }

    segunda();
}

primera();
console.log(x); // ?

if (true) {
    let y = "bloque";
    console.log(y); // ?
}

// console.log(y); // descomenta esta linea: que pasa?
```

Escribi un comentario al lado de cada `console.log` explicando por que se imprime lo que se imprime.

---

### Ejercicio 7 — Closures

Crea una funcion `crearSaludo` que reciba un `idioma` ("es", "en" o "pt") y devuelva una funcion que reciba un `nombre` y salude en ese idioma:

```js
const saludarEspanol = crearSaludo("es");
const saludarIngles = crearSaludo("en");

console.log(saludarEspanol("Ana"));    // "Hola, Ana!"
console.log(saludarIngles("Carlos"));  // "Hello, Carlos!"
```

El idioma no se pasa cada vez que saludas: queda "capturado" en el closure.

---

### Ejercicio 8 — Clase + Template Strings + Arrays (integracion)

Crea una clase `Carrito` que represente el carrito de compras de un e-commerce:

- Constructor sin parametros que inicialice un array vacio `items`
- Metodo `agregar(nombre, precio, cantidad)` que agregue un objeto al array
- Metodo `total()` que calcule y devuelva la suma de `precio * cantidad` de todos los items
- Metodo `resumen()` que devuelva un string con el listado de items y el total, usando template strings:

```
Carrito:
- Teclado x1 = $45000
- Mouse x2 = $30000
Total: $75000
```

Proba el carrito agregando al menos 3 productos y mostrando el resumen por consola.
