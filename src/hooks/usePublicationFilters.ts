import { useState } from 'react';

export interface PublicationFilters {
  searchQuery: string;
  selectedDomain: string;
  selectedYear: string;
  selectedUsageType: string;
  selectedPubType: string;
  selectedGeographicReach: string;
  selectedQualityThreshold: number;
  showFilters: boolean;
  viewMode: 'table' | 'cards';
  currentPage: number;
}

export interface UsePublicationFiltersReturn extends PublicationFilters {
  setSearchQuery: (query: string) => void;
  setSelectedDomain: (domain: string) => void;
  setSelectedYear: (year: string) => void;
  setSelectedUsageType: (type: string) => void;
  setSelectedPubType: (type: string) => void;
  setSelectedGeographicReach: (reach: string) => void;
  setSelectedQualityThreshold: (threshold: number) => void;
  setShowFilters: (show: boolean) => void;
  setViewMode: (mode: 'table' | 'cards') => void;
  setCurrentPage: (page: number) => void;
  toggleFilters: () => void;
  resetFilters: () => void;
  resetPage: () => void;
}

const defaultFilters: PublicationFilters = {
  searchQuery: '',
  selectedDomain: 'all',
  selectedYear: 'all',
  selectedUsageType: 'all',
  selectedPubType: 'all',
  selectedGeographicReach: 'all',
  selectedQualityThreshold: 0,
  showFilters: false,
  viewMode: 'cards',
  currentPage: 1,
};

export const usePublicationFilters = (): UsePublicationFiltersReturn => {
  const [searchQuery, setSearchQuery] = useState(defaultFilters.searchQuery);
  const [selectedDomain, setSelectedDomain] = useState(defaultFilters.selectedDomain);
  const [selectedYear, setSelectedYear] = useState(defaultFilters.selectedYear);
  const [selectedUsageType, setSelectedUsageType] = useState(defaultFilters.selectedUsageType);
  const [selectedPubType, setSelectedPubType] = useState(defaultFilters.selectedPubType);
  const [selectedGeographicReach, setSelectedGeographicReach] = useState(defaultFilters.selectedGeographicReach);
  const [selectedQualityThreshold, setSelectedQualityThreshold] = useState(defaultFilters.selectedQualityThreshold);
  const [showFilters, setShowFilters] = useState(defaultFilters.showFilters);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(defaultFilters.viewMode);
  const [currentPage, setCurrentPage] = useState(defaultFilters.currentPage);

  const toggleFilters = () => setShowFilters(!showFilters);

  const resetFilters = () => {
    setSearchQuery(defaultFilters.searchQuery);
    setSelectedDomain(defaultFilters.selectedDomain);
    setSelectedYear(defaultFilters.selectedYear);
    setSelectedUsageType(defaultFilters.selectedUsageType);
    setSelectedPubType(defaultFilters.selectedPubType);
    setSelectedGeographicReach(defaultFilters.selectedGeographicReach);
    setSelectedQualityThreshold(defaultFilters.selectedQualityThreshold);
    setCurrentPage(defaultFilters.currentPage);
  };

  const resetPage = () => setCurrentPage(1);

  // Reset page when filters change
  const createFilterSetter = <T,>(setter: (value: T) => void) => {
    return (value: T) => {
      setter(value);
      resetPage();
    };
  };

  return {
    // State values
    searchQuery,
    selectedDomain,
    selectedYear,
    selectedUsageType,
    selectedPubType,
    selectedGeographicReach,
    selectedQualityThreshold,
    showFilters,
    viewMode,
    currentPage,
    
    // Setters with page reset
    setSearchQuery: createFilterSetter(setSearchQuery),
    setSelectedDomain: createFilterSetter(setSelectedDomain),
    setSelectedYear: createFilterSetter(setSelectedYear),
    setSelectedUsageType: createFilterSetter(setSelectedUsageType),
    setSelectedPubType: createFilterSetter(setSelectedPubType),
    setSelectedGeographicReach: createFilterSetter(setSelectedGeographicReach),
    setSelectedQualityThreshold: createFilterSetter(setSelectedQualityThreshold),
    
    // Direct setters (no page reset)
    setShowFilters,
    setViewMode,
    setCurrentPage,
    
    // Utility functions
    toggleFilters,
    resetFilters,
    resetPage,
  };
};