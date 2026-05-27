Necesito corregir el flujo actual de MateLab manteniendo el diseño visual general, pero ajustando algunos problemas de navegación y coherencia.

Correcciones necesarias:

1. Pantalla inicial: campos editables

En la pantalla inicial de “Ingreso al espacio de práctica”, los campos:
- Facultad
- Materia
- Comisión / turno

actualmente aparecen como datos fijos o no editables.

Necesito que esos campos sean editables por el usuario.

Pueden aparecer con datos de ejemplo precargados:
- Facultad: UADE
- Materia: Matemática I
- Comisión / turno: Turno noche

Pero el usuario debe poder modificarlos manualmente.

Ejemplo:
El usuario debería poder cambiar:
UADE / Matemática I / Turno noche

por:
UBA / Cálculo I / Turno mañana

Importante:
No convertir esta pantalla en un login complejo. Sigue siendo una pantalla simple de ingreso académico al espacio de práctica.


2. Pantalla principal: permitir cambiar materia/facultad/comisión

Después de tocar “Entrar al espacio de práctica”, actualmente no hay una forma clara de cambiar el contexto académico.

Agregar en la pantalla principal de ejercicios una opción visible para cambiar la materia, facultad o comisión.

Puede ser una de estas opciones:

Opción recomendada:
Debajo o al lado del título “Matemática I - Turno noche”, mostrar:

“UADE”
Botón o link: “Cambiar materia”

Al tocar “Cambiar materia”, el usuario debe poder volver a la pantalla inicial o abrir un modal para editar:
- Facultad
- Materia
- Comisión / turno

Ejemplo visual:

Matemática I - Turno noche
UADE · Cambiar materia

Objetivo:
Que el usuario pueda pasar de “Matemática I - UADE - Turno noche” a otra materia, por ejemplo “Cálculo I - UBA - Turno mañana”, sin tener que reiniciar todo el flujo.


3. Eliminar “Dinámicas de práctica” de la pantalla principal

Actualmente la sección “Dinámicas de práctica” aparece en la pantalla principal/listado de ejercicios y también vuelve a aparecer dentro del detalle de un ejercicio.

Esto genera repetición y confusión.

Necesito eliminar la sección “Dinámicas de práctica” de la pantalla principal.

La pantalla principal debe quedar enfocada solamente en:
- Título de la materia
- Facultad / opción de cambiar materia
- Botón “Cargar nuevo ejercicio”
- Filtros
- Cards de ejercicios

No mostrar “Comparar procedimientos”, “Encontrar el error”, “Completar paso faltante” ni “Desafiar a un compañero” en la pantalla principal.


4. Mantener “Dinámicas de práctica” solo dentro del detalle del ejercicio

La sección “Dinámicas de práctica” debe aparecer recién cuando el usuario entra al detalle de un ejercicio.

Tiene más sentido que las dinámicas dependan de un ejercicio ya seleccionado.

En la pantalla de detalle del ejercicio, mantener las cards:
- Comparar procedimientos
- Encontrar el error
- Completar paso faltante
- Desafiar a un compañero

Pero ajustar el comportamiento visual:

- Comparar procedimientos puede quedar como próxima funcionalidad.
- Encontrar el error puede quedar como próxima funcionalidad.
- Completar paso faltante puede quedar como próxima funcionalidad.
- Desafiar a un compañero debe verse como una opción disponible para demo visual.

La card “Desafiar a un compañero” no debe verse gris o deshabilitada.
Debe verse activa/clickeable, con borde más marcado o estilo destacado.

Agregar texto pequeño:
“Disponible como demo visual”


5. Flujo de “Desafiar a un compañero”

Al hacer clic en la card “Desafiar a un compañero”, crear una nueva pantalla llamada:

“Desafiar a un compañero”

Esta pantalla debe mostrar:

Encabezado:
“Desafiar a un compañero”

Texto introductorio:
“Elegí un ejercicio disponible de la materia y enviáselo a un compañero para que lo resuelva.”

Mostrar el ejercicio seleccionado:
Ejercicio:
“Derivar f(x) = x² · sen(x)”

Tema:
Derivadas

Dificultad estimada:
Media

Opciones de destinatario:

Opción 1:
“Desafiar a toda la comisión”

Opción 2:
“Desafiar a un compañero específico”

Si se elige compañero específico, mostrar un campo visual:
“Buscar compañero”

Ejemplos:
- Juan Pérez
- Sofía García
- Lucas Fernández

Agregar campo opcional:
“Mensaje para el desafío”

Placeholder:
“Te desafío a resolver este ejercicio y comparar procedimientos.”

Botón principal:
“Enviar desafío”

Luego de tocar “Enviar desafío”, mostrar confirmación:

“Desafío enviado correctamente.”

Texto secundario:
“El compañero podrá resolver el ejercicio y, en próximos incrementos, comparar su procedimiento con el tuyo.”

Agregar aclaración visual:
“Esta pantalla forma parte de la demo del flujo. La comparación de procedimientos y la validación con IA se implementarán en próximos sprints.”

Importante:
No mostrar esta dinámica como ranking ni competencia por puntos.
El enfoque debe ser colaborativo y académico: practicar, resolver y aprender con compañeros.


6. Ajuste del botón en detalle del ejercicio

En la pantalla de detalle del ejercicio, el botón principal debe ser:

“Comenzar resolución”

No repetir “Resolver ejercicio” de forma estática si ya venimos desde el botón “Resolver” de la card.

Al tocar “Comenzar resolución”, debe abrir una nueva pantalla llamada:

“Resolver ejercicio”


7. Pantalla “Resolver ejercicio”

Crear o ajustar la pantalla “Resolver ejercicio”.

Esta pantalla debe mostrar:

Encabezado:
“Resolver ejercicio”

Enunciado visible arriba:
Ejemplo:
“Derivar f(x) = x² · sen(x)”

Un único campo grande llamado:
“Tu resolución”

Placeholder:
“Escribí tu resolución paso a paso e incluí el resultado final al terminar.”

Importante:
No separar el procedimiento y el resultado final en dos campos distintos.
Todo debe ir en el mismo campo “Tu resolución”.

Agregar opción visual opcional:
“Adjuntar imagen o foto de la resolución”

Botón principal:
“Guardar resolución”

Luego de guardar, mostrar una pantalla o mensaje de confirmación:

“Resolución guardada correctamente.”

Debajo agregar:
“Próximamente: validación con IA, desafío a compañero y comparación de procedimientos.”


8. Mantener enfoque del sprint

El diseño debe reflejar que en este sprint el foco principal es:
- cargar ejercicios;
- listar ejercicios;
- entrar al detalle;
- comenzar una resolución como flujo visual;
- mostrar el desafío a compañero como demo visual.

La IA, la validación automática y la comparación de procedimientos deben seguir apareciendo como próximas funcionalidades, no como funcionalidades ya completamente implementadas.

Textos importantes de la app:
- “Practicá matemática con ejercicios reales de tu cursada.”
- “Cargá ejercicios, resolvé y aprendé comparando procedimientos.”
- “La dificultad es estimada por la app, no definida manualmente.”
- “El foco no es competir, sino aprender resolviendo.”