const fs = require('node:fs');
const home = fs.readFileSync('client/src/pages/Home.tsx', 'utf8');
const css = fs.readFileSync('client/src/index.css', 'utf8');
const routes = JSON.parse(fs.readFileSync('client/public/manus-routes.json', 'utf8'));
const main = fs.readFileSync('client/src/main.jsx', 'utf8');
const app = fs.readFileSync('client/src/App.jsx', 'utf8');
const html = fs.readFileSync('client/index.html', 'utf8');

for (const token of ['ReactDOM.createRoot', 'React.StrictMode', 'document.getElementById("root")', 'import "./index.css"']) { if (!main.includes(token)) throw new Error(`Missing mount contract: ${token}`); }
if (!html.includes('<div id="root"></div>') || !html.includes('/src/main.jsx')) throw new Error('Vite HTML mount contract missing');
if (!app.includes('<Home />') || !app.includes('<ErrorBoundary>')) throw new Error('App composition contract missing');
if (!css.includes('@import "tailwindcss"')) throw new Error('Tailwind v4 CSS directive missing');
for (const token of ['clarification_needed', 'Query Console', 'DB Explorer', 'Audit Trail', 'Architecture Guide', 'businessInsight', 'chartHint', 'Highest Revenue', 'This Month', 'Last Month', 'All Time', 'Export CSV', 'Security & Auth', 'Model Fine-Tuning Studio', 'SqlSecurityGuard', 'PostgreSQL 15']) {
  if (!home.includes(token)) throw new Error(`Missing UI contract token: ${token}`);
}
for (const name of ['Nazish Saghir', 'Zuryat Fatima', 'Umar Imran', 'Project contact']) {
  if (!home.includes(name)) throw new Error(`Missing attribution: ${name}`);
}
if (!home.includes('umerimran1882@gmail.com')) throw new Error('Missing exact contact email');
if (home.includes('Product lead') || home.includes('product-owner')) throw new Error('Owner attribution must not be present');
for (const profile of ['zuryat-fatima-aba474334', 'nazish-saghir-1448b2381', 'umar-imran-65538738a']) {
  if (!home.includes(profile)) throw new Error(`Missing LinkedIn profile: ${profile}`);
}
if (!css.includes('Inter, ui-sans-serif') || !css.includes('-webkit-font-smoothing: antialiased') || !css.includes('backdrop-filter:blur(24px)')) throw new Error('Original glass/calligraphy design DNA missing');
if (!css.includes('transition:all .2s ease-in-out') || !css.includes('scale(.95)')) throw new Error('Missing tactile 200ms interaction contract');
for (const token of ['interactive-btn', 'clarification-pill', 'cubic-bezier(0.16, 1, 0.3, 1)']) { if (!css.includes(token)) throw new Error(`Missing raw interaction class: ${token}`); }
for (const token of ['transition-all duration-200 ease-out', 'active:scale-95', 'focus:ring-2 focus:ring-cyan-500/50']) { if (!home.includes(token)) throw new Error(`Missing requested Tailwind interaction class: ${token}`); }
if (!css.includes('#66a9ff')) throw new Error('Missing original electric-blue accent');
for (const token of ['query-error-banner', 'QUERIFY_QUERY_API_URL', 'clarificationAnswer', 'conversationId']) { if (!home.includes(token) && token !== 'QUERIFY_QUERY_API_URL') throw new Error(`Missing query safety contract: ${token}`); }
if (routes.routes?.[0]?.path !== '/') throw new Error('Invalid route manifest');
console.log('Querify UI contract checks passed');
