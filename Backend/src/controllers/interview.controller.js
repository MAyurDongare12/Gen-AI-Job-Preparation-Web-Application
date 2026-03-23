const pdfParse = require('pdf-parse');
const {generateInterviewReport, generateResumePdf} = require('../services/ai.service');
const interviewReportModel = require("../models/interviewReport.model")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */

async function generateInterviewReportController(req, res) {
    try {
        let resumeText = ""
        if (req.file) {
            const pdfParse = require('pdf-parse');
            const resumeContent = await pdfParse(req.file.buffer)
            resumeText = resumeContent.text
        }

        const { selfDescription, jobDescription } = req.body

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
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
        console.error("Error in generateInterviewReportController:", error);
        res.status(500).json({
            message: "Failed to generate interview report",
            error: error.message
        });
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }
    res.status(200).json({
        message: "Interview report fetched successfully",
        interviewReport
    })

}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id })
        .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")
        .sort({ createdAt: -1 })

    res.status(200).json({
        message: "Interview reports fetched successfully",
        interviewReports
    })
}


/**
 * @description Controller to genrate resume Pdf based on user self description, resume and job Description. 
 */
async function generateResumePdfController(req, res) {
    const {interviewReportId} = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if(!interviewReport) {
        return res.status(404).json({
            messgae: "Interview report not found"
        })
    }

    const {resume, jobDescription, selfDescription} = interviewReport

    const pdfBuffer= await generateResumePdf({ resume, jobDescription, selfDescription})

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment: filename=resume_${interviewReportId}.pdf`

    })
    res.send(pdfBuffer)
}
module.exports = { generateInterviewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }