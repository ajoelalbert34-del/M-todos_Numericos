function calcularErrores(I_simpson, I_exacta) {
  if (I_exacta === null || I_exacta === undefined || isNaN(I_exacta)) {
    return {
      Ea: null,
      Er: null,
      Ep: null,
      exactaCero: false
    };
  }
  const Ea = Math.abs(I_exacta - I_simpson);
  if (I_exacta === 0) {
    return { Ea, Er: null, Ep: null, exactaCero: true };
  }
  const Er = Ea / Math.abs(I_exacta);
  const Ep = Er * 100;
  return { Ea, Er, Ep, exactaCero: false };
}
