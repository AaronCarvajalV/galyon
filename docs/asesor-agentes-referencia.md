# Referencias del agente en el resultado

Los resultados con un agente compatible muestran ahora una ilustración del organismo, en lugar de repetir la fotografía del síntoma elegido. Las tarjetas de selección y todos los textos de diagnóstico, productos, condiciones de uso y mensajes de WhatsApp permanecen iguales.

El catálogo JSON documenta 14 ilustraciones y 16 asociaciones por cultivo y síntoma. La categoría seleccionada debe contener ese síntoma. Los problemas inespecíficos, carencias, estrés hídrico y consulta libre mantienen la referencia del daño. Huerto continúa desactivado y conserva sus datos.

Las imágenes son ilustraciones generadas de referencia, revisadas visualmente; no son especímenes del usuario, microfotografías de laboratorio ni pruebas de identificación. La interfaz indica «Posible causante», nombre científico y «Vista ampliada / Vista microscópica · ilustración de referencia». Para barrenadores de caña, Diatraea se presenta como ejemplo del grupo, sin afirmar una especie identificada. Puccinia, Pseudocercospora y Colletotrichum se mantienen a nivel de género. Phytophthora es un oomiceto. Para moniliasis se representan estructuras microscópicas; los pequeños basidiomas rosados corresponden a la escoba de bruja, no a moniliasis.

## Fuentes de referencia

- INIAP, moniliasis: https://www.iniap.gob.ec/el-iniap-dispone-de-tecnologias-para-combatir-la-moniliasis/
- UBA, morfología de Moniliophthora roreri: https://herbariofitopatologia.agro.uba.ar/?page_id=26471
- Universidad de Hawái, picudo del banano: https://cms.ctahr.hawaii.edu/ckm/Home/Insects-and-Other-Pests/Beetles/Cosmopolites-sordidus
- Broca del café, revisión: https://pmc.ncbi.nlm.nih.gov/articles/PMC7763606/
- APS, sigatoka: https://www.apsnet.org/edcenter/pdlessons/Pages/BlackSigatokaEspanol.aspx
- UC IPM, roya del maíz: https://ipm.ucanr.edu/agriculture/corn/common-rust/
- UC IPM, oídio: https://ipm.ucanr.edu/agriculture/floriculture-and-ornamental-nurseries/powdery-mildew/
- SINAVIMO, barrenador: https://www.sinavimo.gob.ar/plaga/diatraea-saccharalis

## Validación

`node verify_advisor_agents.js`: cobertura de todas las asociaciones, archivos existentes, rótulos, WhatsApp y límites de cultivo/categoría. `node verify_advisor_visuals.js`: 131 tarjetas y 91 resultados. `node verify_maiz.js /tmp/asesor-before-agents.js`: compara los 16 diagnósticos de maíz y 310 resultados de otros cultivos, retirando únicamente el bloque visual; mensajes y recomendaciones idénticos.

Los dos verificadores históricos mantienen sus fallos previos: cuatro por una expresión que no admite la versión en la URL del combo de mango, y dos por el PNG original de WhatsApp. No se modificaron esos archivos ajenos a este cambio.

Prueba de navegador completada en Chromium a 1440, 390 y 320 px: 41 pantallas de selección y 91 resultados por tamaño; 22 muestran agente y los demás conservan la referencia del síntoma. Navegación, reinicio, mensajes de WhatsApp, carga de imágenes y ausencia de desbordamientos correctos.
