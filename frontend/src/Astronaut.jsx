export default function Astronaut(){
  return <svg viewBox="0 0 200 190" className="w-full max-w-[190px] mx-auto" role="img" aria-label="Illustration of an astronaut sitting on the Moon pointing at the stars">
    <defs>
      <linearGradient id="suit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset="1" stopColor="#b6c4d8"/></linearGradient>
      <linearGradient id="visor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2b5bd7"/><stop offset=".6" stopColor="#0b1a4a"/><stop offset="1" stopColor="#070d26"/></linearGradient>
      <linearGradient id="moon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8795ad"/><stop offset="1" stopColor="#1b2438"/></linearGradient>
    </defs>
    {[[20,20,1.6],[50,60,1],[170,25,1.8],[185,90,1],[30,110,1.2],[140,12,1],[110,95,.8]].map(([x,y,r],i)=><circle key={i} cx={x} cy={y} r={r} fill="#cfe3ff" opacity=".85"/>)}
    <path d="M0 190V172Q70 140 130 156T200 150V190Z" fill="url(#moon)"/>
    <circle cx="36" cy="176" r="7" fill="#0f172a" opacity=".35"/><circle cx="160" cy="172" r="5" fill="#0f172a" opacity=".35"/>
    <g className="float" style={{filter:'drop-shadow(0 0 10px #4f8bff88)'}}>
      <rect x="58" y="74" width="34" height="52" rx="9" fill="#94a3b8"/>
      <rect x="70" y="78" width="62" height="64" rx="24" fill="url(#suit)"/>
      <rect x="96" y="130" width="62" height="24" rx="12" fill="#e2e8f0"/><rect x="148" y="126" width="20" height="30" rx="8" fill="#475569"/>
      <rect x="68" y="98" width="14" height="36" rx="7" fill="#f1f5f9" transform="rotate(-12 75 110)"/>
      <rect x="118" y="64" width="14" height="46" rx="7" fill="#f8fafc" transform="rotate(38 125 90)"/><circle cx="152" cy="62" r="9" fill="#cbd5e1"/>
      <rect x="88" y="104" width="26" height="15" rx="4" fill="#0e2a5c"/><circle cx="95" cy="111" r="2.5" fill="#38bdf8"/><circle cx="104" cy="111" r="2.5" fill="#f87171"/>
      <circle cx="100" cy="54" r="33" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2"/>
      <rect x="75" y="39" width="50" height="31" rx="15.5" fill="url(#visor)"/>
      <ellipse cx="91" cy="48" rx="9" ry="4" fill="#fff" opacity=".35" transform="rotate(-18 91 48)"/>
    </g></svg>}
