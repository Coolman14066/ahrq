import React from 'react';

interface GapsViewProps {
  // Add any props if needed in the future
}

export const GapsView: React.FC<GapsViewProps> = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Research Gap Analysis</h3>
        <div className="mb-6">
          <p className="text-gray-600">Identifying underexplored areas and opportunities for future research based on current coverage</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Geographic Gaps</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                <span className="text-sm text-gray-700">State-specific studies</span>
                <span className="text-sm font-medium text-red-600">Only 8 studies</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                <span className="text-sm text-gray-700">Rural-specific research</span>
                <span className="text-sm font-medium text-red-600">2 studies only</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                <span className="text-sm text-gray-700">Regional comparisons</span>
                <span className="text-sm font-medium text-yellow-600">Limited coverage</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Domain Gaps</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                <span className="text-sm text-gray-700">Antitrust & Competition</span>
                <span className="text-sm font-medium text-red-600">1 study only</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                <span className="text-sm text-gray-700">Payment & Reimbursement</span>
                <span className="text-sm font-medium text-yellow-600">7 studies (5.1%)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                <span className="text-sm text-gray-700">Technology & Innovation</span>
                <span className="text-sm font-medium text-yellow-600">Emerging area</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recommended Research Priorities</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="font-medium text-gray-900">AI/ML in Health Systems</h4>
            <p className="text-sm text-gray-600 mt-1">
              Only emerging in 2024-2025, high potential impact
            </p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-medium text-gray-900">Private Equity Impact</h4>
            <p className="text-sm text-gray-600 mt-1">
              Growing trend with limited systematic analysis
            </p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="font-medium text-gray-900">Rural System Sustainability</h4>
            <p className="text-sm text-gray-600 mt-1">
              Critical gap with only 2 dedicated studies
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Methodological Opportunities</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Longitudinal studies tracking system evolution over time</li>
            <li>• Mixed-methods approaches combining quantitative and qualitative data</li>
            <li>• Natural experiments leveraging policy changes</li>
            <li>• International comparative studies</li>
          </ul>
        </div>
      </div>
    </div>
  );
};