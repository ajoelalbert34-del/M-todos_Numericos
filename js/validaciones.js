function validarFuncion(expr) {
  if (!expr || expr.trim() === '') {
    return { valido: false, mensaje: 'La función no puede estar vacía.' };
  }
  const s = prepareMathExpression(expr);
  const compiled = compileMathExpression(s);
  if (!compiled) {
    return { valido: false, mensaje: 'Función inválida. Verifique la sintaxis matemática.' };
  }
  return { valido: true, compilada: compiled };
}

function validarLimites(a, b) {
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (isNaN(na) || isNaN(nb)) {
    return { valido: false, mensaje: 'Los límites deben ser números válidos.' };
  }
  if (nb <= na) {
    return { valido: false, mensaje: 'El límite superior debe ser mayor que el inferior.' };
  }
  return { valido: true, a: na, b: nb };
}

function validarNCompuesto(n) {
  const nn = parseInt(n, 10);
  if (isNaN(nn) || nn !== parseFloat(n)) {
    return { valido: false, mensaje: 'n debe ser un número entero.' };
  }
  if (nn < 3) {
    return { valido: false, mensaje: 'n debe ser mayor o igual a 3.' };
  }
  if (nn % 3 !== 0) {
    return { valido: false, mensaje: 'Para Simpson 3/8 compuesto, n debe ser múltiplo de 3.' };
  }
  return { valido: true, n: nn };
}

function validarEvaluacionPuntos(compiledExpr, puntos) {
  for (let i = 0; i < puntos.length; i++) {
    const val = evaluateFunction(compiledExpr, puntos[i]);
    if (isNaN(val) || !isFinite(val)) {
      return {
        valido: false,
        mensaje: 'No se pudo evaluar la función en x = ' + formatNumber(puntos[i]) + '. Verifique que la función esté definida en todo el intervalo.'
      };
    }
  }
  return { valido: true };
}

function validarIExacta(val) {
  if (val === undefined || val === null || val.trim() === '') {
    return { valido: true, tieneExacta: false, I_exacta: null };
  }
  const nv = parseFloat(val);
  if (isNaN(nv)) {
    return { valido: false, mensaje: 'El valor exacto debe ser un número válido.' };
  }
  return { valido: true, tieneExacta: true, I_exacta: nv };
}
