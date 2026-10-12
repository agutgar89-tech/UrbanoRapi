/* Pruebas de la app de tarjetas.
 *
 *   node tarjetas/pruebas.mjs
 *
 * Abre index.html en un Chromium de verdad y le mete datos sintéticos por el
 * mismo camino que usa un estado de cuenta vaciado (`aplicarLote`). Después
 * pregunta por lo que la app calcula y lo compara contra números hechos a mano.
 *
 * Los datos de aquí son inventados a propósito: las cifras reales de nadie
 * entran al repositorio.
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));

/* ---------- mini servidor: la app necesita un origen para localStorage ---- */
const html = await readFile(join(AQUI, 'index.html'));
const servidor = createServer((_, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(0);
const puerto = servidor.address().port;

/* ---------- resultados ---------------------------------------------------- */
let pasaron = 0; const fallaron = [];
const cerca = (a, b, tol = 0.005) => Math.abs(a - b) <= tol;
function revisa(nombre, obtenido, esperado, tol) {
  const bien = typeof esperado === 'number' && typeof obtenido === 'number'
    ? cerca(obtenido, esperado, tol) : Object.is(obtenido, esperado);
  if (bien) { pasaron++; console.log(`  ok   ${nombre}`); }
  else { fallaron.push(nombre); console.log(`  FALLA ${nombre}\n        esperaba ${esperado}\n        obtuvo   ${obtenido}`); }
}

/* ---------- datos sintéticos ---------------------------------------------- */
const hoy = new Date();
const iso = f => f.toISOString().slice(0, 10);
const masDias = (f, n) => { const x = new Date(f); x.setDate(x.getDate() + n); return x; };

/* Un corte viejo, ya vencido y pagado sólo a medias, con compras a meses.
   Cuadra a mano:  1,000.00 + (800 + 200 + 150 + 24) − 500 = 1,674.00  */
const CORTE_VIEJO = {
  tipo: 'estado_de_cuenta', tarjeta: 'Prueba Uno', banco: 'Banco Falso', ultimos4: '1111',
  limite: 10000, tasaAnual: 60, diaCorte: 10, diasParaPagar: 20,
  periodo: {
    fechaCorte: '2026-01-10', fechaLimitePago: '2026-01-30',
    saldoAnterior: 1000, saldoNuevo: 1674, saldoDiferido: 300,
    pagoMinimo: 194, pagoMinimoConMeses: 394, pagoNoIntereses: 1674,
  },
  movimientos: [
    { fecha: '2026-01-02', descripcion: 'SUPER DEL BARRIO', monto: 800, tipo: 'compra', categoria: 'Súper' },
    { fecha: '2026-01-03', descripcion: 'MUEBLERIA 03M',    monto: 200, tipo: 'mensualidad' },
    { fecha: '2026-01-10', descripcion: 'INTERESES',        monto: 150, tipo: 'interes' },
    { fecha: '2026-01-10', descripcion: 'IVA DE INTERESES', monto: 24,  tipo: 'iva' },
    { fecha: '2026-01-05', descripcion: 'PAGO RECIBIDO',    monto: 500, tipo: 'abono' },
  ],
};

/* El corte que sigue: se pagó de más, así que deja excedente.
   1,674.00 + 100 − 1,774.00 = 0 ... se paga 1,900 → excedente de 126.00 */
const CORTE_EXCEDENTE = {
  tipo: 'estado_de_cuenta', tarjeta: 'Prueba Uno', ultimos4: '1111', banco: 'Banco Falso',
  periodo: {
    fechaCorte: '2026-02-10', fechaLimitePago: '2026-03-02',
    saldoAnterior: 1674, saldoNuevo: 100, saldoDiferido: 200,
    pagoMinimo: 100, pagoNoIntereses: 100,
  },
  movimientos: [
    { fecha: '2026-02-01', descripcion: 'FARMACIA',     monto: 100,  tipo: 'compra', categoria: 'Salud' },
    { fecha: '2026-01-25', descripcion: 'PAGO EN LINEA', monto: 1800, tipo: 'abono' },
  ],
};

/* Un corte vigente, fechado dos días atrás: un pago hecho el mismo día del
   corte cae DENTRO del periodo, no en la ventana de pago, y entonces la
   prueba estaría midiendo otra cosa. */
const CORTE_VIGENTE = {
  tipo: 'estado_de_cuenta', tarjeta: 'Prueba Dos', banco: 'Otro Banco', ultimos4: '2222',
  limite: 5000, tasaAnual: 72, diaCorte: Number(iso(masDias(hoy, -2)).slice(8)), diasParaPagar: 20,
  periodo: {
    fechaCorte: iso(masDias(hoy, -2)), fechaLimitePago: iso(masDias(hoy, 18)),
    saldoAnterior: 0, saldoNuevo: 2000, pagoMinimo: 300, pagoNoIntereses: 2000,
  },
  movimientos: [
    { fecha: iso(masDias(hoy, -20)), descripcion: 'GASOLINERA', monto: 1200, tipo: 'compra', categoria: 'Gasolina' },
    { fecha: iso(masDias(hoy, -15)), descripcion: 'RESTAURANTE', monto: 800, tipo: 'compra', categoria: 'Comida' },
  ],
};

/* ---------- arranque ------------------------------------------------------ */
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
pagina.on('pageerror', e => fallaron.push('error de JS en la página: ' + e.message));
await pagina.goto(`http://127.0.0.1:${puerto}/`);
const enApp = (fn, arg) => pagina.evaluate(fn, arg);

for (const lote of [CORTE_VIEJO, CORTE_EXCEDENTE, CORTE_VIGENTE]) {
  await enApp(l => { aplicarLote(l); guardar(); }, lote);
}

console.log('\nLo que la app entendió de los datos');
revisa('se crearon dos tarjetas, no tres', await enApp(() => D.tarjetas.length), 2);
revisa('los tres cortes entraron',          await enApp(() => D.periodos.length), 3);
revisa('entraron todos los movimientos',    await enApp(() => D.movimientos.length),
  CORTE_VIEJO.movimientos.length + CORTE_EXCEDENTE.movimientos.length + CORTE_VIGENTE.movimientos.length);

console.log('\nEl mismo corte cargado dos veces no se duplica');
await enApp(l => { aplicarLote(l); guardar(); }, CORTE_VIEJO);
revisa('sigue habiendo tres cortes',        await enApp(() => D.periodos.length), 3);
revisa('no se repitió ningún movimiento',   await enApp(() => D.movimientos.length),
  CORTE_VIEJO.movimientos.length + CORTE_EXCEDENTE.movimientos.length + CORTE_VIGENTE.movimientos.length);

console.log('\nUn lote con el nombre escrito distinto va a la misma tarjeta');
await enApp(() => { aplicarLote({
  tipo: 'estado_de_cuenta', tarjeta: 'PRUEBA UNO (la de siempre)',
  banco: 'Banco Falso', ultimos4: '1111',
  movimientos: [{ fecha: '2026-02-15', descripcion: 'CAFE', monto: 55, tipo: 'compra' }],
}); guardar(); });
revisa('no nació una tarjeta duplicada',    await enApp(() => D.tarjetas.length), 2);
revisa('el movimiento cayó en la tarjeta 1111', await enApp(() => {
  const t = D.tarjetas.find(x => x.ultimos4 === '1111');
  return movsDe(t.id).filter(m => m.descripcion === 'CAFE').length;
}), 1);

console.log('\nLa conciliación de cada corte');
revisa('el corte de enero cuadra en cero', await enApp(() => {
  const p = D.periodos.find(x => x.fechaCorte === '2026-01-10');
  const m = movsDelPeriodo(p);
  const cargos = m.filter(x => TIPOS[x.tipo].suma === 1).reduce((a, b) => a + b.monto, 0);
  const abonos = m.filter(x => TIPOS[x.tipo].suma === -1).reduce((a, b) => a + b.monto, 0);
  return Math.round((p.saldoAnterior + cargos - abonos - p.saldoNuevo) * 100) / 100;
}), 0);
revisa('los cargos del periodo son 1,174', await enApp(() => {
  const p = D.periodos.find(x => x.fechaCorte === '2026-01-10');
  return movsDelPeriodo(p).filter(x => TIPOS[x.tipo].suma === 1).reduce((a, b) => a + b.monto, 0);
}), 1174);
/* El mismo corte tiene pagos en los dos lados y es lo que más confunde: el del
   día 5 cayó dentro del periodo y ya viene restado del saldo; el del 25 cayó
   después del corte y es el que lo liquida. */
revisa('el pago de antes del corte es pago DEL periodo', await enApp(() => {
  const p = D.periodos.find(x => x.fechaCorte === '2026-01-10');
  return movsDelPeriodo(p).filter(esPago).map(m => m.descripcion).join(',');
}), 'PAGO RECIBIDO');
revisa('el pago de después del corte es el que lo liquida', await enApp(() => {
  const p = D.periodos.find(x => x.fechaCorte === '2026-01-10');
  return abonosDelPeriodo(p).map(m => m.descripcion).join(',');
}), 'PAGO EN LINEA');

console.log('\nLos dos mínimos cuando hay compras a meses');
revisa('el mínimo que ofrece es el que incluye la mensualidad', await enApp(() => {
  const p = D.periodos.find(x => x.fechaCorte === '2026-01-10');
  return minimoEfectivo(p);
}), 394);
revisa('si no hay saldo a meses usa el mínimo a secas', await enApp(f => {
  const p = D.periodos.find(x => x.fechaCorte === f);
  return p ? minimoEfectivo(p) : null;
}, CORTE_VIGENTE.periodo.fechaCorte), 300);

console.log('\nEl excedente de un pago que superó el saldo del corte');
revisa('el corte de enero recibió 126.00 de más', await enApp(() => {
  const p = D.periodos.find(x => x.fechaCorte === '2026-01-10');
  return Math.round(estadoPago(p).excedente * 100) / 100;
}), 126);
revisa('y por eso el corte de enero quedó liquidado', await enApp(() => {
  const p = D.periodos.find(x => x.fechaCorte === '2026-01-10');
  return estadoPago(p).clave;
}), 'total');

console.log('\nQué cuenta como dinero tuyo');
revisa('una bonificación baja el saldo pero no es pago tuyo', await enApp(f => {
  const t = D.tarjetas.find(x => x.ultimos4 === '2222');
  aplicarLote({ tipo: 'estado_de_cuenta', tarjetaId: t.id, tarjeta: 'Prueba Dos',
    movimientos: [{ fecha: f, descripcion: 'CASHBACK', monto: 90, tipo: 'bonificacion' }] });
  const m = D.movimientos.find(x => x.descripcion === 'CASHBACK');
  return [bajaSaldo(m), esPago(m)].join('/');
}, iso(masDias(hoy, -1))), 'true/false');

console.log('\nEl corte vigente todavía no vence');
revisa('aparece como pendiente, no como vencido', await enApp(() => {
  const p = D.periodos.find(x => x.tarjetaId === D.tarjetas.find(t => t.ultimos4 === '2222').id);
  const e = estadoPago(p);
  return e.venceEn > 0 && ['pendiente', 'parcial'].includes(e.clave);
}), true);

console.log('\nEl saldo de la tarjeta sale del corte más reciente');
revisa('la tarjeta 2222 debe 2,000 menos el cashback', await enApp(() => {
  const t = D.tarjetas.find(x => x.ultimos4 === '2222');
  return Math.round(saldoTarjeta(t.id) * 100) / 100;
}), 1910);

console.log('\nEl filtro por tarjeta de Estados de cuenta');
revisa('filtrando la tarjeta 1111 quedan sus dos cortes', await enApp(() => {
  const t = D.tarjetas.find(x => x.ultimos4 === '1111');
  return D.periodos.filter(p => p.tarjetaId === t.id).length;
}), 2);

await navegador.close(); servidor.close();
console.log(`\n${pasaron} pruebas pasaron, ${fallaron.length} fallaron`);
if (fallaron.length) { fallaron.forEach(f => console.log('  - ' + f)); process.exit(1); }
