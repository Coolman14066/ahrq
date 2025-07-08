import { useState, useEffect } from 'react';
import { parseCSVData } from '../utils/csvParser';
import { hardcodedDataTransformed } from '../data/hardcodedData';

export interface Publication {
  id: number;
  publication_type: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  publisher: string;
  usage_type: 'PRIMARY_ANALYSIS' | 'RESEARCH_ENABLER' | 'CONTEXTUAL_REFERENCE';
  usage_justification: string;
  usage_description: string;
  research_domain: string;
  geographic_focus: string;
  data_years_used: string;
  key_findings: string;
  policy_implications: string;
  doi_url: string;
  notes: string;
  // Computed fields for analysis
  geographic_reach?: 'LOCAL' | 'STATE' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';
  methodological_rigor?: 'HIGH' | 'MEDIUM' | 'LOW';
  quality_score?: number;
  policy_impact_score?: number;
  citation_count?: number;
}

export type DataSource = 'csv' | 'hardcoded' | 'loading';

export interface UsePublicationDataReturn {
  publications: Publication[];
  loading: boolean;
  dataSource: DataSource;
  error: Error | null;
  reload: () => Promise<void>;
}

const validUsageTypes = ['PRIMARY_ANALYSIS', 'RESEARCH_ENABLER', 'CONTEXTUAL_REFERENCE'];

export const usePublicationData = (): UsePublicationDataReturn => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<DataSource>('loading');
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    // console.log('[usePublicationData] Starting data load...');
    setLoading(true);
    setError(null);
    
    try {
      // Try to load from CSV first
      // console.log('[usePublicationData] Attempting to load CSV from /ahrq_check.csv');
      const csvData = await parseCSVData('/ahrq_check.csv');
      
      // console.log('[usePublicationData] CSV data loaded:', {
      //   length: csvData.length,
      //   sample: csvData[0],
      //   allData: csvData
      // });
      
      if (csvData.length > 0) {
        // Validate CSV data
        const invalidEntries = csvData.filter(pub => !validUsageTypes.includes(pub.usage_type));
        const validEntries = csvData.filter(pub => validUsageTypes.includes(pub.usage_type));
        
        // console.log('[usePublicationData] CSV data validation:', {
        //   total: csvData.length,
        //   valid: validEntries.length,
        //   invalid: invalidEntries.length,
        //   invalidSample: invalidEntries.slice(0, 3).map(p => ({
        //     id: p.id,
        //     usage_type: p.usage_type,
        //     title: p.title.substring(0, 50)
        //   }))
        // });
        
        // Use CSV data if we have valid entries
        if (validEntries.length > 0) {
          setPublications(csvData);
          setDataSource('csv');
          // console.log('[usePublicationData] Using CSV data with', validEntries.length, 'valid entries');
        } else {
          // console.log('[usePublicationData] No valid entries in CSV, using hardcoded data');
          setPublications(hardcodedDataTransformed);
          setDataSource('hardcoded');
        }
      } else {
        // console.log('[usePublicationData] CSV empty, using hardcoded data');
        setPublications(hardcodedDataTransformed);
        setDataSource('hardcoded');
      }
    } catch (err) {
      // console.error('[usePublicationData] Error loading data:', err);
      setError(err as Error);
      
      // Fallback to hardcoded data
      // console.log('[usePublicationData] Falling back to hardcoded data');
      setPublications(hardcodedDataTransformed);
      setDataSource('hardcoded');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Debug logging
  useEffect(() => {
    // console.log('[usePublicationData] Publications data updated:', {
    //   count: publications.length,
    //   sample: publications[0],
    //   hasData: publications.length > 0
    // });
  }, [publications]);

  return {
    publications,
    loading,
    dataSource,
    error,
    reload: loadData,
  };
};