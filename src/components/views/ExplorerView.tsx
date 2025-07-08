import React from 'react';
import { Search, Filter, ChevronDown, ChevronUp, List, Grid, Calendar, FileText, MapPin, AlertCircle } from 'lucide-react';
import { PublicationGrid } from '../ui/PublicationCard';
import { UsageTypeBadge } from '../ui/UsageTypeBadge';
import { FilterGroup, ActiveFilters, SelectDropdown } from '../ui/FilterChips';
import { Publication } from '../../hooks/usePublicationData';
import { PublicationFilters } from '../../hooks/usePublicationFilters';

interface ExplorerViewProps {
  // Data
  publications: Publication[];
  filteredPublications: Publication[];
  currentPublications: Publication[];
  
  // Filters
  filters: PublicationFilters;
  setSearchQuery: (query: string) => void;
  setSelectedDomain: (domain: string) => void;
  setSelectedYear: (year: string) => void;
  setSelectedUsageType: (type: string) => void;
  setSelectedPubType: (type: string) => void;
  setShowFilters: (show: boolean) => void;
  setViewMode: (mode: 'table' | 'cards') => void;
  setCurrentPage: (page: number) => void;
  toggleFilters: () => void;
  resetFilters: () => void;
  
  // Pagination
  totalPages: number;
  startIndex: number;
  endIndex: number;
  itemsPerPage: number;
  
  // Selected publication
  selectedPublication: Publication | null;
  setSelectedPublication: (pub: Publication | null) => void;
  
  // Usage type counts
  usageTypeCounts: {
    primary: number;
    enabler: number;
    contextual: number;
  };
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  publications,
  filteredPublications,
  currentPublications,
  filters,
  setSearchQuery,
  setSelectedDomain,
  setSelectedYear,
  setSelectedUsageType,
  setSelectedPubType,
  setShowFilters,
  setViewMode,
  setCurrentPage,
  toggleFilters,
  resetFilters,
  totalPages,
  startIndex,
  endIndex,
  selectedPublication,
  setSelectedPublication,
  usageTypeCounts
}) => {
  const totalPublications = publications?.length || 0;
  
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search publications, authors, findings..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={toggleFilters}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Filter className="h-5 w-5 mr-2" />
              Filters
              {filters.showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-md p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center px-3 py-1.5 rounded transition-all ${
                  filters.viewMode === 'table' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4 mr-1.5" />
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center px-3 py-1.5 rounded transition-all ${
                  filters.viewMode === 'cards' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="h-4 w-4 mr-1.5" />
                Cards
              </button>
            </div>
          </div>

          {filters.showFilters && (
            <div className="space-y-4 pt-4 border-t">
              {/* Usage Type Chips */}
              <FilterGroup
                title="Usage Type"
                options={[
                  { label: 'All Types', value: 'all' },
                  { label: 'Primary Analysis', value: 'PRIMARY_ANALYSIS', count: usageTypeCounts.primary },
                  { label: 'Research Enabler', value: 'RESEARCH_ENABLER', count: usageTypeCounts.enabler },
                  { label: 'Contextual Reference', value: 'CONTEXTUAL_REFERENCE', count: usageTypeCounts.contextual }
                ]}
                selectedValue={filters.selectedUsageType}
                onChange={setSelectedUsageType}
                color="blue"
              />
              
              {/* Domain Chips */}
              <FilterGroup
                title="Research Domain"
                options={[
                  { label: 'All Domains', value: 'all' },
                  { label: 'Consolidation & Mergers', value: 'Consolidation & Mergers' },
                  { label: 'Quality & Outcomes', value: 'Quality & Outcomes' },
                  { label: 'Methodology & Data Quality', value: 'Methodology & Data Quality' },
                  { label: 'Health Equity & Access', value: 'Health Equity & Access' },
                  { label: 'Market Power & Pricing', value: 'Market Power & Pricing' }
                ]}
                selectedValue={filters.selectedDomain}
                onChange={setSelectedDomain}
                color="purple"
              />
              
              {/* Year and Type Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectDropdown
                  label="Publication Year"
                  value={filters.selectedYear}
                  onChange={setSelectedYear}
                  options={[
                    { label: 'All Years', value: 'all' },
                    { label: '2025', value: '2025' },
                    { label: '2024', value: '2024' },
                    { label: '2023', value: '2023' },
                    { label: '2022', value: '2022' },
                    { label: '2021', value: '2021' }
                  ]}
                  icon={<Calendar size={16} />}
                />
                <SelectDropdown
                  label="Publication Type"
                  value={filters.selectedPubType}
                  onChange={setSelectedPubType}
                  options={[
                    { label: 'All Types', value: 'all' },
                    { label: 'Academic', value: 'ACADEMIC' },
                    { label: 'Policy', value: 'POLICY' },
                    { label: 'Government', value: 'GOVERNMENT' },
                    { label: 'Other', value: 'OTHER' }
                  ]}
                  icon={<FileText size={16} />}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      <ActiveFilters
        filters={[
          ...(filters.selectedDomain !== 'all' ? [{
            category: 'Domain',
            label: filters.selectedDomain,
            value: filters.selectedDomain,
            onRemove: () => setSelectedDomain('all')
          }] : []),
          ...(filters.selectedYear !== 'all' ? [{
            category: 'Year',
            label: filters.selectedYear,
            value: filters.selectedYear,
            onRemove: () => setSelectedYear('all')
          }] : []),
          ...(filters.selectedUsageType !== 'all' ? [{
            category: 'Usage',
            label: filters.selectedUsageType === 'PRIMARY_ANALYSIS' ? 'Primary Analysis' :
                   filters.selectedUsageType === 'RESEARCH_ENABLER' ? 'Research Enabler' :
                   filters.selectedUsageType === 'CONTEXTUAL_REFERENCE' ? 'Contextual Reference' : filters.selectedUsageType,
            value: filters.selectedUsageType,
            onRemove: () => setSelectedUsageType('all')
          }] : []),
          ...(filters.selectedPubType !== 'all' ? [{
            category: 'Type',
            label: filters.selectedPubType,
            value: filters.selectedPubType,
            onRemove: () => setSelectedPubType('all')
          }] : []),
          ...(filters.searchQuery ? [{
            category: 'Search',
            label: `"${filters.searchQuery}"`,
            value: filters.searchQuery,
            onRemove: () => setSearchQuery('')
          }] : [])
        ]}
        onClearAll={resetFilters}
      />

      {/* Results Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-800">
            Showing {filteredPublications.length} of {totalPublications} publications
            {filters.searchQuery && ` matching "${filters.searchQuery}"`}
          </p>
        </div>
      </div>

      {/* Results Display - Table or Cards */}
      {filters.viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Research Publications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title / Authors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geographic Focus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPublications.map((pub) => (
                  <tr key={pub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">{pub.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{pub.authors}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pub.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {pub.research_domain}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UsageTypeBadge type={pub.usage_type} size="small" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        <MapPin size={12} />
                        {pub.geographic_focus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedPublication(pub)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Research Publications</h3>
          </div>
          <PublicationGrid 
            publications={currentPublications}
            variant="expanded"
            onSelectPublication={setSelectedPublication}
            selectedId={selectedPublication?.id}
          />
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, filters.currentPage - 1))}
                disabled={filters.currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, filters.currentPage + 1))}
                disabled={filters.currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredPublications.length)}</span> of{' '}
                  <span className="font-medium">{filteredPublications.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, filters.currentPage - 1))}
                    disabled={filters.currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronDown className="h-5 w-5 transform rotate-90" />
                  </button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          filters.currentPage === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      {filters.currentPage < totalPages - 2 && (
                        <>
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                            ...
                          </span>
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, filters.currentPage + 1))}
                    disabled={filters.currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronDown className="h-5 w-5 transform -rotate-90" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};