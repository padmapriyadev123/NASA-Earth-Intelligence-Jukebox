import {useState,useEffect,useContext,createContext,createElement} from 'react'
import {MapContainer,TileLayer,GeoJSON,useMap,useMapEvents} from 'react-leaflet'
import {LineChart,Line,BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,Legend,ReferenceLine} from 'recharts'
import {Search,Send,Satellite,Activity,Bot,Rocket,AlertTriangle,HeartPulse,Trophy,Music,Globe,Thermometer,CloudRain,Flame,Droplets,History,Sparkles,Database,Info,ListChecks,Users,FlaskConical,Target,Check,MapPin,Sprout,Play,Pause} from 'lucide-react'
import {Link} from 'react-router-dom'
import {api,post} from './api'
export const Loc=createContext()
const useLoc=()=>useContext(Loc)
const Card=({title,icon:I,tone='#22d3ee',children,className=''})=><section className={`glass p-4 ${className}`}>{title&&<h2 className="flex items-center gap-2 text-lg font-semibold mb-3 text-white">{I&&<span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/40 to-purple-500/40 shadow-[0_0_12px_#00e5ff44]" style={{color:tone}}><I size={18}/></span>}{title}</h2>}{children}</section>
const Err=({e})=>e?<p className="text-amber-300 text-sm">{e}</p>:null

export function usePower(loc,yrs=10){
  const [s,setS]=useState({loading:true})
  useEffect(()=>{setS({loading:true});api(`/power?lat=${loc.lat}&lon=${loc.lon}&start=${new Date().getFullYear()-yrs}`).then(d=>setS({data:d})).catch(e=>setS({error:e.message}))},[loc.lat,loc.lon,yrs])
  return s
}

export function LocationSearch(){
  const {loc,setLoc}=useLoc(); const [q,setQ]=useState(''); const [res,setRes]=useState([]); const [e,setE]=useState('')
  const go=async ev=>{ev.preventDefault();setE('');try{const r=await api('/geocode?q='+encodeURIComponent(q));setRes(r);if(!r.length)setE('No places found. Try a different name.')}catch(x){setE(x.message)}}
  return <Card className="mb-3"><form onSubmit={go} className="flex gap-2"><input className="inp flex-1" placeholder="Search a country, state or city" value={q} onChange={e=>setQ(e.target.value)}/><button className="btn flex gap-1 items-center"><Search size={16}/>Search</button></form>
    <p className="flex items-center gap-1 text-sm text-slate-300 mt-2"><MapPin size={16} className="text-red-400 shrink-0"/>Selected: <b className="text-cyan-300">{loc.name}</b> ({loc.lat.toFixed(4)}, {loc.lon.toFixed(4)})</p><Err e={e}/>
    {res.map((r,i)=><button key={i} onClick={()=>{setLoc(r);setRes([])}} className="block w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-blue-500/20">{r.name}</button>)}</Card>
}

const LAYERS={
 'True color':{id:'MODIS_Terra_CorrectedReflectance_TrueColor',ext:'jpg',lvl:9},
 'Fires (thermal anomalies)':{id:'MODIS_Terra_Thermal_Anomalies_All',ext:'png',lvl:7},
 'Vegetation (NDVI)':{id:'MODIS_Terra_NDVI_8Day',ext:'png',lvl:9},
 'Land surface temp (day)':{id:'MODIS_Terra_Land_Surface_Temp_Day',ext:'png',lvl:7}}
const dateFor=y=>y>=new Date().getFullYear()?new Date(Date.now()-4*864e5).toISOString().slice(0,10):`${y}-03-15`
const gibs=(l,y)=>{const L=LAYERS[l];return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${L.id}/default/${dateFor(y)}/GoogleMapsCompatible_Level${L.lvl}/{z}/{y}/{x}.${L.ext}`}
function Sync({view,setView}){
  const m=useMap(); useMapEvents({moveend:()=>{const c=m.getCenter();setView({c:[c.lat,c.lng],z:m.getZoom()})}})
  useEffect(()=>{const c=m.getCenter();if(Math.abs(c.lat-view.c[0])>1e-6||Math.abs(c.lng-view.c[1])>1e-6||m.getZoom()!==view.z)m.setView(view.c,view.z)},[view])
  return null}
function Sat({y,layer,view,setView,loc}){
  const L=LAYERS[layer]
  return <MapContainer center={view.c} zoom={view.z} className="h-[420px] w-full" zoomControl>
    <TileLayer key={layer+y} url={gibs(layer,y)} maxNativeZoom={L.lvl} maxZoom={12} attribution="Imagery: NASA GIBS"/>
    {loc.geojson&&<GeoJSON key={loc.name} data={loc.geojson} style={{color:'#00e5ff',weight:2,fillOpacity:0}}/>}
    <Sync view={view} setView={setView}/></MapContainer>}
export function SatMap({compare=false}){
  const {loc}=useLoc(); const now=new Date().getFullYear()
  const [view,setView]=useState({c:[loc.lat,loc.lon],z:6}); const [layer,setLayer]=useState('True color'); const [y,setY]=useState(now); const [y0,setY0]=useState(2015); const [cmp,setCmp]=useState(compare)
  useEffect(()=>setView({c:[loc.lat,loc.lon],z:6}),[loc.lat,loc.lon])
  const years=Array.from({length:now-2000},(_,i)=>now-i)
  const Sel=({v,set})=><select className="inp" value={v} onChange={e=>set(+e.target.value)}>{years.map(x=><option key={x}>{x}</option>)}</select>
  return <Card icon={Satellite} tone="#34d399" title="Satellite view (NASA GIBS)">
    <div className="flex flex-wrap gap-2 mb-3 items-center"><select className="inp" value={layer} onChange={e=>setLayer(e.target.value)}>{Object.keys(LAYERS).map(k=><option key={k}>{k}</option>)}</select>
      <label className="text-sm">{cmp?'After':'Year'} <Sel v={y} set={setY}/></label>
      {cmp&&<label className="text-sm">Before <Sel v={y0} set={setY0}/></label>}
    </div>
    <div className={cmp?'grid md:grid-cols-2 gap-2':''}>
      {cmp&&<div><p className="text-xs text-cyan-300 mb-1">Before: {dateFor(y0)}</p><Sat y={y0} layer={layer} view={view} setView={setView} loc={loc}/></div>}
      <div>{cmp&&<p className="text-xs text-cyan-300 mb-1">After: {dateFor(y)}</p>}<Sat y={y} layer={layer} view={view} setView={setView} loc={loc}/></div></div>
    <p className="text-xs text-slate-400 mt-2">Daily/8-day MODIS imagery via NASA GIBS; cloud gaps or missing tiles can occur on some dates. Outline: OpenStreetMap Nominatim.</p></Card>}

const Range=()=>{const {yrs,setYrs}=useLoc();return <div className="flex gap-2 mb-3">{[1,5,10].map(n=><button key={n} onClick={()=>setYrs(n)} className={`rounded-full px-4 py-1 text-sm border ${yrs===n?'bg-blue-600 border-cyan-300 shadow-[0_0_12px_#00e5ff66]':'border-blue-500/40 hover:bg-blue-500/20'}`}>{n} Year{n>1?'s':''}</button>)}</div>}
export function PowerCharts({power}){
  if(power.loading)return <Card icon={Activity} tone="#38bdf8" title="Climate history (NASA POWER)"><Range/>Loading…</Card>
  if(power.error)return <Card icon={Activity} title="Climate history (NASA POWER)"><Range/><Err e={power.error}/></Card>
  const {rows,units,stats,source}=power.data
  const C=({k,color,u,bar})=><div className="h-48"><p className="text-sm text-cyan-300">{{t2m:'Temperature',prec:'Precipitation',rh:'Relative humidity'}[k]} ({u})</p>
    <ResponsiveContainer>{bar?<BarChart data={rows}><CartesianGrid stroke="#1b2a5c"/><XAxis dataKey="date" minTickGap={40} stroke="#8fb0ff"/><YAxis stroke="#8fb0ff"/><Tooltip contentStyle={{background:'#070c22'}}/><Bar dataKey={k} fill={color}/></BarChart>
      :<LineChart data={rows}><CartesianGrid stroke="#1b2a5c"/><XAxis dataKey="date" minTickGap={40} stroke="#8fb0ff"/><YAxis domain={['auto','auto']} stroke="#8fb0ff"/><Tooltip contentStyle={{background:'#070c22'}}/><Line dataKey={k} stroke={color} dot={false} connectNulls={false}/></LineChart>}</ResponsiveContainer></div>
  return <Card icon={Activity} title="Climate history (NASA POWER)"><Range/><div className="grid lg:grid-cols-3 gap-3"><C k="t2m" color="#00e5ff" u={units.t2m}/><C k="prec" color="#7b8cff" u={units.prec} bar/><C k="rh" color="#b66bff" u={units.rh}/></div>
    <p className="text-xs text-slate-400 mt-2">{source}. {stats.first} to {stats.last}. Missing values (-999) are shown as gaps.</p></Card>}

export function Chat(){
  const {loc}=useLoc(); const [m,setM]=useState([{r:'ai',t:'Ask about temperature, rainfall, fires or overall environmental change for the selected place.'}]); const [q,setQ]=useState(''); const [busy,setBusy]=useState(false)
  const send=async t=>{t=t||q;if(!t.trim())return;setQ('');setBusy(true);setM(x=>[...x,{r:'u',t}])
    try{const a=await post('/ask',{q:t,lat:loc.lat,lon:loc.lon,place:loc.name});setM(x=>[...x,{r:'ai',t:a.answer,s:a.sources}])}catch(e){setM(x=>[...x,{r:'ai',t:'Could not retrieve data: '+e.message}])}setBusy(false)}
  return <Card icon={Bot} tone="#60a5fa" title="Ask Earth AI"><div className="flex flex-wrap gap-2 mb-3">{['Why is Karnataka getting hotter?','How has rainfall changed?','Where are recent fire hotspots?','What environmental changes are visible?'].map(s=><button key={s} onClick={()=>send(s)} className="text-xs border border-blue-500/50 rounded-full px-3 py-1 hover:bg-blue-500/20">{s}</button>)}</div>
    <div className="space-y-2 max-h-72 overflow-auto mb-3">{m.map((x,i)=><div key={i} className={`p-3 rounded-xl text-sm ${x.r==='u'?'bg-blue-600/30 ml-8':'bg-slate-800/60 mr-8'}`}>{x.r!=='u'&&<Bot size={18} className="inline mr-2 -mt-1 text-cyan-300"/>}{x.t}{x.s&&<div className="text-xs text-cyan-300 mt-1">Source: {x.s.join(', ')}</div>}</div>)}{busy&&<p className="text-sm text-slate-400">Retrieving NASA data…</p>}</div>
    <form onSubmit={e=>{e.preventDefault();send()}} className="flex gap-2"><input className="inp flex-1" value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask a question"/><button className="btn"><Send size={16}/></button></form></Card>}

export function Future({power}){
  const [dT,setT]=useState(2),[dP,setP]=useState(10),[dV,setV]=useState(15)
  const s=power.data?.stats, cl=v=>Math.max(0,Math.min(100,v))
  const Sl=({l,v,set,min,max,u})=><label className="block text-sm mb-3">{l}: <b className="text-cyan-300">{v}{u}</b><input type="range" min={min} max={max} value={v} onChange={e=>set(+e.target.value)} className="w-full accent-cyan-400"/></label>
  const base={'Drought risk':30,'Fire risk':25,'Vegetation health':70,'Heat stress':30}
  const sc={'Drought risk':cl(30+8*dT+1.2*dP+.3*dV),'Fire risk':cl(25+6*dT+.8*dP+.5*dV),'Vegetation health':cl(70-3*dT-.6*dP-.9*dV),'Heat stress':cl(30+14*dT)}
  const data=Object.keys(base).map(k=>({k,Baseline:base[k],Scenario:Math.round(sc[k])}))
  return <Card icon={FlaskConical} tone="#c084fc" title="Future Earth: what-if simulator"><div className="grid md:grid-cols-2 gap-4"><div>
    <Sl l="Temperature increase" v={dT} set={setT} min={0} max={5} u=" °C"/><Sl l="Rainfall reduction" v={dP} set={setP} min={0} max={50} u="%"/><Sl l="Vegetation reduction" v={dV} set={setV} min={0} max={60} u="%"/>
    {s&&<p className="text-sm">Baseline mean: {s.t_mean.toFixed(1)} °C → <b className="text-cyan-300">{(s.t_mean+dT).toFixed(1)} °C</b>; rainfall {s.p_mean.toFixed(2)} → <b className="text-cyan-300">{(s.p_mean*(1-dP/100)).toFixed(2)} mm/day</b></p>}</div>
    <div className="h-64"><ResponsiveContainer><BarChart data={data}><CartesianGrid stroke="#1b2a5c"/><XAxis dataKey="k" stroke="#8fb0ff" fontSize={11}/><YAxis domain={[0,100]} stroke="#8fb0ff"/><Tooltip contentStyle={{background:'#070c22'}}/><Legend/><Bar dataKey="Baseline" fill="#4a6cff"/><Bar dataKey="Scenario" fill="#00e5ff"/></BarChart></ResponsiveContainer></div></div>
    <p className="text-xs text-amber-300 mt-3">Scenario simulation only, not a prediction. Indexes (0-100) come from simple illustrative linear rules, not a climate model. Baseline temperature and rainfall come from NASA POWER.</p></Card>}

const AI={'Temperature anomaly':Thermometer,'Heavy rainfall indicator':CloudRain,'Fire hotspots':Flame}
const HI={'Temperature trend':Thermometer,'Rainfall trend':CloudRain,'Vegetation (humidity proxy)':Sprout,'Fire activity':Flame}
const HC={'Temperature trend':'#ef4444','Rainfall trend':'#60a5fa','Vegetation (humidity proxy)':'#22c55e','Fire activity':'#f97316'}
const MI={1:[Thermometer,'#ef4444'],2:[CloudRain,'#60a5fa'],3:[Sprout,'#22c55e'],4:[Target,'#f97316']}
export function Alerts(){
  const {loc}=useLoc(); const [a,setA]=useState(); const [e,setE]=useState('')
  useEffect(()=>{setA();setE('');api(`/alerts?lat=${loc.lat}&lon=${loc.lon}`).then(setA).catch(x=>setE(x.message))},[loc.lat,loc.lon])
  const col={high:'text-red-400',watch:'text-amber-300',normal:'text-emerald-300',unknown:'text-slate-400'}
  return <Card icon={AlertTriangle} tone="#ef4444" title="Earth danger alerts"><Err e={e}/>{!a&&!e&&'Loading…'}{a?.map((x,i)=><div key={i} className="mb-3 p-3 rounded-xl bg-slate-900/60"><b className={col[x.level]}>{createElement(AI[x.type]||AlertTriangle,{size:16,className:'inline mr-1 -mt-0.5'})}{x.type}: {x.level}</b><p className="text-sm">{x.msg}</p><p className="text-xs text-slate-400">Source: {x.source}</p></div>)}</Card>}

export function HealthScore(){
  const {loc}=useLoc(); const [h,setH]=useState(); const [e,setE]=useState('')
  useEffect(()=>{setH();setE('');api(`/health?lat=${loc.lat}&lon=${loc.lon}`).then(setH).catch(x=>setE(x.message))},[loc.lat,loc.lon])
  return <Card icon={HeartPulse} tone="#22c55e" title="Earth health score (custom indicator)"><Err e={e}/>{!h&&!e&&'Loading…'}{h&&<><div className="relative w-36 h-36 mb-4"><svg viewBox="0 0 36 36" className="-rotate-90"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#12204a" strokeWidth="3"/><circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${h.score} 100`}/></svg><div className="absolute inset-0 grid place-items-center text-center"><div><div className="text-3xl font-bold">{Math.round(h.score)}%</div><div className="text-green-400 text-sm">{h.score>=70?'Healthy':h.score>=40?'Fair':'Needs attention'}</div></div></div></div>
    {h.parts.map(p=><div key={p.name} className="mb-2"><div className="flex justify-between text-sm"><span className="flex items-center gap-1">{createElement(HI[p.name]||Activity,{size:16,style:{color:HC[p.name]}})}{p.name}</span><span>{Math.round(p.score)} · {p.detail}</span></div><div className="h-2 rounded bg-slate-800"><div className="h-2 rounded bg-gradient-to-r from-blue-500 to-cyan-300" style={{width:p.score+'%'}}/></div></div>)}
    <p className="text-xs text-slate-300 mt-3"><b>How it is calculated:</b> {h.method}</p><p className="text-xs text-amber-300 mt-1"><b>Limitations:</b> {h.limits}</p></>}</Card>}

export function Missions(){
  const {loc}=useLoc(); const [d,setD]=useState(); const [msg,setMsg]=useState({}); const load=()=>api(`/missions?lat=${loc.lat}&lon=${loc.lon}&place=${encodeURIComponent(loc.name.split(',')[0])}`).then(setD).catch(()=>{})
  useEffect(()=>{setMsg({});load()},[loc.lat,loc.lon])
  const ans=async(id,a)=>{try{const r=await post(`/missions/${id}/answer`,{answer:a,lat:loc.lat,lon:loc.lon});setMsg(m=>({...m,[id]:r.correct?`Correct! +${r.points} points. ${r.note}`:'Not quite. Check the charts and try again.'}));load()}catch(e){setMsg(m=>({...m,[id]:e.message}))}}
  return <Card icon={Trophy} tone="#facc15" title={`Mission mode for ${loc.name.split(',')[0]} · ${d?.total??0} total points`}>{d?.missions.map(m=><div key={m.id} className="mb-3 p-3 rounded-xl bg-slate-900/60"><div className="flex items-center gap-2">{createElement(MI[m.id][0],{size:22,style:{color:MI[m.id][1]}})}<b>{m.title}</b><span className="text-xs text-cyan-300">{m.points} pts</span>{m.done&&<span className="flex items-center gap-1 text-xs text-green-400"><Check size={14}/>Completed</span>}</div><p className="text-sm text-slate-300">{m.prompt}</p>
    <div className="flex flex-wrap gap-2 mt-2">{m.options.map(o=><button key={o} className="btn text-sm" onClick={()=>ans(m.id,o)}>{o}</button>)}</div>{msg[m.id]&&<p className="text-sm mt-1 text-cyan-300">{msg[m.id]}</p>}</div>)}</Card>}


const TC={'/jukebox':'#c084fc','/explore':'#38bdf8','/ask':'#93c5fd','/future':'#22d3ee','/time':'#2dd4bf','/alerts':'#ef4444','/health':'#22c55e','/missions':'#facc15'}
const tile=c=>({background:`linear-gradient(135deg,${c}55,${c}18)`,border:`1px solid ${c}99`,color:c,boxShadow:`0 0 20px ${c}44`})
const FEATURES=[['/jukebox','Earth Jukebox','Hear NASA Earth imagery: colour, brightness and shape become live music.',Music],['/explore','Explore Earth','Satellite map, before/after imagery and NASA climate charts for any place.',Globe],['/ask','Ask Earth AI','Ask questions and get answers built from retrieved NASA data, with sources.',Bot],['/future','Future Earth','Test what-if scenarios for temperature, rainfall and vegetation.',Rocket],['/time','Time Machine','Travel back to any year: compare satellite images, play a timelapse and see how temperature, rainfall and humidity changed.',History],['/alerts','Danger Alerts','Temperature anomalies, heavy rainfall and fire detections.',AlertTriangle],['/health','Earth Health','A transparent custom score with its method and limits shown.',HeartPulse],['/missions','Mission Mode','Complete data missions and earn points.',Trophy]]
export function HomePage(){
  return <div className="space-y-3">
    <section className="glass relative overflow-hidden p-6 md:p-10 min-h-[380px]" style={{background:'rgba(3,6,15,.6)',backdropFilter:'none',WebkitBackdropFilter:'none'}}>
      <div aria-hidden className="stars absolute inset-0"/><img aria-hidden alt="" src="/earth.jpg" className="hidden md:block absolute max-w-none pointer-events-none" style={{width:560,height:560,right:-70,top:-90,mixBlendMode:'screen'}}/>
      <div className="relative max-w-2xl">
        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">Hear and see our changing planet through NASA data.</h2>
        <p className="mt-3 text-slate-300">NASA Earth Intelligence Jukebox turns NASA satellite imagery into live sound, so people who cannot see the images can still experience them, and adds climate records you can explore, question and test. Pick any country, state or city and see what the data says.</p>
        <div className="flex flex-wrap gap-2 mt-6"><Link className="btn inline-flex items-center gap-2" to="/jukebox"><Music size={16}/>Open Earth Jukebox</Link><Link className="btn !bg-none border border-cyan-400/60 inline-flex items-center gap-2" to="/explore"><Globe size={16}/>Explore Earth</Link></div>
      </div></section>
    <Card icon={Info} tone="#38bdf8" title="About the project"><p className="text-slate-300 max-w-3xl">Climate and satellite data is public but hard to read. This project brings it into one dashboard: you search a location, and the app retrieves satellite imagery and monthly temperature, rainfall and humidity records, then helps you interpret them. Everything shown comes from NASA sources, and anything we calculate ourselves is labelled as such.</p></Card>
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">{FEATURES.map(([to,t,d,I])=><Link key={to} to={to} className="glass p-4 block"><span className="grid place-items-center w-14 h-14 mb-3 rounded-2xl" style={tile(TC[to])}><I size={28}/></span><b className="text-lg" style={{color:TC[to]}}>{t}</b><p className="text-sm text-slate-300 mt-1">{d}</p></Link>)}</div>
    <div className="grid md:grid-cols-2 gap-3">
      <Card icon={Database} tone="#a78bfa" title="Data sources"><ul className="text-sm text-slate-300 space-y-2"><li><b className="text-white">NASA POWER:</b> monthly temperature, precipitation and relative humidity.</li><li><b className="text-white">NASA GIBS:</b> satellite imagery layers for true colour, fires, vegetation and surface temperature.</li><li><b className="text-white">NASA FIRMS:</b> recent fire detections (needs a free key).</li></ul></Card>
      <Card icon={Sparkles} tone="#facc15" title="How it works"><ol className="text-sm text-slate-300 space-y-2 list-decimal pl-5"><li>Search for a place and select it.</li><li>The Flask backend fetches and cleans the NASA data.</li><li>Charts, maps, alerts and answers update for that place.</li></ol><p className="text-xs text-amber-300 mt-3">Scenarios and the health score are custom estimates, not official NASA measurements or predictions.</p></Card></div>
    <Card><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Users className="text-cyan-300"/><div><b className="text-white">Built by TechHackers</b><p className="text-sm text-slate-400">Discover, Predict, Protect Our Planet.</p></div></div><Link className="btn" to="/explore">Explore Earth</Link></div></Card>
  </div>}
export const Explore=({power})=><div className="grid xl:grid-cols-2 gap-3"><div className="xl:col-span-2"><SatMap/></div><PowerCharts power={power}/><Chat/><Future power={power}/><Alerts/><HealthScore/><Missions/></div>
export function TimeMachine(){
  const {loc}=useLoc(); const now=new Date().getFullYear()
  const [view,setView]=useState({c:[loc.lat,loc.lon],z:6}),[layer,setLayer]=useState('True color'),[y0,setY0]=useState(2005),[y1,setY1]=useState(now),[play,setPlay]=useState(false),[p,setP]=useState()
  useEffect(()=>setView({c:[loc.lat,loc.lon],z:6}),[loc.lat,loc.lon])
  useEffect(()=>{setP();api(`/power?lat=${loc.lat}&lon=${loc.lon}&start=2001`).then(setP).catch(e=>setP({error:e.message}))},[loc.lat,loc.lon])
  useEffect(()=>{if(!play)return;const t=setInterval(()=>setY1(y=>y>=now?y0+1:y+1),1800);return()=>clearInterval(t)},[play,y0])
  const ann={};(p?.data?.rows||[]).forEach(r=>{const y=r.date.slice(0,4);ann[y]=ann[y]||{t:[],p:[],h:[]};if(r.t2m!=null)ann[y].t.push(r.t2m);if(r.prec!=null)ann[y].p.push(r.prec);if(r.rh!=null)ann[y].h.push(r.rh)})
  const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null
  const yr=y=>({t:mean(ann[y]?.t||[]),p:mean(ann[y]?.p||[]),h:mean(ann[y]?.h||[])})
  const A=yr(y0),B=yr(y1),series=Object.keys(ann).filter(y=>ann[y].t.length).map(y=>({year:+y,t:+mean(ann[y].t).toFixed(2)}))
  const rows=[['Temperature','t','°C',1],['Rainfall','p','mm/day',-1],['Relative humidity','h','%',-1]]
  const fmt=v=>v==null?'n/a':v.toFixed(2)
  return <div className="space-y-3">
    <Card icon={History} tone="#2dd4bf" title="Time Machine: travel through satellite years">
      <p className="text-sm text-slate-300 mb-3">Pick two years and compare the same place from space. Press Play to run a timelapse through the years on the right-hand map.</p>
      <div className="grid md:grid-cols-4 gap-3 items-end mb-3">
        <label className="text-sm">Layer<select className="inp w-full" value={layer} onChange={e=>setLayer(e.target.value)}>{Object.keys(LAYERS).map(k=><option key={k}>{k}</option>)}</select></label>
        <label className="text-sm">Before year: <b className="text-cyan-300">{y0}</b><input type="range" min={2001} max={now-1} value={y0} onChange={e=>{setPlay(false);const v=+e.target.value;setY0(v);if(y1<=v)setY1(v+1)}} className="w-full accent-cyan-400"/></label>
        <label className="text-sm">After year: <b className="text-cyan-300">{y1}</b><input type="range" min={y0+1} max={now} value={y1} onChange={e=>{setPlay(false);setY1(+e.target.value)}} className="w-full accent-cyan-400"/></label>
        <button className="btn flex items-center justify-center gap-2" onClick={()=>setPlay(!play)}>{play?<><Pause size={16}/>Pause</>:<><Play size={16}/>Play timelapse</>}</button></div>
      <div className="grid md:grid-cols-2 gap-2">{[[y0,'Before'],[y1,'After']].map(([y,l])=><div key={l}><p className="text-sm font-semibold text-cyan-300 mb-1">{l}: {y} (image date {dateFor(y)})</p><Sat y={y} layer={layer} view={view} setView={setView} loc={loc}/></div>)}</div>
      <p className="text-xs text-slate-400 mt-2">Each map shows one day of NASA GIBS imagery, so clouds and seasons can differ between years. Use the vegetation layer for a clearer greenness comparison.</p></Card>
    <Card icon={Activity} tone="#38bdf8" title={`What changed between ${y0} and ${y1}?`}>
      {!p&&'Loading NASA POWER history…'}<Err e={p?.error}/>
      {p?.data&&<div className="grid lg:grid-cols-2 gap-4"><div className="h-56"><p className="text-sm text-cyan-300">Annual mean temperature (°C)</p><ResponsiveContainer><LineChart data={series}><CartesianGrid stroke="#1b2a5c"/><XAxis dataKey="year" stroke="#8fb0ff"/><YAxis domain={['auto','auto']} stroke="#8fb0ff"/><Tooltip contentStyle={{background:'#070c22'}}/><Line dataKey="t" stroke="#00e5ff" dot={false}/><ReferenceLine x={y0} stroke="#facc15"/><ReferenceLine x={y1} stroke="#f472b6"/></LineChart></ResponsiveContainer></div>
        <table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th>Measure</th><th>{y0}</th><th>{y1}</th><th>Change</th></tr></thead><tbody>{rows.map(([n,k,u,sg])=>{const d=A[k]!=null&&B[k]!=null?B[k]-A[k]:null;return <tr key={k} className="border-t border-blue-500/20"><td className="py-2">{n} ({u})</td><td>{fmt(A[k])}</td><td>{fmt(B[k])}</td><td className={d==null?'':(d*sg>0?'text-green-400':'text-red-400')}>{d==null?'n/a':(d>0?'+':'')+d.toFixed(2)}</td></tr>})}</tbody></table></div>}
      <p className="text-xs text-slate-400 mt-2">Source: NASA POWER annual means of monthly values. The current year is partial. Differences between two single years reflect weather variability as well as long-term change.</p></Card></div>}
