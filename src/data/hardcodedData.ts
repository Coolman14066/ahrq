import { Publication } from '../hooks/usePublicationData';

// Transform hardcoded data to new structure (temporary until CSV integration)
export const hardcodedDataTransformed: Publication[] = [
  {
    id: 1,
    publication_type: "GOVERNMENT",
    title: "Prices Paid to Hospitals by Private Health Plans – Findings from RAND 5.1",
    authors: "Becker C.; [+ others]",
    year: 2025,
    journal: "House Health Care Comm. Hearing Slides",
    publisher: "Vermont General Assembly",
    usage_type: "RESEARCH_ENABLER",
    usage_justification: "AHRQ is used to link hospitals to systems, which defines the groups for comparison. The actual data being compared is RAND price data. AHRQ provides the structure for the analysis of other data.",
    usage_description: "Used Compendium to link VT hospitals to systems; compared RAND price data across system vs independent hospitals",
    research_domain: "Market Power & Pricing",
    geographic_focus: "Vermont (state)",
    data_years_used: "2018-2022",
    key_findings: "System-affiliated hospitals charged higher mean %-of-Medicare",
    policy_implications: "Informed VT H-266; supports expanded Green Mountain Care Board merger oversight",
    doi_url: "https://vtleg.bluehousegroup.com/committee/document/2026/15/Date/5-13-2025",
    notes: "ok",
    geographic_reach: "STATE",
    methodological_rigor: "HIGH"
  },
  {
    id: 2,
    publication_type: "GOVERNMENT",
    title: "Health Care Affordability Board Meeting Presentation",
    authors: "[Vishaal Pegany, Deputy Director; CJ Howard, Assistant Deputy Director; Andrew Feher, Research and Analysis Group Manager; David Seltz, Executive Director, Massachusetts Health Policy Commission; Sarah Bartelmann, Cost Growth Target & Health Care Market Oversight Program Manager, Oregon Health Authority; Michael Valle, Deputy Director and Chief Information Officer; Dionne Evans-Dean, Chief Data Officer; Chris Krawczyk, Chief Analytics Officer; Margareta Brandt, Assistant Deputy Director]",
    year: 2025,
    journal: "Conference Presentation",
    publisher: "Office of Health Care Affordability, Department of Health Care Access and Information",
    usage_type: "RESEARCH_ENABLER",
    usage_justification: "AHRQ's definition is used to provide a conceptual/definitional framework for OHCA's consideration.",
    usage_description: "Used AHRQ Compendium definition of a health system as one possible definition for OHCA to consider, noting it excludes some types of systems like hospital-only systems.",
    research_domain: "Methodology & Data Quality",
    geographic_focus: "California",
    data_years_used: "2023",
    key_findings: "The AHRQ Compendium provides a definition of health systems based on common ownership or joint management of at least one hospital and a group of physicians providing comprehensive care, with specific thresholds for the number of physicians and primary care physicians.",
    policy_implications: "The AHRQ definition is one of several being considered by OHCA for defining health systems, which will impact how performance is assessed and enforcement is applied",
    doi_url: "https://hcai.ca.gov/wp-content/uploads/2025/03/March-2025-Board-Meeting-Presentation.pdf",
    notes: "",
    geographic_reach: "STATE",
    methodological_rigor: "MEDIUM"
  },
  {
    id: 3,
    publication_type: "GOVERNMENT",
    title: "Report to the Congress: Medicare Payment Policy",
    authors: "[Medicare Payment Advisory Commission]",
    year: 2025,
    journal: "Medicare Payment Advisory Commission",
    publisher: "Medicare Payment Advisory Commission",
    usage_type: "CONTEXTUAL_REFERENCE",
    usage_justification: "A specific statistic from AHRQ is cited to provide context.",
    usage_description: "Used AHRQ compendium to note that by 2021, 52 percent of all physicians were affiliated with a health system.",
    research_domain: "Consolidation & Mergers",
    geographic_focus: "USA",
    data_years_used: "2021",
    key_findings: "The share of hospital markets that were 'super' concentrated rose from 47 percent in 2003 to 57 percent in 2017, and by 2021, 52 percent of all physicians were affiliated with a health system.",
    policy_implications: "a potential policy implication is the need for increased regulatory scrutiny and data collection concerning provider consolidation to understand its effects on Medicare payment adequacy, market competition, and healthcare costs",
    doi_url: "https://www.medpac.gov/wp-content/uploads/2025/03/Mar25_MedPAC_Report_To_Congress_SEC.pdf",
    notes: "",
    geographic_reach: "NATIONAL",
    methodological_rigor: "LOW"
  }
  // Additional publications would continue here...
];