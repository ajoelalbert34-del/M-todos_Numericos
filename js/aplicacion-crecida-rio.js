/* ============================================================
   Aplicación gráfica: Crecida de río con Simpson 3/8
   Proyecto aislado: no modifica el simulador general.
   ============================================================ */

(function () {
  'use strict';

  var state = {
    running: false,
    startedAt: 0,
    duration: 7000,
    progress: 0,
    data: null,
    animationId: null
  };

  var el = {};

  function $(id) {
    return document.getElementById(id);
  }

  function fmt(n, d) {
    d = d == null ? 2 : d;
    if (!isFinite(n)) return '---';
    return Number(n).toFixed(d);
  }

  function setAlert(message, type) {
    var cls = type === 'error' ? 'alert-error' : type === 'warning' ? 'alert-warning' : 'alert-success';
    el.alert.innerHTML = '<div class="alert ' + cls + '"><span>' + message + '</span></div>';
  }

  function clearLocalAlert() {
    el.alert.innerHTML = '';
  }

  function qFunction(profile, t, a, b) {
    var span = Math.max(1e-9, b - a);
    var u = (t - a) / span;

    if (profile === 'normal') {
      return 80 + 12 * Math.sin(2 * Math.PI * u);
    }

    if (profile === 'tormenta') {
      return 95 + 70 * Math.sin(Math.PI * u) + 28 * Math.sin(4 * Math.PI * u);
    }

    if (profile === 'crecida') {
      return 70 + 145 / (1 + Math.exp(-12 * (u - 0.38))) - 62 * Math.max(0, u - 0.72);
    }

    if (profile === 'pico') {
      var peak = Math.exp(-Math.pow((u - 0.56) / 0.18, 2));
      return 62 + 210 * peak + 18 * Math.sin(6 * Math.PI * u);
    }

    return 80;
  }

  function getInputs() {
    var a = Number(el.tInicial.value);
    var b = Number(el.tFinal.value);
    var n = Number(el.n.value);
    var profile = el.perfil.value;

    if (!isFinite(a) || !isFinite(b) || !isFinite(n)) {
      return { ok: false, message: 'Ingrese valores numéricos válidos.' };
    }
    if (b <= a) {
      return { ok: false, message: 'El tiempo final debe ser mayor al tiempo inicial.' };
    }
    if (n <= 0 || n % 3 !== 0) {
      return { ok: false, message: 'n debe ser positivo y múltiplo de 3.' };
    }

    return { ok: true, a: a, b: b, n: Math.round(n), profile: profile };
  }

  function buildSimulation(a, b, n, profile) {
    var h = (b - a) / n;
    var nodes = [];
    var qValues = [];
    var coeffs = [];
    var weighted = [];
    var sum = 0;

    for (var i = 0; i <= n; i++) {
      var t = a + i * h;
      var q = Math.max(0, qFunction(profile, t, a, b));
      var c;

      if (i === 0 || i === n) c = 1;
      else if (i % 3 === 0) c = 2;
      else c = 3;

      nodes.push(t);
      qValues.push(q);
      coeffs.push(c);
      weighted.push(c * q);
      sum += c * q;
    }

    var volume = (3 * h / 8) * sum * 3600; // m³/s * h → m³
    var qMax = Math.max.apply(null, qValues);
    var qAvg = qValues.reduce(function (acc, x) { return acc + x; }, 0) / qValues.length;

    return {
      a: a,
      b: b,
      n: n,
      h: h,
      profile: profile,
      nodes: nodes,
      qValues: qValues,
      coeffs: coeffs,
      weighted: weighted,
      volume: volume,
      qMax: qMax,
      qAvg: qAvg,
      blocks: n / 3
    };
  }

  function partialVolume(data, tNow) {
    if (!data) return 0;
    var a = data.a;
    var b = data.b;
    var samples = 160;
    var end = Math.min(Math.max(tNow, a), b);
    if (end <= a) return 0;
    var dt = (end - a) / samples;
    var acc = 0;
    for (var i = 0; i <= samples; i++) {
      var t = a + i * dt;
      var w = (i === 0 || i === samples) ? 0.5 : 1;
      acc += w * Math.max(0, qFunction(data.profile, t, a, b));
    }
    return acc * dt * 3600;
  }

  function currentQ(data, tNow) {
    if (!data) return 0;
    return Math.max(0, qFunction(data.profile, tNow, data.a, data.b));
  }

  function reservoirCapacity() {
    // Capacidad visual de referencia del embalse.
    // No altera Simpson; solo convierte el volumen calculado en un porcentaje escénico.
    return 2500000;
  }

  function riverProfileFactor(profile) {
    if (profile === 'normal') return 0.35;
    if (profile === 'tormenta') return 0.70;
    if (profile === 'crecida') return 0.86;
    if (profile === 'pico') return 1.00;
    return 0.5;
  }

  function visualRiverState(data, progress) {
    progress = Math.max(0, Math.min(1, progress || 0));
    if (!data) {
      return { tNow: 0, volume: 0, qNow: 0, qRatio: 0, loadRatio: 0, level: 0.18, rain: 0.15, wave: 4, status: statusFromLevel(0.18) };
    }
    var tNow = data.a + (data.b - data.a) * progress;
    var volume = partialVolume(data, tNow);
    var qNow = currentQ(data, tNow);
    var qRatio = Math.max(0, Math.min(1.35, qNow / Math.max(1, data.qMax)));
    var loadRatio = Math.max(0, Math.min(1.18, volume / reservoirCapacity()));
    var level = Math.max(0.18, Math.min(0.96, 0.18 + 0.76 * loadRatio));
    var rain = Math.max(0.08, Math.min(1, riverProfileFactor(data.profile) * 0.55 + qRatio * 0.45));
    var wave = 3 + 16 * Math.min(1, qRatio) + 8 * Math.min(1, loadRatio);
    return { tNow: tNow, volume: volume, qNow: qNow, qRatio: qRatio, loadRatio: loadRatio, level: level, rain: rain, wave: wave, status: statusFromLevel(level) };
  }

  function statusFromLevel(level) {
    if (level >= 0.82) return { label: 'Crítico', color: '#ffb4ab' };
    if (level >= 0.62) return { label: 'Advertencia', color: '#e9c176' };
    return { label: 'Normal', color: '#add461' };
  }

  function drawScene(progress) {
    var canvas = el.scene;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var data = state.data;
    var p = progress == null ? state.progress : progress;
    var vs = visualRiverState(data, p);
    var now = Date.now();

    ctx.clearRect(0, 0, w, h);

    var sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, vs.loadRatio > 0.85 ? '#171213' : '#11161a');
    sky.addColorStop(0.48, '#15191b');
    sky.addColorStop(1, '#0c0e10');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // halo de tormenta dependiente del perfil/caudal
    var storm = ctx.createRadialGradient(w * 0.62, h * 0.15, 20, w * 0.62, h * 0.15, w * 0.7);
    storm.addColorStop(0, 'rgba(255,183,123,' + (0.04 * vs.rain).toFixed(3) + ')');
    storm.addColorStop(1, 'rgba(255,183,123,0)');
    ctx.fillStyle = storm;
    ctx.fillRect(0, 0, w, h);

    // Montañas / valle
    ctx.fillStyle = vs.loadRatio > 0.82 ? '#211b1a' : '#1c211d';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.54);
    ctx.lineTo(w * 0.12, h * 0.38);
    ctx.lineTo(w * 0.25, h * 0.50);
    ctx.lineTo(w * 0.42, h * 0.34);
    ctx.lineTo(w * 0.58, h * 0.50);
    ctx.lineTo(w * 0.74, h * 0.36);
    ctx.lineTo(w, h * 0.54);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Presa
    var damX = w * 0.73;
    var damY = h * 0.36;
    var damW = w * 0.18;
    var damH = h * 0.52;

    // Río entrante: grosor y ondas dependen del caudal actual
    ctx.strokeStyle = 'rgba(87, 137, 142,' + (0.38 + 0.35 * Math.min(1, vs.qRatio)).toFixed(3) + ')';
    ctx.lineWidth = 8 + 14 * Math.min(1, vs.qRatio);
    ctx.beginPath();
    ctx.moveTo(w * 0.02, h * 0.58);
    ctx.bezierCurveTo(w * 0.2, h * 0.51 - vs.qRatio * 16, w * 0.3, h * 0.67, w * 0.43, h * 0.57 - vs.qRatio * 12);
    ctx.bezierCurveTo(w * 0.55, h * 0.48 - vs.qRatio * 14, w * 0.66, h * 0.53, w * 0.76, h * 0.55);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(173, 212, 97, ' + (0.18 + 0.34 * Math.min(1, vs.qRatio)).toFixed(3) + ')';
    ctx.lineWidth = 1.5 + 2 * Math.min(1, vs.qRatio);
    for (var s = 0; s < 7; s++) {
      var offset = ((now / (42 - 18 * Math.min(1, vs.qRatio)) + s * 55) % 220);
      ctx.beginPath();
      ctx.moveTo(w * 0.06 + offset, h * 0.57 + Math.sin(s + now / 500) * 9);
      ctx.lineTo(w * 0.12 + offset, h * 0.57 + Math.sin(s + now / 500) * 9);
      ctx.stroke();
    }

    ctx.fillStyle = '#303234';
    ctx.fillRect(damX, damY, damW, damH);
    ctx.strokeStyle = vs.loadRatio > 0.82 ? '#ffb4ab' : '#a08d80';
    ctx.lineWidth = 1;
    ctx.strokeRect(damX, damY, damW, damH);

    ctx.fillStyle = 'rgba(12,14,16,0.45)';
    for (var g = 0; g < 5; g++) {
      ctx.fillRect(damX + damW * (0.18 + g * 0.15), damY + 24, 5, damH - 48);
    }

    // Umbrales
    var gaugeX = damX - 40;
    ctx.strokeStyle = 'rgba(233,193,118,.72)';
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(gaugeX, h * 0.43);
    ctx.lineTo(damX + damW, h * 0.43);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,180,171,.75)';
    ctx.beginPath();
    ctx.moveTo(gaugeX, h * 0.30);
    ctx.lineTo(damX + damW, h * 0.30);
    ctx.stroke();
    ctx.setLineDash([]);

    // Nivel de agua: ahora depende del volumen acumulado/capacidad visual.
    var waterTop = h * (0.88 - 0.58 * vs.level);
    var water = ctx.createLinearGradient(0, waterTop, 0, h);
    water.addColorStop(0, vs.loadRatio > 0.85 ? 'rgba(90, 128, 124, 0.94)' : 'rgba(68, 122, 128, 0.90)');
    water.addColorStop(1, 'rgba(45, 84, 72, 0.97)');
    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.moveTo(0, waterTop + vs.wave * Math.sin(now / 450));
    for (var x = 0; x <= damX; x += 24) {
      ctx.lineTo(x, waterTop + vs.wave * Math.sin((x + now / (18 + 20 * (1 - Math.min(1, vs.qRatio)))) / 38));
    }
    ctx.lineTo(damX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Banda de nivel/alerta pegada al agua
    ctx.strokeStyle = vs.status.color;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, waterTop + 3);
    ctx.lineTo(damX, waterTop + 3);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Lluvia: intensidad por perfil y caudal actual.
    if (state.running || p > 0.05 || data) {
      ctx.strokeStyle = 'rgba(216,195,180,' + (0.12 + 0.38 * vs.rain).toFixed(3) + ')';
      ctx.lineWidth = 0.7 + 1.2 * vs.rain;
      var rainCount = Math.round(18 + 115 * vs.rain);
      var rainSpeed = 2.2 + 6.8 * vs.rain;
      for (var r = 0; r < rainCount; r++) {
        var rx = (r * 97 + now / rainSpeed) % w;
        var ry = (r * 53 + now / (rainSpeed * 0.55)) % (h * 0.64);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 7 - 5 * vs.rain, ry + 14 + 10 * vs.rain);
        ctx.stroke();
      }
    }

    // Indicador de capacidad visual
    ctx.fillStyle = '#d8c3b4';
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillText('CRÍTICO', gaugeX - 72, h * 0.305);
    ctx.fillText('ADVERT.', gaugeX - 72, h * 0.435);
    ctx.fillText('NIVEL', damX + damW - 50, damY + damH + 20);
    ctx.fillStyle = vs.status.color;
    ctx.fillText('CAP. VISUAL ' + fmt(Math.min(100, vs.loadRatio * 100), 0) + '%', 20, h - 26);

    el.status.textContent = vs.status.label;
    el.status.style.color = vs.status.color;
  }

  function drawChart(progress) {
    var canvas = el.chart;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var data = state.data || buildSimulation(0, 12, 6, 'tormenta');
    var p = progress == null ? state.progress : progress;

    ctx.clearRect(0, 0, w, h);

    var padL = 60, padR = 24, padT = 28, padB = 46;
    var gx = padL, gy = padT, gw = w - padL - padR, gh = h - padT - padB;

    ctx.fillStyle = '#0c0e10';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(82,68,57,.6)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
      var yy = gy + gh * i / 4;
      ctx.beginPath();
      ctx.moveTo(gx, yy);
      ctx.lineTo(gx + gw, yy);
      ctx.stroke();
    }
    for (var j = 0; j <= 6; j++) {
      var xx = gx + gw * j / 6;
      ctx.beginPath();
      ctx.moveTo(xx, gy);
      ctx.lineTo(xx, gy + gh);
      ctx.stroke();
    }

    var qMax = Math.max(1, data.qMax * 1.12);
    function tx(t) { return gx + (t - data.a) / (data.b - data.a) * gw; }
    function ty(q) { return gy + gh - q / qMax * gh; }

    var endT = data.a + (data.b - data.a) * Math.min(1, p);
    var pts = [];
    var samples = 220;
    for (var k = 0; k <= samples; k++) {
      var t = data.a + (data.b - data.a) * k / samples;
      if (t > endT) break;
      pts.push([tx(t), ty(qFunction(data.profile, t, data.a, data.b))]);
    }

    if (pts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], gy + gh);
      for (var a = 0; a < pts.length; a++) ctx.lineTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[pts.length - 1][0], gy + gh);
      ctx.closePath();
      ctx.fillStyle = 'rgba(200,128,63,.20)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var c = 1; c < pts.length; c++) ctx.lineTo(pts[c][0], pts[c][1]);
      ctx.strokeStyle = '#ffb77b';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // nodos Simpson
    for (var n = 0; n < data.nodes.length; n++) {
      var nt = data.nodes[n];
      if (nt <= endT + 1e-9) {
        var nx = tx(nt);
        var ny = ty(data.qValues[n]);
        ctx.fillStyle = n % 3 === 0 ? '#e9c176' : '#add461';
        ctx.beginPath();
        ctx.arc(nx, ny, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(216,195,180,.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nx, gy + gh);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
    }

    // ejes
    ctx.strokeStyle = '#a08d80';
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();

    ctx.fillStyle = '#d8c3b4';
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillText('Q(t) m³/s', 8, gy + 14);
    ctx.fillText('Tiempo (h)', gx + gw - 82, h - 12);
    ctx.fillText(fmt(data.a, 1), gx - 6, h - 26);
    ctx.fillText(fmt(data.b, 1), gx + gw - 24, h - 26);
  }

  function renderDevelopment(data) {
    if (!data) return;
    var html = '';
    for (var i = 0; i < data.nodes.length; i++) {
      html += '<tr>' +
        '<td>' + i + '</td>' +
        '<td>' + fmt(data.nodes[i], 4) + '</td>' +
        '<td>' + fmt(data.qValues[i], 4) + '</td>' +
        '<td>' + data.coeffs[i] + '</td>' +
        '<td>' + fmt(data.weighted[i], 4) + '</td>' +
      '</tr>';
    }
    el.table.innerHTML = html;
  }

  function updateMetrics(progress) {
    var data = state.data;
    var tNow = data ? data.a + (data.b - data.a) * progress : 0;
    var v = partialVolume(data, tNow);
    var q = currentQ(data, tNow);
    var visual = visualRiverState(data, progress);

    el.vol.textContent = fmt(v, 2);
    el.q.textContent = fmt(q, 2);
    el.level.textContent = fmt(visual.level * 100, 0);
    el.progress.style.width = fmt(progress * 100, 1) + '%';

    if (progress >= 1 && data) {
      el.resultVol.textContent = fmt(data.volume, 2) + ' m³';
      el.resultH.textContent = fmt(data.h, 4) + ' h';
      el.resultBlocks.textContent = data.n + ' / ' + data.blocks;
      el.resultQMax.textContent = fmt(data.qMax, 2) + ' m³/s';
    }
  }

  function renderAll() {
    updateMetrics(state.progress);
    drawScene(state.progress);
    drawChart(state.progress);
  }

  function resetSimulation() {
    if (state.animationId) cancelAnimationFrame(state.animationId);
    state.running = false;
    state.progress = 0;
    state.data = buildSimulation(0, 12, 6, 'tormenta');
    el.resultVol.textContent = '0.00 m³';
    el.resultH.textContent = '0.00 h';
    el.resultBlocks.textContent = '0 / 0';
    el.resultQMax.textContent = '0.00 m³/s';
    clearLocalAlert();
    renderDevelopment(state.data);
    renderAll();
  }

  function startSimulation() {
    var inputs = getInputs();
    if (!inputs.ok) {
      setAlert(inputs.message, 'error');
      return;
    }

    clearLocalAlert();
    state.data = buildSimulation(inputs.a, inputs.b, inputs.n, inputs.profile);
    renderDevelopment(state.data);
    state.running = true;
    state.startedAt = performance.now();
    state.progress = 0;
    setAlert('Simulación iniciada. El volumen se actualiza conforme avanza el caudal.', 'success');

    if (state.animationId) cancelAnimationFrame(state.animationId);

    function step(now) {
      var elapsed = now - state.startedAt;
      state.progress = Math.min(1, elapsed / state.duration);
      renderAll();

      if (state.progress < 1 && state.running) {
        state.animationId = requestAnimationFrame(step);
      } else {
        state.running = false;
        state.progress = 1;
        renderAll();
        setAlert('Resultado final calculado con Simpson 3/8 compuesto.', 'success');
      }
    }

    state.animationId = requestAnimationFrame(step);
  }

  function toggleDevelopment() {
    el.dev.classList.toggle('hidden');
    if (!el.dev.classList.contains('hidden')) {
      el.dev.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderStaticFormulas() {
    if (window.katex) {
      try {
        katex.render(String.raw`V \approx \frac{3h}{8}\left[Q_0 + 3Q_1 + 3Q_2 + 2Q_3 + \cdots + Q_n\right]`, document.getElementById('riverFormulaLatex'), { throwOnError: false, displayMode: true });
        katex.render(String.raw`V = \int Q(t)\,dt`, document.getElementById('riverIntegralLatex'), { throwOnError: false, displayMode: false });
      } catch(e) {}
    }
  }

  function init() {
    el.tInicial = $('tInicial');
    el.tFinal = $('tFinal');
    el.n = $('nSubintervalos');
    el.perfil = $('perfilLluvia');
    el.scene = $('riverSceneCanvas');
    el.chart = $('riverChartCanvas');
    el.alert = $('riverAlert');
    el.status = $('riverStatus');
    el.vol = $('volumenActual');
    el.q = $('caudalActual');
    el.level = $('nivelActual');
    el.progress = $('riverProgressBar');
    el.resultVol = $('resultadoVolumen');
    el.resultH = $('resultadoH');
    el.resultBlocks = $('resultadoBloques');
    el.resultQMax = $('resultadoCaudalMax');
    el.dev = $('riverDevelopment');
    el.table = $('tablaDesarrolloRio');

    $('btnSimularRio').addEventListener('click', startSimulation);
    $('btnReiniciarRio').addEventListener('click', resetSimulation);
    $('btnDesarrolloRio').addEventListener('click', toggleDevelopment);
    $('btnCerrarDesarrollo').addEventListener('click', toggleDevelopment);

    renderStaticFormulas();
    resetSimulation();

    window.addEventListener('resize', function () {
      renderAll();
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  // Exposición mínima para pruebas manuales en consola.
  window.__riverSimpsonTest = {
    qFunction: qFunction,
    buildSimulation: buildSimulation
  };
})();
