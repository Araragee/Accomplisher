export interface Member {
  id: string;
  name: string;
  role: string;
  created_at?: number;
  createdAt?: number;
}

export interface Target {
  id: string;
  name: string;
  requiredHours?: number;
  required_hours?: number;
}

export interface Accomplishment {
  id: string;
  memberId: string;
  text: string;
  category: string;
  date: string;
  createdAt?: number;
  created_at?: number;
}

export interface WfhLog {
  id: string;
  memberId: string;
  output: string;
  hours: string;
  targetCode: string;
  date: string;
  createdAt?: number;
  created_at?: number;
}

export interface Objective {
  id: string;
  memberId: string;
  title: string;
  targetCode: string;
  status: string;
  progress: number;
  createdAt?: number;
  created_at?: number;
}

export interface Suggestion {
  id: string;
  text: string;
  targetCode: string;
}

export interface Settings {
  theme: string;
}
