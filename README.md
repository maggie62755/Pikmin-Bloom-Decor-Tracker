# Pikmin Bloom Decor Tracker (皮克敏飾品追蹤器)

A beautiful, mobile-responsive web application for tracking your Pikmin Bloom decor collection. Built with React, Vite, and Tailwind CSS.

一個美觀、支援行動裝置的網頁應用程式，用於追蹤您的 Pikmin Bloom 飾品收集進度。使用 React, Vite 和 Tailwind CSS 構建。

## Features / 功能

- **Comprehensive Tracking**: Track status for all Decor categories including Restaurant, Roadside, and special Events (2024/2025).
- **全面追蹤**：追蹤所有飾品類別，包括餐廳、路邊以及 2024/2025 特別活動。

- **4-Stage Status System / 4階段狀態系統**:
  - 🌑 **Not Encountered / 未遭遇** (Gray / 灰色)
  - 🌱 **Seedling / 花苗** (Green with Sprout Icon / 綠色帶芽圖示)
  - ❤️ **Growing / 成長中** (Pink with Heart Icon / 粉色帶愛心圖示)
  - ✅ **Collected / 已收集** (Full Color / 全彩)

- **Google Sheets Sync**: Seamlessly save and load your collection progress to your personal Google Sheet (100% free database).
- **Google Sheets 同步**：無縫將您的收集進度儲存並載入至您的個人 Google 試算表（100% 免費資料庫）。

- **Responsive Design**: Optimized for both mobile and desktop use.
- **響應式設計**：針對手機和電腦使用進行最佳化。

- **Premium UI**: Clean aesthetics with smooth animations and clear progress indicators.
- **精緻 UI**：簡潔的美學設計，搭配流暢的動畫與清晰的進度指示。

## Tech Stack / 技術棧

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Auth & Storage**: Google OAuth 2.0 + Google Sheets API

## Getting Started / 快速開始

### Prerequisites / 前置需求
- Node.js (v18 or higher / v18 或更高版本)
- A Google Cloud Project with **Sheets API** and **Drive API** enabled. (啟用 Sheets API 和 Drive API 的 Google Cloud 專案)

### Installation / 安裝步驟

1. Clone the repository / 複製儲存庫:
   ```bash
   git clone https://github.com/maggie62755/Pikmin-Bloom-Decor-Tracker.git
   cd Pikmin-Bloom-Decor-Tracker
   ```

2. Install dependencies / 安裝依賴:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Google Credentials / 在根目錄建立 `.env` 檔案並填入您的 Google 憑證:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your_api_key
   ```
   *Note: Ensure your Google Cloud OAuth consent screen includes the necessary scopes.*
   *注意：請確保您的 Google Cloud OAuth 同意畫面包含必要的範圍。*

### Running Locally / 在地端執行

```bash
npm run dev
```
The app will start at `http://localhost:3000`.
應用程式將於 `http://localhost:3000` 啟動。

## Google Sheets Sync Setup / Google Sheets 同步設定

To use the sync feature / 使用同步功能:
1. Click **Login** in the app. (點擊應用程式中的 **Login**)
2. Grant the requested permissions (Drive & Sheets). (授權 Drive 與 Sheets 權限)
3. Click **Save** to create/update a spreadsheet named `PikminBloomTracker` in your Google Drive. (點擊 **Save** 以在您的 Google Drive 建立/更新名為 `PikminBloomTracker` 的試算表)
4. Click **Load** to restore your progress on another device. (點擊 **Load** 以在其他裝置恢復您的進度)

## License / 授權

This project is for personal use and fan appreciation. Pikmin is a trademark of Nintendo.
本專案僅供個人使用與粉絲交流，Pikmin 為任天堂之商標。
