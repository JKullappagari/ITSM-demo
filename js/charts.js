/* Meridian Service Desk: SVG charts, bars, tiles and sparklines */
"use strict";
/* ---------- charts ---------- */
function niceMax(m){if(m<=0)return 4;const raw=m/4;const mag=Math.pow(10,Math.floor(Math.log10(raw)));for(const f of [1,2,2.5,5,10]){if(f*mag>=raw)return f*mag*4}return m}
function fmtTick(v){return v>=1000?(v/1000).toFixed(v%1000?1:0)+'k':(Math.round(v*10)/10).toString()}
function lineChart(labels,series,opts){
  opts=opts||{};
  const W=640,H=opts.h||210,pl=38,pr=14,pt=12,pb=26;
  const max=opts.max||niceMax(Math.max(1,...series.flatMap(s=>s.values)));
  const n=labels.length;const x=i=>pl+(n<=1?0:i*(W-pl-pr)/(n-1));const y=v=>pt+(1-v/max)*(H-pt-pb);
  let g='<g class="grid">';for(let k=0;k<=4;k++){const v=max*k/4;g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${fmtTick(v)}${opts.unit||''}</text>`}g+='</g>';
  const every=Math.ceil(n/8);let xl='';labels.forEach((l,i)=>{if(i%every===0||i===n-1&&n<12)xl+=`<text x="${x(i)}" y="${H-6}" text-anchor="middle">${esc(l)}</text>`});
  let paths='';
  series.forEach((s,si)=>{
    const pts=s.values.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`);
    const col=`var(--${s.color||'accent'})`;
    if(si===0&&opts.area!==false)paths+=`<path d="M${pts[0]} L${pts.join(' L')} L${x(n-1)},${y(0)} L${x(0)},${y(0)} Z" fill="${col}" fill-opacity=".12" stroke="none"/>`;
    paths+=`<polyline points="${pts.join(' ')}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" ${s.dash?'stroke-dasharray="5 4"':''}/>`;
    const lv=s.values[n-1];paths+=`<circle cx="${x(n-1)}" cy="${y(lv)}" r="3.5" fill="${col}"/>`;
  });
  if(opts.target!=null){const ty=y(opts.target);paths+=`<line x1="${pl}" x2="${W-pr}" y1="${ty}" y2="${ty}" stroke="var(--crit)" stroke-dasharray="3 3" stroke-width="1"/><text x="${W-pr}" y="${ty-5}" text-anchor="end" style="fill:var(--crit)">Target ${opts.target}${opts.unit||''}</text>`}
  const leg=series.length>1||opts.legend?`<div class="legend">${series.map(s=>`<span><i class="sw-${s.color||'accent'}"></i>${esc(s.name)}</span>`).join('')}</div>`:'';
  return leg+`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label||'Trend chart')}">${g}${paths}<line class="axis" x1="${pl}" x2="${W-pr}" y1="${y(0)}" y2="${y(0)}"/>${xl}</svg>`;
}
function stackCols(labels,keys,rows,colors,label){
  const W=640,H=210,pl=34,pr=10,pt=12,pb=26;
  const max=niceMax(Math.max(1,...rows.map(r=>r.reduce((a,b)=>a+b,0))));
  const n=labels.length;const bw=(W-pl-pr)/n;const y=v=>pt+(1-v/max)*(H-pt-pb);
  let g='<g class="grid">';for(let k=0;k<=4;k++){const v=max*k/4;g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${fmtTick(v)}</text>`}g+='</g>';
  let bars='';const every=Math.ceil(n/8);
  rows.forEach((r,i)=>{let acc=0;const bx=pl+i*bw+bw*.18,w=bw*.64;
    r.forEach((v,k)=>{if(!v)return;const y1=y(acc+v),y0=y(acc);bars+=`<rect x="${bx.toFixed(1)}" y="${y1.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0,y0-y1-1).toFixed(1)}" fill="var(--${colors[k]})" rx="1"><title>${esc(labels[i])}: ${v} ${esc(keys[k])}</title></rect>`;acc+=v});
    if(i%every===0)bars+=`<text x="${(pl+i*bw+bw/2).toFixed(1)}" y="${H-6}" text-anchor="middle">${esc(labels[i])}</text>`;
  });
  return `<div class="legend">${keys.map((k,i)=>`<span><i class="sw-${colors[i]}"></i>${esc(k)}</span>`).join('')}</div><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}${bars}<line class="axis" x1="${pl}" x2="${W-pr}" y1="${y(0)}" y2="${y(0)}"/></svg>`;
}
function spark(vals){
  if(!vals.length)return '';const W=84,H=26;const mx=Math.max(...vals),mn=Math.min(...vals);const r=mx-mn||1;
  const pts=vals.map((v,i)=>`${(i*(W-4)/(vals.length-1||1)+2).toFixed(1)},${(H-3-(v-mn)/r*(H-6)).toFixed(1)}`);
  const last=pts[pts.length-1].split(',');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${pts.join(' ')}"/><circle cx="${last[0]}" cy="${last[1]}" r="2.4"/></svg>`;
}
function bars(items,opts){
  opts=opts||{};
  if(!items.length)return '<div class="empty">No records in this period.</div>';
  const max=opts.max||Math.max(1,...items.map(i=>i.value));
  return `<div class="bars">${items.map(i=>`<div class="bar-row"><span class="lbl" title="${esc(i.label)}">${esc(i.label)}</span><div class="bar-track"><div class="bar-fill ${i.cls||''}" style="width:${Math.min(100,i.value/max*100).toFixed(1)}%"></div>${i.mark!=null?`<div class="bar-mark" style="left:${Math.min(100,i.mark/max*100).toFixed(1)}%" title="Target"></div>`:''}</div><span class="bar-val">${i.text!=null?i.text:i.value}${i.sub?` <small>${i.sub}</small>`:''}</span></div>`).join('')}</div>`;
}
function tile(label,val,unit,sub,state,sp){
  return `<div class="tile ${state||'neutral'}"><span class="eyebrow">${esc(label)}</span><span class="val">${val}${unit?`<small>${unit}</small>`:''}</span><div class="sub"><span>${sub||''}</span>${sp||''}</div></div>`;
}

