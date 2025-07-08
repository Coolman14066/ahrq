# AHRQ Dashboard System Architecture

## Overview
The AHRQ Research Impact Dashboard is a comprehensive React/TypeScript application designed to provide deep insights into healthcare research and policy implications.

## Core Architecture

### Frontend Layer
- **Framework**: React 18 with TypeScript
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **Styling**: Tailwind CSS with responsive design
- **Visualizations**: Recharts + D3.js for advanced analytics
- **Routing**: Single-page application with view-based navigation

### Data Layer
- **Primary Source**: CSV files (ahrq_reference_good.csv)
- **Processing**: Client-side CSV parsing with data enhancement
- **Caching**: Browser-based caching with intelligent invalidation
- **Validation**: Real-time data quality scoring

### Enhanced Data Model
```typescript
interface Publication {
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
  // Computed fields
  quality_score?: number;
  policy_impact_score?: number;
  geographic_reach?: 'LOCAL' | 'STATE' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';
  methodological_rigor?: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

### Component Architecture

#### Core Dashboard Components
- `AHRQDashboard`: Main container component
- `Navigation`: Tab-based navigation system
- `FilterControls`: Advanced filtering and search
- `PublicationModal`: Enhanced publication details with methodology explanations

#### Visualization Components (Phase 1)
- `USMap`: Interactive state/region mapping
- `NetworkGraph`: Author and institution collaboration networks
- `SankeyDiagram`: Research impact flow visualization
- `ResearchTimeline`: Temporal analysis and trends

#### Advanced Analytics (Phase 2)
- `StatisticalEngine`: ML-powered research insights
- `PredictiveAnalytics`: Trend forecasting and gap analysis
- `ImpactScoring`: Multi-dimensional research impact assessment

#### AI Integration (Phase 3)
- `ResearchAssistant`: OpenRouter-powered chatbot
- `QueryProcessor`: Natural language query interpretation
- `ContextManager`: Conversation state and dashboard integration

### Data Processing Pipeline

#### 1. CSV Ingestion
```typescript
const parseCSVData = async (csvPath: string): Promise<Publication[]> => {
  // Fetch CSV data from public directory
  // Parse and validate data structure
  // Transform to Publication interface
  // Apply data quality scoring
}
```

#### 2. Enhancement Processing
```typescript
const enhancePublications = (pubs: Publication[]): Publication[] => {
  // Calculate quality scores (0-100%)
  // Determine policy impact scores
  // Classify geographic reach
  // Assess methodological rigor
}
```

#### 3. Real-time Filtering
```typescript
const filteredPublications = useMemo(() => {
  // Apply search query across all fields
  // Filter by domain, year, usage type
  // Apply quality thresholds
  // Geographic reach filtering
}, [searchQuery, filters, qualityThreshold]);
```

## Key Features

### Current Implementation (Phase 1 Complete)
✅ **Enhanced Data Model**: Full CSV integration with computed metrics
✅ **Advanced Filtering**: Multi-dimensional filtering with quality thresholds
✅ **Publication Details**: Comprehensive modal with methodology explanations
✅ **Quality Assessment**: Automated scoring and impact analysis
✅ **Methodology Hub**: Complete documentation and educational resources

### Phase 1 (In Progress): Advanced Visualizations
🔄 **Geographic Intelligence**: US state maps with research concentration
🔄 **Network Analytics**: Author collaboration and citation networks
🔄 **Temporal Analysis**: Interactive research evolution timelines
🔄 **Impact Flow**: Sankey diagrams showing research → policy pathways

### Phase 2 (Planned): Statistical Analysis Engine
📋 **Impact Scoring**: Multi-dimensional research influence algorithms
📋 **Predictive Analytics**: ML-based trend forecasting and gap detection
📋 **Network Analysis**: Advanced collaboration and citation metrics
📋 **Research Intelligence**: Automated insight generation

### Phase 3 (Planned): AI Research Assistant
📋 **Natural Language Queries**: OpenRouter-powered research assistance
📋 **Context Awareness**: Dashboard-integrated conversational AI
📋 **Research Recommendations**: Personalized suggestions and insights
📋 **Export Integration**: AI-generated reports and summaries

## Performance Considerations

### Current Optimizations
- **Data Processing**: Memoized calculations for filter operations
- **Component Rendering**: React.memo for stable components
- **Search Performance**: Debounced search with indexed fields
- **Modal Performance**: Lazy loading of detailed content

### Planned Optimizations (Phase 1)
- **D3.js Integration**: Efficient SVG rendering with Canvas fallbacks
- **Geographic Data**: Lazy loading of TopoJSON files
- **Network Visualizations**: WebGL rendering for large datasets
- **Virtual Scrolling**: For large publication lists

### Future Scalability (Phases 2-3)
- **Web Workers**: Heavy statistical computations in background threads
- **Service Workers**: Offline capability and advanced caching
- **Code Splitting**: Dynamic imports for advanced features
- **CDN Integration**: Optimized asset delivery

## Security & Privacy

### Data Handling
- **Public Data**: All research data is publicly available
- **No PII**: No personally identifiable information stored
- **API Security**: Rate limiting and authentication for AI services
- **CSP Headers**: Content Security Policy for XSS protection

### Deployment Security
- **HTTPS Only**: Secure transmission of all data
- **Environment Variables**: Secure API key management
- **Build Process**: Automated security scanning
- **Dependencies**: Regular vulnerability scanning

## Technology Stack

### Core Dependencies
- **React 18**: Component framework
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Recharts**: Basic charting components

### Phase 1 Additions
- **D3.js v7**: Advanced data visualizations
- **TopoJSON**: Geographic data format
- **React Hook**: D3-React integration patterns

### Phase 2 Additions
- **Python Integration**: Backend statistical processing
- **scikit-learn**: Machine learning algorithms
- **NetworkX**: Network analysis algorithms
- **Socket.io**: Real-time data updates

### Phase 3 Additions
- **OpenRouter SDK**: AI model integration
- **Web Speech API**: Voice query capabilities
- **Vector Embeddings**: Semantic search functionality

This architecture supports the transformation from a basic publication tracker to a comprehensive research intelligence platform while maintaining performance, usability, and extensibility.