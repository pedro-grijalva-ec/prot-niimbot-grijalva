# Guía de Integración API Niimbot

Esta guía explica cómo conectar cualquier aplicación externa (ej. Flutter, Web, Backend) al servicio de impresión de Niimbot.

## Arquitectura de Conexión

Para imprimir desde una app externa, el flujo es el siguiente:

1.  **Tu App** (Cliente) envía los datos del trabajo a la **API en GCP**.
2.  La **API en GCP** genera 3 etiquetas (2 tickets + 1 descripción) y las guarda en una cola.
3.  El **Bridge Client** (Local) descarga las etiquetas y las imprime por Bluetooth.

---

## 1. Endpoint de Impresión (GCP)

Para iniciar una impresión, envía una solicitud `POST` al servidor donde desplegaste el Docker.

**URL:** `http://TU_IP_GCP:3000/v1/print`  
**Método:** `POST`  
**Cuerpo (JSON):**

```json
{
  "nombre": "Juan Pérez",
  "telefono": "0987654321",
  "fechaEntrada": "2026-03-14",
  "fechaEntrega": "2026-03-20",
  "precio": "1500.00",
  "abono": "500.00",
  "saldo": "1000.00",
  "serial": "000565",
  "descripcion": "Anillo de bodas, oro 18k con grabado interno 'Para siempre'."
}
```

**Respuesta Exitosa (202 Accepted):**

```json
{
  "orderId": "uuid-generado-v4",
  "message": "Print order accepted (3 labels generated)"
}
```

---

## 2. Monitoreo de Estado

Si deseas saber si las etiquetas ya fueron impresas por el agente local:

**URL:** `http://TU_IP_GCP:3000/v1/jobs/uuid-generado-v4`  
**Método:** `GET`

---

## 3. Requisito para Impresión Física

Para que la impresión se materialice, el contenedor del `bridge-client` (o el script `index.js` en esa carpeta) debe estar ejecutándose en una computadora con Bluetooth que tenga acceso a la URL de la API en GCP.

### Configuración del Bridge:
En la computadora local (cerca de la impresora):
1.  Clona el repo.
2.  Entra a `bridge-client`.
3.  Ejecuta:
    ```bash
    export API_URL=http://TU_IP_GCP:3000
    node index.js
    ```

---

## Ejemplo en JavaScript (Fetch)

```javascript
fetch('http://TU_IP_GCP:3000/v1/print', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: "Pedro Grijalva",
    serial: "000999",
    // ... resto de campos
  })
})
.then(res => res.json())
.then(data => console.log("Orden enviada:", data.orderId));
```
