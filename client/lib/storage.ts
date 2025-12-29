import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User, Job, Transaction, UserRole, ElectricianStats } from "@/types";

const STORAGE_KEYS = {
  USER: "@kahraba_user",
  JOBS: "@kahraba_jobs",
  TRANSACTIONS: "@kahraba_transactions",
  ACTIVE_BROADCAST: "@kahraba_active_broadcast",
};

export async function getUser(): Promise<User | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setUser(user: User): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.USER);
}

export async function getJobs(): Promise<Job[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.JOBS);
    if (!data) return [];
    const jobs = JSON.parse(data);
    return jobs.map((job: Job) => ({
      ...job,
      createdAt: new Date(job.createdAt),
      acceptedAt: job.acceptedAt ? new Date(job.acceptedAt) : undefined,
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
      cancelledAt: job.cancelledAt ? new Date(job.cancelledAt) : undefined,
      scheduledFor: job.scheduledFor ? new Date(job.scheduledFor) : undefined,
      timeline: (job.timeline || []).map((e: { status: string; timestamp: string; note?: string }) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      })),
    }));
  } catch {
    return [];
  }
}

export async function setJobs(jobs: Job[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
}

export async function addJob(job: Job): Promise<void> {
  const jobs = await getJobs();
  jobs.unshift(job);
  await setJobs(jobs);
}

export async function updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null> {
  const jobs = await getJobs();
  const index = jobs.findIndex((j) => j.id === jobId);
  if (index === -1) return null;

  jobs[index] = { ...jobs[index], ...updates };
  await setJobs(jobs);
  return jobs[index];
}

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];
    const transactions = JSON.parse(data);
    return transactions.map((t: Transaction) => ({
      ...t,
      createdAt: new Date(t.createdAt),
    }));
  } catch {
    return [];
  }
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  const transactions = await getTransactions();
  transactions.unshift(transaction);
  await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export async function getActiveBroadcast(): Promise<Job | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_BROADCAST);
    if (!data) return null;
    const job = JSON.parse(data);
    return {
      ...job,
      createdAt: new Date(job.createdAt),
      acceptedAt: job.acceptedAt ? new Date(job.acceptedAt) : undefined,
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
      cancelledAt: job.cancelledAt ? new Date(job.cancelledAt) : undefined,
      scheduledFor: job.scheduledFor ? new Date(job.scheduledFor) : undefined,
      timeline: (job.timeline || []).map((e: { status: string; timestamp: string; note?: string }) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      })),
    };
  } catch {
    return null;
  }
}

export async function setActiveBroadcast(job: Job | null): Promise<void> {
  if (job) {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_BROADCAST, JSON.stringify(job));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_BROADCAST);
  }
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}

export function getElectricianStats(transactions: Transaction[]): ElectricianStats {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let thisWeekEarnings = 0;
  let thisMonthEarnings = 0;
  let currentBalance = 0;

  for (const t of transactions) {
    if (t.type === "earning" || t.type === "bonus") {
      currentBalance += t.amount;
      if (t.createdAt >= startOfWeek) thisWeekEarnings += t.amount;
      if (t.createdAt >= startOfMonth) thisMonthEarnings += t.amount;
    } else if (t.type === "commission" || t.type === "deduction") {
      currentBalance -= t.amount;
    } else if (t.type === "settlement") {
      currentBalance -= t.amount;
    }
  }

  return {
    currentBalance,
    creditLimit: 50,
    thisWeekEarnings,
    thisMonthEarnings,
    completedJobs: transactions.filter((t) => t.type === "earning").length,
    acceptanceRate: 0.95,
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
