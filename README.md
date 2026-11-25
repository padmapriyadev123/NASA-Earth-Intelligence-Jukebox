# NASA Earth Intelligence Jukebox

**Discover Earth. Predict Changes. Protect Our Future.**
Team **TechHackers** · NASA Space Apps Challenge 2026 · *The Earth Information Jukebox*

An interactive web app that lets people **see, hear and explore** NASA Earth data. It turns NASA satellite imagery into live sound, compares places and years, and explains climate records in plain language.

## Features
- **Earth Jukebox:** NASA GIBS imagery is analysed in the browser and played as live generated sound (Web Audio API). Colour sets the chord, brightness sets loudness and pitch, saturation shapes the tone, bright-pixel density sets rhythm. Each frame gets a text description for screen-reader users.
- **Explore Earth:** location search, NASA GIBS satellite map, NASA POWER charts (temperature, rainfall, humidity) for 1, 5 or 10 years.
- **Ask Earth AI:** rule-based answers built from retrieved NASA data, with the source named (no trained AI model or LLM).
- **Future Earth:** what-if simulator (temperature, rainfall, vegetation). Illustrative only.
- **Time Machine:** compare satellite imagery from two years, timelapse, and a table of climate change between them.
- **Danger Alerts:** temperature and rainfall anomalies from NASA POWER; fire detections from NASA FIRMS when a key is set.
- **Earth Health Score:** transparent custom 0-100 indicator with its method and limits shown.
- **Mission Mode:** data missions checked per location, with points saved in SQLite.

## Tech stack
React + Vite, Tailwind CSS, React Router, Leaflet / React-Leaflet, Recharts, Lucide icons · Python Flask, Pandas, NumPy, Requests · SQLite · Web Audio API.

## NASA data sources
- [NASA POWER](https://power.larc.nasa.gov/docs/) monthly point API (T2M, PRECTOTCORR, RH2M)
- [NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/) satellite imagery tiles
- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) active fire detections (optional MAP_KEY)
- Place search: OpenStreetMap Nominatim

  ## Result
  <img width="1366" height="768" alt="Image1" src="https://github.com/user-attachments/assets/7d160633-b972-479d-85fb-57eeedd1ffbe" />
  <img width="1366" height="768" alt="Image2 0" src="https://github.com/user-attachments/assets/de59b8a8-8dbf-41d9-ab1b-6a7ca865532f" />
  <img width="1366" height="768" alt="Image2 1" src="https://github.com/user-attachments/assets/e89ab333-7a52-41d2-956d-375651bafe03" />
  <img width="1366" height="768" alt="Image3 0" src="https://github.com/user-attachments/assets/6e7c1a05-8263-4862-8bb0-b8cdac8507c8" />
  <img width="1366" height="768" alt="Image3 1" src="https://github.com/user-attachments/assets/9c45047b-8448-4222-b47a-4d4fbda63c5b"/> 
  <img width="1366" height="768" alt="Image4" src="https://github.com/user-attachments/assets/f1d1e09b-953b-4071-8d6c-43ccac36b23e" />
  <img width="1366" height="768" alt="Image5" src="https://github.com/user-attachments/assets/f6d8c55e-9d32-4ed3-98b9-a9d5f3048f0d" />
  <img width="1366" height="768" alt="Image6" src="https://github.com/user-attachments/assets/9c2a4ba5-bc93-4997-9eb7-5b38c981234f" />
  <img width="1366" height="768" alt="Image7" src="https://github.com/user-attachments/assets/5267082b-f674-49a7-b751-eef05dce211e" />
  <img width="1366" height="768" alt="Image8" src="https://github.com/user-attachments/assets/9aa776f0-b29a-421b-81f3-c660c80308df" />
  <img width="1366" height="768" alt="Image9" src="https://github.com/user-attachments/assets/b8682961-0bb2-4e74-b6d0-f7bb58f628cc" />
  


## Run locally
**Backend**
```bash
cd backend
pip install -r requirements.txt
# optional, for live fire data (free key: https://firms.modaps.eosdis.nasa.gov/api/map_key/)
# PowerShell: $env:FIRMS_MAP_KEY="your_key"      bash: export FIRMS_MAP_KEY=your_key
python app.py
```
**Frontend** (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The frontend proxies `/api` to Flask on port 5000. An internet connection is required for NASA data.

## Limitations
Fire data needs a FIRMS key. Imagery coverage varies by place and date. The health score uses humidity as a proxy for vegetation. The simulator uses simple linear rules, not a climate model. The sound mapping is artistic, not a calibrated measurement.
