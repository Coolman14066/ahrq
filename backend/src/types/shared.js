/**
 * Shared Type Definitions for Backend
 * These types mirror the TypeScript definitions for consistency
 * Using JSDoc for type checking in JavaScript
 */

/**
 * @typedef {'GOVERNMENT' | 'ACADEMIC' | 'POLICY' | 'OTHER'} PublicationType
 * @typedef {'PRIMARY_ANALYSIS' | 'RESEARCH_ENABLER' | 'CONTEXTUAL_REFERENCE'} UsageType
 * @typedef {'LOCAL' | 'STATE' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL'} GeographicReach
 * @typedef {'HIGH' | 'MEDIUM' | 'LOW'} MethodologicalRigor
 */

/**
 * @template T
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {T} [data]
 * @property {string} [error]
 * @property {string} timestamp
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} items
 * @property {number} total
 * @property {number} page
 * @property {number} pageSize
 * @property {boolean} hasMore
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {'user' | 'assistant' | 'system'} role
 * @property {string} content
 * @property {Date} timestamp
 * @property {Object} [metadata]
 * @property {Object} [metadata.context]
 * @property {string[]} [metadata.suggestions]
 * @property {ChatAction[]} [metadata.actions]
 */

/**
 * @typedef {Object} ChatAction
 * @property {'view_change' | 'filter_change' | 'publication_select'} type
 * @property {Object} payload
 */

/**
 * @typedef {Object} ChatSession
 * @property {string} id
 * @property {string} [userId]
 * @property {ChatMessage[]} messages
 * @property {ChatContext} context
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} ChatContext
 * @property {ViewType} currentView
 * @property {FilterState} selectedFilters
 * @property {number} [selectedPublication]
 * @property {UserBehavior} userBehavior
 * @property {string[]} activeInsights
 */

/**
 * @typedef {'overview' | 'trends' | 'explorer' | 'domains' | 'methodology' | 'gaps' | 'network' | 'sankey'} ViewType
 */

/**
 * @typedef {Object} FilterState
 * @property {[number, number]} years
 * @property {PublicationType[]} publicationTypes
 * @property {UsageType[]} usageTypes
 * @property {string[]} domains
 * @property {string[]} authors
 */

/**
 * @typedef {Object} UserBehavior
 * @property {Record<ViewType, number>} viewCounts
 * @property {Record<string, number>} filterUsage
 * @property {number} totalInteractions
 * @property {string[]} interests
 */

/**
 * @typedef {Object} QueryIntent
 * @property {'search' | 'filter' | 'aggregate' | 'analyze'} type
 * @property {Object} parameters
 */

/**
 * @typedef {Object} QueryResult
 * @property {QueryIntent} intent
 * @property {any[]} results
 * @property {number} count
 * @property {number} executionTime
 */

/**
 * @typedef {Object} Insight
 * @property {string} id
 * @property {'trend' | 'pattern' | 'recommendation' | 'anomaly'} type
 * @property {number} priority
 * @property {string} title
 * @property {string} description
 * @property {Object} [data]
 * @property {InsightAction[]} [actions]
 */

/**
 * @typedef {Object} InsightAction
 * @property {string} label
 * @property {ChatAction} action
 */

/**
 * @typedef {Object} ApiError
 * @property {string} code
 * @property {string} message
 * @property {Object} [details]
 * @property {string} [stack]
 */

/**
 * @typedef {Object} SocketEvent
 * @property {string} event
 * @property {any} data
 * @property {Date} timestamp
 */

/**
 * @typedef {Object} SocketError
 * @property {string} code
 * @property {string} message
 * @property {boolean} reconnect
 */

/**
 * @typedef {Object} ServiceStatus
 * @property {string} name
 * @property {'healthy' | 'degraded' | 'down'} status
 * @property {Date} lastCheck
 * @property {Object} [details]
 */

/**
 * @typedef {Object} HealthCheckResponse
 * @property {'ok' | 'error'} status
 * @property {string} timestamp
 * @property {ServiceStatus[]} services
 * @property {number} uptime
 */

// Type Guards
export function isPublicationType(value) {
  return ['GOVERNMENT', 'ACADEMIC', 'POLICY', 'OTHER'].includes(value);
}

export function isUsageType(value) {
  return ['PRIMARY_ANALYSIS', 'RESEARCH_ENABLER', 'CONTEXTUAL_REFERENCE'].includes(value);
}

export function isViewType(value) {
  return ['overview', 'trends', 'explorer', 'domains', 'methodology', 'gaps', 'network', 'sankey'].includes(value);
}

// Constants
export const PublicationTypes = {
  GOVERNMENT: 'GOVERNMENT',
  ACADEMIC: 'ACADEMIC',
  POLICY: 'POLICY',
  OTHER: 'OTHER'
};

export const UsageTypes = {
  PRIMARY_ANALYSIS: 'PRIMARY_ANALYSIS',
  RESEARCH_ENABLER: 'RESEARCH_ENABLER',
  CONTEXTUAL_REFERENCE: 'CONTEXTUAL_REFERENCE'
};

export const ViewTypes = {
  OVERVIEW: 'overview',
  TRENDS: 'trends',
  EXPLORER: 'explorer',
  DOMAINS: 'domains',
  METHODOLOGY: 'methodology',
  GAPS: 'gaps',
  NETWORK: 'network',
  SANKEY: 'sankey'
};