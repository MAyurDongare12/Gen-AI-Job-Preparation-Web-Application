const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const { generateInterviewReport, generateResumePdf } = require('../services/ai.service');
const interviewReportModel = require("../models/interviewReport.model")

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
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found"
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.contentType("application/pdf")
        res.setHeader("Content-Disposition", `attachment; filename=resume_${interviewReportId}.pdf`)
        res.setHeader("Content-Length", pdfBuffer.length)
        res.end(pdfBuffer)
    } catch (error) {
        console.error("Error in generateResumePdfController:", error);
        res.status(500).json({
            message: "Failed to generate resume PDF",
            error: error.message
        });
    }
}
module.exports = { generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }