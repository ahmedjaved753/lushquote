import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import TemplateBuilder from "./TemplateBuilder";

import QuoteForm from "./QuoteForm";

import QuoteManagement from "./QuoteManagement";

import Settings from "./Settings";

import Unauthorized from "./Unauthorized";

// Auth components
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import AuthCallback from "./auth/AuthCallback";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const PAGES = {
    
    Dashboard: Dashboard,
    
    TemplateBuilder: TemplateBuilder,
    
    QuoteForm: QuoteForm,
    
    QuoteManagement: QuoteManagement,
    
    Settings: Settings,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Routes>
            {/* Public auth routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected app routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/Dashboard" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/TemplateBuilder" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <TemplateBuilder />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/QuoteForm" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <QuoteForm />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/QuoteManagement" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <QuoteManagement />
                    </Layout>
                </ProtectedRoute>
            } />
            
            <Route path="/Settings" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Settings />
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}