
export enum TaskStatus {
  PENDING = 'PENDING',
  LOADING = 'LOADING',
  COMPLETED = 'COMPLETED'
}

export interface Task {
  id: string;
  label: string;
  status: TaskStatus;
}

export interface RealTimeUpdate {
  message: string;
}
