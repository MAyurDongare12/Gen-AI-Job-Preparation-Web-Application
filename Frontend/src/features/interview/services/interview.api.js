import api from "../../../services/apiClient";

/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription || "");
    if (resumeFile) {
        formData.append("resume", resumeFile);
    }

    const response = await api.post("/api/interview/", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return response.data;
};

/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`);
    return response.data;
};

/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/");
    return response.data;
};

/**
 * @description Service to delete an interview report by interviewId.
 */
export const deleteInterviewReport = async (interviewId) => {
    const response = await api.delete(`/api/interview/report/${interviewId}`);
    return response.data;
};

/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    const response = await api.get(`/api/interview/resume/pdf/${interviewReportId}`, {
        responseType: "blob"
    });

    return response.data;
};

/**
 * @description Service to get parsed ATS structured resume data and score metrics
 */
export const getAtsResumeData = async (interviewReportId) => {
    const response = await api.get(`/api/interview/resume/ats/${interviewReportId}`);
    return response.data;
};

/**
 * @description Service to evaluate candidate spoken/written mock answer with AI personas
 */
export const evaluateMockAnswerApi = async ({ interviewReportId, persona, question, answer, history, targetRole }) => {
    const response = await api.post("/api/interview/mock/evaluate", {
        interviewReportId,
        persona,
        question,
        answer,
        history,
        targetRole
    });
    return response.data;
};

/**
 * @description Service to grade behavioral response using STAR method & Google XYZ formula
 */
export const gradeStarAnswerApi = async ({ question, answer, targetRole }) => {
    const response = await api.post("/api/interview/star/evaluate", {
        question,
        answer,
        targetRole
    });
    return response.data;
};

/**
 * @description Service to simulate salary negotiation, market benchmark, and counter-offer drafting
 */
export const simulateSalaryNegotiationApi = async ({ role, location, yoe, currentOffer, userMessage, history }) => {
    const response = await api.post("/api/interview/salary/negotiate", {
        role,
        location,
        yoe,
        currentOffer,
        userMessage,
        history
    });
    return response.data;
};

/**
 * @description Service to retrieve Company Insider & Culture DNA Dossier
 */
export const getCompanyIntelligenceApi = async ({ companyName, role }) => {
    const response = await api.post("/api/interview/company/intelligence", {
        companyName,
        role
    });
    return response.data;
};

/**
 * @description Service to audit GitHub repo / portfolio from Staff Engineer lens
 */
export const auditPortfolioApi = async ({ repoUrl, codeSnippet, projectDescription, targetRole }) => {
    const response = await api.post("/api/interview/portfolio/audit", {
        repoUrl,
        codeSnippet,
        projectDescription,
        targetRole
    });
    return response.data;
};

/**
 * @description Service to generate high-converting referral outreach campaigns
 */
export const generateReferralOutreachApi = async ({ candidateBackground, targetCompany, targetRole, recipientType, hookDetails }) => {
    const response = await api.post("/api/interview/referral/outreach", {
        candidateBackground,
        targetCompany,
        targetRole,
        recipientType,
        hookDetails
    });
    return response.data;
};