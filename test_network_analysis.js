// Test network analysis with sample data
import { parseAuthors, extractAuthorCollaborations, buildAuthorNetwork } from './src/utils/networkUtils.ts';

// Sample data from the CSV
const samplePublications = [
  {
    title: "Prices Paid to Hospitals by Private Health Plans",
    authors: "Becker C.; [+ others]",
    year: 2025,
    research_domain: "Market Power & Pricing",
    policy_impact_score: 85,
    quality_score: 90
  },
  {
    title: "Health Care Affordability Board Meeting",
    authors: "[Vishaal Pegany, Deputy Director; CJ Howard, Assistant Deputy Director; Andrew Feher, Research and Analysis Group Manager; David Seltz, Executive Director, Massachusetts Health Policy Commission; Sarah Bartelmann, Cost Growth Target & Health Care Market Oversight Program Manager, Oregon Health Authority; Michael Valle, Deputy Director and Chief Information Officer; Dionne Evans-Dean, Chief Data Officer; Chris Krawczyk, Chief Analytics Officer; Margareta Brandt, Assistant Deputy Director]",
    year: 2025,
    research_domain: "Methodology & Data Quality",
    policy_impact_score: 75,
    quality_score: 85
  },
  {
    title: "Ten Things to Know About Consolidation",
    authors: "Zachary Levinson, Jamie Godwin, Scott Hulver, and Tricia Neuman",
    year: 2024,
    research_domain: "Consolidation & Mergers",
    policy_impact_score: 90,
    quality_score: 95
  },
  {
    title: "Consolidation And Mergers Among Health Systems",
    authors: "Contreary K.; [+ others]",
    year: 2023,
    research_domain: "Consolidation & Mergers", 
    policy_impact_score: 80,
    quality_score: 88
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
console.log("Nodes:", network.nodes.map(n => n.name));
console.log("\nMetrics:", network.metrics);