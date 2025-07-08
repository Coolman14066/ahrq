# AHRQ Dashboard Implementation Plan

## Current State Analysis

### ✅ Completed
1. **CSV Parsing** - Fixed with PapaParse, properly handles complex data
2. **Data Analysis** - Verified data quality and meaningful flow patterns
3. **Basic Visualizations** - USMap, NetworkGraph, and SankeyDiagram components created

### 🔍 Key Findings
- **Data Quality**: 146 publications with complete policy implications
- **Flow Patterns**: Clear pathways from research to policy recommendations
- **Network Potential**: 92 publications with multiple authors for collaboration analysis

## Critical Issues to Address

### 1. 🚨 Dashboard Refactoring (HIGH PRIORITY)
The main `AHRQDashboard.tsx` file is 1,500+ lines and needs to be split:

```
src/
  components/
    dashboard/
      Overview.tsx         # Overview statistics and charts
      Explorer.tsx         # Data table and search
      TrendsAnalysis.tsx   # Temporal trends
      DomainAnalysis.tsx   # Research domain breakdown
      GapsAnalysis.tsx     # Research gaps identification
    common/
      LoadingState.tsx     # Reusable loading component
      ErrorBoundary.tsx    # Error handling wrapper
      MetricCard.tsx       # Reusable metric display
```

### 2. 🔧 Sankey Visualization Fixes
- **Issue**: Type errors and color scheme problems
- **Solution**: 
  - Add proper TypeScript types for D3 elements
  - Fix color mapping for node categories
  - Ensure meaningful flow weights based on publication count

### 3. 📊 Network Graph Enhancement
- **Issue**: Author name parsing needs improvement
- **Solution**:
  - Better author name normalization
  - Handle edge cases like "[+ others]"
  - Add collaboration strength metrics

### 4. 🗺️ Geographic Map Improvements
- **Issue**: Using rectangles instead of real state boundaries
- **Solution**:
  - Integrate TopoJSON for real US state shapes
  - Add proper geographic data aggregation
  - Fix state code mapping

## Implementation Roadmap

### Phase 1: Core Fixes (Days 1-2)
1. **Refactor Dashboard**
   - Extract view components
   - Create shared state management
   - Implement proper loading/error states

2. **Fix Sankey Types**
   - Add D3 type annotations
   - Fix color scheme mapping
   - Test with real data flows

3. **Add Error Handling**
   - Wrap components in error boundaries
   - Add fallback UI for failures
   - Implement retry mechanisms

### Phase 2: Data Processing (Days 3-4)
1. **Enhance Author Processing**
   - Implement fuzzy name matching
   - Handle various author formats
   - Build author disambiguation

2. **Improve Geographic Mapping**
   - Parse state names from geographic_focus
   - Handle multi-state regions
   - Add international categorization

3. **Optimize Performance**
   - Memoize expensive calculations
   - Add data caching layer
   - Implement virtual scrolling for tables

### Phase 3: Advanced Features (Days 5-7)
1. **Export Functionality**
   - PDF report generation
   - CSV data export
   - Chart image export

2. **Interactive Filters**
   - Cross-visualization filtering
   - Time range selection
   - Domain/category filtering

3. **Analytics Dashboard**
   - Trend predictions
   - Impact scoring algorithms
   - Research gap identification

## Testing Strategy

### Unit Tests
- Data processing utilities
- Policy categorization logic
- Network building algorithms

### Integration Tests
- CSV parsing with edge cases
- Visualization rendering
- Filter interactions

### E2E Tests
- Full dashboard workflow
- Export functionality
- Cross-browser compatibility

## Performance Targets
- Initial load: < 3 seconds
- Visualization updates: < 500ms
- Search/filter response: < 100ms
- Memory usage: < 200MB

## Next Immediate Steps

1. **Fix TypeScript Errors** (1 hour)
   - Add proper type annotations
   - Remove unused imports
   - Fix any/implicit type issues

2. **Test Sankey with Real Data** (2 hours)
   - Verify flow generation
   - Check visual rendering
   - Validate insights panel

3. **Create Loading States** (1 hour)
   - Add skeleton screens
   - Implement progress indicators
   - Handle async data loading

4. **Begin Dashboard Refactor** (4 hours)
   - Extract first component (Overview)
   - Set up component structure
   - Test integration

This plan ensures we build a robust, maintainable dashboard that provides real value from the AHRQ data while avoiding the "hogwash" problem of meaningless visualizations.