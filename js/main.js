/**
 * DUVVA SAI VIVEK - PORTFOLIO INTERACTION CONTROLLER
 * Clean, lightweight, professional engineering portfolio logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. PROJECT DATA STORE
  const projectsData = {
    scholarium: {
      title: "Scholarium — AI-Powered Adaptive Learning Platform",
      category: "Full-Stack AI Platform",
      metric: "Gemini 2.0 Flash + Claude Fallback",
      tags: ["React 18", "Django REST Framework", "React Flow (DAG)", "PostgreSQL", "MongoDB", "JWT Auth"],
      overview: "A full-stack adaptive education platform delivering personalized learning roadmaps structured as Directed Acyclic Graphs (DAGs) using prompt caching and hybrid database storage.",
      highlights: [
        "Architected personalized DAG-based learning roadmaps via LLM prompt engineering with Gemini 2.0 Flash, integrating Anthropic Claude as a reliable fallback.",
        "Built a hybrid persistence layer: PostgreSQL for relational state management alongside MongoDB for LLM response caching and token telemetry.",
        "Implemented MD5-hashed prompt caching to eliminate redundant API calls and reduce latency.",
        "Engineered an assessment engine featuring binary-scored MCQs and session-level analytics to identify knowledge gaps.",
        "Developed RESTful APIs with Django REST Framework & JWT, serving a React 18 SPA with React Flow visualizations."
      ],
      github: "https://github.com/duvvasaivivek/Scholarium"
    },
    civility: {
      title: "Civility.ai — Multimodal AI Toxicity Moderation Platform",
      category: "Multimodal AI Safety",
      metric: "Top 6 / 240+ Finalist (Agentica 2.0)",
      tags: ["PyTorch", "Multimodal Classifier", "FastAPI Inference", "Content Safety"],
      overview: "An AI content moderation platform designed to classify and flag toxic text and multimedia in online environments, developed collaboratively with Team ByteBuilders at Agentica 2.0.",
      highlights: [
        "Co-developed Civility.ai during Agentica 2.0 at IIIT Sricity, reaching the offline Grand Finale and securing 6th place out of 240+ competing teams nationwide.",
        "Worked in a fast-paced hackathon setting under Team ByteBuilders to architect the end-to-end toxicity moderation workflow.",
        "Engineered data preprocessing and classification pipelines to process text and multimodal inputs.",
        "Integrated the model inference API with the real-time demonstration dashboard for evaluation by technical judges."
      ],
      github: "https://github.com/duvvasaivivek"
    },
    connectiq: {
      title: "Connect IQ — AI-Powered Professional Networking Platform",
      category: "AI Matchmaking System",
      metric: "Devfest 5.0 (BITS Goa)",
      tags: ["Vector Embeddings", "Semantic Matchmaking", "Cosine Similarity", "Streamlit UI"],
      overview: "An AI networking platform developed at Devfest 5.0 (BITS Goa) leveraging Large Language Models to compute professional compatibility and opportunity scores.",
      highlights: [
        "Architected vector and LLM-based profile analysis to match software engineers and researchers with open opportunities.",
        "Created an automated Opportunity Scoring algorithm quantifying alignment between candidate profiles and project requirements.",
        "Built an interactive interface for real-time recommendation updates."
      ],
      github: "https://github.com/duvvasaivivek/AI-Powered-Networking-System"
    },
    safeswipe: {
      title: "SafeSwipe — Fraud Transaction Detection System",
      category: "Machine Learning & Fraud Detection",
      metric: "Elevate Labs Internship",
      tags: ["XGBoost", "Scikit-Learn (LOF)", "Class-Imbalance Tuning", "Financial Risk Modeling"],
      overview: "A production-grade fraud transaction identification system engineered at Elevate Labs to detect unauthorized financial transactions across highly imbalanced datasets.",
      highlights: [
        "Engineered a dual-model approach combining supervised classification (XGBoost) with unsupervised anomaly detection (Local Outlier Factor).",
        "Handled extreme class imbalance with precision-focused metrics and threshold tuning to control false-positive rates.",
        "Deployed an interactive Streamlit live dashboard for real-time transaction scoring."
      ],
      github: "https://github.com/duvvasaivivek/SafeSwipe-Fraud-Transaction-Detection-System"
    },
    lecturelens: {
      title: "Lecture-Lens — Audio Lecture Voice-to-Notes Generator",
      category: "Speech Processing & NLP",
      metric: "IBM SkillsBuild Internship",
      tags: ["Speech Recognition", "Chunked Audio Pipeline", "Structured Note Extraction", "Evaluation Benchmarks"],
      overview: "An automated lecture processing pipeline developed during the IBM SkillsBuild internship to transform spoken lectures into structured, exam-ready study notes.",
      highlights: [
        "Constructed a multi-stage pipeline combining speech-to-text transcription, NLP text chunking, and Generative AI summarization.",
        "Benchmarked and tuned 5+ parameters (chunk overlap, temperature, token limits) for transcription fidelity.",
        "Generated instant topic breakdowns, key formulas, and review cheat sheets from raw audio."
      ],
      github: "https://github.com/duvvasaivivek/AI-Powered-Lecture-Voice-To-Notes-Generation-System"
    },
    skilldrift: {
      title: "Skill Drift Monitor — Industry Skill Gap Analyzer",
      category: "Data Science & NLP Analytics",
      metric: "Hackxios 2K25 (IIIT Bhopal)",
      tags: ["Job Market Web Scraping", "Curriculum Gap Scoring", "Time-Series Analysis", "Data Visualization"],
      overview: "An NLP pipeline built during Hackxios 2K25 (IIIT Bhopal) analyzing real-world tech job postings against university syllabi.",
      highlights: [
        "Analyzed time-series NLP patterns across 100+ industry job postings and academic curricula.",
        "Modeled temporal trends to quantify discrepancies between curriculum content and active market demands.",
        "Delivered actionable insights through an interactive Streamlit interface."
      ],
      github: "https://github.com/duvvasaivivek/Skill-Drift-Monitor"
    },
    campushustle: {
      title: "Campus Hustle — 2D Unity Action Game",
      category: "Game Development & Physics",
      metric: "GDG Open Source Hackathon",
      tags: ["Unity Engine", "C# Scripting", "2D Physics Engine", "State-Driven Animation"],
      overview: "A fast-paced 2D runner game built under hackathon time constraints for the GDG Open Source Hackathon at IIITDM Kurnool.",
      highlights: [
        "Engineered smooth physics-driven player controller, jump mechanics, dynamic obstacles, and multi-tier health systems.",
        "Coordinated codebase integration via Git within a multi-member hackathon team."
      ],
      github: "https://github.com/duvvasaivivek/Campus-Hustle"
    },
    aignite: {
      title: "AIgnite Order Assistant — Gemini Flash RAG Chatbot",
      category: "Conversational AI & Workflows",
      metric: "AIgnite 2.0 Grand Finale",
      tags: ["Gemini Flash API", "RAG Knowledge Base", "Order Workflow Automation", "Conversation State Machine"],
      overview: "A specialized conversational assistant developed during AIgnite 2.0 at GPREC to support food delivery order tracking workflows.",
      highlights: [
        "Integrated Gemini Flash with Retrieval-Augmented Generation (RAG) to provide contextual answers on order placement, preparation, and delivery progress.",
        "Reduced repetitive inquiries through accurate and immediate conversational guidance."
      ],
      github: "https://github.com/duvvasaivivek/VAMY-Chatbot"
    }
  };

  // 2. HEADER SCROLL & NAVIGATION
  const header = document.querySelector('.header');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  function onScroll() {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    let scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // 3. MOBILE MENU
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // 4. 2D / 3D MODE TOGGLE
  const modeToggleBtn = document.getElementById('modeToggleBtn');
  if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
      if (window.Portfolio3D) {
        window.Portfolio3D.toggle();
        const active = window.Portfolio3D.isActive();
        showToast(active ? "3D Experience Enabled" : "2D Clean Mode Active");
      }
    });
  }

  // 4.5 IMAGE FALLBACK CONTROLLER
  const mediaWrapImgs = document.querySelectorAll('.card-media-wrap img');
  mediaWrapImgs.forEach(img => {
    function handleFail() {
      img.classList.add('img-failed');
      const placeholder = img.parentElement ? img.parentElement.querySelector('.media-placeholder') : null;
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    }
    img.addEventListener('error', handleFail);
    if (img.complete && img.naturalWidth === 0) {
      handleFail();
    }
  });

  // 4.8 CHRONOLOGICAL STREAM TIMELINE & SLIDE-OUT DETAIL DRAWER
  const milestonesData = {
    1: {
      id: 1,
      pin: '#01',
      date: 'Late 2024',
      category: 'hackathon',
      catLabel: '🏆 Hackathon',
      catClass: 'cat-hackathon-text',
      title: 'GDG Open Source Hackathon',
      subtitle: 'Team SpriteVRM • Campus Hustle',
      org: 'GDG On Campus • Online',
      img: './Images/hackathons/gdg.jpeg',
      desc: 'Architected and programmed Campus Hustle, an endless 2D runner built in Unity and C#. Engineered dynamic procedural obstacle generation, responsive player physics, and high-performance WebGL browser compilation for cross-platform gameplay.',
      impact: 'Tested and played by university students across campus during the GDG event with smooth 60 FPS in-browser execution.',
      tags: ['Unity', 'C#', 'Game Dev', 'WebGL', 'Physics Engine'],
      link: 'https://github.com/duvvasaivivek/Campus-Hustle',
      linkText: 'View GitHub Repository'
    },
    2: {
      id: 2,
      pin: '#02',
      date: 'Late 2024 – Early 2025',
      category: 'hackathon',
      catLabel: '📜 Certification',
      catClass: 'cat-cert-text',
      title: 'Foundations & Engineering Track',
      subtitle: 'Modern C++, OOP & Git Specializations',
      org: 'Udemy & Independent Study',
      img: './Images/hackathons/certifications.jpeg',
      desc: 'Completed comprehensive engineering certifications covering Modern C++ (C++11/14/17), Object-Oriented Design patterns, memory management, and professional Git/GitHub collaborative branching workflows.',
      impact: 'Established the core systems and algorithmic foundations that power subsequent AI pipelines, ML architectures, and full-stack software development.',
      tags: ['Modern C++', 'OOP', 'Data Structures', 'Git & GitHub', 'Linux'],
      link: 'https://github.com/duvvasaivivek',
      linkText: 'Verified Profile'
    },
    3: {
      id: 3,
      pin: '#03',
      date: 'Early 2025',
      category: 'hackathon',
      catLabel: '🏆 Grand Finale',
      catClass: 'cat-hackathon-text',
      title: 'AIgnite 2.0 — Grand Finale',
      subtitle: 'Team ApexVAMY • Conversational Order Assistant',
      org: 'GPREC Campus • Offline Stage',
      img: './Images/hackathons/aignite.jpeg',
      desc: 'Developed an intelligent conversational order assistant utilizing Gemini Flash and Retrieval-Augmented Generation (RAG). Built real-time order tracking, dynamic food menu query resolution, and live customer interaction via FastAPI endpoints.',
      impact: 'Selected as offline grand finalists, demonstrating real-time low latency multimodal query handling on the live finale stage.',
      tags: ['Gemini Flash', 'RAG', 'LangChain', 'FastAPI', 'Python'],
      link: 'https://github.com/duvvasaivivek/AI-Powered-Automated-Food-Ordering-System',
      linkText: 'View GitHub Repository'
    },
    4: {
      id: 4,
      pin: '#04',
      date: 'Mid 2025',
      category: 'hackathon',
      catLabel: '🏆 Hackathon',
      catClass: 'cat-hackathon-text',
      title: 'Devfest 5.0 — BITS Goa',
      subtitle: 'Team Void Walkers • Connect IQ',
      org: 'BITS Goa • Online',
      img: './Images/projects/connectiq.jpeg',
      desc: 'Engineered Connect IQ, a talent matchmaking platform that extracts developer skill vectors and compares them with active open-source and hackathon technical projects using Sentence Transformers and cosine similarity.',
      impact: 'Automated compatibility scoring and opportunity discovery with an interactive Streamlit UI for real-time developer portfolio matching.',
      tags: ['Sentence Transformers', 'Embeddings', 'Streamlit', 'Cosine Similarity', 'Python'],
      link: 'https://github.com/duvvasaivivek/Connect-IQ',
      linkText: 'View GitHub Repository'
    },
    5: {
      id: 5,
      pin: '#05',
      date: 'Mid 2025',
      category: 'hackathon',
      catLabel: '🏆 Hackathon',
      catClass: 'cat-hackathon-text',
      title: 'Hackxios 2K25 — IIIT Bhopal',
      subtitle: 'Team Core Cube • Skill Drift Monitor',
      org: 'IIIT Bhopal • Online',
      img: './Images/hackathons/hackxios.jpeg',
      desc: 'Built Skill Drift Monitor with Team Core Cube. The system automatically scrapes and parses 100+ live tech job listings across developer portals, compares them against college course syllabi, and identifies curriculum drift.',
      impact: 'Generates structured gap reports and actionable skill-up pathways for engineering students seeking industry alignment.',
      tags: ['NLP Extraction', 'Web Scraping', 'Skill Mining', 'Python', 'Streamlit'],
      link: 'https://github.com/duvvasaivivek/Skill-Drift-Monitor',
      linkText: 'View GitHub Repository'
    },
    6: {
      id: 6,
      pin: '#06',
      date: 'Oct – Dec 2025',
      category: 'internship',
      catLabel: '💼 ML Internship',
      catClass: 'cat-internship-text',
      title: 'Machine Learning Intern',
      subtitle: 'Elevate Labs • SafeSwipe Fraud Detection',
      org: 'Elevate Labs • Remote',
      img: './Images/projects/safeswipe.jpeg',
      desc: 'Constructed a dual-stage transaction risk evaluation system on imbalanced banking records, combining gradient-boosted decision trees (XGBoost) for supervised fraud scoring with density-based outlier detection (Local Outlier Factor) for zero-day attack vectors.',
      impact: 'Achieved high precision-recall balance on severely imbalanced datasets with real-time risk classification API and interactive monitoring dashboard.',
      tags: ['XGBoost', 'Local Outlier Factor', 'Imbalance Handling', 'Scikit-Learn', 'FastAPI'],
      link: 'https://github.com/duvvasaivivek/SafeSwipe-Fraud-Transaction-Detection-System',
      linkText: 'View GitHub Repository'
    },
    7: {
      id: 7,
      pin: '#07',
      date: 'Nov 2025 – Jan 2026',
      category: 'internship',
      catLabel: '💼 AI Internship',
      catClass: 'cat-internship-text',
      title: 'AI Intern — Literature Synthesizer',
      subtitle: 'Infosys Springboard • Research Summarizer',
      org: 'Infosys Springboard • Remote',
      img: './Images/projects/scholarium.jpeg',
      desc: 'Engineered an automated research literature analysis pipeline to parse dense academic publications, extract core methodologies, formulas, and findings, and synthesize them into structured executive briefs.',
      impact: 'Accelerated literature review workflows for academic researchers by ~60% with high citation accuracy.',
      tags: ['Document Parsing', 'NLP Summaries', 'PDF Miner', 'Python', 'FastAPI'],
      link: 'https://github.com/duvvasaivivek/AI-System-To-Automatically-Review-And-Summarize-Research-Papers',
      linkText: 'View GitHub Repository'
    },
    8: {
      id: 8,
      pin: '#08',
      date: 'Dec 2025 – Jan 2026',
      category: 'internship',
      catLabel: '💼 AI/ML Internship',
      catClass: 'cat-internship-text',
      title: 'AI/ML Intern — Lecture-Lens',
      subtitle: 'IBM SkillsBuild • Audio Intelligence & Study Assistant',
      org: 'IBM SkillsBuild • Remote',
      img: './Images/projects/lecturelens.jpeg',
      desc: 'Developed an automated voice-to-notes processing engine that transcribes recorded lectures, isolates key mathematical formulas, and generates revision questions. Calibrated context windows and chunk overlaps to optimize factual fidelity.',
      impact: 'Enabled students to generate comprehensive revision guides and self-assessment flashcards from 60-minute audio lectures in under 2 minutes.',
      tags: ['Speech-to-Text', 'Prompt Engineering', 'Quiz Generation', 'Python', 'RAG'],
      link: 'https://github.com/duvvasaivivek/AI-Powered-Lecture-Voice-To-Notes-Generation-System',
      linkText: 'View GitHub Repository'
    },
    9: {
      id: 9,
      pin: '#09',
      date: 'Jan 2026',
      category: 'hackathon',
      catLabel: '🏆 National Podium Finish',
      catClass: 'cat-hackathon-text',
      title: 'Agentica 2.0 — 6th Place National',
      subtitle: '6th Place out of 240+ Teams • Civility.ai',
      org: 'IIIT Sricity • Offline Grand Finale',
      img: './Images/hackathons/agentica.jpeg',
      desc: 'Architected Civility.ai with Team ByteBuilders, an AI toxicity moderation platform for online gaming channels and web communities. Selected as one of the national finalist teams to pitch live on stage at the IIIT Sricity campus.',
      impact: 'Podium finish (6th Place out of 240+ nationwide engineering teams), recognized for real-time sub-100ms inference on toxic streaming text.',
      tags: ['PyTorch', 'HuggingFace', 'Toxicity ML', 'FastAPI', 'React'],
      link: 'https://github.com/duvvasaivivek/Civility.ai',
      linkText: 'View GitHub Repository'
    },
    10: {
      id: 10,
      pin: '#10',
      date: '2025 – Present',
      category: 'leadership',
      catLabel: '🌟 Campus Leadership',
      catClass: 'cat-leadership-text',
      title: 'Treasurer — National Service Scheme (NSS)',
      subtitle: 'Executive Finance & Logistics Officer',
      org: 'IIITDM Kurnool Chapter',
      img: './Images/leadership/nss2.jpeg',
      desc: 'Directing financial planning, budget allocations, and transparent expense accounting for university-wide social welfare programs. Spearheading budgeting and logistics for campus blood donation drives, cleanliness campaigns, and educational outreach to rural schools.',
      impact: 'Successfully allocated and audited funds across 15+ university social impact drives impacting hundreds of beneficiaries.',
      tags: ['Financial Planning', 'Budgeting', 'Operations', 'Leadership', 'Social Welfare'],
      link: '#contact',
      linkText: 'Contact Vivek'
    },
    11: {
      id: 11,
      pin: '#11',
      date: '2025 – Present',
      category: 'leadership',
      catLabel: '🌟 Club Leadership',
      catClass: 'cat-leadership-text',
      title: 'Coordinator — Novella: The Reading Club',
      subtitle: 'Literary Circles & Campus Reading Culture',
      org: 'IIITDM Kurnool',
      img: './Images/leadership/novella_club.jpeg',
      desc: 'Organizing and leading weekly book reading circles, literary review sessions, and open discussion forums to foster a rich reading culture among university students. Curating library recommendations, organizing campus reading marathons, and managing student engagement across batches.',
      impact: 'Built an active student reading community with weekly peer-led discussion roundtables.',
      tags: ['Event Curation', 'Literary Discussions', 'Student Engagement', 'Campus Outreach'],
      link: '#contact',
      linkText: 'Contact Vivek'
    }
  };

  let currentMilestoneId = 1;
  const milestoneDrawer = document.getElementById('milestoneDrawer');
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const drawerPin = document.getElementById('drawerPin');
  const drawerDate = document.getElementById('drawerDate');
  const drawerCatBadge = document.getElementById('drawerCatBadge');
  const drawerOrg = document.getElementById('drawerOrg');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerSubtitle = document.getElementById('drawerSubtitle');
  const drawerDesc = document.getElementById('drawerDesc');
  const drawerImpactBox = document.getElementById('drawerImpactBox');
  const drawerTags = document.getElementById('drawerTags');
  const drawerActionBtn = document.getElementById('drawerActionBtn');
  const drawerPrevBtn = document.getElementById('drawerPrevBtn');
  const drawerNextBtn = document.getElementById('drawerNextBtn');
  const drawerCounter = document.getElementById('drawerCounter');
  const drawerImg = document.getElementById('drawerImg');

  window.openMilestoneDrawer = function (id) {
    const data = milestonesData[id];
    if (!data || !milestoneDrawer) return;

    currentMilestoneId = Number(id);

    if (drawerPin) drawerPin.textContent = data.pin;
    if (drawerDate) drawerDate.textContent = data.date;
    if (drawerCatBadge) {
      drawerCatBadge.textContent = data.catLabel;
      drawerCatBadge.className = 'drawer-cat-badge ' + (data.catClass || '');
    }
    if (drawerOrg) drawerOrg.textContent = data.org;
    if (drawerTitle) drawerTitle.textContent = data.title;
    if (drawerSubtitle) drawerSubtitle.textContent = data.subtitle;
    if (drawerDesc) drawerDesc.textContent = data.desc;
    if (drawerImpactBox) {
      drawerImpactBox.innerHTML = '<strong>Key Impact:</strong> ' + data.impact;
    }
    if (drawerTags) {
      drawerTags.innerHTML = data.tags.map(t => `<span class="tech-tag">${t}</span>`).join('');
    }
    if (drawerActionBtn) {
      drawerActionBtn.href = data.link;
      drawerActionBtn.textContent = (data.linkText || 'View Project') + ' →';
    }
    if (drawerCounter) {
      drawerCounter.textContent = `${currentMilestoneId} of 11`;
    }
    if (drawerPrevBtn) {
      drawerPrevBtn.disabled = currentMilestoneId <= 1;
    }
    if (drawerNextBtn) {
      drawerNextBtn.disabled = currentMilestoneId >= 11;
    }

    if (drawerImg) {
      drawerImg.src = data.img;
      drawerImg.alt = data.title;
      drawerImg.onerror = function () {
        if (!this.src.endsWith('.jpg')) {
          this.src = data.img.replace('.jpeg', '.jpg');
        } else {
          this.src = './Images/vivek_portrait.jpg';
        }
      };
    }

    milestoneDrawer.classList.add('open');
    milestoneDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  window.closeMilestoneDrawer = function () {
    if (!milestoneDrawer) return;
    milestoneDrawer.classList.remove('open');
    milestoneDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', window.closeMilestoneDrawer);
  }
  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', window.closeMilestoneDrawer);
  }

  if (drawerPrevBtn) {
    drawerPrevBtn.addEventListener('click', () => {
      if (currentMilestoneId > 1) {
        window.openMilestoneDrawer(currentMilestoneId - 1);
      }
    });
  }

  if (drawerNextBtn) {
    drawerNextBtn.addEventListener('click', () => {
      if (currentMilestoneId < 11) {
        window.openMilestoneDrawer(currentMilestoneId + 1);
      }
    });
  }

  // Node Click and Keyboard Listeners
  document.querySelectorAll('.stream-node').forEach(node => {
    node.addEventListener('click', () => {
      const id = node.getAttribute('data-milestone-id');
      if (id) window.openMilestoneDrawer(id);
    });
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = node.getAttribute('data-milestone-id');
        if (id) window.openMilestoneDrawer(id);
      }
    });
  });

  // ESC key to close drawer
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeMilestoneDrawer();
    }
  });

  // Filter Chips for Stream Timeline
  const roadmapChips = document.querySelectorAll('.roadmap-filter-chip');
  const streamNodes = document.querySelectorAll('.stream-node');

  window.filterRoadmap = function (category) {
    const cleanCat = (category || 'all').toLowerCase();

    roadmapChips.forEach(chip => {
      const chipFilter = (chip.getAttribute('data-filter') || '').toLowerCase();
      const isActive = chipFilter === cleanCat ||
        (cleanCat === 'internships' && chipFilter === 'internship') ||
        (cleanCat === 'hackathons' && chipFilter === 'hackathon');
      chip.classList.toggle('active', isActive);
    });

    streamNodes.forEach(node => {
      const nodeCat = (node.getAttribute('data-category') || '').toLowerCase();
      if (cleanCat === 'all' || cleanCat === '') {
        node.classList.remove('dimmed', 'highlighted');
      } else if (nodeCat === cleanCat ||
        (cleanCat === 'internships' && nodeCat === 'internship') ||
        (cleanCat === 'hackathons' && nodeCat === 'hackathon')) {
        node.classList.remove('dimmed');
        node.classList.add('highlighted');
      } else {
        node.classList.remove('highlighted');
        node.classList.add('dimmed');
      }
    });
  };

  roadmapChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.getAttribute('data-filter');
      window.filterRoadmap(filter);
    });
  });

  // Deep-link interceptor for #internships, #hackathons, #leadership, #experience
  function handleJourneyHash() {
    const rawHash = window.location.hash.replace('#', '').toLowerCase();
    let filter = null;
    if (rawHash === 'internships' || rawHash === 'internship') filter = 'internship';
    else if (rawHash === 'hackathons' || rawHash === 'hackathon') filter = 'hackathon';
    else if (rawHash === 'leadership') filter = 'leadership';
    else if (rawHash === 'experience') filter = 'all';

    if (filter !== null) {
      window.filterRoadmap(filter);
      const hub = document.getElementById('experience');
      if (hub && rawHash !== 'experience') {
        setTimeout(() => {
          hub.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      }
    }
  }

  window.addEventListener('hashchange', handleJourneyHash);
  if (window.location.hash) {
    handleJourneyHash();
  }

  // Intercept anchor clicks
  document.querySelectorAll('a[href="#internships"], a[href="#hackathons"], a[href="#leadership"]').forEach(a => {
    a.addEventListener('click', () => {
      const target = a.getAttribute('href').replace('#', '').toLowerCase();
      window.filterRoadmap(target);
    });
  });

  // 5. PROJECT DETAILS MODAL
  const projectModal = document.getElementById('projectModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBody = document.getElementById('modalBody');

  window.openProjectModal = function (projectId) {
    const data = projectsData[projectId];
    if (!data || !projectModal || !modalBody) return;

    modalBody.innerHTML = `
      <div style="margin-bottom: 14px;">
        <span class="project-category-tag">${data.category}</span>
        <span class="project-metric-badge" style="margin-left: 8px;">${data.metric}</span>
      </div>
      <h2 style="font-size: 1.55rem; margin-bottom: 12px; color: #fff;">${data.title}</h2>
      <p style="color: var(--text-secondary); line-height: 1.65; font-size: 0.96rem; margin-bottom: 20px;">${data.overview}</p>
      
      <h4 style="font-size: 1.02rem; color: var(--accent); margin-bottom: 10px; font-weight: 700;">System Implementation Details</h4>
      <ul style="margin-bottom: 22px; padding-left: 20px; list-style-type: disc; color: var(--text-secondary); font-size: 0.92rem; line-height: 1.65;">
        ${data.highlights.map(h => `<li style="margin-bottom: 6px;">${h}</li>`).join('')}
      </ul>

      <h4 style="font-size: 0.95rem; color: #fff; margin-bottom: 10px; font-weight: 700;">Tech Stack</h4>
      <div class="project-tech-stack" style="margin-bottom: 26px;">
        ${data.tags.map(t => `<span class="tech-tag">${t}</span>`).join('')}
      </div>

      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="${data.github}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          GitHub Repository
        </a>
        <button class="btn btn-outline btn-sm" onclick="closeAllModals()">Close</button>
      </div>
    `;

    projectModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeAllModals = function () {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  };

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', window.closeAllModals);
  }

  // 7. RESUME MODAL
  const resumeModal = document.getElementById('resumeModal');
  const previewResumeBtn = document.getElementById('previewResumeBtn');
  const resumeModalCloseBtn = document.getElementById('resumeModalCloseBtn');

  if (previewResumeBtn && resumeModal) {
    previewResumeBtn.addEventListener('click', () => {
      resumeModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (resumeModalCloseBtn && resumeModal) {
    resumeModalCloseBtn.addEventListener('click', () => {
      resumeModal.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  document.querySelectorAll('.modal-backdrop').forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) window.closeAllModals();
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') window.closeAllModals();
  });

  // 8. CONTACT FORM
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('senderName')?.value.trim();
      const email = document.getElementById('senderEmail')?.value.trim();
      const subject = document.getElementById('msgSubject')?.value.trim();
      const message = document.getElementById('msgBody')?.value.trim();

      if (!name || !email || !message) {
        showToast("Please fill in required fields.");
        return;
      }

      showToast("Opening email client to dispatch message...");
      const mailto = `mailto:duvvasaivivek@gmail.com?subject=${encodeURIComponent(subject || 'Inquiry from ' + name)}&body=${encodeURIComponent('From: ' + name + ' (' + email + ')\n\n' + message)}`;
      window.location.href = mailto;
      contactForm.reset();
    });
  }

  // 9. COPY CLIPBOARD HELPER
  window.copyText = function (text, label) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`${label} copied to clipboard`);
      });
    }
  };

  // 10. TOAST
  let toastTimer;
  window.showToast = function (msg) {
    let toast = document.getElementById('siteToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'siteToast';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  };

  // 11. BACK TO TOP
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
});
