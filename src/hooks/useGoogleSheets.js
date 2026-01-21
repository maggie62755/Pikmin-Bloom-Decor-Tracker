import { useState, useCallback, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

const SPREADSHEET_TITLE = "PikminBloomTracker";

export const useGoogleSheets = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [syncMessage, setSyncMessage] = useState('');

  // Login
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setUser(codeResponse);
      setToken(codeResponse.access_token);
      setSyncMessage('Logged in!');
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setSyncMessage('Login Failed');
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
  });

  const logout = () => {
    googleLogout();
    setUser(null);
    setToken(null);
    setSyncMessage('Logged out');
  };

  // Helper to find or create spreadsheet
  const findOrCreateSpreadsheet = async () => {
    if (!token) return null;

    try {
      // Search for file
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const searchData = await searchRes.json();

      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }

      // Create if not exists
      const createRes = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: SPREADSHEET_TITLE,
            mimeType: 'application/vnd.google-apps.spreadsheet',
          }),
        }
      );
      const createData = await createRes.json();
      return createData.id;
    } catch (err) {
      console.error('Error finding/creating sheet:', err);
      throw err;
    }
  };

  const getFirstSheetName = async (spreadsheetId) => {
      const res = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
          { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.sheets && data.sheets.length > 0) {
          return data.sheets[0].properties.title;
      }
      return 'Sheet1'; // Fallback
  };

  const saveToSheet = async (collectionState, decorCategories) => {
    if (!token) return;
    setSyncStatus('syncing');
    setSyncMessage('Saving...');

    try {
      const spreadsheetId = await findOrCreateSpreadsheet();
      if (!spreadsheetId) throw new Error("Could not get spreadsheet ID");

      const sheetTitle = await getFirstSheetName(spreadsheetId);
      // Escape sheet title if it contains spaces or special chars by wrapping in quotes
      const safeTitle = `'${sheetTitle.replace(/'/g, "''")}'`;

      // Flatten data
      const rows = [['Category', 'Variant ID', 'Variant Name', 'Color', 'Status']];
      
      decorCategories.forEach(cat => {
        cat.variants.forEach(variant => {
          variant.colors.forEach(color => {
            const status = collectionState[variant.id]?.[color] || 0;
            if (status > 0) {
               rows.push([cat.id, variant.id, variant.name_ch || variant.name, color, status]);
            }
          });
        });
      });

      const range = `${safeTitle}!A1:E${rows.length + 10}`;

      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: range,
            majorDimension: 'ROWS',
            values: rows,
          }),
        }
      );

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        console.error("Sheets API Error Detail:", errorData);
        throw new Error(errorData.error?.message || "Failed to write to sheet");
      }

      setSyncStatus('success');
      setSyncMessage('Saved successfully!');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage('Save failed: ' + err.message);
    }
  };

  const loadFromSheet = async () => {
    if (!token) return null;
    setSyncStatus('syncing');
    setSyncMessage('Loading...');

    try {
      const spreadsheetId = await findOrCreateSpreadsheet();
      const sheetTitle = await getFirstSheetName(spreadsheetId);
      const safeTitle = `'${sheetTitle.replace(/'/g, "''")}'`;
      
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${safeTitle}!A:E`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      
      const values = data.values;
      if (!values || values.length < 2) {
        setSyncStatus('success'); // Empty is fine
        setSyncMessage('Loaded (Empty)');
        return {};
      }

      // Parse back (Skip header)
      const newCollection = {};
      
      // Expected: [Category, VariantID, VariantName, Color, Status]
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const [catId, variantId, variantName, color, status] = row;
        
        if (!variantId || !color) continue;

        if (!newCollection[variantId]) {
          newCollection[variantId] = {};
        }
        newCollection[variantId][color] = parseInt(status, 10);
      }

      setSyncStatus('success');
      setSyncMessage('Loaded successfully!');
      setTimeout(() => setSyncStatus('idle'), 3000);
      return newCollection;

    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage('Load failed.');
      return null;
    }
  };

  return {
    login,
    logout,
    user,
    token,
    saveToSheet,
    loadFromSheet,
    syncStatus,
    syncMessage
  };
};
