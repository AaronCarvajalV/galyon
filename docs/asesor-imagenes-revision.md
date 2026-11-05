# Revisión de imágenes del Asesor de Cultivos

Registro de la primera revisión (`c9fa754`). La continuidad de las imágenes en resultados y las sustituciones adicionales se documentan en [la segunda revisión](asesor-imagenes-segunda-revision.md).

Alcance: ocho cultivos visibles, 123 tarjetas de categorías y síntomas. El modo Huerto o jardín continúa oculto. Las portadas de cultivos y las imágenes recientes aprobadas de maíz se conservan.

Se incorporan 43 ilustraciones generadas de referencia en 54 asociaciones de tarjetas: cubren 23 tarjetas sin imagen y sustituyen imágenes poco nítidas o que representaban mal el órgano o síntoma. Son escenas ilustrativas, no fotografías de casos clínicos confirmados. Cada botón nuevo incluye una descripción accesible que identifica su origen. No contienen nombres, iconos, marcas ni texto incrustado.

Las asociaciones se resuelven por cultivo, parte y opción exclusivamente en el selector de finca. Los datos originales de síntomas y las imágenes de los resultados permanecen intactos. El archivo `asesor-imagenes-revision.json` registra cada ilustración, la escena solicitada y las tarjetas que la utilizan.

Presentación: WebP, calidad 85; proporción 16:9, encuadre centrado y sin ampliación al pasar el cursor. En móvil, los grupos con ilustraciones nuevas ocupan una columna.

Validación:

- `node verify_advisor_visuals.js`: cobertura de las 123 tarjetas, archivos y asociaciones del inventario.
- `node verify_maiz.js /ruta/al/script-anterior.js`: 16 resultados de maíz y 310 resultados de otros cultivos idénticos, incluidos los mensajes de WhatsApp.
- Chromium en 1440 y 390 píxeles: categorías y síntomas de los ocho cultivos, carga de imágenes, dimensiones, navegación, reinicio y consulta por WhatsApp.
- Suites heredadas: `verify_increment1.js` conserva cuatro fallos anteriores en el reconocimiento de la URL con versión del combo mango; `verify_asesor_images.js` conserva dos fallos anteriores por el PNG original de WhatsApp con mayúsculas. No se modifican archivos ajenos al alcance para corregir esos fallos.
