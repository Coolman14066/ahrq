import React, { useState } from 'react';
import { Building, TrendingUp, Users, FileText, BarChart3, Target, BookOpen, Sparkles } from 'lucide-react';
import { PremiumCard, PremiumSectionCard } from '../ui/PremiumCard';
import { PremiumButton } from '../ui/PremiumButton';
import {
  getTopInstitutions,
  analyzeCrossSectorCollaboration,
  extractKeyResearchQuestions,
  extractPolicyApplications
} from '../../utils/researchAnalytics';
import { AuthorService } from '../../services/authorService';

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
  geographic_reach?: 'LOCAL' | 'STATE' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';
  methodological_rigor?: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface DomainData {
  name: string;
  value: number;
  percentage: number;
}

interface DomainsViewProps {
  publicationsData: Publication[];
  domainData: DomainData[];
}

// Metric card component
const DomainMetricCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: { value: number; isPositive: boolean };
}> = ({ icon, title, value, subtitle, trend }) => (
  <PremiumCard variant="elevated" padding="compact" className="relative overflow-hidden">
    <div className="absolute top-3 right-3 p-2 bg-primary-lightest rounded-lg">
      {icon}
    </div>
    <div className="pr-16">
      <p className="text-sm font-medium text-neutral-supporting mb-1">{title}</p>
      <p className="text-2xl font-bold text-neutral-charcoal mb-1">{value}</p>
      <p className="text-sm text-neutral-supporting">{subtitle}</p>
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${trend.isPositive ? 'text-accent-base' : 'text-warning-base'}`}>
          <TrendingUp size={14} className={trend.isPositive ? '' : 'rotate-180'} />
          <span>{trend.value}% from last year</span>
        </div>
      )}
    </div>
  </PremiumCard>
);

export const DomainsView: React.FC<DomainsViewProps> = ({ publicationsData, domainData }) => {
  const [selectedDomain, setSelectedDomain] = useState(domainData[0]?.name || 'Consolidation & Mergers');

  const domainPublications = publicationsData.filter(pub => pub.research_domain === selectedDomain);
  
  // Calculate author statistics
  const authorCounts = new Map();
  domainPublications.forEach(pub => {
    const parsed = AuthorService.parseAuthors(pub.authors);
    parsed.authors.forEach(author => {
      if (!author.isInstitution && author.fullName) {
        authorCounts.set(author.fullName, (authorCounts.get(author.fullName) || 0) + 1);
      }
    });
  });
  const topAuthors = Array.from(authorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => AuthorService.parseAuthors(name).authors[0]?.lastName || name);

  // Calculate journal statistics
  const journalCounts = new Map();
  domainPublications.forEach(pub => {
    if (pub.journal) {
      journalCounts.set(pub.journal, (journalCounts.get(pub.journal) || 0) + 1);
    }
  });
  const topJournals = Array.from(journalCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name);

  const questions = extractKeyResearchQuestions(publicationsData, selectedDomain);
  const applications = extractPolicyApplications(publicationsData, selectedDomain);
  const topInstitutions = getTopInstitutions(publicationsData, 8);
  const collaborationData = analyzeCrossSectorCollaboration(publicationsData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-base via-primary-dark to-accent-base p-8 text-white">
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Sparkles className="h-10 w-10 text-white mr-4" />
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Research Domains Analysis</h2>
                <p className="text-primary-lightest text-lg mt-1">Deep dive into research focus areas and impact</p>
              </div>
            </div>
            <div className="flex gap-3">
              <PremiumButton variant="glass" size="small">
                Export Analysis
              </PremiumButton>
              <PremiumButton variant="secondary" size="small">
                View Trends
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Selector */}
      <PremiumCard variant="elevated" padding="compact">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-charcoal">Select Research Domain</h3>
          <span className="text-sm text-neutral-supporting">{domainData.length} domains available</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {domainData.map((domain) => (
            <button
              key={domain.name}
              onClick={() => setSelectedDomain(domain.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedDomain === domain.name
                  ? 'bg-primary-base text-white shadow-lg'
                  : 'bg-neutral-surface text-neutral-charcoal hover:bg-neutral-boundary'
              }`}
            >
              {domain.name} ({domain.value})
            </button>
          ))}
        </div>
      </PremiumCard>

      {/* Domain Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DomainMetricCard
          icon={<FileText className="h-5 w-5 text-primary-base" />}
          title="Publications"
          value={domainData.find(d => d.name === selectedDomain)?.value || 0}
          subtitle={`${domainData.find(d => d.name === selectedDomain)?.percentage || 0}% of all research`}
          trend={{ value: 12, isPositive: true }}
        />
        <DomainMetricCard
          icon={<Users className="h-5 w-5 text-accent-base" />}
          title="Leading Authors"
          value={topAuthors.length > 0 ? topAuthors.join(', ') : 'Various'}
          subtitle="Multiple publications each"
        />
        <DomainMetricCard
          icon={<BookOpen className="h-5 w-5 text-primary-base" />}
          title="Key Journals"
          value={topJournals.length > 0 ? topJournals[0] : 'Health Affairs'}
          subtitle={topJournals.length > 1 ? `+${topJournals.length - 1} more` : 'Primary venue'}
        />
        <DomainMetricCard
          icon={<Target className="h-5 w-5 text-accent-base" />}
          title="Policy Impact"
          value="High"
          subtitle="Legislative influence"
        />
      </div>

      {/* Research Focus and Policy Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PremiumSectionCard
          title="Key Research Questions"
          subtitle="Primary areas of investigation in this domain"
          variant="elevated"
        >
          <ul className="space-y-3">
            {(questions.length > 0 ? questions : [
              'Impact of horizontal integration on market competition',
              'Effects on healthcare prices and quality outcomes',
              'Cross-market mergers and price discrimination',
              'Rural hospital consolidation patterns'
            ]).map((question, idx) => (
              <li key={idx} className="flex items-start group">
                <span className="block w-2 h-2 bg-primary-base rounded-full mt-1.5 mr-3 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
                <span className="text-neutral-charcoal">{question}</span>
              </li>
            ))}
          </ul>
        </PremiumSectionCard>

        <PremiumSectionCard
          title="Policy Applications"
          subtitle="Real-world impact and implementation"
          variant="elevated"
        >
          <ul className="space-y-3">
            {(applications.length > 0 ? applications : [
              'FTC merger review guidelines enhancement',
              'State-level oversight legislation (VT, CA)',
              'Price transparency requirements',
              'Antitrust enforcement strengthening'
            ]).map((app, idx) => (
              <li key={idx} className="flex items-start group">
                <span className="block w-2 h-2 bg-accent-base rounded-full mt-1.5 mr-3 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
                <span className="text-neutral-charcoal">{app}</span>
              </li>
            ))}
          </ul>
        </PremiumSectionCard>
      </div>

      {/* Top Publishing Institutions */}
      <PremiumSectionCard
        title="Top Publishing Institutions"
        subtitle="Leading research organizations in AHRQ Compendium studies"
        variant="elevated"
        action={
          <PremiumButton variant="ghost" size="small">
            View All
          </PremiumButton>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topInstitutions.length > 0 ? topInstitutions.map((inst, idx) => (
            <PremiumCard key={idx} variant="glass" padding="compact" hoverEffect="lift">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-lightest rounded-lg">
                    <Building className="h-5 w-5 text-primary-base" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-charcoal">{inst.name}</p>
                    <p className="text-sm text-neutral-supporting">Research institution</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary-base">{inst.count}</span>
              </div>
            </PremiumCard>
          )) : (
            <p className="text-neutral-supporting text-center py-8 col-span-2">No institution data available</p>
          )}
        </div>
      </PremiumSectionCard>

      {/* Cross-Sector Collaboration */}
      <PremiumSectionCard
        title="Cross-Sector Collaboration"
        subtitle="Distribution of research across different sectors"
        variant="elevated"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collaborationData.map((sector, idx) => (
            <PremiumCard key={idx} variant="gradient" padding="compact">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-neutral-charcoal">{sector.sector}</h4>
                  <span className="text-2xl font-bold text-primary-base">{sector.percentage}%</span>
                </div>
                <div className="w-full bg-neutral-boundary rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-base to-accent-base rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${sector.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-neutral-supporting">
                  {sector.count} publications
                </p>
              </div>
            </PremiumCard>
          ))}
        </div>
      </PremiumSectionCard>

      {/* Other Research Domains */}
      <PremiumSectionCard
        title="Explore Other Research Domains"
        subtitle="Discover insights across different research areas"
        variant="elevated"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domainData.filter(d => d.name !== selectedDomain).slice(0, 6).map((domain, index) => (
            <PremiumCard 
              key={index} 
              variant="interactive" 
              padding="compact"
              onClick={() => setSelectedDomain(domain.name)}
              hoverEffect="tilt"
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <BarChart3 className="h-5 w-5 text-primary-base" />
                <span className="text-xs font-medium text-accent-base uppercase tracking-wider">
                  {domain.percentage}%
                </span>
              </div>
              <h4 className="font-semibold text-neutral-charcoal mb-1">{domain.name}</h4>
              <p className="text-2xl font-bold text-primary-base">{domain.value}</p>
              <p className="text-sm text-neutral-supporting">research studies</p>
            </PremiumCard>
          ))}
        </div>
      </PremiumSectionCard>
    </div>
  );
};