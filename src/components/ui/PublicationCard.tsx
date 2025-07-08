import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, ExternalLink, Calendar, Users, 
  Building, FileText, MapPin, TrendingUp,
  Quote, Target, Lightbulb, Link2
} from 'lucide-react';
import { Publication } from '../../types/publication';
import { UsageTypeBadge } from './UsageTypeBadge';
import { ModernCard } from './ModernCard';
import { AuthorService } from '../../services/authorService';

interface PublicationCardProps {
  publication: Publication;
  variant?: 'compact' | 'expanded' | 'detailed';
  onSelect?: (publication: Publication) => void;
  isSelected?: boolean;
}

export const PublicationCard: React.FC<PublicationCardProps> = ({
  publication,
  variant = 'expanded',
  onSelect,
  isSelected = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  const formatAuthors = (authors: string) => {
    const parsed = AuthorService.parseAuthors(authors);
    return AuthorService.formatAuthorList(parsed.authors, { maxAuthors: 2 });
  };
  
  if (variant === 'compact') {
    return (
      <ModernCard 
        variant="interactive" 
        className={`
          transition-all duration-200 
          ${isSelected ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-lg'}
        `}
        onClick={() => onSelect?.(publication)}
      >
        <div className="space-y-3">
          {/* Header with badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                {publication.title}
              </h3>
            </div>
            <UsageTypeBadge type={publication.usage_type} size="small" />
          </div>
          
          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {publication.year}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} />
              {formatAuthors(publication.authors)}
            </span>
            <span className="flex items-center gap-1">
              <FileText size={14} />
              {publication.publication_type}
            </span>
          </div>
          
          {/* Publisher and data info */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              <Building size={14} className="inline mr-1" />
              {publication.publisher}
            </span>
            {publication.data_years_used && publication.data_years_used !== 'n/a' && (
              <span className="text-xs text-gray-500">
                <Calendar size={14} className="inline mr-1" />
                Data: {publication.data_years_used}
              </span>
            )}
          </div>
        </div>
      </ModernCard>
    );
  }
  
  return (
    <ModernCard 
      variant={isSelected ? 'gradient' : 'elevated'}
      className={`
        transition-all duration-200 
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      <div className="space-y-4">
        {/* Header section */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {publication.title}
            </h3>
            {publication.doi_url && (
              <a 
                href={publication.doi_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 transition-colors p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
          
          {/* Usage type prominently displayed */}
          <div className="flex items-center gap-3">
            <UsageTypeBadge type={publication.usage_type} size="medium" showTooltip />
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm font-medium text-gray-700">
              {publication.publication_type}
            </span>
          </div>
        </div>
        
        {/* Author and publication info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2 text-gray-700">
            <Users size={16} className="mt-0.5 text-gray-400" />
            <span>{publication.authors}</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-1">
              <Building size={14} />
              {publication.journal || publication.publisher}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {publication.year}
            </span>
          </div>
        </div>
        
        
        {/* Domain and geographic info */}
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
            <Target size={14} />
            {publication.research_domain}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
            <MapPin size={14} />
            {publication.geographic_focus}
          </span>
        </div>
        
        {/* Usage description - always visible as requested */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <Lightbulb size={14} />
            Usage Description
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {truncateText(publication.usage_description, 150)}
          </p>
        </div>
        
        {/* Expandable section */}
        {variant === 'detailed' && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {isExpanded ? 'Show Less' : 'Show More Details'}
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {isExpanded && (
              <div className="space-y-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                {/* Key findings */}
                {publication.key_findings && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <TrendingUp size={14} />
                      Key Findings
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {publication.key_findings}
                    </p>
                  </div>
                )}
                
                {/* Policy implications */}
                {publication.policy_implications && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Target size={14} />
                      Policy Implications
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {publication.policy_implications}
                    </p>
                  </div>
                )}
                
                {/* Usage justification */}
                {publication.usage_justification && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Quote size={14} />
                      Usage Justification
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      "{publication.usage_justification}"
                    </p>
                  </div>
                )}
                
                {/* Data years */}
                {publication.data_years_used && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span className="font-medium">Data Years:</span>
                    <span>{publication.data_years_used}</span>
                  </div>
                )}
                
                {/* External link */}
                {publication.doi_url && (
                  <div className="pt-2">
                    <a 
                      href={publication.doi_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Link2 size={14} />
                      View Full Publication
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ModernCard>
  );
};

// Grid view wrapper component
interface PublicationGridProps {
  publications: Publication[];
  variant?: 'compact' | 'expanded' | 'detailed';
  onSelectPublication?: (publication: Publication) => void;
  selectedId?: number;
}

export const PublicationGrid: React.FC<PublicationGridProps> = ({
  publications,
  variant = 'expanded',
  onSelectPublication,
  selectedId
}) => {
  const gridCols = variant === 'compact' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2';
  
  return (
    <div className={`grid ${gridCols} gap-4`}>
      {publications.map((pub) => (
        <PublicationCard
          key={pub.id}
          publication={pub}
          variant={variant}
          onSelect={onSelectPublication}
          isSelected={pub.id === selectedId}
        />
      ))}
    </div>
  );
};