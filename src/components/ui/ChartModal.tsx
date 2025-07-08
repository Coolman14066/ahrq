import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Download, Share2, Maximize2, Table, PieChart } from 'lucide-react';
import { PremiumButton } from './PremiumButton';
import { ModalPortal } from './ModalPortal';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onExport?: (format: 'png' | 'pdf' | 'csv') => void;
  onShare?: () => void;
  data?: any[];
}

export const ChartModal: React.FC<ChartModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  onExport,
  onShare,
  data,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animations
      requestAnimationFrame(() => {
        setIsVisible(true);
        document.body.style.overflow = 'hidden';
      });
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/80 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ pointerEvents: 'auto' }}
        onClick={handleBackdropClick}
      >
        {/* Modal Container */}
        <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div
            ref={modalRef}
            className={`relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl pointer-events-auto transition-all duration-200 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
                  {subtitle && (
                    <p className="mt-2 text-base text-gray-600">{subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {data && (
                    <button
                      onClick={() => setShowDataTable(!showDataTable)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        showDataTable 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {showDataTable ? <PieChart size={16} /> : <Table size={16} />}
                      {showDataTable ? 'Show Chart' : 'Show Data'}
                    </button>
                  )}
                  {onExport && (
                    <div className="relative group">
                      <PremiumButton
                        variant="secondary"
                        size="small"
                        icon={<Download size={16} />}
                        onClick={() => {}}
                      >
                        Export
                      </PremiumButton>
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExport('png');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Export as PNG
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExport('pdf');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Export as PDF
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onExport('csv');
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Export as CSV
                        </button>
                      </div>
                    </div>
                  )}
                  {onShare && (
                    <PremiumButton
                      variant="secondary"
                      size="small"
                      icon={<Share2 size={16} />}
                      onClick={onShare}
                    >
                      Share
                    </PremiumButton>
                  )}
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <div className="p-6">
                {showDataTable && data ? (
                  <DataTable data={data} />
                ) : (
                  <div className="w-full">
                    {children}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 rounded-b-2xl border-t border-gray-100 px-6 py-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Data last updated: {new Date().toLocaleDateString()}</span>
                <span>Press ESC or click outside to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

// Data table component
const DataTable: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {headers.map((header) => (
                <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Enhanced Expandable Chart component
interface ExpandableChartProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
  onExport?: (format: 'png' | 'pdf' | 'csv') => void;
  data?: any[];
}

export const ExpandableChart: React.FC<ExpandableChartProps> = ({
  title,
  subtitle,
  children,
  expandedContent,
  onExport,
  data,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsExpanded(true);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setShowHint(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowHint(false);
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="relative cursor-pointer"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        
        {/* Expand hint overlay */}
        <div 
          className={`absolute inset-0 bg-black/5 rounded-lg transition-opacity duration-200 ${
            showHint ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
        
        {/* Expand hint tooltip */}
        <div 
          className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-gray-900/90 text-white text-xs rounded-lg transition-all duration-200 pointer-events-none ${
            showHint ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        >
          <Maximize2 size={14} />
          <span>Click to expand</span>
        </div>
      </div>

      <ChartModal
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={title}
        subtitle={subtitle}
        onExport={onExport}
        data={data}
      >
        {expandedContent || children}
      </ChartModal>
    </>
  );
};