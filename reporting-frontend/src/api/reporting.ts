const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.blackbowassociates.com';

export interface BulletItem {
  text: string;
  timeFrom: string;
  timeTo: string;
}

export interface Report {
  slotNumber: number;
  bullets: BulletItem[];
  submitted: boolean;
  submittedAt: string | null;
  isLate: boolean;
}

export interface WorkdayStatus {
  workday: {
    id: string;
    date: string;
    clockInTime: string;
    clockOutTime: string | null;
    completed: boolean;
  };
  employee: {
    name: string;
  };
  reports: Report[];
  slotsUnlocked: number[];
  nextUnlockIn: number | null;
}

export interface ClockInResponse {
  success: boolean;
  sessionToken: string;
  workdayId: string;
  clockInTime: string;
  employeeName: string;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export async function clockIn(code: string): Promise<ClockInResponse> {
  return fetchApi<ClockInResponse>('/api/reporting/clock-in', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function getStatus(): Promise<WorkdayStatus> {
  return fetchApi<WorkdayStatus>('/api/reporting/status');
}

export async function saveReport(slotNumber: number, bullets: BulletItem[]): Promise<{ saved: boolean }> {
  return fetchApi<{ saved: boolean }>(`/api/reporting/reports/${slotNumber}/save`, {
    method: 'POST',
    body: JSON.stringify({ bullets }),
  });
}

export async function submitReport(slotNumber: number, bullets: BulletItem[]): Promise<{ submitted: boolean; isLate: boolean }> {
  return fetchApi<{ submitted: boolean; isLate: boolean }>(`/api/reporting/reports/${slotNumber}/submit`, {
    method: 'POST',
    body: JSON.stringify({ bullets }),
  });
}

export async function endDay(): Promise<{ completed: boolean }> {
  return fetchApi<{ completed: boolean }>('/api/reporting/end-day', {
    method: 'POST',
  });
}
