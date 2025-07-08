# AHRQ Research Impact Dashboard

A React-based dashboard for tracking and analyzing AHRQ (Agency for Healthcare Research and Quality) research papers and their policy implications.

## Features

- **Paper Explorer**: Browse and search through 146 AHRQ research publications
- **Trend Analysis**: Visualize publication trends over time
- **Domain Analysis**: Explore research by domain (Consolidation & Mergers, Quality & Outcomes, etc.)
- **Sankey Flow Visualization**: See how research flows from publication type → usage → domain → policy impact
- **Author Network Graph**: Explore collaboration networks between researchers
- **Policy Impact Tracking**: Track how research influences policy decisions

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
# or
./start-dev.sh
```

3. Open http://localhost:3000 in your browser

## Data

The dashboard loads data from `public/ahrq_reference_good.csv` which contains:
- 146 research publications
- Publication metadata (type, year, authors, journal)
- Usage categorization (Primary Analysis, Research Enabler, Contextual Reference)
- Research domains and policy implications
- Quality and impact scoring

## Key Visualizations

### 1. Overview Dashboard
- Total publication count
- Research domain distribution
- Policy impact metrics
- Publication type breakdown

### 2. Paper Explorer
- Searchable table of all publications
- Filter by domain, year, usage type, and publication type
- Detailed view with key findings and policy implications

### 3. Sankey Diagram
Shows the flow of research impact:
- Publication Type (Government, Academic, Policy, Other)
- Usage Type (Primary Analysis, Research Enabler, Contextual Reference)
- Research Domain (41 in Consolidation & Mergers, 21 in Methodology, etc.)
- Policy Impact Category (Market Competition, Healthcare Affordability, etc.)

### 4. Author Network
- Interactive force-directed graph
- Shows collaboration patterns
- Node size indicates publication count
- Edge width shows collaboration strength

## Technology Stack

- React 18 with TypeScript
- Vite for fast development
- D3.js for advanced visualizations
- Recharts for standard charts
- Tailwind CSS for styling
- PapaParse for CSV parsing

## Development

The codebase is organized as:
```
src/
  AHRQDashboard.tsx         # Main dashboard component
  components/
    visualizations/
      NetworkGraph.tsx      # Author collaboration network
      SankeyDiagram.tsx     # Research impact flow
  utils/
    csvParser.ts           # CSV parsing with data enrichment
    networkUtils.ts        # Network graph data processing
    sankeyUtils.ts         # Sankey diagram data processing
  types/
    publication.ts         # TypeScript interfaces
    network.ts
    sankey.ts
```

## Notes

- The dashboard automatically calculates quality scores based on data completeness
- Policy impact scores are derived from keyword analysis
- Geographic reach is determined from the geographic_focus field
- Loading states are shown while data is being parsed