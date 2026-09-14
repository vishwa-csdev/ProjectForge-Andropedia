import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectCreate = lazy(() => import('./pages/ProjectCreate'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const TaskBoard = lazy(() => import('./pages/TaskBoard'));
const ResourceLibrary = lazy(() => import('./pages/ResourceLibrary'));
const ContributionLog = lazy(() => import('./pages/ContributionLog'));
const ReportView = lazy(() => import('./pages/ReportView'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI exception in component tree:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center p-6 text-center text-[#F1F5F9] font-sans">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold font-mono tracking-wider text-[#00F0FF] mb-2 uppercase">
            Telemetry Rendering Interrupted
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-md mb-6 leading-relaxed">
            An unexpected error occurred while rendering this interface.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              className="px-4 py-2 rounded-xl bg-[#00F0FF] text-[#070913] font-bold text-xs font-mono uppercase tracking-wider cursor-pointer hover:brightness-110"
            >
              Return to Deck
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10"
            >
              Reload Interface
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#070913] text-[#94A3B8] font-mono text-sm">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF] animate-pulse" />
      <span>Loading Telemetry Deck...</span>
    </div>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
            <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
            
            <Route path="/projects" element={<Layout><ProjectList /></Layout>} />
            <Route path="/projects/new" element={<Layout><ProjectCreate /></Layout>} />
            <Route path="/projects/:id" element={<Layout><ProjectDetail /></Layout>} />
            <Route path="/projects/:id/tasks" element={<Layout><TaskBoard /></Layout>} />
            <Route path="/projects/:id/resources" element={<Layout><ResourceLibrary /></Layout>} />
            <Route path="/projects/:id/contributions" element={<Layout><ContributionLog /></Layout>} />
            <Route path="/projects/:id/report" element={<Layout><ReportView /></Layout>} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
