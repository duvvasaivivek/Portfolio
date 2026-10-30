// Shared presentation content. Project implementation details live in data.js.
export const profile = {
  name: 'Duvva Sai Vivek',
  email: 'duvvasaivivek@gmail.com',
  github: 'https://github.com/duvvasaivivek',
  linkedin: 'https://www.linkedin.com/in/duvvasaivivek',
  url: 'https://duvvasaivivek.github.io/Portfolio/',
  resume: 'Resumes/Duvva_Sai_Vivek_Resume_2026.pdf',
  location: 'Kurnool, Andhra Pradesh, India',
  institution: 'Indian Institute of Information Technology, Design and Manufacturing, Kurnool',
  degree: 'B.Tech in Artificial Intelligence and Data Science',
  educationDates: '2024–2028',
  summary: 'I build machine learning and generative AI applications, from data and model evaluation to the interfaces people use.',
  updated: 'October 2026'
};

export const featuredIds = ['civility', 'safeswipe', 'scholarium'];
export const internshipIds = [7, 6, 5];
export const hackathonIds = [8, 3, 2, 4, 1];
export const milestoneProject = { 1: 'campushustle', 2: 'aignite', 3: 'connectiq', 4: 'skilldrift', 5: 'safeswipe', 7: 'lecturelens', 8: 'civility' };

export const projectStories = {
  civility: {
    headline: 'Making online conversations safer.',
    summary: 'A moderation workflow that flags toxic text and images and brings model predictions into a review dashboard.',
    context: 'Team ByteBuilders · Agentica 2.0', milestone: 8,
    problem: 'Online communities need a way to review harmful content across both text and images. Civility.ai brings those inputs into a shared moderation workflow.',
    contribution: 'Built preprocessing and classification pipelines and connected the FastAPI inference service to the React demonstration dashboard as part of Team ByteBuilders.',
    outcome: 'The team placed 6th out of 240+ teams at the Agentica 2.0 offline grand finale at IIIT Sricity.',
    image: 'Images/hackathons/agentica.jpeg', imageAlt: 'Agentica event badges, notebook and pens', imageCaption: 'Agentica 2.0 · IIIT Sricity · March 2026',
    takeaway: 'Model inference is one part of moderation: organising inputs and making flagged content reviewable completes the workflow.'
  },
  safeswipe: {
    headline: 'Finding fraud in imbalanced data.',
    summary: 'Transaction risk scoring with XGBoost, anomaly detection, and a dashboard for inspecting predictions.',
    context: 'Elevate Labs · Machine Learning Internship', milestone: 5,
    problem: 'Fraud detection requires finding rare suspicious transactions while controlling false positives in highly imbalanced data.',
    contribution: 'Combined XGBoost classification with Local Outlier Factor anomaly detection, tuned decision thresholds, and exposed scores through an API and Streamlit dashboard.',
    outcome: 'An end-to-end workflow connecting transaction data, risk scoring, and an interactive interface for inspecting results.',
    takeaway: 'The classification threshold is an operating decision. Precision and recall need to be considered together when reviewing rare-event predictions.'
  },
  scholarium: {
    headline: 'Turning learning goals into a path.',
    summary: 'An adaptive learning platform with generated roadmaps, assessments, and progress insights.',
    context: 'Independent project',
    problem: 'A learning goal needs structure: prerequisite topics, a sequence to follow, and a way to identify gaps along the way.',
    contribution: 'Built the React and Django REST application, integrated roadmap generation, implemented authenticated APIs, and connected assessments with session analytics.',
    outcome: 'A full-stack application combining interactive learning roadmaps, generated quizzes, response caching, and knowledge-gap tracking.',
    takeaway: 'The application separates relational user state from cached model responses, while a fallback model provides a second generation path.'
  },
  lecturelens: { headline: 'From lecture audio to study notes.', summary: 'Speech-to-text, topic summaries, formulas, and review questions in one processing pipeline.', context: 'IBM SkillsBuild · AI/ML Internship', milestone: 7, problem: 'Long lecture recordings are difficult to revisit when a student needs specific topics or a concise revision guide.', contribution: 'Built the transcription and summarisation pipeline and tuned chunk overlap, temperature, and token limits.', outcome: 'Structured notes, key formulas, and revision questions generated from lecture audio.' },
  connectiq: { headline: 'Connecting skills with opportunities.', summary: 'Semantic matching between developer profiles and project requirements.', context: 'Team Void Walkers · Devfest 5.0', milestone: 3, problem: 'Developer profiles and project descriptions express similar skills in different words, making simple keyword matching restrictive.', contribution: 'Built skill-vector extraction and compatibility scoring using sentence embeddings and cosine similarity.', outcome: 'An interactive interface presenting compatibility scores and opportunity recommendations.', image: 'Images/projects/connectiq.jpeg', imageAlt: 'Connect IQ application showing a search for generative AI and opportunity recommendations', imageCaption: 'Connect IQ · application screenshot' },
  skilldrift: { headline: 'Seeing the gap between courses and jobs.', summary: 'Skill extraction from 100+ job listings, compared with university syllabi.', context: 'Team Core Cube · Hackxios 2K25', milestone: 4, problem: 'Course content and current technology job requirements can move at different speeds.', contribution: 'Built the scraping and NLP extraction workflow, compared skills with syllabi, and presented gap reports in Streamlit.', outcome: 'Structured curriculum-gap reports and suggested skill paths using 100+ job listings.' },
  aignite: { headline: 'Answering questions across an order.', summary: 'A retrieval-based conversational assistant for menu and order queries.', context: 'Team ApexVAMY · AIgnite 2.0', milestone: 2, problem: 'Menu and delivery questions need answers grounded in the relevant order information.', contribution: 'Combined Gemini Flash with LangChain retrieval and FastAPI endpoints for the order-assistance workflow.', outcome: 'Demonstrated live at the AIgnite 2.0 offline grand finale at GPREC.' },
  campushustle: { headline: 'A small game, built under a deadline.', summary: 'A Unity runner with procedural obstacles, player physics, and a browser build.', context: 'Team SpriteVRM · GDG Open Source Hackathon', milestone: 1, problem: 'A hackathon game needs a playable loop that brings movement, obstacles, and feedback together within a short build window.', contribution: 'Programmed player movement, jump mechanics, procedural obstacles, and a multi-tier health system; collaborated through Git.', outcome: 'A WebGL build of the 2D runner, playable in the browser.' }
};
