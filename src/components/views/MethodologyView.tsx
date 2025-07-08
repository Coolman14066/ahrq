import { useState } from 'react';
import { BookOpen, Zap, Search, ChevronDown, ChevronUp, Brain, FileText, Target, Info } from 'lucide-react';
import { PremiumCard, PremiumSectionCard } from '../ui/PremiumCard';
import { PremiumButton } from '../ui/PremiumButton';

interface MethodologyViewProps {
  // Add any props if needed in the future
}

export const MethodologyView: React.FC<MethodologyViewProps> = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-base via-primary-dark to-primary-darker p-8 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <BookOpen className="h-10 w-10 text-white mr-4" />
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Research Methodology Guide</h2>
              <p className="text-primary-lightest text-lg mt-1">AI-powered analysis framework for systematic research categorization</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI-Powered Research Methodology */}
      <PremiumSectionCard
        title="AI-Powered Research Analysis Framework"
        subtitle="Leveraging Gemini AI to systematically analyze and categorize research publications"
        variant="elevated"
      >
        <div className="space-y-4">
          {/* Data Collection Strategy */}
          <div className="border border-neutral-boundary rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('collection-strategy')}
              className="w-full px-6 py-4 bg-neutral-surface hover:bg-neutral-boundary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <Search className="h-6 w-6 text-primary-base mr-3" />
                <span className="text-lg font-semibold text-neutral-charcoal">Data Collection Strategy</span>
              </div>
              {expandedSections.has('collection-strategy') ? 
                <ChevronUp className="h-5 w-5 text-neutral-supporting" /> : 
                <ChevronDown className="h-5 w-5 text-neutral-supporting" />
              }
            </button>
            {expandedSections.has('collection-strategy') && (
              <div className="p-6 bg-white">
                <div className="space-y-4 text-base text-neutral-charcoal">
                  <div className="bg-primary-lightest p-4 rounded-lg">
                    <h4 className="font-semibold text-primary-dark mb-2">Initial Paper Discovery</h4>
                    <ul className="space-y-2 text-primary-base">
                      <li className="flex items-start"><span className="mr-2">•</span><span>Manual searches on Google Scholar using combinations of "AHRQ Compendium" keywords</span></li>
                      <li className="flex items-start"><span className="mr-2">•</span><span>Systematic collection of academic papers, policy briefs, and government reports</span></li>
                      <li className="flex items-start"><span className="mr-2">•</span><span>Forward and backward citation tracking to find related works</span></li>
                    </ul>
                  </div>
                  <div className="bg-accent-lightest p-4 rounded-lg">
                    <h4 className="font-semibold text-accent-dark mb-2">AI Processing Pipeline</h4>
                    <ul className="space-y-2 text-accent-base">
                      <li className="flex items-start"><span className="mr-2">•</span><span>Papers fed to Gemini 2.5-Pro for structured analysis</span></li>
                      <li className="flex items-start"><span className="mr-2">•</span><span>15-column semicolon-delimited output format for Excel compatibility</span></li>
                      <li className="flex items-start"><span className="mr-2">•</span><span>Systematic extraction of usage patterns, findings, and policy implications</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Analysis Framework */}
          <div className="border border-neutral-boundary rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('analysis-framework')}
              className="w-full px-6 py-4 bg-neutral-surface hover:bg-neutral-boundary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-primary-base mr-3" />
                <span className="text-lg font-semibold text-neutral-charcoal">AI Analysis Framework</span>
              </div>
              {expandedSections.has('analysis-framework') ? 
                <ChevronUp className="h-5 w-5 text-neutral-supporting" /> : 
                <ChevronDown className="h-5 w-5 text-neutral-supporting" />
              }
            </button>
            {expandedSections.has('analysis-framework') && (
              <div className="p-6 bg-white">
                <div className="space-y-6">
                  <div className="bg-primary-lightest p-5 rounded-lg">
                    <h4 className="font-semibold text-primary-dark mb-3 text-lg">Core Mission & Philosophy</h4>
                    <p className="text-primary-base text-base mb-3">
                      The AI serves as an expert research analyst, not a data entry clerk. Each entry is a comprehensive story that allows readers to understand:
                    </p>
                    <ul className="space-y-2 text-primary-base text-base">
                      <li className="flex items-start"><span className="mr-2">•</span><span><strong>What:</strong> How the AHRQ Compendium was used</span></li>
                      <li className="flex items-start"><span className="mr-2">•</span><span><strong>Why:</strong> The purpose and research context</span></li>
                      <li className="flex items-start"><span className="mr-2">•</span><span><strong>How:</strong> The specific methodology employed</span></li>
                      <li className="flex items-start"><span className="mr-2">•</span><span><strong>So What:</strong> Policy implications and real-world impact</span></li>
                    </ul>
                  </div>

                  <div className="bg-neutral-surface p-5 rounded-lg">
                    <h4 className="font-semibold text-neutral-charcoal mb-3 text-lg">Usage Type Classification System</h4>
                    <div className="space-y-3">
                      <div className="bg-white p-4 rounded-lg border border-neutral-boundary">
                        <h5 className="font-semibold text-primary-base mb-1">PRIMARY_ANALYSIS</h5>
                        <p className="text-sm text-neutral-supporting">AHRQ data serves as the direct source for key quantitative findings reported as central results</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-neutral-boundary">
                        <h5 className="font-semibold text-accent-base mb-1">RESEARCH_ENABLER</h5>
                        <p className="text-sm text-neutral-supporting">AHRQ data provides foundational structure or methodology for the research design</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-neutral-boundary">
                        <h5 className="font-semibold text-neutral-slate mb-1">CONTEXTUAL_REFERENCE</h5>
                        <p className="text-sm text-neutral-supporting">AHRQ statistics provide background context or validation for broader arguments</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent-lightest p-5 rounded-lg">
                    <h4 className="font-semibold text-accent-dark mb-3 text-lg">Quality Control Process</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-accent-lighter">
                        <h5 className="font-semibold text-accent-base mb-2">Story Completeness</h5>
                        <p className="text-sm text-neutral-supporting">Can stakeholders understand the full context from this row alone?</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-accent-lighter">
                        <h5 className="font-semibold text-accent-base mb-2">Evidence Clarity</h5>
                        <p className="text-sm text-neutral-supporting">Does the description justify the usage type classification?</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-accent-lighter">
                        <h5 className="font-semibold text-accent-base mb-2">Consistency</h5>
                        <p className="text-sm text-neutral-supporting">Does this follow the same logic as previous entries?</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-accent-lighter">
                        <h5 className="font-semibold text-accent-base mb-2">Precision</h5>
                        <p className="text-sm text-neutral-supporting">Are specific numbers and verbs used instead of vague language?</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Output Schema */}
          <div className="border border-neutral-boundary rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('output-schema')}
              className="w-full px-6 py-4 bg-neutral-surface hover:bg-neutral-boundary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-primary-base mr-3" />
                <span className="text-lg font-semibold text-neutral-charcoal">Output Schema & Format</span>
              </div>
              {expandedSections.has('output-schema') ? 
                <ChevronUp className="h-5 w-5 text-neutral-supporting" /> : 
                <ChevronDown className="h-5 w-5 text-neutral-supporting" />
              }
            </button>
            {expandedSections.has('output-schema') && (
              <div className="p-6 bg-white">
                <div className="space-y-4">
                  <div className="bg-neutral-surface p-4 rounded-lg">
                    <h4 className="font-semibold text-neutral-charcoal mb-3 text-lg">15-Column Structure</h4>
                    <div className="bg-neutral-charcoal text-neutral-pure p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm font-mono">
                        Publication_Type | Title | Authors_Standardized | Publication_Year | Journal_Venue | Publisher | Usage_Type | Usage_Justification | Usage_Description | Research_Domain | Geographic_Focus | Data_Years_Used | Key_Findings | Policy_Implications | DOI_URL | Notes
                      </code>
                    </div>
                    <p className="text-base text-neutral-supporting mt-3">
                      Semicolon-delimited format chosen for Excel compatibility and to handle complex text with commas
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-primary-lightest p-4 rounded-lg">
                      <h5 className="font-semibold text-primary-dark mb-2">Key Fields</h5>
                      <ul className="space-y-1 text-sm text-primary-base">
                        <li>• <strong>Usage_Description:</strong> Narrative of AHRQ's role</li>
                        <li>• <strong>Key_Findings:</strong> Quantifiable results</li>
                        <li>• <strong>Policy_Implications:</strong> Real-world impact</li>
                      </ul>
                    </div>
                    <div className="bg-accent-lightest p-4 rounded-lg">
                      <h5 className="font-semibold text-accent-dark mb-2">Standardization Rules</h5>
                      <ul className="space-y-1 text-sm text-accent-base">
                        <li>• Authors: "Last Name F.; [+ others]"</li>
                        <li>• Years: Four-digit format (e.g., 2024)</li>
                        <li>• Missing data: "Not specified in document"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PremiumSectionCard>

      {/* Usage Type Taxonomy */}
      <PremiumSectionCard
        title="AHRQ Data Usage Type Classification"
        subtitle="Three distinct categories for classifying how research leverages AHRQ Compendium data"
        variant="elevated"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PremiumCard variant="gradient" padding="compact">
            <h4 className="font-semibold text-primary-dark mb-2 flex items-center text-lg">
              <span className="bg-primary-base text-white text-sm px-3 py-1 rounded mr-3">PRIMARY</span>
              Primary Analysis
            </h4>
            <p className="text-neutral-charcoal text-base mb-3">
              AHRQ data serves as the primary analytical foundation, with key findings directly derived from the Compendium.
            </p>
            <div className="text-sm text-neutral-supporting">
              <strong>Examples:</strong>
              <ul className="mt-2 space-y-1">
                <li className="flex items-start"><span className="mr-2">•</span><span>Market concentration analysis using HHI calculations</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span>System affiliation impact studies</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span>Physician employment trend analysis</span></li>
              </ul>
            </div>
          </PremiumCard>

          <PremiumCard variant="gradient" padding="compact">
            <h4 className="font-semibold text-accent-dark mb-2 flex items-center text-lg">
              <span className="bg-accent-base text-white text-sm px-3 py-1 rounded mr-3">ENABLER</span>
              Research Enabler
            </h4>
            <p className="text-neutral-charcoal text-base mb-3">
              AHRQ data provides essential infrastructure for analysis of other datasets by providing system definitions and linkages.
            </p>
            <div className="text-sm text-neutral-supporting">
              <strong>Examples:</strong>
              <ul className="mt-2 space-y-1">
                <li className="flex items-start"><span className="mr-2">•</span><span>Hospital-to-system linking for price analysis</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span>System classification for quality studies</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span>Practice identification frameworks</span></li>
              </ul>
            </div>
          </PremiumCard>

          <PremiumCard variant="gradient" padding="compact">
            <h4 className="font-semibold text-neutral-slate mb-2 flex items-center text-lg">
              <span className="bg-neutral-slate text-white text-sm px-3 py-1 rounded mr-3">CONTEXT</span>
              Contextual Reference
            </h4>
            <p className="text-neutral-charcoal text-base mb-3">
              AHRQ data provides background context, validation, or supporting evidence for broader research arguments.
            </p>
            <div className="text-sm text-neutral-supporting">
              <strong>Examples:</strong>
              <ul className="mt-2 space-y-1">
                <li className="flex items-start"><span className="mr-2">•</span><span>Market statistics for context setting</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span>Validation of system definitions</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span>Background trend documentation</span></li>
              </ul>
            </div>
          </PremiumCard>
        </div>
      </PremiumSectionCard>

      {/* Analytical Best Practices */}
      <PremiumSectionCard
        title="Analytical Best Practices & Guidelines"
        subtitle="Research design recommendations and important limitations to consider"
        variant="elevated"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <PremiumCard variant="glass" padding="compact">
              <h4 className="font-semibold text-primary-dark mb-3 text-lg">Research Design Recommendations</h4>
              <ul className="space-y-2 text-base text-neutral-charcoal">
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>Temporal considerations:</strong> Account for system evolution over time</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>Geographic specificity:</strong> Consider regional healthcare market variations</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>Control variables:</strong> Include system size, ownership, and teaching status</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>Causal inference:</strong> Use natural experiments and instrumental variables</span></li>
              </ul>
            </PremiumCard>
            <PremiumCard variant="glass" padding="compact">
              <h4 className="font-semibold text-primary-dark mb-3 text-lg">Citation & Attribution Guidelines</h4>
              <div className="text-base text-neutral-charcoal space-y-2">
                <p><strong>Standard Citation Format:</strong></p>
                <p className="bg-neutral-surface p-3 rounded text-sm font-mono">
                  Agency for Healthcare Research and Quality. (Year). Compendium of U.S. Health Systems. Rockville, MD: AHRQ.
                </p>
                <p><strong>Usage Attribution:</strong> Clearly specify which Compendium year and data elements were used.</p>
              </div>
            </PremiumCard>
          </div>
          <div className="space-y-4">
            <PremiumCard variant="glass" padding="compact">
              <h4 className="font-semibold text-warning-base mb-3 text-lg">Limitations & Caveats</h4>
              <ul className="space-y-2 text-base text-neutral-charcoal">
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>Temporal lag:</strong> Compendium data may reflect past organizational states</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>Scope boundaries:</strong> Limited to formal ownership/management relationships</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>Definition sensitivity:</strong> System definitions may not capture all integration types</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>Data completeness:</strong> Coverage varies by organization type and size</span></li>
              </ul>
            </PremiumCard>
            <PremiumCard variant="glass" padding="compact">
              <h4 className="font-semibold text-accent-dark mb-3 text-lg">Future Research Opportunities</h4>
              <ul className="space-y-2 text-base text-neutral-charcoal">
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>Longitudinal studies:</strong> Track system evolution and impacts over time</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>Mixed methods:</strong> Combine quantitative and qualitative approaches</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>International comparisons:</strong> Benchmark against global health systems</span></li>
                <li className="flex items-start"><span className="mr-2">•</span><span><strong>AI/ML applications:</strong> Predictive modeling of consolidation trends</span></li>
              </ul>
            </PremiumCard>
          </div>
        </div>
      </PremiumSectionCard>

      {/* Interactive Glossary */}
      <PremiumSectionCard
        title="Key Terms & Definitions"
        subtitle="Essential terminology for understanding health system research"
        variant="elevated"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-neutral-boundary rounded-lg hover:border-primary-light hover:shadow-sm transition-all">
            <h4 className="font-semibold text-neutral-charcoal text-base">Health System</h4>
            <p className="text-sm text-neutral-supporting mt-2">Two or more hospitals owned or managed by the same entity, or one hospital plus one or more other healthcare facilities</p>
          </div>
          <div className="p-4 border border-neutral-boundary rounded-lg hover:border-primary-light hover:shadow-sm transition-all">
            <h4 className="font-semibold text-neutral-charcoal text-base">HHI (Herfindahl-Hirschman Index)</h4>
            <p className="text-sm text-neutral-supporting mt-2">Market concentration measure ranging from 0-10,000; &gt;2,500 indicates highly concentrated markets</p>
          </div>
          <div className="p-4 border border-neutral-boundary rounded-lg hover:border-primary-light hover:shadow-sm transition-all">
            <h4 className="font-semibold text-neutral-charcoal text-base">Vertical Integration</h4>
            <p className="text-sm text-neutral-supporting mt-2">Common ownership of different types of healthcare providers along the care continuum</p>
          </div>
          <div className="p-4 border border-neutral-boundary rounded-lg hover:border-primary-light hover:shadow-sm transition-all">
            <h4 className="font-semibold text-neutral-charcoal text-base">Market Concentration</h4>
            <p className="text-sm text-neutral-supporting mt-2">The degree to which a small number of firms control a large proportion of market activity</p>
          </div>
          <div className="p-4 border border-neutral-boundary rounded-lg hover:border-primary-light hover:shadow-sm transition-all">
            <h4 className="font-semibold text-neutral-charcoal text-base">Safety-Net System</h4>
            <p className="text-sm text-neutral-supporting mt-2">Health system serving a high proportion of uninsured and Medicaid patients</p>
          </div>
          <div className="p-4 border border-neutral-boundary rounded-lg hover:border-primary-light hover:shadow-sm transition-all">
            <h4 className="font-semibold text-neutral-charcoal text-base">System Affiliation</h4>
            <p className="text-sm text-neutral-supporting mt-2">Formal ownership or management relationship between healthcare entities</p>
          </div>
        </div>
      </PremiumSectionCard>
    </div>
  );
};