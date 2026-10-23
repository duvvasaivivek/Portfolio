/**
 * Single source of truth for detail content used by the dialogs and the 3D scenes.
 * The summaries printed in index.html are canonical for the page; this file is
 * canonical for the drawer and dialog detail.
 */

export const projectsData = {
  civility: {
    title: 'Civility.ai',
    category: 'Multimodal AI safety',
    metric: 'Agentica 2.0, IIIT Sricity · 6th of 240+ teams',
    tags: ['PyTorch', 'Hugging Face Transformers', 'FastAPI', 'React'],
    overview: 'A content moderation platform that classifies and flags toxic text and images for online communities, developed with Team ByteBuilders at Agentica 2.0.',
    highlights: [
      'Reached the offline grand finale at IIIT Sricity and placed 6th of 240+ competing teams nationally.',
      'Designed the end-to-end moderation workflow from input preprocessing to classification and flag review.',
      'Built preprocessing and classification pipelines for text and multimodal inputs.',
      'Connected the inference API to a live demonstration dashboard used during judging.'
    ],
    github: null
  },
  scholarium: {
    title: 'Scholarium',
    category: 'Full-stack AI platform',
    metric: 'Independent project · Gemini 2.0 Flash with Claude fallback',
    tags: ['React 18', 'Django REST Framework', 'React Flow', 'PostgreSQL', 'MongoDB', 'JWT'],
    overview: 'An adaptive education platform that delivers personalised learning roadmaps structured as directed acyclic graphs, with prompt caching and hybrid storage.',
    highlights: [
      'Generates DAG-based learning roadmaps through prompt engineering with Gemini 2.0 Flash, with Anthropic Claude as the fallback model.',
      'Uses PostgreSQL for relational state and MongoDB for LLM response caching and token telemetry.',
      'Caches prompts by MD5 hash to avoid redundant API calls and reduce latency.',
      'Includes an assessment engine with binary-scored multiple-choice questions and session analytics to surface knowledge gaps.',
      'Serves a React 18 single-page application through Django REST Framework APIs with JWT authentication.'
    ],
    github: 'https://github.com/duvvasaivivek/Scholarium'
  },
  safeswipe: {
    title: 'SafeSwipe',
    category: 'Machine learning and fraud detection',
    metric: 'Machine Learning Intern, Elevate Labs · Oct–Dec 2025',
    tags: ['XGBoost', 'Scikit-Learn', 'Local Outlier Factor', 'Streamlit', 'FastAPI'],
    overview: 'A fraud-detection system built at Elevate Labs to flag unauthorised transactions in highly imbalanced data.',
    highlights: [
      'Combines supervised classification (XGBoost) with unsupervised anomaly detection (Local Outlier Factor).',
      'Handles extreme class imbalance with precision-focused metrics and decision-threshold tuning to control false positives.',
      'Exposes transaction scores through an API and an interactive Streamlit dashboard.'
    ],
    github: 'https://github.com/duvvasaivivek/SafeSwipe-Fraud-Transaction-Detection-System'
  },
  lecturelens: {
    title: 'Lecture-Lens',
    category: 'Speech processing and NLP',
    metric: 'AI/ML Intern, IBM SkillsBuild · Dec 2025–Jan 2026',
    tags: ['Speech-to-text', 'Chunked audio pipeline', 'Generative summarisation', 'Python'],
    overview: 'A lecture processing pipeline developed during the IBM SkillsBuild internship to turn spoken lectures into structured study notes.',
    highlights: [
      'Multi-stage pipeline: speech-to-text transcription, text chunking, and generative summarisation.',
      'Tuned chunk overlap, temperature, and token limits against transcription fidelity.',
      'Produces topic breakdowns, key formulas, and review questions from raw audio.'
    ],
    github: 'https://github.com/duvvasaivivek/AI-Powered-Lecture-Voice-To-Notes-Generation-System'
  },
  connectiq: {
    title: 'Connect IQ',
    category: 'Semantic matching',
    metric: 'Devfest 5.0, BITS Goa',
    tags: ['Sentence Transformers', 'Embeddings', 'Cosine similarity', 'Streamlit'],
    overview: 'A networking platform developed at Devfest 5.0 that scores compatibility between developer profiles and open opportunities.',
    highlights: [
      'Extracts skill vectors from profiles and compares them with project requirements using sentence embeddings.',
      'Computes an opportunity score that quantifies alignment between a candidate and a project.',
      'Presents recommendations in an interactive Streamlit interface.'
    ],
    github: 'https://github.com/duvvasaivivek/AI-Powered-Networking-System'
  },
  skilldrift: {
    title: 'Skill Drift Monitor',
    category: 'Data analysis and NLP',
    metric: 'Hackxios 2K25, IIIT Bhopal',
    tags: ['Web scraping', 'NLP extraction', 'Time-series analysis', 'Streamlit'],
    overview: 'An analysis tool built at Hackxios 2K25 that compares live technology job postings with university syllabi.',
    highlights: [
      'Scrapes and parses 100+ job listings and extracts the skills they require.',
      'Models how demand shifts over time and quantifies gaps against course content.',
      'Reports gaps and suggested skill paths through a Streamlit interface.'
    ],
    github: 'https://github.com/duvvasaivivek/Skill-Drift-Monitor'
  },
  aignite: {
    title: 'AIgnite Order Assistant',
    category: 'Conversational AI',
    metric: 'AIgnite 2.0, GPREC · offline grand finale',
    tags: ['Gemini Flash', 'RAG', 'LangChain', 'FastAPI'],
    overview: 'A conversational assistant developed at AIgnite 2.0 to answer questions about food orders and track their progress.',
    highlights: [
      'Combines Gemini Flash with retrieval-augmented generation over a menu and order knowledge base.',
      'Handles order placement, preparation, and delivery queries through FastAPI endpoints.',
      'Demonstrated live on stage at the offline grand finale.'
    ],
    github: 'https://github.com/duvvasaivivek/VAMY-Chatbot'
  },
  campushustle: {
    title: 'Campus Hustle',
    category: 'Game development',
    metric: 'GDG Open Source Hackathon, IIITDM Kurnool',
    tags: ['Unity', 'C#', '2D physics', 'WebGL'],
    overview: 'A 2D runner game built under hackathon time constraints at the GDG Open Source Hackathon.',
    highlights: [
      'Physics-driven player controller, jump mechanics, procedural obstacles, and a multi-tier health system.',
      'Compiled to WebGL so it runs in the browser.',
      'Coordinated a multi-member codebase through Git during the event.'
    ],
    github: 'https://github.com/duvvasaivivek/Campus-Hustle'
  }
};

export const milestonesData = {
  1: {
    id: 1,
    year: 2024,
    date: 'Late 2024',
    category: 'Hackathon',
    title: 'GDG Open Source Hackathon',
    subtitle: 'Team SpriteVRM · Campus Hustle',
    org: 'GDG On Campus · Online',
    img: './Images/hackathons/gdg.jpeg',
    desc: 'Programmed Campus Hustle, an endless 2D runner built in Unity and C#, with procedural obstacle generation, responsive player physics, and a WebGL build for the browser.',
    impact: 'Compiled to WebGL and played in the browser by students at the GDG event.',
    tags: ['Unity', 'C#', 'WebGL', '2D physics'],
    link: 'https://github.com/duvvasaivivek/Campus-Hustle'
  },
  2: {
    id: 2,
    year: 2025,
    date: 'Early 2025',
    category: 'Hackathon finale',
    title: 'AIgnite 2.0 Grand Finale',
    subtitle: 'Team ApexVAMY · Conversational order assistant',
    org: 'GPREC · Offline finale',
    img: null,
    desc: 'Developed a conversational order assistant using Gemini Flash and retrieval-augmented generation, with order tracking, menu query resolution, and FastAPI endpoints.',
    impact: 'Selected for the offline grand finale at GPREC; demonstrated live order-tracking queries on stage.',
    tags: ['Gemini Flash', 'RAG', 'LangChain', 'FastAPI', 'Python'],
    link: 'https://github.com/duvvasaivivek/VAMY-Chatbot'
  },
  3: {
    id: 3,
    year: 2025,
    date: 'Mid 2025',
    category: 'Hackathon',
    title: 'Devfest 5.0, BITS Goa',
    subtitle: 'Team Void Walkers · Connect IQ',
    org: 'BITS Goa · Online',
    img: './Images/projects/connectiq.jpeg',
    desc: 'Built Connect IQ, a matching platform that extracts developer skill vectors and compares them with open-source and hackathon projects using Sentence Transformers and cosine similarity.',
    impact: 'Automated compatibility scoring and opportunity discovery through an interactive Streamlit interface.',
    tags: ['Sentence Transformers', 'Embeddings', 'Streamlit', 'Python'],
    link: 'https://github.com/duvvasaivivek/AI-Powered-Networking-System'
  },
  4: {
    id: 4,
    year: 2025,
    date: 'Mid 2025',
    category: 'Hackathon',
    title: 'Hackxios 2K25, IIIT Bhopal',
    subtitle: 'Team Core Cube · Skill Drift Monitor',
    org: 'IIIT Bhopal · Online',
    img: './Images/hackathons/hackxios.jpeg',
    desc: 'Built Skill Drift Monitor, which scrapes and parses 100+ live technology job listings, compares them with course syllabi, and identifies curriculum drift.',
    impact: 'Produces structured gap reports and suggested skill paths for engineering students.',
    tags: ['NLP extraction', 'Web scraping', 'Python', 'Streamlit'],
    link: 'https://github.com/duvvasaivivek/Skill-Drift-Monitor'
  },
  5: {
    id: 5,
    year: 2025,
    date: 'Oct–Dec 2025',
    category: 'Internship',
    title: 'Machine Learning Intern, Elevate Labs',
    subtitle: 'SafeSwipe fraud detection',
    org: 'Elevate Labs · Remote',
    img: null,
    desc: 'Built a two-stage transaction risk system on imbalanced banking records, combining gradient-boosted trees (XGBoost) for supervised fraud scoring with density-based outlier detection (Local Outlier Factor) for unseen patterns.',
    impact: 'Tuned decision thresholds for precision on a severely imbalanced dataset; exposed scores through an API and a monitoring dashboard.',
    tags: ['XGBoost', 'Local Outlier Factor', 'Scikit-Learn', 'FastAPI'],
    link: 'https://github.com/duvvasaivivek/SafeSwipe-Fraud-Transaction-Detection-System'
  },
  6: {
    id: 6,
    year: 2025,
    date: 'Nov 2025–Jan 2026',
    category: 'Internship',
    title: 'AI Intern, Infosys Springboard',
    subtitle: 'Research literature synthesizer',
    org: 'Infosys Springboard · Remote',
    img: null,
    desc: 'Built an automated literature analysis pipeline that parses academic publications, extracts core methods, formulas, and findings, and synthesises them into structured briefs.',
    impact: 'Produces structured briefs (methods, formulas, findings) from academic PDFs; evaluated on a sample set of papers.',
    tags: ['Document parsing', 'NLP summarisation', 'Python', 'FastAPI'],
    link: 'https://github.com/duvvasaivivek/AI-System-To-Automatically-Review-And-Summarize-Research-Papers'
  },
  7: {
    id: 7,
    year: 2025,
    date: 'Dec 2025–Jan 2026',
    category: 'Internship',
    title: 'AI/ML Intern, IBM SkillsBuild',
    subtitle: 'Lecture-Lens audio study assistant',
    org: 'IBM SkillsBuild · Remote',
    img: null,
    desc: 'Developed a voice-to-notes engine that transcribes recorded lectures, isolates key formulas, and generates revision questions, calibrating context windows and chunk overlaps for factual fidelity.',
    impact: 'Generates revision notes and self-assessment questions from hour-long lecture recordings.',
    tags: ['Speech-to-text', 'Prompt engineering', 'Python', 'RAG'],
    link: 'https://github.com/duvvasaivivek/AI-Powered-Lecture-Voice-To-Notes-Generation-System'
  },
  8: {
    id: 8,
    year: 2026,
    date: 'Jan 2026',
    category: 'Hackathon · 6th of 240+',
    title: 'Agentica 2.0, IIIT Sricity',
    subtitle: 'Team ByteBuilders · Civility.ai',
    org: 'IIIT Sricity · Offline grand finale',
    img: './Images/hackathons/agentica.jpeg',
    desc: 'Built Civility.ai with Team ByteBuilders, a toxicity moderation platform for gaming channels and web communities, and pitched it live on stage as a national finalist team.',
    impact: 'Placed 6th of 240+ teams nationally at the offline grand finale, IIIT Sricity.',
    tags: ['PyTorch', 'Hugging Face', 'FastAPI', 'React'],
    link: null
  }
};

export const MILESTONE_COUNT = 8;

/** Project ids in page order (order of significance), used by the 3D scenes. */
export const projectOrder = ['civility', 'scholarium', 'safeswipe', 'lecturelens', 'connectiq', 'skilldrift', 'aignite', 'campushustle'];

/**
 * Architecture layers drawn by the Projects scene, top layer first. These are a regrouping
 * of each project's tags and highlights above; they introduce no new claims.
 */
export const architectureData = {
  civility: [
    { layer: 'Interface', items: ['React moderation dashboard'] },
    { layer: 'Service', items: ['FastAPI inference service'] },
    { layer: 'Model', items: ['PyTorch', 'Hugging Face Transformers'] },
    { layer: 'Data', items: ['Text and image inputs', 'Preprocessing'] }
  ],
  scholarium: [
    { layer: 'Interface', items: ['React 18', 'React Flow roadmaps'] },
    { layer: 'Service', items: ['Django REST Framework', 'JWT authentication'] },
    { layer: 'Model', items: ['Gemini 2.0 Flash', 'Claude fallback', 'MD5-keyed prompt cache'] },
    { layer: 'Data', items: ['PostgreSQL', 'MongoDB'] }
  ],
  safeswipe: [
    { layer: 'Interface', items: ['Streamlit dashboard'] },
    { layer: 'Service', items: ['FastAPI scoring API'] },
    { layer: 'Model', items: ['XGBoost', 'Local Outlier Factor', 'Threshold tuning'] },
    { layer: 'Data', items: ['Imbalanced transaction records'] }
  ],
  lecturelens: [
    { layer: 'Output', items: ['Topic notes', 'Key formulas', 'Review questions'] },
    { layer: 'Model', items: ['Generative summarisation'] },
    { layer: 'Pipeline', items: ['Speech-to-text', 'Text chunking'] },
    { layer: 'Input', items: ['Lecture audio'] }
  ],
  connectiq: [
    { layer: 'Interface', items: ['Streamlit'] },
    { layer: 'Model', items: ['Sentence Transformers embeddings', 'Cosine similarity scoring'] },
    { layer: 'Data', items: ['Developer profiles', 'Project requirements'] }
  ],
  skilldrift: [
    { layer: 'Interface', items: ['Streamlit gap reports'] },
    { layer: 'Analysis', items: ['NLP skill extraction', 'Time-series analysis'] },
    { layer: 'Data', items: ['100+ scraped job listings', 'Course syllabi'] }
  ],
  aignite: [
    { layer: 'Service', items: ['FastAPI endpoints'] },
    { layer: 'Model', items: ['Gemini Flash', 'LangChain RAG'] },
    { layer: 'Data', items: ['Menu and order knowledge base'] }
  ],
  campushustle: [
    { layer: 'Build', items: ['WebGL'] },
    { layer: 'Engine', items: ['Unity', 'C#'] },
    { layer: 'Systems', items: ['2D physics', 'Procedural obstacles', 'Health system'] }
  ]
};

/** Venues drawn on the About globe. Online events are marked as such. */
export const placesData = [
  { id: 'kurnool', name: 'Kurnool', lat: 15.83, lon: 78.04, note: 'IIITDM Kurnool; AIgnite 2.0 finale at GPREC' },
  { id: 'sricity', name: 'Sri City', lat: 13.56, lon: 80.03, note: 'Agentica 2.0 offline finale, IIIT Sricity' },
  { id: 'goa', name: 'Goa', lat: 15.39, lon: 73.88, note: 'Devfest 5.0, BITS Goa (online event)' },
  { id: 'bhopal', name: 'Bhopal', lat: 23.26, lon: 77.41, note: 'Hackxios 2K25, IIIT Bhopal (online event)' }
];

export const skillsData = {
  groups: [
    {
      id: 'lang',
      label: 'Languages',
      items: [
        { id: 'python', label: 'Python', projects: ['scholarium', 'civility', 'safeswipe', 'lecturelens', 'connectiq', 'skilldrift', 'aignite'] },
        { id: 'c', label: 'C', projects: [] },
        { id: 'cpp', label: 'C++', projects: [] },
        { id: 'csharp', label: 'C#', projects: ['campushustle'] },
        { id: 'js', label: 'JavaScript', projects: ['scholarium', 'civility'] },
        { id: 'sql', label: 'SQL', projects: ['scholarium'] }
      ]
    },
    {
      id: 'ai',
      label: 'AI and machine learning',
      items: [
        { id: 'pytorch', label: 'PyTorch', projects: ['civility'] },
        { id: 'sklearn', label: 'Scikit-Learn', projects: ['safeswipe'] },
        { id: 'xgboost', label: 'XGBoost', projects: ['safeswipe'] },
        { id: 'nlp', label: 'NLP and text processing', projects: ['lecturelens', 'skilldrift', 'connectiq'] },
        { id: 'rag', label: 'RAG architectures', projects: ['aignite', 'scholarium'] },
        { id: 'anomaly', label: 'Anomaly detection', projects: ['safeswipe'] }
      ]
    },
    {
      id: 'web',
      label: 'Frameworks and web',
      items: [
        { id: 'django', label: 'Django REST Framework', projects: ['scholarium'] },
        { id: 'react', label: 'React 18', projects: ['scholarium', 'civility'] },
        { id: 'streamlit', label: 'Streamlit', projects: ['safeswipe', 'connectiq', 'skilldrift'] },
        { id: 'reactflow', label: 'React Flow', projects: ['scholarium'] },
        { id: 'unity', label: 'Unity', projects: ['campushustle'] }
      ]
    },
    {
      id: 'data',
      label: 'Data and tools',
      items: [
        { id: 'numpy', label: 'NumPy', projects: ['safeswipe', 'skilldrift'] },
        { id: 'pandas', label: 'pandas', projects: ['safeswipe', 'skilldrift'] },
        { id: 'postgres', label: 'PostgreSQL', projects: ['scholarium'] },
        { id: 'mongodb', label: 'MongoDB', projects: ['scholarium'] },
        { id: 'git', label: 'Git and GitHub', projects: [] },
        { id: 'matplotlib', label: 'Matplotlib and Seaborn', projects: ['skilldrift'] }
      ]
    }
  ]
};
