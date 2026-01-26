import { useState, useCallback, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

const SPREADSHEET_TITLE = "PikminBloomTracker";

export const useGoogleSheets = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [syncMessage, setSyncMessage] = useState('');

  // Login
  // Login
  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      // 1. 先儲存 token 確保後續 Sheets API 可用
      const accessToken = codeResponse.access_token;
      setToken(accessToken);
      
      setSyncStatus('syncing');
      setSyncMessage('Fetching user profile...');

      try {
        // 2. 呼叫 Google UserInfo API 獲取個人資料
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) throw new Error('Failed to fetch user info');

        const userData = await res.json();

        // 3. 將完整的用戶資訊存入 User State
        // userData 包含: name, email, picture, sub (ID), given_name 等
        setUser(userData);
        
        setSyncStatus('success');
        setSyncMessage(`Welcome, ${userData.name}!`);
        
        // 這裡可以選擇將 token 存入 localStorage (選配)
        // localStorage.setItem('google_token', accessToken);
        
      } catch (err) {
        console.error('User Info Error:', err);
        // 降級處理：即使獲取資料失敗，至少保留 token 讓功能可用
        setUser(codeResponse);
        setSyncStatus('error');
        setSyncMessage('Logged in, but profile fetch failed.');
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setSyncStatus('error');
      setSyncMessage('Login Failed');
    },
    ux_mode: 'popup', // 建議在獲取資料時使用 popup，體驗較佳；若需維持 redirect 則確保處理回傳 URL
    scope: 'openid email profile https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
  });

  const logout = () => {
    try {
      googleLogout();
      setUser(null);
      setToken(null);
      setSyncStatus('idle');
      setSyncMessage('Logged out');
      
      // 清除本地快取 (若有的話)
      // localStorage.removeItem('google_token');
    } catch (err) {
      console.error('Logout Error:', err);
    }
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

  // Fetch only the timestamp cell (F1)
  const checkCloudVersion = async () => {
      if (!token) return null;
      try {
          const spreadsheetId = await findOrCreateSpreadsheet();
          const sheetTitle = await getFirstSheetName(spreadsheetId);
          const safeTitle = `'${sheetTitle.replace(/'/g, "''")}'`;

          const res = await fetch(
              `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${safeTitle}!F1`,
              { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          // If F1 is empty, it returns undefined or empty array
          const cloudTimestamp = data.values?.[0]?.[0] || null;
          return { spreadsheetId, sheetTitle, cloudTimestamp };
      } catch (err) {
          console.error("Error checking cloud version:", err);
          return null;
      }
  };

  const saveToSheet = async (collectionState, decorCategories, lastKnownCloudTimestamp = null) => {
    if (!token) return;
    setSyncStatus('syncing');
    setSyncMessage('Saving...');

    try {
      const versionResult = await checkCloudVersion();
      if (!versionResult) throw new Error("Could not access spreadsheet");
      const { spreadsheetId, sheetTitle, cloudTimestamp } = versionResult;

      // Conflict Check: If cloud has a timestamp, and it's newer than what user last saw (or passed in)
      // Note: If lastKnownCloudTimestamp is null (user forced save), we might still want to warn if cloud is NOT null.
      // But for simple "overwrite", we might skip.
      // Better constraint: The context will handle the UI prompt. 
      // This function assumes if it's called, the user intends to WRITE.
      // BUT, to be safe, we can enforce:
      if (lastKnownCloudTimestamp && cloudTimestamp && cloudTimestamp !== lastKnownCloudTimestamp) {
           // Simple string comparison for ISO dates works
           if (new Date(cloudTimestamp) > new Date(lastKnownCloudTimestamp)) {
              throw new Error("CLOUD_CONFLICT"); 
           }
      }

      const safeTitle = `'${sheetTitle.replace(/'/g, "''")}'`;

      // Flatten data
      const rows = [['Category', 'Variant ID', 'Variant Name', 'Color', 'Status', 'LastUpdated(UTC)']];
      
      // Timestamp
      const currentTimestamp = new Date().toISOString();
      // Put timestamp in F1 (Header row, column 6)
      rows[0][5] = currentTimestamp;

      decorCategories.forEach(cat => {
        cat.variants.forEach(variant => {
          variant.colors.forEach(color => {
            const status = collectionState[variant.id]?.[color] || 0;
            if (status > 0) {
               // We only populate data columns A-E. F is reserved for header validation.
               rows.push([cat.id, variant.id, variant.name_ch || variant.name, color, status]);
            }
          });
        });
      });

      // We need to clear old data too in case new data is shorter.
      // Clearing A1:F is robust.
      // But clearing everything first is safer for "deletion".
      const clearRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${safeTitle}!A:F:clear`,
        {
          method: 'POST',
           headers: { Authorization: `Bearer ${token}` } 
        }
      );

      const range = `${safeTitle}!A1:F${rows.length + 1}`;

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
      return currentTimestamp; // Return the new timestamp
    } catch (err) {
      if (err.message === "CLOUD_CONFLICT") {
          setSyncStatus('error');
          setSyncMessage('Cloud data has changed!');
          throw err; // Re-throw to let Context handle it
      }
      console.error(err);
      setSyncStatus('error');
      setSyncMessage('Save failed: ' + err.message);
      throw err;
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
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${safeTitle}!A:F`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      
      const values = data.values;
      
      // Check timestamp in F1
      const cloudTimestamp = values?.[0]?.[5] || null;

      if (!values || values.length < 2) {
        setSyncStatus('success');
        setSyncMessage('Loaded (Empty)');
        return { data: {}, timestamp: cloudTimestamp };
      }

      // Parse back (Skip header)
      const newCollection = {};
      
      // Expected: [Category, VariantID, VariantName, Color, Status]
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        // Ensure row has enough columns
        if (row.length < 5) continue;

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
      return { data: newCollection, timestamp: cloudTimestamp };

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
    checkCloudVersion,
    syncStatus,
    syncMessage
  };
};
