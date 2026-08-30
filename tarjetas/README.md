# 💳 Control de Tarjetas de Crédito

Un registro para dejar de preguntarte *"¿en qué gasté esto?"* y *"¿por qué abono y no baja?"*.

Es **un solo archivo** (`index.html`). Lo abres en el navegador y ya. No necesita
internet, ni servidor, ni instalar nada. Tus datos no salen de tu dispositivo.

---

## Cómo abrirlo

**En la computadora:** doble clic en `tarjetas/index.html`.

**En el celular:** abre `https://<tu-dominio-de-vercel>/tarjetas/` y agrégalo a la
pantalla de inicio para que se vea como una app.

> ⚠️ Los datos se guardan en el navegador donde lo abres. La compu y el celular
> son **registros separados**: para pasarlos de uno a otro, exporta el respaldo
> JSON desde *Datos → Exportar* e impórtalo en el otro.

---

## El flujo, en orden

### 1. Da de alta cada tarjeta
En *Tarjetas → + Tarjeta*. Los datos que importan (todos vienen impresos en tu
estado de cuenta):

| Campo | Dónde lo encuentras | Para qué sirve |
|---|---|---|
| Límite de crédito | Portada del estado de cuenta | Ver cuánto tienes usado |
| Tasa de interés anual | Suele venir como "CAT" o "tasa de interés anual" | Estimar cuánto te van a cobrar |
| Día de corte | "Fecha de corte" | Saber cuándo cierra el periodo |
| Días para pagar | Diferencia entre corte y "fecha límite de pago" (normalmente 20) | Avisarte antes de que venza |

### 2. Carga los estados de cuenta
En *Estados de cuenta → + Cargar estado de cuenta*. Capturas los seis números de
la portada: saldo anterior, saldo al corte, pago mínimo, pago para no generar
intereses, fecha de corte y fecha límite de pago.

### 3. Vacía los movimientos
Dos caminos:

- **A mano**, uno por uno, en *Movimientos → + Movimiento*.
- **Automático**: me pasas el PDF del estado de cuenta y te devuelvo el JSON
  con todos los movimientos ya clasificados. Lo pegas en *Datos → Cargar un
  estado de cuenta ya vaciado* y entran todos de golpe. El formato está
  documentado abajo.

### 4. Registra cada abono
Cada vez que pagues, captúralo como movimiento tipo **Abono / Pago** con la fecha
real. Esto es lo que hace que todo lo demás funcione: sin abonos capturados no se
puede saber cuánto bajó tu deuda de verdad.

---

## Qué te contesta

### "¿En qué gasté esto?"
La pestaña **Movimientos** filtra por tarjeta, mes, categoría y texto, y abajo te
desglosa el gasto por categoría de lo que tengas filtrado.

### "Desconfío de que sea esa cantidad"
La pestaña **Estados de cuenta** hace la conciliación de cada corte:

```
saldo anterior  +  cargos del periodo  −  abonos del periodo  =  saldo que debería salir
```

Si ese resultado no coincide con lo que te cobra el banco, la columna **Cuadra**
marca la diferencia exacta en rojo. Ahí tienes dos posibilidades:

- **Diferencia positiva** (te cobran de más): falta capturar intereses,
  comisiones o algún cargo. Si ya capturaste todo el estado de cuenta y
  sigue sin cuadrar, **eso es lo que hay que aclarar con el banco**, con el
  monto exacto en la mano.
- **Diferencia negativa**: tienes un movimiento duplicado, o uno que todavía no
  entra en ese corte.

Da clic en 🔍 para ver el desglose completo, línea por línea.

### "¿En qué categoría estoy gastando más?"
La pestaña **En qué gasto** es el tablero: cuánto llevas gastado, cuál es tu
categoría número uno, cuánto te cuesta el banco y tu promedio mensual. Debajo,
una gráfica de barras con el gasto por categoría —los intereses y comisiones
aparecen como su propia barra, marcados en rojo, porque no son un gasto tuyo
sino lo que cuesta deber— y una gráfica de columnas con cómo cambia mes a mes.
Cada gráfica trae su tabla con los mismos números.

Puedes filtrar por tarjeta y por mes.

### Clasificar los movimientos
Muchos conceptos se categorizan solos (un `UBER EATS` es Comida). Otros traen
texto que sólo tú entiendes, y ésos los clasificas a mano de dos maneras:

- **Uno por uno:** en *Movimientos*, cada compra trae un selector de categoría
  en su fila. Lo cambias y se guarda solo.
- **Todos los de un concepto de golpe:** en *En qué gasto → Por clasificar*
  tienes la lista de conceptos pendientes ordenada por lo que más pesa. Eliges
  la categoría de un concepto y se aplica a **todos** sus movimientos.

En los dos casos, cuando clasificas un concepto **se guarda la regla**: el
próximo estado de cuenta que traiga ese mismo concepto llegará ya clasificado.
Así el trabajo se hace una sola vez.

Si te faltan categorías, cualquier selector trae la opción **＋ Nueva
categoría…** y la que agregues queda disponible en todos lados.

Para encontrar lo pendiente rápido, en *Movimientos* filtra por
**⚠ Sin categoría**.

### "Abono y no veo que baje la deuda"
La pestaña **¿Por qué no baja?** te lo dice en una frase: de cada $100 que has
abonado, cuánto se quedó el banco en intereses, IVA y comisiones, y cuánto bajó
tu deuda de verdad. Además te dice cuál tarjeta te está costando más y en qué
cortes no alcanzaste a liquidar.

Ojo con la trampa clásica: **pagar el mínimo no baja la deuda**. Cubre los
intereses y poco más. La app marca cada corte donde eso pasó.

### "De repente es día de pago y son $5,900 que no tenía contemplado"
El **Resumen** te avisa cuando falten 12 días o menos para una fecha límite,
con el monto exacto que necesitas para no generar intereses y cuánto te falta.
El calendario de cortes y pagos te muestra todas las fechas por adelantado.

---

## Formato para cargar un estado de cuenta

```json
{
  "tipo": "estado_de_cuenta",
  "tarjeta": "BBVA Azul",
  "banco": "BBVA",
  "ultimos4": "4821",
  "limite": 30000,
  "tasaAnual": 62.5,
  "diaCorte": 15,
  "diasParaPagar": 20,
  "periodo": {
    "fechaCorte": "2026-08-15",
    "fechaLimitePago": "2026-09-04",
    "saldoAnterior": 12480.55,
    "saldoNuevo": 14310.20,
    "pagoMinimo": 980.00,
    "pagoNoIntereses": 14310.20
  },
  "movimientos": [
    {"fecha": "2026-07-18", "descripcion": "OXXO Centro", "monto": 189.50, "tipo": "compra", "categoria": "Súper"},
    {"fecha": "2026-07-29", "descripcion": "Pago recibido", "monto": 2000.00, "tipo": "abono"},
    {"fecha": "2026-08-15", "descripcion": "Intereses del periodo", "monto": 648.30, "tipo": "interes"},
    {"fecha": "2026-08-15", "descripcion": "IVA de intereses", "monto": 103.73, "tipo": "iva"}
  ]
}
```

**Reglas:**

- Los montos van **siempre en positivo**. El campo `tipo` decide si suma o resta.
- Tipos que **suben** la deuda: `compra`, `disposicion`, `mensualidad`,
  `interes`, `iva`, `comision`, `anualidad`.
- Tipos que la **bajan**: `abono` (dinero tuyo), `bonificacion` (cashback) y
  `diferimiento` (saldo que se pasa a meses). Sólo `abono` cuenta como pago tuyo.
- En `periodo` puedes incluir `saldoDiferido` con el saldo a meses del corte.
- Fechas en `AAAA-MM-DD`.
- Si la tarjeta no existe, se crea sola con el nombre de `tarjeta`.
- Si vuelves a cargar el mismo corte, los movimientos repetidos (misma fecha,
  monto y concepto) **se saltan**: no se duplica nada.
- Puedes pegar un **arreglo** `[{...}, {...}]` para cargar varios meses de golpe.
- `periodo` es opcional: si sólo traes movimientos sueltos, omítelo.

---

## Respaldos

Los datos viven en el `localStorage` del navegador. Si borras el historial de
navegación o cambias de dispositivo, **se pierden**.

Entra a *Datos → Exportar respaldo JSON* cada vez que cargues un estado de cuenta
y guarda el archivo donde acostumbres. Ese mismo archivo se vuelve a importar
completo, y también puedes bajar los movimientos en CSV para abrirlos en Excel.

---

## Detalles de cálculo

- **Saldo de una tarjeta:** si hay estados de cuenta cargados, se parte del saldo
  del corte más reciente (que es la verdad del banco) y se suma sólo lo posterior.
  Así un periodo capturado a medias no deforma el saldo actual.
- **A qué corte pertenece un abono:** al corte en cuya ventana de pago cae, es
  decir entre la fecha de corte y la fecha límite. Un abono del 1 de agosto paga
  el corte del 15 de julio, no el del 15 de agosto.
- **Interés estimado:** `saldo × (tasa anual ÷ 12) × 1.16`. Es una aproximación
  al saldo promedio diario que usan los bancos; sirve para dimensionar, no para
  cuadrar al centavo con el banco.
- **IVA:** 16 % sobre intereses y comisiones.
- **Compras a meses:** un corte guarda por separado el saldo exigible y el saldo
  diferido a meses. Lo que debes es la suma de ambos; lo que te exigen este
  corte es sólo el primero. La conciliación trabaja sobre el saldo exigible,
  que es lo que cuadra con el resumen de movimientos del estado de cuenta.
- **Qué cuenta como abono:** sólo el dinero que tú pagaste. Un cashback y un
  diferimiento a meses bajan el saldo del corte, pero no son tuyos, así que no
  entran en el cálculo de qué proporción de cada abono se va a intereses.
