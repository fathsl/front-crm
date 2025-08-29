export type TaskStatus = 'Backlog' | 'ToDo' | 'InProgress' | 'InReview' | 'Done';

export const TaskStatus = {
  Backlog: 'Backlog' as TaskStatus,
  ToDo: 'ToDo' as TaskStatus,
  InProgress: 'InProgress' as TaskStatus,
  InReview: 'InReview' as TaskStatus,
  Done: 'Done' as TaskStatus
};

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export interface TaskMessage {
  id: number;
  content: string;
  taskTitle: string;
  taskDescription?: string;
  taskStatus: TaskStatus;
  taskPriority: TaskPriority;
  assignedUserIds: number[];
  dueDate?: string;
  estimatedTime?: string;
  duration?: number;
  senderName?: string;
  senderId: number;
  receiverId?: number;
  messageType: number;
  timestamp: string | Date;
  fileReference?: string;
  fileName?: string;
  fileSize?: number;
}
