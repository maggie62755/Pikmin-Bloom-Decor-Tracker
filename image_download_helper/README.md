# 飾品圖片與 JSON 更新工具

## 本機瀏覽器管理介面（建議）

```sh
.venv/bin/python image_download_helper/update_decors.py --gui
```

也可直接執行 `.venv/bin/python image_download_helper/decor_manager.py`，或啟用虛擬環境後執行 `npm run decor-manager`。
會自動開啟 `http://127.0.0.1:8765`。在終端機按 Ctrl+C 結束服務。

使用流程：

1. 開啟時自動讀取兩個 Wiki 頁面，顯示近半年更新。
2. 查看 Wiki 原文、日期與建議造型；也可切到「所有飾品」搜尋。
3. 加入飾品到更新清單，補上新分類或造型的中文名稱。
4. 點「預覽圖片與 JSON 變更」，確認分類位置、前後項目、JSON 內容與圖片清單。
5. 點「下載並更新 JSON」正式寫入。

預設只下載缺少的圖片；每個選取項目都有「覆寫此飾品的既有圖片」選項，預覽會分開列出下載、保留、覆寫的檔案。不勾選時不下載或比對既有圖片的遠端內容。

### 更新日期的判斷

- 一般飾品從 [Decor Pikmin 的 History](https://www.pikminwiki.com/Decor_Pikmin#History) 讀取，將每條變更對應到地點或造型。
- Special Decor 從 [各分類的活動紀錄](https://www.pikminwiki.com/Special_Decor_Pikmin) 讀取首次推出、追加新款及再次開放的日期；保留英文原文與章節連結。
- 「近半年」是台灣當日往前六個曆月，例如 2026-10-07 對應 2026-04-07 起。一般更新以日期篩選，Special Decor 活動期間只要與此區間重疊即列出；未開始的活動不列入。
- 單靠活動描述無法確定是否為復刻時，標示「復刻／再次開放」。首次開放發生在區間之前但活動跨入區間時，標示「跨期開放」。
- History 只有版本號、沒有日期的紀錄，放在「日期待確認」，不猜測日期或混入近半年清單。
- 建議項目是文字對應的結果，可以自行增減；Wiki 漏寫的活動不會憑空補上。
- 可用 `--as-of 2026-10-07` 在指定日期重現清單（直接執行 `decor_manager.py` 時使用）。

### JSON 與圖片寫入規則

- 新一般分類依 Wiki 地點順序，放在活動分類前；新造型依該地點的 Wiki 造型順序插入。
- 新 Special Decor 依 Wiki 章節順序插入下一個既有分類之前。
- 既有分類維持位置，保留原本 ID、中文名稱、圖片路徑及 Wiki 暫時缺少的款式。
- 同色多款依圖片編號保留獨立 color ID，支援雨天、家電、棋子、花札、麻將與撲克牌。
- 批次下載的圖片全部暫存、通過 PNG 檢查後，才更新正式圖片與 JSON；寫入失敗會復原本次圖片變更。
- 預覽後若 JSON 或任何相關圖片被其他程序修改，停止寫入並要求重新預覽。
- 每次寫入前會在 `src/data/.decor-backups/` 保存原始 JSON。此目錄已加入 Git 忽略清單。
- 同時只執行一個讀取或下載工作，介面會顯示進度與錯誤。某個 Wiki 來源失敗時，另一個來源的結果仍可使用。

若 8765 已被使用，可用其他連接埠：

```sh
.venv/bin/python image_download_helper/decor_manager.py --port 8766
```

## Python 環境設定

一般飾品模式與 `download_decor.py` 需要 `requests` 和 `beautifulsoup4`。在專案根目錄建立虛擬環境並安裝：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r image_download_helper/requirements.txt
.venv/bin/python image_download_helper/update_decors.py
```

Windows 可將 `.venv/bin/python` 改為 `.venv\Scripts\python.exe`。
舊的 `download_decor.py` 仍可獨立下載圖片；需要自動更新 JSON 時請使用 `update_decors.py`。

Special Decor 模式會從 [Pikipedia 的 Special Decor Pikmin 頁面](https://www.pikminwiki.com/Special_Decor_Pikmin) 找到指定分類，自動完成：

1. 判斷該分類有哪些皮克敏顏色。
2. 下載並驗證每張 PNG。
3. 放入 `public/images/decors_images/<分類>/`。
4. 依 Wiki 頁面的章節順序，新增或更新 `src/data/decors.json`。

## 一般飾品：圖片與 JSON 一起更新

執行 `update_decors.py` 不帶參數時，先選擇 `2`（一般飾品），再輸入地點或造型。
也可透過 `--type standard` 使用非互動模式：

```sh
# 查看一般飾品的 Location/Costume 清單
.venv/bin/python image_download_helper/update_decors.py --type standard --list-categories

# 地點名稱會更新該地點的所有造型；先預演
.venv/bin/python image_download_helper/update_decors.py "Cafe" --type standard --dry-run

# 確認後下載圖片並更新 src/data/decors.json
.venv/bin/python image_download_helper/update_decors.py "Cafe" --type standard --yes

# 只更新單一造型（也可輸入 "Rainy Day/Leaf Hat"）
.venv/bin/python image_download_helper/update_decors.py "Leaf Hat" --type standard --yes

# 新增造型需提供中文名稱；互動模式會詢問
.venv/bin/python image_download_helper/update_decors.py "Bakery/Pastry" --type standard \
  --variant-chinese-name "Pastry=酥皮點心" --dry-run
```

- 英文比對忽略空格、大小寫與重音符號，`Cafe` 可以對應 `Café`。
- 保留既有分類與造型的 ID、中文名稱、圖片路徑及 JSON 位置，避免收藏紀錄失去對應。
- 支援多個 variants、稀有造型，以及 `blue`、`blue1`、`blue2` 等同色不同款式。
- Wiki 的圖片編號 1、2、3 對應本地無後綴、`1`、`2`，不因 Wiki 調整排列而交換款式。
- 路邊三款 Sticker 會對應既有的 Green Sticker、Blue Sticker、Orange Sticker。
- 新款顏色會合併進 JSON；Wiki 暫時缺少的顏色和未選取的造型會保留。
- 新增分類使用 `--chinese-name`，新增造型使用可重複的 `--variant-chinese-name "Wiki造型名=中文名稱"`。
- 新一般分類 ID 不使用 `event_`，依 Wiki 地點順序插入，放在活動分類前。
- 新分類若已有同名圖示會自動使用；也可用 `--icon ExistingIcon.png` 指定 `public/images/icons` 下的圖示。無圖示時留空。
- 下載原始 PNG，可能與舊下載器保存的縮圖內容不同；預設會停止，確認預覽後可加 `--force` 取代。
- 所有圖片先暫存及驗證，再一起更新圖片與 JSON；下載失敗不會修改正式資料。

若使用 `npm run update-decors`，先啟用 `.venv`（macOS：`source .venv/bin/activate`），再執行：

```sh
npm run update-decors -- "Cafe" --type standard --dry-run
```

指定分類但未提供 `--type` 時維持舊行為（`special`）。一般飾品模式一定要指定 `--type standard`，或在互動選單選擇一般飾品。

## Special Decor 每月使用方式

在專案根目錄執行：

```powershell
npm run update-decors
```

先選擇 `1`（Special Decor），再依序輸入 Wiki 上的英文分類名稱、網站要顯示的繁體中文名稱，確認預覽內容後輸入 `y`。如果分類已經存在（例如後來追加 Ice Pikmin），工具會保留原本名稱與圖片路徑，只同步顏色清單及缺少的圖片。

建議第一次先做預演：

```powershell
npm run update-decors -- "Summer Sticker" --chinese-name "夏日貼紙" --dry-run
```

確認預演正確後正式寫入：

```powershell
npm run update-decors -- "Summer Sticker" --chinese-name "夏日貼紙" --yes
```

Wiki 名稱不確定時可列出頁面章節：

```powershell
npm run update-decors:list
```

## 專案圖片命名規則

下載來源雖然使用 Wiki 的原始檔名，但寫入專案時一律轉成目前既有格式：

```text
public/images/decors_images/<image_path>/<image_name>_<Color>.png
```

例如：

```text
public/images/decors_images/TinyInstrumentOrchestra/TinyInstrumentOrchestra_Red.png
public/images/decors_images/TinyInstrumentOrchestra/TinyInstrumentOrchestra_Ice.png
```

- Special Decor 的新資料夾及檔名前綴使用英數字，移除空格與標點；一般飾品的新造型保留括號、連字號，例如 `CoffeeCup(Rare)`。
- 基礎顏色名稱為 `Red`、`Yellow`、`Blue`、`White`、`Purple`、`Rock`、`Winged`、`Ice`；一般飾品同色款式可帶數字，例如 `Blue1`。
- Special Decor 新分類的 `image_path` 和 `image_name` 相同；一般飾品以地點作 `image_path`、造型作 `image_name`。
- 更新既有分類時，以 `decors.json` 已有的 `image_path` 和 `image_name` 為唯一依據，不因 Wiki 改名而改變本地路徑。
- 預覽畫面會逐一列出最後寫入的檔名；特殊情況可用 `--image-name` 指定新分類名稱。
- Special Decor 新分類會放在 Wiki 順序中的下一個既有活動分類之前，不會一律附加在 JSON 最後；一般地點分類仍保留在活動分類前方。
- 更新既有分類時維持原本 JSON 位置，只同步名稱、顏色與圖片。

## 安全機制

- 所有圖片都成功下載且通過 PNG 檢查後，才會開始修改專案。
- `decors.json` 最後才寫入；寫入過程失敗時會回復本次已搬動的圖片。
- 相同圖片會略過；既有圖片內容不同時預設停止，確認要取代才加 `--force`。
- Special Decor 同色多造型仍會停止並提示人工調整；一般飾品依表格造型及圖片編號對應。
- 一般飾品下載期間若 JSON 被其他程序修改，會停止，保留外部修改。
- `--dry-run` 只查詢與顯示預計變更，不會下載或寫檔。

完整參數可用以下指令查看：

```powershell
python image_download_helper/update_decors.py --help
```

## 驗證整合工具

```sh
.venv/bin/python -m unittest discover -s image_download_helper/tests -v
```
