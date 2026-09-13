import { createContext,useState } from "react";


export const InterviewContext = createContext()

export const InterviewProvider = ({ children }) => {
    const [isGenerating, setIsGenerating] = useState(false)
    const [isFetchingReports, setIsFetchingReports] = useState(false)
    const [isFetchingReport, setIsFetchingReport] = useState(false)
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])
    const [error, setError] = useState(null)

    // Composite loading for backwards compatibility
    const loading = isGenerating || isFetchingReport

    return (
        <InterviewContext.Provider value={{
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
        }}>
            {children}
        </InterviewContext.Provider>
    )
}