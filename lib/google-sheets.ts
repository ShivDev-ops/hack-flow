// lib/google-sheets.ts
import { google } from 'googleapis';

export async function getSheetHeaders(spreadsheetId: string, range: string = 'A1:Z1') {
  try {
    // lib/google-sheets.ts

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return response.data.values?.[0] || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GOOGLE_SHEETS_ERROR:', message);
    throw new Error(`Failed to fetch headers: ${message}`);
  }
}

// lib/google-sheets.ts

export async function getSheetData(spreadsheetId: string, range: string = 'A:Z') {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

    // Transform rows into objects using the headers (first row)
    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj: Record<string, string | number | boolean | null> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('FETCH_DATA_ERROR:', message);
    throw new Error(`Failed to fetch sheet data: ${message}`);
  }
}