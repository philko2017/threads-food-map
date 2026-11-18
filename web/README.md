# 脆友美食地圖｜階段 2 靜態網頁（表單＋地圖）

完全使用免費開源的 **Leaflet + OpenStreetMap + MarkerCluster**，不需 Google Maps API 金鑰、不需綁定帳單，可直接部署到 GitHub Pages、Cloudflare Pages 或 Vercel。

## 檔案說明
- `index.html`：主頁面（地圖、清單、登錄表單、公開收錄規則）
- `styles.css`：手機優先（Mobile-first）響應式樣式
- `app.js`：地圖標記群聚、篩選搜尋、滑出店家卡片、表單送出與 `?store=編號` 專屬分享連結
- `config.js`：設定檔（填入 Google 試算表 CSV 網址與 n8n Webhook 網址）

## 上線前設定（`config.js`）
1. 在 Google 試算表點「檔案」→「共用」→「發佈到網路」，選擇 **「店家」工作表** 與 **「逗號分隔值 (.csv)」**，複製產生的網址填入 `SHEET_CSV_URL`。
2. 將階段 1 的 n8n Webhook 網址填入 `SUBMIT_WEBHOOK_URL`。

## 本機預覽
```bash
cd web
python3 -m http.server 8080
```
打開 `http://localhost:8080` 即可預覽（未設定 `SHEET_CSV_URL` 時會自動顯示內建示範資料）。
