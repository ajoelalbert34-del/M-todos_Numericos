function SimpsonSimple(a, b, compiledExpr, precisionConfig) {
  const n = 3;
  var hFull = (b - a) / n;
  var h = precisionConfig ? applyStepPrecision(hFull, precisionConfig) : hFull;

  var puntos = [];
  for (let i = 0; i <= n; i++) {
    if (i === n && precisionConfig) {
      puntos.push(b);
    } else {
      var xiFull = a + i * h;
      puntos.push(precisionConfig ? applyStepPrecision(xiFull, precisionConfig) : xiFull);
    }
  }

  var fValores = puntos.map(function (x) {
    var fiFull = evaluateFunction(compiledExpr, x);
    return precisionConfig ? applyStepPrecision(fiFull, precisionConfig) : fiFull;
  });

  var coeficientes = [1, 3, 3, 1];
  var Cfi = coeficientes.map(function (c, i) {
    var CfiFull = c * fValores[i];
    return precisionConfig ? applyStepPrecision(CfiFull, precisionConfig) : CfiFull;
  });

  var sumaFull = Cfi.reduce(function (acc, v) { return acc + v; }, 0);
  var suma = precisionConfig ? applyStepPrecision(sumaFull, precisionConfig) : sumaFull;

  var IFull = (3 * h / 8) * suma;
  var I_simpson = precisionConfig ? applyStepPrecision(IFull, precisionConfig) : IFull;

  return {
    n: n,
    h: h,
    puntos: puntos,
    fValores: fValores,
    coeficientes: coeficientes,
    Cfi: Cfi,
    suma: suma,
    I_simpson: I_simpson
  };
}

function ejecutarSimpsonSimple(mathField, aInput, bInput, exactaInput, alertaId, resultId, desarrolloId, tablaId, errorSectionId) {
  clearAlert(alertaId);

  var precisionConfig = getPrecisionConfig();

  const exprRaw = mathField ? mathFieldToExpression(mathField) : '';
  if (!exprRaw) {
    showAlert(alertaId, 'Ingrese una función válida.', 'error');
    return null;
  }

  const valFunc = validarFuncion(exprRaw);
  if (!valFunc.valido) {
    showAlert(alertaId, valFunc.mensaje, 'error');
    return null;
  }

  const valLim = validarLimites(aInput.value, bInput.value);
  if (!valLim.valido) {
    showAlert(alertaId, valLim.mensaje, 'error');
    return null;
  }

  const resultado = SimpsonSimple(valLim.a, valLim.b, valFunc.compilada, precisionConfig);

  const valPts = validarEvaluacionPuntos(valFunc.compilada, resultado.puntos);
  if (!valPts.valido) {
    showAlert(alertaId, valPts.mensaje, 'error');
    return null;
  }

  const valExacta = validarIExacta(exactaInput.value);
  if (!valExacta.valido) {
    showAlert(alertaId, valExacta.mensaje, 'error');
    return null;
  }

  const errores = calcularErrores(resultado.I_simpson, valExacta.I_exacta);

  renderFormulasSimpsonSimple(valLim.a, valLim.b, resultado.h, resultado.puntos, precisionConfig);

  const tablaHTML = renderTablaSimple(resultado.puntos, resultado.fValores, resultado.coeficientes, resultado.Cfi, precisionConfig);
  document.getElementById(tablaId).innerHTML = tablaHTML;

  document.getElementById(resultId).innerHTML = `
    <h3>Resultado</h3>
    <p><strong>I<sub>Simpson</sub> &asymp;</strong> <span class="result-value">${formatByPrecision(resultado.I_simpson, precisionConfig)}</span></p>
  `;

  if (valExacta.tieneExacta) {
    document.getElementById(errorSectionId).classList.remove('hidden');
    document.getElementById(errorSectionId).innerHTML = `
      <p><strong>I<sub>exacta</sub>:</strong> ${formatByPrecision(valExacta.I_exacta, precisionConfig)}</p>
      <p><strong>Error absoluto (E<sub>a</sub>):</strong> ${formatByPrecision(errores.Ea, precisionConfig)}</p>
      ${errores.exactaCero
        ? '<p class="note">El error relativo y porcentual no se pueden calcular porque el valor exacto es 0.</p>'
        : `<p><strong>Error relativo (E<sub>r</sub>):</strong> ${formatByPrecision(errores.Er, precisionConfig)}</p>
           <p><strong>Error porcentual (E<sub>%</sub>):</strong> ${formatByPrecision(errores.Ep, precisionConfig)}%</p>`
      }
    `;
  } else {
    document.getElementById(errorSectionId).classList.add('hidden');
  }

  showAlert(alertaId, 'Cálculo realizado correctamente.', 'success');

  document.getElementById(desarrolloId).classList.remove('hidden');

  return { ...resultado, errores, valExacta, valLim, valFunc };
}
