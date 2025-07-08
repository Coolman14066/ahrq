import Papa from 'papaparse';
import { Publication } from '../types/publication';
import { debugLog } from './debugUtils';
import { validateAndFixPublicationData } from './dataValidation';
import { AuthorService } from '../services/authorService';

/**
 * Parse CSV data using PapaParse to handle complex CSV formats
 * with quoted fields, commas within values, and special characters
 */
export const parseCSVData = async (csvPath: string): Promise<Publication[]> => {
  debugLog('parseCSVData', `Starting CSV parse from: ${csvPath}`);
  
  try {
    const response = await fetch(csvPath);
    debugLog('parseCSVData', 'Fetch response', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      type: response.type
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    debugLog('parseCSVData', 'CSV text loaded', {
      length: csvText.length,
      firstChars: csvText.substring(0, 100),
      hasContent: csvText.length > 0
    });
    
    // Use PapaParse for robust CSV parsing
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep all as strings for now
      transformHeader: (header: string) => {
        // Normalize header names to match our interface
        return header
          .replace(/^\uFEFF/, '') // Remove BOM if present
          .replace(/['"]/g, '') // Remove quotes
          .trim();
      }
    }) as Papa.ParseResult<any>;
    
    debugLog('parseCSVData', 'Papa.parse result', {
      dataLength: parseResult.data?.length || 0,
      errors: parseResult.errors,
      meta: parseResult.meta
    });
    
    if (parseResult.errors.length > 0) {
      console.warn('CSV parsing warnings:', parseResult.errors);
    }
    
    const publications: Publication[] = [];
    let id = 1;
    
    for (const row of parseResult.data) {
      // Skip rows with missing required fields
      if (!row.Title || !row.Publication_Type) {
        continue;
      }
      
      // Debug problematic rows
      if (id <= 5 || (row.Usage_Type && !['PRIMARY_ANALYSIS', 'RESEARCH_ENABLER', 'CONTEXTUAL_REFERENCE'].includes(row.Usage_Type.toUpperCase()))) {
        console.log(`[csvParser] Row ${id}:`, {
          usage_type_raw: row.Usage_Type,
          usage_type_parsed: parseUsageType(row.Usage_Type),
          title: row.Title?.substring(0, 50)
        });
      }
      
      const publication: Publication = {
        id: id++,
        publication_type: cleanString(row.Publication_Type),
        title: cleanString(row.Title),
        authors: AuthorService.parseAuthors(row.Authors || row.Authors_Standardized || '').formattedString,
        year: parseYear(row.Publication_Year),
        journal: cleanString(row.Journal_Venue || ''),
        publisher: cleanString(row.Publisher || ''),
        usage_type: parseUsageType(row.Usage_Type),
        usage_justification: cleanString(row.Usage_Justification || ''),
        usage_description: cleanString(row.Usage_Description || ''),
        research_domain: cleanString(row.Research_Domain || ''),
        geographic_focus: cleanString(row.Geographic_Focus || ''),
        data_years_used: cleanString(row.Data_Years_Used || ''),
        key_findings: cleanString(row.Key_Findings || ''),
        policy_implications: cleanString(row.Policy_Implications || ''),
        doi_url: cleanString(row.DOI_URL || ''),
        notes: cleanString(row.Notes || ''),
        // Computed fields
        geographic_reach: 'NATIONAL',
        methodological_rigor: 'MEDIUM'
      };
      
      
      // Determine geographic reach
      publication.geographic_reach = determineGeographicReach(publication.geographic_focus);
      
      // Assess methodological rigor
      publication.methodological_rigor = assessMethodologicalRigor(publication);
      
      publications.push(publication);
    }
    
    debugLog('parseCSVData', `Successfully parsed publications`, {
      count: publications.length,
      sample: publications.slice(0, 2)
    });
    
    // Apply data validation and fixes
    const validatedPublications = validateAndFixPublicationData(publications);
    
    debugLog('parseCSVData', `Applied data validation`, {
      originalCount: publications.length,
      validatedCount: validatedPublications.length,
      fixedPubTypes: validatedPublications.filter((p, i) => p.publication_type !== publications[i].publication_type).length
    });
    
    return validatedPublications;
    
  } catch (error) {
    debugLog('parseCSVData', 'Error parsing CSV', error);
    console.error('Error parsing CSV:', error);
    throw new Error(`Failed to parse CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Clean string data - remove extra quotes, trim whitespace
 */
const cleanString = (str: string): string => {
  if (!str) return '';
  
  // Fix common encoding issues (mojibake)
  return str
    .replace(/â€™/g, "'")     // Fix smart apostrophe
    .replace(/â€"/g, "—")     // Fix em dash
    .replace(/â€"/g, "–")     // Fix en dash
    .replace(/â€œ/g, '"')     // Fix left smart quote
    .replace(/â€/g, '"')      // Fix right smart quote
    .replace(/Ã¢â‚¬â„¢/g, "'") // Another variant of apostrophe
    .replace(/Ã¢â‚¬â€œ/g, "–") // Another variant of en dash
    .replace(/Ã¢â‚¬â€/g, "—")  // Another variant of em dash
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
};

/**
 * Parse year from various formats
 */
const parseYear = (yearStr: string | undefined): number => {
  if (!yearStr) return new Date().getFullYear();
  
  const year = parseInt(yearStr);
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    return new Date().getFullYear();
  }
  
  return year;
};

/**
 * Parse usage type with validation
 */
const parseUsageType = (usageType: string | undefined): 'PRIMARY_ANALYSIS' | 'RESEARCH_ENABLER' | 'CONTEXTUAL_REFERENCE' => {
  const cleaned = cleanString(usageType || '').toUpperCase().replace(/\s+/g, '_');
  
  // Log the raw and cleaned values for debugging
  if (usageType && !['PRIMARY_ANALYSIS', 'RESEARCH_ENABLER', 'CONTEXTUAL_REFERENCE'].includes(cleaned)) {
    console.warn('[parseUsageType] Unexpected usage type:', {
      raw: usageType,
      cleaned: cleaned
    });
  }
  
  // Handle variations
  switch (cleaned) {
    case 'PRIMARY_ANALYSIS':
    case 'PRIMARY-ANALYSIS':
    case 'PRIMARY':
      return 'PRIMARY_ANALYSIS';
    case 'RESEARCH_ENABLER':
    case 'RESEARCH-ENABLER':
    case 'ENABLER':
      return 'RESEARCH_ENABLER';
    case 'CONTEXTUAL_REFERENCE':
    case 'CONTEXTUAL-REFERENCE':
    case 'CONTEXTUAL':
    case 'REFERENCE':
      return 'CONTEXTUAL_REFERENCE';
    default:
      // Default to contextual reference if unknown
      console.warn('[parseUsageType] Defaulting to CONTEXTUAL_REFERENCE for:', cleaned);
      return 'CONTEXTUAL_REFERENCE';
  }
};

/**
 * Calculate quality score based on completeness and detail
 * (Kept for future use)
 */
// const calculateQualityScore = (pub: Publication): number => {
//   let score = 0;
//   
//   // DOI/URL presence (20 points)
//   if (pub.doi_url && pub.doi_url.startsWith('http')) score += 20;
//   
//   // Detailed usage justification (20 points)
//   if (pub.usage_justification && pub.usage_justification.length > 50) score += 20;
//   
//   // Key findings present and detailed (20 points)
//   if (pub.key_findings && pub.key_findings.length > 50) score += 20;
//   
//   // Policy implications present and detailed (20 points)
//   if (pub.policy_implications && pub.policy_implications.length > 50) score += 20;
//   
//   // Data years specified (10 points)
//   if (pub.data_years_used && pub.data_years_used !== 'n/a' && pub.data_years_used !== 'N/A') score += 10;
//   
//   // Complete author information (10 points)
//   if (pub.authors && pub.authors.length > 10 && pub.authors !== '[+ others]') score += 10;
//   
//   return Math.min(score, 100);
// };

/**
 * Calculate policy impact score based on content analysis
 * (Kept for future use)
 */
// const calculatePolicyImpactScore = (pub: Publication): number => {
//   let score = 0;
//   const policyText = pub.policy_implications.toLowerCase();
//   
//   // High-impact keywords (20 points each)
//   const highImpactKeywords = ['regulation', 'regulatory', 'enforcement', 'antitrust', 'oversight'];
//   highImpactKeywords.forEach(keyword => {
//     if (policyText.includes(keyword)) score += 20;
//   });
//   
//   // Medium-impact keywords (10 points each)
//   const mediumImpactKeywords = ['policy', 'needed', 'required', 'mandate', 'compliance'];
//   mediumImpactKeywords.forEach(keyword => {
//     if (policyText.includes(keyword)) score += 10;
//   });
//   
//   // Low-impact keywords (5 points each)
//   const lowImpactKeywords = ['support', 'consider', 'monitor', 'review'];
//   lowImpactKeywords.forEach(keyword => {
//     if (policyText.includes(keyword)) score += 5;
//   });
//   
//   // Usage type bonus
//   if (pub.usage_type === 'PRIMARY_ANALYSIS') score += 15;
//   else if (pub.usage_type === 'RESEARCH_ENABLER') score += 10;
//   
//   return Math.min(score, 100);
// };

/**
 * Determine geographic reach from geographic focus text
 */
const determineGeographicReach = (geo: string): 'LOCAL' | 'STATE' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL' => {
  const geoLower = geo.toLowerCase();
  
  if (geoLower.includes('international') || geoLower.includes('global') || 
      geoLower.includes('chile') || geoLower.includes('canada')) {
    return 'INTERNATIONAL';
  }
  
  if (geoLower === 'usa' || geoLower === 'united states' || 
      geoLower.includes('national') || geoLower.includes('nationwide')) {
    return 'NATIONAL';
  }
  
  if (geoLower.includes('multi-state') || geoLower.includes('regional') || 
      geoLower.includes('midwest') || geoLower.includes('northeast') || 
      geoLower.includes('southeast') || geoLower.includes('southwest')) {
    return 'REGIONAL';
  }
  
  const stateNames = [
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
    'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
    'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
    'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
    'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
    'new hampshire', 'new jersey', 'new mexico', 'new york',
    'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon',
    'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
    'west virginia', 'wisconsin', 'wyoming'
  ];
  
  if (stateNames.some(state => geoLower.includes(state)) || 
      geoLower.includes('state') || geoLower.match(/\b[A-Z]{2}\b/)) {
    return 'STATE';
  }
  
  return 'LOCAL';
};

/**
 * Assess methodological rigor based on usage type and content
 */
const assessMethodologicalRigor = (pub: Publication): 'HIGH' | 'MEDIUM' | 'LOW' => {
  // Primary analysis typically has higher rigor
  if (pub.usage_type === 'PRIMARY_ANALYSIS') {
    // Check for detailed methodology indicators
    const hasDetailedFindings = pub.key_findings && pub.key_findings.length > 100;
    const hasDataYears = pub.data_years_used && pub.data_years_used !== 'n/a';
    const hasStrongJustification = pub.usage_justification && pub.usage_justification.length > 100;
    
    if (hasDetailedFindings && hasDataYears && hasStrongJustification) {
      return 'HIGH';
    }
    return 'MEDIUM';
  }
  
  // Research enabler - medium rigor by default
  if (pub.usage_type === 'RESEARCH_ENABLER') {
    return 'MEDIUM';
  }
  
  // Contextual reference - typically lower rigor
  return 'LOW';
};