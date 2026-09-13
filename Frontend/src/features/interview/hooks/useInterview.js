import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, deleteInterviewReport, getAtsResumeData } from "../services/interview.api"
import { useContext, useEffect, useCallback } from "react"
import { InterviewContext } from "../interview.context.jsx"
import { useParams } from "react-router"
import { API_URL } from "../../../config.js"

export const useInterview = () => {
    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const {
        loading,
        isGenerating,
        setIsGenerating,
        isFetchingReports,
        setIsFetchingReports,
        isFetchingReport,
        setIsFetchingReport,
        isDownloadingPdf,
        setIsDownloadingPdf,
        report,
        setReport,
        reports,
        setReports,
        error,
        setError
    } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setIsGenerating(true)
        setError(null)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
                // Prepend to reports list if loaded
                setReports(prev => [response.interviewReport, ...prev.filter(r => r._id !== response.interviewReport._id)])
            }
        } catch (err) {
            console.error("Failed to generate report:", err)
            const msg = err.response?.data?.message || err.message || "Failed to generate interview report"
            setError(msg)
            throw new Error(msg)
        } finally {
            setIsGenerating(false)
        }

        return response?.interviewReport
    }

    const getReportById = useCallback(async (id) => {
        const targetId = id || interviewId
        if (!targetId) return null
        setIsFetchingReport(true)
        setError(null)
        let response = null
        try {
            response = await getInterviewReportById(targetId)
            if (response && response.interviewReport) {
                setReport(response.interviewReport)
            }
        } catch (err) {
            console.error("Failed to fetch report by ID:", err)
            setError(err.response?.data?.message || "Failed to fetch interview report")
            setReport(null)
        } finally {
            setIsFetchingReport(false)
        }
        return response?.interviewReport
    }, [interviewId])

    const getReports = useCallback(async () => {
        setIsFetchingReports(true)
        setError(null)
        let response = null
        try {
            response = await getAllInterviewReports()
            if (response && response.interviewReports) {
                setReports(response.interviewReports)
            }
        } catch (err) {
            console.error("Failed to fetch all reports:", err)
            setError(err.response?.data?.message || "Failed to fetch interview reports")
        } finally {
            setIsFetchingReports(false)
        }

        return response?.interviewReports
    }, [])

    const deleteReport = async (id) => {
        try {
            await deleteInterviewReport(id)
            setReports(prev => prev.filter(r => r._id !== id))
            if (report && report._id === id) {
                setReport(null)
            }
        } catch (err) {
            console.error("Failed to delete report:", err)
            const msg = err.response?.data?.message || "Failed to delete report"
            setError(msg)
            throw new Error(msg)
        }
    }

    const getResumePdfUrl = (interviewReportId, inline = false) => {
        const id = interviewReportId || interviewId;
        if (!id) return "#";
        const token = localStorage.getItem("token") || "";
        const baseUrl = API_URL;
        return `${baseUrl}/api/interview/resume/pdf/${id}?token=${encodeURIComponent(token)}${inline ? '&view=inline' : ''}`;
    };

    /**
     * Native HTTP direct download:
     * Triggers the download directly from the Express backend via Content-Disposition: attachment.
     * The browser native download manager receives the server's clean filename (Resume_<Name>_<Title>.pdf)
     * and downloads it directly, bypassing in-memory JS blobs and completely eliminating the Chrome UUID filename issue!
     */
    const triggerDirectDownload = (interviewReportId) => {
        const id = interviewReportId || interviewId;
        if (!id) return;
        const downloadUrl = getResumePdfUrl(id, false);

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.src = downloadUrl;
        document.body.appendChild(iframe);

        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 30000);
    };

    const getResumePdf = async (interviewReportId) => {
        const id = interviewReportId || interviewId;
        if (!id) {
            setError("Missing interview id for resume download");
            return;
        }
        if (isDownloadingPdf) return;
        setIsDownloadingPdf(true);
        setError(null);
        try {
            triggerDirectDownload(id);
        } catch (err) {
            console.error("Failed to trigger direct resume download:", err);
            setError("Failed to download resume PDF");
        } finally {
            setTimeout(() => {
                setIsDownloadingPdf(false);
            }, 2500);
        }
    };

    const fetchAtsResumeData = async (interviewReportId) => {
        const id = interviewReportId || interviewId;
        if (!id) return null;
        try {
            const data = await getAtsResumeData(id);
            return data;
        } catch (err) {
            console.error("Failed to fetch ATS resume data:", err);
            return null;
        }
    };

    return {
        loading,
        isGenerating,
        isFetchingReports,
        isFetchingReport,
        isDownloadingPdf,
        report,
        reports,
        error,
        generateReport,
        getReportById,
        getReports,
        deleteReport,
        getResumePdf,
        getResumePdfUrl,
        triggerDirectDownload,
        fetchAtsResumeData,
        setError,
        setReport
    };
}