Diseñá una aplicación web moderna llamada “MateLab”.

Contexto del producto:
MateLab es una plataforma lúdica de práctica matemática para estudiantes universitarios. El objetivo no es planificar el estudio ni competir por puntos, sino ayudar a los estudiantes a practicar matemática con ejercicios reales de su cursada, comparar procedimientos y aprender resolviendo.

Alcance del MVP:
El MVP se enfoca en estudiantes de una misma facultad, materia y comisión. El estudiante puede ingresar a un espacio de práctica, ver ejercicios disponibles y cargar ejercicios de su guía o cursada para que otros compañeros puedan resolverlos.

Importante:
Para este sprint, la funcionalidad principal a mostrar es la carga de ejercicios por parte del estudiante y su aparición en el listado.
El login, la IA, la validación de resoluciones y los desafíos deben aparecer como parte del concepto del producto o roadmap, pero no como funcionalidades principales ya implementadas.

Estilo visual:
Interfaz académica, moderna, limpia y simple.
No usar estética infantil ni de videojuego.
Debe sentirse como una herramienta universitaria con dinámicas lúdicas de práctica.
Usar tarjetas, botones claros, navegación simple y textos fáciles de entender.

Pantallas necesarias:

1. Pantalla de ingreso académico

Objetivo:
Permitir que el estudiante ingrese al espacio de práctica correspondiente a su contexto académico.

Campos:
- Facultad
- Materia
- Comisión / turno

Usar datos de ejemplo:
- Facultad: UADE
- Materia: Matemática I
- Comisión / turno: Turno noche

Botón principal:
“Entrar al espacio de práctica”

Texto principal:
“Practicá matemática con ejercicios reales de tu cursada.”

Texto secundario:
“Ingresá a tu materia para resolver, cargar y compartir ejercicios con tus compañeros.”

Nota:
Esta pantalla es visual. No debe parecer un login complejo con usuario y contraseña.

2. Pantalla principal de ejercicios

Objetivo:
Mostrar los ejercicios disponibles dentro de la materia seleccionada.

Encabezado:
“Matemática I - Turno noche”

Subtítulo:
“Ejercicios disponibles para practicar”

Agregar botón principal visible:
“Cargar nuevo ejercicio”

Agregar filtros visuales:
- Tema
- Fuente
- Dificultad estimada

Importante:
La dificultad debe mostrarse como “dificultad estimada”, no como un dato absoluto.

Cards de ejercicios:
Cada ejercicio debe mostrar:
- Tema
- Fuente: Precargado / Subido por alumno / Generado por IA
- Dificultad estimada: Baja / Media / Alta / Pendiente de análisis
- Enunciado breve
- Botón “Resolver”
- Botón “Ver detalle”

Ejercicios de ejemplo:

Ejercicio 1:
Tema: Derivadas
Fuente: Precargado
Dificultad estimada: Media
Enunciado: Derivar f(x) = x² · sen(x)

Ejercicio 2:
Tema: Límites
Fuente: Subido por alumno
Dificultad estimada: Pendiente de análisis
Enunciado: Calcular el límite cuando x tiende a 0 de sen(x)/x

Ejercicio 3:
Tema: Integrales
Fuente: Generado por IA
Dificultad estimada: Baja
Enunciado: Resolver ∫ 2x dx

Agregar sección secundaria:
“Dinámicas de práctica”
Mostrar accesos visuales a:
- Comparar procedimientos
- Encontrar el error
- Completar paso faltante
- Desafiar a un compañero

Aclarar visualmente:
“Próximamente: estas dinámicas usarán los ejercicios cargados en la materia.”

3. Pantalla de carga de ejercicio

Objetivo:
Permitir que el estudiante cargue un ejercicio real de su guía o cursada.

Título:
“Cargar nuevo ejercicio”

Texto de ayuda:
“Subí ejercicios reales de tu cursada para que otros compañeros puedan practicarlos.”

Campos:
- Tema
- Enunciado del ejercicio
- Fuente: Ejercicio de guía / Ejercicio propio
- Archivo o imagen opcional

No incluir campo obligatorio de dificultad manual.

Agregar texto informativo:
“La dificultad será estimada por la app a partir del enunciado del ejercicio.”

Botón principal:
“Analizar y cargar ejercicio”

Nota:
En esta versión, el análisis puede mostrarse de forma visual como pendiente o simulado.

4. Pantalla de análisis del ejercicio

Objetivo:
Mostrar que la app puede analizar el ejercicio cargado antes de guardarlo.

Título:
“Análisis del ejercicio”

Mostrar resumen:
- Tema detectado: Derivadas
- Dificultad estimada: Media
- Conceptos involucrados: regla del producto, derivadas trigonométricas

Agregar mensaje:
“La dificultad es una estimación inicial y puede ajustarse con el uso.”

Botones:
- “Guardar ejercicio”
- “Editar datos”

5. Pantalla de confirmación

Objetivo:
Confirmar que el ejercicio fue cargado correctamente.

Mensaje principal:
“Ejercicio cargado correctamente”

Texto secundario:
“El ejercicio ya está disponible en Matemática I - Turno noche para que otros compañeros puedan resolverlo.”

Botones:
- “Ver en listado”
- “Cargar otro ejercicio”

6. Pantalla de detalle de ejercicio

Objetivo:
Mostrar el detalle de un ejercicio seleccionado.

Mostrar:
- Enunciado completo
- Tema
- Fuente
- Dificultad estimada
- Conceptos involucrados, si existen

Botón principal:
“Resolver ejercicio”

Agregar bloque visual:
“Próximamente”
- Validar resolución con IA
- Desafiar a un compañero
- Comparar procedimientos

7. Pantalla futura de resolución y desafío

Objetivo:
Mostrar como roadmap la próxima funcionalidad, sin que parezca implementada en este sprint.

Flujo visual:
- El estudiante resuelve un ejercicio.
- La app valida el procedimiento con IA.
- Si la resolución es correcta, se habilita “Desafiar a un compañero”.
- Otro estudiante resuelve el mismo ejercicio.
- Ambos comparan procedimientos.

Agregar texto:
“Esta dinámica será parte de los próximos incrementos del MVP.”

Textos principales de la app:
- “Practicá matemática con ejercicios reales de tu cursada.”
- “Cargá ejercicios, resolvé y aprendé comparando procedimientos.”
- “La dificultad es estimada por la app, no definida manualmente.”
- “El foco no es competir, sino aprender resolviendo.”

Comportamiento visual importante:
- La carga de ejercicio debe sentirse como la funcionalidad principal.
- La dificultad nunca debe aparecer como campo obligatorio cargado por el estudiante.
- Los desafíos, la validación con IA y la comparación de procedimientos deben aparecer como próximas funcionalidades o secciones futuras.