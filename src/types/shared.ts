/**
 * Shared Type Definitions
 * These types are used across both frontend and backend
 * to ensure consistency in data structures
 */

// Publication Types
export type PublicationType = 'GOVERNMENT' | 'ACADEMIC' | 'POLICY' | 'OTHER';
export type UsageType = 'PRIMARY_ANALYSIS' | 'RESEARCH_ENABLER' | 'CONTEXTUAL_REFERENCE';
export type GeographicReach = 'LOCAL' | 'STATE' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';
export type MethodologicalRigor = 'HIGH' | 'MEDIUM' | 'LOW';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    context?: Record<string, any>;
    suggestions?: string[];
    actions?: ChatAction[];
  };
}

export interface ChatAction {
  type: 'view_change' | 'filter_change' | 'publication_select';
  payload: Record<string, any>;
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  context: ChatContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatContext {
  currentView: ViewType;
  selectedFilters: FilterState;
  selectedPublication?: number;
  userBehavior: UserBehavior;
  activeInsights: string[];
}

// View and Filter Types
export type ViewType = 'overview' | 'trends' | 'explorer' | 'domains' | 'methodology' | 'gaps' | 'network' | 'sankey';

export interface FilterState {
  years: [number, number];
  publicationTypes: PublicationType[];
  usageTypes: UsageType[];
  domains: string[];
  authors: string[];
}

export interface UserBehavior {
  viewCounts: Record<ViewType, number>;
  filterUsage: Record<string, number>;
  totalInteractions: number;
  interests: string[];
}

// Data Query Types
export interface QueryIntent {
  type: 'search' | 'filter' | 'aggregate' | 'analyze';
  parameters: Record<string, any>;
}

export interface QueryResult {
  intent: QueryIntent;
  results: any[];
  count: number;
  executionTime: number;
}

// Insight Types
export interface Insight {
  id: string;
  type: 'trend' | 'pattern' | 'recommendation' | 'anomaly';
  priority: number;
  title: string;
  description: string;
  data?: Record<string, any>;
  actions?: InsightAction[];
}

export interface InsightAction {
  label: string;
  action: ChatAction;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

// WebSocket Event Types
export interface SocketEvent<T = any> {
  event: string;
  data: T;
  timestamp: Date;
}

export interface SocketError {
  code: string;
  message: string;
  reconnect: boolean;
}

// Service Status Types
export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  details?: Record<string, any>;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: ServiceStatus[];
  uptime: number;
}

// Type Guards
export function isPublicationType(value: string): value is PublicationType {
  return ['GOVERNMENT', 'ACADEMIC', 'POLICY', 'OTHER'].includes(value);
}

export function isUsageType(value: string): value is UsageType {
  return ['PRIMARY_ANALYSIS', 'RESEARCH_ENABLER', 'CONTEXTUAL_REFERENCE'].includes(value);
}

export function isViewType(value: string): value is ViewType {
  return ['overview', 'trends', 'explorer', 'domains', 'methodology', 'gaps', 'network', 'sankey'].includes(value);
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];

export type ValueOf<T> = T[keyof T];