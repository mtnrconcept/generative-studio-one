import type { GeneratedFile } from "@/types/result";
import type { GenerationPlan, PlanSection, PlanStep } from "@/types/plan";

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

const hexToHsl = (hex: string) => {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const rNormalized = r / 255;
  const gNormalized = g / 255;
  const bNormalized = b / 255;
  const max = Math.max(rNormalized, gNormalized, bNormalized);
  const min = Math.min(rNormalized, gNormalized, bNormalized);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNormalized:
        h = (gNormalized - bNormalized) / d + (gNormalized < bNormalized ? 6 : 0);
        break;
      case gNormalized:
        h = (bNormalized - rNormalized) / d + 2;
        break;
      default:
        h = (rNormalized - gNormalized) / d + 4;
        break;
    }
    h /= 6;
  }

  const hue = Math.round(h * 360);
  const saturation = Math.round(s * 100);
  const lightness = Math.round(l * 100);
  return `${hue} ${saturation}% ${lightness}%`;
};

interface PaletteConfig {
  name: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  accentForeground: string;
  border: string;
  ring: string;
  gradient: { from: string; to: string; via: string };
}

interface SectionToggles {
  showTestimonials: boolean;
  showPricing: boolean;
  showFaq: boolean;
  showCta: boolean;
}

interface HeroContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  highlight: string;
  primaryCta: string;
  secondaryCta: string;
}

interface MetricContent {
  label: string;
  value: string;
  helper: string;
}

interface FeatureContent {
  title: string;
  description: string;
  icon: string;
}

interface TestimonialContent {
  quote: string;
  name: string;
  role: string;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  benefits: string[];
  popular?: boolean;
}

interface FaqContent {
  question: string;
  answer: string;
}

interface FooterContent {
  company: string;
  blurb: string;
  links: { label: string; href: string }[];
}

interface PromptAnalysis {
  palette: PaletteConfig;
  ambiance: string;
  sector: string;
  motion: "float" | "slide" | "scale";
  sections: SectionToggles;
  hero: HeroContent;
  metrics: MetricContent[];
  features: FeatureContent[];
  testimonials: TestimonialContent[];
  pricing: { headline: string; plans: PricingPlan[] };
  faq: FaqContent[];
  cta: { title: string; subtitle: string; action: string };
  footer: FooterContent;
  paletteName: string;
  tone: string;
  font: { package: string; family: string; fallback: string };
}

const sanitizeProjectName = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\\/:*?"<>|]+/g, "")
    .trim() || "Projet Généré";

const inferAudience = (prompt: string) => {
  const lowered = prompt.toLowerCase();
  if (/(marchand|commerce|boutique)/.test(lowered)) return "Clientèle e-commerce";
  if (/(saas|startup|b2b|logiciel)/.test(lowered)) return "Utilisateurs SaaS";
  if (/(portfolio|créatif|designer|photographe)/.test(lowered)) return "Audience créative";
  if (/(communauté|événement|association)/.test(lowered)) return "Communauté engagée";
  return "Audience générale";
};

const inferTone = (prompt: string) => {
  const lowered = prompt.toLowerCase();
  if (/(lux|premium|élégant|raffiné)/.test(lowered)) return "ton premium et sophistiqué";
  if (/(jeune|fun|énergique|dynamique)/.test(lowered)) return "ton énergique et accessible";
  if (/(minimal|sobre|clair)/.test(lowered)) return "ton minimal et clair";
  if (/(immersif|futuriste|néon)/.test(lowered)) return "ton futuriste immersif";
  return "ton professionnel et rassurant";
};

const inferStyle = (prompt: string) => {
  const lowered = prompt.toLowerCase();
  if (/(sombre|dark|nocturne)/.test(lowered)) return "interface sombre contrastée";
  if (/(clair|light|lumineux)/.test(lowered)) return "interface claire lumineuse";
  if (/(néon|futuriste|cyber)/.test(lowered)) return "palette néon futuriste";
  if (/(nature|organique|earth)/.test(lowered)) return "palette organique inspirée de la nature";
  return "palette moderne à base d'indigo";
};

type PalettePresetKey =
  | "nocturne"
  | "luxe"
  | "nature"
  | "neon"
  | "lumineux"
  | "marine";

const palettePresets: Record<PalettePresetKey, PaletteConfig> = {
  nocturne: {
    name: "Nocturne nébuleux",
    background: "#05040a",
    surface: "#0e1020",
    foreground: "#f8fafc",
    muted: "#1f2937",
    mutedForeground: "#94a3b8",
    primary: "#6366f1",
    primaryForeground: "#f8fafc",
    secondary: "#14b8a6",
    accent: "#22d3ee",
    accentForeground: "#0f172a",
    border: "#1e293b",
    ring: "#7c3aed",
    gradient: { from: "rgba(99, 102, 241, 0.35)", via: "rgba(14, 165, 233, 0.25)", to: "rgba(15, 23, 42, 0)" },
  },
  luxe: {
    name: "Alliage premium",
    background: "#0b0a10",
    surface: "#141625",
    foreground: "#f4f3ff",
    muted: "#272838",
    mutedForeground: "#c7c6f6",
    primary: "#c084fc",
    primaryForeground: "#15032a",
    secondary: "#fbbf24",
    accent: "#f472b6",
    accentForeground: "#15032a",
    border: "#312e81",
    ring: "#facc15",
    gradient: { from: "rgba(192, 132, 252, 0.35)", via: "rgba(251, 191, 36, 0.22)", to: "rgba(17, 24, 39, 0)" },
  },
  nature: {
    name: "Canopée biophilique",
    background: "#07130c",
    surface: "#0d2216",
    foreground: "#ecfdf5",
    muted: "#123524",
    mutedForeground: "#a7f3d0",
    primary: "#22c55e",
    primaryForeground: "#052e16",
    secondary: "#86efac",
    accent: "#2dd4bf",
    accentForeground: "#022c22",
    border: "#14532d",
    ring: "#34d399",
    gradient: { from: "rgba(45, 212, 191, 0.28)", via: "rgba(34, 197, 94, 0.32)", to: "rgba(8, 51, 30, 0)" },
  },
  neon: {
    name: "Flux néon",
    background: "#050012",
    surface: "#0a0620",
    foreground: "#fdf4ff",
    muted: "#1b1240",
    mutedForeground: "#c084fc",
    primary: "#a855f7",
    primaryForeground: "#130128",
    secondary: "#22d3ee",
    accent: "#f97316",
    accentForeground: "#130128",
    border: "#312e81",
    ring: "#22d3ee",
    gradient: { from: "rgba(168, 85, 247, 0.34)", via: "rgba(34, 211, 238, 0.28)", to: "rgba(8, 11, 40, 0)" },
  },
  lumineux: {
    name: "Brume lumineuse",
    background: "#f9fafb",
    surface: "#ffffff",
    foreground: "#0f172a",
    muted: "#e2e8f0",
    mutedForeground: "#475569",
    primary: "#0ea5e9",
    primaryForeground: "#022c3a",
    secondary: "#6366f1",
    accent: "#f472b6",
    accentForeground: "#3b0764",
    border: "#d4d4d8",
    ring: "#38bdf8",
    gradient: { from: "rgba(14, 165, 233, 0.22)", via: "rgba(99, 102, 241, 0.18)", to: "rgba(255, 255, 255, 0)" },
  },
  marine: {
    name: "Profondeur marine",
    background: "#030712",
    surface: "#0b1220",
    foreground: "#e2e8f0",
    muted: "#1e293b",
    mutedForeground: "#94a3b8",
    primary: "#2563eb",
    primaryForeground: "#f8fafc",
    secondary: "#0ea5e9",
    accent: "#22d3ee",
    accentForeground: "#082f49",
    border: "#1e293b",
    ring: "#38bdf8",
    gradient: { from: "rgba(37, 99, 235, 0.32)", via: "rgba(14, 165, 233, 0.25)", to: "rgba(15, 23, 42, 0)" },
  },
};

type SectorKey = "saas" | "ecommerce" | "creative" | "wellness" | "finance" | "education";

const sectorLabels: Record<SectorKey, string> = {
  saas: "Plateforme SaaS B2B",
  ecommerce: "Marque e-commerce haut de gamme",
  creative: "Studio créatif / agence digitale",
  wellness: "Expérience bien-être & lifestyle",
  finance: "Service financier de nouvelle génération",
  education: "Programme éducatif immersif",
};

const determinePalette = (prompt: string): { key: PalettePresetKey; palette: PaletteConfig } => {
  const lowered = prompt.toLowerCase();

  let key: PalettePresetKey = "nocturne";
  if (/(luxe|premium|élégant|raffiné|or)/.test(lowered)) key = "luxe";
  else if (/(nature|bio|durable|écologie|green)/.test(lowered)) key = "nature";
  else if (/(néon|cyber|futuriste|immersif|techno)/.test(lowered)) key = "neon";
  else if (/(clair|lumineux|minimal|pastel)/.test(lowered)) key = "lumineux";
  else if (/(marine|océan|bleu|nautique)/.test(lowered)) key = "marine";
  else if (/(sombre|dark|nocturne)/.test(lowered)) key = "nocturne";

  const base = { ...palettePresets[key] };

  if (/(bleu électrique|bleu profond|azur)/.test(lowered)) {
    base.primary = "#1d4ed8";
    base.secondary = "#0ea5e9";
    base.accent = "#38bdf8";
    base.gradient = { from: "rgba(29, 78, 216, 0.32)", via: "rgba(56, 189, 248, 0.28)", to: base.gradient.to };
  }

  if (/(vert|emerald|jungle)/.test(lowered)) {
    base.primary = "#22c55e";
    base.secondary = "#4ade80";
    base.accent = "#34d399";
    base.gradient = { from: "rgba(34, 197, 94, 0.32)", via: "rgba(74, 222, 128, 0.28)", to: base.gradient.to };
  }

  if (/(rose|magenta|fuchsia)/.test(lowered)) {
    base.accent = "#f472b6";
    base.secondary = "#ec4899";
    base.gradient = { from: "rgba(244, 114, 182, 0.36)", via: "rgba(236, 72, 153, 0.28)", to: base.gradient.to };
  }

  return { key, palette: base };
};

const determineSector = (prompt: string): SectorKey => {
  const lowered = prompt.toLowerCase();
  if (/(commerce|retail|boutique|marketplace|vente)/.test(lowered)) return "ecommerce";
  if (/(créatif|design|agence|studio|artiste)/.test(lowered)) return "creative";
  if (/(bien-être|wellness|santé|spa|yoga|fitness)/.test(lowered)) return "wellness";
  if (/(finance|banque|invest|fintech|comptable)/.test(lowered)) return "finance";
  if (/(éducation|formation|learn|cours|academy|edtech)/.test(lowered)) return "education";
  return /(saas|startup|logiciel|b2b|plateforme)/.test(lowered) ? "saas" : "ecommerce";
};

const buildContentForSector = (projectName: string, sector: SectorKey) => {
  const library: Record<
    SectorKey,
    () => {
      hero: HeroContent;
      metrics: MetricContent[];
      features: FeatureContent[];
      testimonials: TestimonialContent[];
      pricing: { headline: string; plans: PricingPlan[] };
      faq: FaqContent[];
      cta: { title: string; subtitle: string; action: string };
      footer: FooterContent;
    }
  > = {
    saas: () => ({
      hero: {
        eyebrow: "Plateforme SaaS intelligente",
        title: `Propulsez ${projectName} à grande échelle`,
        subtitle:
          "Une suite produit pilotée par les données pour orchestrer vos opérations, convertir vos prospects et fidéliser vos clients en continu.",
        highlight: "Optimisé pour la croissance B2B",
        primaryCta: "Demander une démo",
        secondaryCta: "Découvrir la plateforme",
      },
      metrics: [
        { label: "Taux d'adoption", value: "92%", helper: "Clients actifs après 3 mois" },
        { label: "Gain de temps", value: "-48%", helper: "de tâches manuelles" },
        { label: "ROI moyen", value: "x7", helper: "Observé chez nos clients" },
        { label: "SLA garanties", value: "99.9%", helper: "Disponibilité cloud" },
      ],
      features: [
        {
          title: "Automatisations orchestrées",
          description: "Déclenchez des parcours clients complexes grâce à des scénarios drag & drop calibrés.",
          icon: "Sparkles",
        },
        {
          title: "Pilotage prédictif",
          description: "Analysez la performance en temps réel avec des tableaux de bord alimentés par l'IA.",
          icon: "LineChart",
        },
        {
          title: "Sécurité entreprise",
          description: "Infrastructure certifiée SOC2, chiffrement AES-256 et gestion granulaire des accès.",
          icon: "ShieldCheck",
        },
      ],
      testimonials: [
        {
          quote: "En 8 semaines nous avons doublé notre MRR sans alourdir l'équipe. L'orchestration automatisée change la donne.",
          name: "Léa Martin",
          role: "CMO @ Flowstack",
        },
        {
          quote: "Le pilotage prédictif nous permet d'anticiper les churns et d'agir avant qu'ils n'arrivent.",
          name: "Julien Armand",
          role: "Head of Success @ ScaleOps",
        },
        {
          quote: "L'intégration a pris moins d'une journée et la conformité répond aux exigences de nos clients entreprises.",
          name: "Sarah Khellaf",
          role: "CTO @ NovaCloud",
        },
      ],
      pricing: {
        headline: "Des plans transparents qui s'adaptent à votre croissance",
        plans: [
          {
            name: "Launch",
            price: "89€",
            period: "par mois",
            description: "Pour valider votre marché avec des automatisations ciblées.",
            benefits: [
              "Jusqu'à 2 espaces de travail",
              "Workflows illimités",
              "Support email prioritaire",
            ],
          },
          {
            name: "Scale",
            price: "249€",
            period: "par mois",
            description: "Pour les équipes produit qui orchestrent des expériences complexes.",
            benefits: [
              "SLA 99.9% & monitoring",
              "SSO & rôles avancés",
              "Connecteurs data temps réel",
            ],
            popular: true,
          },
          {
            name: "Enterprise",
            price: "Sur mesure",
            period: "",
            description: "Accompagnement dédié, conformité renforcée et scalabilité globale.",
            benefits: [
              "Gestion multi-tenant",
              "Accès API privé",
              "CSM dédié & onboarding",
            ],
          },
        ],
      },
      faq: [
        {
          question: "Combien de temps dure l'onboarding ?",
          answer: "En moyenne 10 jours avec un spécialiste dédié qui configure vos premiers parcours et vos intégrations.",
        },
        {
          question: "Puis-je connecter mes outils existants ?",
          answer: "Oui, plus de 40 connecteurs natifs (HubSpot, Salesforce, Notion...) et une API GraphQL ouverte.",
        },
        {
          question: "Comment est gérée la sécurité des données ?",
          answer: "Toutes les données sont chiffrées au repos et en transit, avec hébergement dans des régions au choix (UE/US).",
        },
        {
          question: "Proposez-vous un essai gratuit ?",
          answer: "Un essai complet de 14 jours est inclus, avec la possibilité d'exporter vos configurations à tout moment.",
        },
      ],
      cta: {
        title: "Prêt à orchestrer une expérience client sans friction ?",
        subtitle: "Nos experts vous montrent comment automatiser vos processus en moins de 30 minutes.",
        action: "Programmer une session",
      },
      footer: {
        company: projectName,
        blurb:
          `${projectName} est une plateforme SaaS européenne spécialisée dans l'orchestration d'expériences clients temps réel.`,
        links: [
          { label: "Produit", href: "#features" },
          { label: "Tarifs", href: "#pricing" },
          { label: "Sécurité", href: "#faq" },
          { label: "Contact", href: "#cta" },
        ],
      },
    }),
    ecommerce: () => ({
      hero: {
        eyebrow: "Collection signature",
        title: `L'expérience ${projectName} sans compromis`,
        subtitle:
          "Un univers immersif conçu pour mettre en scène vos produits iconiques avec un storytelling sensoriel et engageant.",
        highlight: "Service client conciergerie 24/7",
        primaryCta: "Explorer la collection",
        secondaryCta: "Rencontrer un styliste",
      },
      metrics: [
        { label: "Clients fidèles", value: "38k", helper: "Programme ambassadeurs" },
        { label: "Satisfaction", value: "4.9/5", helper: "Avis vérifiés" },
        { label: "Livraison", value: "48h", helper: "Partout en Europe" },
        { label: "Retours", value: "Gratuits", helper: "Sous 30 jours" },
      ],
      features: [
        {
          title: "Merchandising cinématique",
          description: "Mettez vos produits en scène avec des galeries immersives, vidéos loop et lookbooks éditoriaux.",
          icon: "ShoppingBag",
        },
        {
          title: "Tunnel ultra fluide",
          description: "Paiement express, wallet intégré et recommandations dynamiques boostent la conversion.",
          icon: "CreditCard",
        },
        {
          title: "Logistique haut de gamme",
          description: "Suivi temps réel, emballages premium et retours simplifiés, connectés à vos systèmes.",
          icon: "Truck",
        },
      ],
      testimonials: [
        {
          quote: "Nos lancements sont devenus des événements live. Le taux de conversion a bondi de 37%.",
          name: "Camille G.",
          role: "Fondatrice @ Maison Élytre",
        },
        {
          quote: "Le storytelling interactif renforce la désirabilité et la valeur perçue de nos pièces.",
          name: "Armand T.",
          role: "Directeur Création @ Atelier Nova",
        },
        {
          quote: "Le service conciergerie intégré fidélise nos clients premium à l'international.",
          name: "Isabella R.",
          role: "CX Lead @ Riviera Studio",
        },
      ],
      pricing: {
        headline: "Des expériences calibrées pour chaque drop",
        plans: [
          {
            name: "Essentiel",
            price: "129€",
            period: "par mois",
            description: "Idéal pour lancer une collection capsule et tester de nouveaux marchés.",
            benefits: ["Lookbooks interactifs", "Paiement express", "Dashboard conversions"],
          },
          {
            name: "Iconique",
            price: "349€",
            period: "par mois",
            description: "Pensé pour les maisons ambitieuses qui veulent scénariser chaque lancement.",
            benefits: ["Conciergerie intégrée", "CRM luxe", "Expériences AR"],
            popular: true,
          },
          {
            name: "Haute Couture",
            price: "Sur invitation",
            period: "",
            description: "Accompagnement signature, production de contenus et opérations hybrides.",
            benefits: ["Stratégie retail média", "Studio créatif dédié", "Partenariats influence"],
          },
        ],
      },
      faq: [
        {
          question: "Comment personnaliser l'expérience ?",
          answer: "Chaque section est modulaire. Ajustez le branding, les contenus et les micro-interactions depuis le CMS.",
        },
        {
          question: "Proposez-vous une intégration Shopify ?",
          answer: "Oui, une intégration native synchronise produits, inventaire et commandes en temps réel.",
        },
        {
          question: "Quels services logistiques sont inclus ?",
          answer: "Partenariats avec DHL Express, Colissimo Signature et coursiers urbains pour une livraison premium.",
        },
        {
          question: "Peut-on vendre à l'international ?",
          answer: "Le module multi-devise gère automatiquement TVA, droits de douane et langues locales.",
        },
      ],
      cta: {
        title: "Créez une expérience retail signature",
        subtitle: "Nos consultants imaginent avec vous un parcours d'achat immersif et mémorable.",
        action: "Planifier un atelier",
      },
      footer: {
        company: projectName,
        blurb: `La maison ${projectName} combine artisanat et innovation pour des expériences e-commerce mémorables.`,
        links: [
          { label: "Univers", href: "#hero" },
          { label: "Services", href: "#features" },
          { label: "Témoignages", href: "#testimonials" },
          { label: "Contact", href: "#cta" },
        ],
      },
    }),
    creative: () => ({
      hero: {
        eyebrow: "Studio créatif multidisciplinaire",
        title: `${projectName} imagine des univers narratifs sur-mesure`,
        subtitle:
          "Design systems, identités visuelles et expériences immersives : nous façonnons des marques qui laissent une empreinte durable.",
        highlight: "Approche design + stratégie",
        primaryCta: "Lancer un projet",
        secondaryCta: "Voir nos réalisations",
      },
      metrics: [
        { label: "Clients accompagnés", value: "120+", helper: "scale-ups & institutions" },
        { label: "Prix", value: "18", helper: "Récompenses internationales" },
        { label: "Équipe", value: "32", helper: "Designers & stratèges" },
        { label: "Studios", value: "Paris / Montréal", helper: "Présence hybride" },
      ],
      features: [
        {
          title: "Brand stories immersives",
          description: "Narration audiovisuelle, motion design et AR pour incarner votre vision.",
          icon: "Palette",
        },
        {
          title: "Design systems scalables",
          description: "Librarie de composants shadcn-ui et tokens prêts pour vos équipes produit.",
          icon: "PenTool",
        },
        {
          title: "Expériences interactives",
          description: "Microsites, installations phygitales et prototypes immersifs avec Framer Motion.",
          icon: "Stars",
        },
      ],
      testimonials: [
        {
          quote: "Une équipe rare qui combine esthétique, stratégie et excellence technique.",
          name: "Maëlys B.",
          role: "VP Brand @ Neonwave",
        },
        {
          quote: "Leur maîtrise des interactions crée des expériences web qui marquent durablement.",
          name: "Noah K.",
          role: "Creative Director @ Atlas",
        },
        {
          quote: "Un partenaire proactif qui sait co-créer avec nos équipes internes.",
          name: "Inès R.",
          role: "Head of Product Design @ Lumen",
        },
      ],
      pricing: {
        headline: "Des offres modulaires pour chaque ambition",
        plans: [
          {
            name: "Sprint identitaire",
            price: "4 900€",
            period: "",
            description: "Diagnostic, moodboard et kit d'identité livrés en 2 semaines.",
            benefits: ["Workshop immersif", "Design system minimal", "Guide typographique"],
          },
          {
            name: "Expérience digitale",
            price: "12 500€",
            period: "",
            description: "Site narratif animé, production contenus et intégration sur-mesure.",
            benefits: ["Storyboard motion", "Prototypage Framer", "Optimisation SEO"],
            popular: true,
          },
          {
            name: "Partenariat annuel",
            price: "Sur devis",
            period: "",
            description: "Studio étendu avec squad dédiée, R&D créative et direction artistique.",
            benefits: ["Sprint mensuel", "Veille créative", "Accès atelier physique"],
          },
        ],
      },
      faq: [
        {
          question: "Comment débute une collaboration ?",
          answer: "Un atelier d'immersion nous permet de comprendre vos enjeux, définir la vision et prioriser les livrables.",
        },
        {
          question: "Pouvez-vous travailler avec nos équipes internes ?",
          answer: "Oui, nous co-construisons avec vos designers, développeurs ou partenaires pour accélérer la production.",
        },
        {
          question: "Livrez-vous les fichiers sources ?",
          answer: "Tous les projets incluent les sources Figma, bibliothèques de composants et guidelines d'usage.",
        },
        {
          question: "Quelles technologies utilisez-vous ?",
          answer: "React, Vite, Tailwind, Framer Motion et un socle shadcn-ui pour des expériences performantes.",
        },
      ],
      cta: {
        title: "Imaginons votre prochain chapitre",
        subtitle: "Racontez-nous votre vision, nous orchestrons une expérience cohérente sur tous les points de contact.",
        action: "Programmer un call",
      },
      footer: {
        company: projectName,
        blurb: `${projectName} est un studio indépendant qui marie craft, data et innovation pour révéler des marques durables.`,
        links: [
          { label: "Expertises", href: "#features" },
          { label: "Réalisations", href: "#testimonials" },
          { label: "Offres", href: "#pricing" },
          { label: "Contact", href: "#cta" },
        ],
      },
    }),
    wellness: () => ({
      hero: {
        eyebrow: "Programme bien-être holistique",
        title: `Reconnectez-vous avec ${projectName}`,
        subtitle:
          "Coaching personnalisé, rituels sensoriels et contenus immersifs pour un équilibre durable entre corps et esprit.",
        highlight: "Accompagnement hybride présentiel & digital",
        primaryCta: "Commencer l'expérience",
        secondaryCta: "Explorer les rituels",
      },
      metrics: [
        { label: "Membres", value: "12k", helper: "Communauté active" },
        { label: "Sessions guidées", value: "450+", helper: "Audio & vidéo HD" },
        { label: "Experts", value: "35", helper: "Coachs certifiés" },
        { label: "Satisfaction", value: "97%", helper: "Programme signature" },
      ],
      features: [
        {
          title: "Rituels adaptatifs",
          description: "Programmes personnalisés selon votre niveau d'énergie et vos objectifs.",
          icon: "HeartPulse",
        },
        {
          title: "Immersion sensorielle",
          description: "Paysages sonores binauraux, respirations guidées et visualisations dynamiques.",
          icon: "Sun",
        },
        {
          title: "Communauté sereine",
          description: "Cercles hebdomadaires, masterclass live et suivi par vos coachs favoris.",
          icon: "Leaf",
        },
      ],
      testimonials: [
        {
          quote: "Je me sens accompagnée au quotidien, même à distance. Les rituels audio sont devenus ma bulle.",
          name: "Alicia D.",
          role: "Membre depuis 2022",
        },
        {
          quote: "Une équipe d'experts attentifs et des programmes qui s'ajustent vraiment à mon rythme.",
          name: "Raphaël S.",
          role: "Entrepreneur & membre premium",
        },
        {
          quote: "Les immersions multi-sensorielles m'aident à décrocher et à retrouver mon énergie.",
          name: "Sophie L.",
          role: "Coach partenaire",
        },
      ],
      pricing: {
        headline: "Choisissez le rythme qui correspond à votre énergie",
        plans: [
          {
            name: "Essence",
            price: "39€",
            period: "par mois",
            description: "Rituels audio, bibliothèque vidéo et suivi hebdomadaire.",
            benefits: ["Parcours découverte", "Check-in coach", "Communauté privée"],
          },
          {
            name: "Équilibre",
            price: "79€",
            period: "par mois",
            description: "Immersions live, nutrition personnalisée et ateliers experts.",
            benefits: ["Sessions live illimitées", "Plans nutrition", "Accès retreats"],
            popular: true,
          },
          {
            name: "Signature",
            price: "149€",
            period: "par mois",
            description: "Coaching individuel bimensuel et expériences physiques exclusives.",
            benefits: ["Coaching 1:1", "Retraites trimestrielles", "Kit sensoriel livré"],
          },
        ],
      },
      faq: [
        {
          question: "Comment se déroule l'onboarding ?",
          answer: "Un diagnostic bien-être de 20 minutes et un plan personnalisé co-construit avec votre coach.",
        },
        {
          question: "Puis-je arrêter à tout moment ?",
          answer: "Oui, les abonnements sont sans engagement avec suspension en un clic depuis votre espace.",
        },
        {
          question: "Y a-t-il des évènements physiques ?",
          answer: "Des retraites urbaines mensuelles, des immersions nature et des ateliers sensoriels en petit comité.",
        },
        {
          question: "Est-ce adapté aux débutants ?",
          answer: "Absolument, chaque rituel existe en trois intensités et vos coachs vous guident pas à pas.",
        },
      ],
      cta: {
        title: "Offrez-vous un reset profond",
        subtitle: "Planifiez un appel découverte pour imaginer votre programme personnalisé.",
        action: "Réserver un diagnostic",
      },
      footer: {
        company: projectName,
        blurb: `${projectName} crée des programmes bien-être mêlant neurosciences, nutrition et rituels sensoriels.`,
        links: [
          { label: "Programme", href: "#features" },
          { label: "Communauté", href: "#testimonials" },
          { label: "Offres", href: "#pricing" },
          { label: "FAQ", href: "#faq" },
        ],
      },
    }),
    finance: () => ({
      hero: {
        eyebrow: "Plateforme fintech régulée",
        title: `${projectName} simplifie vos finances temps réel`,
        subtitle:
          "Pilotage de trésorerie, paiements internationaux et reporting automatisé sur une seule interface sécurisée.",
        highlight: "Conforme PSD2 & RGPD",
        primaryCta: "Ouvrir un compte pro",
        secondaryCta: "Comparer les plans",
      },
      metrics: [
        { label: "Entreprises clientes", value: "4 800", helper: "PME & scale-ups" },
        { label: "Volumes gérés", value: "2,1 Md€", helper: "Flux 2023" },
        { label: "Temps gagné", value: "-12h", helper: "par mois sur la compta" },
        { label: "Support", value: "24/7", helper: "Experts compliance" },
      ],
      features: [
        {
          title: "Cashflow prévisionnel",
          description: "Connectez vos banques, ERP et outils comptables pour anticiper vos flux.",
          icon: "TrendingUp",
        },
        {
          title: "Paiements intelligents",
          description: "Automatisez vos virements, masse salariale et paiements fournisseurs en un clic.",
          icon: "CreditCard",
        },
        {
          title: "Sécurité bancaire",
          description: "Double authentification, audit trail et conformité renforcée pour vos équipes finance.",
          icon: "ShieldCheck",
        },
      ],
      testimonials: [
        {
          quote: "Nous avons enfin une vision consolidée de nos comptes et des alertes proactives sur notre trésorerie.",
          name: "Pauline F.",
          role: "DAF @ LedgerWave",
        },
        {
          quote: "Les paiements programmés et la gestion des accès simplifient notre quotidien.",
          name: "Maxime H.",
          role: "CEO @ Alpina Tech",
        },
        {
          quote: "Le support compliance a été déterminant pour notre expansion à l'international.",
          name: "Hannah C.",
          role: "Legal Lead @ GlobalPay",
        },
      ],
      pricing: {
        headline: "Une tarification claire pour vos équipes finance",
        plans: [
          {
            name: "Start",
            price: "59€",
            period: "par mois",
            description: "Gestion de trésorerie et paiements essentiels pour les jeunes entreprises.",
            benefits: ["Comptes multi-devises", "Cartes virtuelles", "Exports comptables"],
          },
          {
            name: "Growth",
            price: "149€",
            period: "par mois",
            description: "Automatisez vos reportings et sécurisez vos workflows d'approbation.",
            benefits: ["Approvals avancés", "API & webhooks", "Support prioritaire"],
            popular: true,
          },
          {
            name: "Enterprise",
            price: "Sur devis",
            period: "",
            description: "Offre personnalisée avec connecteurs ERP, gestion fine des accès et SLA renforcé.",
            benefits: ["Onboarding dédié", "Connecteurs ERP", "Support conformité"],
          },
        ],
      },
      faq: [
        {
          question: "Êtes-vous une institution régulée ?",
          answer: `${projectName} est partenaire d'un établissement de paiement agréé, garantissant conformité et sécurité.`,
        },
        {
          question: "Comment fonctionne la comptabilité ?",
          answer: "Export direct vers Pennylane, Sage, Xero et QuickBooks avec lettrage automatique.",
        },
        {
          question: "Quelles cartes proposez-vous ?",
          answer: "Cartes physiques et virtuelles paramétrables avec plafonds, catégories et règles d'approbation.",
        },
        {
          question: "Puis-je inviter mon expert-comptable ?",
          answer: "Oui, créez des accès invités avec droits en lecture ou en édition selon vos besoins.",
        },
      ],
      cta: {
        title: "Gagnez en visibilité financière",
        subtitle: `Testez gratuitement ${projectName} et automatisez votre pilotage de trésorerie.`,
        action: "Activer l'essai",
      },
      footer: {
        company: projectName,
        blurb: `${projectName} centralise vos finances professionnelles avec une sécurité bancaire de niveau entreprise.`,
        links: [
          { label: "Produit", href: "#features" },
          { label: "Tarifs", href: "#pricing" },
          { label: "Conformité", href: "#faq" },
          { label: "Support", href: "#cta" },
        ],
      },
    }),
    education: () => ({
      hero: {
        eyebrow: "Plateforme d'apprentissage immersif",
        title: `${projectName} forme les talents de demain`,
        subtitle:
          "Programmes modulaires, mentorat humain et expériences interactives pour apprendre en faisant.",
        highlight: "Certification reconnue + communauté active",
        primaryCta: "Découvrir les parcours",
        secondaryCta: "Assister à une session live",
      },
      metrics: [
        { label: "Apprenants", value: "28k", helper: "Communauté internationale" },
        { label: "Mentors", value: "350", helper: "Professionnels actifs" },
        { label: "Taux d'emploi", value: "87%", helper: "6 mois après la formation" },
        { label: "Projets", value: "+1 200", helper: "Cas concrets réalisés" },
      ],
      features: [
        {
          title: "Modules interactifs",
          description: "Apprentissage par la pratique avec défis scénarisés et feedback instantané.",
          icon: "GraduationCap",
        },
        {
          title: "Mentorat personnalisé",
          description: "Sessions hebdomadaires avec des mentors issus des meilleures entreprises.",
          icon: "Users",
        },
        {
          title: "Community hub",
          description: "Événements live, job board et projets collaboratifs pour progresser ensemble.",
          icon: "BookOpen",
        },
      ],
      testimonials: [
        {
          quote: "La pédagogie basée sur des projets concrets m'a permis de changer de carrière en 4 mois.",
          name: "Nina P.",
          role: "Data Analyst @ Helios",
        },
        {
          quote: "Les mentors sont ultra disponibles et partagent des cas réels du terrain.",
          name: "Elliott M.",
          role: "Product Designer freelance",
        },
        {
          quote: "La communauté reste active bien après la fin du programme, c'est notre meilleur réseau.",
          name: "Sofia L.",
          role: "Alumni & mentor",
        },
      ],
      pricing: {
        headline: "Un investissement progressif dans votre avenir",
        plans: [
          {
            name: "Découverte",
            price: "490€",
            period: "",
            description: "Bootcamp d'initiation en 2 week-ends pour explorer le métier.",
            benefits: ["12h de live", "Atelier carrière", "Badge de compétences"],
          },
          {
            name: "Intensif",
            price: "2 490€",
            period: "",
            description: "Parcours certifiant sur 8 semaines avec mentorat et projets réels.",
            benefits: ["Mentorat 1:1", "Portfolio complet", "Coaching carrière"],
            popular: true,
          },
          {
            name: "Executive",
            price: "4 900€",
            period: "",
            description: "Programme sur-mesure pour cadres et équipes en reconversion accélérée.",
            benefits: ["Diagnostic sur mesure", "Sessions privées", "Alumni club premium"],
          },
        ],
      },
      faq: [
        {
          question: "Quel est le rythme hebdomadaire ?",
          answer: "Comptez 6 à 8h d'apprentissage accompagné et 4h de travail personnel, modulables selon vos contraintes.",
        },
        {
          question: "Comment fonctionne le mentorat ?",
          answer: "Chaque apprenant est suivi par un mentor référent et participe à des sessions de groupe thématiques.",
        },
        {
          question: "Vos programmes sont-ils certifiants ?",
          answer: "Oui, nos parcours sont certifiés Qualiopi et reconnus par les principaux acteurs du marché.",
        },
        {
          question: "Proposez-vous un financement ?",
          answer: "Paiement en plusieurs fois, prise en charge CPF (France) et conventions entreprise disponibles.",
        },
      ],
      cta: {
        title: "Rejoignez la prochaine cohorte",
        subtitle: "Un conseiller pédagogique vous guide vers le parcours adapté à vos objectifs.",
        action: "Parler à un conseiller",
      },
      footer: {
        company: projectName,
        blurb: `${projectName} conçoit des expériences d'apprentissage immersives portées par une communauté engagée.`,
        links: [
          { label: "Programmes", href: "#features" },
          { label: "Admissions", href: "#faq" },
          { label: "Financement", href: "#pricing" },
          { label: "Contact", href: "#cta" },
        ],
      },
    }),
  };

  return library[sector]();
};

const analyzePrompt = (prompt: string, projectName: string): PromptAnalysis => {
  const lowered = prompt.toLowerCase();
  const { key: paletteKey, palette } = determinePalette(prompt);
  const sectorKey = determineSector(prompt);
  const content = buildContentForSector(projectName, sectorKey);
  const tone = inferTone(prompt);

  let motion: "float" | "slide" | "scale" = "slide";
  if (/(apaisant|doux|premium|élégant|luxe)/.test(lowered)) motion = "float";
  if (/(futuriste|tech|cyber|néon)/.test(lowered)) motion = "scale";
  if (/(énergique|dynamique|sport|startup)/.test(lowered)) motion = "slide";

  const showTestimonials = !/(sans témoignage|pas de témoignage)/.test(lowered);
  const showPricing =
    !/(sans pricing|sans tarif|gratuit uniquement)/.test(lowered) &&
    (/(tarif|pricing|prix)/.test(lowered) || ["saas", "finance", "ecommerce", "education", "wellness"].includes(sectorKey));
  const showFaq = !/(sans faq|pas de faq)/.test(lowered);
  const showCta = !/(sans cta|pas d'appel)/.test(lowered);

  return {
    palette,
    paletteName: palettePresets[paletteKey].name,
    ambiance: inferStyle(prompt),
    sector: sectorLabels[sectorKey],
    motion,
    sections: {
      showTestimonials,
      showPricing,
      showFaq,
      showCta,
    },
    hero: content.hero,
    metrics: content.metrics,
    features: content.features,
    testimonials: content.testimonials,
    pricing: content.pricing,
    faq: content.faq,
    cta: content.cta,
    footer: content.footer,
    tone,
    font: {
      package: "@fontsource-variable/urbanist",
      family: "'Urbanist Variable', 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
      fallback: "Inter, system-ui, sans-serif",
    },
  };
};

const buildStructureSteps = (prompt: string, kind: ProjectKind): PlanStep[] => {
  const lowered = prompt.toLowerCase();
  const steps: PlanStep[] = [];

  steps.push({
    id: "layout",
    title: kind === "application" ? "Initialiser la navigation" : "Structurer la page d'accueil",
    description:
      kind === "application"
        ? "Créer la navigation principale avec onglets et état actif pour les vues clés."
        : "Définir la section Hero avec message principal, appel à l'action et sous-texte clarifiant l'offre.",
    deliverable: kind === "application" ? "Composant App avec navigation" : "Composant Hero avec CTA",
  });

  if (/(produit|catalogue|commerce|boutique)/.test(lowered)) {
    steps.push({
      id: "catalogue",
      title: "Mettre en avant les produits et offres",
      description:
        "Construire une grille produits avec visuel, prix, arguments de vente et appel à l'action marchand.",
      deliverable: "Section produits détaillée",
    });
  }

  if (/(témoignage|avis|clients)/.test(lowered)) {
    steps.push({
      id: "testimonials",
      title: "Ajouter une section témoignages",
      description:
        "Afficher trois retours clients avec nom, rôle et bénéfice principal pour renforcer la preuve sociale.",
      deliverable: "Section témoignages",
    });
  }

  if (/(contact|formulaire|newsletter)/.test(lowered)) {
    steps.push({
      id: "contact",
      title: "Préparer la conversion",
      description:
        "Inclure un bloc contact/newsletter avec formulaire minimal et message de confiance.",
      deliverable: "Bloc formulaire fonctionnel",
    });
  }

  if (kind === "application") {
    steps.push({
      id: "analytics",
      title: "Construire les widgets de données",
      description:
        "Définir cartes statistiques, liste d'activité récente et tableau des tâches pour illustrer l'usage.",
      deliverable: "Widgets analytiques et tableau Kanban",
    });
  } else {
    steps.push({
      id: "features",
      title: "Détailler les bénéfices clés",
      description:
        "Créer une section caractéristiques avec icônes et arguments pour clarifier la proposition de valeur.",
      deliverable: "Grille de fonctionnalités",
    });
  }

  return steps;
};

const buildUiSteps = (prompt: string): PlanStep[] => {
  const lowered = prompt.toLowerCase();
  const steps: PlanStep[] = [
    {
      id: "palette",
      title: "Définir la palette et la typographie",
      description: `Appliquer une ${inferStyle(prompt)} avec typographie sans-serif lisible.`,
      deliverable: "Variables Tailwind + styles globaux",
    },
    {
      id: "cta",
      title: "Styliser les appels à l'action",
      description: lowered.includes("bouton vert")
        ? "Transformer les boutons principaux en accent vert pour respecter le brief."
        : "Mettre en avant les boutons primaires avec dégradé et hover animé.",
      deliverable: "Boutons primaires alignés au style",
    },
  ];

  if (/(responsive|mobile|adapté)/.test(lowered)) {
    steps.push({
      id: "responsive",
      title: "Assurer le responsive",
      description:
        "Utiliser flexbox et grille responsive pour garantir une expérience optimale sur mobile et desktop.",
      deliverable: "Breakpoints Tailwind",
    });
  }

  return steps;
};

const buildQualitySteps = (kind: ProjectKind): PlanStep[] => [
  {
    id: "structure",
    title: "Vérifier l'arborescence",
    description: "Confirmer la présence des fichiers Vite (index.html, src/main.tsx, src/App.tsx).",
    deliverable: "Structure Vite complète",
  },
  {
    id: "instructions",
    title: "Synthétiser les instructions",
    description: "Rédiger un README/brief décrivant comment poursuivre le développement.",
    deliverable: kind === "application" ? "Instructions pour dashboard" : "Guide de personnalisation",
  },
];

const baseReactVite = (projectName: string, analysis: PromptAnalysis): FileMap => {
  const paletteHsl = {
    background: hexToHsl(analysis.palette.background),
    surface: hexToHsl(analysis.palette.surface),
    foreground: hexToHsl(analysis.palette.foreground),
    muted: hexToHsl(analysis.palette.muted),
    mutedForeground: hexToHsl(analysis.palette.mutedForeground),
    primary: hexToHsl(analysis.palette.primary),
    primaryForeground: hexToHsl(analysis.palette.primaryForeground),
    secondary: hexToHsl(analysis.palette.secondary),
    accent: hexToHsl(analysis.palette.accent),
    accentForeground: hexToHsl(analysis.palette.accentForeground),
    border: hexToHsl(analysis.palette.border),
    ring: hexToHsl(analysis.palette.ring),
    destructive: hexToHsl("#ef4444"),
    destructiveForeground: hexToHsl("#f8fafc"),
  };

  const siteConfigObject = {
    projectName,
    sector: analysis.sector,
    tone: analysis.tone,
    ambiance: analysis.ambiance,
    palette: analysis.palette,
    paletteName: analysis.paletteName,
    animation: analysis.motion,
    sections: analysis.sections,
    hero: analysis.hero,
    metrics: analysis.metrics,
    features: analysis.features,
    testimonials: analysis.testimonials,
    pricing: analysis.pricing,
    faq: analysis.faq,
    cta: analysis.cta,
    footer: analysis.footer,
    font: analysis.font,
  };

  const siteConfigCode = `export const siteConfig = ${JSON.stringify(siteConfigObject, null, 2)} as const;\n`;

  const metaDescription = `${analysis.tone.charAt(0).toUpperCase()}${analysis.tone.slice(1)} pour ${analysis.sector}.`;
  const safeDescription = metaDescription.replace(/"/g, "&quot;");
  const projectSlug = projectName.toLowerCase().replace(/\s+/g, "-");

  const globalsCss = `@import "${analysis.font.package}";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: ${paletteHsl.background};
    --foreground: ${paletteHsl.foreground};
    --muted: ${paletteHsl.muted};
    --muted-foreground: ${paletteHsl.mutedForeground};
    --card: ${paletteHsl.surface};
    --card-foreground: ${paletteHsl.foreground};
    --popover: ${paletteHsl.surface};
    --popover-foreground: ${paletteHsl.foreground};
    --border: ${paletteHsl.border};
    --input: ${paletteHsl.border};
    --primary: ${paletteHsl.primary};
    --primary-foreground: ${paletteHsl.primaryForeground};
    --secondary: ${paletteHsl.secondary};
    --secondary-foreground: ${paletteHsl.foreground};
    --accent: ${paletteHsl.accent};
    --accent-foreground: ${paletteHsl.accentForeground};
    --destructive: ${paletteHsl.destructive};
    --destructive-foreground: ${paletteHsl.destructiveForeground};
    --ring: ${paletteHsl.ring};
    --radius: 1.2rem;
    --gradient-from: ${analysis.palette.gradient.from};
    --gradient-via: ${analysis.palette.gradient.via};
    --gradient-to: ${analysis.palette.gradient.to};
    --font-sans: ${analysis.font.family};
    --font-fallback: ${analysis.font.fallback};
  }

  body {
    min-height: 100vh;
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-family: var(--font-sans);
    background-image:
      radial-gradient(circle at 0% 0%, var(--gradient-from), transparent 55%),
      radial-gradient(circle at 100% 0%, var(--gradient-via), transparent 60%),
      radial-gradient(circle at 50% 120%, var(--gradient-to), transparent 70%);
    @apply antialiased;
  }

  ::selection {
    background: hsla(var(--primary), 0.35);
    color: hsl(var(--primary-foreground));
  }
}

@layer utilities {
  .bg-hero-grid {
    background-image:
      linear-gradient(transparent 95%, hsla(var(--primary), 0.08) 100%),
      linear-gradient(90deg, transparent 95%, hsla(var(--primary), 0.08) 100%);
    background-size: 160px 160px;
  }

  .glass-panel {
    @apply border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg shadow-black/10;
  }

  .animate-aurora {
    animation: aurora 18s ease-in-out infinite;
    background-size: 200% 200%;
  }
}

@layer components {
  .section-heading {
    @apply text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl;
  }

  .section-subheading {
    @apply text-balance text-base text-muted-foreground/90 sm:text-lg;
  }
}

@keyframes aurora {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes floaty {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
`;

  return {
    "/index.html": {
      code: `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${safeDescription}" />
    <title>${projectName}</title>
  </head>
  <body class="bg-background text-foreground antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
    },
    "/src/main.tsx": {
      code: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`
    },
    "/src/App.tsx": {
      code: `import { Hero } from "./components/Sections/Hero";
import { Features } from "./components/Sections/Features";
import { Testimonials } from "./components/Sections/Testimonials";
import { Pricing } from "./components/Sections/Pricing";
import { FAQ } from "./components/Sections/FAQ";
import { CallToAction } from "./components/Sections/CallToAction";
import { Footer } from "./components/Sections/Footer";
import { siteConfig } from "./config/site";
import { cn } from "./lib/utils";

export default function App() {
  const backgroundStyle = {
    backgroundImage:
      "radial-gradient(circle at 0% 0%, " +
      siteConfig.palette.gradient.from +
      ", transparent 55%), " +
      "radial-gradient(circle at 100% 0%, " +
      siteConfig.palette.gradient.via +
      ", transparent 60%), " +
      "radial-gradient(circle at 50% 120%, " +
      siteConfig.palette.gradient.to +
      ", transparent 70%)",
  };

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-background text-muted-foreground antialiased",
      )}
      style={backgroundStyle}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />
      <main className="relative z-10 flex flex-col gap-32 pb-24">
        <Hero />
        <Features />
        {siteConfig.sections.showTestimonials && <Testimonials />}
        {siteConfig.sections.showPricing && <Pricing />}
        {siteConfig.sections.showFaq && <FAQ />}
        {siteConfig.sections.showCta && <CallToAction />}
      </main>
      <Footer />
    </div>
  );
}
`
    },
    "/src/config/site.ts": {
      code: siteConfigCode,
    },
    "/src/lib/utils.ts": {
      code: `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
    },
    "/src/styles/globals.css": {
      code: globalsCss,
    },
    "/src/components/ui/button.tsx": {
      code: `import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "outline" | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "xl";

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-primary/50 bg-gradient-to-r from-primary/80 via-primary to-primary/80 px-6 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition duration-300 hover:shadow-primary/40",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/70 px-6 font-medium text-foreground shadow-md shadow-black/5 transition hover:border-primary/40 hover:text-foreground",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-transparent px-4 font-medium text-foreground/80 transition hover:text-foreground hover:bg-white/5",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-2xl border border-foreground/20 bg-transparent px-6 font-semibold text-foreground transition hover:border-primary/50 hover:text-primary",
  subtle:
    "inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-primary/10 px-5 font-medium text-primary transition hover:bg-primary/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-7 text-base tracking-tight",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        className={cn(
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
`,
    },
    "/src/components/ui/card.tsx": {
      code: `import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass-panel relative rounded-3xl border border-border/60 bg-card/70 p-6 shadow-lg shadow-primary/10",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mb-4 space-y-1", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-tight text-foreground", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-6 flex items-center justify-between", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
`,
    },
    "/src/components/ui/badge.tsx": {
      code: `import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "outline" | "soft";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default:
    "inline-flex items-center rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary",
  outline:
    "inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-foreground",
  soft:
    "inline-flex items-center rounded-full border border-transparent bg-muted/40 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn("select-none whitespace-nowrap", variants[variant], className)}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
`,
    },
    "/package.json": {
      code: `{
  "name": "${projectSlug}",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --max-warnings=0",
    "tailwind:init": "tailwindcss init -p",
    "tailwind:build": "tailwindcss -i ./src/styles/globals.css -o ./dist/tailwind.css --watch"
  },
  "dependencies": {
    "@fontsource-variable/urbanist": "^5.0.8",
    "@radix-ui/react-slot": "^1.0.2",
    "clsx": "^2.1.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.379.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.17",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.3",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.4.5",
    "vite": "^5.0.12"
  }
}
`,
    },
    "/tsconfig.json": {
      code: `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
`,
    },
    "/vite.config.ts": {
      code: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
`,
    },
    "/tailwind.config.ts": {
      code: `import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "var(--font-fallback)", "sans-serif"],
      },
      borderRadius: {
        xl: "var(--radius)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(circle at var(--tw-gradient-stops))",
        "hero-aurora": "radial-gradient(circle at 15% 15%, var(--gradient-from), transparent 55%), radial-gradient(circle at 85% 10%, var(--gradient-via), transparent 60%), radial-gradient(circle at 50% 120%, var(--gradient-to), transparent 70%)",
      },
      boxShadow: {
        glow: "0 0 45px -10px rgba(99, 102, 241, 0.45)",
      },
      keyframes: {
        "marquee-left": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "marquee-right": {
          from: { transform: "translateX(-50%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        floaty: "floaty 8s ease-in-out infinite",
        aurora: "aurora 18s ease-in-out infinite",
        "marquee-left": "marquee-left 30s linear infinite",
        "marquee-right": "marquee-right 30s linear infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
`,
    },
    "/postcss.config.js": {
      code: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
    },
  };
};

const landingPageAddon = (analysis: PromptAnalysis): FileMap => ({
  "/src/components/Sections/Hero.tsx": {
    code: `import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const heroVariants = {
  float: {
    y: [0, -12, 0],
    transition: { repeat: Infinity, duration: 7, ease: "easeInOut" },
  },
  slide: {
    x: [0, 10, 0],
    transition: { repeat: Infinity, duration: 8, ease: "easeInOut" },
  },
  scale: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 6, ease: "easeInOut" },
  },
};

export function Hero() {
  const animation = heroVariants[siteConfig.animation] ?? heroVariants.slide;

  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden pt-28 pb-24 sm:pt-32"
    >
      <div className="absolute inset-x-0 top-0 -z-20 h-64 bg-gradient-to-b from-primary/25 via-background/0 to-background" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-hero-aurora opacity-70 blur-3xl"
        animate={animation}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-6 text-center">
        <Badge variant="outline" className="border-primary/60 bg-primary/10 text-primary">
          {siteConfig.hero.highlight}
        </Badge>
        <div className="space-y-6">
          <motion.h1
            className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              {siteConfig.hero.title}
            </span>
          </motion.h1>
          <motion.p
            className="mx-auto max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
          >
            {siteConfig.hero.subtitle}
          </motion.p>
        </div>
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <Button size="xl" className="group relative overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              {siteConfig.hero.primaryCta}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/80 via-accent/70 to-secondary/80 opacity-0 transition duration-500 group-hover:opacity-100" />
          </Button>
          <Button variant="outline" size="xl" className="group">
            <Play className="mr-2 h-4 w-4 fill-primary/40 text-primary" />
            {siteConfig.hero.secondaryCta}
          </Button>
        </motion.div>
        <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-4 text-left sm:grid-cols-4">
          {siteConfig.metrics.map((metric) => (
            <motion.div
              key={metric.label}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-border/60 bg-card/70 px-5 py-5 shadow-lg shadow-primary/5 backdrop-blur"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                {metric.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {metric.value}
              </p>
              <p className="mt-2 text-xs text-muted-foreground/70">{metric.helper}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
`
  },
  "/src/components/Sections/Features.tsx": {
    code: `import { motion } from "framer-motion";
import {
  BookOpen,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Leaf,
  LineChart,
  Palette,
  PenTool,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stars,
  Sun,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

const iconMap = {
  Sparkles,
  LineChart,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Truck,
  Palette,
  PenTool,
  Stars,
  HeartPulse,
  Sun,
  Leaf,
  TrendingUp,
  GraduationCap,
  Users,
  BookOpen,
};

type IconKey = keyof typeof iconMap;

export function Features() {
  return (
    <section id="features" className="relative">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 text-center">
        <div className="space-y-3">
          <h2 className="section-heading">Bénéfices clés</h2>
          <p className="section-subheading mx-auto">
            Nos composants modulaires combinent tokens Tailwind, interactions Framer Motion et design system shadcn-ui pour
            construire une expérience cohérente.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.features.map((feature, index) => {
            const Icon = iconMap[feature.icon as IconKey] ?? Sparkles;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-left">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <span className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary shadow-inner shadow-primary/20">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-2 text-left">
                      <CardTitle>{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
`
  },
  "/src/components/Sections/Testimonials.tsx": {
    code: `import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export function Testimonials() {
  return (
    <section id="testimonials" className="relative">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 text-center">
        <div className="space-y-3">
          <h2 className="section-heading">Ils racontent l'impact</h2>
          <p className="section-subheading mx-auto">
            Témoignages authentiques qui illustrent les résultats tangibles générés par {siteConfig.projectName}.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {siteConfig.testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="h-full text-left">
                <CardContent className="flex h-full flex-col gap-6">
                  <Quote className="h-8 w-8 text-primary" />
                  <p className="text-left text-base text-foreground">“{testimonial.quote}”</p>
                  <div className="text-left text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p>{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
`
  },
  "/src/components/Sections/Pricing.tsx": {
    code: `import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export function Pricing() {
  return (
    <section id="pricing" className="relative">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 text-center">
        <div className="space-y-3">
          <h2 className="section-heading">{siteConfig.pricing.headline}</h2>
          <p className="section-subheading mx-auto">
            Des offres pensées pour évoluer avec vos besoins sans compromis sur l'expérience.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {siteConfig.pricing.plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card
                className={plan.popular ? "border-primary/70 bg-card/80 shadow-xl shadow-primary/20" : ""}
              >
                <CardHeader className="space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    {plan.popular && <Badge variant="default">Populaire</Badge>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-left">
                    <span className="text-3xl font-semibold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="ml-2 text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-left">
                  {plan.benefits.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button variant={plan.popular ? "default" : "secondary"} className="w-full">
                    Choisir {plan.name}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
`
  },
  "/src/components/Sections/FAQ.tsx": {
    code: `import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="relative">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 text-center">
        <div className="space-y-3">
          <h2 className="section-heading">Questions fréquentes</h2>
          <p className="section-subheading mx-auto">
            Une base claire pour éclairer vos prospects. Adaptez les réponses selon les spécificités de votre offre.
          </p>
        </div>
        <div className="space-y-4 text-left">
          {siteConfig.faq.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <Card key={item.question} className="overflow-hidden">
                <button
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-base font-medium text-foreground"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  {item.question}
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isOpen ? "rotate-180 text-primary" : "text-muted-foreground",
                    )}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="px-6 pb-6 pt-0 text-sm text-muted-foreground">
                    {item.answer}
                  </CardContent>
                </motion.div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
`
  },
  "/src/components/Sections/CallToAction.tsx": {
    code: `import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";

export function CallToAction() {
  return (
    <section id="cta" className="relative">
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[2.5rem] border border-primary/30 bg-gradient-to-r from-primary/20 via-accent/10 to-secondary/20 opacity-90"
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="section-heading max-w-2xl text-balance text-foreground">
          {siteConfig.cta.title}
        </h2>
        <p className="section-subheading max-w-2xl text-balance">
          {siteConfig.cta.subtitle}
        </p>
        <Button size="xl" className="group">
          {siteConfig.cta.action}
          <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
        </Button>
      </div>
    </section>
  );
}
`
  },
  "/src/components/Sections/Footer.tsx": {
    code: `import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/40 bg-background/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 text-sm text-muted-foreground">
        <div className="flex flex-col gap-4 text-left sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">{siteConfig.projectName}</p>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{siteConfig.footer.blurb}</p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm">
            {siteConfig.footer.links.map((link) => (
              <a key={link.label} href={link.href} className="transition hover:text-primary">
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t border-border/40 pt-4 text-xs text-muted-foreground/80 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.projectName}. Tous droits réservés.</p>
          <p>{siteConfig.sector}</p>
        </div>
      </div>
    </footer>
  );
}
`
  },
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

export const createProjectPlan = (prompt: string, kind: ProjectKind): GenerationPlan => {
  const projectName = extractProjectName(prompt) ?? "Projet Généré";
  const audience = inferAudience(prompt);
  const tone = inferTone(prompt);
  const primaryObjective = (kind === "application"
    ? "mettre en scène un dashboard interactif"
    : "présenter l'offre");
  const structureSteps = buildStructureSteps(prompt, kind);
  const uiSteps = buildUiSteps(prompt);
  const qualitySteps = buildQualitySteps(kind);

  const sections: PlanSection[] = [
    {
      title: "Analyse du brief",
      objective: "Comprendre la demande et cadrer le périmètre de génération.",
      steps: [
        {
          id: "context",
          title: "Identifier le positionnement",
          description: `Public cible : ${audience}. Objectif : ${primaryObjective}.`,
          deliverable: "Résumé de brief",
        },
        {
          id: "naming",
          title: "Définir le nom du projet",
          description: `Utiliser « ${projectName} » pour les métadonnées et dossiers générés.`,
          deliverable: "Nom de dossier cohérent",
        },
      ],
    },
    {
      title: kind === "application" ? "Architecture de l'application" : "Structure de la page",
      objective: (kind === "application"
        ? "Mettre en place les vues clés et la navigation de l'app."
        : "Construire les sections de la landing page."),
      steps: structureSteps,
    },
    {
      title: "Interface & interactions",
      objective: "Assurer une expérience visuelle cohérente avec le brief.",
      steps: uiSteps,
    },
    {
      title: "Livrables et qualité",
      objective: "Garantir un projet exploitable immédiatement.",
      steps: qualitySteps,
    },
  ];

  return {
    title: kind === "application" ? "Plan de génération d'application" : "Plan de génération de site web",
    summary: `Préparer un projet React + Vite nommé « ${projectName} » avec un ${kind === "application" ? "dashboard interactif" : "site marketing"} en ${tone}.`,
    sections,
    successCriteria: [
      "Structure Vite complète avec entrée React fonctionnelle",
      (kind === "application"
        ? "Navigation avec au moins trois vues simulées"
        : "Hero + sections différenciées prêtes à personnaliser"),
      "Styles cohérents avec le ton identifié",
      "Instructions de prise en main rédigées",
    ],
    cautions: [
      "Vérifier les textes générés pour correspondre exactement au produit",
      "Compléter les intégrations backend manuellement si nécessaire",
    ],
  };
};

export const generateProjectFromPrompt = (
  prompt: string,
  kind: ProjectKind = "website",
): GeneratedProject => {
  const projectName = extractProjectName(prompt) ?? "Projet Généré";

  if (kind === "application") {
    const files = baseReactApp(projectName);
    const instructions = [
      `Projet React + Vite généré pour : ${projectName}.`,
      "Dashboard démo avec navigation simulée via React.useState (onglets + cartes analytics).",
      "Structure TypeScript prête à être branchée sur vos données métier.",
      "Ajoutez Tailwind/shadcn si besoin en reprenant la logique de tokens employée côté landing pages.",
    ].join("\n\n");

    return {
      projectName,
      files: mapToArray(files),
      instructions,
    };
  }

  const analysis = analyzePrompt(prompt, projectName);
  let files = baseReactVite(projectName, analysis);
  files = { ...files, ...landingPageAddon(analysis) };

  const activeSections = [
    "Hero",
    "Features",
    analysis.sections.showTestimonials ? "Testimonials" : undefined,
    analysis.sections.showPricing ? "Pricing" : undefined,
    analysis.sections.showFaq ? "FAQ" : undefined,
    analysis.sections.showCta ? "CTA" : undefined,
    "Footer",
  ].filter(Boolean) as string[];

  const instructions = [
    `Stack : React 18 + Vite + TypeScript avec Tailwind CSS, composants shadcn-ui (Button/Card/Badge), Framer Motion et icônes lucide-react.`,
    `Brief interprété : ${analysis.sector} en ${analysis.tone}. Palette activée : ${analysis.paletteName} (primaire ${analysis.palette.primary} / accent ${analysis.palette.accent}).`,
    `Typographie variable premium via ${analysis.font.package}. Ajustez la signature typographique ou les graisses dans src/styles/globals.css (variables --font-*) et dans siteConfig.font.`,
    `Tokens de couleur et dégradés définis dans src/styles/globals.css (variables CSS) puis réexposés dans tailwind.config.ts pour l'auto-complétion Tailwind.`,
    `Contenu piloté par src/config/site.ts : héro, métriques, features, témoignages, plans, FAQ et CTA. Modifiez la palette, la copy ou désactivez une section via siteConfig.sections (actuelles : ${activeSections.join(", ")}).`,
    `Animations Framer Motion configurées sur le preset “${analysis.motion}”. Changez l'ambiance en éditant siteConfig.animation (float | slide | scale) ou en ajustant les props motion dans chaque section.`,
    `Composants UI réutilisables dans src/components/ui et sections modulaires dans src/components/Sections/*.tsx — libre à vous d'étendre le design system shadcn avec de nouveaux patterns.`,
    `Scripts Tailwind fournis : npm run tailwind:init pour générer la config et npm run tailwind:build pour compiler le CSS en watch.`,
  ].join("\n\n");

  return {
    projectName,
    files: mapToArray(files),
    instructions,
  };
};
