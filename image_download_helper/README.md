# 每月 Special Decor 更新工具

這個工具會從 [Pikipedia 的 Special Decor Pikmin 頁面](https://www.pikminwiki.com/Special_Decor_Pikmin) 找到指定分類，自動完成：

1. 判斷該分類有哪些皮克敏顏色。
2. 下載並驗證每張 PNG。
3. 放入 `public/images/decors_images/<分類>/`。
4. 新增或更新 `src/data/decors.json`。

## 每月使用方式

在專案根目錄執行：

```powershell
npm run update-decors
```

依序輸入 Wiki 上的英文分類名稱、網站要顯示的繁體中文名稱，確認預覽內容後輸入 `y`。如果分類已經存在（例如後來追加 Ice Pikmin），工具會保留原本名稱與圖片路徑，只同步顏色清單及缺少的圖片。

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

- 資料夾及檔名前綴使用 PascalCase 英數字，移除空格、冒號、括號、連字號及引號。
- 顏色名稱固定為 `Red`、`Yellow`、`Blue`、`White`、`Purple`、`Rock`、`Winged`、`Ice`。
- 新分類的 `image_path` 和 `image_name` 使用相同名稱。
- 更新既有分類時，以 `decors.json` 已有的 `image_path` 和 `image_name` 為唯一依據，不因 Wiki 改名而改變本地路徑。
- 預覽畫面會逐一列出最後寫入的檔名；特殊情況可用 `--image-name` 指定新分類名稱。

## 安全機制

- 所有圖片都成功下載且通過 PNG 檢查後，才會開始修改專案。
- `decors.json` 最後才寫入；寫入過程失敗時會回復本次已搬動的圖片。
- 相同圖片會略過；既有圖片內容不同時預設停止，確認要取代才加 `--force`。
- 同一顏色含有多款造型時不會猜測 variant，而會停止並提示人工調整。
- `--dry-run` 只查詢與顯示預計變更，不會下載或寫檔。

完整參數可用以下指令查看：

```powershell
python image_download_helper/update_decors.py --help
```
