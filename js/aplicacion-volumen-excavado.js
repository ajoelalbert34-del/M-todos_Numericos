/* ============================================================
   Aplicación gráfica: Volumen excavado con Simpson 3/8
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

  function areaFunction(profile,x,a,b){
    var span=Math.max(1e-9,b-a), u=(x-a)/span;
    if(profile==='zanja') return 18 + 4*Math.sin(Math.PI*u);
    if(profile==='canal') return 20 + 18*Math.sin(Math.PI*u) + 6*Math.sin(4*Math.PI*u);
    if(profile==='carretera') return 12 + 34*Math.exp(-Math.pow((u-.52)/.24,2)) + 5*Math.sin(2*Math.PI*u);
    if(profile==='profunda') return 16 + 52/(1+Math.exp(-11*(u-.34))) - 28*Math.max(0,u-.72);
    return 20;
  }
  function getInputs(){
    var a=Number(el.a.value), b=Number(el.b.value), n=Number(el.n.value), profile=el.profile.value;
    if(!isFinite(a)||!isFinite(b)||!isFinite(n)) return {ok:false,message:'Ingrese valores numéricos válidos.'};
    if(b<=a) return {ok:false,message:'La distancia final debe ser mayor a la inicial.'};
    if(n<=0||n%3!==0) return {ok:false,message:'n debe ser positivo y múltiplo de 3.'};
    return {ok:true,a:a,b:b,n:Math.round(n),profile:profile};
  }
  function buildSimulation(a,b,n,profile){
    var h=(b-a)/n, nodes=[], values=[], coeffs=[], weighted=[], sum=0;
    for(var i=0;i<=n;i++){
      var x=a+i*h, A=Math.max(0,areaFunction(profile,x,a,b));
      var coef=(i===0||i===n)?1:(i%3===0?2:3);
      nodes.push(x); values.push(A); coeffs.push(coef); weighted.push(coef*A); sum+=coef*A;
    }
    var volume=(3*h/8)*sum, max=Math.max.apply(null,values);
    return {a:a,b:b,n:n,h:h,profile:profile,nodes:nodes,values:values,coeffs:coeffs,weighted:weighted,volume:volume,max:max,blocks:n/3};
  }
  function partialVolume(data,xNow){
    if(!data) return 0; var a=data.a,b=data.b,end=Math.min(Math.max(xNow,a),b); if(end<=a)return 0;
    var samples=180, dx=(end-a)/samples, acc=0;
    for(var i=0;i<=samples;i++){ var x=a+i*dx, w=(i===0||i===samples)?0.5:1; acc+=w*Math.max(0,areaFunction(data.profile,x,a,b)); }
    return acc*dx;
  }
  function statusByProgress(p){ if(p>=1) return {label:'Resultado',color:'#add461'}; if(p>.02) return {label:'Analizando',color:'#e9c176'}; return {label:'Listo',color:'#add461'}; }

  function visualExcavationState(data, progress){
    progress=Math.max(0,Math.min(1,progress||0));
    if(!data) return {xNow:0,volume:0,area:0,volumeRatio:0,areaRatio:0,status:statusByProgress(progress)};
    var xNow=data.a+(data.b-data.a)*progress;
    var volume=partialVolume(data,xNow);
    var area=Math.max(0,areaFunction(data.profile,xNow,data.a,data.b));
    return {
      xNow:xNow,
      volume:volume,
      area:area,
      volumeRatio:Math.max(0,Math.min(1,volume/Math.max(1,data.volume))),
      areaRatio:Math.max(0,Math.min(1.15,area/Math.max(1,data.max))),
      status:statusByProgress(progress)
    };
  }

  function drawScene(progress){
    var c=el.scene,ctx=c.getContext('2d'),w=c.width,h=c.height,data=state.data,p=progress==null?state.progress:progress;
    var vs=visualExcavationState(data,p), now=Date.now();
    ctx.clearRect(0,0,w,h);
    var bg=ctx.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#151719'); bg.addColorStop(1,'#101214'); ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);

    var base=h*.72;
    var profile=data?data.profile:'canal';
    function terrainY(x){
      var n=x/w;
      if(profile==='zanja') return h*.39 + 22*Math.sin(n*Math.PI) + 10*Math.sin(x/80);
      if(profile==='canal') return h*.39 + 38*Math.sin(n*Math.PI) + 18*Math.sin(x/45);
      if(profile==='carretera') return h*.42 - 82*Math.exp(-Math.pow((n-.50)/.22,2)) + 16*Math.sin(x/70);
      if(profile==='profunda') return h*.45 - 92/(1+Math.exp(-10*(n-.38))) + 48*Math.max(0,n-.72) + 18*Math.sin(x/90);
      return h*.37 + 44*Math.sin(x/92) + 22*Math.sin(x/43);
    }

    // Terreno natural
    ctx.fillStyle='#24211d'; ctx.beginPath(); ctx.moveTo(0,base); for(var x=0;x<=w;x+=16)ctx.lineTo(x,terrainY(x)); ctx.lineTo(w,base); ctx.lineTo(0,base); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#e9c176'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,terrainY(0)); for(var x2=0;x2<=w;x2+=16)ctx.lineTo(x2,terrainY(x2)); ctx.stroke();

    // Zona excavada: el avance depende del volumen acumulado y la estación activa.
    var start=w*.18,end=w*.86;
    var current=start+(end-start)*p;
    var cutOpacity=0.18+0.34*vs.volumeRatio;
    ctx.fillStyle='rgba(200,128,63,'+cutOpacity.toFixed(3)+')';
    ctx.beginPath(); ctx.moveTo(start,terrainY(start));
    for(var xx=start;xx<=current;xx+=14)ctx.lineTo(xx,terrainY(xx));
    ctx.lineTo(current,base); ctx.lineTo(start,base); ctx.closePath(); ctx.fill();

    // Malla de estaciones medidas
    ctx.strokeStyle='rgba(255,183,123,'+(0.25+0.35*vs.volumeRatio).toFixed(3)+')'; ctx.lineWidth=1; ctx.setLineDash([6,8]);
    var stationCount=data?data.n:12;
    for(var s=0;s<=stationCount;s++){
      var sx=start+(end-start)*s/Math.max(1,stationCount);
      if(sx<=current+1){ ctx.beginPath();ctx.moveTo(sx,terrainY(sx));ctx.lineTo(sx,base);ctx.stroke(); }
    }
    ctx.setLineDash([]);

    // Sección activa: su altura/grosor depende de A(x).
    var activeHeight=50+105*vs.areaRatio;
    var secTop=Math.max(terrainY(current)-activeHeight*.25, h*.10);
    ctx.strokeStyle='#add461'; ctx.lineWidth=2.5+2.5*vs.areaRatio; ctx.beginPath(); ctx.moveTo(current,terrainY(current)); ctx.lineTo(current,base); ctx.stroke();
    ctx.fillStyle='#add461'; ctx.beginPath(); ctx.arc(current,terrainY(current),4+3*vs.areaRatio,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(173,212,97,.55)'; ctx.strokeRect(current-26, secTop, 52+28*vs.areaRatio, activeHeight);

    // Huella inferior de volumen acumulado
    ctx.fillStyle='rgba(233,193,118,'+(0.10+0.18*vs.volumeRatio).toFixed(3)+')';
    ctx.fillRect(start, base+8, (end-start)*vs.volumeRatio, 8);
    ctx.strokeStyle='#add461'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(start,base+18); ctx.lineTo(start+(end-start)*vs.volumeRatio,base+18); ctx.stroke();

    // pseudo secciones transversales — tamaño variable con área actual
    for(var k=0;k<4;k++){
      var bx=w*.63+k*28;
      var bh=42+70*vs.areaRatio-k*7;
      ctx.strokeStyle='rgba(160,141,128,.58)';
      ctx.strokeRect(bx,h*.21+k*5,54,Math.max(28,bh));
    }

    // etiquetas y mediciones
    ctx.fillStyle='#d8c3b4'; ctx.font='12px JetBrains Mono, monospace';
    ctx.fillText('TERRENO NATURAL', w*.05, h*.22);
    ctx.fillText('ÁREA EXCAVADA', w*.36, base+38);
    ctx.fillText('ESTACIÓN ACTIVA', Math.min(current+10,w-150), Math.max(terrainY(current)-18,30));
    ctx.fillStyle='#e9c176'; ctx.fillText('VOLUMEN VISUAL ' + fmt(vs.volumeRatio*100,0)+'%', 20, h-26);
    ctx.fillStyle='#add461'; ctx.fillText('A(x) ' + fmt(vs.area,1)+' m²', Math.min(current+10,w-150), Math.min(base-12, terrainY(current)+28));

    var st=vs.status; el.status.textContent=st.label; el.status.style.color=st.color;
  }
  function drawChart(progress){
    var c=el.chart,ctx=c.getContext('2d'),w=c.width,h=c.height,data=state.data||buildSimulation(0,90,12,'canal'),p=progress==null?state.progress:progress;
    ctx.clearRect(0,0,w,h); ctx.fillStyle='#0c0e10'; ctx.fillRect(0,0,w,h);
    var padL=62,padR=24,padT=28,padB=46,gx=padL,gy=padT,gw=w-padL-padR,gh=h-padT-padB;
    ctx.strokeStyle='rgba(82,68,57,.6)'; ctx.lineWidth=1; for(var i=0;i<=4;i++){var yy=gy+gh*i/4;ctx.beginPath();ctx.moveTo(gx,yy);ctx.lineTo(gx+gw,yy);ctx.stroke();} for(var j=0;j<=6;j++){var xx=gx+gw*j/6;ctx.beginPath();ctx.moveTo(xx,gy);ctx.lineTo(xx,gy+gh);ctx.stroke();}
    var max=Math.max(1,data.max*1.12); function tx(x){return gx+(x-data.a)/(data.b-data.a)*gw;} function ty(v){return gy+gh-v/max*gh;}
    var endX=data.a+(data.b-data.a)*Math.min(1,p), pts=[],samples=220;
    for(var k=0;k<=samples;k++){var x=data.a+(data.b-data.a)*k/samples;if(x>endX)break;pts.push([tx(x),ty(areaFunction(data.profile,x,data.a,data.b))]);}
    if(pts.length>1){ctx.beginPath();ctx.moveTo(pts[0][0],gy+gh);for(var q=0;q<pts.length;q++)ctx.lineTo(pts[q][0],pts[q][1]);ctx.lineTo(pts[pts.length-1][0],gy+gh);ctx.closePath();ctx.fillStyle='rgba(233,193,118,.20)';ctx.fill();ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(var m=1;m<pts.length;m++)ctx.lineTo(pts[m][0],pts[m][1]);ctx.strokeStyle='#e9c176';ctx.lineWidth=3;ctx.stroke();}
    for(var n=0;n<data.nodes.length;n++){var nxv=data.nodes[n];if(nxv<=endX+1e-9){var nx=tx(nxv),ny=ty(data.values[n]);ctx.fillStyle=n%3===0?'#ffb77b':'#add461';ctx.beginPath();ctx.arc(nx,ny,4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(216,195,180,.45)';ctx.beginPath();ctx.moveTo(nx,gy+gh);ctx.lineTo(nx,ny);ctx.stroke();}}
    ctx.strokeStyle='#a08d80';ctx.beginPath();ctx.moveTo(gx,gy);ctx.lineTo(gx,gy+gh);ctx.lineTo(gx+gw,gy+gh);ctx.stroke();ctx.fillStyle='#d8c3b4';ctx.font='12px JetBrains Mono, monospace';ctx.fillText('A(x) m²',8,gy+14);ctx.fillText('Distancia (m)',gx+gw-100,h-12);ctx.fillText(fmt(data.a,0),gx-6,h-26);ctx.fillText(fmt(data.b,0),gx+gw-24,h-26);
  }
  function renderDevelopment(data){ var html=''; for(var i=0;i<data.nodes.length;i++){html+='<tr><td>'+i+'</td><td>'+fmt(data.nodes[i],4)+'</td><td>'+fmt(data.values[i],4)+'</td><td>'+data.coeffs[i]+'</td><td>'+fmt(data.weighted[i],4)+'</td></tr>';} el.table.innerHTML=html; }
  function updateMetrics(p){ var data=state.data,xNow=data?data.a+(data.b-data.a)*p:0, vol=partialVolume(data,xNow), area=data?Math.max(0,areaFunction(data.profile,xNow,data.a,data.b)):0; el.vol.textContent=fmt(vol,2); el.area.textContent=fmt(area,2); el.station.textContent=fmt(p*100,0); el.progress.style.width=fmt(Math.min(100,p*100),1)+'%'; if(p>=1&&data){el.resultVol.textContent=fmt(data.volume,2)+' m³';el.resultH.textContent=fmt(data.h,4)+' m';el.resultBlocks.textContent=data.n+' / '+data.blocks;el.resultMax.textContent=fmt(data.max,2)+' m²';} }
  function renderAll(){ updateMetrics(state.progress); drawScene(state.progress); drawChart(state.progress); }
  function reset(){ if(state.animationId)cancelAnimationFrame(state.animationId); state.running=false; state.progress=0; state.data=buildSimulation(0,90,12,'canal'); el.resultVol.textContent='0.00 m³';el.resultH.textContent='0.00 m';el.resultBlocks.textContent='0 / 0';el.resultMax.textContent='0.00 m²'; clearAlert(); renderDevelopment(state.data); renderAll(); }
  function start(){ var i=getInputs(); if(!i.ok){setAlert(i.message,'error');return;} clearAlert(); state.data=buildSimulation(i.a,i.b,i.n,i.profile); renderDevelopment(state.data); state.running=true; state.startedAt=performance.now(); state.progress=0; setAlert('Análisis topográfico iniciado. Las secciones se integran progresivamente.','success'); if(state.animationId)cancelAnimationFrame(state.animationId); function step(now){state.progress=Math.min(1,(now-state.startedAt)/state.duration); renderAll(); if(state.progress<1&&state.running)state.animationId=requestAnimationFrame(step); else{state.running=false;state.progress=1;renderAll();setAlert('Volumen final calculado con Simpson 3/8 compuesto.','success');}} state.animationId=requestAnimationFrame(step); }
  function toggleDev(){ el.dev.classList.toggle('hidden'); if(!el.dev.classList.contains('hidden'))el.dev.scrollIntoView({behavior:'smooth',block:'start'}); }
  function formulas(){ if(window.katex){ try{ katex.render(String.raw`V \approx \frac{3h}{8}\left[A_0 + 3A_1 + 3A_2 + 2A_3 + \cdots + A_n\right]`, $('excavationFormulaLatex'), {throwOnError:false, displayMode:true}); katex.render(String.raw`V = \int A(x)\,dx`, $('excavationIntegralLatex'), {throwOnError:false}); }catch(e){} } }
  function init(){ el.a=$('eXInicial');el.b=$('eXFinal');el.n=$('eN');el.profile=$('ePerfil');el.scene=$('excavationSceneCanvas');el.chart=$('excavationChartCanvas');el.alert=$('excavationAlert');el.status=$('excavationStatus');el.vol=$('excavationVolumen');el.area=$('excavationArea');el.station=$('excavationEstacion');el.progress=$('excavationProgressBar');el.resultVol=$('eResultadoVolumen');el.resultH=$('eResultadoH');el.resultBlocks=$('eResultadoBloques');el.resultMax=$('eResultadoMax');el.dev=$('excavationDevelopment');el.table=$('tablaDesarrolloExc');$('btnSimularExc').addEventListener('click',start);$('btnReiniciarExc').addEventListener('click',reset);$('btnDesarrolloExc').addEventListener('click',toggleDev);$('btnCerrarExc').addEventListener('click',toggleDev);formulas();reset();window.addEventListener('resize',renderAll); }
  document.addEventListener('DOMContentLoaded', init);
  window.__excavationSimpsonTest={areaFunction:areaFunction, buildSimulation:buildSimulation};
})();
