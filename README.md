# Pikmin Bloom Decor Tracker (皮克敏飾品追蹤器)

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC.svg)](https://tailwindcss.com/)

A premium, mobile-responsive web application for tracking your Pikmin Bloom decor collection. 

一個精緻、支援行動裝置的網頁應用程式，專為追蹤您的 Pikmin Bloom 飾品收集進度而設計。

🔗 **Demo:** [https://maggie62755.github.io/Pikmin-Bloom-Decor-Tracker/](https://maggie62755.github.io/Pikmin-Bloom-Decor-Tracker/)

---

## 🌟 Key Features / 主要功能

- **Dual View Modes / 雙重檢視模式**: 
  - 🖼️ **Grid View (Tracker)**: A visual-first categorical grid for easy browsing. (方格圖鑑視圖)
  - 📋 **List View (Collection)**: A dense, sortable table for completionists. (清單列表視圖)
- **Advanced Tracking / 深度追蹤**: Supports all standard categories (Restaurant, Forest, etc.) and special Event decors (2023-2025). (支援所有基本類別與歷年活動飾品)
- **Real-time Analytics / 即時統計**: Dashboard with visual "Garden" charts showing your completion progress by color and category. (動態花園主題統計圖表)
- **Cloud Sync / 雲端同步**: Securely store your data to your personal Google Sheet. No registration required beyond Google Login. (使用 Google 試算表作為雲端資料庫，安全且完全免費)

---

## 📊 Progress States / 收集狀態說明

The app uses a 4-stage visual system to help you identify your progress at a glance:
程式採用四階段視覺系統，讓您一眼看出收集進度：

| Status / 狀態 | Visual / 視覺效果 | Description / 說明 |
| :--- | :--- | :--- |
| **Not Encountered** | You haven't found this decor yet. (未獲得花苗) |
| **Seedling (🌱)** | You have the seedling but haven't hatched it. (已取得花苗) |
| **Growing (❤️)** |  You are currently leveling up friendships. (培養感情中 ) |
| **Collected (✅)** | Fully collected and in your squad! (已獲得) |

> [!TIP]
> **Pro Tip:** In the Tracker view, you can cycle through these states by clicking or long-pressing a card! (在圖鑑模式中，點擊或長按卡片即可切換狀態！)

---

## 🛠️ Tech Stack / 技術棧

- **Frontend**: React 19, Vite 7
- **Styling**: Tailwind CSS v4 (Modern Design System)
- **Icons**: Lucide React
- **Data & Auth**: Google OAuth 2.0, Google Sheets API
- **Charts**: Recharts (with Custom Organic SVG Designs)

---


## ☁️ Google Sheets Sync / 雲端同步指南

1. **Login**: Click the **Login** button and grant "Drive" and "Sheets" permissions.
2. **Save**: Click **Save** to create/update a file named `PikminBloomTracker` in your Google Drive.
3. **Load**: Re-sync your data across any device instantly.

---

## 🚀 Getting Started / 快速開始

### Prerequisites / 前置需求
- Node.js (v18+)
- A Google Cloud Project (for Google Sheets Sync feature) / Google Cloud 專案（若需使用同步功能）

### Setup / 安裝步驟

1. **Clone & Install**:
   ```bash
   git clone https://github.com/maggie62755/Pikmin-Bloom-Decor-Tracker.git
   cd Pikmin-Bloom-Decor-Tracker
   npm install
   ```

2. **Environment Variables / 環境變數**:
   Create a `.env` file in the root / 在根目錄建立 `.env`：
   ```env
   VITE_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
   ```

3. **Development / 開發模式**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

---

## 📜 Credits & Legal

- **Developer**: [maggie62755](https://github.com/maggie62755)
- **Assets**: Icons and decor images courtesy of [Pikmin Wiki](https://www.pikminwiki.com/).
- **Disclaimer**: This is a fan-made project. Pikmin and Pikmin Bloom are trademarks of Nintendo and Niantic. This tool is not affiliated with or endorsed by them.