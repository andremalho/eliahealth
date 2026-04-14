export interface CopilotCheckResultItem {
  severity: 'action_required' | 'attention' | 'ok';
  category: string;
  title: string;
  description: string;
  suggested_action: string | null;
  guideline_reference: string;
}

export interface CopilotCheckResult {
  items: CopilotCheckResultItem[];
}
