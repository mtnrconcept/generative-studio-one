import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripCodeFence = (text: string) => {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[a-zA-Z0-9-]*\n([\s\S]*?)```$/);
  return match ? match[1].trim() : trimmed;
};

const escapeForTemplateLiteral = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");

const buildReactProjectFromHtml = (html: string, prompt?: string) => {
  const cleaned = stripCodeFence(html);

  const removeTagContent = (source: string, tag: string) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    const contents: string[] = [];
    const without = source.replace(regex, (match: string, content: string) => {
      if (content && content.trim()) {
        contents.push(content.trim());
        return '';
      }
      return match;
    });
    return { contents, without };
  };

  const { contents: styleBlocks, without: withoutStyles } = removeTagContent(cleaned, 'style');
  const { contents: scriptBlocks, without: withoutScripts } = removeTagContent(withoutStyles, 'script');

  const withoutDoctype = withoutScripts.replace(/<!DOCTYPE[^>]*>/gi, '').trim();
  const withoutHead = withoutDoctype.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '').trim();

  const bodyMatch = withoutHead.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : withoutHead.replace(/<\/?html[^>]*>/gi, '').trim();

  const cssContent = styleBlocks.join("\n\n");
  const scriptContent = scriptBlocks.join("\n\n");

  const projectName = prompt && prompt.trim().length > 0
    ? `Projet React - ${prompt}`.slice(0, 60)
    : 'Projet React généré';

  const instructions = `# ${projectName}

Ce projet React a été généré automatiquement à partir d'un rendu HTML.

## Lancer le projet

1. \`npm install\`
2. \`npm run dev\`

Le HTML d'origine est injecté via \`dangerouslySetInnerHTML\`.
Si des scripts étaient présents dans la version HTML, ils sont recréés dynamiquement dans \`App.tsx\`.`;

  const hasScript = Boolean(scriptContent.trim());

  const appTsx = `${hasScript ? 'import { useEffect } from "react";\n' : ''}import "./App.css";\n\nconst htmlContent = \`${escapeForTemplateLiteral(bodyContent || '<div />')}\`;\n${hasScript ? `const scriptContent = \`${escapeForTemplateLiteral(scriptContent)}\`;\n\n` : ''}function App() {\n${
    hasScript
      ? `  useEffect(() => {\n    if (!scriptContent.trim()) {\n      return;\n    }\n\n    const scriptEl = document.createElement("script");\n    scriptEl.type = "module";\n    scriptEl.innerHTML = scriptContent;\n    document.body.appendChild(scriptEl);\n\n    return () => {\n      document.body.removeChild(scriptEl);\n    };\n  }, []);\n\n`
      : ''
  }  return (\n    <div className="generated-app" dangerouslySetInnerHTML={{ __html: htmlContent }} />\n  );\n}\n\nexport default App;\n`;

  const files = [
    {
      path: 'package.json',
      content: JSON.stringify(
        {
          name: projectName.replace(/[^a-zA-Z0-9-]+/g, '-').toLowerCase() || 'generated-react-project',
          private: true,
          version: '1.0.0',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview',
          },
          dependencies: {
            react: '^18.3.1',
            'react-dom': '^18.3.1',
          },
          devDependencies: {
            '@types/react': '^18.3.3',
            '@types/react-dom': '^18.3.3',
            typescript: '^5.4.0',
            vite: '^5.4.0',
            '@vitejs/plugin-react': '^4.3.1',
          },
        },
        null,
        2,
      ),
    },
    {
      path: 'tsconfig.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            useDefineForClassFields: true,
            lib: ['DOM', 'DOM.Iterable', 'ES2020'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'Bundler',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: 'react-jsx',
          },
          include: ['src'],
          references: [
            { path: './tsconfig.node.json' },
            { path: './tsconfig.app.json' },
          ],
        },
        null,
        2,
      ),
    },
    {
      path: 'tsconfig.app.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            jsx: 'react-jsx',
            module: 'ESNext',
            moduleResolution: 'Bundler',
            allowImportingTsExtensions: true,
            isolatedModules: true,
            noEmit: true,
            skipLibCheck: true,
          },
          include: ['src'],
        },
        null,
        2,
      ),
    },
    {
      path: 'tsconfig.node.json',
      content: JSON.stringify(
        {
          compilerOptions: {
            composite: true,
            module: 'ESNext',
            moduleResolution: 'Bundler',
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            noEmit: true,
          },
          include: ['vite.config.ts'],
        },
        null,
        2,
      ),
    },
    {
      path: 'vite.config.ts',
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
    },
    {
      path: 'index.html',
      content: `<!doctype html>
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
</html>
`,
    },
    {
      path: 'src/main.tsx',
      content: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    },
    {
      path: 'src/App.tsx',
      content: appTsx,
    },
    {
      path: 'src/App.css',
      content: cssContent || '/* Styles générés */\n',
    },
    {
      path: 'src/index.css',
      content: `:root {
  color-scheme: light dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background-color: #0b0b0f;
  color: #f5f5f7;
}

#root {
  min-height: 100vh;
}
`,
    },
    {
      path: 'src/vite-env.d.ts',
      content: '/// <reference types="vite/client" />\n',
    },
  ];

  return { files, instructions, projectName };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, category, modification, existingContent } = await req.json();
    console.log(
      `Génération pour catégorie: ${category}, prompt: ${prompt}, modification: ${modification ? modification : 'aucune'}`,
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configuré');
    }

    let systemPrompt = '';
    let useImageGeneration = false;
    let responseFormat = 'text';

    switch (category) {
      case 'image':
        systemPrompt = "Générez une image de haute qualité basée sur la description de l'utilisateur. Soyez créatif et détaillé.";
        useImageGeneration = true;
        break;

      case 'website':
        systemPrompt = `Tu es un expert en développement front-end. Génère un projet React complet utilisant Vite et TypeScript, répondant précisément à la demande de l'utilisateur.

IMPORTANT : ta réponse doit être STRICTEMENT un JSON valide respectant cette structure :
{
  "type": "project",
  "category": "website",
  "projectType": "react",
  "projectName": "Nom clair du projet",
  "instructions": "Instructions pour lancer le projet en français",
  "files": [
    {
      "path": "chemin/vers/le/fichier.ext",
      "language": "langageOptionnel",
      "content": "Contenu complet du fichier"
    }
  ]
}

Le tableau "files" doit contenir TOUT le nécessaire pour lancer l'application avec Vite : package.json, tsconfig.json, tsconfig.app.json, tsconfig.node.json, vite.config.ts, index.html, public/ (favicons si besoin), src/main.tsx, src/App.tsx, src/App.css, src/assets/ (si requis) et tout autre fichier utile. Les contenus doivent être complets, sans texte ou commentaire hors du code. Utilise les bonnes dépendances React 18.
Ne rajoute aucun texte en dehors du JSON demandé.`;
        responseFormat = 'project';
        break;

      case 'app':
        systemPrompt = `Tu es un expert en développement d'applications web. Génère une application React complète et fonctionnelle.

IMPORTANT: Réponds UNIQUEMENT avec du code, sans markdown, sans explications. Structure comme suit:

<!-- App.jsx -->
import React, { useState } from 'react';
import './App.css';

function App() {
  // Code React ici
  return (
    <div className="App">
      {/* JSX */}
    </div>
  );
}

export default App;

<!-- App.css -->
/* Tous les styles ici */

Crée une application moderne et interactive. Pas de texte en dehors du code.`;
        responseFormat = 'code';
        break;

      case 'game':
        systemPrompt = `Tu es un expert en développement de jeux HTML5. Génère un jeu complet et jouable.

IMPORTANT: Réponds UNIQUEMENT avec du code HTML/CSS/JavaScript, sans markdown, sans explications.

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Mon Jeu</title>
    <style>
    /* CSS du jeu */
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    <script>
    // Logique du jeu ici
    </script>
</body>
</html>

Crée un jeu fonctionnel et amusant. Pas d'explications, seulement du code.`;
        responseFormat = 'code';
        break;

      case 'music':
        systemPrompt = `Tu es un expert en composition musicale. Décris précisément comment créer la musique demandée:
        - Genre et style musical
        - Tempo (BPM)
        - Tonalité
        - Structure (intro, couplet, refrain, etc.)
        - Instruments principaux et leur rôle
        - Progression d'accords
        - Ambiance et émotions
        - Références musicales similaires

Sois très précis et technique pour qu'un musicien puisse recréer cette composition.`;
        responseFormat = 'description';
        break;

      case 'agent':
        systemPrompt = `Tu es un expert en automatisation et scripting. Génère un script d'automatisation complet.

IMPORTANT: Réponds UNIQUEMENT avec du code Python, sans markdown, sans explications.

# agent.py
import time
import requests
from datetime import datetime

def main():
    """Script d'automatisation"""
    # Code Python ici
    pass

if __name__ == "__main__":
    main()

Crée un script fonctionnel et bien structuré. Pas de texte en dehors du code et des commentaires de code.`;
        responseFormat = 'code';
        break;

      default:
        systemPrompt = "Vous êtes un assistant IA créatif et précis.";
    }

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    if (prompt) {
      messages.push({ role: "user", content: prompt });
    }

    if (existingContent) {
      messages.push({ role: "assistant", content: existingContent });
    }

    if (modification) {
      const modificationInstruction = existingContent
        ? `Tu dois reprendre strictement la proposition précédente fournie ci-dessus. Applique uniquement les changements explicitement demandés ci-dessous et conserve absolument tout le reste à l'identique (structure, style, contenus, textes, code, ressources, formats, classes, ids, commentaires, mise en page, etc.). N'invente aucun nouvel élément, ne supprime rien qui n'est pas mentionné et ne modifie pas l'ordre des sections si cela n'est pas demandé. Instructions de modification : ${modification}`
        : `Merci d'améliorer la proposition précédente en suivant uniquement ces instructions, sans ajouter d'autres changements : ${modification}`;
      messages.push({ role: "user", content: modificationInstruction });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: useImageGeneration ? "google/gemini-2.5-flash-image-preview" : "google/gemini-2.5-flash",
        messages,
        modalities: useImageGeneration ? ["image", "text"] : undefined
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur API Lovable:', response.status, errorText);
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    console.log('Réponse API reçue:', JSON.stringify(data).substring(0, 200));

    let result;
    if (useImageGeneration) {
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) {
        throw new Error('Aucune image générée');
      }
      result = {
        type: 'image',
        category,
        content: data.choices?.[0]?.message?.content || 'Image générée',
        preview: imageUrl
      };
    } else {
      const rawContent = data.choices?.[0]?.message?.content || 'Contenu généré';

      if (responseFormat === 'project') {
        const cleaned = stripCodeFence(rawContent);
        let parsed: Record<string, unknown> | null = null;
        try {
          parsed = JSON.parse(cleaned);
        } catch (error) {
          console.warn('Réponse projet non parsable, utilisation du fallback React.', error);
        }

        let parsedFiles: unknown = parsed?.files;
        if (typeof parsedFiles === 'string') {
          try {
            parsedFiles = JSON.parse(stripCodeFence(parsedFiles));
          } catch (error) {
            console.warn('Impossible de parser le manifeste de fichiers fourni en chaîne.', error);
            parsedFiles = undefined;
          }
        }

        const normalizedFiles = Array.isArray(parsedFiles)
          ? (parsedFiles as Array<Record<string, unknown>>).filter(
              (file) => typeof file?.path === 'string' && typeof file?.content === 'string',
            )
          : undefined;

        if (parsed && normalizedFiles && normalizedFiles.length > 0) {
          result = {
            type: typeof parsed?.type === 'string' ? parsed.type : 'project',
            category,
            content: typeof parsed?.content === 'string' ? parsed.content : '',
            code: undefined,
            files: normalizedFiles as Array<{ path: string; content: string }>,
            instructions: typeof parsed?.instructions === 'string' ? parsed.instructions : undefined,
            projectName: typeof parsed?.projectName === 'string' ? parsed.projectName : undefined,
            projectType: typeof parsed?.projectType === 'string' ? parsed.projectType : 'react',
          };
        } else {
          const fallbackProject = buildReactProjectFromHtml(rawContent, prompt);
          result = {
            type: 'project',
            category,
            content: '',
            code: undefined,
            files: fallbackProject.files,
            instructions: fallbackProject.instructions,
            projectName: fallbackProject.projectName,
            projectType: 'react',
          };
        }
      } else {
        result = {
          type: responseFormat,
          category,
          content: rawContent,
          code: responseFormat === 'code' ? rawContent : undefined
        };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur dans generate-content:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
