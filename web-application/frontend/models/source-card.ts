/**
 * Source card data — evidence card shown when an agent cites a web source.
 * Used in both Argue.AI (debate evidence) and DeadTalk (biographical sources).
 */
export interface SourceCard {
  id: string;
  title: string;
  url: string;
  snippet: string;
  agentId: string;
  timestamp: number;
  favicon?: string;
}
