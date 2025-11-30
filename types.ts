export type TaxMode = 'none' | 'vat5' | 'wht10';

export interface QuoteItem {
  id: string;
  description: string;
  amount: number;
  note?: string;
}

export interface QuoteCategory {
  id: string;
  name: string;
  items: QuoteItem[];
}

export interface PaymentTerm {
  id: string;
  description: string;
  percentage: number; // 0 to 100
}

export interface QuoteData {
  categories: QuoteCategory[];
  paymentTerms: PaymentTerm[];
  customRealTotal?: number; // Override calculated total (The "Contract Amount")
  notes: string[]; // List of custom notes
  bankAccount?: string; // ID of the selected bank account (changed from fixed union type)
}

export interface InvoiceItem {
  description: string;
  amount: number;
  isReimbursable: boolean; // If true, adds on top of contract
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  termId?: string; // Links to a payment term
  items: InvoiceItem[];
  notes?: string;
  totalService: number; // Contract portion
  totalExpense: number; // Reimbursable portion
  taxAmount: number;
}

export interface Cost {
  id: string;
  date: string;
  category: 'Subcontractor' | 'GovFee' | 'Printing' | 'Travel' | 'Misc';
  description: string;
  amount: number;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  projectType?: string; // New field for project classification
  status: 'active' | 'archived' | 'completed';
  taxMode: TaxMode;
  createdAt: number;
  lastModified: number;
  quote: QuoteData;
  invoices: Invoice[];
  costs: Cost[];
}

// --- Settings Types ---

export interface BankAccount {
  id: string;
  bankName: string;      // e.g. 玉山銀行 (808)
  branch: string;        // e.g. 朴子分行
  accountNumber: string; // e.g. 1218-940-023000
  accountName: string;   // e.g. 常日有限公司
}

export interface FirmInfo {
  name: string;          // e.g. 常日建築
  subName?: string;      // e.g. + 將來建築師事務所
  englishName: string;   // e.g. Office of Architecture
  address: string;       // e.g. 台北市, 台灣
  phone: string;         // e.g. 0937-200053
  taxId?: string;        // 統編
  email?: string;
}

export interface AppSettings {
  firmInfo: FirmInfo;
  bankAccounts: BankAccount[];
  projectTypes: string[]; // List of available project types
}

export type ViewState = 'dashboard' | 'project-detail' | 'reports' | 'settings';
export type ProjectTab = 'overview' | 'quote' | 'invoice' | 'costs';

// --- Chat / AI Types ---

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  role: MessageRole;
  text: string;
}

// --- File System Types ---

export interface FileNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  file?: File;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface ProjectStats {
  fileCount: number;
  totalSize: number;
  extensions: Record<string, number>;
}