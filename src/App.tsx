import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useNavigation } from './hooks/useNavigation';
import { LoadingSpinner } from './components/Core/LoadingSpinner';
import { LoginPage } from './components/Core/LoginPage';
import { Sidebar } from './components/Core/Sidebar';
import { MainContent } from './components/Core/MainContent';
import { CodeExplorer } from './CodeExplorer';
import { SchemaExplorer } from './SchemaExplorer';
import { ReferencesPage } from './pages/references';
import { NavigationItem } from './types/navigation';

// Dynamic page component mapping
// Add new page components here to make them available for navigation
const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  'references': ReferencesPage,
  // Add more page components here as they are created
  // 'dashboard': DashboardPage,
  // 'grain-entries': GrainEntriesPage,
  // 'analytics': AnalyticsPage,
};

// Helper function to normalize navigation item titles to component keys
const normalizeTitle = (title: string): string => {
  return title.toLowerCase().replace(/\s+/g, '-');
};
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { navigationItems } = useNavigation();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [showCodeExplorer, setShowCodeExplorer] = useState(false);
  const [showSchemaExplorer, setShowSchemaExplorer] = useState(false);

  // Hidden keyboard shortcut to open code explorer
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+C (or Cmd+Shift+C on Mac) to open code explorer
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        setShowCodeExplorer(true);
      }
      // Ctrl+Shift+S (or Cmd+Shift+S on Mac) to open schema explorer
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

  // Find the active navigation item
  const activeNavItem = navigationItems.find(item => item.id === activeItem) || 
                       navigationItems.find(item => item.title.toLowerCase().replace(/\s+/g, '-') === activeItem) ||
                       navigationItems[0] || null;

  const handleItemClick = (item: NavigationItem) => {
    setActiveItem(item.id);
  };

  const handleNavigate = (subdomain: string, shouldRedirect: boolean) => {
    if (shouldRedirect) {
      // In production, this would redirect to the actual subdomain
      console.log(`Redirecting to: https://${subdomain}`);
      // window.location.href = `https://${subdomain}`;
      
      // For demo purposes, show an alert
      alert(`This would redirect to: https://${subdomain}\n\nIn production, each subdomain would be a separate deployment of this framework with app-specific content.`);
    } else {
      // Show local content - no redirect needed
      console.log(`Showing local content for: ${activeNavItem?.title}`);
    }
  };

  // Check if we're on the target site for a redirect_active navigation item
  const isOnTargetSite = (item: NavigationItem): boolean => {
    const currentHost = window.location.hostname;
    const targetHost = item.subdomain.replace(/^https?:\/\//, '');
    return currentHost === targetHost;
  };

  // If we're on the target site and it has redirect_active=true, 
  // don't show the navigation framework - let the real site content show
  if (activeNavItem?.redirect_active && isOnTargetSite(activeNavItem)) {
    // Return minimal structure - just the real site content will show
    return (
      <div className="min-h-screen">
        {/* The actual site content will be rendered by the real application */}
        {/* This framework gets out of the way */}
      </div>
    );
  }

  // Dynamic page component selection
  const getPageComponent = (): React.ComponentType | null => {
    if (!activeNavItem || activeNavItem.redirect_active) {
      return null; // Use MainContent for redirect items or when no active item
    }
    
    const normalizedTitle = normalizeTitle(activeNavItem.title);
    return PAGE_COMPONENTS[normalizedTitle] || null;
  };

  const PageComponent = getPageComponent();

  // If we have a specific page component, render it with the sidebar
  if (PageComponent) {
    return (
      <>
        <motion.div
          className="flex h-screen bg-gray-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Sidebar activeItem={activeItem} onItemClick={handleItemClick} />
          <PageComponent />
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
  }
  // Default: render MainContent for redirect items or fallback
  return (
    <>
      <motion.div
        className="flex h-screen bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Sidebar activeItem={activeItem} onItemClick={handleItemClick} />
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <MainContent activeNavItem={activeNavItem} onNavigate={handleNavigate} />
          </motion.div>
        </AnimatePresence>
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