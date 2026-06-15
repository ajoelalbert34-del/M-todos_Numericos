function lagrangeP3(xPts, yPts, x) {
  let result = 0;
  for (let k = 0; k < 4; k++) {
    let Lk = 1;
    for (let j = 0; j < 4; j++) {
      if (j !== k) {
        Lk *= (x - xPts[j]) / (xPts[k] - xPts[j]);
      }
    }
    result += yPts[k] * Lk;
  }
  return result;
}

function buildP3Trace(xPts, yPts, samples = 120) {
  const xs = [];
  const ys = [];
  const x0 = xPts[0];
  const x3 = xPts[3];
  for (let i = 0; i <= samples; i++) {
    const x = x0 + (x3 - x0) * i / samples;
    xs.push(x);
    ys.push(lagrangeP3(xPts, yPts, x));
  }
  return { xs, ys };
}

function plotFunction(funcExpr, a, b, puntos, coeficientes, bloques, containerId, mode) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const numPoints = 350;
  const dx = (b - a) / numPoints;
  const xVals = [];
  const yVals = [];
  for (let i = 0; i <= numPoints; i++) {
    const xi = a + i * dx;
    xVals.push(xi);
    const yi = evaluateFunction(funcExpr, xi);
    yVals.push(isFinite(yi) ? yi : null);
  }

  const traces = [];
  const ptY = puntos.map(x => evaluateFunction(funcExpr, x));

  // Curva real: se conserva simple para no romper el hover nativo de Plotly.
  traces.push({
    x: xVals,
    y: yVals,
    type: 'scatter',
    mode: 'lines',
    name: 'f(x)',
    line: { color: '#ffb77b', width: 2.8 },
    hovertemplate: '(%{x:.4f}, %{y:.4f})<extra>f(x)</extra>'
  });

  // Líneas verticales en nodos Simpson.
  for (let i = 0; i < puntos.length; i++) {
    traces.push({
      x: [puntos[i], puntos[i]],
      y: [0, ptY[i]],
      type: 'scatter',
      mode: 'lines',
      name: `x${i}`,
      line: { color: 'rgba(160,141,128,0.45)', width: 1, dash: 'dot' },
      showlegend: false,
      hoverinfo: 'skip'
    });
  }

  const fillColors = ['rgba(200,128,63,0.15)', 'rgba(173,212,97,0.11)', 'rgba(233,193,118,0.10)'];
  const p3Colors = ['#c8803f', '#add461', '#e9c176', '#a08d80'];

  // Área aproximada y polinomio cúbico interpolante P3 por bloque.
  for (let bIndex = 0; bIndex < bloques.length; bIndex++) {
    const idx0 = bIndex * 3;
    if (idx0 + 3 >= puntos.length) continue;
    const xPts = [puntos[idx0], puntos[idx0 + 1], puntos[idx0 + 2], puntos[idx0 + 3]];
    const yPts = [ptY[idx0], ptY[idx0 + 1], ptY[idx0 + 2], ptY[idx0 + 3]];
    const p3 = buildP3Trace(xPts, yPts, 120);
    const color = p3Colors[bIndex % p3Colors.length];
    const fill = fillColors[bIndex % fillColors.length];

    traces.push({
      x: p3.xs,
      y: p3.ys,
      type: 'scatter',
      mode: 'lines',
      name: `Área B${bloques[bIndex].indice}`,
      line: { color: 'rgba(0,0,0,0)', width: 0 },
      fill: 'tozeroy',
      fillcolor: fill,
      showlegend: false,
      hoverinfo: 'skip'
    });

    traces.push({
      x: p3.xs,
      y: p3.ys,
      type: 'scatter',
      mode: 'lines',
      name: `P₃ Bloque ${bloques[bIndex].indice}`,
      line: { color, width: 3, dash: 'dash' },
      hoverinfo: 'skip'
    });

    const midX = (xPts[0] + xPts[3]) / 2;
    const midY = Math.max(...yPts.map(v => Math.abs(v))) * 1.08;
    traces.push({
      x: [midX],
      y: [midY],
      type: 'scatter',
      mode: 'text',
      text: [`Bloque ${bloques[bIndex].indice}`],
      textfont: { color: '#e9c176', size: 11, family: 'JetBrains Mono, monospace' },
      showlegend: false,
      hoverinfo: 'skip'
    });
  }

  // Nodos Simpson al final para que queden encima de todo.
  traces.push({
    x: puntos,
    y: ptY,
    type: 'scatter',
    mode: 'markers',
    name: 'xᵢ',
    marker: {
      color: '#c8803f',
      size: 11,
      symbol: 'circle',
      line: { color: '#121416', width: 2 }
    },
    hovertemplate: '(%{x:.4f}, %{y:.4f})<extra>xᵢ</extra>'
  });

  const layout = {
    title: {
      text: `Método de Simpson 3/8 ${mode === 'simple' ? 'Simple' : 'Compuesto'} `,
      font: { color: '#e9e6df', size: 15, family: 'Space Grotesk, Inter, sans-serif' }
    },
    xaxis: {
      title: { text: 'x', font: { color: '#e9e6df' } },
      zeroline: true,
      zerolinecolor: '#524439',
      gridcolor: 'rgba(82,68,57,0.42)',
      color: '#e9e6df'
    },
    yaxis: {
      title: { text: 'f(x)', font: { color: '#e9e6df' } },
      zeroline: true,
      zerolinecolor: '#524439',
      gridcolor: 'rgba(82,68,57,0.42)',
      color: '#e9e6df'
    },
    plot_bgcolor: '#1e2022',
    paper_bgcolor: '#1e2022',
    margin: { l: 55, r: 35, t: 58, b: 52 },
    legend: {
      font: { color: '#e9e6df', size: 11 },
      bgcolor: 'rgba(30,32,34,0.92)',
      bordercolor: '#524439',
      borderwidth: 1
    },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: '#ffb77b',
      bordercolor: '#121416',
      font: { color: '#121416', family: 'JetBrains Mono, monospace', size: 12 }
    }
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: 'simpson38_grafica',
      scale: 2
    }
  };

  Plotly.newPlot(containerId, traces, layout, config);
}

function buildBloques(puntos, n) {
  const bloques = [];
  const numBloques = n / 3;
  for (let b = 0; b < numBloques; b++) {
    bloques.push({
      indice: b + 1,
      inicio: puntos[b * 3],
      fin: puntos[(b + 1) * 3]
    });
  }
  return bloques;
}

function generarPuntosSimulador(a, b, n) {
  const h = (b - a) / n;
  const numPuntos = n + 1;
  const puntos = [];
  for (let i = 0; i < numPuntos; i++) {
    puntos.push(a + i * h);
  }
  return { puntos, h };
}

function ejecutarSimulador(mathField, aInput, bInput, modoSelect, nInput, exactaInput, graficoContainerId, alertaId, infoId, errorSectionId) {
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

  const modo = modoSelect.value || 'simple';
  let n;

  if (modo === 'simple') {
    n = 3;
  } else {
    const valN = validarNCompuesto(nInput.value);
    if (!valN.valido) {
      showAlert(alertaId, valN.mensaje, 'error');
      return null;
    }
    n = valN.n;
  }

  // Generar puntos sin redondear para la gráfica Plotly
  const { puntos: puntosGrafica, h: hGrafica } = generarPuntosSimulador(valLim.a, valLim.b, n);

  const valPts = validarEvaluacionPuntos(valFunc.compilada, puntosGrafica);
  if (!valPts.valido) {
    showAlert(alertaId, valPts.mensaje, 'error');
    return null;
  }

  const valExacta = validarIExacta(exactaInput.value);
  if (!valExacta.valido) {
    showAlert(alertaId, valExacta.mensaje, 'error');
    return null;
  }

  let resultado;
  if (modo === 'simple') {
    resultado = SimpsonSimple(valLim.a, valLim.b, valFunc.compilada, precisionConfig);
  } else {
    resultado = SimpsonCompuesto(valLim.a, valLim.b, n, valFunc.compilada, precisionConfig);
  }

  const errores = calcularErrores(resultado.I_simpson, valExacta.I_exacta);

  const bloques = buildBloques(resultado.puntos, n);

  // Gráfica con precisión completa para suavidad visual
  plotFunction(valFunc.compilada, valLim.a, valLim.b, resultado.puntos, resultado.coeficientes, bloques, graficoContainerId, modo);

  let infoHTML = `
    <h3>Información del Cálculo</h3>
    <p><strong>h =</strong> ${formatByPrecision(resultado.h, precisionConfig)}</p>
    <p><strong>n =</strong> ${n}</p>
    <p><strong>Puntos =</strong> n + 1 = ${n + 1}</p>
    <p><strong>I<sub>Simpson</sub> &asymp;</strong> <span class="result-value">${formatByPrecision(resultado.I_simpson, precisionConfig)}</span></p>
  `;

  if (valExacta.tieneExacta) {
    infoHTML += `<p><strong>Error absoluto:</strong> ${formatByPrecision(errores.Ea, precisionConfig)}</p>`;
    if (!errores.exactaCero) {
      infoHTML += `<p><strong>Error porcentual:</strong> ${formatByPrecision(errores.Ep, precisionConfig)}%</p>`;
    } else {
      infoHTML += '<p class="note">Error porcentual no calculable (I<sub>exacta</sub> = 0).</p>';
    }
  }

  let bloquesHTML = '<h3>Bloques del Método</h3>';
  for (const blk of bloques) {
    bloquesHTML += `<p>Bloque ${blk.indice}: [${formatByPrecision(blk.inicio, precisionConfig)}, ${formatByPrecision(blk.fin, precisionConfig)}]</p>`;
  }

  document.getElementById(infoId).innerHTML = infoHTML;
  document.getElementById('sim-bloques').innerHTML = bloquesHTML;

  showAlert(alertaId, 'Simulación realizada correctamente.', 'success');
  return { resultado, errores, bloques, puntos: resultado.puntos, h: resultado.h, modo };
}
