// app/actions/test-sync.ts
'use server'

import { getSheetHeaders } from "@/lib/google-sheets";

export async function testSheetConnection(sheetUrl: string) {
  // Extract ID from URL: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
  const match = sheetUrl.match(/\/d\/(.*?)(\/|$)/);
  const spreadsheetId = match ? match[1] : null;

  if (!spreadsheetId) return { success: false, error: "Invalid Google Sheet URL" };

  try {
    const headers = await getSheetHeaders(spreadsheetId);
    return { success: true, headers };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}