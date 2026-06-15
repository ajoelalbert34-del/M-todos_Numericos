/* ============================================================
   Aplicación gráfica: Descarga contaminante con Simpson 3/8
   Módulo aislado: no modifica el simulador general.
   ============================================================ */
(function () {
  'use strict';
  var state = { running:false, startedAt:0, duration:7200, progress:0, data:null, animationId:null };
  var el = {};
  function $(id){ return document.getElementById(id); }
  function fmt(n,d){ d=d==null?2:d; return isFinite(n)?Number(n).toFixed(d):'---'; }
  function setAlert(msg,type){ var cls=type==='error'?'alert-error':type==='warning'?'alert-warning':'alert-success'; el.alert.innerHTML='<div class="alert '+cls+'"><span>'+msg+'</span></div>'; }
  function clearAlert(){ el.alert.innerHTML=''; }

  function cFunction(profile,t,a,b){
    var span=Math.max(1e-9,b-a), u=(t-a)/span;
    if(profile==='controlada') return 42 + 9*Math.sin(2*Math.PI*u);
    if(profile==='constante') return 64;
    if(profile==='accidente') return 35 + 150*Math.exp(-Math.pow((u-.55)/.16,2)) + 12*Math.sin(5*Math.PI*u);
    if(profile==='fuga') return 24 + 115/(1+Math.exp(-9*(u-.46))) - 34*Math.max(0,u-.76);
    return 40;
  }
  function getInputs(){
    var a=Number(el.a.value), b=Number(el.b.value), n=Number(el.n.value), limit=Number(el.limit.value), profile=el.profile.value;
    if(!isFinite(a)||!isFinite(b)||!isFinite(n)||!isFinite(limit)) return {ok:false,message:'Ingrese valores numéricos válidos.'};
    if(b<=a) return {ok:false,message:'El tiempo final debe ser mayor al inicial.'};
    if(n<=0||n%3!==0) return {ok:false,message:'n debe ser positivo y múltiplo de 3.'};
    if(limit<=0) return {ok:false,message:'El límite permitido debe ser mayor que cero.'};
    return {ok:true,a:a,b:b,n:Math.round(n),limit:limit,profile:profile};
  }
  function buildSimulation(a,b,n,profile,limit){
    var h=(b-a)/n, nodes=[], values=[], coeffs=[], weighted=[], sum=0;
    for(var i=0;i<=n;i++){
      var t=a+i*h, c=Math.max(0,cFunction(profile,t,a,b));
      var coef=(i===0||i===n)?1:(i%3===0?2:3);
      nodes.push(t); values.push(c); coeffs.push(coef); weighted.push(coef*c); sum+=coef*c;
    }
    var load=(3*h/8)*sum;
    var max=Math.max.apply(null,values);
    return {a:a,b:b,n:n,h:h,profile:profile,limit:limit,nodes:nodes,values:values,coeffs:coeffs,weighted:weighted,load:load,max:max,blocks:n/3};
  }
  function partialLoad(data,tNow){
    if(!data) return 0; var a=data.a,b=data.b,end=Math.min(Math.max(tNow,a),b); if(end<=a) return 0;
    var samples=180, dt=(end-a)/samples, acc=0;
    for(var i=0;i<=samples;i++){ var t=a+i*dt, w=(i===0||i===samples)?0.5:1; acc += w*Math.max(0,cFunction(data.profile,t,a,b)); }
    return acc*dt;
  }
  function statusByRatio(r){ if(r>=1) return {label:'Crítico',color:'#ffb4ab'}; if(r>=.72) return {label:'Advertencia',color:'#e9c176'}; return {label:'Normal',color:'#add461'}; }

  function visualPollutionState(data, progress){
    progress=Math.max(0,Math.min(1,progress||0));
    if(!data) return {tNow:0,load:0,rate:0,ratio:0,rateRatio:0,plume:0.08,status:statusByRatio(0),particles:8};
    var tNow=data.a+(data.b-data.a)*progress;
    var load=partialLoad(data,tNow);
    var rate=Math.max(0,cFunction(data.profile,tNow,data.a,data.b));
    var ratio=Math.max(0,Math.min(1.6,load/data.limit));
    var rateRatio=Math.max(0,Math.min(1.4,rate/Math.max(1,data.max)));
    var profileBoost=(data.profile==='accidente')?0.28:(data.profile==='fuga'?0.18:(data.profile==='constante'?0.10:0));
    var plume=Math.max(0.08,Math.min(1.35,0.10+ratio*0.72+rateRatio*0.22+profileBoost));
    return {tNow:tNow,load:load,rate:rate,ratio:ratio,rateRatio:rateRatio,plume:plume,status:statusByRatio(ratio),particles:Math.round(10+56*rateRatio+42*Math.min(1,ratio))};
  }

  function drawScene(progress){
    var c=el.scene,ctx=c.getContext('2d'),w=c.width,h=c.height,data=state.data,p=progress==null?state.progress:progress;
    var vs=visualPollutionState(data,p), now=Date.now();
    ctx.clearRect(0,0,w,h);

    var sky=ctx.createLinearGradient(0,0,0,h);
    sky.addColorStop(0, vs.ratio>=1?'#181112':'#141719');
    sky.addColorStop(1,'#0c0e10');
    ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);

    // Relieve de fondo
    ctx.fillStyle=vs.ratio>=1?'#201919':'#191d19';
    ctx.beginPath(); ctx.moveTo(0,h*.56); ctx.lineTo(w*.15,h*.38); ctx.lineTo(w*.32,h*.53); ctx.lineTo(w*.5,h*.34); ctx.lineTo(w*.72,h*.51); ctx.lineTo(w,h*.42); ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.fill();

    // Planta industrial con alerta visual
    var plantPulse = 0.5 + 0.5*Math.sin(now/260);
    ctx.fillStyle='#303234'; ctx.fillRect(w*.06,h*.29,w*.16,h*.19);
    ctx.fillStyle='#24272a'; ctx.fillRect(w*.09,h*.22,w*.035,h*.07); ctx.fillRect(w*.16,h*.19,w*.035,h*.10);
    ctx.strokeStyle=vs.ratio>=1?'#ffb4ab':'#a08d80'; ctx.lineWidth=1.2; ctx.strokeRect(w*.06,h*.29,w*.16,h*.19);
    if(vs.ratio>.72){ ctx.strokeStyle='rgba(255,180,171,'+(0.35+0.35*plantPulse).toFixed(3)+')'; ctx.strokeRect(w*.055,h*.285,w*.17,h*.20); }

    // Tubería/descarga: grosor e intensidad dependen de la tasa actual.
    ctx.fillStyle='rgba(255,183,123,'+(0.46+0.45*vs.rateRatio).toFixed(3)+')';
    ctx.fillRect(w*.22,h*.43,w*(.16+.12*Math.min(1,vs.rateRatio)),6+8*Math.min(1,vs.rateRatio));
    ctx.fillStyle=vs.status.color; ctx.fillRect(w*(.40+.05*Math.min(1,vs.rateRatio)),h*.427, w*(.035+.03*Math.min(1,vs.rateRatio)), 12+10*Math.min(1,vs.rateRatio));

    // Río base
    var riverY=h*.62;
    var water=ctx.createLinearGradient(0,riverY,0,h); water.addColorStop(0,'rgba(64,116,121,.86)'); water.addColorStop(1,'rgba(42,78,70,.96)'); ctx.fillStyle=water;
    ctx.beginPath(); ctx.moveTo(0,riverY); for(var x=0;x<=w;x+=24) ctx.lineTo(x, riverY+8*Math.sin((x+now/(24-8*Math.min(1,vs.rateRatio)))/48)); ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath(); ctx.fill();

    // Corriente
    ctx.strokeStyle='rgba(216,195,180,'+(0.12+0.20*vs.rateRatio).toFixed(3)+')'; ctx.lineWidth=1;
    for(var s=0;s<9;s++){ var off=(now/(34-12*Math.min(1,vs.rateRatio))+s*90)%w; ctx.beginPath(); ctx.moveTo(off,riverY+36+s*18); ctx.lineTo(off+52+30*vs.rateRatio,riverY+34+s*18); ctx.stroke(); }

    // Mancha contaminante: tamaño, opacidad y color dependen de carga/límite.
    var plume = vs.plume;
    var cx=w*(.36+.34*Math.min(1,p));
    var cy=riverY+70;
    var baseColor = vs.ratio>=1 ? [255,120,112] : (vs.ratio>.72 ? [239,193,118] : [255,180,171]);
    for(var k=0;k<7;k++){
      var alpha=(0.18+0.18*Math.min(1,vs.ratio)+0.10*vs.rateRatio-k*.022);
      ctx.fillStyle='rgba('+baseColor[0]+','+baseColor[1]+','+baseColor[2]+','+Math.max(0.04,alpha).toFixed(3)+')';
      ctx.beginPath();
      ctx.ellipse(cx+w*.025*k, cy+Math.sin(now/350+k)*10, w*(.08+.30*plume)*(1+k*.12), h*(.030+.10*plume)*(1+k*.08), 0,0,Math.PI*2);
      ctx.fill();
    }

    // Puntos de concentración: cantidad por tasa actual/carga acumulada.
    ctx.fillStyle='rgba(255,183,123,.62)';
    for(var d=0; d<vs.particles; d++){
      var px=(w*.30+d*43+now/(18-8*Math.min(1,vs.rateRatio)))%w;
      var py=riverY+28+(d*31%190);
      var rr=1.1+(d%3)+2*Math.min(1,vs.ratio);
      ctx.beginPath(); ctx.arc(px,py,rr,0,Math.PI*2); ctx.fill();
    }

    // Límite visual
    ctx.strokeStyle='rgba(233,193,118,.62)'; ctx.setLineDash([7,7]); ctx.beginPath(); ctx.moveTo(w*.64,riverY+26); ctx.lineTo(w*.96,riverY+26); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle='#d8c3b4'; ctx.font='12px JetBrains Mono, monospace'; ctx.fillText('LÍMITE PERMITIDO', w*.64, riverY+17); ctx.fillText('PLANTA', w*.07, h*.52); ctx.fillText('DESCARGA', w*.32, h*.415);
    ctx.fillStyle=vs.status.color; ctx.fillText('USO LÍMITE ' + fmt(Math.min(160,vs.ratio*100),0) + '%', 20, h-26);
    el.status.textContent=vs.status.label; el.status.style.color=vs.status.color;
  }
  function drawChart(progress){
    var c=el.chart,ctx=c.getContext('2d'),w=c.width,h=c.height,data=state.data||buildSimulation(0,10,12,'accidente',950),p=progress==null?state.progress:progress;
    ctx.clearRect(0,0,w,h); ctx.fillStyle='#0c0e10'; ctx.fillRect(0,0,w,h);
    var padL=62,padR=24,padT=28,padB=46,gx=padL,gy=padT,gw=w-padL-padR,gh=h-padT-padB;
    ctx.strokeStyle='rgba(82,68,57,.6)'; ctx.lineWidth=1; for(var i=0;i<=4;i++){var yy=gy+gh*i/4;ctx.beginPath();ctx.moveTo(gx,yy);ctx.lineTo(gx+gw,yy);ctx.stroke();} for(var j=0;j<=6;j++){var xx=gx+gw*j/6;ctx.beginPath();ctx.moveTo(xx,gy);ctx.lineTo(xx,gy+gh);ctx.stroke();}
    var max=Math.max(1,data.max*1.12); function tx(t){return gx+(t-data.a)/(data.b-data.a)*gw;} function ty(v){return gy+gh-v/max*gh;}
    var endT=data.a+(data.b-data.a)*Math.min(1,p), pts=[],samples=220;
    for(var k=0;k<=samples;k++){var t=data.a+(data.b-data.a)*k/samples;if(t>endT)break;pts.push([tx(t),ty(cFunction(data.profile,t,data.a,data.b))]);}
    if(pts.length>1){ctx.beginPath();ctx.moveTo(pts[0][0],gy+gh);for(var q=0;q<pts.length;q++)ctx.lineTo(pts[q][0],pts[q][1]);ctx.lineTo(pts[pts.length-1][0],gy+gh);ctx.closePath();ctx.fillStyle='rgba(255,180,171,.18)';ctx.fill();ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(var m=1;m<pts.length;m++)ctx.lineTo(pts[m][0],pts[m][1]);ctx.strokeStyle='#ffb4ab';ctx.lineWidth=3;ctx.stroke();}
    for(var n=0;n<data.nodes.length;n++){var nt=data.nodes[n];if(nt<=endT+1e-9){var nx=tx(nt),ny=ty(data.values[n]);ctx.fillStyle=n%3===0?'#e9c176':'#add461';ctx.beginPath();ctx.arc(nx,ny,4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(216,195,180,.45)';ctx.beginPath();ctx.moveTo(nx,gy+gh);ctx.lineTo(nx,ny);ctx.stroke();}}
    ctx.strokeStyle='#a08d80';ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx,gy+gh);ctx.lineTo(gx+gw,gy+gh);ctx.stroke();ctx.fillStyle='#d8c3b4';ctx.font='12px JetBrains Mono, monospace';ctx.fillText('C(t) kg/h',8,gy+14);ctx.fillText('Tiempo (h)',gx+gw-82,h-12);ctx.fillText(fmt(data.a,1),gx-6,h-26);ctx.fillText(fmt(data.b,1),gx+gw-24,h-26);
  }
  function renderDevelopment(data){ var html=''; for(var i=0;i<data.nodes.length;i++){ html+='<tr><td>'+i+'</td><td>'+fmt(data.nodes[i],4)+'</td><td>'+fmt(data.values[i],4)+'</td><td>'+data.coeffs[i]+'</td><td>'+fmt(data.weighted[i],4)+'</td></tr>'; } el.table.innerHTML=html; }
  function updateMetrics(p){ var data=state.data,t=data?data.a+(data.b-data.a)*p:0, carga=partialLoad(data,t), tasa=data?Math.max(0,cFunction(data.profile,t,data.a,data.b)):0, ratio=data?Math.min(1.5,carga/data.limit):0; el.carga.textContent=fmt(carga,2); el.tasa.textContent=fmt(tasa,2); el.nivel.textContent=fmt(ratio*100,0); el.progress.style.width=fmt(Math.min(100,p*100),1)+'%'; if(p>=1&&data){ el.resultCarga.textContent=fmt(data.load,2)+' kg'; el.resultH.textContent=fmt(data.h,4)+' h'; el.resultBlocks.textContent=data.n+' / '+data.blocks; el.resultMax.textContent=fmt(data.max,2)+' kg/h'; } }
  function renderAll(){ updateMetrics(state.progress); drawScene(state.progress); drawChart(state.progress); }
  function reset(){ if(state.animationId)cancelAnimationFrame(state.animationId); state.running=false; state.progress=0; state.data=buildSimulation(0,10,12,'accidente',950); ['resultCarga','resultH','resultBlocks','resultMax'].forEach(function(k){}); el.resultCarga.textContent='0.00 kg'; el.resultH.textContent='0.00 h'; el.resultBlocks.textContent='0 / 0'; el.resultMax.textContent='0.00 kg/h'; clearAlert(); renderDevelopment(state.data); renderAll(); }
  function start(){ var i=getInputs(); if(!i.ok){setAlert(i.message,'error');return;} clearAlert(); state.data=buildSimulation(i.a,i.b,i.n,i.profile,i.limit); renderDevelopment(state.data); state.running=true; state.startedAt=performance.now(); state.progress=0; setAlert('Simulación iniciada. La carga acumulada se actualiza con la tasa C(t).','success'); if(state.animationId)cancelAnimationFrame(state.animationId); function step(now){ state.progress=Math.min(1,(now-state.startedAt)/state.duration); renderAll(); if(state.progress<1&&state.running)state.animationId=requestAnimationFrame(step); else{state.running=false;state.progress=1;renderAll(); var ratio=state.data.load/state.data.limit; setAlert(ratio>=1?'Resultado crítico: la carga supera el límite permitido.':'Resultado final calculado con Simpson 3/8 compuesto.', ratio>=1?'warning':'success');}} state.animationId=requestAnimationFrame(step); }
  function toggleDev(){ el.dev.classList.toggle('hidden'); if(!el.dev.classList.contains('hidden'))el.dev.scrollIntoView({behavior:'smooth',block:'start'}); }
  function formulas(){ if(window.katex){ try{ katex.render(String.raw`L \approx \frac{3h}{8}\left[C_0 + 3C_1 + 3C_2 + 2C_3 + \cdots + C_n\right]`, $('pollutionFormulaLatex'), {throwOnError:false, displayMode:true}); katex.render(String.raw`L = \int C(t)\,dt`, $('pollutionIntegralLatex'), {throwOnError:false}); }catch(e){} } }
  function init(){ el.a=$('cTInicial');el.b=$('cTFinal');el.n=$('cN');el.limit=$('cLimite');el.profile=$('cPerfil');el.scene=$('pollutionSceneCanvas');el.chart=$('pollutionChartCanvas');el.alert=$('pollutionAlert');el.status=$('pollutionStatus');el.carga=$('pollutionCarga');el.tasa=$('pollutionTasa');el.nivel=$('pollutionNivel');el.progress=$('pollutionProgressBar');el.resultCarga=$('cResultadoCarga');el.resultH=$('cResultadoH');el.resultBlocks=$('cResultadoBloques');el.resultMax=$('cResultadoMax');el.dev=$('pollutionDevelopment');el.table=$('tablaDesarrolloCont');$('btnSimularCont').addEventListener('click',start);$('btnReiniciarCont').addEventListener('click',reset);$('btnDesarrolloCont').addEventListener('click',toggleDev);$('btnCerrarCont').addEventListener('click',toggleDev);formulas();reset();window.addEventListener('resize',renderAll); }
  document.addEventListener('DOMContentLoaded', init);
  window.__pollutionSimpsonTest={cFunction:cFunction, buildSimulation:buildSimulation};
})();
