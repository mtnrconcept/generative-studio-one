import type { GeneratedFile } from "@/types/result";

interface FileDescriptor {
  code: string;
  hidden?: boolean;
}

export interface GeneratedProject {
  projectName: string;
  files: GeneratedFile[];
  instructions: string;
}

type FileMap = Record<string, FileDescriptor>;
type ProjectKind = "website" | "application";

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

const sanitizeProjectName = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\\/:*?"<>|]+/g, "")
    .trim() || "Projet Généré";

const baseReactVite = (projectName: string): FileMap => ({
  "/index.html": {
    code: `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  },
  "/src/main.tsx": {
    code: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
  },
  "/src/App.tsx": {
    code: `import React from 'react'
import './index.css'

export default function App(){
  return (
    <div className="min-h-screen bg-[#0b1020] text-gray-100">
      <header className="px-6 py-4 border-b border-gray-700/60">
        <h1 className="text-2xl font-semibold tracking-tight">${projectName}</h1>
        <p className="text-sm text-gray-400">Site généré automatiquement</p>
      </header>
      <main className="p-6 max-w-5xl mx-auto">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Bienvenue</h2>
          <p className="text-gray-300">Ce projet a été créé par l’outil de génération. Modifie les composants dans <code>/src</code>.</p>
          <button className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500">Bouton</button>
        </section>
      </main>
    </div>
  )
}`
  },
  "/src/index.css": {
    code: `*{box-sizing:border-box} body{margin:0;font-family:ui-sans-serif,system-ui;}`
  },
  "/package.json": {
    code: `{
  "name": "${projectName.toLowerCase().replace(/\s+/g,'-')}",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.17",
    "vite": "^5.0.12"
  }
}`
  },
  "/tsconfig.json": {
    code: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}`
  },
  "/vite.config.ts": {
    code: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
  }
});

const landingPageAddon = (): FileMap => ({
  "/src/components/Hero.tsx": {
    code: `export default function Hero(){
  return (
    <section className="py-20 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight">Une landing page moderne</h1>
      <p className="mt-3 text-gray-400 max-w-xl mx-auto">Construite automatiquement à partir de ton prompt.</p>
      <div className="mt-6 flex gap-3 justify-center">
        <a className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500" href="#features">Commencer</a>
        <a className="px-4 py-2 rounded border border-gray-600" href="#docs">Documentation</a>
      </div>
    </section>
  )
}`
  },
  "/src/App.tsx": {
    code: `import React from 'react'
import './index.css'
import Hero from './components/Hero'

export default function App(){
  return (
    <div className="min-h-screen bg-[#0b1020] text-gray-100">
      <header className="px-6 py-4 border-b border-gray-700/60">
        <h1 className="text-2xl font-semibold tracking-tight">Mon super site</h1>
        <p className="text-sm text-gray-400">Landing page</p>
      </header>
      <main className="p-6 max-w-5xl mx-auto">
        <Hero />
        <section id="features" className="grid sm:grid-cols-2 gap-6 mt-10">
          <div className="rounded-lg border border-gray-700/60 p-5">⚡ Rapide</div>
          <div className="rounded-lg border border-gray-700/60 p-5">🎛️ Personnalisable</div>
          <div className="rounded-lg border border-gray-700/60 p-5">🔒 Sécurisé</div>
          <div className="rounded-lg border border-gray-700/60 p-5">🚀 Déployable</div>
        </section>
      </main>
    </div>
  )
}`
  }
});

const baseReactApp = (projectName: string): FileMap => ({
  "/index.html": {
    code: `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  },
  "/src/main.tsx": {
    code: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
  },
  "/src/App.tsx": {
    code: `import React, { useState } from 'react'
import './index.css'

const navigation = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'utilisateurs', label: 'Utilisateurs' },
  { id: 'produit', label: 'Produit' },
  { id: 'reporting', label: 'Reporting' }
]

const analytics = [
  { label: 'Utilisateurs actifs', value: '1 284', delta: '+18% cette semaine' },
  { label: 'Taux de conversion', value: '4,2%', delta: '+0,4 points' },
  { label: 'Sessions', value: '32 458', delta: '+9% vs 7 derniers jours' },
  { label: 'Satisfaction', value: '92%', delta: 'Score NPS' }
]

export default function App(){
  const [active, setActive] = useState('overview')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-900/60 px-6 py-4 backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">${projectName}</h1>
        <p className="text-sm text-slate-400">Application générée automatiquement</p>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <nav className="flex flex-wrap items-center gap-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={
                active === item.id
                  ? 'rounded-lg border border-indigo-500 bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/30 transition'
                  : 'rounded-lg border border-slate-800/80 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-500/60'
              }
            >
              {item.label}
            </button>
          ))}
        </nav>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analytics.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5">
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{card.value}</p>
              <p className="mt-3 text-xs text-emerald-400">{card.delta}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Activité récente</h2>
            <p className="mt-2 text-sm text-slate-400">
              Ajoute tes propres composants dans <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">src/</code> pour transformer cette base en application complète.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/80 px-4 py-3">
                <span>Nouvel utilisateur inscrit</span>
                <span className="text-xs text-slate-500">Il y a 2 min</span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/80 px-4 py-3">
                <span>Plan Professionnel activé</span>
                <span className="text-xs text-slate-500">Il y a 12 min</span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/80 px-4 py-3">
                <span>Nouvelle intégration connectée</span>
                <span className="text-xs text-slate-500">Il y a 32 min</span>
              </li>
            </ul>
          </div>

          <aside className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Tâches prioritaires</h2>
            <div className="mt-3 space-y-3 text-sm text-slate-200">
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500" />
                <span>Lancer la campagne d'onboarding</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500" />
                <span>Prioriser les demandes clients</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-500" />
                <span>Analyser les données d'usage</span>
              </label>
            </div>
            <button className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500">
              Voir toutes les tâches
            </button>
          </aside>
        </section>
      </main>
    </div>
  )
}`
  },
  "/src/index.css": {
    code: `*{box-sizing:border-box} body{margin:0;font-family:ui-sans-serif,system-ui;background:#020617;color:#e2e8f0}`
  },
  "/package.json": {
    code: `{
  "name": "${projectName.toLowerCase().replace(/\s+/g,'-')}",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.17",
    "vite": "^5.0.12"
  }
}`
  },
  "/tsconfig.json": {
    code: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}`
  },
  "/vite.config.ts": {
    code: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`
  }
});

const applyGreenButton = (files: FileMap) => {
  const app = files["/src/App.tsx"];

  if (!app) return files;

  return {
    ...files,
    "/src/App.tsx": {
      ...app,
      code: app.code
        .replace(/bg-indigo-600/g, "bg-green-600")
        .replace(/hover:bg-indigo-500/g, "hover:bg-green-500"),
    },
  };
};

const mapToArray = (files: FileMap): GeneratedFile[] =>
  Object.entries(files)
    .filter(([, descriptor]) => !descriptor.hidden)
    .map(([path, descriptor]) => ({
      path: normalizePath(path).replace(/^\//, ""),
      content: descriptor.code,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));

const extractProjectName = (prompt: string) => {
  const match = prompt.match(/nom\s*:\s*([^\n]+)/i);
  return match ? sanitizeProjectName(match[1]) : undefined;
};

export const generateProjectFromPrompt = (
  prompt: string,
  kind: ProjectKind = "website",
): GeneratedProject => {
  const projectName = extractProjectName(prompt) ?? "Projet Généré";
  const lowered = prompt.toLowerCase();

  let files = kind === "application" ? baseReactApp(projectName) : baseReactVite(projectName);

  if (kind === "website" && (lowered.includes("landing") || lowered.includes("accueil"))) {
    files = { ...files, ...landingPageAddon() };
  }

  if (lowered.includes("bouton vert")) {
    files = applyGreenButton(files);
  }

  const instructions = [
    `Projet React + Vite généré pour : ${projectName}.`,
    "Inclut les fichiers essentiels (index.html, src/main.tsx, src/App.tsx, etc.).",
    kind === "website"
      ? lowered.includes("landing") || lowered.includes("accueil")
        ? "Composant Hero ajouté pour une landing page."
        : "Structure de base prête à être personnalisée."
      : "Tableau de bord React avec navigation simulée et widgets prêts à personnaliser.",
    kind === "application"
      ? "Utilise React.useState pour gérer l'onglet actif et propose des sections Activité/Tâches."
      : "Section principale prête à être enrichie avec vos composants.",
    lowered.includes("bouton vert")
      ? "Style du bouton principal ajusté en vert comme demandé."
      : "Couleurs par défaut conservées.",
  ].join("\n");

  return {
    projectName,
    files: mapToArray(files),
    instructions,
  };
};
