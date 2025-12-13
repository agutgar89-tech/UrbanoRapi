// api/scoring.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
    }

  try {
    const body = req.body && typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const {
      id_cliente,
      edad,
      antig_domicilio_anios,
      tipo_ocupacion,
      ingreso_mensual,
      cuota_mensual,
      otras_deudas,
      tipo_comprobacion,
      prestamos_previos,
      max_dias_atraso,
      reingreso_tipo,
      horas_envio_docs,
      firma_contrato,
      monto_solicitado // opcional
    } = body || {};

    // --- 1. Funciones de puntos ---

    const numOrZero = (v) =>
      typeof v === "number" && !isNaN(v) ? v : 0;

    const text = (v) =>
      typeof v === "string" ? v.trim() : "";

    const Puntos_Edad = (() => {
      const e = numOrZero(edad);
      if (e >= 22 && e <= 55) return 10;
      if (e >= 18 && e <= 21) return 6;
      if (e > 55) return 4;
      return 0;
    })();

    const Puntos_Domicilio = (() => {
      const a = numOrZero(antig_domicilio_anios);
      if (a > 3) return 10;
      if (a >= 1 && a <= 3) return 6;
      if (a > 0 && a < 1) return 3;
      return 0;
    })();

    const Puntos_Ocupacion = (() => {
      const t = text(tipo_ocupacion);
      if (t === "Empleado_nomina") return 5;
      if (t === "Negocio_propio") return 4;
      if (t === "Informal") return 2;
      return 0;
    })();

    const Puntos_Cuota_Ingreso = (() => {
      const ingreso = numOrZero(ingreso_mensual);
      const cuota = numOrZero(cuota_mensual);
      if (ingreso <= 0 || cuota <= 0) return 0;
      const ratio = cuota / ingreso;
      if (ratio <= 0.20) return 15;
      if (ratio <= 0.30) return 10;
      if (ratio <= 0.40) return 5;
      return 0;
    })();

    const Puntos_Otras_Deudas = (() => {
      const d = text(otras_deudas);
      if (d === "Ninguna") return 10;
      if (d === "Baja") return 6;
      if (d === "Media") return 2;
      if (d === "Alta") return 0;
      return 0;
    })();

    const Puntos_Comprobacion_Ingresos = (() => {
      const t = text(tipo_comprobacion);
      if (t === "Comprobable") return 5;
      if (t === "Mixto") return 3;
      if (t === "No_comprobable") return 1;
      return 0;
    })();

    const Puntos_Prestamos_Previos = (() => {
      const p = numOrZero(prestamos_previos);
      if (p >= 2) return 10;
      if (p === 1) return 7;
      if (p === 0) return 5;
      return 0;
    })();

    const Puntos_Max_Atraso = (() => {
      const d = numOrZero(max_dias_atraso);
      if (d <= 7) return 10;
      if (d >= 8 && d <= 15) return 6;
      if (d >= 16 && d <= 30) return 3;
      return 0; // >30 días
    })();

    const Puntos_Reingreso = (() => {
      const r = text(reingreso_tipo);
      if (r === "Reingreso_limpio") return 10;
      if (r === "Reingreso_atraso_leve") return 6;
      if (r === "Reingreso_atraso_fuerte") return 2;
      if (r === "Sin_historial") return 5;
      return 0;
    })();

    const Puntos_Tiempo_Docs = (() => {
      const h = numOrZero(horas_envio_docs);
      if (h < 2) return 8;
      if (h <= 24) return 5;
      if (h > 24) return 2;
      return 0;
    })();

    const Puntos_Firma_Contrato = (() => {
      const f = text(firma_contrato);
      if (f === "Primer_intento") return 7;
      if (f === "Uno_dos_recordatorios") return 4;
      if (f === "Muchos_recordatorios") return 2;
      if (f === "No_firmo") return 0;
      return 0;
    })();

    // --- 2. Suma del score ---

    const score_detalle = {
      Puntos_Edad,
      Puntos_Domicilio,
      Puntos_Ocupacion,
      Puntos_Cuota_Ingreso,
      Puntos_Otras_Deudas,
      Puntos_Comprobacion_Ingresos,
      Puntos_Prestamos_Previos,
      Puntos_Max_Atraso,
      Puntos_Reingreso,
      Puntos_Tiempo_Docs,
      Puntos_Firma_Contrato
    };

    const score_total = Object.values(score_detalle).reduce(
      (acc, v) => acc + (typeof v === "number" ? v : 0),
      0
    );

    // --- 3. Banda de riesgo y política ---

    let banda_riesgo = "D";
    let banda_label = "Alto";
    let decision = "RECHAZADO";
    let comentario =
      "Riesgo alto, no se recomienda autorizar crédito.";
    let max_monto_por_banda = 0;

    if (score_total >= 80) {
      banda_riesgo = "A";
      banda_label = "Muy bueno";
      decision = "APROBADO";
      comentario =
        "Cliente muy buen riesgo, se recomienda monto máximo dentro de política.";
      max_monto_por_banda = 3000; // ajusta a tu realidad
    } else if (score_total >= 65) {
      banda_riesgo = "B";
      banda_label = "Bueno";
      decision = "APROBADO";
      comentario =
        "Cliente buen riesgo, se recomienda monto medio.";
      max_monto_por_banda = 2000;
    } else if (score_total >= 50) {
      banda_riesgo = "C";
      banda_label = "Regular";
      decision = "APROBADO_RESTRINGIDO";
      comentario =
        "Cliente riesgo regular, aprobar solo monto bajo y plazo corto.";
      max_monto_por_banda = 1000;
    }

    const montoSolicitadoNum = numOrZero(monto_solicitado);
    const monto_sugerido =
      montoSolicitadoNum > 0
        ? Math.min(montoSolicitadoNum, max_monto_por_banda)
        : max_monto_por_banda;

    // --- 4. Respuesta para SendPulse ---

    return res.status(200).json({
      id_cliente: id_cliente || null,
      score_total,
      banda_riesgo,
      banda_label,
      decision,
      monto_sugerido,
      comentario,
      detalle: score_detalle
    });
  } catch (err) {
    console.error("Error en scoring:", err);
    return res.status(500).json({
      error: "Error interno en el cálculo de scoring.",
      detalle: String(err)
    });
  }
}
