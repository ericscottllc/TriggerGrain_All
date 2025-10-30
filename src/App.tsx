import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LoadingSpinner } from './components/Core/LoadingSpinner';
import { LoginPage } from './components/Core/LoginPage';
import { PendingApprovalPage } from './components/Core/PendingApprovalPage';
import { Sidebar } from './components/Core/Sidebar';
import { CodeExplorer } from './CodeExplorer';
import { SchemaExplorer } from './SchemaExplorer';
import { DashboardPage } from './pages/dashboard';
import { GrainEntriesPage } from './pages/grainEntries';
import { SettingsPage } from './pages/settings';
import { BlogPostsPage } from './pages/blogPosts';
import { OnePagerPage } from './pages/onePager';
import { ReferencesPage } from './pages/references';
import { AnalyticsPage } from './pages/analytics';
import { ScenarioPage } from './pages/scenario';
import { ClientsPage } from './pages/clients';
import { ClientDashboardPage } from './pages/clients/ClientDashboardPage';

const AppContent: React.FC = () => {
  const { user, loading, isApproved } = useAuth();
  const [showCodeExplorer, setShowCodeExplorer] = React.useState(false);
  const [showSchemaExplorer, setShowSchemaExplorer] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        setShowCodeExplorer(true);
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        setShowSchemaExplorer(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!isApproved) {
    return <PendingApprovalPage />;
  }

  return (
    <>
      <motion.div
        className="flex h-screen bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Sidebar />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/grain-entries" element={<GrainEntriesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/blog-posts" element={<BlogPostsPage />} />
          <Route path="/one-pager" element={<OnePagerPage />} />
          <Route path="/references" element={<ReferencesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/scenario" element={<ScenarioPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:clientId" element={<ClientDashboardPage />} />
        </Routes>
      </motion.div>

      <AnimatePresence>
        {showCodeExplorer && (
          <CodeExplorer
            isOpen={showCodeExplorer}
            onClose={() => setShowCodeExplorer(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSchemaExplorer && (
          <SchemaExplorer
            isOpen={showSchemaExplorer}
            onClose={() => setShowSchemaExplorer(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
