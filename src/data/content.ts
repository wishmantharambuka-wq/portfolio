/* ==========================================================================
 *  SINGLE SOURCE OF TRUTH for every word on this site.
 *
 *  This file holds the DEFAULTS that ship in the bundle. At runtime the app
 *  layers two optional overrides on top (see src/lib/contentStore.tsx):
 *
 *    1. defaults (this file)         — always present, instant, no network
 *    2. /content.json                — what visitors see, if you publish one
 *    3. localStorage draft           — your unpublished admin edits
 *
 *  You can edit this file by hand, but you don't have to: the admin panel at
 *  #/admin edits everything here and exports a content.json for you.
 * ========================================================================== */

/* ----------------------------- types ----------------------------------- */

export type Metric = { label: string; value: string };

export type Project = {
  id: string;
  title: string;
  year: string;
  blurb: string;
  problem: string;
  approach: string;
  outcome: string;
  stack: string[];
  metrics: Metric[];
  live: string;
  repo: string;
  status: 'live' | 'wip' | 'draft';
  /** Thumbnail path, e.g. '/assets/projects/dehiwala.jpg'. Blank = generated. */
  image: string;
};

export type DesignPiece = {
  id: string;
  title: string;
  kind: string;
  year: string;
  note: string;
  image: string;
  hue: number;
};

export type SkillGroup = {
  id: string;
  label: string;
  accent: 'ds' | 'gis' | 'gfx';
  items: { name: string; level: number }[];
};

export type EducationItem = {
  id: string;
  degree: string;
  org: string;
  period: string;
  note: string;
};

export type CvEntry = {
  id: string;
  title: string;
  org: string;
  period: string;
  detail: string;
  bullets: string[];
};

export type Cv = {
  fullName: string;
  headline: string;
  summary: string;
  education: CvEntry[];
  experience: CvEntry[];
  achievements: string[];
  languages: { name: string; level: string }[];
  interests: string[];
  referees: string;
  /** Path to a pre-made PDF, e.g. '/assets/Chamod-CV.pdf'. Blank = print dialog. */
  pdfUrl: string;
  /** Pull project entries straight from the portfolio so the CV never drifts. */
  featuredProjectIds: string[];
};

export type CareerPath = {
  id: string;
  /** Displayed as the big "01." numeral. */
  no: string;
  title: string;
  subtitle: string;
  body: string;
  accent: 'ds' | 'gis' | 'gfx';
  /** Anchor to scroll to when the card is clicked. */
  target: string;
};

export type Content = {
  /** Bumped when the shape changes so stale drafts can be migrated. */
  version: number;

  /**
   * Optional image slots. Empty string = use the built-in coded fallback,
   * which is the permanent default. Drop files into public/assets/ and set
   * the path here (or in the admin panel) to override.
   */
  assets: {
    /** Photographic texture shown *inside* the hero letterforms. */
    heroTexture: string;
    /** Hanging lamp graphic for the Career Paths section. */
    lamp: string;
    /**
     * The cover "specimen" — a cut-out subject that interleaves with the
     * display type (in front of the top word, behind the bottom one).
     * Transparent PNG. Blank = coded fallback.
     */
    heroSubject: string;
  };

  /** The hero cover lockup. */
  hero: {
    /** Micro-tracked label above the wordmark. */
    label: string;
    /** Top line of the stacked display word. */
    wordTop: string;
    /** Bottom line, rendered as outline. */
    wordBottom: string;
    /** Badge text beside the year, e.g. "Curriculum Vitae". */
    badge: string;
    /** Small text left of the name plate. */
    yearRange: string;
    /** Text inside the inverted plate. */
    plateName: string;
    /** Three short lines beside the vertical rule. */
    roleLines: string[];
  };

  careerPaths: CareerPath[];
  profile: {
    name: string;
    shortName: string;
    roles: string[];
    tagline: string;
    location: string;
    intro: string;
    seeking: string;
    education: EducationItem[];
  };
  links: {
    email: string;
    emailAlt: string;
    phone: string;
    whatsapp: string;
    github: string;
    linkedin: string;
    behance: string;
  };
  sectionCopy: {
    about: { title: string; lede: string };
    dataScience: { title: string; lede: string };
    gis: { title: string; lede: string };
    design: { title: string; lede: string };
    skills: { title: string; lede: string };
    contact: { title: string; lede: string };
  };
  dataScience: Project[];
  gis: Project[];
  design: DesignPiece[];
  skills: SkillGroup[];
  cv: Cv;
};

export const CONTENT_VERSION = 1;

/* ---------------------------- defaults ---------------------------------- */

export const defaultContent: Content = {
  version: CONTENT_VERSION,

  // Empty = coded fallback. See public/assets/README.md for the filenames.
  assets: {
    heroTexture: '',
    lamp: '',
    heroSubject: '',
  },

  hero: {
    label: 'Chamod Wismantha',
    wordTop: 'PORT',
    wordBottom: 'FOLIO',
    badge: 'Curriculum Vitae',
    yearRange: '2026',
    plateName: 'P. A. CHAMOD WISMANTHA SENEVIRATHNA',
    roleLines: ['DATA SCIENTIST', '& URBAN', 'INFORMATICS'],
  },

  careerPaths: [
    {
      id: 'path-ds',
      no: '01',
      title: 'Data Science',
      subtitle: 'The destination',
      body: 'Forecasting, modelling and statistical analysis. The craft I am building a career on — turning a messy table into a defensible decision.',
      accent: 'ds',
      target: 'data-science',
    },
    {
      id: 'path-gis',
      no: '02',
      title: 'Informatics & GIS',
      subtitle: 'The foundation',
      body: 'Urban informatics and spatial analysis. My degree, and the lens that taught me to read a city as a dataset rather than a picture.',
      accent: 'gis',
      target: 'gis',
    },
    {
      id: 'path-design',
      no: '03',
      title: 'Design',
      subtitle: 'The multiplier',
      body: 'Graphic and information design. The oldest skill I have, and the reason my analysis gets read instead of filed.',
      accent: 'gfx',
      target: 'design',
    },
  ],

  profile: {
    name: 'Chamod Wismantha',
    shortName: 'Chamod',
    roles: ['Data Scientist', 'Geospatial Analyst', 'Graphic Designer'],
    tagline: 'I turn spatial and urban data into decisions people can act on.',
    location: 'Colombo, Sri Lanka',
    intro: `I am an Urban Informatics & Planning undergraduate at the University of Moratuwa,
reading in parallel for an HND in AI & Data Science. Urban informatics taught me to read a city
as a dataset — flows, densities, gradients, inequities. Data science is where I want to spend my
career: the modelling, the forecasting, the part where a messy table becomes a defensible decision.
GIS is my native language for spatial problems, and a long-standing habit of graphic design means
I can make the result legible to people who will never open a notebook.`,
    seeking: 'Open to data science internships, graduate roles, and geospatial analytics work.',
    education: [
      {
        id: 'edu-bsc',
        degree: 'BSc (Hons) Urban Informatics & Planning',
        org: 'University of Moratuwa',
        period: 'Undergraduate — in progress',
        note: 'Spatial analysis, urban systems modelling, planning theory, remote sensing.',
      },
      {
        id: 'edu-hnd',
        degree: 'HND in Artificial Intelligence & Data Science',
        org: 'Parallel study',
        period: 'In progress',
        note: 'Machine learning, statistics, Python data stack, applied AI.',
      },
    ],
  },

  links: {
    email: 'uni.chamod27@gmail.com',
    emailAlt: 'wishmantha.rambuka@gmail.com',
    phone: '+94 77 470 5048',
    whatsapp: '94774705048',
    github: 'https://github.com/wishmantharambuka-wq',
    linkedin: 'https://www.linkedin.com/in/chamod-wismantha-senevirathna',
    behance: '',
  },

  sectionCopy: {
    about: {
      title: 'Reading the city as a dataset.',
      lede: '',
    },
    dataScience: {
      title: 'Models that answer a real question.',
      lede: "Forecasting, spatial regression, decision analysis. Urban informatics gives me the domain; data science is the craft I'm building a career on. Every project below starts from a question somebody actually needed answered.",
    },
    gis: {
      title: 'Shipped spatial tools people can open.',
      lede: "Three live projects, all built as static sites so anyone can use them without a GIS licence. Spatial analysis is only useful once it leaves the analyst's machine.",
    },
    design: {
      title: 'The part that makes the rest readable.',
      lede: 'Design is the oldest skill I have and the reason my analysis gets read. Identity systems, information design, layout — and increasingly, the interfaces my own data tools live in.',
    },
    skills: {
      title: 'What I actually work in.',
      lede: 'Honest levels, not a wall of logos. The bars say where I am today — the ones that matter most to me are the ones still climbing.',
    },
    contact: {
      title: "Let's build something with the data.",
      lede: '',
    },
  },

  /* ---- 1. DATA SCIENCE (priority) --------------------------------------- *
   * The first entry is real, shipped work. The ones after it are still
   * SCAFFOLDS with placeholder numbers — replace them as projects land.
   * ---------------------------------------------------------------------- */
  dataScience: [
    {
      id: 'ds-passenger-survey',
      title: 'Passenger Behaviour Survey — Multi-Device Field Platform',
      year: '2026',
      blurb:
        'A live pedestrian-flow survey platform that several surveyors join with a PIN and record into one shared dataset.',
      problem:
        'Pedestrian and passenger counts are usually collected on paper or in one person’s spreadsheet ' +
        'and reconciled days later — so transcription errors surface too late to fix, and nobody can see ' +
        'coverage while the count is still running. A multi-surveyor count needs one shared, live dataset.',
      approach:
        'Built a project-based web app: an organiser creates a survey project and shares a server PIN, ' +
        'field surveyors join from any device with that PIN, and every observation writes to a shared ' +
        'Postgres store over Supabase realtime so all devices stay in sync. Separate organiser and ' +
        'enumerator roles keep survey configuration apart from data collection.',
      outcome:
        'Turns a scattered manual count into a single live dataset that is analysis-ready the moment ' +
        'fieldwork ends — no transcription step, no reconciliation pass. Deployed and usable in the field.',
      stack: ['Next.js', 'React', 'Supabase', 'PostgreSQL', 'Realtime sync', 'Vercel'],
      metrics: [
        { label: 'Surveyors', value: 'Multi-device' },
        { label: 'Sync', value: 'Realtime' },
        { label: 'Join via', value: 'Server PIN' },
      ],
      live: 'https://passenger-survey-plum.vercel.app/',
      repo: '',
      status: 'live',
      image: '',
    },
    {
      id: 'ds-crop-forecast',
      title: 'National Crop Supply Forecasting',
      year: '2026',
      blurb: 'Five-month ahead demand–supply forecasting for Sri Lankan staple crops.',
      problem:
        'Sri Lanka reacts to food shortages after prices spike. The question: can district-level ' +
        'production, weather and historical yield data predict a shortfall early enough to act?',
      approach:
        'Assembled district-level yield and cultivated-area series, joined weather covariates ' +
        '(rainfall, soil moisture, temperature), and compared a seasonal baseline against gradient ' +
        'boosted trees and a time-series model for a five-month horizon.',
      outcome:
        'Forecast surfaces feed the AgriFlow dashboard as an early-warning layer across 331 ' +
        'district subdivisions. Replace this line with your real accuracy numbers.',
      stack: ['Python', 'pandas', 'scikit-learn', 'XGBoost', 'statsmodels', 'Plotly'],
      metrics: [
        { label: 'Horizon', value: '5 months' },
        { label: 'Regions', value: '331' },
        { label: 'MAPE', value: '— %' },
      ],
      live: 'https://slagri.netlify.app/',
      repo: '',
      status: 'wip',
      image: '',
    },
    {
      id: 'ds-multicriteria',
      title: 'Multi-Criteria Decision Analysis Tool',
      year: '2026',
      blurb: 'A Python tool that ranks spatial alternatives under weighted, conflicting criteria.',
      problem:
        'Planning decisions rarely have one objective. Siting a facility trades accessibility ' +
        'against cost against environmental load — and the weighting is a political choice, not a ' +
        'technical one. Analysts needed to see how the ranking moves as weights move.',
      approach:
        'Implemented weighted-sum and AHP-style pairwise scoring over a normalised criteria matrix, ' +
        'with sensitivity analysis that re-ranks alternatives as weights are perturbed.',
      outcome:
        'Turns an argument about preferences into a visible, reproducible ranking. Used as a ' +
        'decision-support step ahead of spatial suitability mapping.',
      stack: ['Python', 'NumPy', 'pandas', 'MCDA / AHP'],
      metrics: [],
      live: '',
      repo: 'https://github.com/wishmantharambuka-wq/multicriteria',
      status: 'live',
      image: '',
    },
    {
      id: 'ds-urban-heat',
      title: 'Urban Heat Island Regression',
      year: '2026',
      blurb: 'Modelling land-surface temperature against built form and green cover.',
      problem:
        'Which physical characteristics of a neighbourhood actually drive its temperature — ' +
        'built density, surface material, canopy cover, or distance to water?',
      approach:
        'Derived land-surface temperature and NDVI from Landsat imagery, built a feature set from ' +
        'building footprints and land use, then fitted OLS and spatial regression models to test ' +
        'whether effects hold once spatial autocorrelation is accounted for.',
      outcome:
        'Quantifies the cooling return per unit of added canopy — the number a planner needs to ' +
        'justify a greening budget. Replace with your coefficients and R².',
      stack: ['Python', 'GeoPandas', 'rasterio', 'scikit-learn', 'PySAL', 'Google Earth Engine'],
      metrics: [
        { label: 'Source', value: 'Landsat 8/9' },
        { label: 'R²', value: '—' },
      ],
      live: '',
      repo: '',
      status: 'draft',
      image: '',
    },
    {
      id: 'ds-mobility',
      title: 'Accessibility & Mobility Analysis',
      year: '2026',
      blurb: 'Who can actually reach services within 15 minutes — and who cannot.',
      problem:
        'The "15-minute city" is easy to say and hard to measure. For a real Sri Lankan urban area, ' +
        'what share of residents reach healthcare, schools and markets inside that window?',
      approach:
        'Built a routable street network, computed isochrones from population centroids, and ' +
        'intersected reachable areas with service point locations to produce per-population coverage.',
      outcome:
        'A deprivation map that names specific underserved pockets rather than a city-wide average.',
      stack: ['Python', 'OSMnx', 'NetworkX', 'GeoPandas', 'QGIS'],
      metrics: [],
      live: '',
      repo: '',
      status: 'draft',
      image: '',
    },
  ],

  /* ---- 2. GIS — real, shipped ------------------------------------------ */
  gis: [
    {
      id: 'gis-dehiwala',
      title: 'Dehiwala Spatial Intelligence Dashboard',
      year: '2026',
      blurb: 'A 3D spatial intelligence dashboard for the Dehiwala urban area.',
      problem:
        'Municipal spatial data sits in files nobody outside the GIS unit can open. The goal was a ' +
        'browser-native 3D view of Dehiwala that a planner or a councillor could actually navigate.',
      approach:
        'Built an interactive 3D dashboard in TypeScript — layered urban geometry, indicator panels ' +
        'and camera-driven exploration, served entirely as a static site so it needs no GIS licence.',
      outcome:
        'The most technically ambitious thing I have shipped: spatial analysis rendered as something ' +
        'a non-specialist can explore in a browser tab.',
      stack: ['TypeScript', '3D Web / WebGL', 'GeoJSON', 'QGIS', 'Spatial analysis'],
      metrics: [],
      live: 'https://wishmantharambuka-wq.github.io/DehiwalaDashboard/',
      repo: 'https://github.com/wishmantharambuka-wq/DehiwalaDashboard',
      status: 'live',
      image: '',
    },
    {
      id: 'gis-agriflow',
      title: 'AgriFlow — National Agriculture Intelligence',
      year: '2026',
      blurb: 'Island-wide agricultural monitoring, forecasting and market intelligence platform.',
      problem:
        'A childhood idea: farmers grow without knowing demand, buyers import what is already in ' +
        'surplus, and nobody sees the national picture until it is a crisis.',
      approach:
        'Built a national dashboard over 331 district subdivisions — cultivated area tracking, ' +
        'provincial stock distribution, agri-weather layers, a five-month supply forecast, and ' +
        'separate portals for farmers, buyers and administrators with live buyer-request matching.',
      outcome:
        '450k hectares monitored, with export-market intelligence for Ceylon tea, cinnamon, pepper ' +
        'and pineapple. The project that convinced me data work is what I want to do.',
      stack: ['HTML/CSS/JS', 'GIS mapping', 'Data visualisation', 'Forecasting', 'Weather APIs'],
      metrics: [
        { label: 'Subdivisions', value: '331' },
        { label: 'Area tracked', value: '450k ha' },
        { label: 'Forecast', value: '5 months' },
      ],
      live: 'https://slagri.netlify.app/',
      repo: 'https://github.com/wishmantharambuka-wq/slagri',
      status: 'live',
      image: '',
    },
    {
      id: 'gis-greenuom',
      title: 'UoM GreenMap — Campus Digital Arboretum',
      year: '2025',
      blurb: 'Mapping every tree on the University of Moratuwa campus as an environmental asset.',
      problem:
        'Campus trees are treated as scenery. They are actually infrastructure — cooling, filtering, ' +
        'absorbing stormwater. Nobody had counted them or valued what they do.',
      approach:
        'Field-surveyed tree height and diameter at breast height, built a digital arboretum with an ' +
        'eco-dashboard converting the inventory into environmental metrics, plus guided campus tours.',
      outcome:
        'My first real project — beginner-level code, but the framing holds up: green cover as a ' +
        'distributed network of measurable assets, not decoration.',
      stack: ['HTML/CSS/JS', 'Field survey', 'Data visualisation', 'Urban ecology'],
      metrics: [],
      live: 'https://wishmantharambuka-wq.github.io/Green-UOM/',
      repo: 'https://github.com/wishmantharambuka-wq/Green-UOM',
      status: 'live',
      image: '',
    },
  ],

  /* ---- 3. DESIGN -------------------------------------------------------- */
  design: [
    {
      id: 'gfx-brand',
      title: 'Brand Identity Systems',
      kind: 'Identity',
      year: '2021 — now',
      note: 'Logos, marks and the rules that keep them consistent across every surface.',
      image: '',
      hue: 265,
    },
    {
      id: 'gfx-dataviz',
      title: 'Data Visualisation & Infographics',
      kind: 'Information design',
      year: '2023 — now',
      note: 'Where the design skill and the data skill stop being separate things.',
      image: '',
      hue: 175,
    },
    {
      id: 'gfx-poster',
      title: 'Poster & Campaign Work',
      kind: 'Print / Social',
      year: '2020 — now',
      note: 'Event and campaign graphics — composition, type hierarchy, colour discipline.',
      image: '',
      hue: 30,
    },
    {
      id: 'gfx-ui',
      title: 'UI & Product Surfaces',
      kind: 'Digital',
      year: '2024 — now',
      note: 'Interface design for my own dashboards — this site included.',
      image: '',
      hue: 210,
    },
    {
      id: 'gfx-editorial',
      title: 'Editorial & Report Layout',
      kind: 'Layout',
      year: '2022 — now',
      note: 'Long-form documents and planning reports that people finish reading.',
      image: '',
      hue: 320,
    },
    {
      id: 'gfx-motion',
      title: 'Motion & 3D Graphics',
      kind: 'Motion',
      year: '2024 — now',
      note: 'Short-form motion and 3D scenes — the discipline behind this portfolio.',
      image: '',
      hue: 145,
    },
  ],

  /* ---- SKILLS ----------------------------------------------------------- */
  skills: [
    {
      id: 'data-science',
      label: 'Data Science & ML',
      accent: 'ds',
      items: [
        { name: 'Python', level: 0.85 },
        { name: 'pandas / NumPy', level: 0.85 },
        { name: 'scikit-learn', level: 0.7 },
        { name: 'Statistics & regression', level: 0.75 },
        { name: 'SQL', level: 0.7 },
        { name: 'Data visualisation', level: 0.9 },
        { name: 'Time series forecasting', level: 0.6 },
        { name: 'Machine learning', level: 0.65 },
      ],
    },
    {
      id: 'geospatial',
      label: 'Geospatial & GIS',
      accent: 'gis',
      items: [
        { name: 'QGIS', level: 0.9 },
        { name: 'Spatial analysis', level: 0.85 },
        { name: 'GeoPandas', level: 0.75 },
        { name: 'Remote sensing', level: 0.65 },
        { name: 'Cartography', level: 0.85 },
        { name: 'Urban informatics', level: 0.8 },
        { name: 'Web mapping', level: 0.75 },
      ],
    },
    {
      id: 'design',
      label: 'Design & Front-end',
      accent: 'gfx',
      items: [
        { name: 'Graphic design', level: 0.95 },
        { name: 'Brand identity', level: 0.85 },
        { name: 'Typography & layout', level: 0.85 },
        { name: 'UI / UX design', level: 0.75 },
        { name: 'HTML / CSS / JS', level: 0.75 },
        { name: 'TypeScript', level: 0.6 },
        { name: '3D / WebGL', level: 0.6 },
      ],
    },
  ],

  /* ---- CV --------------------------------------------------------------- */
  cv: {
    fullName: 'P. A. Chamod Wismantha Senevirathna',
    headline: 'Urban Informatics & Planning Undergraduate · Aspiring Data Scientist',
    summary: `Urban Informatics & Planning undergraduate at the University of Moratuwa, reading in
parallel for an HND in Artificial Intelligence & Data Science. I build analytical tools that make
spatial and urban data usable — from a national agricultural intelligence platform to a 3D municipal
dashboard. Strongest in Python data work, QGIS and spatial analysis, backed by several years of
professional-standard graphic design. Seeking a data science internship or graduate role where
spatial reasoning is an asset.`,

    education: [
      {
        id: 'cv-edu-1',
        title: 'BSc (Hons) in Urban Informatics and Planning',
        org: 'University of Moratuwa, Sri Lanka',
        period: 'Undergraduate — in progress',
        detail: 'Faculty of Architecture, Department of Town & Country Planning',
        bullets: [
          'Spatial analysis, GIS and remote sensing',
          'Urban systems modelling and planning theory',
          'Data-driven planning, statistics and research methods',
        ],
      },
      {
        id: 'cv-edu-2',
        title: 'Higher National Diploma in Artificial Intelligence & Data Science',
        org: 'Parallel study',
        period: 'In progress',
        detail: '',
        bullets: [
          'Machine learning, applied statistics and the Python data stack',
          'Data engineering fundamentals and model evaluation',
        ],
      },
      {
        id: 'cv-edu-3',
        title: 'G.C.E. Advanced Level — Physical Science Stream',
        org: '',
        period: '',
        detail: 'Results: B, B, C',
        bullets: [],
      },
      {
        id: 'cv-edu-4',
        title: 'G.C.E. Ordinary Level',
        org: '',
        period: '',
        detail: 'Results: 9 A passes (A9)',
        bullets: [],
      },
    ],

    experience: [
      {
        id: 'cv-exp-1',
        title: 'Freelance Graphic Designer',
        org: 'Independent',
        period: '2020 — present',
        detail: 'Brand identity, information design, print and digital campaign work.',
        bullets: [
          'Designed identity systems, campaign graphics and editorial layouts for clients and university projects',
          'Produced data visualisations and infographics that translate analysis for non-technical audiences',
        ],
      },
    ],

    achievements: [
      'Built and shipped three public web platforms for spatial and agricultural analysis',
      'Nine A passes at G.C.E. Ordinary Level',
    ],

    languages: [
      { name: 'Sinhala', level: 'Native' },
      { name: 'English', level: 'Professional working proficiency' },
    ],

    interests: [
      'Urban data and smart-city analytics',
      'Open-source GIS',
      'Generative and 3D design',
    ],

    referees: 'Available on request.',
    pdfUrl: '',

    // Which portfolio projects appear on the CV — kept in sync automatically.
    featuredProjectIds: [
      'gis-agriflow',
      'ds-passenger-survey',
      'gis-dehiwala',
      'ds-multicriteria',
      'gis-greenuom',
    ],
  },
};
