import { useState, useEffect } from 'react';
import { Building, X, Menu, ExternalLink, Info } from 'lucide-react';
// Custom hooks
import { usePublicationFilters } from './hooks/usePublicationFilters';
import { usePublicationData } from './hooks/usePublicationData';
import { useComputedMetrics } from './hooks/useComputedMetrics';
// View components
import { ChatbotWidget } from './components/ai/ChatbotWidget';
import { ChatContextProvider } from './components/ai/ChatContext';
import { PremiumOverview } from './components/views/PremiumOverview';
import { ExplorerView } from './components/views/ExplorerView';
import { TrendsView } from './components/views/TrendsView';
import { DomainsView } from './components/views/DomainsView';
import { MethodologyView } from './components/views/MethodologyView';
import { GapsView } from './components/views/GapsView';
import { BackendConnectionStatus } from './components/BackendConnectionStatus';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CardSkeleton, ChartSkeleton } from './components/ui/LoadingStates';
// Styles
import { applyTheme } from './styles/premium-theme';
import './styles/premium-global.css';

const AHRQDashboard = () => {
  // View navigation
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'explore' | 'explorer' | 'domains' | 'methodology' | 'gaps'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<any | null>(null);

  // Use custom hooks for data and filtering
  const filters = usePublicationFilters();
  const { publications, loading, dataSource } = usePublicationData();
  
  // Calculate items per page based on view mode
  const itemsPerPage = filters.viewMode === 'cards' ? 12 : 20;
  
  // Compute all metrics using the custom hook
  const metrics = useComputedMetrics({
    publications,
    loading,
    filters,
    itemsPerPage
  });

  // Apply premium theme on mount
  useEffect(() => {
    applyTheme();
  }, []);

  // Debug logging
  useEffect(() => {
    // console.log('[AHRQDashboard] Data source:', dataSource);
    // console.log('[AHRQDashboard] Publications count:', publications.length);
  }, [dataSource, publications]);

  // Handle filter changes for cross-domain analysis
  const handleDomainFilterChange = (domain: string) => {
    filters.setSelectedDomain(domain);
    if (activeView !== 'explorer') {
      setActiveView('explorer');
    }
  };

  const handleUsageTypeFilterChange = (usageType: string) => {
    const mappedUsageType = {
      'Primary Analysis': 'PRIMARY_ANALYSIS',
      'Research Enabler': 'RESEARCH_ENABLER',
      'Contextual Reference': 'CONTEXTUAL_REFERENCE'
    }[usageType] || usageType;
    
    filters.setSelectedUsageType(mappedUsageType);
    if (activeView !== 'explorer') {
      setActiveView('explorer');
    }
  };

  // Transform filters to match ChatContext expected format
  const chatContextFilters = {
    years: filters.selectedYear === 'all' 
      ? [2010, 2024] as [number, number]
      : [parseInt(filters.selectedYear), parseInt(filters.selectedYear)] as [number, number],
    publicationTypes: filters.selectedPubType === 'all' ? [] : [filters.selectedPubType],
    usageTypes: filters.selectedUsageType === 'all' ? [] : [filters.selectedUsageType],
    domains: filters.selectedDomain === 'all' ? [] : [filters.selectedDomain],
    authors: []
  };

  return (
    <ChatContextProvider
      publications={metrics.currentPublications}
      activeView={activeView as any}
      selectedFilters={chatContextFilters}
      onViewChange={setActiveView as any}
      onFilterChange={(newFilters) => {
        // Update filters based on the new filter structure
        if (newFilters.years && newFilters.years[0] !== newFilters.years[1]) {
          filters.setSelectedYear('all');
        } else if (newFilters.years) {
          filters.setSelectedYear(newFilters.years[0].toString());
        }
        if (newFilters.publicationTypes && newFilters.publicationTypes.length > 0) {
          filters.setSelectedPubType(newFilters.publicationTypes[0]);
        }
        if (newFilters.usageTypes && newFilters.usageTypes.length > 0) {
          filters.setSelectedUsageType(newFilters.usageTypes[0]);
        }
        if (newFilters.domains && newFilters.domains.length > 0) {
          filters.setSelectedDomain(newFilters.domains[0]);
        }
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <BackendConnectionStatus />
        <div className="max-w-[1800px] mx-auto p-4">
          {/* Header */}
          <header className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-blue-600 mr-3" />
                  <h1 className="text-2xl font-bold text-gray-800">
                    AHRQ Health Systems Research Compendium
                    {dataSource === 'hardcoded' && (
                      <span className="ml-2 text-sm font-normal text-orange-600">
                        (Sample Data)
                      </span>
                    )}
                  </h1>
                </div>
                <nav className="hidden lg:flex space-x-8">
                  {(['overview', 'explorer', 'trends', 'domains', 'methodology', 'gaps'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setActiveView(view)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        activeView === view
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </nav>
                <button
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden mt-4 bg-white rounded-lg shadow p-4">
                <nav className="space-y-2">
                  {(['overview', 'explorer', 'trends', 'domains', 'methodology', 'gaps'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => {
                        setActiveView(view);
                        setMobileMenuOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
                        activeView === view
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </header>

          {/* Loading State */}
          {loading && (
            <div className="space-y-6">
              <CardSkeleton count={4} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            </div>
          )}

          {/* Views */}
          {!loading && (
            <>
              {activeView === 'overview' && (
                <ErrorBoundary>
                  <PremiumOverview 
                    publications={publications}
                    yearData={metrics.yearData}
                    domainData={metrics.domainData}
                    usageData={metrics.usageData}
                    pubTypeData={metrics.pubTypeData}
                    loading={loading}
                    onNavigate={setActiveView}
                  />
                </ErrorBoundary>
              )}

              {activeView === 'explorer' && (
                <ExplorerView
                  publications={publications}
                  filteredPublications={metrics.filteredPublications}
                  currentPublications={metrics.currentPublications}
                  filters={filters}
                  setSearchQuery={filters.setSearchQuery}
                  setSelectedDomain={filters.setSelectedDomain}
                  setSelectedYear={filters.setSelectedYear}
                  setSelectedUsageType={filters.setSelectedUsageType}
                  setSelectedPubType={filters.setSelectedPubType}
                  setShowFilters={filters.setShowFilters}
                  setViewMode={filters.setViewMode}
                  setCurrentPage={filters.setCurrentPage}
                  toggleFilters={filters.toggleFilters}
                  resetFilters={filters.resetFilters}
                  totalPages={metrics.totalPages}
                  startIndex={metrics.startIndex}
                  endIndex={metrics.endIndex}
                  itemsPerPage={itemsPerPage}
                  selectedPublication={selectedPublication}
                  setSelectedPublication={setSelectedPublication}
                  usageTypeCounts={metrics.usageTypeCounts}
                />
              )}

              {activeView === 'trends' && (
                <TrendsView
                  filteredPublications={metrics.filteredPublications}
                  researchMomentum={metrics.researchMomentum}
                  emergingTopics={metrics.emergingTopics}
                  yearData={metrics.yearData}
                  pubTypeData={metrics.pubTypeData}
                  crossDomainData={metrics.crossDomainData}
                  domainStats={metrics.domainStats}
                  usageData={metrics.usageData}
                  domainData={metrics.domainData}
                  publicationsData={publications}
                  onDomainSelect={handleDomainFilterChange}
                  onUsageTypeSelect={handleUsageTypeFilterChange}
                />
              )}

              {activeView === 'domains' && (
                <DomainsView 
                  publicationsData={publications} 
                  domainData={metrics.domainData} 
                />
              )}

              {activeView === 'methodology' && <MethodologyView />}

              {activeView === 'gaps' && <GapsView />}
            </>
          )}

          {/* Publication Detail Modal */}
          {selectedPublication && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-900 pr-4">
                    {selectedPublication.title}
                  </h2>
                  <button
                    onClick={() => setSelectedPublication(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Publication metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Authors</h3>
                      <p className="text-gray-600">{selectedPublication.authors}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Publication Details</h3>
                      <p className="text-gray-600">
                        {selectedPublication.journal} ({selectedPublication.year})
                      </p>
                      <p className="text-sm text-gray-500">{selectedPublication.publisher}</p>
                    </div>
                  </div>

                  {/* Usage Information */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-3">AHRQ Compendium Usage</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-blue-700">Usage Type:</span>
                        <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedPublication.usage_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-700">Justification:</span>
                        <p className="mt-1 text-sm text-blue-900">{selectedPublication.usage_justification}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-700">Description:</span>
                        <p className="mt-1 text-sm text-blue-900">{selectedPublication.usage_description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Research Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Research Domain</h3>
                      <p className="text-gray-600">{selectedPublication.research_domain}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-2">Geographic Focus</h3>
                      <p className="text-gray-600">{selectedPublication.geographic_focus}</p>
                    </div>
                  </div>

                  {/* Key Findings */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Key Findings</h3>
                    <p className="text-gray-600">{selectedPublication.key_findings}</p>
                  </div>

                  {/* Policy Implications */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Policy Implications</h3>
                    <p className="text-gray-600">{selectedPublication.policy_implications}</p>
                  </div>

                  {/* Link */}
                  {selectedPublication.doi_url && (
                    <div className="pt-4 border-t">
                      <a
                        href={selectedPublication.doi_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Full Publication
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data Source Indicator */}
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
            <Info className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Data source: {dataSource === 'csv' ? 'Live CSV' : 'Sample Data'}
            </span>
          </div>

          {/* Chatbot Widget */}
          <ChatbotWidget />
        </div>
      </div>
    </ChatContextProvider>
  );
};

export default AHRQDashboard;