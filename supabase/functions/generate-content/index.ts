import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PlanStep {
  id: string;
  title: string;
  description: string;
  deliverable?: string;
}

interface PlanSection {
  title: string;
  objective: string;
  steps: PlanStep[];
}

interface GenerationPlan {
  title: string;
  summary: string;
  sections: PlanSection[];
  successCriteria: string[];
  cautions?: string[];
}

type GenerationMode = "content" | "plan";

const stripCodeFence = (text: string) => {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[a-zA-Z0-9-]*\n([\s\S]*?)```$/);
  return match ? match[1].trim() : trimmed;
};

const mapCategory = (category: string | undefined) => {
  switch ((category ?? "").toLowerCase()) {
    case "application":
      return "app";
    default:
      return category ?? "";
  }
};

const toKebabCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "etape";

const normalizePlan = (input: unknown): GenerationPlan => {
  if (!input || typeof input !== "object") {
    throw new Error("Plan non valide renvoyé par le modèle");
  }

  const payload = input as Partial<
    GenerationPlan & {
      sections?: unknown;
      successCriteria?: unknown;
      cautions?: unknown;
    }
  >;

  const sectionsSource = Array.isArray(payload.sections)
    ? payload.sections
    : [];
  const sections = sectionsSource.map((section, sectionIndex) => {
    if (!section || typeof section !== "object") {
      return {
        title: `Section ${sectionIndex + 1}`,
        objective: "",
        steps: [],
      };
    }

    const sectionPayload = section as Partial<
      PlanSection & { steps?: unknown }
    >;
    const stepsSource = Array.isArray(sectionPayload.steps)
      ? sectionPayload.steps
      : [];

    const steps = stepsSource.map((step, stepIndex) => {
      if (!step || typeof step !== "object") {
        return {
          id: `etape-${sectionIndex + 1}-${stepIndex + 1}`,
          title: `Étape ${stepIndex + 1}`,
          description: "",
        };
      }

      const stepPayload = step as Partial<PlanStep>;
      const title =
        typeof stepPayload.title === "string" &&
        stepPayload.title.trim().length > 0
          ? stepPayload.title.trim()
          : `Étape ${stepIndex + 1}`;
      return {
        id:
          typeof stepPayload.id === "string" && stepPayload.id.trim().length > 0
            ? stepPayload.id.trim()
            : toKebabCase(`${sectionPayload.title ?? "section"}-${title}`),
        title,
        description:
          typeof stepPayload.description === "string"
            ? stepPayload.description.trim()
            : "",
        deliverable:
          typeof stepPayload.deliverable === "string" &&
          stepPayload.deliverable.trim().length > 0
            ? stepPayload.deliverable.trim()
            : undefined,
      };
    });

    return {
      title:
        typeof sectionPayload.title === "string" &&
        sectionPayload.title.trim().length > 0
          ? sectionPayload.title.trim()
          : `Section ${sectionIndex + 1}`,
      objective:
        typeof sectionPayload.objective === "string"
          ? sectionPayload.objective.trim()
          : "",
      steps,
    };
  });

  const successCriteriaSource = Array.isArray(payload.successCriteria)
    ? payload.successCriteria
    : [];
  const successCriteria = successCriteriaSource
    .map((criterion) => (typeof criterion === "string" ? criterion.trim() : ""))
    .filter((criterion) => criterion.length > 0);

  const cautionsSource = Array.isArray(payload.cautions)
    ? payload.cautions
    : [];
  const cautions = cautionsSource
    .map((caution) => (typeof caution === "string" ? caution.trim() : ""))
    .filter((caution) => caution.length > 0);

  return {
    title:
      typeof payload.title === "string" && payload.title.trim().length > 0
        ? payload.title.trim()
        : "Plan d'action généré",
    summary:
      typeof payload.summary === "string" && payload.summary.trim().length > 0
        ? payload.summary.trim()
        : "Synthèse du plan d'action généré automatiquement.",
    sections,
    successCriteria:
      successCriteria.length > 0
        ? successCriteria
        : ["Le livrable doit répondre précisément au brief fourni."],
    cautions: cautions.length > 0 ? cautions : undefined,
  };
};

const escapeForTemplateLiteral = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

const describeImageSettings = (
  settings: Record<string, unknown> | undefined,
) => {
  if (!settings || typeof settings !== "object") {
    return null;
  }

  const aspectRatio =
    typeof settings.aspectRatio === "string" ? settings.aspectRatio : undefined;
  const imageCount =
    typeof settings.imageCount === "number" ? settings.imageCount : undefined;
  const stylePreset =
    typeof settings.stylePreset === "string" ? settings.stylePreset : undefined;
  const promptEnhance =
    typeof settings.promptEnhance === "boolean"
      ? settings.promptEnhance
      : undefined;

  const details: string[] = [];
  if (aspectRatio) {
    details.push(`Format ${aspectRatio}`);
  }
  if (typeof imageCount === "number") {
    details.push(`${imageCount} variation${imageCount > 1 ? "s" : ""}`);
  }
  if (stylePreset) {
    details.push(`Style ${stylePreset}`);
  }
  if (typeof promptEnhance === "boolean") {
    details.push(
      promptEnhance ? "Prompt enrichi autorisé" : "Respect strict du prompt",
    );
  }

  if (details.length === 0) {
    return null;
  }

  return `Contexte technique image : ${details.join(" · ")}.`;
};

const buildPlanSystemPrompt = (category: string) => {
  switch (mapCategory(category)) {
    case "image":
      return "Tu es directeur artistique senior. Tu construis un plan d'exécution ultra précis pour produire une image conforme au brief.";
    case "music":
      return "Tu es producteur musical expérimenté. Tu détailles un plan de composition étape par étape à partir du brief fourni.";
    case "agent":
      return "Tu es architecte logiciel spécialisé en IA autonome. Tu produis un plan d'implémentation structuré.";
    case "website":
      return "Tu es tech lead front-end. Tu proposes un plan d'implémentation pour un projet React/Vite moderne.";
    case "app":
      return "Tu es tech lead front-end. Tu prépares le plan d'implémentation d'une application React fonctionnelle.";
    default:
      return "Tu es un chef de projet senior. Tu génères un plan d'action détaillé et actionnable.";
  }
};

const buildPlanInstruction = (
  prompt: string,
  modification: string | undefined,
  category: string,
  context?: {
    existingPlan?: GenerationPlan | null;
    imageSettings?: Record<string, unknown> | undefined;
  },
) => {
  const parts = [`Brief utilisateur :\n${prompt.trim()}`];

  if (modification && modification.trim().length > 0) {
    parts.push(`Contraintes supplémentaires :\n${modification.trim()}`);
  }

  if (context?.existingPlan) {
    parts.push(
      `Plan précédent à améliorer :\n${JSON.stringify(context.existingPlan)}`,
    );
  }

  if (mapCategory(category) === "image") {
    const description = describeImageSettings(context?.imageSettings);
    if (description) {
      parts.push(description);
    }
  }

  parts.push(
    "Format attendu : JSON strict avec les clés title, summary, sections (titre, objective, steps avec id, title, description, deliverable facultatif), successCriteria (tableau) et cautions (tableau optionnel).",
  );

  parts.push(
    "Respecte scrupuleusement le brief et veille à ce que chaque étape soit actionnable.",
  );

  return parts.join("\n\n");
};

const buildReactProjectFromHtml = (html: string, prompt?: string) => {
  const cleaned = stripCodeFence(html);

  const removeTagContent = (source: string, tag: string) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
    const contents: string[] = [];
    const without = source.replace(regex, (match: string, content: string) => {
      if (content && content.trim()) {
        contents.push(content.trim());
        return "";
      }
      return match;
    });
    return { contents, without };
  };

  const { contents: styleBlocks, without: withoutStyles } = removeTagContent(
    cleaned,
    "style",
  );
  const { contents: scriptBlocks, without: withoutScripts } = removeTagContent(
    withoutStyles,
    "script",
  );

  const withoutDoctype = withoutScripts.replace(/<!DOCTYPE[^>]*>/gi, "").trim();
  const withoutHead = withoutDoctype
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
    .trim();

  const bodyMatch = withoutHead.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch
    ? bodyMatch[1].trim()
    : withoutHead.replace(/<\/?html[^>]*>/gi, "").trim();

  const cssContent = styleBlocks.join("\n\n");
  const scriptContent = scriptBlocks.join("\n\n");

  const projectName =
    prompt && prompt.trim().length > 0
      ? `Projet React - ${prompt}`.slice(0, 60)
      : "Projet React généré";

  const instructions = `# ${projectName}

Ce projet React a été généré automatiquement à partir d'un rendu HTML.

## Lancer le projet

1. \`npm install\`
2. \`npm run dev\`

Le HTML d'origine est injecté via \`dangerouslySetInnerHTML\`.
Si des scripts étaient présents dans la version HTML, ils sont recréés dynamiquement dans \`App.tsx\`.`;

  const hasScript = Boolean(scriptContent.trim());

  const appTsx = `${hasScript ? 'import { useEffect } from "react";\n' : ""}import "./App.css";\n\nconst htmlContent = \`${escapeForTemplateLiteral(bodyContent || "<div />")}\`;\n${hasScript ? `const scriptContent = \`${escapeForTemplateLiteral(scriptContent)}\`;\n\n` : ""}function App() {\n${
    hasScript
      ? `  useEffect(() => {\n    if (!scriptContent.trim()) {\n      return;\n    }\n\n    const scriptEl = document.createElement("script");\n    scriptEl.type = "module";\n    scriptEl.innerHTML = scriptContent;\n    document.body.appendChild(scriptEl);\n\n    return () => {\n      document.body.removeChild(scriptEl);\n    };\n  }, []);\n\n`
      : ""
  }  return (\n    <div className="generated-app" dangerouslySetInnerHTML={{ __html: htmlContent }} />\n  );\n}\n\nexport default App;\n`;

  const files = [
    {
      path: "package.json",
      content: JSON.stringify(
        {
          name:
            projectName.replace(/[^a-zA-Z0-9-]+/g, "-").toLowerCase() ||
            "generated-react-project",
          private: true,
          version: "1.0.0",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: {
            react: "^18.3.1",
            "react-dom": "^18.3.1",
          },
          devDependencies: {
            "@types/react": "^18.3.3",
            "@types/react-dom": "^18.3.3",
            typescript: "^5.4.0",
            vite: "^5.4.0",
            "@vitejs/plugin-react": "^4.3.1",
          },
        },
        null,
        2,
      ),
    },
    {
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            useDefineForClassFields: true,
            lib: ["DOM", "DOM.Iterable", "ES2020"],
            module: "ESNext",
            skipLibCheck: true,
            moduleResolution: "Bundler",
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            strict: true,
            forceConsistentCasingInFileNames: true,
            resolveJsonModule: true,
            isolatedModules: true,
            noEmit: true,
            jsx: "react-jsx",
          },
          include: ["src"],
          references: [
            { path: "./tsconfig.node.json" },
            { path: "./tsconfig.app.json" },
          ],
        },
        null,
        2,
      ),
    },
    {
      path: "tsconfig.app.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            jsx: "react-jsx",
            module: "ESNext",
            moduleResolution: "Bundler",
            allowImportingTsExtensions: true,
            isolatedModules: true,
            noEmit: true,
            skipLibCheck: true,
          },
          include: ["src"],
        },
        null,
        2,
      ),
    },
    {
      path: "tsconfig.node.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            composite: true,
            module: "ESNext",
            moduleResolution: "Bundler",
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            noEmit: true,
          },
          include: ["vite.config.ts"],
        },
        null,
        2,
      ),
    },
    {
      path: "vite.config.ts",
      content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
    },
    {
      path: "index.html",
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
      path: "src/main.tsx",
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
      path: "src/App.tsx",
      content: appTsx,
    },
    {
      path: "src/App.css",
      content: cssContent || "/* Styles générés */\n",
    },
    {
      path: "src/index.css",
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
      path: "src/vite-env.d.ts",
      content: '/// <reference types="vite/client" />\n',
    },
  ];

  return { files, instructions, projectName };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const prompt: string = typeof body?.prompt === "string" ? body.prompt : "";
    const category = mapCategory(
      typeof body?.category === "string" ? body.category : "",
    );
    const modification: string | undefined =
      typeof body?.modification === "string" ? body.modification : undefined;
    const existingContent: string | undefined =
      typeof body?.existingContent === "string"
        ? body.existingContent
        : undefined;
    const mode: GenerationMode = body?.mode === "plan" ? "plan" : "content";
    const plan: GenerationPlan | undefined = body?.plan;
    const existingPlan: GenerationPlan | undefined = body?.existingPlan;
    const imageSettings = body?.imageSettings;

    console.log(
      `Génération (${mode}) pour catégorie: ${category}, modification: ${modification ? modification : "aucune"}`,
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configuré");
    }

    const fetchHeaders: Record<string, string> = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
      "x-api-key": LOVABLE_API_KEY,
    };

    if (mode === "plan") {
      const messages = [
        { role: "system", content: buildPlanSystemPrompt(category) },
        {
          role: "user",
          content: buildPlanInstruction(prompt, modification, category, {
            existingPlan,
            imageSettings,
          }),
        },
      ];

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: fetchHeaders,
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur API Lovable (plan):", response.status, errorText);
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      const rawPlan = data.choices?.[0]?.message?.content ?? "";
      const cleanedPlan = stripCodeFence(rawPlan);

      let parsedPlan: unknown;
      try {
        parsedPlan = JSON.parse(cleanedPlan);
      } catch (error) {
        console.error(
          "Impossible de parser le plan généré",
          error,
          cleanedPlan,
        );
        throw new Error(
          "Le plan généré est invalide. Merci de reformuler le brief.",
        );
      }

      const normalizedPlan = normalizePlan(parsedPlan);

      return new Response(JSON.stringify({ plan: normalizedPlan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let useImageGeneration = false;
    let responseFormat: "text" | "project" | "code" = "text";

    switch (category) {
      case "image":
        systemPrompt = "Generate exactly what the user describes.";
        useImageGeneration = true;
        break;
      case "website":
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
        responseFormat = "project";
        break;
      case "app":
        systemPrompt = `Tu es un expert en développement d'applications web. Génère une application React complète et fonctionnelle au format JSON.

IMPORTANT : réponds uniquement par un JSON avec les clés suivantes :
{
  "type": "project",
  "category": "app",
  "projectType": "react",
  "projectName": "Nom du projet",
  "instructions": "Instructions pour lancer le projet",
  "files": [
    { "path": "src/App.tsx", "language": "tsx", "content": "code complet" }
  ]
}

Inclue tous les fichiers nécessaires (package.json, tsconfig, vite.config.ts, index.html, src/main.tsx, src/App.tsx, styles, assets). Aucun commentaire hors du JSON.`;
        responseFormat = "project";
        break;
      case "music":
        systemPrompt = `Tu es un compositeur professionnel. Génère une feuille de route musicale ultra détaillée incluant structure, instrumentation, progressions harmoniques et conseils de production. Réponds en français.`;
        responseFormat = "text";
        break;
      case "agent":
        systemPrompt = `Tu es un architecte logiciel IA senior. Tu livres un dossier technique complet au format JSON avec les fichiers nécessaires pour un agent Python moderne (Typer CLI, orchestrateur OpenAI, intégrations, tests).`;
        responseFormat = "project";
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

    if (plan) {
      messages.push({
        role: "user",
        content: `Plan validé à respecter :\n${JSON.stringify(plan)}`,
      });
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

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify({
          model: useImageGeneration
            ? "google/gemini-2.5-flash-image-preview"
            : "google/gemini-2.5-flash",
          messages,
          modalities: useImageGeneration ? ["image", "text"] : undefined,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur API Lovable:", response.status, errorText);
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    console.log("Réponse API reçue:", JSON.stringify(data).substring(0, 200));

    let result;
    if (useImageGeneration) {
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) {
        throw new Error("Aucune image générée");
      }
      result = {
        type: "image",
        category,
        content: data.choices?.[0]?.message?.content || "Image générée",
        preview: imageUrl,
      };
    } else {
      const rawContent =
        data.choices?.[0]?.message?.content || "Contenu généré";

      if (responseFormat === "project") {
        const cleaned = stripCodeFence(rawContent);
        let parsed: Record<string, unknown> | null = null;
        try {
          parsed = JSON.parse(cleaned);
        } catch (error) {
          console.warn(
            "Réponse projet non parsable, utilisation du fallback React.",
            error,
          );
        }

        let parsedFiles: unknown = parsed?.files;
        if (typeof parsedFiles === "string") {
          try {
            parsedFiles = JSON.parse(stripCodeFence(parsedFiles));
          } catch (error) {
            console.warn(
              "Impossible de parser le manifeste de fichiers fourni en chaîne.",
              error,
            );
            parsedFiles = undefined;
          }
        }

        const normalizedFiles = Array.isArray(parsedFiles)
          ? (parsedFiles as Array<Record<string, unknown>>).filter(
              (file) =>
                typeof file?.path === "string" &&
                typeof file?.content === "string",
            )
          : undefined;

        if (parsed && normalizedFiles && normalizedFiles.length > 0) {
          result = {
            type: typeof parsed?.type === "string" ? parsed.type : "project",
            category,
            content: typeof parsed?.content === "string" ? parsed.content : "",
            code: undefined,
            files: normalizedFiles as Array<{ path: string; content: string }>,
            instructions:
              typeof parsed?.instructions === "string"
                ? parsed.instructions
                : undefined,
            projectName:
              typeof parsed?.projectName === "string"
                ? parsed.projectName
                : undefined,
            projectType:
              typeof parsed?.projectType === "string"
                ? parsed.projectType
                : "react",
          };
        } else {
          const fallbackProject = buildReactProjectFromHtml(rawContent, prompt);
          result = {
            type: "project",
            category,
            content: "",
            code: undefined,
            files: fallbackProject.files,
            instructions: fallbackProject.instructions,
            projectName: fallbackProject.projectName,
            projectType: "react",
          };
        }
      } else {
        result = {
          type: responseFormat,
          category,
          content: rawContent,
          code: responseFormat === "code" ? rawContent : undefined,
        };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur dans generate-content:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
