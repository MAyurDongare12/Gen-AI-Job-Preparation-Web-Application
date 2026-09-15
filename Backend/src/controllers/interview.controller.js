const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const { generateInterviewReport, generateResumePdf, getStructuredResumeData, calculateAtsScore, evaluateMockAnswer, gradeStarAnswer, simulateSalaryNegotiation, getCompanyIntelligence, auditPortfolio, generateReferralOutreach } = require('../services/ai.service');
const interviewReportModel = require("../models/interviewReport.model");
const userModel = require("../models/user.model");

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */

async function generateInterviewReportController(req, res) {
    try {
        let resumeText = ""
        if (req.file) {
            try {
                const resumeContent = await pdfParse(req.file.buffer)
                resumeText = resumeContent.text
            } catch (pdfErr) {
                console.error("Error parsing PDF:", pdfErr);
                return res.status(400).json({
                    message: "Failed to parse the uploaded resume PDF. Please upload a text-based PDF (not a scanned image).",
                    error: pdfErr.message
                })
            }
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database is temporarily unavailable. Please try again in a moment."
            })
        }

        let { selfDescription, jobDescription } = req.body

        // Trim and treat empty strings as missing
        selfDescription = (selfDescription || '').trim()
        jobDescription = (jobDescription || '').trim()

        // Per the UI: "Either a Resume or a Self Description is required."
        // The job description is treated as the *target role* and is always required.
        if (!jobDescription) {
            return res.status(400).json({
                message: "Please paste the target job description in the left panel — it is required to tailor the interview plan."
            })
        }
        if (!selfDescription && !resumeText.trim()) {
            return res.status(400).json({
                message: "Please either upload a resume or fill in the self-description field."
            })
        }
        // If the user provided only one of resume / self-description, derive the other
        // so the AI still has something to work with.
        if (!selfDescription) selfDescription = "No self description provided."
        if (!resumeText.trim()) resumeText = "No resume provided."

        console.log("🔄 Calling generateInterviewReport with:", {
            resumeLength: resumeText.length,
            selfDescriptionLength: selfDescription.length,
            jobDescriptionLength: jobDescription.length
        })

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        console.log("✅ Generated report structure:", Object.keys(interviewReportByAi))

        const interviewReport = await interviewReportModel.create({
            user: new mongoose.Types.ObjectId(req.user.id),
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interviewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully",
            interviewReport
        })
    } catch (error) {
        console.error("❌ Error in generateInterviewReportController:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            message: "Failed to generate interview report",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database is temporarily unavailable. Please try again in a moment."
            })
        }

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: new mongoose.Types.ObjectId(req.user.id) })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }
        res.status(200).json({
            message: "Interview report fetched successfully",
            interviewReport
        })
    } catch (error) {
        console.error("Error in getInterviewReportByIdController:", error);
        res.status(500).json({
            message: "Failed to fetch interview report",
            error: error.message
        });
    }
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database is temporarily unavailable. Please try again in a moment."
            })
        }

        const interviewReports = await interviewReportModel.find({ user: new mongoose.Types.ObjectId(req.user.id) })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")
            .sort({ createdAt: -1 })

        res.status(200).json({
            message: "Interview reports fetched successfully",
            interviewReports
        })
    } catch (error) {
        console.error("Error in getAllInterviewReportsController:", error);
        res.status(500).json({
            message: "Failed to fetch interview reports",
            error: error.message
        });
    }
}


/**
 * @description Controller to genrate resume Pdf based on user self description, resume and job Description. 
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params;

        // Pre-flight: database must be connected
        if (mongoose.connection.readyState !== 1) {
            console.error('MongoDB not connected. readyState:', mongoose.connection.readyState);
            return res.status(503).json({
                message: "Database is temporarily unavailable. Please try again in a moment."
            });
        }

        const userId = req.user?.id || req.user?._id;
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: new mongoose.Types.ObjectId(userId)
        });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found or unauthorized"
            });
        }

        const { resume, jobDescription, selfDescription } = interviewReport;

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription });

        let candidateName = '';
        if (userId) {
            const userDoc = await userModel.findById(userId).select('username');
            if (userDoc && userDoc.username) {
                candidateName = userDoc.username.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
            }
        }
        const rawTitle = interviewReport.title || 'Software_Engineer';
        const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').slice(0, 35) || interviewReportId;
        const namePrefix = candidateName ? `${candidateName}_` : '';
        const filename = `Resume_${namePrefix}${cleanTitle}.pdf`;
        const disposition = req.query?.view === 'inline' ? 'inline' : 'attachment';

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.end(pdfBuffer);
    } catch (error) {
        console.error("❌ Error in generateResumePdfController:", error && error.message);
        if (error && error.name === 'CastError') {
            return res.status(404).json({ message: "Interview report not found" });
        }
        res.status(500).json({
            message: "Failed to generate resume PDF",
            error: error.message
        });
    }
}

/**
 * @description Controller to delete an interview report by interviewId.
 */
async function deleteInterviewReportController(req, res) {
    try {
        const { interviewId } = req.params;

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database is temporarily unavailable. Please try again in a moment."
            });
        }

        const userId = req.user?.id || req.user?._id;
        const deletedReport = await interviewReportModel.findOneAndDelete({
            _id: interviewId,
            user: new mongoose.Types.ObjectId(userId)
        });

        if (!deletedReport) {
            return res.status(404).json({
                message: "Interview report not found or unauthorized."
            });
        }

        res.status(200).json({
            message: "Interview report deleted successfully",
            deletedId: interviewId
        });
    } catch (error) {
        console.error("Error in deleteInterviewReportController:", error);
        res.status(500).json({
            message: "Failed to delete interview report",
            error: error.message
        });
    }
}

/**
 * @description Controller to get parsed ATS structured resume data and ATS score breakdown
 */
async function getAtsResumeDataController(req, res) {
    try {
        const { interviewReportId } = req.params;

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database is temporarily unavailable. Please try again in a moment."
            });
        }

        const userId = req.user?.id || req.user?._id;
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: new mongoose.Types.ObjectId(userId)
        });

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found or unauthorized"
            });
        }

        const { resume, jobDescription, selfDescription } = interviewReport;
        const resumeData = await getStructuredResumeData({ resume, jobDescription, selfDescription });
        const atsEvaluation = calculateAtsScore({ resumeData, jobDescription });

        res.status(200).json({
            message: "ATS resume data retrieved successfully",
            resumeData,
            atsScore: atsEvaluation.totalScore,
            atsBreakdown: atsEvaluation.breakdown
        });
    } catch (error) {
        console.error("Error in getAtsResumeDataController:", error);
        res.status(500).json({
            message: "Failed to retrieve ATS resume data",
            error: error.message
        });
    }
}

/**
 * @description Controller to evaluate a mock interview answer and generate persona-specific feedback & follow-ups
 */
async function evaluateMockAnswerController(req, res) {
    try {
        const { interviewReportId, persona, question, answer, history, targetRole } = req.body;

        if (!question || !answer) {
            return res.status(400).json({
                message: "Both question and answer are required for evaluation"
            });
        }

        let resolvedRole = targetRole || 'Software Engineer';

        // Optionally pull role title from interview report if available
        if (interviewReportId && mongoose.Types.ObjectId.isValid(interviewReportId) && mongoose.connection.readyState === 1) {
            try {
                const report = await interviewReportModel.findById(interviewReportId).select('title');
                if (report && report.title) {
                    resolvedRole = report.title;
                }
            } catch (err) {
                console.warn("Could not find report for role resolution:", err.message);
            }
        }

        const evaluation = await evaluateMockAnswer({
            persona: persona || 'bar_raiser',
            question,
            answer,
            history: Array.isArray(history) ? history : [],
            targetRole: resolvedRole
        });

        res.status(200).json({
            message: "Mock answer evaluated successfully",
            evaluation
        });
    } catch (error) {
        console.error("Error in evaluateMockAnswerController:", error);
        res.status(500).json({
            message: "Failed to evaluate mock answer",
            error: error.message
        });
    }
}

/**
 * @description Controller to evaluate a behavioral answer against STAR methodology and Google XYZ formula
 */
async function gradeStarAnswerController(req, res) {
    try {
        const { question, answer, targetRole } = req.body;

        if (!question || !answer) {
            return res.status(400).json({
                message: "Both question and answer are required for STAR evaluation"
            });
        }

        const evaluation = await gradeStarAnswer({
            question,
            answer,
            targetRole: targetRole || 'Software Engineer'
        });

        res.status(200).json({
            message: "STAR answer evaluated successfully",
            evaluation
        });
    } catch (error) {
        console.error("Error in gradeStarAnswerController:", error);
        res.status(500).json({
            message: "Failed to evaluate STAR answer",
            error: error.message
        });
    }
}

/**
 * @description Controller to simulate salary negotiation, market benchmarking, and counter-offer drafting
 */
async function salaryNegotiationController(req, res) {
    try {
        const { role, location, yoe, currentOffer, userMessage, history } = req.body;

        const result = await simulateSalaryNegotiation({
            role: role || 'Software Engineer',
            location: location || 'San Francisco, CA / Remote',
            yoe: Number(yoe) || 4,
            currentOffer: currentOffer || {},
            userMessage: userMessage || '',
            history: Array.isArray(history) ? history : []
        });

        res.status(200).json({
            message: "Salary negotiation simulated successfully",
            data: result
        });
    } catch (error) {
        console.error("Error in salaryNegotiationController:", error);
        res.status(500).json({
            message: "Failed to simulate salary negotiation",
            error: error.message
        });
    }
}

/**
 * @description Controller to get company insider interview loop breakdown & culture DNA
 */
async function getCompanyIntelligenceController(req, res) {
    try {
        const { companyName, role } = req.body;

        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required for intelligence dossier"
            });
        }

        const data = await getCompanyIntelligence({
            companyName,
            role: role || 'Software Engineer'
        });

        res.status(200).json({
            message: "Company intelligence retrieved successfully",
            data
        });
    } catch (error) {
        console.error("Error in getCompanyIntelligenceController:", error);
        res.status(500).json({
            message: "Failed to retrieve company intelligence",
            error: error.message
        });
    }
}

/**
 * @description Controller to audit GitHub portfolio and code from a Staff Engineer lens
 */
async function auditPortfolioController(req, res) {
    try {
        const { repoUrl, codeSnippet, projectDescription, targetRole } = req.body;

        const auditResult = await auditPortfolio({
            repoUrl: repoUrl || '',
            codeSnippet: codeSnippet || '',
            projectDescription: projectDescription || '',
            targetRole: targetRole || 'Senior Full Stack Engineer'
        });

        res.status(200).json({
            message: "Portfolio audited successfully",
            data: auditResult
        });
    } catch (error) {
        console.error("Error in auditPortfolioController:", error);
        res.status(500).json({
            message: "Failed to audit portfolio",
            error: error.message
        });
    }
}

/**
 * @description Controller to generate 3-tier referral outreach campaigns
 */
async function generateReferralOutreachController(req, res) {
    try {
        const { candidateBackground, targetCompany, targetRole, recipientType, hookDetails } = req.body;

        if (!targetCompany) {
            return res.status(400).json({
                message: "Target company is required"
            });
        }

        const outreachPlan = await generateReferralOutreach({
            candidateBackground: candidateBackground || '',
            targetCompany,
            targetRole: targetRole || 'Software Engineer',
            recipientType: recipientType || 'all',
            hookDetails: hookDetails || ''
        });

        res.status(200).json({
            message: "Referral outreach generated successfully",
            data: outreachPlan
        });
    } catch (error) {
        console.error("Error in generateReferralOutreachController:", error);
        res.status(500).json({
            message: "Failed to generate referral outreach",
            error: error.message
        });
    }
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    deleteInterviewReportController,
    getAtsResumeDataController,
    evaluateMockAnswerController,
    gradeStarAnswerController,
    salaryNegotiationController,
    getCompanyIntelligenceController,
    auditPortfolioController,
    generateReferralOutreachController
};