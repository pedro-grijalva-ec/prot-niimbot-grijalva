# Niimbot B1 Web Prototype

Este proyecto es un prototipo funcional para imprimir etiquetas en una impresora Niimbot B1 utilizando la API de Web Bluetooth.

## Características
- **App Web**: Conexión BLE directa, renderizado en canvas, interfaz premium.
- **REST API**: Servidor Express en Docker para orquestación remota (GCP).
- **Arquitectura Híbrida**: Soporte para impresión en la nube vía puente local.
- **Plantillas Dinámicas**: Generación de códigos de barras y textos a 203 DPI.

## Estructura del Proyecto
- `/src`: Aplicación web (Frontend).
- `/backend`: API REST dockerizada (Procesamiento en la nube).
- `/bridge-client`: Ejemplo de puente para conexión local-nube.
- `/docs`: Documentación técnica y registros.

## Despliegue
Ver [walkthrough.md](file:///home/neo/.gemini/antigravity/brain/d21082e6-5fd8-41d3-af6f-6d9b7198f189/walkthrough.md) para instrucciones detalladas de despliegue con Docker Compose.

## Integración para otras Apps
Si deseas conectar una App externa (ej. Flutter o Web) para imprimir automáticamente, consulta la [Guía de Integración API](file:///home/neo/proj/prot_niimbot/docs/api_guide.md).
