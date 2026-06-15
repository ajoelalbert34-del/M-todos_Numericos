function renderTablaSimple(puntos, fValores, coeficientes, Cfi, precisionConfig) {
  let html = '<div class="table-container"><table>';
  html += '<thead><tr>';
  html += '<th>i</th>';
  html += '<th>xᵢ</th>';
  html += '<th>f(xᵢ)</th>';
  html += '<th>Coeficiente Cᵢ</th>';
  html += '<th>Cᵢ · f(xᵢ)</th>';
  html += '</tr></thead><tbody>';

  for (let i = 0; i < puntos.length; i++) {
    html += '<tr>';
    html += `<td>${i}</td>`;
    html += `<td>${formatByPrecision(puntos[i], precisionConfig)}</td>`;
    html += `<td>${formatByPrecision(fValores[i], precisionConfig)}</td>`;
    html += `<td>${coeficientes[i]}</td>`;
    html += `<td>${formatByPrecision(Cfi[i], precisionConfig)}</td>`;
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  return html;
}

function renderTablaCompuesta(puntos, fValores, tipos, coeficientes, Cfi, precisionConfig) {
  let html = '<div class="table-container"><table>';
  html += '<thead><tr>';
  html += '<th>i</th>';
  html += '<th>xᵢ</th>';
  html += '<th>f(xᵢ)</th>';
  html += '<th>Tipo de punto</th>';
  html += '<th>Coeficiente Cᵢ</th>';
  html += '<th>Cᵢ · f(xᵢ)</th>';
  html += '</tr></thead><tbody>';

  const total = Math.min(puntos.length, fValores.length, tipos.length, coeficientes.length, Cfi.length);

  for (let i = 0; i < total; i++) {
    html += '<tr>';
    html += `<td>${i}</td>`;
    html += `<td>${formatByPrecision(puntos[i], precisionConfig)}</td>`;
    html += `<td>${formatByPrecision(fValores[i], precisionConfig)}</td>`;
    html += `<td>${tipos[i]}</td>`;
    html += `<td>${coeficientes[i]}</td>`;
    html += `<td>${formatByPrecision(Cfi[i], precisionConfig)}</td>`;
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  return html;
}
