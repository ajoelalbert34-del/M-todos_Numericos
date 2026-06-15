function renderFormula(elementId, latex) {
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    katex.render(latex, el, { throwOnError: false, displayMode: true });
  } catch (e) {
    el.textContent = latex;
  }
}

function renderFormulasSimpsonSimple(a, b, h, puntos, precisionConfig) {
  var aStr = formatByPrecision(a, precisionConfig);
  var bStr = formatByPrecision(b, precisionConfig);
  var hStr = formatByPrecision(h, precisionConfig);
  renderFormula('formula-integral', 'I = \\int_a^b f(x)\\,dx');
  renderFormula('formula-h', 'h = \\frac{' + bStr + '-(' + aStr + ')}{3} = ' + hStr);
  var ptsLatex = '';
  for (var i = 0; i < puntos.length; i++) {
    ptsLatex += 'x_' + i + '=' + formatByPrecision(puntos[i], precisionConfig);
    if (i < puntos.length - 1) ptsLatex += ',\\ ';
  }
  renderFormula('formula-puntos', 'x_i = a + i h \\quad\\Rightarrow\\quad ' + ptsLatex);
  renderFormula('formula-simpson',
    'I \\approx \\frac{3h}{8}\\left[f(x_0)+3f(x_1)+3f(x_2)+f(x_3)\\right]');
}

function renderFormulasSimpsonCompuesto(a, b, h, n, precisionConfig) {
  var aStr = formatByPrecision(a, precisionConfig);
  var bStr = formatByPrecision(b, precisionConfig);
  var hStr = formatByPrecision(h, precisionConfig);
  renderFormula('formula-integral', 'I = \\int_a^b f(x)\\,dx');
  renderFormula('formula-h', 'h = \\frac{' + bStr + '-(' + aStr + ')}{' + n + '} = ' + hStr);
  renderFormula('formula-puntos', 'x_i = a + i h,\\quad i = 0,1,\\ldots,' + n);
  renderFormula('formula-simpson',
    'I \\approx \\frac{3h}{8}\\sum_{i=0}^{n} C_i f(x_i)');
  renderFormula('formula-coef',
    'C_i = \\begin{cases} 1, & i=0 \\text{ o } i=n \\\\ 2, & i \\equiv 0 \\pmod{3},\\ 0<i<n \\\\ 3, & i \\not\\equiv 0 \\pmod{3} \\end{cases}');
}

function renderFormulaErrores(I_simpson, I_exacta, Ea, Er, Ep, exactaCero) {
  if (I_exacta === null || I_exacta === undefined) {
    document.getElementById('error-section').classList.add('hidden');
    return;
  }
  document.getElementById('error-section').classList.remove('hidden');
  renderFormula('formula-ea', `E_a = |I_{\\text{exacta}} - I_{\\text{Simpson}}| = ${formatScientific(Ea)}`);
  if (exactaCero) {
    renderFormula('formula-er', 'E_r: No calculable (I_{\\text{exacta}} = 0)');
    renderFormula('formula-ep', 'E_{\\%}: No calculable (I_{\\text{exacta}} = 0)');
  } else {
    renderFormula('formula-er', `E_r = \\frac{E_a}{|I_{\\text{exacta}}|} = ${formatScientific(Er)}`);
    renderFormula('formula-ep', `E_{\\%} = E_r \\cdot 100 = ${formatNumber(Ep, 4)}\\%`);
  }
}
