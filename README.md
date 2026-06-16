# Método de Simpson 3/8

Aplicación web académica desarrollada para la materia **Métodos Numéricos**, enfocada en el cálculo, análisis y visualización del **Método de Simpson 3/8** para aproximar integrales definidas.

El proyecto permite aplicar el método en su forma **simple** y **compuesta**, visualizar el proceso de integración y relacionar el cálculo numérico con situaciones interpretables en ingeniería, como volumen acumulado, carga contaminante y volumen excavado.

---

## Objetivo del proyecto

El objetivo principal es demostrar de forma interactiva cómo el **Método de Simpson 3/8** aproxima el valor de una integral definida mediante interpolación polinómica cúbica.

La aplicación permite al estudiante:

* Comprender la base teórica del método.
* Aplicar Simpson 3/8 simple y compuesto.
* Ingresar funciones matemáticas de forma flexible.
* Visualizar puntos de evaluación, coeficientes y desarrollo del cálculo.
* Configurar la precisión del procedimiento mediante decimales o cifras significativas.
* Comparar el resultado aproximado con un valor exacto cuando esté disponible.
* Interpretar la integral definida como una cantidad acumulada en problemas aplicados.
* Relacionar el método numérico con situaciones reales de ingeniería.

---

## ¿Qué es el Método de Simpson 3/8?

El Método de Simpson 3/8 es una técnica de integración numérica que aproxima el área bajo una curva usando un polinomio cúbico de interpolación.

En su forma simple, utiliza cuatro puntos igualmente espaciados:

$$
x_0,\ x_1,\ x_2,\ x_3
$$

La aproximación está dada por:

$$
\int_a^b f(x),dx \approx \frac{3h}{8}
\left[
f(x_0)+3f(x_1)+3f(x_2)+f(x_3)
\right]
$$

donde:

$$
h=\frac{b-a}{3}
$$

En su forma compuesta, el intervalo se divide en una cantidad de subintervalos múltiplo de 3, aplicando la regla por bloques.

Para el caso compuesto:

$$
n \text{ debe ser múltiplo de } 3
$$

---

## Funcionalidades principales

### 1. Teoría del método

Incluye una explicación conceptual del Método de Simpson 3/8, su fundamento matemático, condiciones de aplicación y relación con la interpolación cúbica.

Esta sección ayuda a comprender por qué el método utiliza grupos de tres subintervalos y cómo se obtiene la fórmula de aproximación.

---

### 2. Simpson 3/8 Simple

Permite aproximar una integral definida usando la forma simple del método.

El usuario puede ingresar:

* Función matemática.
* Límite inferior.
* Límite superior.
* Valor exacto opcional.

El sistema muestra:

* Tamaño de paso (h).
* Puntos (x_i).
* Evaluaciones (f(x_i)).
* Coeficientes del método.
* Productos (C_i f(x_i)).
* Sustitución en la fórmula.
* Resultado aproximado.
* Error absoluto, relativo y porcentual cuando corresponde.

---

### 3. Simpson 3/8 Compuesto

Permite aplicar el método sobre intervalos divididos en varios subintervalos.

El usuario puede ingresar:

* Función matemática.
* Intervalo de integración.
* Número de subintervalos (n).
* Valor exacto opcional.

La condición principal es:

$$
n = 3k,\quad k \in \mathbb{N}
$$

Los coeficientes se aplican según la estructura del método compuesto:

```text
1, 3, 3, 2, 3, 3, 2, ..., 3, 3, 1
```

---

### 4. Simulador gráfico

El simulador permite observar visualmente cómo Simpson 3/8 aproxima el área bajo una curva.

Incluye:

* Gráfica de la función.
* Puntos usados por el método.
* Bloques de integración.
* Área aproximada.
* Polinomio interpolante cúbico de Lagrange (P_3(x)).
* Comparación entre la función original y la aproximación.
* Información del cálculo.

Esta sección permite entender que Simpson 3/8 no toma puntos al azar, sino que sigue una estructura determinista basada en interpolación.

---

## Parser matemático

El proyecto incluye un parser para interpretar funciones ingresadas por el usuario mediante un campo matemático interactivo.

Soporta expresiones como:

```text
ln(x+1)
log(x+1)
log10(x+1)
exp(x^2)
e^x
e^(x^2)
e^{x^2}
x^2e^x
x^2*e^x
x(x+1)
2(x+1)
(x+1)(x+2)
sqrt(x+1)
sin(x)
cos(x)
tan(x)
```

El sistema normaliza estas expresiones para que puedan ser evaluadas correctamente por `math.js`.

---

## Precisión configurable

La aplicación permite configurar la precisión del desarrollo numérico mediante dos modos excluyentes:

1. **Decimales**
2. **Cifras significativas**

El usuario puede seleccionar una cantidad de precisión y el sistema aplica el redondeo de forma académica, paso a paso, siguiendo el estilo usado en ejercicios manuales.

El redondeo se aplica a:

* (h)
* (x_i)
* (f(x_i))
* (C_i f(x_i))
* Suma de términos
* Resultado final

Esto permite que la tabla, la sustitución en la fórmula y el resultado sean consistentes entre sí.

---

## Aplicaciones gráficas

Además del cálculo tradicional, el proyecto incluye aplicaciones visuales donde la integral representa una cantidad acumulada.

La idea general es:

$$
\text{Cantidad acumulada}=\int \text{tasa de cambio},dt
$$

o, en el caso espacial:

$$
\text{Volumen}=\int \text{área transversal},dx
$$

---

### Aplicación 1: Crecida de río y presa

Esta simulación interpreta la integral como el volumen de agua acumulado en un embalse.

$$
V \approx \int Q(t),dt
$$

donde:

* (Q(t)) es el caudal del río.
* (t) es el tiempo.
* (V) es el volumen acumulado.

La escena visual representa el nivel del agua, el estado del embalse y la evolución del sistema.

---

### Aplicación 2: Descarga contaminante en un río

Esta simulación interpreta la integral como la carga total contaminante descargada en un río durante un intervalo de tiempo.

$$
L \approx \int C(t),dt
$$

donde:

* (C(t)) es la tasa de descarga contaminante.
* (t) es el tiempo.
* (L) es la carga contaminante acumulada.

La aplicación permite analizar perfiles como descarga controlada, descarga constante, fuga progresiva o pico accidental.

---

### Aplicación 3: Volumen excavado por secciones

Esta simulación representa una aplicación relacionada con ingeniería civil y topografía.

$$
V \approx \int A(x),dx
$$

donde:

* (A(x)) es el área transversal de excavación.
* (x) es la distancia recorrida.
* (V) es el volumen excavado.

El método permite estimar el volumen de tierra a remover a partir de áreas transversales medidas en distintas estaciones.

---

## Tecnologías utilizadas

El proyecto fue desarrollado con tecnologías web estáticas:

* **HTML5**
* **CSS3**
* **JavaScript**
* **Math.js** para evaluación matemática.
* **MathLive** para entrada matemática interactiva.
* **KaTeX** para renderizado de fórmulas.
* **Plotly.js** para visualización gráfica.
* **Firebase Hosting** para despliegue web.

---

## Cómo usar el proyecto

### Opción 1: Abrir localmente

1. Descargar o clonar el repositorio.
2. Abrir el archivo `index.html` en un navegador moderno.
3. Navegar por las secciones del menú principal.

### Opción 2: Usar Live Server

1. Abrir la carpeta del proyecto en Visual Studio Code.
2. Instalar la extensión **Live Server**.
3. Ejecutar `index.html` con Live Server.

### Opción 3: Servidor local con Python

Desde la raíz del proyecto:

```bash
python -m http.server 5000
```

Luego abrir:

```text
http://localhost:5000
```

### Opción 4: Versión publicada

Si el proyecto está desplegado en Firebase Hosting:


https://simpson-38.web.app


---

## Estructura general del proyecto

```text
Simpson-38/
├── index.html
├── 404.html
├── firebase.json
├── .firebaserc
├── html/
│   ├── teoria.html
│   ├── menu-metodo.html
│   ├── simpson-simple.html
│   ├── simpson-compuesto.html
│   ├── simulador.html
│   ├── aplicaciones-graficas.html
│   ├── aplicacion-crecida-rio.html
│   ├── aplicacion-contaminacion-rio.html
│   └── aplicacion-volumen-excavado.html
├── css/
│   ├── variables.css
│   ├── base.css
│   ├── layout.css
│   ├── componentes.css
│   ├── paginas.css
│   └── aplicaciones-graficas.css
├── js/
│   ├── main.js
│   ├── simpson-simple.js
│   ├── simpson-compuesto.js
│   ├── errores.js
│   ├── validaciones.js
│   ├── render-tablas.js
│   ├── render-formulas.js
│   ├── simulador.js
│   ├── aplicacion-crecida-rio.js
│   ├── aplicacion-contaminacion-rio.js
│   └── aplicacion-volumen-excavado.js
└── assets/
    └── img/
```

---

## Aspectos matemáticos implementados

El proyecto implementa:

* Fórmula de Simpson 3/8 simple.
* Fórmula de Simpson 3/8 compuesto.
* Validación de subintervalos múltiplos de 3.
* Cálculo del tamaño de paso (h).
* Generación de puntos (x_i).
* Evaluación de funciones matemáticas.
* Aplicación de coeficientes del método.
* Tabla de desarrollo.
* Sustitución en fórmula.
* Aproximación de la integral.
* Cálculo de errores.
* Visualización de bloques de integración.
* Polinomio cúbico interpolante de Lagrange.

---

## Pruebas recomendadas

Algunas funciones útiles para verificar el sistema:

```text
ln(x+1)
e^(x^2)
e^{x^2}
x^2e^x
x(x+1)
sqrt(x+1)
```

Ejemplo para Simpson 3/8 simple:

```text
f(x) = ln(x+1)
a = 0
b = 3
precisión = 6 decimales
```

Resultado aproximado esperado:

```text
I ≈ 2.535589
```

Ejemplo para Simpson 3/8 compuesto:

```text
f(x) = x^2
a = 0
b = 3
n = 6
precisión = 4 decimales
```

Resultado esperado:

```text
I ≈ 9.0000
```

---

## Datos académicos

* Universidad: Universidad Autónoma Gabriel René Moreno
* Facultad: Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones
* Materia: Métodos Numéricos
* Tema: Método de Simpson 3/8

---

## Estado del proyecto

El proyecto se encuentra en una versión funcional con:

* Cálculo simple.
* Cálculo compuesto.
* Simulador gráfico.
* Aplicaciones gráficas.
* Parser matemático mejorado.
* Precisión configurable.
* Redondeo académico paso a paso.
* Fórmulas matemáticas renderizadas.
* Escenas visuales interactivas.
* Despliegue en Firebase Hosting.

---

## Observación final

Este proyecto fue desarrollado con fines académicos para reforzar la comprensión del Método de Simpson 3/8 mediante teoría, cálculo, visualización y aplicaciones prácticas.

La intención principal es demostrar que los métodos numéricos no se limitan a sustituir valores en una fórmula, sino que permiten aproximar fenómenos reales cuando se trabaja con datos discretos, funciones complejas o integrales difíciles de resolver analíticamente.

