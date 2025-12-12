import axios from 'axios';

// OCR.space API Key
const OCR_API_KEY = 'K85045290988957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

// Local Storage Keys
const STORAGE_KEYS = {
  HOTELS: 'ocr_hotels',
  HISTORY: 'ocr_history',
  EMPLOYEES: 'ocr_employees',
  ATTENDANCE: 'ocr_attendance',
  USAGE: 'ocr_usage',
};

// Helper to get data from localStorage
const getLocalData = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper to save data to localStorage
const saveLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Generate unique ID
const generateId = (prefix = 'ID') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
};

// OCR API - Extract text from image using OCR.space
export const ocrAPI = {
  extractText: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // More accurate engine

    const response = await axios.post(OCR_API_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  // Parse OCR text into structured linen data
  parseLinenData: (ocrText) => {
    const lines = ocrText.split('\n').filter(line => line.trim());
    const result = {
      header: {
        company: '',
        sr_no: '',
        contractor_name: '',
        date: new Date().toISOString().split('T')[0],
        contact_no: '',
      },
      linen_items: [],
      uniform_items: [],
    };

    // Try to extract header information
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('date') || lowerLine.includes('dt')) {
        const dateMatch = line.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
        if (dateMatch) result.header.date = dateMatch[1];
      }
      if (lowerLine.includes('company') || lowerLine.includes('hotel')) {
        result.header.company = line.split(':').pop()?.trim() || line;
      }
      if (lowerLine.includes('contractor') || lowerLine.includes('vendor')) {
        result.header.contractor_name = line.split(':').pop()?.trim() || '';
      }
      if (lowerLine.includes('contact') || lowerLine.includes('phone') || lowerLine.includes('mobile')) {
        const phoneMatch = line.match(/(\d{10,})/);
        if (phoneMatch) result.header.contact_no = phoneMatch[1];
      }
    });

    // Common linen items to look for
    const linenKeywords = [
      'bed sheet', 'bedsheet', 'pillow', 'towel', 'bath towel', 'hand towel',
      'face towel', 'blanket', 'duvet', 'mattress', 'curtain', 'napkin',
      'table cloth', 'bath mat', 'bed cover', 'quilt', 'comforter',
      'pillow cover', 'cushion', 'runner', 'apron', 'chef coat', 'uniform'
    ];

    // Try to parse table data
    let srNo = 1;
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();

      // Check if line contains any linen item
      const hasLinenItem = linenKeywords.some(keyword => lowerLine.includes(keyword));

      if (hasLinenItem) {
        // Try to extract numbers from the line
        const numbers = line.match(/\d+/g) || [];

        // Extract item name (text part)
        let itemName = line;
        linenKeywords.forEach(keyword => {
          if (lowerLine.includes(keyword)) {
            const idx = lowerLine.indexOf(keyword);
            itemName = line.substring(idx, idx + keyword.length + 20).split(/\d/)[0].trim();
          }
        });

        const item = {
          sr_no: srNo++,
          item: itemName || line.replace(/\d+/g, '').trim(),
          opening_balance: numbers[0] || '0',
          clean_received: numbers[1] || '0',
          total: numbers[2] || '0',
          soil_sent: numbers[3] || '0',
          closing_balance: numbers[4] || '0',
          remark: '',
        };

        // Determine if it's uniform or linen
        if (lowerLine.includes('uniform') || lowerLine.includes('chef') || lowerLine.includes('apron')) {
          result.uniform_items.push(item);
        } else {
          result.linen_items.push(item);
        }
      }
    });

    // If no items found, create sample structure from raw text
    if (result.linen_items.length === 0 && result.uniform_items.length === 0) {
      // Split text into potential rows and create items
      const potentialItems = lines.filter(line => {
        const hasNumbers = /\d/.test(line);
        const hasText = /[a-zA-Z]{3,}/.test(line);
        return hasNumbers && hasText && line.length > 5;
      });

      potentialItems.forEach((line, idx) => {
        const numbers = line.match(/\d+/g) || [];
        const textPart = line.replace(/\d+/g, '').trim();

        if (textPart.length > 2) {
          result.linen_items.push({
            sr_no: idx + 1,
            item: textPart,
            opening_balance: numbers[0] || '0',
            clean_received: numbers[1] || '0',
            total: numbers[2] || '0',
            soil_sent: numbers[3] || '0',
            closing_balance: numbers[4] || '0',
            remark: '',
          });
        }
      });
    }

    return result;
  },
};

// Auth API (Local)
export const authAPI = {
  login: async (credentials) => {
    // Simple local authentication
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      return { data: { success: true, user: { username: credentials.username } } };
    }
    throw new Error('Invalid credentials');
  },
  verify: async () => {
    return { data: { success: true } };
  },
};

// Default test hotel
const DEFAULT_HOTELS = [
  {
    id: 'HTL-TEST-001',
    name: 'Test Hotel - Demo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'active',
    extraction_count: 0,
  }
];

// Hotels API (Local Storage)
export const hotelsAPI = {
  getAll: async () => {
    let hotels = getLocalData(STORAGE_KEYS.HOTELS, []);
    // If no hotels exist, add default test hotel
    if (hotels.length === 0) {
      hotels = DEFAULT_HOTELS;
      saveLocalData(STORAGE_KEYS.HOTELS, hotels);
    }
    return { data: { hotels } };
  },
  create: async (data) => {
    const hotels = getLocalData(STORAGE_KEYS.HOTELS, []);
    const newHotel = {
      id: generateId('HTL'),
      name: data.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      extraction_count: 0,
    };
    hotels.push(newHotel);
    saveLocalData(STORAGE_KEYS.HOTELS, hotels);
    return { data: { success: true, hotel: newHotel } };
  },
  update: async (id, data) => {
    const hotels = getLocalData(STORAGE_KEYS.HOTELS, []);
    const index = hotels.findIndex(h => h.id === id);
    if (index !== -1) {
      hotels[index] = { ...hotels[index], ...data, updated_at: new Date().toISOString() };
      saveLocalData(STORAGE_KEYS.HOTELS, hotels);
      return { data: { success: true, hotel: hotels[index] } };
    }
    throw new Error('Hotel not found');
  },
  delete: async (id) => {
    let hotels = getLocalData(STORAGE_KEYS.HOTELS, []);
    hotels = hotels.filter(h => h.id !== id);
    saveLocalData(STORAGE_KEYS.HOTELS, hotels);
    return { data: { success: true } };
  },
};

// History API (Local Storage)
export const historyAPI = {
  getAll: async (params = {}) => {
    let history = getLocalData(STORAGE_KEYS.HISTORY, []);

    // Apply filters
    if (params.hotel_id) {
      history = history.filter(h => h.hotel_id === params.hotel_id);
    }
    if (params.from_date) {
      history = history.filter(h => new Date(h.created_at) >= new Date(params.from_date));
    }
    if (params.to_date) {
      history = history.filter(h => new Date(h.created_at) <= new Date(params.to_date));
    }

    // Sort by date descending
    history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const total = history.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedHistory = history.slice(start, start + limit);

    return {
      data: {
        history: paginatedHistory,
        total,
        page,
        total_pages: totalPages
      }
    };
  },
  getById: async (id) => {
    const history = getLocalData(STORAGE_KEYS.HISTORY, []);
    const item = history.find(h => h.id === id);
    if (item) {
      return { data: item };
    }
    throw new Error('History item not found');
  },
  delete: async (id) => {
    let history = getLocalData(STORAGE_KEYS.HISTORY, []);
    history = history.filter(h => h.id !== id);
    saveLocalData(STORAGE_KEYS.HISTORY, history);
    return { data: { success: true } };
  },
  save: async (data) => {
    const history = getLocalData(STORAGE_KEYS.HISTORY, []);
    const newItem = {
      id: generateId('EXT'),
      ...data,
      created_at: new Date().toISOString(),
    };
    history.unshift(newItem);
    saveLocalData(STORAGE_KEYS.HISTORY, history);

    // Update hotel extraction count
    const hotels = getLocalData(STORAGE_KEYS.HOTELS, []);
    const hotelIndex = hotels.findIndex(h => h.id === data.hotel_id);
    if (hotelIndex !== -1) {
      hotels[hotelIndex].extraction_count = (hotels[hotelIndex].extraction_count || 0) + 1;
      saveLocalData(STORAGE_KEYS.HOTELS, hotels);
    }

    return { data: { success: true, item: newItem } };
  },
};

// Extract API
export const extractAPI = {
  extract: async (formData) => {
    const file = formData.get('file');

    // Call OCR.space API
    const ocrResponse = await ocrAPI.extractText(file);

    if (ocrResponse.OCRExitCode !== 1) {
      throw new Error(ocrResponse.ErrorMessage || 'OCR failed');
    }

    const extractedText = ocrResponse.ParsedResults?.[0]?.ParsedText || '';

    // Parse the OCR text into structured data
    const parsedData = ocrAPI.parseLinenData(extractedText);

    return {
      data: {
        success: true,
        data: parsedData,
        raw_text: extractedText,
      }
    };
  },
  exportExcel: async (data) => {
    // Create CSV content
    let csv = 'Linen Inventory Report\n\n';

    // Header info
    if (data.data?.header) {
      csv += `Company,${data.data.header.company || ''}\n`;
      csv += `Date,${data.data.header.date || ''}\n`;
      csv += `Contractor,${data.data.header.contractor_name || ''}\n\n`;
    }

    // Linen items
    if (data.data?.linen_items?.length > 0) {
      csv += 'Linen Items\n';
      csv += 'Sr No,Item,Opening Balance,Clean Received,Total,Soil Sent,Closing Balance,Remark\n';
      data.data.linen_items.forEach(item => {
        csv += `${item.sr_no},${item.item},${item.opening_balance},${item.clean_received},${item.total},${item.soil_sent},${item.closing_balance},${item.remark}\n`;
      });
      csv += '\n';
    }

    // Uniform items
    if (data.data?.uniform_items?.length > 0) {
      csv += 'Uniform Items\n';
      csv += 'Sr No,Item,Opening Balance,Clean Received,Total,Soil Sent,Closing Balance,Remark\n';
      data.data.uniform_items.forEach(item => {
        csv += `${item.sr_no},${item.item},${item.opening_balance},${item.clean_received},${item.total},${item.soil_sent},${item.closing_balance},${item.remark}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    return { data: blob };
  },
};

// Employees API (Local Storage)
export const employeesAPI = {
  getAll: async (params = {}) => {
    let employees = getLocalData(STORAGE_KEYS.EMPLOYEES, []);

    // Apply filters
    if (params.search) {
      const search = params.search.toLowerCase();
      employees = employees.filter(e =>
        e.fullname?.toLowerCase().includes(search) ||
        e.id?.toLowerCase().includes(search) ||
        e.mobile?.includes(search)
      );
    }
    if (params.department) {
      employees = employees.filter(e => e.department === params.department);
    }
    if (params.status) {
      employees = employees.filter(e => e.status === params.status);
    }

    return { data: { employees } };
  },
  getById: async (id) => {
    const employees = getLocalData(STORAGE_KEYS.EMPLOYEES, []);
    const employee = employees.find(e => e.id === id);
    if (employee) {
      return { data: employee };
    }
    throw new Error('Employee not found');
  },
  create: async (data) => {
    const employees = getLocalData(STORAGE_KEYS.EMPLOYEES, []);
    const newEmployee = {
      id: generateId('EMP'),
      ...data,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    employees.push(newEmployee);
    saveLocalData(STORAGE_KEYS.EMPLOYEES, employees);
    return { data: { success: true, employee: newEmployee } };
  },
  update: async (id, data) => {
    const employees = getLocalData(STORAGE_KEYS.EMPLOYEES, []);
    const index = employees.findIndex(e => e.id === id);
    if (index !== -1) {
      employees[index] = { ...employees[index], ...data, updated_at: new Date().toISOString() };
      saveLocalData(STORAGE_KEYS.EMPLOYEES, employees);
      return { data: { success: true, employee: employees[index] } };
    }
    throw new Error('Employee not found');
  },
  delete: async (id) => {
    let employees = getLocalData(STORAGE_KEYS.EMPLOYEES, []);
    employees = employees.filter(e => e.id !== id);
    saveLocalData(STORAGE_KEYS.EMPLOYEES, employees);
    return { data: { success: true } };
  },
};

// Attendance API (Local Storage)
export const attendanceAPI = {
  getAll: async (params = {}) => {
    let attendance = getLocalData(STORAGE_KEYS.ATTENDANCE, []);

    // Apply filters
    if (params.employee_id) {
      attendance = attendance.filter(a => a.employee_id === params.employee_id);
    }
    if (params.from_date) {
      attendance = attendance.filter(a => a.date >= params.from_date);
    }
    if (params.to_date) {
      attendance = attendance.filter(a => a.date <= params.to_date);
    }
    if (params.status) {
      attendance = attendance.filter(a => a.status === params.status);
    }

    // Sort by date descending
    attendance.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { data: { attendance } };
  },
  create: async (data) => {
    const attendance = getLocalData(STORAGE_KEYS.ATTENDANCE, []);
    const newRecord = {
      id: generateId('ATT'),
      ...data,
      created_at: new Date().toISOString(),
    };
    attendance.push(newRecord);
    saveLocalData(STORAGE_KEYS.ATTENDANCE, attendance);
    return { data: { success: true, record: newRecord } };
  },
  bulkCreate: async (data) => {
    const attendance = getLocalData(STORAGE_KEYS.ATTENDANCE, []);
    const newRecords = data.records.map(record => ({
      id: generateId('ATT'),
      ...record,
      created_at: new Date().toISOString(),
    }));
    attendance.push(...newRecords);
    saveLocalData(STORAGE_KEYS.ATTENDANCE, attendance);
    return { data: { success: true, count: newRecords.length } };
  },
  delete: async (id) => {
    let attendance = getLocalData(STORAGE_KEYS.ATTENDANCE, []);
    attendance = attendance.filter(a => a.id !== id);
    saveLocalData(STORAGE_KEYS.ATTENDANCE, attendance);
    return { data: { success: true } };
  },
  export: (params) => {
    // Get attendance data
    let attendance = getLocalData(STORAGE_KEYS.ATTENDANCE, []);

    // Apply filters
    if (params.from_date) {
      attendance = attendance.filter(a => a.date >= params.from_date);
    }
    if (params.to_date) {
      attendance = attendance.filter(a => a.date <= params.to_date);
    }

    // Create CSV
    let csv = 'Date,Employee ID,Status,Check In,Check Out,Hours\n';
    attendance.forEach(a => {
      csv += `${a.date},${a.employee_id},${a.status},${a.check_in || ''},${a.check_out || ''},${a.hours || ''}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },
};

// OCR.space Free API Limits
const OCR_LIMITS = {
  daily: 500,      // 500 requests per day
  monthly: 25000,  // 25,000 requests per month
  yearly: 300000,  // ~300,000 requests per year
};

// Usage API (Local Storage)
export const usageAPI = {
  getStats: async () => {
    let usage = getLocalData(STORAGE_KEYS.USAGE, {
      daily_count: 0,
      monthly_count: 0,
      yearly_count: 0,
      total_count: 0,
      daily_limit: OCR_LIMITS.daily,
      monthly_limit: OCR_LIMITS.monthly,
      yearly_limit: OCR_LIMITS.yearly,
      last_daily_reset: new Date().toISOString(),
      last_monthly_reset: new Date().toISOString(),
      last_yearly_reset: new Date().toISOString(),
    });

    // Check and reset daily counter
    const now = new Date();
    const lastDailyReset = new Date(usage.last_daily_reset);
    if (now.toDateString() !== lastDailyReset.toDateString()) {
      usage.daily_count = 0;
      usage.last_daily_reset = now.toISOString();
    }

    // Check and reset monthly counter
    const lastMonthlyReset = new Date(usage.last_monthly_reset);
    if (now.getMonth() !== lastMonthlyReset.getMonth() || now.getFullYear() !== lastMonthlyReset.getFullYear()) {
      usage.monthly_count = 0;
      usage.last_monthly_reset = now.toISOString();
    }

    // Check and reset yearly counter
    const lastYearlyReset = new Date(usage.last_yearly_reset);
    if (now.getFullYear() !== lastYearlyReset.getFullYear()) {
      usage.yearly_count = 0;
      usage.last_yearly_reset = now.toISOString();
    }

    // Update limits to current OCR.space limits
    usage.daily_limit = OCR_LIMITS.daily;
    usage.monthly_limit = OCR_LIMITS.monthly;
    usage.yearly_limit = OCR_LIMITS.yearly;

    saveLocalData(STORAGE_KEYS.USAGE, usage);
    return { data: usage };
  },
  increment: async () => {
    let usage = getLocalData(STORAGE_KEYS.USAGE, {
      daily_count: 0,
      monthly_count: 0,
      yearly_count: 0,
      total_count: 0,
      daily_limit: OCR_LIMITS.daily,
      monthly_limit: OCR_LIMITS.monthly,
      yearly_limit: OCR_LIMITS.yearly,
      last_daily_reset: new Date().toISOString(),
      last_monthly_reset: new Date().toISOString(),
      last_yearly_reset: new Date().toISOString(),
    });

    usage.daily_count++;
    usage.monthly_count++;
    usage.yearly_count++;
    usage.total_count++;

    saveLocalData(STORAGE_KEYS.USAGE, usage);
    return { data: usage };
  },
  reset: async () => {
    const usage = {
      daily_count: 0,
      monthly_count: 0,
      yearly_count: 0,
      total_count: 0,
      daily_limit: OCR_LIMITS.daily,
      monthly_limit: OCR_LIMITS.monthly,
      yearly_limit: OCR_LIMITS.yearly,
      last_daily_reset: new Date().toISOString(),
      last_monthly_reset: new Date().toISOString(),
      last_yearly_reset: new Date().toISOString(),
    };
    saveLocalData(STORAGE_KEYS.USAGE, usage);
    return { data: usage };
  },
};

export default {
  ocrAPI,
  authAPI,
  hotelsAPI,
  historyAPI,
  extractAPI,
  employeesAPI,
  attendanceAPI,
  usageAPI,
};
