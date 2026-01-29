/**
 * Agent 系统导出
 */

// 类型
export * from './types';

// 需求分析
export {
  analyzeRequest,
  conversationalAnalysis,
  streamConversationalAnalysis,
  quickAnalysis,
} from './requestAnalyzer';

// 用户 Agent
export {
  analyzeUserResources,
  generateOffer,
  generateOffersFromNetwork,
  getSimulatedUsers,
} from './userAgent';

// 匹配引擎
export {
  evaluateMatch,
  evaluateAndRankOffers,
  quickMatch,
  generateMatchReason,
  generateMatchingSummary,
  type MatchingSummary,
} from './matchingEngine';

// 协调器
export {
  createSession,
  getSession,
  executeMatching,
  handleConversation,
  quickMatchRequest,
  acceptOffer,
  rejectOffer,
  getSessionStats,
  type MatchingResult,
} from './coordinator';
