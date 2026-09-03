# Pikmin Bloom Decor Tracker (皮克敏飾品追蹤器)

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC.svg)](https://tailwindcss.com/)

**Demo:** [https://maggie62755.github.io/Pikmin-Bloom-Decor-Tracker/](https://maggie62755.github.io/Pikmin-Bloom-Decor-Tracker/)

[English](#english) | [中文](#chinese)

---

<a id="english"></a>
<!-- ## English -->

## Introduction
A premium, mobile-responsive web application designed for tracking your Pikmin Bloom decor collection. It provides a visual and data-driven approach to managing your Pikmin squad, ensuring you never miss a decor.

## Key Features
- **Diverse Views**: Seamlessly switch between **Grid View (Tracker)** for a visual-first experience and **List View (Collection)** for detailed data management.
- **Comprehensive Tracking**: Supports all standard decor categories (Restaurant, Forest, etc.) and special Event decors (2023-2025).
- **Real-time Analytics**: A "Garden" themed dashboard providing visual insights into your collection progress by color and category.
- **Cloud Sync**: Securely store your data in your personal Google Sheet. No registration required beyond Google Login.

## Usage Guide

### 1. Decor Tracker (Grid View)
- **Visual Tracking**: Browse decors by category.
- **Status Toggling**: Click or long-press on any Pikmin card to cycle through its status (Not Encountered -> Seedling -> Growing -> Collected).
- **Quick Filters**: Use the top bar to filter by category or completion status.

### 2. Collection List (List View)
- **Detailed Management**: View your collection in a condensed table format.
- **Sorting**: Sort by ID, Category, or Status to identify gaps in your collection.

### 3. Dashboard
- **Progress Overview**: View charts displaying your total completion rate.
- **Category Breakdown**: Analyze which decor categories you are closest to completing.

### 4. Data Synchronization
- **Login**: Click the **Login** button in the top navigation and grant "Drive" and "Sheets" permissions.
- **Save**: Click **Save** to upload your current progress to a Google Sheet named `PikminBloomTracker`.
- **Load**: Click **Load** on any device to retrieve your saved progress instantly.

## Collection Status System

| Status | Visual Indicator | Description |
| :--- | :--- | :--- |
| **Not Encountered** | Greyed Out | You haven't found this decor yet. |
| **Seedling** | 🌱 Icon | You have the seedling but haven't hatched it. |
| **Growing** | ❤️ Icon | You are currently leveling up friendship. |
| **Collected** | ✅ Full Color | Fully collected and in your squad! |

## Tech Stack
- **Frontend**: React 19, Vite 7
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Data & Auth**: Google OAuth 2.0, Google Sheets API
- **Charts**: Recharts

## Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Cloud Project (for Sync feature)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/maggie62755/Pikmin-Bloom-Decor-Tracker.git
   cd Pikmin-Bloom-Decor-Tracker
   npm install
   ```

2. Configure Environment Variables:
   Create a `.env` file in the root directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
   ```

3. Run Development Server:
   ```bash
   npm run dev
   ```

---

<a id="chinese"></a>
<!-- ## 中文說明 -->

## 專案簡介
這是一個精緻且支援行動裝置的網頁應用程式，專為追蹤您的 Pikmin Bloom 飾品收集進度而設計。提供視覺化圖鑑與詳細清單兩種模式，協助您輕鬆管理並達成全圖鑑收集目標。

## 主要功能
- **多樣化視圖 (Diverse Views)**：自由切換**圖鑑模式 (Grid View)** 與 **清單模式 (List View)**，滿足視覺瀏覽與數據管理的需求。
- **完整飾品分類**：支援所有基本地點類別（餐廳、森林等）以及歷年特殊活動飾品（2023-2025）。
- **即時數據統計**：提供「花園」主題的 Dashboard，透過圖表分析各顏色與類別的收集進度。
- **雲端同步功能**：使用您的個人 Google 試算表作為資料庫，安全備份並在不同裝置間同步進度，無需額外註冊。

## 操作說明 (Usage Guide)

### 1. 飾品圖鑑 (Tracker)
- **視覺化追蹤**：以類別分組瀏覽所有飾品圖片。
- **切換狀態**：點擊或長按卡片即可循環切換收集狀態（未獲得 -> 幼苗 -> 培養中 -> 已收藏）。
- **快速篩選**：利用上方工具列篩選特定類別或檢視目前的缺漏。

### 2. 收集清單 (Collection)
- **詳細管理**：以緊湊的表格形式檢視收集資料。
- **排序功能**：支援依照編號、類別或狀態排序，方便查找缺漏的飾品。

### 3. 數據儀表板 (Dashboard)
- **進度總覽**：查看整體收集完成率的統計圖表。
- **類別分析**：分析各個飾品類別的完成度，了解目前的收集強項與弱項。

### 4. 資料同步 (Sync)
- **登入**：點擊上方導覽列的 **Login** 按鈕，並授權 Google Drive 與 Sheets 權限。
- **存檔 (Save)**：點擊 **Save** 將目前進度上傳至 Google 雲端硬碟中的 `PikminBloomTracker` 試算表。
- **讀取 (Load)**：在任何裝置登入後點擊 **Load**，即可下載最新的進度資料。

## 收集狀態說明

| 狀態 | 視覺標示 | 說明 |
| :--- | :--- | :--- |
| **未獲得** | 灰色圖示 | 尚未取得此飾品或花苗。 |
| **幼苗** | 🌱 圖示 | 已取得花苗，但尚未拔出。 |
| **培養中** | ❤️ 圖示 | 已拔出皮克敏，正在培養好感度。 |
| **已收藏** | ✅ 彩色圖示 | 飾品已收集完成！ |

## 技術棧
- **前端框架**: React 19, Vite 7
- **樣式設計**: Tailwind CSS v4
- **圖標庫**: Lucide React
- **資料與驗證**: Google OAuth 2.0, Google Sheets API
- **圖表繪製**: Recharts

## 快速開始

#### 環境需求
- Node.js (v18+)
- Google Cloud 專案（若需測試同步功能）

### 安裝步驟
1. 下載專案：
   ```bash
   git clone https://github.com/maggie62755/Pikmin-Bloom-Decor-Tracker.git
   cd Pikmin-Bloom-Decor-Tracker
   npm install
   ```

2. 設定環境變數：
   在根目錄建立 `.env` 檔案並填入您的 Client ID：
   ```env
   VITE_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
   ```

3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

---

# Credits & Legal

- **Developer**: [maggie62755](https://github.com/maggie62755)
- **Assets**: Icons and decor images courtesy of [Pikmin Wiki](https://www.pikminwiki.com/).
- **Disclaimer**: This is a fan-made project. Pikmin and Pikmin Bloom are trademarks of Nintendo and Niantic. This tool is not affiliated with or endorsed by them.

## Monthly Special Decor updates / 每月特殊飾品更新

Run `npm run update-decors` from the project root and follow the prompts. The helper downloads the selected Special Decor images and updates `src/data/decors.json` together. See [`image_download_helper/README.md`](image_download_helper/README.md) for dry-run, non-interactive, and overwrite options.
