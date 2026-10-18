/**
 * DUVVA SAI VIVEK - PORTFOLIO INTERACTION CONTROLLER
 * Clean, lightweight, professional engineering portfolio logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. PROJECT DATA STORE
  const projectsData = {
    scholarium: {
      title: "Scholarium — AI-Powered Adaptive Learning Platform",
      category: "Full-Stack AI",
      metric: "DAG-Based Roadmaps | Gemini 2.0 Flash + Claude",
      tags: ["React 18", "Django REST Framework", "PostgreSQL", "MongoDB", "Gemini 2.0 Flash", "Anthropic Claude", "React Flow DAG", "JWT", "Gunicorn"],
      overview: "A full-stack generative AI education platform delivering personalized learning roadmaps structured as Directed Acyclic Graphs (DAGs) using prompt engineering and hybrid database caching.",
      highlights: [
        "Architected personalized DAG-based learning roadmaps via LLM prompt engineering with Gemini 2.0 Flash, integrating Anthropic Claude as a reliable fallback.",
        "Built a hybrid persistence layer: PostgreSQL for relational state management alongside MongoDB for LLM response caching and token telemetry.",
        "Implemented MD5-hashed prompt caching to eliminate redundant API calls and reduce latency.",
        "Engineered an assessment engine featuring binary-scored MCQs and session-level analytics to identify knowledge gaps.",
        "Developed RESTful APIs with Django REST Framework & JWT, serving a React 18 SPA with React Flow visualizations."
      ],
      github: "https://github.com/duvvasaivivek"
    },
    civility: {
      title: "Civility.ai — Multimodal AI Toxicity Moderation Platform",
      category: "Vision & NLP AI",
      metric: "Top 6 out of 240+ Teams (Agentica 2.0 Finale)",
      tags: ["PyTorch", "NLP", "Python", "Team ByteBuilders", "Agentica 2.0 Grand Finale"],
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
      category: "Generative AI",
      metric: "Devfest 5.0 BITS Goa",
      tags: ["LLMs", "Python", "Streamlit", "Vector Similarity", "Prompt Engineering"],
      overview: "An AI networking platform developed at Devfest 5.0 (BITS Goa) leveraging Large Language Models to compute professional compatibility and opportunity scores.",
      highlights: [
        "Architected vector and LLM-based profile analysis to match software engineers and researchers with open opportunities.",
        "Created an automated Opportunity Scoring algorithm quantifying alignment between candidate profiles and project requirements.",
        "Built an interactive interface for real-time recommendation updates."
      ],
      github: "https://github.com/duvvasaivivek"
    },
    safeswipe: {
      title: "SafeSwipe — Fraud Transaction Detection System",
      category: "Machine Learning",
      metric: "XGBoost + Local Outlier Factor",
      tags: ["XGBoost", "Local Outlier Factor", "Streamlit", "Scikit-Learn", "Imbalanced Data"],
      overview: "A production-grade fraud transaction identification system engineered at Elevate Labs to detect unauthorized financial transactions across highly imbalanced datasets.",
      highlights: [
        "Engineered a dual-model approach combining supervised classification (XGBoost) with unsupervised anomaly detection (Local Outlier Factor).",
        "Handled extreme class imbalance with precision-focused metrics and threshold tuning to control false-positive rates.",
        "Deployed an interactive Streamlit live dashboard for real-time transaction scoring."
      ],
      github: "https://github.com/duvvasaivivek"
    },
    lecturelens: {
      title: "Lecture-Lens — Audio Lecture Voice-to-Notes Generator",
      category: "Audio & NLP",
      metric: "IBM SkillsBuild",
      tags: ["Speech-to-Text", "NLP Summarization", "Generative AI", "Python", "Streamlit"],
      overview: "An automated lecture processing pipeline developed during the IBM SkillsBuild internship to transform spoken lectures into structured, exam-ready study notes.",
      highlights: [
        "Constructed a multi-stage pipeline combining speech-to-text transcription, NLP text chunking, and Generative AI summarization.",
        "Benchmarked and tuned 5+ parameters (chunk overlap, temperature, token limits) for transcription fidelity.",
        "Generated instant topic breakdowns, key formulas, and review cheat sheets from raw audio."
      ],
      github: "https://github.com/duvvasaivivek"
    },
    skilldrift: {
      title: "Skill Drift Monitor — Industry Skill Gap Analyzer",
      category: "Data Science",
      metric: "Hackxios 2K25 IIIT Bhopal",
      tags: ["Streamlit", "NLP", "Time-Series Modeling", "Python"],
      overview: "An NLP pipeline built during Hackxios 2K25 (IIIT Bhopal) analyzing real-world tech job postings against university syllabi.",
      highlights: [
        "Analyzed time-series NLP patterns across 100+ industry job postings and academic curricula.",
        "Modeled temporal trends to quantify discrepancies between curriculum content and active market demands.",
        "Delivered actionable insights through an interactive Streamlit interface."
      ],
      github: "https://github.com/duvvasaivivek"
    },
    campushustle: {
      title: "Campus Hustle — 2D Unity Action Game",
      category: "Game Development",
      metric: "GDG Open Source Hackathon",
      tags: ["Unity", "C#", "Git", "Physics Engine"],
      overview: "A fast-paced 2D runner game built under hackathon time constraints for the GDG Open Source Hackathon at IIITDM Kurnool.",
      highlights: [
        "Engineered smooth physics-driven player controller, jump mechanics, dynamic obstacles, and multi-tier health systems.",
        "Coordinated codebase integration via Git within a multi-member hackathon team."
      ],
      github: "https://github.com/duvvasaivivek"
    },
    aignite: {
      title: "AIgnite Order Assistant — Gemini Flash RAG Chatbot",
      category: "Generative AI",
      metric: "AIgnite 2.0 Finale",
      tags: ["Gemini Flash", "RAG", "Vector Search", "Python"],
      overview: "A specialized conversational assistant developed during AIgnite 2.0 at GPREC to support food delivery order tracking workflows.",
      highlights: [
        "Integrated Gemini Flash with Retrieval-Augmented Generation (RAG) to provide contextual answers on order placement, preparation, and delivery progress.",
        "Reduced repetitive inquiries through accurate and immediate conversational guidance."
      ],
      github: "https://github.com/duvvasaivivek"
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

  // 5. PROJECT FILTER TABS
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat.includes(filter)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 6. PROJECT DETAILS MODAL
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
