# Segunda revisión de imágenes del Asesor de Cultivos

Se revisaron las 131 tarjetas de los ocho cultivos visibles: ocho portadas, 32 categorías y 91 opciones de síntomas. Se conservan las portadas aprobadas, las fotografías recientes de maíz y el modo Huerto o jardín oculto.

La revisión visual detectó categorías que reutilizaban una imagen enferma, dos opciones de fruto de aguacate con la misma fotografía, referencias poco claras de flores y daños que mostraban otro órgano. Se incorporan 25 ilustraciones de referencia en WebP, con encuadre horizontal y sin textos, iconos, bandas ni marcas incrustadas. El inventario de cada sustitución está en `asesor-imagenes-segunda-revision.json`.

## Continuidad entre selección y resultado

Antes, 59 de los 91 resultados no mostraban la referencia usada en el selector; diez resultados de maíz no tenían imagen. Ahora ambos pasos resuelven la referencia con la misma función de presentación, usando cultivo, parte y opción seleccionada. Las imágenes generadas se identifican como ilustraciones en los resultados. El bloque de referencia conserva el encuadre completo; en móvil se coloca encima del texto para evitar el recorte vertical anterior.

Los datos de síntomas, causas, microorganismos, productos, consejos, cantidades y mensajes de WhatsApp no cambian. Las mismas imágenes pueden aparecer en selección y resultado, o para el mismo síntoma disponible en más de una categoría. Se eliminan repeticiones entre opciones diferentes del mismo grupo y entre una categoría y sus síntomas. La fotografía compartida de consulta personalizada se conserva para «No reconozco mi problema».

## Sustituciones

- Cacao: cuatro categorías; cancro, rama marchita, mazorca con necrosis oscura, polvo blanco/crema y hoja amarilla.
- Banano: categoría de hojas; base deteriorada, raíces dañadas y manchas en los dedos.
- Mango: categorías de hojas y base; floración seca y fruto con pudrición.
- Aguacate: categorías de hojas y base; floración seca y manchas de fruto diferenciadas de la pudrición.
- Caña: categorías de hojas y tallos/cogollos, con encuadres distintos.
- Hortalizas: categorías de planta completa y hojas, sin jardín ornamental.
- Café y maíz: referencias ya aprobadas conservadas; se corrige su continuidad en los resultados.

## Verificación

- `node verify_advisor_visuals.js`: 131 tarjetas, 79 asociaciones contextuales y los 91 resultados con su referencia correspondiente; sin duplicados entre opciones distintas del mismo grupo.
- `node verify_maiz.js`: 16 recorridos de maíz y las cuatro consultas libres.
- Comparación con `eaec08d`: 16 diagnósticos de maíz y 310 resultados de otros cultivos idénticos al retirar únicamente el bloque de imagen de referencia. La comparación conserva productos, recomendaciones y enlaces de WhatsApp.
- Chromium en 1440, 390 y 320 píxeles: selección de los ocho cultivos, categorías, 91 recorridos por ancho, imágenes, navegación, reinicio, consulta libre y WhatsApp.
- Suites heredadas: `verify_increment1.js` mantiene sus cuatro fallos previos relacionados con la URL versionada del combo mango; `verify_asesor_images.js` mantiene dos fallos previos por el PNG original de WhatsApp. Sin nuevas regresiones en esas suites.

Para repetir la comparación de diagnósticos, extraer `script.js` del commit `eaec08d` a un archivo temporal y pasarlo como argumento a `verify_maiz.js`. La prueba compara los textos completos de resultados y mensajes; la imagen se comprueba por separado contra la opción elegida.
