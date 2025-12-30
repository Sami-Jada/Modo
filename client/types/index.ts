export type UserRole = "customer" | "electrician";

export type JobStatus =
  | "CREATED"
  | "BROADCAST"
  | "ACCEPTED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SETTLED"
  | "CANCELLED";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  avatar?: string;
  isVerified?: boolean;
  isOnProbation?: boolean;
  trustScore?: number;
  availabilityStatus?: "available" | "busy" | "offline";
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  approved?: boolean;
}

export interface JobTimelineEvent {
  status: JobStatus;
  timestamp: Date;
  note?: string;
}

export interface Job {
  id: string;
  customerId: string;
  electricianId?: string;
  status: JobStatus;
  description: string;
  address: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  basePrice: number;
  addOns: AddOn[];
  totalPrice: number;
  distance?: number;
  paymentMethod: "card" | "cash";
  createdAt: Date;
  scheduledFor?: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  timeline: JobTimelineEvent[];
  customerName?: string;
  electricianName?: string;
}

export interface Transaction {
  id: string;
  electricianId: string;
  jobId?: string;
  type: "earning" | "commission" | "settlement" | "deduction" | "bonus";
  amount: number;
  description: string;
  createdAt: Date;
}

export interface ElectricianStats {
  currentBalance: number;
  creditLimit: number;
  thisWeekEarnings: number;
  thisMonthEarnings: number;
  completedJobs: number;
  acceptanceRate: number;
}

export const JOB_STATUS_ORDER: JobStatus[] = [
  "CREATED",
  "BROADCAST",
  "ACCEPTED",
  "EN_ROUTE",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "SETTLED",
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  CREATED: "Created",
  BROADCAST: "Finding Electrician",
  ACCEPTED: "Electrician Assigned",
  EN_ROUTE: "On the Way",
  ARRIVED: "Arrived",
  IN_PROGRESS: "Work in Progress",
  COMPLETED: "Completed",
  SETTLED: "Settled",
  CANCELLED: "Cancelled",
};
