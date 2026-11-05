# Restauración de cacao y corrección de las comprobaciones

Se recupera la fotografía real `v52_cacao_moniliasis_foto_real.webp` en la opción «Polvo blanco o crema» de Cacao → Mazorcas de cacao. Se retira su sustitución automática por `rev2-cacao-moniliasis`. La imagen original conserva su clasificación de fotografía, sin etiqueta de ilustración generada. El resultado mantiene la ilustración del posible agente pedida para los diagnósticos; no cambian recomendaciones ni WhatsApp.

La prueba del combo mango ahora analiza la URL y busca el archivo por su pathname, admitiendo el parámetro de versión. Sigue exigiendo formato WebP, archivo existente, dimensiones 1672 × 941 y menos de 350 KB.

El PNG de WhatsApp original, sin referencias en la interfaz, se conserva sin cambios en `sources/asesor/whatsapp-original.png`. La carpeta de imágenes del asesor queda reservada a los WebP de la web, cumpliendo la auditoría existente. No se ha excluido ningún WebP ni relajado la comprobación de su formato.

Las menciones a seis fallos en documentos anteriores describen el estado histórico y quedan resueltas por este cambio:

- `node verify_increment1.js`: 15 pruebas correctas, 0 fallos.
- `node verify_asesor_images.js`: 18 pruebas correctas, 0 fallos; 768 instancias de imágenes comprobadas.
- `node verify_advisor_visuals.js`: 131 tarjetas, 78 sustituciones activas y 91 referencias de resultados correctas.
- `node verify_advisor_agents.js`: 16 asociaciones, 22 resultados con agente y 101 referencias generales correctas.
- `node verify_maiz.js /tmp/asesor-before-cacao-restore.js`: los 16 diagnósticos de maíz y 310 resultados restantes conservan textos y mensajes.
- Chromium a 1440 y 390 px: fotografía original en la tarjeta, resultado de moniliasis, reinicio y promoción de 1 kg correctos, sin errores JavaScript ni desbordamientos.
