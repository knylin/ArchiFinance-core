
import { Project, AppSettings, GeneralTransaction } from '../types';

const STORAGE_KEY = 'archifinance_projects_v1';
const GENERAL_FUND_KEY = 'archifinance_general_fund_v1';
const NOTES_LIB_KEY = 'archifinance_notes_library_v1';
const SETTINGS_KEY = 'archifinance_settings_v1';

export const saveProjects = (projects: Project[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to local storage', e);
  }
};

export const loadProjects = (): Project[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const projects = data ? JSON.parse(data) : [];
    
    // Migration: Ensure projectTypes array exists for old data
    return projects.map((p: any) => {
      if (!p.projectTypes) {
        // If legacy projectType exists, move it to array
        p.projectTypes = p.projectType ? [p.projectType] : [];
      }
      return p as Project;
    });
  } catch (e) {
    console.error('Failed to load projects', e);
    return [];
  }
};

// --- General Fund Functions (New in v1.3.0) ---

export const saveGeneralTransactions = (transactions: GeneralTransaction[]) => {
  try {
    localStorage.setItem(GENERAL_FUND_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save general transactions', e);
  }
};

export const loadGeneralTransactions = (): GeneralTransaction[] => {
  try {
    const data = localStorage.getItem(GENERAL_FUND_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load general transactions', e);
    return [];
  }
};

// --- Server Sync Function ---

export const fetchProjectsFromServer = async (): Promise<Project[]> => {
  try {
    // 嘗試讀取同目錄下的 projects.json
    const response = await fetch('./projects.json?t=' + new Date().getTime()); // 加 timestamp 避免快取
    if (!response.ok) {
      throw new Error('Server data not found');
    }
    const json = await response.json();
    if (Array.isArray(json)) {
      // Migration for server data as well
      return json.map((p: any) => {
        if (!p.projectTypes) {
          p.projectTypes = p.projectType ? [p.projectType] : [];
        }
        return p as Project;
      });
    } else {
      throw new Error('Invalid JSON format');
    }
  } catch (e) {
    console.error('Sync failed', e);
    throw e;
  }
};

// --- Note Library Functions ---

export const saveNoteLibrary = (notes: string[]) => {
  try {
    localStorage.setItem(NOTES_LIB_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save note library', e);
  }
};

export const loadNoteLibrary = (): string[] => {
  try {
    const data = localStorage.getItem(NOTES_LIB_KEY);
    if (data) return JSON.parse(data);
    
    // Default Library if empty
    return [
      '不含代辦各項之機關審查費、規費。',
      '不含台電、自來水外線申請。',
      '不含非乙方因素之建照變更設計階段衍生費用。',
      '本報價單有效期限為 30 天。',
      '如遇不可抗力之因素致工期延宕，雙方應另行協議展延工期。',
      '結構計算簽證費用另計。',
      '不含室內裝修審查規費及代辦費。',
      '綠建築標章申請費用另計。'
    ];
  } catch (e) {
    return [];
  }
};

// --- Settings Functions ---

export const defaultSettings: AppSettings = {
  firmInfo: {
    name: '您的事務所名稱',
    subName: '',
    englishName: 'Your Architecture Firm',
    address: '事務所地址',
    phone: '02-1234-5678',
    taxId: ''
  },
  bankAccounts: [
    { 
      id: 'default-company', 
      bankName: '範例銀行 (000)', 
      branch: '範例分行', 
      accountNumber: '123-456-7890', 
      accountName: '公司戶名' 
    }
  ],
  projectTypes: [
    '私人住宅',
    '公共工程',
    '室內裝修',
    '危老重建',
    '景觀設計',
    '變更使用'
  ],
  transactionCategories: [
    // General - Expenses
    { id: 'OfficeRent', name: '辦公室租金', type: 'expense', isSystem: true },
    { id: 'Utilities', name: '水電網路', type: 'expense', isSystem: true },
    { id: 'Salary', name: '薪資獎金', type: 'expense', isSystem: true },
    { id: 'Software', name: '軟體訂閱', type: 'expense', isSystem: true },
    { id: 'Marketing', name: '行銷廣告', type: 'expense', isSystem: true },
    { id: 'Tax', name: '稅務/會計', type: 'expense', isSystem: true },
    { id: 'Equipment', name: '設備採購', type: 'expense', isSystem: true },
    { id: 'Misc', name: '雜支', type: 'expense', isSystem: true },
    // General - Income
    { id: 'Capital', name: '資本挹注', type: 'income', isSystem: true },
    // Project Specific Expenses (Available in general too if needed)
    { id: 'Subcontractor', name: '複委託/外包', type: 'expense', isSystem: true },
    { id: 'GovFee', name: '規費', type: 'expense', isSystem: true },
    { id: 'Printing', name: '圖說印製', type: 'expense', isSystem: true },
    { id: 'Travel', name: '差旅費', type: 'expense', isSystem: true },
  ]
};

export const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
};

export const loadSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure projectTypes exists for migrated data
      if (!parsed.projectTypes) {
        parsed.projectTypes = defaultSettings.projectTypes;
      }
      // Ensure transactionCategories exists
      if (!parsed.transactionCategories) {
        parsed.transactionCategories = defaultSettings.transactionCategories;
      }
      return parsed;
    }
    return defaultSettings;
  } catch (e) {
    return defaultSettings;
  }
};

export const createEmptyProject = (): Project => ({
  id: crypto.randomUUID(),
  name: '新專案',
  client: '業主名稱',
  clientTaxId: '', // Default empty
  location: '專案地點',
  projectTypes: ['私人住宅'], // Default as array
  status: 'active',
  taxMode: 'vat5',
  createdAt: Date.now(),
  lastModified: Date.now(),
  quote: {
    categories: [
      {
        id: crypto.randomUUID(),
        name: '基本設計',
        items: [
          { id: crypto.randomUUID(), description: '建築規劃與設計', amount: 50000 }
        ]
      }
    ],
    paymentTerms: [
      { id: crypto.randomUUID(), description: '簽約訂金', percentage: 30 },
      { id: crypto.randomUUID(), description: '細部設計完成', percentage: 40 },
      { id: crypto.randomUUID(), description: '取得建照執照', percentage: 30 },
    ],
    notes: [
      '不含代辦各項之機關審查費、規費。',
      '不含台電、自來水外線申請。',
      '不含非乙方因素之建照變更設計階段衍生費用。'
    ],
    bankAccount: 'default-company'
  },
  invoices: [],
  costs: []
});
