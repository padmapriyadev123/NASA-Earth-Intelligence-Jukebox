import os, io, json, time, sqlite3
import numpy as np, pandas as pd, requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__); CORS(app)
DB = os.path.join(os.path.dirname(__file__), "jukebox.db")
FIRMS_KEY = os.environ.get("FIRMS_MAP_KEY")  # optional: https://firms.modaps.eosdis.nasa.gov/api/map_key/
POWER = "https://power.larc.nasa.gov/api/temporal/monthly/point"
UA = {"User-Agent": "NASA-Earth-Intelligence-Jukebox/1.0 (TechHackers)"}
MISSIONS = [
 (1, "Identify temperature trend", "Has the monthly temperature anomaly trend been warming or cooling since 2010?", ["warming", "cooling"], 20),
 (2, "Investigate rainfall", "Which calendar month (1-12) has the highest average rainfall here?", [str(i) for i in range(1, 13)], 30),
 (3, "Compare vegetation signal", "Has relative humidity (our vegetation-moisture proxy) risen or fallen since 2010?", ["rising", "falling"], 20),
 (4, "Find a fire hotspot", "Were any NASA FIRMS fire detections found in the last 2 days near this location?", ["yes", "no"], 30)]

def db():
    c = sqlite3.connect(DB); c.row_factory = sqlite3.Row; return c
with db() as c:
    c.execute("CREATE TABLE IF NOT EXISTS cache(k TEXT PRIMARY KEY, ts REAL, v TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS done(mission INTEGER PRIMARY KEY, points INTEGER, ts REAL)")
    c.execute("CREATE TABLE IF NOT EXISTS done2(mission INTEGER, loc TEXT, points INTEGER, ts REAL, PRIMARY KEY(mission, loc))")

def cached(key, ttl, fn):
    with db() as c:
        r = c.execute("SELECT ts,v FROM cache WHERE k=?", (key,)).fetchone()
        if r and time.time() - r["ts"] < ttl: return json.loads(r["v"])
        v = fn(); c.execute("REPLACE INTO cache VALUES(?,?,?)", (key, time.time(), json.dumps(v))); return v

def fetch_power(lat, lon, start):
    end = time.gmtime().tm_year
    r = requests.get(POWER, params=dict(parameters="T2M,PRECTOTCORR,RH2M", community="RE", longitude=lon, latitude=lat,
                     start=start, end=end, format="JSON"), timeout=60)
    r.raise_for_status(); return r.json()["properties"]["parameter"]

def frame(lat, lon, start=2010):
    p = cached(f"p:{lat:.2f}:{lon:.2f}:{start}", 86400, lambda: fetch_power(lat, lon, start))
    df = pd.DataFrame({"t2m": p["T2M"], "prec": p["PRECTOTCORR"], "rh": p["RH2M"]})
    df = df[~df.index.str.endswith("13")]            # drop annual-mean pseudo-month
    df = df.replace(-999, np.nan)                     # POWER fill value -> missing
    df.index = pd.to_datetime(df.index, format="%Y%m"); df = df.dropna(how="all")
    return df

def trend_per_decade(s):
    s = s.dropna()
    if len(s) < 24: return None
    x = s.index.year + (s.index.month - 1) / 12
    anom = s - s.groupby(s.index.month).transform("mean")  # remove seasonality
    return float(np.polyfit(x, anom.values, 1)[0] * 10)

def fires(lat, lon):
    if not FIRMS_KEY: return None
    b = f"{lon-1},{lat-1},{lon+1},{lat+1}"
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{FIRMS_KEY}/VIIRS_SNPP_NRT/{b}/2"
    def go():
        t = requests.get(url, timeout=60).text
        d = pd.read_csv(io.StringIO(t)); return d[["latitude", "longitude", "acq_date"]].head(200).to_dict("records")
    try: return cached(f"f:{lat:.1f}:{lon:.1f}", 3600, go)
    except Exception: return None

def stats(df):
    return dict(t_trend=trend_per_decade(df.t2m), p_trend=trend_per_decade(df.prec), rh_trend=trend_per_decade(df.rh),
                t_mean=float(df.t2m.mean()), p_mean=float(df.prec.mean()), rh_mean=float(df.rh.mean()),
                wettest=int(df.prec.groupby(df.index.month).mean().idxmax()), first=str(df.index[0].date()), last=str(df.index[-1].date()))

def ll(): return float(request.args["lat"]), float(request.args["lon"])

from werkzeug.exceptions import HTTPException
@app.errorhandler(Exception)
def err(e):
    if isinstance(e, HTTPException): return jsonify(error=e.description), e.code
    return jsonify(error=f"{type(e).__name__}: {e}"), 502

@app.get("/")
def index(): return jsonify(status="ok", try_endpoints=["/api/power?lat=12.97&lon=77.59"])

def nominatim(q):
    r = requests.get("https://nominatim.openstreetmap.org/search", headers=UA, timeout=10,
        params=dict(q=q, format="json", limit=6, polygon_geojson=1, polygon_threshold=0.01)).json()
    return [dict(name=x["display_name"], lat=float(x["lat"]), lon=float(x["lon"]), geojson=x.get("geojson")) for x in r]

def openmeteo(q):  # backup geocoder, no boundary outline
    r = requests.get("https://geocoding-api.open-meteo.com/v1/search", params=dict(name=q, count=6), timeout=10).json().get("results", [])
    return [dict(name=", ".join(filter(None, [x["name"], x.get("admin1"), x.get("country")])), lat=x["latitude"], lon=x["longitude"], geojson=None) for x in r]

@app.get("/api/geocode")
def geocode():
    q = request.args["q"].strip(); key = "g:" + q.lower()
    with db() as c: hit = c.execute("SELECT v FROM cache WHERE k=?", (key,)).fetchone()
    if hit: return jsonify(json.loads(hit["v"]))
    for fn in (nominatim, openmeteo):
        try: res = fn(q)
        except (requests.RequestException, ValueError): continue
        if res:
            with db() as c: c.execute("REPLACE INTO cache VALUES(?,?,?)", (key, time.time(), json.dumps(res)))
            return jsonify(res)
    return jsonify(error="Could not reach a location service. Check your internet connection and try again."), 503

@app.get("/api/power")
def power():
    lat, lon = ll(); df = frame(lat, lon, int(request.args.get("start", 2010)))
    rows = [dict(date=d.strftime("%Y-%m"), t2m=None if np.isnan(r.t2m) else round(r.t2m, 2),
                 prec=None if np.isnan(r.prec) else round(r.prec, 2), rh=None if np.isnan(r.rh) else round(r.rh, 1)) for d, r in df.iterrows()]
    return jsonify(rows=rows, stats=stats(df), units=dict(t2m="°C", prec="mm/day", rh="%"),
                   source="NASA POWER monthly point API (T2M, PRECTOTCORR, RH2M)")

@app.get("/api/alerts")
def alerts():
    lat, lon = ll(); df = frame(lat, lon); out = []
    last = df.dropna().iloc[-1]; m = df[df.index.month == last.name.month].iloc[:-1]
    z = (last.t2m - m.t2m.mean()) / (m.t2m.std() or 1)
    out.append(dict(type="Temperature anomaly", level="high" if z > 1.5 else "normal",
        msg=f"{last.name:%b %Y}: {last.t2m:.1f}°C vs {m.t2m.mean():.1f}°C average for this month ({z:+.1f} σ).", source="NASA POWER T2M"))
    z = (last.prec - m.prec.mean()) / (m.prec.std() or 1)
    out.append(dict(type="Heavy rainfall indicator", level="high" if z > 1.5 else "normal",
        msg=f"{last.name:%b %Y}: {last.prec:.2f} mm/day vs {m.prec.mean():.2f} typical ({z:+.1f} σ).", source="NASA POWER PRECTOTCORR"))
    f = fires(lat, lon)
    if f is None: out.append(dict(type="Fire hotspots", level="unknown", msg="Set FIRMS_MAP_KEY on the backend to load NASA FIRMS detections. The map's thermal-anomalies layer works without it.", source="NASA FIRMS"))
    else: out.append(dict(type="Fire hotspots", level="high" if len(f) > 20 else "watch" if f else "normal", msg=f"{len(f)} VIIRS detections within ~100 km in the last 2 days.", source="NASA FIRMS", points=f))
    return jsonify(out)

@app.get("/api/health")
def health():
    lat, lon = ll(); s = stats(frame(lat, lon)); f = fires(lat, lon); clip = lambda v: float(max(0, min(100, v)))
    parts = [dict(name="Temperature trend", score=clip(100 - 40 * s["t_trend"]), detail=f"{s['t_trend']:+.2f} °C/decade (deseasonalised)"),
             dict(name="Rainfall trend", score=clip(100 - 2 * abs(100 * s["p_trend"] / max(s["p_mean"], .01))), detail=f"{s['p_trend']:+.2f} mm/day per decade"),
             dict(name="Vegetation (humidity proxy)", score=clip(100 - 8 * max(0, -s["rh_trend"])), detail=f"RH {s['rh_trend']:+.2f} pts/decade")]
    if f is not None: parts.append(dict(name="Fire activity", score=clip(100 - 2 * len(f)), detail=f"{len(f)} detections in 2 days"))
    return jsonify(score=round(float(np.mean([p["score"] for p in parts])), 1), parts=parts,
        method="Equal-weight mean of component scores (0-100). Temperature: 100 - 40 x warming rate. Rainfall: 100 - 2 x |% change per decade|. Vegetation: 100 - 8 x humidity decline in points per decade. Fire: 100 - 2 x detections.",
        limits="Custom indicator, NOT an official NASA measurement. Vegetation uses humidity as a proxy because NDVI is not fetched; fire is excluded without a FIRMS key; trends use 2010 onward.")

@app.post("/api/ask")
def ask():
    b = request.get_json(); q = b["q"].lower(); lat, lon = b["lat"], b["lon"]; place = b.get("place", "this location")
    s = stats(frame(lat, lon)); src = ["NASA POWER monthly point API"]
    if any(k in q for k in ("hot", "temperature", "warm")):
        a = f"Since 2010, {place} shows a deseasonalised temperature trend of {s['t_trend']:+.2f} °C per decade (mean {s['t_mean']:.1f} °C). POWER shows the change, not its cause; attributing it needs regional climate studies."
    elif any(k in q for k in ("rain", "precip", "monsoon")):
        a = f"Mean rainfall is {s['p_mean']:.2f} mm/day, trending {s['p_trend']:+.2f} mm/day per decade. The wettest month on average is month {s['wettest']}."
    elif any(k in q for k in ("fire", "hotspot")):
        f = fires(lat, lon); src = ["NASA FIRMS (VIIRS NRT)"]
        a = ("FIRMS is not configured (set FIRMS_MAP_KEY). Switch the map layer to Thermal anomalies to view MODIS detections from NASA GIBS." if f is None
             else f"FIRMS reports {len(f)} VIIRS fire detections within ~100 km in the last 2 days." + (f" Nearest sample: {f[0]['latitude']:.2f}, {f[0]['longitude']:.2f} on {f[0]['acq_date']}." if f else ""))
    else:
        a = f"Between {s['first'][:4]} and {s['last'][:4]}: temperature {s['t_trend']:+.2f} °C/decade, rainfall {s['p_trend']:+.2f} mm/day/decade, humidity {s['rh_trend']:+.2f} pts/decade. Compare years on the satellite map in Time Machine to see changes visually."
    return jsonify(answer=a, sources=src)

def lockey(lat, lon): return f"{round(float(lat), 1)},{round(float(lon), 1)}"

@app.get("/api/missions")
def missions():
    key = lockey(request.args.get("lat", 0), request.args.get("lon", 0)); place = request.args.get("place", "this location")
    with db() as c:
        d = {r["mission"] for r in c.execute("SELECT mission FROM done2 WHERE loc=?", (key,))}
        total = c.execute("SELECT COALESCE(SUM(points),0) FROM done2").fetchone()[0]
    return jsonify(total=total, missions=[dict(id=i, title=t, prompt=f"{place}: {p}", options=o, points=pt, done=i in d) for i, t, p, o, pt in MISSIONS])

@app.post("/api/missions/<int:mid>/answer")
def mission_answer(mid):
    b = request.get_json(); m = next(x for x in MISSIONS if x[0] == mid); s = stats(frame(b["lat"], b["lon"]))
    truth = {1: "warming" if s["t_trend"] > 0 else "cooling", 2: str(s["wettest"]), 3: "rising" if s["rh_trend"] > 0 else "falling"}.get(mid)
    if mid == 4:
        f = fires(b["lat"], b["lon"]); truth = None if f is None else ("yes" if f else "no")
    ok = truth is None or b["answer"] == truth
    if ok:
        with db() as c: c.execute("INSERT OR IGNORE INTO done2 VALUES(?,?,?,?)", (mid, lockey(b["lat"], b["lon"]), m[4], time.time()))
    return jsonify(correct=ok, note="Accepted without verification: FIRMS key not set." if truth is None else "", points=m[4] if ok else 0)

if __name__ == "__main__": app.run(port=5000, debug=True)
