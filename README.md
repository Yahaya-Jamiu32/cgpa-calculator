# CGPA Calculator
Static site: HTML + CSS + vanilla JS. No build step, no backend.

## Run locally
Open `index.html` in a browser (or run `npx serve .` in this folder).

## Deploy to Vercel
1. Create a GitHub repo and upload `index.html`, `style.css`, `script.js`, `README.md` to the repo root.
2. In Vercel: Add New → Project → import the repo.
3. Framework preset: **Other**. Leave build command and output directory empty.
4. Click Deploy.

## Notes
- Grade points live only in `GRADE_SCALE` at the top of `script.js`. Match it to your university's official scale.
- Entries are saved in your browser's localStorage only. "Clear all" erases them.
- CGPA = (previous CGPA × previous credits + this semester's quality points) ÷ (previous credits + this semester's credits).
