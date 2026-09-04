# 📊 Score-2025 — CrediRapi FinTech API

Este proyecto contiene la API utilizada para calcular el **scoring de riesgo crediticio** de los clientes de **CrediRapi**, diseñada para integrarse con:

- 🟢 WhatsApp Bot en SendPulse  
- 🟣 Vercel Serverless Functions  
- 🔵 Dashboard y análisis de riesgo interno  

---

## 🚀 Características principales

- API Serverless alojada en **Vercel**
- Endpoint: `/api/scoring2025`
- Responde en formato JSON
- Califica a un cliente según sus datos personales y financieros
- Devuelve:
  - `score_total`
  - `banda_riesgo`
  - `decision`
  - `monto_sugerido`

---

## 📁 Estructura del proyecto

---

## 💳 Control de Tarjetas de Crédito

Además de la API de scoring, este repo incluye una herramienta independiente para
llevar el control de tarjetas de crédito propias: estados de cuenta por tarjeta,
gastos e ingresos, fechas de corte y pago, intereses y seguimiento de abonos.

- **Ruta:** [`tarjetas/index.html`](tarjetas/index.html) — un solo archivo, sin dependencias.
- **En línea:** `/tarjetas/` una vez desplegado en Vercel.
- **Documentación:** [`tarjetas/README.md`](tarjetas/README.md)

Concilia cada corte (`saldo anterior + cargos − abonos = saldo nuevo`) para detectar
cobros que no cuadran, y desglosa cuánto de cada abono se va a intereses y cuánto
baja el capital. No comparte datos con la API de scoring: los guarda en el navegador.
