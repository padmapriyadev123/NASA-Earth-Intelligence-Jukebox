import {useState,useEffect,useRef,useContext} from 'react'
import {Play,Square,Upload,Headphones} from 'lucide-react'
import {Loc} from './pages.jsx'
import {api} from './api'
const recent=()=>new Date(Date.now()-5*864e5).toISOString().slice(0,10)
const P=[
 {n:'Night lights (Black Marble)',id:'VIIRS_Black_Marble',ext:'png',lvl:8,date:'2016-01-01'},
 {n:'Sea surface temperature',id:'GHRSST_L4_MUR_Sea_Surface_Temperature',ext:'png',lvl:7,date:recent()},
 {n:'Aerosols (smoke and dust)',id:'MODIS_Terra_Aerosol',ext:'png',lvl:6,date:recent()},
 {n:'Vegetation (NDVI)',id:'MODIS_Terra_NDVI_8Day',ext:'png',lvl:9,date:recent()},
 {n:'Fires (thermal anomalies)',id:'MODIS_Terra_Thermal_Anomalies_All',ext:'png',lvl:7,date:recent()},
 {n:'True colour',id:'MODIS_Terra_CorrectedReflectance_TrueColor',ext:'jpg',lvl:9,date:recent()}]
const SC={calm:[0,2,4,7,9],urgent:[0,1,3,5,7,8,10]}
const hsv=(r,g,b)=>{r/=255;g/=255;b/=255;const M=Math.max(r,g,b),m=Math.min(r,g,b),d=M-m;let h=0;if(d){h=M===r?((g-b)/d)%6:M===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360}return [h,M?d/M:0,M]}
const hn=h=>h<20||h>=340?'red':h<70?'yellow or orange':h<160?'green':h<260?'blue':'purple'
const url=(p,z,x,y)=>`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${p.id}/default/${p.date}/GoogleMapsCompatible_Level${p.lvl}/${z}/${y}/${x}.${p.ext}`

const demo=(g,W)=>{const r=g.createLinearGradient(0,0,W,W);r.addColorStop(0,'#08306b');r.addColorStop(1,'#0d5c8a');g.fillStyle=r;g.fillRect(0,0,W,W)
  ;[[.25,.35,.18,'#2e8b57'],[.6,.3,.22,'#c9a227'],[.7,.7,.2,'#3cb371'],[.3,.75,.15,'#e8eef5'],[.5,.55,.1,'#ff6a3d']].forEach(([x,y,s,c])=>{const q=g.createRadialGradient(x*W,y*W,0,x*W,y*W,s*W);q.addColorStop(0,c);q.addColorStop(1,'transparent');g.fillStyle=q;g.fillRect(0,0,W,W)})
  for(let i=0;i<60;i++){g.fillStyle='#ffe9a8';g.fillRect(Math.random()*W,Math.random()*W,3,3)}}
function analyze(g,W,label){
  const d=g.getImageData(0,0,W,W).data,C=32,cw=W/C,cols=[],q=[0,0,0,0],hc={};let n=0,bright=0,tv=0
  for(let c=0;c<C;c++){let sv=0,ss=0,sy=0,sw=0,bc=0,m=0,hx=0,hy=0
    for(let y=0;y<W;y+=3)for(let x=Math.floor(c*cw);x<(c+1)*cw;x+=3){const k=(y*W+x)*4,[h,s,v]=hsv(d[k],d[k+1],d[k+2]);m++;n++;sv+=v;ss+=s;tv+=v
      if(v>.45){bc++;bright++;sw+=v;sy+=v*y/W;q[(y<W/2?0:2)+(x<W/2?0:1)]++}
      if(v>.2&&s>.15){const nm=hn(h);hc[nm]=(hc[nm]||0)+1;hx+=Math.cos(h*Math.PI/180)*s*v;hy+=Math.sin(h*Math.PI/180)*s*v}}
    cols.push({v:sv/m,s:ss/m,den:bc/m,cy:sw?sy/sw:.5,h:(Math.atan2(hy,hx)*180/Math.PI+360)%360})}
  const top=Object.entries(hc).sort((a,b)=>b[1]-a[1])[0]?.[0],avg=tv/n,qi=q.indexOf(Math.max(...q)),qn=['upper left','upper right','lower left','lower right']
  const text=n&&avg>0.005?`${label}. The frame is ${avg<.2?'mostly dark':avg<.5?'moderately bright':'bright'}${top?`, with ${top} as the dominant colour`:''}. Bright areas cover ${Math.round(100*bright/n)}% of the image${bright?`, mostly in the ${qn[qi]}`:''}.`:`${label}. No imagery could be loaded for this date or area, so the frame is empty. Try another layer.`
  return {cols,text}
}

export default function Jukebox(){
  const {loc}=useContext(Loc); const cv=useRef(),ac=useRef(),timer=useRef(),frame=useRef(),outRef=useRef(),tuneRef=useRef(0)
  const [pi,setPi]=useState(0),[mode,setMode]=useState('place'),[mood,setMood]=useState('calm'),[bpm,setBpm]=useState(120),[vol,setVol]=useState(.7)
  const [desc,setDesc]=useState('Loading imagery…'),[playing,setPlaying]=useState(false),[pos,setPos]=useState(0),[now,setNow]=useState('')
  const stop=()=>{clearInterval(timer.current);ac.current?.close().catch(()=>{});ac.current=null;setPlaying(false)}
  const done=(g,W,label)=>{frame.current=analyze(g,W,label);setDesc(frame.current.text)}
  const load=async()=>{const was=!!ac.current;stop();setDesc('Loading NASA imagery…');const p=P[pi],glob=mode==='global',n=glob?2:3;let z=1,x0=0,y0=0,lat=loc.lat,lon=loc.lon,tuneTxt=''
    tuneRef.current=0
    if(!glob){let lo0=999,lo1=-999,la0=999,la1=-999,cnt=0;const walk=q=>{if(Array.isArray(q[0]))q.forEach(walk);else{cnt++;lo0=Math.min(lo0,q[0]);lo1=Math.max(lo1,q[0]);la0=Math.min(la0,q[1]);la1=Math.max(la1,q[1])}}
      try{walk(loc.geojson?.coordinates||[])}catch(e){}
      let span=6;if(cnt){span=Math.max(lo1-lo0,(la1-la0)*1.2,1);lon=(lo0+lo1)/2;lat=(la0+la1)/2}
      z=Math.max(2,Math.min(p.lvl,7,Math.round(Math.log2(720/span))));const M=2**z,r=lat*Math.PI/180
      x0=Math.floor((lon+180)/360*M)-1;y0=Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*M)-1
      try{const d=await api(`/power?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}&start=${new Date().getFullYear()-5}`);const t=d.stats.t_mean;tuneRef.current=Math.round(Math.max(0,Math.min(35,t))/35*12);tuneTxt=`, key tuned to its mean temperature of ${t.toFixed(1)} °C (warmer places sound higher)`}catch(e){}}
    const N=2**z
    let ok=0;const c=cv.current;c.width=c.height=n*256;const g=c.getContext('2d',{willReadFrequently:true});g.fillStyle='#000';g.fillRect(0,0,c.width,c.height)
    await Promise.all([...Array(n*n)].map((_,i)=>new Promise(res=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{ok++;g.drawImage(im,(i%n)*256,Math.floor(i/n)*256);res()};im.onerror=res
      im.src=url(p,z,((x0+i%n)%N+N)%N,Math.min(N-1,Math.max(0,y0+Math.floor(i/n))))})))
    if(!ok){demo(g,c.width);done(g,c.width,`Offline demo frame (NASA imagery could not be loaded, check your internet connection)`);if(was)play();return}
    done(g,c.width,`${p.n}, ${glob?'whole Earth':loc.name.split(',')[0]}${tuneTxt}`);if(was)play()}
  useEffect(()=>{if(outRef.current)outRef.current.gain.value=vol*2},[vol])
  useEffect(()=>{load();return stop},[pi,mode,loc.lat,loc.lon])
  const upload=e=>{const f=e.target.files[0];if(!f)return;stop();const im=new Image();im.onload=()=>{const c=cv.current;c.width=c.height=512;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0,512,512);done(g,512,`Your image "${f.name}"`)};im.src=URL.createObjectURL(f)}
  const play=(b=bpm)=>{if(!frame.current)return;stop();const A=new (window.AudioContext||window.webkitAudioContext)();ac.current=A;A.resume&&A.resume();const out=A.createGain();out.gain.value=vol*2;const cm=A.createDynamicsCompressor();out.connect(cm);cm.connect(A.destination);outRef.current=out
    const sc=SC[mood],midi=(d,o)=>48+tuneRef.current+12*o+sc[d%sc.length]+12*Math.floor(d/sc.length),f=m=>440*2**((m-69)/12)
    const tone=(m,t,dur,g,type,cut)=>{const o=A.createOscillator(),e=A.createGain(),l=A.createBiquadFilter();o.type=type;o.frequency.value=f(m);l.type='lowpass';l.frequency.value=cut
      e.gain.setValueAtTime(0,t);e.gain.linearRampToValueAtTime(g,t+.03);e.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(l);l.connect(e);e.connect(out);o.start(t);o.stop(t+dur+.05)}
    let i=0;const step=60/b/2,tick=()=>{const c=frame.current.cols[i%32],t=A.currentTime+.05,d=Math.floor(c.h/360*sc.length)
      if(c.v>.03){const oct=c.v<.3?0:c.v<.6?1:2,type=c.s>.45?'sawtooth':'triangle',cut=500+c.s*3500
        ;[0,2,4].forEach(k=>tone(midi(d+k,oct),t,step*1.6,.06+.16*c.v,type,cut))
        const notes=1+Math.round(c.den*3),ld=Math.round((1-c.cy)*sc.length*1.5)+sc.length
        for(let k=0;k<notes;k++)tone(midi(ld+(k%2)*2,1),t+k*step/notes,step/notes*1.2,.12,'sine',4000)}
      setPos(i%32);setNow(`Column ${i%32+1} of 32: ${hn(c.h)}, brightness ${Math.round(c.v*100)}%, ${1+Math.round(c.den*3)} notes per beat`);i++}
    tick();timer.current=setInterval(tick,step*1000);setPlaying(true)}
  return <div className="space-y-3">
    <section className="glass p-4"><h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-1"><Headphones size={20} className="text-cyan-300"/>Earth Jukebox: hear what NASA imagery looks like</h2>
      <p className="text-sm text-slate-300">Search a country, state or city above, pick a NASA Earth image, then press Play: each place sounds different. The sound is generated live from the pixels, scanning the picture from left to right.</p></section>
    <section className="glass p-4"><div className="flex flex-wrap gap-2 mb-3 items-end">
      <label className="text-sm">Visualization<br/><select aria-label="Choose visualization" className="inp" value={pi} onChange={e=>setPi(+e.target.value)}>{P.map((p,i)=><option key={i} value={i}>{p.n}</option>)}</select></label>
      <label className="text-sm">Area<br/><select aria-label="Choose area" className="inp" value={mode} onChange={e=>setMode(e.target.value)}><option value="global">Whole Earth</option><option value="place">Selected place</option></select></label>
      <label className="text-sm">Mood<br/><select aria-label="Choose mood" className="inp" value={mood} onChange={e=>setMood(e.target.value)}><option value="calm">Calm (major pentatonic)</option><option value="urgent">Urgent (phrygian)</option></select></label>
      <label className="btn cursor-pointer text-sm flex items-center gap-1"><Upload size={14}/>Use my own frame<input type="file" accept="image/*" className="sr-only" onChange={upload}/></label></div>
      <div className="relative max-w-xl"><canvas ref={cv} role="img" aria-label={desc} className="w-full rounded-xl border border-blue-500/40 bg-black"/>
        {playing&&<div aria-hidden className="absolute top-0 bottom-0 w-[3%] bg-cyan-300/50 shadow-[0_0_14px_#00e5ff]" style={{left:`${pos/32*100}%`,transition:'left .3s linear'}}/>}</div>
      <p className="text-sm mt-3 text-slate-200" aria-live="polite"><b className="text-cyan-300">Description:</b> {desc}</p>
      <div className="flex flex-wrap gap-4 items-center mt-3">
        <button className="btn flex items-center gap-2" onClick={()=>playing?stop():play()} aria-label={playing?'Stop sound':'Play sound'}>{playing?<><Square size={16}/>Stop</>:<><Play size={16}/>Play</>}</button>
        <label className="text-sm">Tempo {bpm} bpm <input type="range" min={60} max={240} value={bpm} onChange={e=>{const b=+e.target.value;setBpm(b);if(playing)play(b)}} className="accent-cyan-400 align-middle"/></label>
        <label className="text-sm">Volume <input type="range" min={0} max={1} step={.05} value={vol} onChange={e=>setVol(+e.target.value)} className="accent-cyan-400 align-middle"/></label></div>
      <p className="text-xs text-slate-400 mt-2" aria-live="off">{playing?now:'Press Play to start. Tempo and volume change while playing.'}</p></section>
    <section className="glass p-4"><h3 className="font-semibold text-white mb-2">How sight becomes sound</h3>
      <ul className="text-sm text-slate-300 space-y-1 list-disc pl-5"><li><b>Time:</b> the image is split into 32 vertical strips, played left to right, so position on the map becomes position in time.</li>
      <li><b>Colour to harmony:</b> each strip's average hue picks the root of a three-note chord on a musical scale, so colours never clash.</li>
      <li><b>Brightness to loudness and register:</b> dark areas are quiet and low, bright areas louder and higher; pure black is silent.</li>
      <li><b>Saturation to timbre:</b> vivid colours get a brighter, buzzier tone, and pale colours a softer one.</li>
      <li><b>Bright-pixel density to rhythm:</b> more bright pixels in a strip means more notes per beat.</li>
      <li><b>Height of the brightest features to melody:</b> features near the top play higher notes.</li></ul>
      <p className="text-xs text-amber-300 mt-3">This is an artistic mapping to help people explore patterns, not a calibrated measurement. Imagery comes from NASA GIBS; layer names and dates may need adjusting if a frame loads empty. Screen-reader users get a text description of every frame.</p></section></div>}
