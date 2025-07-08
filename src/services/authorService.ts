export interface ParsedAuthor {
  fullName: string;
  firstName: string;
  lastName: string;
  isInstitution: boolean;
}

export interface AuthorParsingResult {
  authors: ParsedAuthor[];
  raw: string;
  formattedString: string;
}

export class AuthorService {
  private static readonly DELIMITERS = /[,;]|\s+and\s+|\n/;
  private static readonly TITLES = /^(Dr\.|PhD|MD|MPH|MSc|MA|MS|MBA|RN|JD|Prof\.?)\s*/i;
  private static readonly ROLE_DESCRIPTORS = /(Principal Investigator|Co-Investigator|Research Fellow|Research Assistant|Project Manager|Data Analyst|Study Coordinator|Clinical Researcher|Statistician|Epidemiologist|Health Economist|Policy Analyst|Senior Researcher|Lead Author|Corresponding Author|Contributing Author)/i;
  
  static parseAuthors(authorsString: string): AuthorParsingResult {
    if (!authorsString || typeof authorsString !== 'string') {
      return {
        authors: [],
        raw: authorsString || '',
        formattedString: ''
      };
    }

    // Clean the input string
    let cleanedString = authorsString
      .replace(/\[.*?\]/g, '') // Remove bracketed content like [+ others]
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Split by delimiters
    const authorParts = cleanedString.split(this.DELIMITERS);
    
    const parsedAuthors: ParsedAuthor[] = [];
    
    for (let authorPart of authorParts) {
      let cleanAuthor = authorPart.trim();
      
      // Skip empty strings
      if (!cleanAuthor) continue;
      
      // Remove titles
      cleanAuthor = cleanAuthor.replace(this.TITLES, '');
      
      // Remove role descriptors that might appear after commas
      cleanAuthor = cleanAuthor.split(',')[0].trim();
      
      // Skip if it's just a role descriptor
      if (this.ROLE_DESCRIPTORS.test(cleanAuthor)) continue;
      
      // Check if it's likely an institution (contains keywords or no spaces)
      const isInstitution = this.isLikelyInstitution(cleanAuthor);
      
      // Parse individual vs institution
      if (isInstitution) {
        parsedAuthors.push({
          fullName: cleanAuthor,
          firstName: '',
          lastName: cleanAuthor,
          isInstitution: true
        });
      } else {
        const nameParts = this.parseIndividualName(cleanAuthor);
        if (nameParts) {
          parsedAuthors.push({
            ...nameParts,
            isInstitution: false
          });
        }
      }
    }
    
    // Remove duplicates based on full name
    const uniqueAuthors = this.removeDuplicates(parsedAuthors);
    
    // Create formatted string
    const formattedString = this.formatAuthorList(uniqueAuthors);
    
    return {
      authors: uniqueAuthors,
      raw: authorsString,
      formattedString
    };
  }
  
  private static isLikelyInstitution(text: string): boolean {
    const institutionKeywords = [
      'University', 'Institute', 'College', 'School', 'Hospital', 
      'Center', 'Centre', 'Department', 'Division', 'Laboratory',
      'Agency', 'Foundation', 'Corporation', 'Inc', 'LLC', 'Ltd',
      'Association', 'Society', 'Board', 'Commission', 'Committee'
    ];
    
    return institutionKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  private static parseIndividualName(name: string): { fullName: string; firstName: string; lastName: string } | null {
    const parts = name.trim().split(/\s+/);
    
    // Skip if too short or too long
    if (parts.length < 2 || parts.length > 5) {
      // Single word might be last name only
      if (parts.length === 1 && parts[0].length > 2) {
        return {
          fullName: parts[0],
          firstName: '',
          lastName: parts[0]
        };
      }
      return null;
    }
    
    // Handle common name patterns
    if (parts.length === 2) {
      // FirstName LastName
      return {
        fullName: name,
        firstName: parts[0],
        lastName: parts[1]
      };
    } else if (parts.length === 3) {
      // FirstName MiddleName LastName or FirstName LastName Jr.
      const suffixes = ['Jr', 'Jr.', 'Sr', 'Sr.', 'II', 'III', 'IV'];
      if (suffixes.includes(parts[2])) {
        return {
          fullName: name,
          firstName: parts[0],
          lastName: `${parts[1]} ${parts[2]}`
        };
      } else {
        return {
          fullName: name,
          firstName: parts[0],
          lastName: parts[2]
        };
      }
    } else {
      // Complex names - take first and last
      return {
        fullName: name,
        firstName: parts[0],
        lastName: parts[parts.length - 1]
      };
    }
  }
  
  private static removeDuplicates(authors: ParsedAuthor[]): ParsedAuthor[] {
    const seen = new Set<string>();
    return authors.filter(author => {
      const key = author.fullName.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  static formatAuthorList(authors: ParsedAuthor[], options?: {
    maxAuthors?: number;
    useLastNameOnly?: boolean;
    separator?: string;
  }): string {
    const { maxAuthors = 0, useLastNameOnly = false, separator = ', ' } = options || {};
    
    if (authors.length === 0) return '';
    
    const formatAuthor = (author: ParsedAuthor) => {
      if (author.isInstitution) {
        return author.fullName;
      }
      if (useLastNameOnly && author.lastName) {
        return author.lastName;
      }
      return author.fullName;
    };
    
    if (maxAuthors > 0 && authors.length > maxAuthors) {
      const displayedAuthors = authors.slice(0, maxAuthors).map(formatAuthor);
      return `${displayedAuthors.join(separator)} et al. (${authors.length} authors)`;
    }
    
    return authors.map(formatAuthor).join(separator);
  }
  
  static getAuthorCount(authorsString: string): number {
    const parsed = this.parseAuthors(authorsString);
    return parsed.authors.length;
  }
  
  static getFirstAuthor(authorsString: string): string {
    const parsed = this.parseAuthors(authorsString);
    return parsed.authors.length > 0 ? parsed.authors[0].fullName : '';
  }
  
  static getAuthorsByLastName(authorsString: string): string[] {
    const parsed = this.parseAuthors(authorsString);
    return parsed.authors
      .filter(author => !author.isInstitution && author.lastName)
      .map(author => author.lastName);
  }
}