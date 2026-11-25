import {useState,useEffect} from 'react'
import {NavLink,Routes,Route,useLocation} from 'react-router-dom'
import {Music,Home,Globe,Sparkles,Orbit,History,AlertTriangle,HeartPulse,Trophy,Leaf,Users,CircleUser,Telescope,TrendingUp,ShieldCheck,Satellite,Rocket} from 'lucide-react'
import Jukebox from './Jukebox.jsx'
import Astronaut from './Astronaut.jsx'
import {Loc,usePower,LocationSearch,Explore,Chat,Future,TimeMachine,Alerts,HealthScore,Missions,HomePage} from './pages.jsx'
const nav=[['/','Home',Home,'#60a5fa'],['/jukebox','Earth Jukebox',Music,'#c084fc'],['/explore','Explore Earth',Globe,'#38bdf8'],['/ask','Ask Earth AI',Sparkles,'#93c5fd'],['/future','Future Earth',Orbit,'#22d3ee'],['/time','Time Machine',History,'#2dd4bf'],['/alerts','Danger Alerts',AlertTriangle,'#ef4444'],['/health','Earth Health',HeartPulse,'#22c55e'],['/missions','Mission Mode',Trophy,'#facc15']]
export default function App(){
  const [loc,setLoc]=useState({name:'Karnataka, India',lat:15.3173,lon:75.7139,geojson:null})
  useEffect(()=>{fetch('/api/geocode?q=Karnataka, India').then(r=>r.json()).then(r=>r[0]&&setLoc(r[0])).catch(()=>{})},[])
  const [yrs,setYrs]=useState(10); const power=usePower(loc,yrs); const pathname=useLocation().pathname,onHome=pathname==='/'
  const [earth,setEarth]=useState(85); useEffect(()=>{document.documentElement.style.setProperty('--eo',String(earth/100*(onHome?0:.35)))},[earth,onHome])
  const P={power}
  return <Loc.Provider value={{loc,setLoc,yrs,setYrs}}><div className="flex min-h-screen">
    <aside className="glass m-3 p-3 w-16 md:w-60 shrink-0 sticky top-3 self-start">
      {nav.map(([to,l,I,c])=><NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1 hover:bg-blue-500/20 ${isActive?'bg-blue-500/30 text-cyan-300 shadow-[0_0_14px_#00e5ff55]':''}`}><I size={22} style={{color:c,filter:`drop-shadow(0 0 6px ${c}aa)`}}/><span className="hidden md:inline">{l}</span></NavLink>)}
      <div className="hidden md:block mt-6 pt-4 border-t border-blue-500/30 text-center"><Astronaut/><p className="italic text-slate-300 mt-2">Small Steps… Big Impact!</p></div>
    </aside>
    <main className="flex-1 p-3 min-w-0">
      <header className="glass p-4 mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="block w-14 h-14 rounded-full overflow-hidden shrink-0 bg-black" style={{border:'2px solid #38bdf8',boxShadow:'0 0 20px #38bdf8aa'}}><img src="/earth.jpg" alt="Planet Earth" style={{width:74,maxWidth:'none',marginLeft:-9,marginTop:-9}}/></span><div><h1 className="text-2xl font-bold text-white">NASA <span className="bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">Earth Intelligence Jukebox</span></h1><p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-cyan-300 italic"><span className="inline-flex items-center gap-1"><Telescope size={16} className="text-sky-300"/>Discover,</span><span className="inline-flex items-center gap-1"><TrendingUp size={16} className="text-purple-300"/>Predict,</span><span className="inline-flex items-center gap-1"><ShieldCheck size={16} className="text-green-400"/>Protect Our Planet.</span><Leaf size={16} className="text-green-400"/></p></div></div>
        <div className="flex items-center gap-3"><span className="grid place-items-center w-10 h-10 rounded-xl" style={{color:'#22d3ee',background:'#22d3ee22',border:'1px solid #22d3ee66'}}><Users size={20}/></span><div className="text-right"><div className="font-bold text-cyan-300">TechHackers</div><div className="text-xs text-slate-400">Not an official NASA product</div></div></div>
      </header>
      {!onHome&&pathname!=='/jukebox'||pathname==='/jukebox'?<LocationSearch/>:null}
      <Routes>
        <Route path="/" element={<HomePage/>}/><Route path="/jukebox" element={<Jukebox/>}/><Route path="/explore" element={<Explore {...P}/>}/>
        <Route path="/ask" element={<Chat/>}/><Route path="/future" element={<Future {...P}/>}/>
        <Route path="/time" element={<TimeMachine/>}/><Route path="/alerts" element={<Alerts/>}/>
        <Route path="/health" element={<HealthScore/>}/><Route path="/missions" element={<Missions/>}/>
      </Routes>
    </main></div></Loc.Provider>
}
