import { Project, AppSettings } from '../types';

const STORAGE_KEY = 'archifinance_projects_v1';
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
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load projects', e);
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
      return json;
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
    name: '常日建築',
    subName: '+ 將來建築師事務所',
    englishName: 'Office of Architecture',
    address: '台北市, 台灣',
    phone: '0937-200053',
    taxId: ''
  },
  bankAccounts: [
    { 
      id: 'default-company', 
      bankName: '玉山銀行 (808)', 
      branch: '朴子分行', 
      accountNumber: '1218-940-023000', 
      accountName: '常日有限公司' 
    },
    { 
      id: 'default-personal', 
      bankName: '玉山銀行 (808)', 
      branch: '朴子分行', 
      accountNumber: '1218-976-005853', 
      accountName: '林裕庭' 
    }
  ],
  projectTypes: [
    '私人住宅',
    '公共工程',
    '室內裝修',
    '危老重建',
    '景觀設計',
    '變更使用'
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
  location: '台北市, 台灣',
  projectType: '私人住宅',
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