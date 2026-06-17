const TECH_SKILLS = [
  "javascript","typescript","python","java","c++","c#","go","rust","swift","kotlin","ruby","php","scala","r",
  "react","angular","vue","nextjs","nuxt","svelte","express","fastapi","django","flask","spring","laravel",
  "node","nodejs","deno","bun",
  "sql","postgresql","mysql","mongodb","redis","elasticsearch","sqlite","dynamodb","cassandra","neo4j",
  "html","css","tailwind","sass","bootstrap","graphql","rest","grpc","websocket",
  "aws","azure","gcp","docker","kubernetes","terraform","ansible","jenkins","github actions","ci/cd",
  "git","linux","bash","shell","nginx","apache",
  "machine learning","deep learning","nlp","computer vision","tensorflow","pytorch","keras","scikit-learn","pandas","numpy",
  "agile","scrum","jira","confluence","devops","microservices","api","testing","jest","pytest","cypress","selenium",
  "figma","sketch","photoshop","illustrator","ui/ux",
  "excel","tableau","power bi","looker","airflow","spark","hadoop","kafka",
];

const SOFT_SKILLS = [
  "leadership","communication","teamwork","collaboration","problem-solving","analytical","creative",
  "time management","project management","stakeholder","mentoring","coaching","presentation","negotiation",
];

const EXPERIENCE_PATTERNS = [
  /(\d+)\+?\s*years?\s*(?:of\s+)?experience/gi,
  /(\d+)\+?\s*yrs?\s*(?:of\s+)?experience/gi,
  /experience\s*(?:of\s+)?(\d+)\+?\s*years?/gi,
  /(\d{4})\s*[-–]\s*(?:present|current|\d{4})/gi,
];

const SECTION_KEYWORDS = {
  summary: ["summary","profile","objective","about","overview"],
  experience: ["experience","employment","work history","career","positions held"],
  education: ["education","academic","qualification","degree","university","college","school"],
  skills: ["skills","technologies","competencies","expertise","proficiencies","tech stack"],
  projects: ["projects","portfolio","achievements","accomplishments"],
  certifications: ["certification","certificate","accreditation","license","training"],
  contact: ["email","phone","linkedin","github","address","contact"],
};

export interface CvAnalysisResult {
  overallScore: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  skillsFound: string[];
  experienceYears: number | null;
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s+#./]/g, " ").replace(/\s+/g, " ");
}

function detectSections(text: string): Record<string, boolean> {
  const lower = text.toLowerCase();
  const result: Record<string, boolean> = {};
  for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
    result[section] = keywords.some(kw => lower.includes(kw));
  }
  return result;
}

function extractSkills(text: string): string[] {
  const norm = normalise(text);
  const found = new Set<string>();
  for (const skill of TECH_SKILLS) {
    const pattern = new RegExp(`\\b${skill.replace(/[+.]/g, "\\$&")}\\b`, "gi");
    if (pattern.test(norm)) found.add(skill);
  }
  for (const skill of SOFT_SKILLS) {
    if (norm.includes(skill)) found.add(skill);
  }
  return Array.from(found).sort();
}

function extractExperienceYears(text: string): number | null {
  const years: number[] = [];
  for (const pattern of EXPERIENCE_PATTERNS.slice(0, 2)) {
    let match;
    const re = new RegExp(pattern.source, "gi");
    while ((match = re.exec(text)) !== null) {
      const y = parseInt(match[1], 10);
      if (y > 0 && y < 50) years.push(y);
    }
  }
  const rangeRe = /(\d{4})\s*[-–]\s*(present|current|now|\d{4})/gi;
  let rangeTotal = 0;
  let rangeCount = 0;
  let m;
  const currentYear = new Date().getFullYear();
  while ((m = rangeRe.exec(text)) !== null) {
    const start = parseInt(m[1], 10);
    const end = /present|current|now/i.test(m[2]) ? currentYear : parseInt(m[2], 10);
    if (start >= 1970 && end <= currentYear + 1 && end >= start) {
      rangeTotal += end - start;
      rangeCount++;
    }
  }
  if (rangeCount > 0) years.push(Math.round(rangeTotal));
  if (years.length === 0) return null;
  return Math.max(...years);
}

function matchJobDescription(cvText: string, jd: string): { matched: string[]; missing: string[] } {
  const jdNorm = normalise(jd);
  const cvNorm = normalise(cvText);
  const jdSkills = TECH_SKILLS.filter(s => {
    const re = new RegExp(`\\b${s.replace(/[+.]/g, "\\$&")}\\b`, "gi");
    return re.test(jdNorm);
  });
  const matched: string[] = [];
  const missing: string[] = [];
  for (const s of jdSkills) {
    const re = new RegExp(`\\b${s.replace(/[+.]/g, "\\$&")}\\b`, "gi");
    if (re.test(cvNorm)) matched.push(s);
    else missing.push(s);
  }
  return { matched, missing };
}

export function analyseCv(cvText: string, roleTitle?: string, jobDescription?: string): CvAnalysisResult {
  const sections = detectSections(cvText);
  const skills = extractSkills(cvText);
  const expYears = extractExperienceYears(cvText);
  const wordCount = cvText.split(/\s+/).filter(Boolean).length;

  const techSkillsFound = skills.filter(s => TECH_SKILLS.includes(s));
  const softSkillsFound = skills.filter(s => SOFT_SKILLS.includes(s));

  let score = 0;
  const strengths: string[] = [];
  const gaps: string[] = [];
  const recommendations: string[] = [];

  // 1. Skills breadth (up to 30 pts)
  const techScore = Math.min(30, techSkillsFound.length * 2.5);
  score += techScore;
  if (techSkillsFound.length >= 8) strengths.push(`Strong technical profile with ${techSkillsFound.length} recognised technologies`);
  else if (techSkillsFound.length < 3) gaps.push("Very few technical skills detected — consider expanding the skills section");

  // 2. Experience years (up to 20 pts)
  if (expYears !== null) {
    const expScore = Math.min(20, expYears * 2);
    score += expScore;
    if (expYears >= 5) strengths.push(`${expYears}+ years of experience signals seniority`);
    else if (expYears < 2) gaps.push("Limited work history indicated — quantify experience more clearly");
  } else {
    gaps.push("Could not detect years of experience — add explicit duration to each role");
  }

  // 3. CV structure completeness (up to 25 pts)
  const sectionScores: Record<string, number> = {
    summary: 4, experience: 8, education: 5, skills: 5, projects: 3,
  };
  let structureScore = 0;
  for (const [sec, pts] of Object.entries(sectionScores)) {
    if (sections[sec]) structureScore += pts;
  }
  score += structureScore;
  if (structureScore >= 20) strengths.push("Well-structured CV with all key sections present");
  if (!sections.summary) { gaps.push("No professional summary detected"); recommendations.push("Add a 2–3 sentence professional summary at the top"); }
  if (!sections.experience) { gaps.push("Work experience section not clearly identified"); recommendations.push("Clearly label your work history section"); }
  if (!sections.skills) { gaps.push("Dedicated skills section is missing"); recommendations.push("Add a dedicated skills section for better ATS compatibility"); }
  if (!sections.education) { gaps.push("Education section not found"); recommendations.push("Include your highest qualification and institution"); }
  if (!sections.certifications) recommendations.push("Add relevant certifications to strengthen credibility");
  if (!sections.projects) recommendations.push("Include a projects section to showcase practical work");

  // 4. CV length / content depth (up to 10 pts)
  if (wordCount >= 300 && wordCount <= 900) {
    score += 10;
    strengths.push("CV length is appropriate — detailed but concise");
  } else if (wordCount < 200) {
    score += 2;
    gaps.push("CV is very short; add more detail to roles and achievements");
    recommendations.push("Expand each job role with bullet points covering responsibilities and impact");
  } else if (wordCount > 1200) {
    score += 5;
    gaps.push("CV may be too long; aim for 1–2 pages");
    recommendations.push("Trim to 2 pages — focus on the last 10 years of experience");
  }

  // 5. Soft skills (up to 5 pts)
  if (softSkillsFound.length >= 3) { score += 5; strengths.push("Soft skills are explicitly mentioned"); }
  else { score += softSkillsFound.length; recommendations.push("Mention soft skills such as communication, leadership, or teamwork"); }

  // 6. Contact info (up to 5 pts)
  if (sections.contact) { score += 5; }
  else { gaps.push("Contact information not clearly present"); recommendations.push("Ensure your email, phone, and LinkedIn profile are easy to find"); }

  // 7. Job description matching bonus (up to 5 pts extra)
  let jdMatchNote = "";
  if (jobDescription && jobDescription.trim().length > 30) {
    const { matched, missing } = matchJobDescription(cvText, jobDescription);
    if (matched.length > 0) {
      const matchBonus = Math.min(5, matched.length);
      score += matchBonus;
      strengths.push(`Matches ${matched.length} skill(s) from the job description: ${matched.slice(0, 5).join(", ")}`);
    }
    if (missing.length > 0) {
      gaps.push(`Missing ${missing.length} skill(s) mentioned in the job description: ${missing.slice(0, 5).join(", ")}`);
      recommendations.push(`Tailor your CV to include: ${missing.slice(0, 5).join(", ")}`);
    }
    jdMatchNote = ` against the ${roleTitle ?? "target"} role`;
  }

  score = Math.min(100, Math.round(score));

  const level = score >= 75 ? "strong" : score >= 50 ? "moderate" : "below-average";
  const expText = expYears ? `with approximately ${expYears} year${expYears !== 1 ? "s" : ""} of experience` : "";
  const skillText = techSkillsFound.length > 0
    ? `Key technologies include ${techSkillsFound.slice(0, 5).join(", ")}.`
    : "No specific technologies were detected.";

  const summary = `This CV presents a ${level} profile${jdMatchNote}${expText ? " " + expText : ""}. ${skillText} ${
    gaps.length > 0
      ? `There are ${gaps.length} area${gaps.length !== 1 ? "s" : ""} that could be improved to increase visibility with recruiters and ATS systems.`
      : "The CV is well-rounded and ready for submission."
  }`;

  return {
    overallScore: score,
    summary,
    strengths: strengths.slice(0, 6),
    gaps: gaps.slice(0, 6),
    recommendations: recommendations.slice(0, 6),
    skillsFound: skills,
    experienceYears: expYears,
  };
}
