export interface CallCampaignItem {
  child_id: number;
  child_name: string;
  vaccine_name: string;
  scheduled_date?: string | null;
  phone_number: string;
  status: "queued" | "dialing" | "talking" | "completed";
  transcript?: string | null;
  intent?: string | null;
  ai_reply?: string | null;
}

export interface CallCampaign {
  campaign_id: string;
  status: "running" | "completed";
  started_at: string;
  ended_at?: string;
  total_numbers: number;
  completed_numbers: number;
  current_index?: number | null;
  items: CallCampaignItem[];
}

export interface CallCampaignStatusResponse {
  active: boolean;
  campaign: CallCampaign | null;
}

export interface CallCampaignHistoryItem {
  campaign_id: string;
  status: string;
  started_at: string;
  ended_at?: string;
  total_numbers: number;
  completed_numbers: number;
}

export interface CallLogEntry {
  id?: number;
  child_name?: string;
  parent_name: string;
  vaccine_name: string;
  call_status: "answered" | "missed" | "busy";
  status?: string;
  parent_phone?: string;
  transcript?: string | null;
  ai_response?: string | null;
  timestamp: string;
}
