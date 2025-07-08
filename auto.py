#!/usr/bin/env python3
"""
AHRQ End-to-End Analysis Engine (v2.5 - CORRECTED)

Objective: To test the complete, automated pipeline using the correct
           'gemini-2.5-flash' model and a robust JSON format.
"""

import requests
import pandas as pd
from datetime import datetime
import time
import os
import xml.etree.ElementTree as ET
from openai import OpenAI
import json

class AHRQ_2_5_Flash_Pipeline:
    def __init__(self, scopus_api_key: str, openrouter_api_key: str):
        """Initializes the full pipeline with both API keys."""
        self.scopus_api_key = scopus_api_key
        self.openrouter_api_key = openrouter_api_key
        
        self.article_retrieval_url = "https://api.elsevier.com/content/article/doi/"
        self.analysis_results = []
        
        # Initialize OpenRouter client
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.openrouter_api_key
        )

        self._validate_openrouter_key()

    def _validate_openrouter_key(self):
        """Checks if the OpenRouter API key is valid."""
        print("--- Validating OpenRouter API Key ---")
        try:
            # Simple test call to validate the key
            test_response = self.client.chat.completions.create(
                model="google/gemini-2.5-flash",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5
            )
            print("✅ OpenRouter API Key is valid and authenticated.")
        except Exception as e:
            print(f"❌ CRITICAL ERROR: OpenRouter API Key is invalid or has an issue: {e}")
            raise

    def get_system_prompt_for_json(self) -> str:
        """Returns the master system prompt, instructing the LLM to output JSON."""
        # This is the same detailed prompt as before, as its structure is sound.
        return """
        Your sole function is to serve as an expert research analyst. Analyze the provided document text and return your analysis as a single, valid JSON object. Do not include any text, markdown, or formatting outside of the JSON structure itself.

        The JSON object must contain the following keys, populated with your analysis based on the detailed instructions below:
        "Publication_Type", "Title", "Authors_Standardized", "Publication_Year", "Journal_Venue", "Publisher", "Usage_Type", "Usage_Description", "Research_Domain", "Geographic_Focus", "Data_Years_Used", "Key_Findings", "Policy_Implications", "DOI_URL", "Notes"

        --- DETAILED INSTRUCTIONS ---

        1.  **Usage_Type**: Classify into ONE of: PRIMARY_ANALYSIS, RESEARCH_ENABLER, or CONTEXTUAL_REFERENCE.
            -   PRIMARY_ANALYSIS: The paper's main finding is a direct statistic ABOUT the AHRQ Compendium data.
            -   RESEARCH_ENABLER: The Compendium was used as a tool (e.g., for linking, sampling) to study something else.
            -   CONTEXTUAL_REFERENCE: The Compendium is cited for a background fact or definition.

        2.  **Usage_Description**: This must be a detailed narrative paragraph containing three parts: 1) The Action Statement (What did they do?), 2) The Purpose Clause (Why?), and 3) The Research Context (What was the study's goal?).

        3.  **Key_Findings**: State the single most important, quantifiable result enabled by the Compendium. If none, explain why.

        4.  **Policy_Implications**: Connect the Key_Finding to a real-world policy action.
        
        5.  **Notes**: Add crucial analyst context (e.g., "Indirect citation via Contreary et al.").

        --- DOCUMENT TEXT TO ANALYZE ---
        {full_text_placeholder}
        """

    def analyze_text_with_gemini(self, full_text: str) -> dict:
        """Sends text to Gemini API via OpenRouter and parses the JSON response."""
        print("      Sending text to Gemini 2.5 Flash via OpenRouter for JSON analysis...")
        
        system_prompt = self.get_system_prompt_for_json()
        prompt_with_text = system_prompt.format(full_text_placeholder=full_text)
        
        try:
            # Using OpenRouter to access Gemini 2.5 Flash
            response = self.client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": "https://ahrq-analysis.com",  # Optional
                    "X-Title": "AHRQ Analysis Engine"  # Optional
                },
                model="google/gemini-2.5-flash",
                messages=[
                    {
                        "role": "system",
                        "content": "You must respond with a valid JSON object only. No markdown, no extra text."
                    },
                    {
                        "role": "user", 
                        "content": prompt_with_text
                    }
                ],
                temperature=0.1,  # Low temperature for consistent JSON output
                response_format={"type": "json_object"}  # Request JSON format
            )
            
            print("      ...Received JSON response from OpenRouter.")
            
            # Parse the JSON response
            parsed_json = json.loads(response.choices[0].message.content)
            return parsed_json

        except Exception as e:
            print(f"      ❌ An error occurred during OpenRouter API call or JSON parsing: {e}")
            raw_text = "N/A"
            if 'response' in locals() and hasattr(response, 'choices') and response.choices:
                raw_text = response.choices[0].message.content
            return {"error": str(e), "raw_response": raw_text}

    def extract_text_from_xml(self, xml_text: str) -> str:
        """Parses the XML response to extract the main body text."""
        try:
            # A more robust way to handle namespaces
            namespaces = {'ce': 'http://www.elsevier.com/xml/common/dtd', 'bk': 'http://www.elsevier.com/xml/bk/dtd'}
            root = ET.fromstring(xml_text)
            # Find all paragraph tags, checking for common variations
            paragraphs = root.findall('.//ce:para', namespaces) or root.findall('.//bk:para', namespaces)
            full_text = "\n".join([para.text for para in paragraphs if para.text])
            return full_text if full_text else "Could not extract paragraph text from XML."
        except ET.ParseError:
            return "XML Parse Error: Could not parse the retrieved text."

    def run_test(self, papers_to_test: list):
        """Loops through a small list of papers to test the full pipeline."""
        print("\n" + "="*60)
        print(f"Starting End-to-End JSON Analysis Test on {len(papers_to_test)} papers...")
        print("="*60)

        for i, paper_info in enumerate(papers_to_test):
            doi = paper_info.get('doi')
            title = paper_info.get('title', 'N/A')
            
            print(f"\n[{i+1}/{len(papers_to_test)}] Processing: {title[:70]}...")
            print(f"    DOI: {doi}")

            result_row = paper_info.copy()

            if not doi:
                result_row['Analysis_Status'] = 'Skipped - No DOI'
                self.analysis_results.append(result_row)
                continue

            url = f"{self.article_retrieval_url}{doi}"
            headers = {'Accept': 'text/xml', 'X-ELS-APIKey': self.scopus_api_key}

            try:
                response = requests.get(url, headers=headers, timeout=45)
                
                if response.status_code == 200:
                    print("    ✅ Scopus: Full text retrieved successfully.")
                    full_text = self.extract_text_from_xml(response.text)
                    
                    if "Could not extract" in full_text or "XML Parse Error" in full_text:
                         print(f"    ⚠️  XML Parsing Warning: {full_text}")
                         result_row['Analysis_Status'] = 'LLM Skipped - XML Parse Error'
                    else:
                        llm_analysis = self.analyze_text_with_gemini(full_text)
                        result_row.update(llm_analysis)
                        result_row['Analysis_Status'] = 'Analyzed by LLM'
                    
                else:
                    result_row['Analysis_Status'] = f"Scopus Retrieval Failed - Status {response.status_code}"
                    print(f"    ❌ Scopus: Could not retrieve text. Marked for manual review.")

            except requests.exceptions.RequestException as e:
                result_row['Analysis_Status'] = f"Scopus Retrieval Failed - Network Error"
                print(f"    ❌ A network error occurred: {e}")
            
            self.analysis_results.append(result_row)
            time.sleep(20) # Use a longer delay for the more powerful model as a precaution

    def display_results(self):
        """Prints the final results in a readable format."""
        print("\n" + "="*60)
        print("TEST COMPLETE: FINAL JSON-PARSED RESULTS (using Gemini 2.5 Flash)")
        print("="*60)
        for result in self.analysis_results:
            print(f"\n--- Title: {result.get('title')} ---")
            print(f"Analysis Status: {result.get('Analysis_Status')}")
            if result.get('Analysis_Status') == 'Analyzed by LLM':
                # Pretty print the JSON for easy reading
                ai_output = {k: v for k, v in result.items() if k in ['Publication_Type', 'Usage_Type', 'Usage_Description', 'Research_Domain', 'Key_Findings', 'Policy_Implications', 'Notes']}
                print(json.dumps(ai_output, indent=2))
            if result.get('error'):
                print(f"Error Details: {result.get('error')}")
                print(f"Raw Response from LLM: {result.get('raw_response')}")

if __name__ == "__main__":
    scopus_key = "7cb67bc87041113e16b3604ec1d33cd6" 
    openrouter_key = "sk-or-v1-905a6044695ef2d548bb430cecf6bd264136070f30d01591c3cfa2315b0033e0a"
    
    sample_papers = [
        {'doi': '10.1016/j.jhealeco.2021.102569', 'title': 'Treatment consolidation after vertical integration: Evidence from outpatient procedure markets'},
        {'doi': '10.1016/j.jclinepi.2021.08.021', 'title': 'A tutorial on the use of an instrumental variable in a regression discontinuity design'},
        {'doi': '10.1016/j.joclim.2023.100216', 'title': 'The carbon footprint of health system employee commutes'}
    ]
    
    try:
        pipeline = AHRQ_2_5_Flash_Pipeline(scopus_api_key=scopus_key, openrouter_api_key=openrouter_key)
        pipeline.run_test(papers_to_test=sample_papers)
        pipeline.display_results()
    except Exception as e:
        print(f"\n--- A critical error occurred during initialization: {e} ---")