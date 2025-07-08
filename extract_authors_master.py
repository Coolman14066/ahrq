#!/usr/bin/env python3
"""
Master script for extracting full author lists from DOIs in ahrq_check.csv
Coordinates multiple extraction methods and tracks progress
"""

import csv
import json
import logging
import time
from datetime import datetime
from pathlib import Path
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the multi-source extractor
from multi_source_author_extractor import MultiSourceAuthorExtractor
from playwright_author_scraper import PlaywrightAuthorScraper

class AuthorExtractionMaster:
    def __init__(self, input_file='public/ahrq_check.csv', output_dir='author_extraction_results'):
        self.input_file = input_file
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Setup logging
        self.setup_logging()
        
        # Load configuration
        self.config = self.load_config()
        
        # Progress tracking
        self.progress_file = self.output_dir / 'progress.json'
        self.progress = self.load_progress()
        
        # Results storage
        self.results = []
        self.stats = {
            'total_rows': 0,
            'rows_needing_extraction': 0,
            'successful_extractions': 0,
            'failed_extractions': 0,
            'extraction_sources': {},
            'start_time': datetime.now().isoformat()
        }
        
        # Initialize the multi-source extractor
        self.api_extractor = MultiSourceAuthorExtractor(self.config['scopus_api_key'])
        self.web_scraper = PlaywrightAuthorScraper()
    
    def setup_logging(self):
        """Setup logging configuration"""
        log_file = self.output_dir / f'extraction_log_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def load_config(self):
        """Load configuration for API keys and settings"""
        config = {
            'scopus_api_key': '7cb67bc87041113e16b3604ec1d33cd6',
            'batch_size': 10,
            'retry_attempts': 3,
            'retry_delay': 2,
            'rate_limits': {
                'scopus': 5000,  # per week
                'crossref': 50,  # per second
                'openalex': 100,  # per second
                'semantic_scholar': 100  # per 5 minutes
            }
        }
        return config
    
    def load_progress(self):
        """Load progress from previous run if exists"""
        if self.progress_file.exists():
            with open(self.progress_file, 'r') as f:
                return json.load(f)
        return {'processed_rows': [], 'last_row': 0}
    
    def save_progress(self):
        """Save current progress"""
        with open(self.progress_file, 'w') as f:
            json.dump(self.progress, f, indent=2)
    
    def identify_rows_needing_extraction(self):
        """Identify rows that need full author extraction"""
        rows_needing_extraction = []
        
        with open(self.input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for idx, row in enumerate(reader):
                row_num = idx + 2  # Account for header and 0-index
                authors = row.get('Authors_Standardized', '').strip()
                
                # Check if this row needs extraction
                if '[+ others]' in authors or 'et al' in authors.lower():
                    if row_num not in self.progress['processed_rows']:
                        rows_needing_extraction.append({
                            'row_num': row_num,
                            'doi': row.get('DOI_URL', ''),
                            'title': row.get('Title', ''),
                            'current_authors': authors,
                            'year': row.get('Publication_Year', '')
                        })
        
        self.stats['total_rows'] = idx + 1
        self.stats['rows_needing_extraction'] = len(rows_needing_extraction)
        
        self.logger.info(f"Found {len(rows_needing_extraction)} rows needing author extraction")
        return rows_needing_extraction
    
    def extract_doi_from_url(self, url):
        """Extract DOI from various URL formats"""
        import re
        
        # DOI pattern
        doi_pattern = re.compile(r'10\.\d{4,}(?:\.\d+)*\/[-._;()\/:a-zA-Z0-9]+')
        
        # Try to extract from URL
        if url.startswith('http'):
            match = doi_pattern.search(url)
            if match:
                return match.group()
        elif doi_pattern.match(url):
            return url
        
        return None
    
    def extract_authors_for_row(self, row_data):
        """Extract authors for a single row using multiple sources"""
        doi_url = row_data['doi']
        doi = self.extract_doi_from_url(doi_url)
        
        # If no DOI found but we have a URL, we can still try web scraping
        if not doi and not (doi_url.startswith('http') or doi_url.startswith('www')):
            self.logger.warning(f"Could not extract valid DOI or URL from: {doi_url}")
            return None
        
        result = {
            'row_num': row_data['row_num'],
            'doi': doi,
            'original_doi_url': row_data['doi'],
            'title': row_data['title'],
            'current_authors': row_data['current_authors'],
            'extracted_authors': None,
            'extraction_source': None,
            'confidence_score': 0,
            'extraction_timestamp': datetime.now().isoformat(),
            'error': None
        }
        
        # Try multiple sources in order of preference
        # If we have a DOI, try API sources first
        if doi:
            extraction_methods = [
                ('scopus', lambda: self.extract_from_scopus(doi)),
                ('crossref', lambda: self.extract_from_crossref(doi)),
                ('openalex', lambda: self.extract_from_openalex(doi)),
                ('semantic_scholar', lambda: self.extract_from_semantic_scholar(doi)),
                ('web_scraping', lambda: self.extract_from_web(doi_url))
            ]
        else:
            # No DOI, go straight to web scraping
            extraction_methods = [
                ('web_scraping', lambda: self.extract_from_web(doi_url))
            ]
        
        for source, method in extraction_methods:
            try:
                self.logger.info(f"Trying {source} for: {doi or doi_url}")
                authors_data = method()
                
                if authors_data and authors_data.get('authors'):
                    result['extracted_authors'] = authors_data['authors']
                    result['extraction_source'] = source
                    result['confidence_score'] = authors_data.get('confidence', 85)
                    result['author_count'] = len(authors_data['authors'])
                    
                    # Format authors as semicolon-separated string
                    result['authors_formatted'] = '; '.join(authors_data['authors'])
                    
                    self.stats['extraction_sources'][source] = self.stats['extraction_sources'].get(source, 0) + 1
                    self.stats['successful_extractions'] += 1
                    
                    self.logger.info(f"Successfully extracted {len(authors_data['authors'])} authors from {source}")
                    break
                    
            except Exception as e:
                self.logger.error(f"Error extracting from {source}: {str(e)}")
                result['error'] = str(e)
        
        if not result['extracted_authors']:
            self.stats['failed_extractions'] += 1
            self.logger.warning(f"Failed to extract authors for DOI: {doi}")
        
        return result
    
    def extract_from_scopus(self, doi):
        """Extract authors using Scopus API"""
        return self.api_extractor.extract_from_scopus(doi)
    
    def extract_from_crossref(self, doi):
        """Extract authors using CrossRef API"""
        return self.api_extractor.extract_from_crossref(doi)
    
    def extract_from_openalex(self, doi):
        """Extract authors using OpenAlex API"""
        return self.api_extractor.extract_from_openalex(doi)
    
    def extract_from_semantic_scholar(self, doi):
        """Extract authors using Semantic Scholar API"""
        return self.api_extractor.extract_from_semantic_scholar(doi)
    
    def extract_from_web(self, doi_or_url):
        """Extract authors using web scraping"""
        # If it's a URL, use it directly
        if doi_or_url.startswith('http') or doi_or_url.startswith('www'):
            url = doi_or_url if doi_or_url.startswith('http') else f'https://{doi_or_url}'
            return self.web_scraper.extract_from_web(url, self.extract_doi_from_url(doi_or_url))
        else:
            # It's a DOI, construct URL
            url = f"https://doi.org/{doi_or_url}"
            return self.web_scraper.extract_from_web(url, doi_or_url)
    
    def generate_enhanced_csv(self):
        """Generate the enhanced CSV with extracted authors"""
        # Read original CSV
        original_data = []
        with open(self.input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames
            for row in reader:
                original_data.append(row)
        
        # Create results lookup by row number
        results_by_row = {r['row_num']: r for r in self.results}
        
        # Generate enhanced CSV
        output_file = self.output_dir / f'ahrq_check_enhanced_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        
        new_headers = headers + [
            'Authors_Extracted',
            'Authors_Source',
            'Authors_Confidence',
            'Author_Count',
            'Extraction_Notes'
        ]
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=new_headers)
            writer.writeheader()
            
            for idx, row in enumerate(original_data):
                row_num = idx + 2
                
                # Add extraction results if available
                if row_num in results_by_row:
                    result = results_by_row[row_num]
                    row['Authors_Extracted'] = result.get('authors_formatted', '')
                    row['Authors_Source'] = result.get('extraction_source', '')
                    row['Authors_Confidence'] = result.get('confidence_score', '')
                    row['Author_Count'] = result.get('author_count', '')
                    row['Extraction_Notes'] = result.get('error', '') if result.get('error') else 'Success'
                else:
                    # Keep original if no extraction was needed or performed
                    row['Authors_Extracted'] = ''
                    row['Authors_Source'] = ''
                    row['Authors_Confidence'] = ''
                    row['Author_Count'] = ''
                    row['Extraction_Notes'] = 'Not processed'
                
                writer.writerow(row)
        
        self.logger.info(f"Enhanced CSV saved to: {output_file}")
        return output_file
    
    def generate_report(self):
        """Generate final extraction report"""
        report_file = self.output_dir / f'extraction_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
        
        with open(report_file, 'w') as f:
            f.write("=== AUTHOR EXTRACTION REPORT ===\n\n")
            f.write(f"Start Time: {self.stats['start_time']}\n")
            f.write(f"End Time: {datetime.now().isoformat()}\n\n")
            
            f.write("=== STATISTICS ===\n")
            f.write(f"Total rows in file: {self.stats['total_rows']}\n")
            f.write(f"Rows needing extraction: {self.stats['rows_needing_extraction']}\n")
            f.write(f"Successful extractions: {self.stats['successful_extractions']}\n")
            f.write(f"Failed extractions: {self.stats['failed_extractions']}\n")
            f.write(f"Success rate: {self.stats['successful_extractions'] / max(self.stats['rows_needing_extraction'], 1) * 100:.1f}%\n\n")
            
            f.write("=== EXTRACTION SOURCES ===\n")
            for source, count in self.stats['extraction_sources'].items():
                f.write(f"{source}: {count}\n")
            
            f.write("\n=== FAILED EXTRACTIONS ===\n")
            for result in self.results:
                if not result.get('extracted_authors'):
                    f.write(f"Row {result['row_num']}: {result['title'][:50]}...\n")
                    f.write(f"  DOI: {result['doi']}\n")
                    f.write(f"  Error: {result.get('error', 'Unknown')}\n\n")
        
        self.logger.info(f"Report saved to: {report_file}")
        return report_file
    
    def run(self):
        """Run the complete extraction process"""
        self.logger.info("Starting author extraction process...")
        
        # Identify rows needing extraction
        rows_to_process = self.identify_rows_needing_extraction()
        
        if not rows_to_process:
            self.logger.info("No rows need author extraction")
            return
        
        # Process each row
        for i, row_data in enumerate(rows_to_process):
            self.logger.info(f"Processing row {i+1}/{len(rows_to_process)}: {row_data['title'][:50]}...")
            
            result = self.extract_authors_for_row(row_data)
            if result:
                self.results.append(result)
                self.progress['processed_rows'].append(row_data['row_num'])
                self.save_progress()
            
            # Rate limiting
            if (i + 1) % self.config['batch_size'] == 0:
                self.logger.info(f"Processed {i+1} rows, pausing for rate limits...")
                time.sleep(2)
        
        # Generate outputs
        self.logger.info("Generating enhanced CSV...")
        csv_file = self.generate_enhanced_csv()
        
        self.logger.info("Generating report...")
        report_file = self.generate_report()
        
        self.logger.info(f"Extraction complete! Results saved to {self.output_dir}")
        self.logger.info(f"Enhanced CSV: {csv_file}")
        self.logger.info(f"Report: {report_file}")

if __name__ == "__main__":
    extractor = AuthorExtractionMaster()
    extractor.run()