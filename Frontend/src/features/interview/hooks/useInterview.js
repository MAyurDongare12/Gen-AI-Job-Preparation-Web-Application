import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports, error, setError } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("Failed to generate report:", error)
            setError(error.response?.data?.message || "Failed to generate interview report")
        } finally {
            setLoading(false)
        }

        return response?.interviewReport
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
            }
        } catch (error) {
            console.error("Failed to fetch report by ID:", error)
            setError(error.response?.data?.message || "Failed to fetch interview report")
        } finally {
            setLoading(false)
        }
        return response?.interviewReport
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            if (response && response.interviewReports) {
                setReports(response.interviewReports)
            }
        } catch (error) {
            console.error("Failed to fetch all reports:", error)
            setError(error.response?.data?.message || "Failed to fetch interview reports")
        } finally {
            setLoading(false)
        }

        return response?.interviewReports
    }

    const getResumePdf = async (interviewReportId) => {
        if (!interviewReportId) {
            setError("Missing interview id for resume download")
            return
        }
        if (loading) return // already in flight, ignore re-clicks
        setLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            console.log("PDF Response:", response, "Type:", response.type)

            // response is already a Blob from axios with responseType: 'blob'
            if (!response || !(response instanceof Blob)) {
                throw new Error("Response is not a valid blob")
            }

            const url = window.URL.createObjectURL(response)
            const link = document.createElement("a")
            link.style.display = "none"
            link.href = url
            link.download = `resume_${interviewReportId}.pdf`
            document.body.appendChild(link)
            link.click()

            // Clean up after browser initiates the download
            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }, 200)
        }
        catch (error) {
            console.error("Failed to download resume PDF:", error)
            setError(error.response?.data?.message || "Failed to download resume PDF")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [interviewId])

    return { loading, report, reports, error, generateReport, getReportById, getReports, getResumePdf, setError }

}