function navigateTo(path) {
  window.location.href = path;
}

function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function formatNumber(val, decimals = 8) {
  if (val === undefined || val === null || isNaN(val)) return '---';
  return Number(val).toFixed(decimals);
}

function formatScientific(val, decimals = 6) {
  if (val === undefined || val === null || isNaN(val)) return '---';
  if (Math.abs(val) < 0.0001 || Math.abs(val) >= 100000) {
    return Number(val).toExponential(decimals);
  }
  return Number(val).toFixed(decimals);
}

function showAlert(containerId, message, type) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const cls = type === 'error' ? 'alert-error' : type === 'warning' ? 'alert-warning' : 'alert-success';
  container.innerHTML = `<div class="alert ${cls}"><span>${message}</span></div>`;
}

function clearAlert(containerId) {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = '';
}

function showElement(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function hideElement(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function waitForMathLive(timeout = 5000) {
  return new Promise(function (resolve, reject) {
    if (customElements.get('math-field')) {
      resolve();
      return;
    }
    var start = Date.now();
    var interval = setInterval(function () {
      if (customElements.get('math-field')) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error('MathLive no cargó a tiempo'));
      }
    }, 100);
  });
}

function prepareMathExpression(expr) {
  if (!expr || typeof expr !== 'string') return '';
  var s = expr.trim();
  s = s.replace(/^f\s*\(\s*x\s*\)\s*=?\s*/i, '');
  s = s.replace(/\\left\.?/g, '');
  s = s.replace(/\\right\.?/g, '');
  s = s.replace(/\\,/g, '');
  s = s.replace(/\\;/g, '');
  s = s.replace(/\\:/g, '');
  s = s.replace(/\\!/g, '');
  s = s.replace(/\\cdot/g, '*');
  s = s.replace(/\\times/g, '*');
  s = s.replace(/\\frac\{([^{}]*(?:\{[^}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^}]*\}[^{}]*)*)\}/g, '(($1)/($2))');
  s = s.replace(/\\sqrt\s*\{([^}]*)\}/g, 'sqrt($1)');
  s = s.replace(/\\pi/g, 'pi');
  s = s.replace(/\\sin/g, 'sin');
  s = s.replace(/\\cos/g, 'cos');
  s = s.replace(/\\tan/g, 'tan');
  s = s.replace(/\\ln/g, 'ln');
  s = s.replace(/\\log/g, 'log');
  s = s.replace(/\\exp/g, 'exp');
  s = s.replace(/\\operatorname\{sen\}/gi, 'sin');
  s = s.replace(/\^\{([^}]*)\}/g, '^($1)');
  s = s.replace(/\\frac/g, '/');
  s = s.replace(/\\div/g, '/');
  s = s.replace(/\{/g, '(');
  s = s.replace(/\}/g, ')');
  s = s.replace(/sen\s*\(/gi, 'sin(');
  s = s.replace(/\be\^/gi, 'exp(');
  s = s.replace(/\s+/g, '');
  if (s.length === 0) s = '0';
  return s;
}

function normalizeMathExpression(expr) {
  if (!expr || typeof expr !== 'string') return '';
  var s = expr.trim();

  // 1. Remove f(x)= prefix
  s = s.replace(/^f\s*\(\s*x\s*\)\s*=?\s*/i, '');

  // 2. Remove LaTeX spacing/formatting commands
  s = s.replace(/\\left\.?/g, '');
  s = s.replace(/\\right\.?/g, '');
  s = s.replace(/\\,/g, '');
  s = s.replace(/\\;/g, '');
  s = s.replace(/\\:/g, '');
  s = s.replace(/\\!/g, '');

  // 3. Handle log-base notation BEFORE converting \log — prevents
  //     stray backslashes like \log10 when \log_ is followed by _
  s = s.replace(/\\log\s*_\s*\{10\}/g, 'log10');

  // 4. Convert LaTeX function names to math.js equivalents
  s = s.replace(/\\ln\b/g, 'log');
  s = s.replace(/\\log\b/g, 'log');
  s = s.replace(/\\exp\b/g, 'exp');
  s = s.replace(/\\sin\b/g, 'sin');
  s = s.replace(/\\cos\b/g, 'cos');
  s = s.replace(/\\tan\b/g, 'tan');
  s = s.replace(/\\pi\b/g, 'pi');
  s = s.replace(/\\operatorname\{sen\}/gi, 'sin');

  // 5. Normalize log-base notation from already-converted log_{10}
  s = s.replace(/log\s*_\s*\{10\}/g, 'log10');

  // 5. Also handle raw ln( without backslash
  s = s.replace(/\bln\s*\(/g, 'log(');

  // 6. Convert multiplication symbols
  s = s.replace(/\\cdot/g, '*');
  s = s.replace(/\\times/g, '*');

  // 7. Convert \frac{a}{b} to ((a)/(b)) — handles one level of nesting
  s = s.replace(/\\frac\{([^{}]*(?:\{[^}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^}]*\}[^{}]*)*)\}/g, '(($1)/($2))');

  // 8. Convert \sqrt{x} to sqrt(x)
  s = s.replace(/\\sqrt\s*\{([^}]*)\}/g, 'sqrt($1)');

  // 9. Handle e^{...} and e^(expr) before brace conversion.
  s = s.replace(/\be\s*\^\s*\{/g, 'exp(');
  s = s.replace(/\be\s*\^\s*\(/g, 'exp(');

  // 10. Convert ^{...} to ^(...) iteratively. The loop handles nested
  //     braces like ^{x^{2}} by replacing the innermost ^{…} first.
  var prev;
  do {
    prev = s;
    s = s.replace(/\^\{([^{}]*)\}/g, '^($1)');
  } while (s !== prev);

  // 11. Convert remaining LaTeX braces to parentheses
  s = s.replace(/\\frac/g, '/');
  s = s.replace(/\\div/g, '/');
  s = s.replace(/\{/g, '(');
  s = s.replace(/\}/g, ')');

  // 12. Spanish notation sen( → sin(
  s = s.replace(/sen\s*\(/gi, 'sin(');

  // 13. Remove whitespace
  s = s.replace(/\s+/g, '');

  // 14. Insert implicit multiplication * in safe patterns.
  //     Runs after function names are normalized and braces converted.
  //     14a: between two parenthesized expressions — (x+1)(x+2) → (x+1)*(x+2)
  s = s.replace(/\)\(/g, ')*(');
  //     14b: x followed by ( but not inside a function name (e.g., exp)
  s = s.replace(/(^|[^a-zA-Z])x\(/g, '$1x*(');
  //     14c: number followed by ( but not inside log10 or similar
  s = s.replace(/(^|[^a-zA-Z0-9])(\d+)\(/g, '$1$2*(');
  //     14d: x/digit/) before a known function name
  s = s.replace(/([)x0-9])(sin|cos|tan|exp|sqrt|log10|log)\(/g, '$1*$2(');

  // 15. Fallback: any remaining e^simpleExpr → exp(simpleExpr)
  s = s.replace(/\be\^([a-zA-Z0-9.]+)/g, 'exp($1)');

  if (s.length === 0) s = '0';
  return s;
}

function mathFieldToExpression(mf) {
  if (!mf) return '';
  var latex = '';
  try {
    latex = mf.getValue ? mf.getValue() : (mf.value || '');
  } catch (e) {
    latex = mf.value || '';
  }
  return normalizeMathExpression(latex);
}

function compileMathExpression(expr) {
  try {
    var parsed = math.parse(expr);
    var compiled = parsed.compile();
    return compiled;
  } catch (e) {
    return null;
  }
}

function evaluateFunction(expr, xVal) {
  try {
    if (typeof expr === 'object' && expr !== null && typeof expr.evaluate === 'function') {
      return expr.evaluate({ x: xVal });
    }
    var node = math.parse(expr);
    var compiled = node.compile();
    return compiled.evaluate({ x: xVal });
  } catch (e) {
    return NaN;
  }
}

function getPrecisionConfig() {
  var modeEl = document.getElementById('precision-mode');
  var amountEl = document.getElementById('precision-amount');

  var mode = (modeEl && modeEl.value === 'sigfigs') ? 'sigfigs' : 'decimals';
  var amount = 6;

  if (amountEl) {
    amount = parseInt(amountEl.value, 10);
    if (isNaN(amount) || amount < 1) amount = 6;
    if (amount > 12) amount = 12;
  }

  return { mode: mode, amount: amount };
}

function roundByMode(value, config) {
  if (!isFinite(value)) return value;
  var mode = config.mode;
  var amount = config.amount;

  if (mode === 'decimals') {
    var factor = Math.pow(10, amount);
    return Math.round(value * factor) / factor;
  }

  if (mode === 'sigfigs') {
    if (value === 0) return 0;
    var d = Math.ceil(Math.log10(Math.abs(value)));
    var factor = Math.pow(10, amount - d);
    return Math.round(value * factor) / factor;
  }

  return value;
}

function formatByPrecision(value, config) {
  if (value === undefined || value === null || isNaN(value)) return '---';
  if (!config) return formatScientific(value);

  var mode = config.mode;
  var amount = config.amount;

  if (mode === 'decimals') {
    return Number(value).toFixed(amount);
  }

  if (mode === 'sigfigs') {
    return Number(value).toPrecision(amount);
  }

  return formatScientific(value);
}

function applyStepPrecision(value, config) {
  return roundByMode(value, config);
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('MetodoSimpson38 iniciado');
});
