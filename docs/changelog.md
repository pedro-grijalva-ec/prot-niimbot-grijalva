# Changelog

## [2026-03-14] - Sesión de Adaptación para Joyería
- **Plantilla Grijalva**: Implementación de plantilla personalizada de 40x30mm para "Grijalva Joyería".
- **Secuencia de Impresión**: Lógica para imprimir juego de 3 etiquetas (2 Info + 1 Descripción) por cada solicitud.
- **Campos de Datos**: Soporte para Nombre, Teléfono, Fechas, Precios, Serial y Descripción detallada.
- **Preview Dual**: Mejora en la UI para previsualizar los dos tipos de etiquetas antes de imprimir.
- **Backend Sync**: Actualización del generador de Node.js y la API para soportar la nueva estructura de datos.

## [2026-03-14] - Sesión de Implementación y Finalización
- **API REST**: Implementación de servidor Express dockerizado para despliegue en GCP.
- **Docker**: Configuración de `Dockerfile` y `docker-compose.yml` para orquestación del backend.
- **Hybrid Architecture**: Soporte para impresión remota vía puente local (Local Bridge).
- **Backend Generator**: Portabilidad del motor de etiquetas a Node.js usando `node-canvas`.
- **Mejoras**: Corrección de tipos en `NiimbotService` y optimización de la compilación TypeScript.
