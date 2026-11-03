// lib/google-sheets.ts
import { google } from 'googleapis';

/**
 * Extracts the 44-character spreadsheet ID from any Google Sheets URL or raw ID string.
 */
export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  // If the user pasted a raw spreadsheet ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  // Standard Google Sheets URL formats:
  // https://docs.google.com/spreadsheets/d/<ID>/edit...
  // https://docs.google.com/spreadsheets/u/0/d/<ID>...
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error('Google Service Account credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY) are not configured in .env.local');
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function getSheetHeaders(spreadsheetId: string, range: string = '1:1'): Promise<string[]> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const firstRow = response.data.values?.[0] || [];
    return firstRow.map(cell => String(cell || '').trim()).filter(Boolean);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GOOGLE_SHEETS_HEADERS_ERROR:', message);
    throw error;
  }
}

export async function getSheetRawValues(spreadsheetId: string, range: string = 'A1:ZZ'): Promise<string[][]> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    return (response.data.values || []) as string[][];
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('GOOGLE_SHEETS_VALUES_ERROR:', message);
    throw error;
  }
}

export async function getSheetData(spreadsheetId: string, range: string = 'A:Z') {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

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