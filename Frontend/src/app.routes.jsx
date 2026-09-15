import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import Protected from "./features/auth/components/Protected";
import AppLayout from "./components/AppLayout";
import NotFound from "./components/NotFound";

// Code-split route components for ultra-fast initial page loads
const LandingPage = lazy(() => import("./features/landing/pages/LandingPage"));
const Home = lazy(() => import("./features/interview/pages/Home"));
const Interview = lazy(() => import("./features/interview/pages/interview"));
const SalaryWarRoom = lazy(() => import("./features/salary/pages/SalaryWarRoom"));
const CompanyIntelligence = lazy(() => import("./features/company/pages/CompanyIntelligence"));
const PortfolioAuditor = lazy(() => import("./features/portfolio/pages/PortfolioAuditor"));
const ReferralEngine = lazy(() => import("./features/networking/pages/ReferralEngine"));
const Login = lazy(() => import("./features/auth/pages/Login"));
const Register = lazy(() => import("./features/auth/pages/Register"));

const RouteSuspense = ({ children }) => (
  <Suspense
    fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: '#38bdf8',
        fontSize: '0.9rem',
        fontWeight: 600,
        gap: '0.75rem'
      }}>
        <div style={{
          width: '22px',
          height: '22px',
          border: '2px solid rgba(56, 189, 248, 0.2)',
          borderTopColor: '#38bdf8',
          borderRadius: '50%',
          animation: 'spin 0.6s linear infinite'
        }} />
        <span>Loading Experience...</span>
      </div>
    }
  >
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <RouteSuspense>
        <Login />
      </RouteSuspense>
    )
  },
  {
    path: "/register",
    element: (
      <RouteSuspense>
        <Register />
      </RouteSuspense>
    )
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <RouteSuspense>
            <LandingPage />
          </RouteSuspense>
        )
      },
      {
        path: "dashboard",
        element: (
          <Protected>
            <RouteSuspense>
              <Home />
            </RouteSuspense>
          </Protected>
        )
      },
      {
        path: "interview/:interviewId",
        element: (
          <Protected>
            <RouteSuspense>
              <Interview />
            </RouteSuspense>
          </Protected>
        )
      },
      {
        path: "salary-war-room",
        element: (
          <Protected>
            <RouteSuspense>
              <SalaryWarRoom />
            </RouteSuspense>
          </Protected>
        )
      },
      {
        path: "company-intelligence",
        element: (
          <Protected>
            <RouteSuspense>
              <CompanyIntelligence />
            </RouteSuspense>
          </Protected>
        )
      },
      {
        path: "portfolio-auditor",
        element: (
          <Protected>
            <RouteSuspense>
              <PortfolioAuditor />
            </RouteSuspense>
          </Protected>
        )
      },
      {
        path: "referral-engine",
        element: (
          <Protected>
            <RouteSuspense>
              <ReferralEngine />
            </RouteSuspense>
          </Protected>
        )
      }
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
]);