export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  completed: boolean;
  comment?: string;
  isImportant?: boolean;
  isHealth?: boolean;
  isSpiritual?: boolean;
}

export interface Notebook {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  icon: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  isError?: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  reason?: string;
  date: string; // YYYY-MM-DD
}
