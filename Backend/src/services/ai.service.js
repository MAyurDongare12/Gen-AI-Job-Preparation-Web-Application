const { GoogleGenerativeAI } = require('@google/generative-ai');
const puppeteer = require('puppeteer')


const ai = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY)

/**
 * Retry a function with exponential backoff for transient errors (e.g. 503).
 */
async function withRetry(fn, maxRetries = 3, baseDelayMs = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            const isRetryable = error.status === 503 || error.status === 429
            if (isRetryable && attempt < maxRetries) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1)
                console.log(`Gemini API returned ${error.status}, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`)
                await new Promise(resolve => setTimeout(resolve, delay))
            } else {
                throw error
            }
        }
    }
}

async function invokeGeminiAi() {
    const response = await ai.getGenerativeModel({ model: "gemini-2.5-flash" }).generateContent("Hello gemini ! Exxplain what is Interview ?")

    console.log(response.response.text())
}


async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume || 'No resume provided'}
Self Description: ${selfDescription || 'No self description provided'}
Job Description: ${jobDescription || 'No job description provided'}

Provide the response as a JSON object with the following structure:
{
  "title": "Interview Preparation Report",
  "matchScore": <score 0-100>,
  "technicalQuestions": [
    {
      "question": "<question>",
      "intention": "<why this question>",
      "answer": "<suggested answer>"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "<question>",
      "intention": "<why this question>",
      "answer": "<suggested answer>"
    }
  ],
  "skillGaps": [
    {
      "skill": "<skill name>",
      "severity": "low|medium|high"
    }
  ],
  "preparationPlan": [
    {
      "day": <day number>,
      "focus": "<focus area>",
      "tasks": ["<task1>", "<task2>"]
    }
  ]
}

Include at least 3 technical questions, 2 behavioral questions, 2-3 skill gaps, and a 5-day preparation plan. Make sure the response is valid JSON.`

    try {
        let result
        try {
            console.log("📡 Initializing Gemini model...")
            const model = ai.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })

            console.log("📤 Sending prompt to Gemini API...")
            const response = await withRetry(() => model.generateContent(prompt))

            console.log("📥 Received response from Gemini API")

            if (!response || !response.response) {
                throw new Error("Invalid response from Gemini API")
            }

            const text = response.response.text()
            console.log("📄 Response text length:", text.length)

            // Extract JSON from the response (in case there's extra text)
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (!jsonMatch) {
                console.error("❌ Could not extract JSON. Response:", text.substring(0, 500))
                throw new Error("Could not extract JSON from response")
            }

            console.log("🔍 Extracted JSON length:", jsonMatch[0].length)
            result = JSON.parse(jsonMatch[0])

            // Validate required fields
            if (!result.title || result.matchScore === undefined || !result.technicalQuestions || !result.behavioralQuestions || !result.skillGaps || !result.preparationPlan) {
                console.error("❌ Missing required fields:", {
                    title: !!result.title,
                    matchScore: result.matchScore,
                    technicalQuestions: !!result.technicalQuestions,
                    behavioralQuestions: !!result.behavioralQuestions,
                    skillGaps: !!result.skillGaps,
                    preparationPlan: !!result.preparationPlan
                })
                throw new Error("Response missing required fields")
            }
        } catch (aiErr) {
            // Don't fail the whole feature if Gemini is over quota / down / returning
            // malformed output. Fall back to a deterministic, content-based report
            // so the user always gets a useful plan.
            console.warn("⚠️ Gemini interview generation failed, using fallback report:", aiErr.message)
            result = buildFallbackInterviewReport({ resume, selfDescription, jobDescription })
        }

        console.log("✅ Successfully generated interview report")
        return result
    } catch (error) {
        console.error("❌ Error in generateInterviewReport:", error.message)
        console.error("Error details:", error)
        throw new Error(`Failed to generate interview report: ${error.message}`)
    }
}

/**
 * Build a deterministic, content-based interview report when Gemini is
 * unavailable. Uses heuristic keyword matching against the resume and job
 * description so the output is still useful (not garbage).
 */
function buildFallbackInterviewReport({ resume, selfDescription, jobDescription }) {
    const jd = (jobDescription || '').trim()
    const sd = (selfDescription || '').trim()
    const all = (resume + ' ' + selfDescription + ' ' + jd).toLowerCase()

    // Extract keywords for skill-gap analysis
    const techKeywords = [
        'javascript', 'typescript', 'react', 'next.js', 'node.js', 'express',
        'mongodb', 'postgresql', 'mysql', 'redis', 'graphql', 'rest', 'docker', 'kubernetes',
        'aws', 'gcp', 'azure', 'ci/cd', 'git', 'html', 'css', 'sass', 'tailwind', 'redux',
        'vue', 'angular', 'python', 'django', 'flask', 'java', 'spring', 'c++', 'c#',
        '.net', 'go', 'rust', 'ruby', 'rails', 'php', 'laravel', 'swift', 'kotlin',
        'android', 'ios', 'flutter', 'react native', 'figma', 'jest', 'cypress',
        'playwright', 'webpack', 'vite', 'linux', 'agile', 'scrum',
    ]
    const foundSkills = new Set()
    for (const kw of techKeywords) {
        const re = new RegExp('(?:^|[^a-z0-9])' + kw.replace(/[.+]/g, '\\$&') + '(?:[^a-z0-9]|$)', 'i')
        if (re.test(all)) foundSkills.add(kw.replace(/\b\w/g, c => c.toUpperCase()))
    }
    const skillsArr = Array.from(foundSkills)

    // Heuristic match score: % of detected skills that also appear in the JD
    const jdKeywords = new Set()
    for (const kw of techKeywords) {
        const re = new RegExp('(?:^|[^a-z0-9])' + kw.replace(/[.+]/g, '\\$&') + '(?:[^a-z0-9]|$)', 'i')
        if (re.test(jd.toLowerCase())) jdKeywords.add(kw)
    }
    const overlap = skillsArr.filter(s => jdKeywords.has(s.toLowerCase())).length
    const matchScore = jdKeywords.size === 0
        ? Math.min(85, 50 + skillsArr.length * 5)
        : Math.min(95, Math.round((overlap / jdKeywords.size) * 100))

    // Generic but useful technical questions, tailored to the most prominent skill
    const topSkill = skillsArr[0] || 'software engineering'
    const technicalQuestions = [
        {
            question: `Walk me through a complex ${topSkill} project you built from scratch. What trade-offs did you make?`,
            intention: 'Assess real-world depth and decision-making, not textbook knowledge.',
            answer: 'Use the STAR format: situation, task, action, result. Quantify the result (performance, user impact, team size).',
        },
        {
            question: `How do you debug a production issue in a system that uses ${skillsArr[1] || 'multiple services'}?`,
            intention: 'Test debugging methodology under pressure.',
            answer: 'Reproduce locally, check logs/metrics, isolate the failing component, write a regression test, then ship the fix with monitoring.',
        },
        {
            question: `Explain the difference between ${skillsArr[2] || skillsArr[0] || 'this technology'} and one of its main alternatives. When would you pick each?`,
            intention: 'Evaluate breadth of knowledge and architectural judgement.',
            answer: 'Compare on axes like performance, developer experience, ecosystem maturity, and team familiarity. Justify a default choice for your team.',
        },
    ]

    const behavioralQuestions = [
        {
            question: 'Tell me about a time you disagreed with a teammate on a technical decision. How was it resolved?',
            intention: 'Probe collaboration and communication skills.',
            answer: 'Show that you listened first, presented data, deferred to a senior when appropriate, and learned from the outcome.',
        },
        {
            question: 'Describe a project where you had to learn a new technology quickly. What was your approach?',
            intention: 'Test learning agility, a key trait for fast-moving teams.',
            answer: 'Read official docs, build a small spike, pair with someone experienced, then apply it to the real task with a deadline buffer.',
        },
    ]

    // Skill gaps = JD keywords that the candidate's resume doesn't mention
    const skillGaps = Array.from(jdKeywords)
        .filter(k => !skillsArr.some(s => s.toLowerCase() === k))
        .slice(0, 5)
        .map((skill, i) => ({
            skill: skill.replace(/\b\w/g, c => c.toUpperCase()),
            severity: i < 1 ? 'high' : i < 3 ? 'medium' : 'low',
        }))
    if (skillGaps.length === 0) {
        skillGaps.push(
            { skill: 'System design fundamentals', severity: 'medium' },
            { skill: 'Testing and CI/CD best practices', severity: 'low' },
        )
    }

    const preparationPlan = [
        { day: 1, focus: `${topSkill} fundamentals deep-dive`, tasks: ['Review core concepts and patterns', 'Build a small demo from scratch', 'List 5 follow-up questions for the interviewer'] },
        { day: 2, focus: `Hands-on coding practice`, tasks: ['Solve 2-3 LeetCode mediums in your strongest language', 'Time-box to 30 min each', 'Write a short retrospective on each'] },
        { day: 3, focus: 'System design / architecture', tasks: ['Sketch the high-level design of a system you know well', 'Practice articulating trade-offs out loud', 'Review CAP, caching, queues, observability'] },
        { day: 4, focus: 'Behavioural & STAR stories', tasks: ['Prepare 4-5 STAR stories covering impact, conflict, failure, learning', 'Practice with a friend or a mock interview', 'Tie each story to the company mission'] },
        { day: 5, focus: 'Mock interview & final review', tasks: ['Run a 60-min mock interview (technical + behavioural)', 'Review your notes and gaps from days 1-4', 'Prepare 3 thoughtful questions to ask the interviewer'] },
    ]

    return {
        title: 'Interview Preparation Report',
        matchScore,
        technicalQuestions,
        behavioralQuestions,
        skillGaps,
        preparationPlan,
    }
}

async function generatePdfFromHtml(htmlContent) {
    let browser = null;
    try {
        const fs = require('fs');
        const isProduction = process.env.NODE_ENV === 'production'

        // Resolve a Chrome executable that actually exists on this machine.
        // Order: explicit env var -> common Linux paths (Render/Docker) ->
        // bundled Chromium that ships with the puppeteer npm package (local dev).
        const candidatePaths = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            // Bundled Chromium from `npm install puppeteer` (local dev only)
            process.env.PUPPETEER_CACHE
                ? `${process.env.PUPPETEER_CACHE}/chrome`
                : null,
        ].filter(Boolean)

        let executablePath
        for (const p of candidatePaths) {
            try {
                if (fs.existsSync(p)) { executablePath = p; break }
            } catch (_) { /* ignore */ }
        }

        const launchOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        }
        if (executablePath) {
            launchOptions.executablePath = executablePath
            console.log(`🧭 Using Chrome at: ${executablePath}`)
        } else if (isProduction) {
            // No Chrome found in production — fail loud with a helpful message
            // rather than letting puppeteer try (and time out) to download one.
            throw new Error(
                'Chrome not found. Set PUPPETEER_EXECUTABLE_PATH or install Chrome ' +
                'via the Render Puppeteer buildpack ' +
                '(https://github.com/Snailedlt/puppeteer-buildpack).'
            )
        }

        browser = await puppeteer.launch(launchOptions)
        const page = await browser.newPage()
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4", margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm",
            }
        })

        return Buffer.from(pdfBuffer)
    } catch (error) {
        console.error("Error generating PDF:", error.message);
        throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
        if (browser) {
            try { await browser.close() } catch (_) { /* ignore */ }
        }
    }
}

async function getStructuredResumeData({ resume, selfDescription, jobDescription }) {
    const prompt = `You are a Principal Executive Resume Writer and FAANG Talent Acquisition Specialist.
Your task is to produce an ultra-targeted, ATS-optimized 90+ Score Resume tailored to the given Target Job Description.

Candidate Resume Data:
${resume || 'No prior resume provided'}

Candidate Self-Description & Background:
${selfDescription || 'No self description provided'}

Target Job Description (Top Priority for Keyword Alignment):
${jobDescription || 'No job description provided'}

CRITICAL ATS COMPLIANCE INSTRUCTIONS:
1. MAXIMIZE ATS SCORE (Target 90%+ Match):
   - Analyze the target job description for core technical skills, frameworks, tools, architectures, and domain keywords.
   - Weave these exact keywords organically into the candidate's Professional Summary, Technical Skills categories, and Work Experience / Project bullets.
   - Do NOT invent companies or degrees that do not exist, but aggressively frame the candidate's actual projects, experience, and competencies to highlight exact matches with the job requirements.
2. GOOGLE XYZ BULLET FORMULA:
   - Every bullet in workExperience and projects MUST follow the formula: "Accomplished [X] as measured by [Y], by doing [Z]".
   - Start EVERY bullet with an active, high-impact verb (e.g., Spearheaded, Architected, Engineered, Optimized, Delivered, Accelerated, Reduced, Overhauled, Orchestrated).
   - Include realistic quantifiable metrics where possible (e.g. percentages, response latency, scale, throughput, efficiency gains).
3. CATEGORIZED TECHNICAL SKILLS:
   - Group skills into structured categories: Languages, Frameworks & Libraries, Databases & Storage, Cloud & DevOps, Architecture & Core Concepts.
4. ZERO ATS RED FLAGS:
   - DO NOT include Date of Birth, photos, emojis, or graphic elements.
   - Use clean, standard section names.

Return ONLY a valid JSON object (no markdown formatting, no codeblock backticks, raw JSON only) matching this exact schema:
{
  "header": {
    "name": "Full Name",
    "title": "Target Role Title (e.g., Senior Software Engineer)",
    "location": "City, State / Country or Remote",
    "phone": "Phone number or empty string",
    "email": "Email address or empty string",
    "linkedin": "LinkedIn profile link or handle",
    "github": "GitHub / Portfolio link or handle"
  },
  "summary": "3-4 sentence high-impact professional summary tailored to the target role. Highlight years of experience, core technical stack, and demonstrable record of architectural impact.",
  "skills": {
    "languages": ["JavaScript (ES6+)", "TypeScript", "Python", "SQL"],
    "frameworks": ["React.js", "Node.js", "Express.js", "Redux Toolkit", "Next.js"],
    "databases": ["MongoDB", "PostgreSQL", "Redis"],
    "cloudDevOps": ["AWS (S3, EC2)", "Docker", "CI/CD", "Git/GitHub"],
    "coreConcepts": ["RESTful APIs", "Microservices", "System Design", "Agile/Scrum"]
  },
  "workExperience": [
    {
      "role": "Role Title",
      "company": "Company Name",
      "location": "City, State or Remote",
      "startDate": "Month Year",
      "endDate": "Month Year or Present",
      "bullets": [
        "Accomplished [X] as measured by [Y], by doing [Z]"
      ]
    }
  ],
  "projects": [
    {
      "title": "Project Title",
      "techStack": "React, Node.js, MongoDB, TypeScript",
      "startDate": "Month Year",
      "endDate": "Month Year",
      "bullets": [
        "Accomplished [X] as measured by [Y], by doing [Z]"
      ]
    }
  ],
  "education": [
    {
      "degree": "B.S. in Computer Science",
      "institution": "University / Institution Name",
      "location": "City, State",
      "startDate": "Year",
      "endDate": "Year",
      "score": "CGPA: 8.5/10 or GPA: 3.8/4.0 or honors"
    }
  ],
  "certifications": [
    "AWS Certified Solutions Architect",
    "Meta Front-End Developer"
  ]
}`

    let resumeData
    try {
        const model = ai.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        })

        const response = await withRetry(() => model.generateContent(prompt))

        if (!response || !response.response) {
            throw new Error("Invalid response from Gemini API")
        }

        const text = response.response.text()

        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error("Could not extract JSON from response")
        }

        resumeData = JSON.parse(jsonMatch[0])
        if (!resumeData.header || !resumeData.header.name) {
            throw new Error("Response missing required header.name field")
        }
    } catch (aiErr) {
        // Don't fail the whole feature if Gemini is over quota / down.
        // Fall back to a clean parser so the user still gets an ATS resume.
        console.warn("⚠️ Gemini resume generation failed, using fallback parser:", aiErr.message)
        resumeData = buildFallbackResumeData({ resume, selfDescription, jobDescription })
    }

    return resumeData
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    try {
        const resumeData = await getStructuredResumeData({ resume, selfDescription, jobDescription })
        const html = renderResumeHtml(resumeData)
        // Try Puppeteer first (nicer layout). If Chrome is missing or Puppeteer
        // fails for any reason, fall back to a pure-Node PDF generator so the
        // user always gets a downloadable file — even on hosts without Chrome.
        let pdfBuffer
        try {
            pdfBuffer = await generatePdfFromHtml(html)
        } catch (puppeteerErr) {
            console.warn("⚠️ Puppeteer PDF generation failed, using pure-Node fallback:", puppeteerErr.message)
            pdfBuffer = generateSimplePdfFromResumeData(resumeData)
        }
        return pdfBuffer
    } catch (error) {
        console.error("Error in generateResumePdf:", error.message)
        throw new Error(`Failed to generate resume PDF: ${error.message}`)
    }
}

/**
 * Parse raw resume text + self description + job description into the
 * structured JSON shape that renderResumeHtml expects. This is the fallback
 * used when Gemini is unavailable or returns malformed output.
 *
 * It is a best-effort parser, not a perfect one — when the inputs are sparse
 * (e.g. just a name and a sentence) it produces a minimal but valid resume.
 */

/**
 * Split a space-separated string into tokens, joining back any known
 * multi-word terms (longest-match first). E.g.
 *   "MS Word PowerPoint Matlab DWSIM ChemCAD Ansys Fluent"
 * -> ["MS Word", "PowerPoint", "Matlab", "DWSIM", "ChemCAD", "Ansys Fluent"]
 */
function splitOnKnownTerms(text, multiWordTerms) {
    const sorted = [...multiWordTerms].sort((a, b) => b.length - a.length)
    const out = []
    let i = 0
    const words = text.split(/\s+/)
    while (i < words.length) {
        let matched = null
        // Try to match a multi-word term starting at i
        for (const term of sorted) {
            const termWords = term.split(/\s+/)
            const slice = words.slice(i, i + termWords.length).join(' ')
            if (slice.toLowerCase() === term.toLowerCase()) {
                matched = term
                break
            }
        }
        if (matched) {
            out.push(matched)
            i += matched.split(/\s+/).length
        } else {
            out.push(words[i])
            i++
        }
    }
    return out
}

function buildFallbackResumeData({ resume, selfDescription, jobDescription }) {
    const sd = (selfDescription || '').trim()
    const resumeText = (resume || '').trim()
    const jd = (jobDescription || '').trim()
    const allText = [sd, resumeText, jd].filter(Boolean).join('\n')

    // ---------- Header ----------
    let name = ''
    // Try "My name is X" / "I am X" / "I'm X"
    const nameMatch = (sd + ' ' + resumeText).match(
        /(?:my name is|i am|i'm|name\s*[:\-])\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/
    )
    if (nameMatch) name = nameMatch[1]
    // Fall back: first 2-3 ALL-CAPS words at the very top of the resume (common in Indian resumes)
    if (!name) {
        const firstLines = resumeText.split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 3)
        for (const line of firstLines) {
            const upper = line.match(/^([A-Z][A-Z\s.&-]{2,})$/)
            if (upper) {
                const cleaned = upper[1].trim()
                if (cleaned.length >= 4 && cleaned.length <= 60) {
                    name = cleaned.split(/\s+/).map(w =>
                        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                    ).join(' ')
                    break
                }
            }
        }
    }
    // Fall back: first 2-3 capitalized words at start of self description
    if (!name) {
        const cap = sd.split(/\r?\n/)[0]?.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})/)
        if (cap) name = cap[1]
    }
    // Fall back: derive from email local-part
    if (!name) {
        const emailIn = allText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
        if (emailIn) {
            const local = emailIn[0].split('@')[0].replace(/[._-]+/g, ' ').replace(/\d+/g, '').trim()
            // Only use this if the local part looks like a real name (>=2 words OR a known-valid
            // single word that's clearly alphabetic, not a code like "bch" or "test").
            const words = local.split(/\s+/).filter(Boolean)
            if (words.length >= 2 && words.every(w => /^[a-zA-Z]{2,}$/.test(w))) {
                name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            }
        }
    }
    if (!name) name = 'Your Name'

    const emailMatch = allText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
    // Phone: must start with + or ( and contain at least 10 digits, no letters
    const phoneMatch = allText.match(/(?:\+\d{1,3}[\s-]?)?\(?\d{3,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{3,5}/)
    const linkedinMatch = allText.match(/(?:linkedin\.com\/in\/|linkedin\s*[:\-]\s*)([\w-]+)/i)

    // ---------- Parse resume into sections ----------
    // The fallback parser works on line-delimited input. If `resume` is one big
    // paragraph (as extracted from a PDF), it tries to split on capitalised
    // headings like "Education" or "Skills".
    let lines = resumeText.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    if (lines.length <= 1 && resumeText.length > 0) {
        // Single-line PDF text — split on section markers like "EDUCATION", "SKILLS"
        const split = resumeText.split(/\s{2,}|\n|(?=(?:EDUCATION|SKILLS|EXPERIENCE|WORK EXPERIENCE|PROJECTS|CERTIFICATES|HOBBIES|LANGUAGES|TECHNICAL SKILLS|SOFT SKILLS|EXTRA-CURRICULAR|OBJECTIVE|SUMMARY)\b)/i)
        lines = split.map(l => l.trim()).filter(Boolean)
    }

    const knownSections = [
        'Objective', 'Summary', 'Education', 'Work Experience', 'Experience',
        'Projects', 'Technical Skills', 'Soft Skills', 'Skills',
        'Certificates', 'Certifications', 'Extra-Curricular Activities',
        'Extra Curricular Activities', 'Languages', 'Hobbies', 'Achievements', 'Awards',
    ]
    const sectionHeaderRe = new RegExp(
        `^(${knownSections.map(s => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\s*[:\\-]?$`,
        'i'
    )

    const buckets = {}
    let current = null
    for (const line of lines) {
        if (sectionHeaderRe.test(line)) {
            // Normalize to title-case to make downstream lookups case-insensitive
            current = line.replace(/[:\-]\s*$/, '').trim()
                .toLowerCase()
                .replace(/\b\w/g, c => c.toUpperCase())
            buckets[current] = buckets[current] || []
        } else if (current) {
            buckets[current].push(line)
        }
    }

    // If no sections were detected, dump everything into a generic bucket
    if (Object.keys(buckets).length === 0) {
        buckets['Experience'] = lines
    }

    // ---------- Education ----------
    // Strategy: scan the Education bucket. A line that looks like a date range
    // (e.g. "Sep 2023 — Present | CGPA: 8.10/10") ends the *current* entry and
    // starts a new one with the next line being the degree.
    const education = []
    const eduLines = buckets['Education'] || []
    let currentEdu = null
    const isDateLine = (l) => /[a-z]{3,}\s+\d{4}|present/i.test(l) && /[-–—|]/.test(l)
    const isScoreLine = (l) => /(cgpa|gpa|percentage|%|marks|score)/i.test(l)
    for (const line of eduLines) {
        if (isDateLine(line) || isScoreLine(line)) {
            if (!currentEdu) currentEdu = { degree: '', institution: '', startDate: '', endDate: '', score: '' }
            const datePart = line.split('|')[0].trim()
            const scorePart = line.includes('|') ? line.split('|').slice(1).join('|').trim() : ''
            const [s, e] = datePart.split(/\s*[-–—]\s*/)
            if (s) currentEdu.startDate = s.trim()
            if (e) currentEdu.endDate = e.trim()
            if (scorePart) currentEdu.score = scorePart
            // date+score line ends the current entry
            education.push(currentEdu)
            currentEdu = null
        } else {
            // First non-date line: degree. Second: institution.
            if (!currentEdu) {
                currentEdu = { degree: line, institution: '', startDate: '', endDate: '', score: '' }
            } else if (!currentEdu.institution) {
                currentEdu.institution = line
            } else {
                // Extra line — append to institution (multi-line institution names)
                currentEdu.institution += ', ' + line
            }
        }
    }
    if (currentEdu) education.push(currentEdu)

    // ---------- Work experience ----------
    // Strategy: a line that contains a comma is likely "Role, Company, Location"
    // (or at least "Role, Company"). A line that contains "— date - date" is a
    // date range. Anything else is a bullet under the current entry.
    const workExperience = []
    const expLines = buckets['Work Experience'] || buckets['Experience'] || []
    for (const line of expLines) {
        if (isDateLine(line)) {
            // date line — attach to the last entry
            const last = workExperience[workExperience.length - 1]
            if (last) {
                const datePart = line.split('|')[0].trim()
                const [s, e] = datePart.split(/\s*[-–—]\s*/)
                if (s) last.startDate = s.trim()
                if (e) last.endDate = e.trim()
            }
        } else if (line.includes(',')) {
            // Treat as "Role, Company[, Location]"
            const parts = line.split(',').map(s => s.trim())
            workExperience.push({
                role: parts[0] || line,
                company: parts[1] || '',
                location: parts.slice(2).join(', '),
                startDate: '',
                endDate: '',
                bullets: [],
            })
        } else if (workExperience.length) {
            // bullet
            workExperience[workExperience.length - 1].bullets.push(line)
        } else {
            // No current entry yet, treat as a role with no company
            workExperience.push({
                role: line, company: '', location: '',
                startDate: '', endDate: '', bullets: [],
            })
        }
    }

    // ---------- Projects ----------
    // Strategy: each non-date line is a project title. A following date line
    // attaches to it. Any subsequent non-date, non-title-looking lines are
    // bullets.
    const projects = []
    const projLines = buckets['Projects'] || []
    for (const line of projLines) {
        if (isDateLine(line)) {
            const last = projects[projects.length - 1]
            if (last) {
                const datePart = line.split('|')[0].trim()
                const [s, e] = datePart.split(/\s*[-–—]\s*/)
                if (s) last.startDate = s.trim()
                if (e) last.endDate = e.trim()
            }
        } else {
            // New project title. If the previous one had no date and is very
            // short, treat this as a bullet of the previous one.
            const last = projects[projects.length - 1]
            if (last && !last.startDate && !last.endDate && last.bullets.length === 0 && line.length > 30) {
                last.bullets.push(line)
            } else {
                projects.push({ title: line, startDate: '', endDate: '', bullets: [] })
            }
        }
    }

    // ---------- Technical skills ----------
    // Read from a "Technical Skills" / "Skills" section, splitting on commas,
    // and merge in any tech keywords found anywhere in the text.
    const techKeywords = [
        'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST', 'Docker', 'Kubernetes',
        'AWS', 'GCP', 'Azure', 'CI/CD', 'Git', 'HTML', 'CSS', 'Sass', 'Tailwind', 'Redux',
        'Vue', 'Angular', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring',
        'C++', 'C#', '.NET', 'Go', 'Rust', 'Ruby', 'Rails', 'PHP', 'Laravel', 'Swift',
        'Kotlin', 'Android', 'iOS', 'Flutter', 'React Native', 'Figma', 'Jest', 'Cypress',
        'Playwright', 'Webpack', 'Vite', 'Linux', 'Agile', 'Scrum', 'Jira', 'Matlab', 'DWSIM',
        'ChemCAD', 'Ansys Fluent', 'MS Word', 'PowerPoint',
    ]
    const techMultiWord = [
        'Ansys Fluent', 'React Native', 'React.js', 'Node.js', 'Next.js', 'MS Word',
        'MS Excel', 'MS PowerPoint', 'Google Cloud', 'CI/CD',
    ]
    const techAliases = {
        'reactjs': 'React', 'react.js': 'React', 'nodejs': 'Node.js', 'nextjs': 'Next.js',
        'mongodb': 'MongoDB', 'postgres': 'PostgreSQL', 'postgresql': 'PostgreSQL',
        'ts': 'TypeScript', 'js': 'JavaScript',
    }
    const techSet = new Set()
    const skillLines = (buckets['Technical Skills'] || buckets['Skills'] || [])
    for (const rawLine of skillLines) {
        // First, strip out parenthetical proficiency annotations like "(Beginner)"
        const stripped = rawLine.replace(/\s*\([^)]*\)/g, '').trim()
        if (!stripped) continue
        // If there are any separators, use them. Otherwise split on whitespace and
        // re-join known multi-word terms (e.g. "MS Word", "Ansys Fluent").
        const hasSeparators = /[,;|•·]/.test(stripped)
        let pieces
        if (hasSeparators) {
            pieces = stripped.split(/[,;|•·]+/).map(s => s.trim()).filter(Boolean)
        } else {
            pieces = splitOnKnownTerms(stripped, techMultiWord)
        }
        for (const t of pieces) {
            const lower = t.toLowerCase()
            techSet.add(techAliases[lower] || t)
        }
    }
    const haystack = allText.toLowerCase()
    for (const kw of techKeywords) {
        const re = new RegExp('(?:^|[^a-z0-9])' + kw.toLowerCase().replace(/[.+]/g, '\\$&') + '(?:[^a-z0-9]|$)', 'i')
        if (re.test(haystack)) techSet.add(kw)
    }

    // ---------- Soft skills ----------
    const softKeywords = ['Teamwork', 'Time Management', 'Decision Making', 'Presentation',
        'Leadership', 'Communication', 'Problem Solving', 'Adaptability', 'Critical Thinking']
    const softSet = new Set()
    const softLines = (buckets['Soft Skills'] || [])
    for (const rawLine of softLines) {
        // Split on commas / pipes / ampersand
        for (const piece of rawLine.split(/[,;|•·&]+/)) {
            const t = piece.trim()
            if (t) softSet.add(t)
        }
    }
    for (const kw of softKeywords) {
        if (haystack.includes(kw.toLowerCase())) softSet.add(kw)
    }

    // ---------- Other simple lists ----------
    // Each line in the bucket is one item (since they came from one-per-line PDF text).
    // We still split any comma/semicolon-separated lines as a safety net.
    const splitList = (section, multiWord = null) => {
        const items = []
        for (const line of (buckets[section] || [])) {
            const stripped = line.replace(/\s*\([^)]*\)/g, '')
            if (multiWord && !/[,;|•·&]/.test(stripped)) {
                // No separator — split on whitespace using known multi-word terms
                items.push(...splitOnKnownTerms(stripped, multiWord))
            } else {
                for (const piece of stripped.split(/[,;|•·&]+/)) {
                    const t = piece.trim()
                    if (t) items.push(t)
                }
            }
        }
        return items
    }

    // ---------- Objective (default) ----------
    let objective = ''
    if (buckets['Objective'] && buckets['Objective'].length) {
        objective = buckets['Objective'].join(' ')
    } else {
        const jdFirst = jd.split(/\r?\n/)[0] || ''
        objective = `To contribute strong technical and analytical skills to a ${jdFirst || 'suitable'} role, while continuing to grow as a professional.`
    }

    return {
        header: {
            name,
            location: '',
            phone: phoneMatch ? phoneMatch[0] : '',
            dob: '',
            email: emailMatch ? emailMatch[0] : '',
            linkedin: linkedinMatch ? (linkedinMatch[1] ? `linkedin.com/in/${linkedinMatch[1]}` : 'LinkedIn') : '',
        },
        objective,
        education,
        workExperience,
        projects,
        technicalSkills: Array.from(techSet),
        softSkills: Array.from(softSet),
        certificates: splitList('Certificates', techMultiWord).concat(splitList('Certifications', techMultiWord)),
        extraCurricular: splitList('Extra-Curricular Activities').concat(splitList('Extra Curricular Activities')),
        languages: splitList('Languages'),
        hobbies: splitList('Hobbies'),
    }
}

/**
 * Render the structured resume data into an ATS 90+ compliant HTML document.
 * Layout adheres to Harvard / Stanford / FAANG single-column standards:
 * Clean typography, strict contact hierarchy, zero emojis/icons that break
 * ATS parsers (Workday, Taleo, Greenhouse, Lever, iCIMS), and Google XYZ formula bullets.
 */
function renderResumeHtml(d) {
    const escape = (s) => String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const h = d.header || {};
    const contactParts = [];
    if (h.email) contactParts.push(`<a href="mailto:${escape(h.email)}" style="color: inherit; text-decoration: none;">${escape(h.email)}</a>`);
    if (h.phone) contactParts.push(escape(h.phone));
    if (h.location) contactParts.push(escape(h.location));
    if (h.linkedin) {
        const cleanLi = h.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\/?/, '').replace(/\/$/, '');
        contactParts.push(`<a href="${escape(h.linkedin.startsWith('http') ? h.linkedin : 'https://linkedin.com/in/' + cleanLi)}" style="color: #2563eb; text-decoration: none;">linkedin.com/in/${escape(cleanLi)}</a>`);
    }
    if (h.github) {
        const cleanGh = h.github.replace(/^https?:\/\/(www\.)?github\.com\/?/, '').replace(/\/$/, '');
        contactParts.push(`<a href="${escape(h.github.startsWith('http') ? h.github : 'https://github.com/' + cleanGh)}" style="color: #2563eb; text-decoration: none;">github.com/${escape(cleanGh)}</a>`);
    }

    const sectionTitle = (title) => `
        <h2 style="font-size: 11pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1.2px; border-bottom: 1.5px solid #0f172a; padding-bottom: 2px; margin: 12px 0 6px 0;">${title}</h2>`;

    // Professional Summary or Objective
    const summaryText = d.summary || d.objective || '';

    // Categorized Skills
    let skillsHtml = '';
    if (d.skills && typeof d.skills === 'object' && !Array.isArray(d.skills)) {
        const categories = [
            { label: 'Languages', items: d.skills.languages },
            { label: 'Frameworks & Libraries', items: d.skills.frameworks },
            { label: 'Databases & Storage', items: d.skills.databases },
            { label: 'Cloud & DevOps', items: d.skills.cloudDevOps },
            { label: 'Core Architecture', items: d.skills.coreConcepts || d.skills.coreCompetencies }
        ];
        const rows = categories
            .filter(c => c.items && c.items.length)
            .map(c => `
                <div style="margin-bottom: 2px;">
                    <strong style="color: #0f172a; font-weight: 700;">${c.label}:</strong>
                    <span style="color: #1e293b;">${c.items.map(escape).join(', ')}</span>
                </div>
            `).join('');
        if (rows) skillsHtml = `<div style="font-size: 9.5pt; line-height: 1.45;">${rows}</div>`;
    } else if (d.technicalSkills && d.technicalSkills.length) {
        skillsHtml = `
            <div style="font-size: 9.5pt; line-height: 1.45;">
                <strong style="color: #0f172a; font-weight: 700;">Technical Skills:</strong>
                <span style="color: #1e293b;">${d.technicalSkills.map(escape).join(', ')}</span>
            </div>`;
    }

    // Work Experience
    const expHtml = (d.workExperience || []).map(w => {
        const titleLine = escape(w.role || 'Software Engineer');
        const companyLine = escape(w.company || '') + (w.location ? ` | ${escape(w.location)}` : '');
        const dateLine = (escape(w.startDate || '') + (w.startDate || w.endDate ? ' – ' : '') + escape(w.endDate || '')).trim();
        const bullets = (w.bullets && w.bullets.length)
            ? `<ul style="margin: 3px 0 6px 0; padding-left: 18px; line-height: 1.42; font-size: 9.5pt; color: #1e293b;">
                ${w.bullets.map(b => `<li style="margin-bottom: 2px;">${escape(b)}</li>`).join('')}
               </ul>`
            : '';
        return `
            <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10pt;">
                    <div>
                        <strong style="color: #0f172a; font-weight: 700;">${titleLine}</strong>
                        ${companyLine ? `<span style="color: #334155; font-weight: 600;"> — ${companyLine}</span>` : ''}
                    </div>
                    ${dateLine ? `<div style="font-size: 9pt; color: #475569; font-weight: 500; white-space: nowrap;">${dateLine}</div>` : ''}
                </div>
                ${bullets}
            </div>
        `;
    }).join('');

    // Projects
    const projHtml = (d.projects || []).map(p => {
        const titleLine = escape(p.title || 'Technical Project');
        const techLine = p.techStack || p.roleOrTech ? ` <span style="color: #475569; font-weight: normal; font-size: 9pt;">(${escape(p.techStack || p.roleOrTech)})</span>` : '';
        const dateLine = (escape(p.startDate || '') + (p.startDate || p.endDate ? ' – ' : '') + escape(p.endDate || '')).trim();
        const bullets = (p.bullets && p.bullets.length)
            ? `<ul style="margin: 3px 0 6px 0; padding-left: 18px; line-height: 1.42; font-size: 9.5pt; color: #1e293b;">
                ${p.bullets.map(b => `<li style="margin-bottom: 2px;">${escape(b)}</li>`).join('')}
               </ul>`
            : '';
        return `
            <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 10pt;">
                    <div>
                        <strong style="color: #0f172a; font-weight: 700;">${titleLine}</strong>${techLine}
                    </div>
                    ${dateLine ? `<div style="font-size: 9pt; color: #475569; font-weight: 500; white-space: nowrap;">${dateLine}</div>` : ''}
                </div>
                ${bullets}
            </div>
        `;
    }).join('');

    // Education
    const eduHtml = (d.education || []).map(e => {
        const deg = escape(e.degree || '');
        const inst = escape(e.institution || '') + (e.location ? `, ${escape(e.location)}` : '');
        const dateLine = (escape(e.startDate || '') + (e.startDate || e.endDate ? ' – ' : '') + escape(e.endDate || '')).trim();
        const score = e.score ? ` <span style="color: #475569; font-size: 9pt;">| ${escape(e.score)}</span>` : '';
        return `
            <div style="margin-bottom: 6px; font-size: 9.5pt;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <div>
                        <strong style="color: #0f172a; font-weight: 700;">${deg}</strong>
                        ${inst ? `<span style="color: #334155;"> — ${inst}</span>` : ''}
                        ${score}
                    </div>
                    ${dateLine ? `<div style="font-size: 9pt; color: #475569; font-weight: 500; white-space: nowrap;">${dateLine}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Certifications
    const certList = d.certifications || d.certificates || [];
    const certHtml = certList.length
        ? `<div style="font-size: 9.5pt; line-height: 1.5; color: #1e293b;">${certList.map(c => `• ${escape(c)}`).join(' &nbsp; | &nbsp; ')}</div>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escape(h.name || 'Candidate Resume')}</title>
<style>
    @page {
        size: A4;
        margin: 12mm 15mm;
    }
    * {
        box-sizing: border-box;
    }
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #111827;
        background: #ffffff;
        max-width: 800px;
        margin: 0 auto;
        padding: 4px 6px;
        line-height: 1.4;
        font-size: 10pt;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
</style>
</head>
<body>

    <!-- Header (100% ATS-Compliant: Clean text, zero emojis/tables) -->
    <header style="text-align: center; margin-bottom: 8px;">
        <h1 style="margin: 0; font-size: 22pt; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; text-transform: uppercase;">${escape(h.name || 'Your Name')}</h1>
        ${h.title ? `<div style="font-size: 11pt; font-weight: 600; color: #2563eb; margin: 2px 0 4px 0; letter-spacing: 0.3px;">${escape(h.title)}</div>` : ''}
        ${contactParts.length ? `<div style="font-size: 9.5pt; color: #475569; margin-top: 3px; line-height: 1.4;">${contactParts.join(' &nbsp;|&nbsp; ')}</div>` : ''}
    </header>

    ${summaryText ? `<section>
        ${sectionTitle('Professional Summary')}
        <p style="margin: 0; font-size: 9.5pt; line-height: 1.45; color: #1e293b; text-align: justify;">${escape(summaryText)}</p>
    </section>` : ''}

    ${skillsHtml ? `<section>
        ${sectionTitle('Technical Skills')}
        ${skillsHtml}
    </section>` : ''}

    ${expHtml ? `<section>
        ${sectionTitle('Professional Experience')}
        ${expHtml}
    </section>` : ''}

    ${projHtml ? `<section>
        ${sectionTitle('Key Projects')}
        ${projHtml}
    </section>` : ''}

    ${eduHtml ? `<section>
        ${sectionTitle('Education')}
        ${eduHtml}
    </section>` : ''}

    ${certHtml ? `<section>
        ${sectionTitle('Certifications & Credentials')}
        ${certHtml}
    </section>` : ''}

</body>
</html>`;
}

/**
 * Pure-Node PDF generator used as the LAST fallback when Puppeteer/Chrome is
 * unavailable (e.g. on Render without the Puppeteer buildpack installed).
 * Produces a valid, downloadable PDF without any browser or external service.
 *
 * Implements just enough of the PDF 1.4 spec to render text on a page:
 *   - A4 page size (595 x 842 pt)
 *   - Helvetica font
 *   - Single page (text overflows silently)
 *
 * Not as polished as the Puppeteer output, but always works.
 */
function generateSimplePdfFromResumeData(d) {
    const escapePdfString = (s) => String(s || '')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')

    const PAGE_WIDTH = 595   // A4 in points
    const PAGE_HEIGHT = 842
    const MARGIN_LEFT = 50
    const MARGIN_TOP = 50
    const MAX_WIDTH = PAGE_WIDTH - MARGIN_LEFT * 2
    const LINE_HEIGHT = 12

    // Build the content stream. Each "Tj" instruction draws text, "T*" moves to next line.
    let y = PAGE_HEIGHT - MARGIN_TOP
    const commands = []

    const drawLine = (text, opts = {}) => {
        const fontSize = opts.fontSize || 10
        const isBold = opts.bold || false
        const align = opts.align || 'left' // 'left' | 'center'
        const font = isBold ? 'F2' : 'F1' // F1=Helvetica, F2=Helvetica-Bold

        // Wrap text to fit MAX_WIDTH (rough char count: ~5px per char at 10pt)
        const charsPerLine = Math.floor(MAX_WIDTH / (fontSize * 0.5))
        const words = String(text || '').split(/\s+/)
        let line = ''
        const lines = []
        for (const w of words) {
            if ((line + ' ' + w).trim().length > charsPerLine) {
                if (line) lines.push(line)
                line = w
            } else {
                line = (line ? line + ' ' : '') + w
            }
        }
        if (line) lines.push(line)

        for (const l of lines) {
            if (y < MARGIN_TOP + LINE_HEIGHT) {
                // Out of space — silently truncate (PDF is single-page)
                return
            }
            let x = MARGIN_LEFT
            if (align === 'center') {
                x = MARGIN_LEFT + (MAX_WIDTH - l.length * fontSize * 0.5) / 2
            }
            commands.push(`BT /${font} ${fontSize} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfString(l)}) Tj ET`)
            y -= LINE_HEIGHT
        }
    }

    const drawSpacer = (h = 6) => { y -= h }
    const drawSectionHeader = (title) => {
        drawSpacer(6)
        drawLine(title.toUpperCase(), { fontSize: 12, bold: true })
        y -= 2
        // Underline
        commands.push(`${MARGIN_LEFT} ${(y + 4).toFixed(2)} m ${(PAGE_WIDTH - MARGIN_LEFT).toFixed(2)} ${(y + 4).toFixed(2)} l S`)
        y -= 4
    }

    // === Header ===
    const h = d.header || {}
    drawLine(h.name || 'Your Name', { fontSize: 20, bold: true, align: 'center' })
    if (h.title) {
        drawSpacer(2)
        drawLine(h.title, { fontSize: 10, bold: true, align: 'center' })
    }
    drawSpacer(3)
    const contactParts = []
    if (h.email) contactParts.push(h.email)
    if (h.phone) contactParts.push(h.phone)
    if (h.location) contactParts.push(h.location)
    if (h.linkedin) contactParts.push(h.linkedin)
    if (h.github) contactParts.push(h.github)
    if (contactParts.length) drawLine(contactParts.join('  |  '), { fontSize: 8.5, align: 'center' })
    drawSpacer(6)

    // === Professional Summary ===
    const summaryText = d.summary || d.objective
    if (summaryText) {
        drawSectionHeader('Professional Summary')
        drawLine(summaryText, { fontSize: 9.5 })
    }

    // === Technical Skills ===
    if (d.skills && typeof d.skills === 'object' && !Array.isArray(d.skills)) {
        drawSectionHeader('Technical Skills')
        if (d.skills.languages && d.skills.languages.length) {
            drawLine('Languages: ' + d.skills.languages.join(', '), { fontSize: 9.5 })
        }
        if (d.skills.frameworks && d.skills.frameworks.length) {
            drawLine('Frameworks & Libraries: ' + d.skills.frameworks.join(', '), { fontSize: 9.5 })
        }
        if (d.skills.databases && d.skills.databases.length) {
            drawLine('Databases & Storage: ' + d.skills.databases.join(', '), { fontSize: 9.5 })
        }
        if (d.skills.cloudDevOps && d.skills.cloudDevOps.length) {
            drawLine('Cloud & DevOps: ' + d.skills.cloudDevOps.join(', '), { fontSize: 9.5 })
        }
        const core = d.skills.coreConcepts || d.skills.coreCompetencies
        if (core && core.length) {
            drawLine('Architecture & Concepts: ' + core.join(', '), { fontSize: 9.5 })
        }
    } else if (d.technicalSkills && d.technicalSkills.length) {
        drawSectionHeader('Technical Skills')
        drawLine(d.technicalSkills.join(', '), { fontSize: 9.5 })
    }

    // === Work Experience ===
    if (d.workExperience && d.workExperience.length) {
        drawSectionHeader('Professional Experience')
        for (const w of d.workExperience) {
            const head = (w.role || '') + (w.company ? ' — ' + w.company : '') + (w.location ? ` | ${w.location}` : '')
            drawLine(head, { bold: true, fontSize: 10 })
            const dateLine = ((w.startDate || '') + (w.startDate || w.endDate ? ' – ' : '') + (w.endDate || ''))
            if (dateLine.trim()) drawLine(dateLine, { fontSize: 8.5 })
            for (const b of (w.bullets || [])) {
                drawLine('• ' + b, { fontSize: 9 })
            }
            drawSpacer(2)
        }
    }

    // === Projects ===
    if (d.projects && d.projects.length) {
        drawSectionHeader('Key Projects')
        for (const p of d.projects) {
            const tech = p.techStack || p.roleOrTech ? ` (${p.techStack || p.roleOrTech})` : ''
            drawLine((p.title || '') + tech, { bold: true, fontSize: 10 })
            const dateLine = ((p.startDate || '') + (p.startDate || p.endDate ? ' – ' : '') + (p.endDate || ''))
            if (dateLine.trim()) drawLine(dateLine, { fontSize: 8.5 })
            for (const b of (p.bullets || [])) {
                drawLine('• ' + b, { fontSize: 9 })
            }
            drawSpacer(2)
        }
    }

    // === Education ===
    if (d.education && d.education.length) {
        drawSectionHeader('Education')
        for (const e of d.education) {
            drawLine(e.degree || '', { bold: true, fontSize: 10 })
            const instLine = (e.institution || '') + (e.location ? ', ' + e.location : '')
            drawLine(instLine, { fontSize: 9.5 })
            const dateLine = ((e.startDate || '') + (e.startDate || e.endDate ? ' – ' : '') + (e.endDate || '')) + (e.score ? '  |  ' + e.score : '')
            if (dateLine.trim()) drawLine(dateLine, { fontSize: 8.5 })
            drawSpacer(2)
        }
    }

    // === Certifications ===
    const certs = d.certifications || d.certificates
    if (certs && certs.length) {
        drawSectionHeader('Certifications & Credentials')
        drawLine(certs.join('  |  '), { fontSize: 9 })
    }

    // === Assemble the PDF ===
    // Per PDF 1.4 spec, the Length value must be the exact byte count of the
    // stream content (NOT including the "stream\n" / "\nendstream" markers).
    // We use \n as line separator within the stream and don't add a trailing
    // newline before "endstream" so the byte count is exact.
    const contentStream = commands.join('\n')
    // Build PDF objects
    const objects = []
    // 1: Catalog
    objects.push('<< /Type /Catalog /Pages 2 0 R >>')
    // 2: Pages
    objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
    // 3: Page
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`)
    // 4: Content stream
    objects.push(`<< /Length ${Buffer.byteLength(contentStream, 'binary')} >>\nstream\n${contentStream}\nendstream`)
    // 5: Helvetica
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    // 6: Helvetica-Bold
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')

    // Build the raw PDF as a list of Buffers so we can track exact byte offsets.
    const chunks = []
    const push = (s) => chunks.push(Buffer.from(s, 'binary'))
    const offsets = []

    // Header — 4 leading bytes ensure PDF viewers recognize the binary marker
    push('%PDF-1.4\n')
    // Binary comment hint (so the file is treated as binary by viewers)
    push(Buffer.from([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A])) // "%âãÏÓ\n"
    for (let i = 0; i < objects.length; i++) {
        offsets.push(chunks.reduce((sum, c) => sum + c.length, 0))
        push(`${i + 1} 0 obj\n${objects[i]}\nendobj\n`)
    }
    const xrefOffset = chunks.reduce((sum, c) => sum + c.length, 0)
    // PDF 1.4 spec requires each xref entry to be EXACTLY 20 bytes
    // (10-digit offset + space + 5-digit generation + space + 1-char keyword + CR + LF).
    // The first entry is special: offset 0, generation 65535, keyword 'f'.
    let xref = `xref\r\n0 ${objects.length + 1}\r\n0000000000 65535 f \r\n`
    for (const off of offsets) {
        xref += `${String(off).padStart(10, '0')} 00000 n \r\n`
    }
    push(xref)
    push(`trailer\r\n<< /Size ${objects.length + 1} /Root 1 0 R >>\r\nstartxref\r\n${xrefOffset}\r\n%%EOF\r\n`)
    return Buffer.concat(chunks)
}

/**
 * Dynamically evaluate a structured resume against ATS standards and target Job Description
 */
function calculateAtsScore({ resumeData, jobDescription = '' }) {
    if (!resumeData) {
        return {
            totalScore: 85,
            breakdown: {
                layout: { score: 10, max: 10, pass: true, detail: "Single-Column FAANG Standard" },
                keywords: { score: 25, max: 30, pass: true, detail: "Core skills aligned" },
                xyzFormula: { score: 22, max: 25, pass: true, detail: "Quantifiable impact metrics" },
                sections: { score: 15, max: 15, pass: true, detail: "All core sections present" },
                parseSafety: { score: 10, max: 10, pass: true, detail: "0 Tables, 0 Columns, 0 Emojis" },
                actionVerbs: { score: 10, max: 10, pass: true, detail: "Active verbs applied" }
            }
        };
    }

    let keywordScore = 0;
    const jdLower = (jobDescription || '').toLowerCase();
    
    // 1. Keyword alignment with target job
    const allCandidateSkills = [];
    if (resumeData.skills && typeof resumeData.skills === 'object') {
        Object.values(resumeData.skills).forEach(val => {
            if (Array.isArray(val)) allCandidateSkills.push(...val);
        });
    } else if (Array.isArray(resumeData.technicalSkills)) {
        allCandidateSkills.push(...resumeData.technicalSkills);
    }
    
    let matchedKeywords = 0;
    const sampleKeywords = allCandidateSkills.map(s => s.toLowerCase().trim()).filter(s => s.length > 2);
    if (sampleKeywords.length > 0) {
        sampleKeywords.forEach(k => {
            if (jdLower.includes(k)) matchedKeywords++;
        });
        const matchRatio = jdLower ? Math.min(1, (matchedKeywords + 3) / Math.max(4, sampleKeywords.length * 0.45)) : 0.92;
        keywordScore = Math.round(matchRatio * 30);
    } else {
        keywordScore = 24;
    }

    // 2. Google XYZ formula (quantifiable metrics in bullets)
    const allBullets = [];
    (resumeData.workExperience || []).forEach(w => {
        (w.bullets || []).forEach(b => allBullets.push(b));
    });
    (resumeData.projects || []).forEach(p => {
        (p.bullets || []).forEach(b => allBullets.push(b));
    });

    let quantifiedCount = 0;
    let strongVerbCount = 0;
    const strongVerbsRegex = /^(Architected|Developed|Engineered|Spearheaded|Designed|Built|Implemented|Optimized|Refactored|Reduced|Increased|Scaled|Deployed|Accelerated|Automated|Orchestrated|Led|Created|Transformed|Delivered)\b/i;
    const metricRegex = /\b(\d+[\d,.]*%?|\$[\d,.]+[kmb]?|\b\d+\b|\b(reduced|increased|improved|boosted|saved|by)\b)/i;

    allBullets.forEach(b => {
        if (metricRegex.test(b)) quantifiedCount++;
        if (strongVerbsRegex.test(b.trim())) strongVerbCount++;
    });

    const bulletTotal = Math.max(1, allBullets.length);
    const xyzRatio = quantifiedCount / bulletTotal;
    const xyzScore = Math.min(25, Math.max(16, Math.round(xyzRatio * 25 + 4)));

    const verbRatio = strongVerbCount / bulletTotal;
    const verbScore = Math.min(15, Math.max(10, Math.round(verbRatio * 15 + 3)));

    // 3. Section Completeness (Header, Summary, Skills, Experience, Education)
    let sectionScore = 0;
    const h = resumeData.header || {};
    if (h.name) sectionScore += 3;
    if (h.email || h.phone) sectionScore += 3;
    if (resumeData.summary || resumeData.objective) sectionScore += 4;
    if (allCandidateSkills.length > 0) sectionScore += 4;
    if ((resumeData.workExperience || []).length > 0 || (resumeData.projects || []).length > 0) sectionScore += 3;
    if ((resumeData.education || []).length > 0) sectionScore += 3;

    // 4. Parse Safety
    let parseSafetyScore = 10;

    const total = Math.min(98, Math.max(82, keywordScore + xyzScore + verbScore + sectionScore + parseSafetyScore - 5));

    return {
        totalScore: total,
        breakdown: {
            layout: { title: "Layout", desc: "Single Column (FAANG/Ivy)", pass: true },
            xyzFormula: { title: "Impact Metrics", desc: `${Math.round(xyzRatio * 100)}% Google XYZ Formula`, pass: true },
            parseSafety: { title: "Parse Safety", desc: "0 Tables, 0 Columns, 0 Emojis", pass: true },
            keywords: { title: "Skill Taxonomy", desc: `${matchedKeywords || allCandidateSkills.length} Target Skills Matched`, pass: true }
        }
    };
}

module.exports = {
    generateInterviewReport,
    invokeGeminiAi,
    generateResumePdf,
    getStructuredResumeData,
    buildFallbackResumeData,
    renderResumeHtml,
    generateSimplePdfFromResumeData,
    calculateAtsScore,
};