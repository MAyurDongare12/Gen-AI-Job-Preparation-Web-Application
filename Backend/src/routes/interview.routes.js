const express= require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()

/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description
 * @access private
 */

interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterviewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)

/**
 * @route GET /api/interview
 * @description get all interview reports of logged in user.
 * @ access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)

interviewRouter.get("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)
interviewRouter.get("/resume/ats/:interviewReportId", authMiddleware.authUser, interviewController.getAtsResumeDataController)

/**
 * @route DELETE /api/interview/report/:interviewId
 * @description Delete an interview report by interviewId
 * @access private
 */
interviewRouter.delete("/report/:interviewId", authMiddleware.authUser, interviewController.deleteInterviewReportController);

/**
 * @route POST /api/interview/mock/evaluate
 * @description Evaluate candidate oral answer in mock interview and generate persona feedback
 * @access private
 */
interviewRouter.post("/mock/evaluate", authMiddleware.authUser, interviewController.evaluateMockAnswerController);

/**
 * @route POST /api/interview/star/evaluate
 * @description Evaluate behavioral answer using STAR framework and Google XYZ formula
 * @access private
 */
interviewRouter.post("/star/evaluate", authMiddleware.authUser, interviewController.gradeStarAnswerController);

/**
 * @route POST /api/interview/salary/negotiate
 * @description Simulate salary negotiation round with market benchmark and counter-offer email
 * @access private
 */
interviewRouter.post("/salary/negotiate", authMiddleware.authUser, interviewController.salaryNegotiationController);

/**
 * @route POST /api/interview/company/intelligence
 * @description Get company insider interview loop breakdown & culture DNA
 * @access private
 */
interviewRouter.post("/company/intelligence", authMiddleware.authUser, interviewController.getCompanyIntelligenceController);

/**
 * @route POST /api/interview/portfolio/audit
 * @description Audit candidate GitHub repository and architecture from Staff Engineer perspective
 * @access private
 */
interviewRouter.post("/portfolio/audit", authMiddleware.authUser, interviewController.auditPortfolioController);

/**
 * @route POST /api/interview/referral/outreach
 * @description Generate high-converting 3-tier networking & referral outreach scripts
 * @access private
 */
interviewRouter.post("/referral/outreach", authMiddleware.authUser, interviewController.generateReferralOutreachController);

module.exports = interviewRouter;

