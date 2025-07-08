// Test network analysis with sample data
import { parseAuthors, extractAuthorCollaborations, buildAuthorNetwork } from './src/utils/networkUtils';
import { Publication } from './src/types/publication';

// Sample data from the CSV
const samplePublications: Publication[] = [
  {
    publication_type: 'GOVERNMENT',
    title: "Prices Paid to Hospitals by Private Health Plans",
    authors: "Becker C.; [+ others]",
    year: 2025,
    journal: "House Health Care Comm. Hearing Slides",
    publisher: "Vermont General Assembly",
    usage_type: 'RESEARCH_ENABLER',
    usage_justification: '',
    usage_description: '',
    research_domain: "Market Power & Pricing",
    geographic_focus: 'Vermont',
    data_years: '2018-2022',
    key_findings: '',
    policy_implications: '',
    doi_url: '',
    notes: '',
    policy_impact_score: 85,
    quality_score: 90,
    citation_count: 0
  },
  {
    publication_type: 'GOVERNMENT',
    title: "Health Care Affordability Board Meeting",
    authors: "[Vishaal Pegany, Deputy Director; CJ Howard, Assistant Deputy Director; Andrew Feher, Research and Analysis Group Manager; David Seltz, Executive Director, Massachusetts Health Policy Commission; Sarah Bartelmann, Cost Growth Target & Health Care Market Oversight Program Manager, Oregon Health Authority; Michael Valle, Deputy Director and Chief Information Officer; Dionne Evans-Dean, Chief Data Officer; Chris Krawczyk, Chief Analytics Officer; Margareta Brandt, Assistant Deputy Director]",
    year: 2025,
    journal: "Conference Presentation",
    publisher: "Office of Health Care Affordability",
    usage_type: 'RESEARCH_ENABLER',
    usage_justification: '',
    usage_description: '',
    research_domain: "Methodology & Data Quality",
    geographic_focus: 'California',
    data_years: '2023',
    key_findings: '',
    policy_implications: '',
    doi_url: '',
    notes: '',
    policy_impact_score: 75,
    quality_score: 85,
    citation_count: 0
  },
  {
    publication_type: 'POLICY',
    title: "Ten Things to Know About Consolidation",
    authors: "Zachary Levinson, Jamie Godwin, Scott Hulver, and Tricia Neuman",
    year: 2024,
    journal: "KFF Issue Brief",
    publisher: "Kaiser Family Foundation",
    usage_type: 'PRIMARY_ANALYSIS',
    usage_justification: '',
    usage_description: '',
    research_domain: "Consolidation & Mergers",
    geographic_focus: 'USA',
    data_years: '2022',
    key_findings: '',
    policy_implications: '',
    doi_url: '',
    notes: '',
    policy_impact_score: 90,
    quality_score: 95,
    citation_count: 5
  },
  {
    publication_type: 'ACADEMIC',
    title: "Consolidation And Mergers Among Health Systems",
    authors: "Contreary K.; [+ others]",
    year: 2023,
    journal: "Health Affairs Forefront",
    publisher: "Health Affairs",
    usage_type: 'PRIMARY_ANALYSIS',
    usage_justification: '',
    usage_description: '',
    research_domain: "Consolidation & Mergers", 
    policy_impact_score: 80,
    quality_score: 88,
    geographic_focus: 'USA',
    data_years: '2018-2021',
    key_findings: '',
    policy_implications: '',
    doi_url: '',
    notes: '',
    citation_count: 10
  },
  {
    publication_type: 'POLICY',
    title: "Another collaboration test",
    authors: "Zachary Levinson; Jamie Godwin",
    year: 2024,
    journal: "Test Journal",
    publisher: "Test Publisher",
    usage_type: 'PRIMARY_ANALYSIS',
    usage_justification: '',
    usage_description: '',
    research_domain: "Consolidation & Mergers",
    policy_impact_score: 85,
    quality_score: 92,
    geographic_focus: 'USA',
    data_years: '2024',
    key_findings: '',
    policy_implications: '',
    doi_url: '',
    notes: '',
    citation_count: 2
  }
];

// Test author parsing
console.log("Testing author parsing:");
samplePublications.forEach(pub => {
  console.log(`\nTitle: ${pub.title}`);
  console.log(`Raw authors: ${pub.authors}`);
  const parsed = parseAuthors(pub.authors);
  console.log(`Parsed authors:`, parsed);
});

// Test collaboration extraction
console.log("\n\nTesting collaboration extraction:");
const collaborations = extractAuthorCollaborations(samplePublications);
console.log(`Found ${collaborations.length} collaborations`);
collaborations.forEach(collab => {
  console.log(`${collab.author1} <-> ${collab.author2}: ${collab.collaborationCount} publications`);
});

// Test network building
console.log("\n\nTesting network building:");
const network = buildAuthorNetwork(samplePublications);
console.log(`Network has ${network.nodes.length} nodes and ${network.edges.length} edges`);
console.log("\nNodes:");
network.nodes.forEach(node => {
  console.log(`- ${node.name}: ${node.publicationCount} publications, ${node.collaborationCount} collaborators`);
});
console.log("\nEdges:");
network.edges.forEach(edge => {
  console.log(`- ${edge.source} <-> ${edge.target}: weight=${edge.weight.toFixed(2)}, publications=${edge.sharedPublications}`);
});
console.log("\nMetrics:", network.metrics);