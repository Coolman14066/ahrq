# Phase 1C Implementation: Sankey Diagrams for Research Impact Flow

## Implementation Overview
Building interactive Sankey diagrams using D3.js to visualize the flow from research publications through usage patterns to policy impact outcomes, based on careful analysis of actual AHRQ data patterns.

## Data-Driven Design Approach

### Meaningful Flow Structure (Based on Real Data Analysis)
**Primary Flow**: `Publication_Type → Usage_Type → Research_Domain → Policy_Impact_Category`

This flow tells a complete story:
1. **Publication_Type**: How research originates (GOVERNMENT, POLICY, ACADEMIC, OTHER)
2. **Usage_Type**: How AHRQ data is utilized (PRIMARY_ANALYSIS, RESEARCH_ENABLER, CONTEXTUAL_REFERENCE)
3. **Research_Domain**: What areas are studied (Market Power & Pricing, Consolidation & Mergers, etc.)
4. **Policy_Impact_Category**: What policy outcomes result (derived from policy implications text)

### Policy Impact Categorization (Data-Driven)
Based on analysis of actual policy implications text, these categories capture real outcomes:

```typescript
export enum PolicyImpactCategory {
  MARKET_COMPETITION = 'Market Competition & Antitrust',
  HEALTHCARE_AFFORDABILITY = 'Healthcare Affordability & Access',
  DATA_STANDARDS = 'Data & Methodology Standards', 
  QUALITY_OVERSIGHT = 'Quality & Performance Oversight',
  STRATEGIC_PLANNING = 'Strategic Planning & Policy Development'
}
```

## Components to Build

### 1. SankeyDiagram Component
**File**: `src/components/visualizations/SankeyDiagram.tsx`
**Purpose**: Interactive Sankey visualization showing research impact flow
**Features**:
- Multi-level flow visualization with smooth curves
- Interactive node and link highlighting
- Tooltip system with detailed flow information
- Flow filtering and drill-down capabilities
- Responsive design with mobile adaptation

### 2. Sankey Data Processing
**File**: `src/utils/sankeyUtils.ts`
**Purpose**: Transform AHRQ publication data into Sankey-compatible format
**Functions**:
- `categorizePolicyImpact()`: NLP-based categorization of policy implications
- `buildSankeyFlow()`: Create node and link structures for visualization
- `calculateFlowWeights()`: Weight flows by publication count, quality, impact
- `generateSankeyMetrics()`: Calculate flow statistics and insights

### 3. Sankey Types
**File**: `src/types/sankey.ts`
**Purpose**: TypeScript interfaces for Sankey data structures
**Interfaces**:
- `SankeyNode`: Flow stage nodes with metadata
- `SankeyLink`: Connections between nodes with weights
- `SankeyFlow`: Complete flow data structure
- `FlowMetrics`: Statistical analysis of flows

## Data Processing Pipeline

### Policy Impact Text Analysis
```typescript
const categorizePolicyImpact = (policyText: string): PolicyImpactCategory => {
  const text = policyText.toLowerCase();
  
  // Market Competition & Antitrust
  if (text.includes('antitrust') || text.includes('competition') || 
      text.includes('market power') || text.includes('consolidation')) {
    return PolicyImpactCategory.MARKET_COMPETITION;
  }
  
  // Healthcare Affordability & Access
  if (text.includes('affordability') || text.includes('cost') || 
      text.includes('pricing') || text.includes('access')) {
    return PolicyImpactCategory.HEALTHCARE_AFFORDABILITY;
  }
  
  // Data & Methodology Standards
  if (text.includes('transparency') || text.includes('data collection') ||
      text.includes('methodology') || text.includes('standardization')) {
    return PolicyImpactCategory.DATA_STANDARDS;
  }
  
  // Quality & Performance Oversight
  if (text.includes('quality') || text.includes('performance') ||
      text.includes('patient safety') || text.includes('outcomes')) {
    return PolicyImpactCategory.QUALITY_OVERSIGHT;
  }
  
  // Strategic Planning & Policy Development (default)
  return PolicyImpactCategory.STRATEGIC_PLANNING;
};
```

### Flow Weight Calculation
```typescript
const calculateFlowWeight = (publications: Publication[]): number => {
  return publications.reduce((weight, pub) => {
    let baseWeight = 1;
    
    // Weight by quality score (0-100 scale)
    baseWeight *= (pub.quality_score || 50) / 50;
    
    // Weight by policy impact score (0-100 scale)  
    baseWeight *= (pub.policy_impact_score || 50) / 50;
    
    // Recency bonus (more recent = higher weight)
    const yearWeight = pub.year >= 2023 ? 1.5 : pub.year >= 2020 ? 1.2 : 1.0;
    baseWeight *= yearWeight;
    
    return weight + baseWeight;
  }, 0);
};
```

## D3.js Sankey Implementation Strategy

### Sankey Layout Configuration
```typescript
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const sankeyGenerator = sankey()
  .nodeWidth(15)
  .nodePadding(10)
  .extent([[1, 1], [width - 1, height - 6]]);

const { nodes, links } = sankeyGenerator({
  nodes: sankeyData.nodes,
  links: sankeyData.links
});
```

### Interactive Features
```typescript
// Node hover highlighting
node.on('mouseover', (event, d) => {
  // Highlight connected links
  link.style('opacity', l => 
    l.source === d || l.target === d ? 0.8 : 0.2
  );
  
  // Show detailed tooltip
  showTooltip(tooltip, generateNodeTooltip(d), event);
});

// Link click for drill-down
link.on('click', (event, d) => {
  // Show publications contributing to this flow
  onFlowClick(d);
});
```

### Color Scheme Strategy
```typescript
const getNodeColor = (node: SankeyNode) => {
  const colorScheme = {
    // Publication Type colors
    'GOVERNMENT': '#DC2626',    // Red
    'POLICY': '#2563EB',        // Blue  
    'ACADEMIC': '#059669',      // Green
    'OTHER': '#7C3AED',         // Purple
    
    // Usage Type colors
    'PRIMARY_ANALYSIS': '#EA580C',     // Orange
    'RESEARCH_ENABLER': '#CA8A04',     // Yellow
    'CONTEXTUAL_REFERENCE': '#7C2D12', // Brown
    
    // Research Domain colors (varied palette)
    'Market Power & Pricing': '#BE123C',
    'Consolidation & Mergers': '#9333EA',
    'Methodology & Data Quality': '#0891B2',
    // ... etc
    
    // Policy Impact colors
    'Market Competition & Antitrust': '#DC2626',
    'Healthcare Affordability & Access': '#16A34A',
    'Data & Methodology Standards': '#2563EB',
    'Quality & Performance Oversight': '#EA580C',
    'Strategic Planning & Policy Development': '#7C3AED'
  };
  
  return colorScheme[node.name] || '#6B7280';
};
```

## Integration with Dashboard

### Navigation Integration
Add Sankey view to existing dashboard navigation between geographic and network views:

```typescript
// Update navigation array to include sankey
{['overview', 'explorer', 'trends', 'domains', 'methodology', 'geographic', 'sankey', 'network', 'gaps'].map((view) => (
  // Navigation rendering
))}
```

### Sankey View Implementation
```typescript
{activeView === 'sankey' && (
  <div className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <TrendingUp className="mr-2" size={20} />
        Research Impact Flow Analysis
      </h3>
      <div className="mb-6">
        <p className="text-gray-600">
          Visualizing how AHRQ research flows from publication through usage patterns to policy impact outcomes
        </p>
      </div>
      
      <SankeyDiagram 
        publications={filteredPublications}
        flowType="policy_impact"
        onFlowClick={(flow) => {
          console.log('Selected flow:', flow);
        }}
        height={600}
      />
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FlowInsightsPanel />
      <ImpactMetricsPanel />
    </div>
  </div>
)}
```

## Performance Considerations

### Data Optimization
- **Flow Aggregation**: Combine small flows below threshold for cleaner visualization
- **Node Clustering**: Group related nodes to reduce complexity
- **Lazy Loading**: Load detailed flow data only when nodes are expanded
- **Memoization**: Cache expensive flow calculations

### Visual Optimization
- **Canvas Fallback**: Use Canvas for large datasets, SVG for interactivity
- **Progressive Disclosure**: Start with high-level flows, drill down on demand
- **Responsive Adaptation**: Simplify layout on mobile devices
- **Animation Performance**: Use CSS transforms for smooth transitions

## Testing Strategy

### Data Validation
- Verify policy impact categorization accuracy against manual review
- Test flow conservation (input totals match output totals)
- Validate edge cases (publications with multiple domains, missing data)

### Visual Testing
- Test with varying dataset sizes (10 to 147 publications)
- Verify responsive behavior across screen sizes
- Test interaction performance (hover, click, zoom)

### User Experience Testing
- Validate that flows tell meaningful stories
- Test discoverability of insights through interaction
- Ensure accessibility compliance (screen readers, keyboard navigation)

## Implementation Timeline

### Phase 1C.1: Core Sankey Infrastructure
- [ ] Create Sankey data processing utilities
- [ ] Implement policy impact categorization algorithm
- [ ] Build basic D3 Sankey layout

### Phase 1C.2: Interactive Features
- [ ] Add node and link hover interactions
- [ ] Implement flow drill-down capabilities
- [ ] Create detailed tooltip system

### Phase 1C.3: Dashboard Integration
- [ ] Integrate with existing navigation
- [ ] Add flow control panels
- [ ] Create complementary insight panels

### Phase 1C.4: Polish & Insights
- [ ] Optimize performance for large datasets
- [ ] Add flow analysis and metrics
- [ ] Create meaningful insight generation

## Success Metrics

### Functionality
- [ ] Sankey accurately represents actual data flows
- [ ] Policy impact categorization >85% accuracy
- [ ] Interactive features work smoothly across devices

### User Value
- [ ] Users can discover meaningful research impact patterns
- [ ] Flow visualization leads to actionable insights
- [ ] Complements rather than duplicates other dashboard views

### Data Integrity
- [ ] Flow conservation maintained (no data loss in transitions)
- [ ] Edge cases handled gracefully
- [ ] Performance acceptable with full dataset

## Key Implementation Insights

### Based on Real Data Analysis
1. **Meaningful Categories**: Policy impact categories derived from actual policy implications text
2. **Weighted Flows**: Flow thickness based on publication quality, impact scores, and recency
3. **Actionable Insights**: Focus on patterns that inform research strategy and policy decisions
4. **Data-Driven Design**: Every visual element justified by actual data patterns

### Value Proposition
- **For Researchers**: Understand which research approaches lead to policy impact
- **For Policymakers**: See evidence pathways supporting policy decisions  
- **For AHRQ**: Demonstrate research ROI and identify strategic opportunities

## Next Steps (Phase 1D)
After completing Sankey implementation:
1. Interactive timeline visualizations for temporal analysis
2. Advanced filtering integration across all visualization components
3. Export and sharing capabilities for insights discovered through visualizations