# 脆友美食地圖（its.all.good.73 的 Threads 計畫）

計畫書（正本）：Claude Docs「脆友美食地圖 執行計畫」https://claude.ai/artifact/M4HkRE4r98uo9QgiHr6DdX
分工：Claude 拆任務、寫給 Gemini CLI 的指令、檢查與測試；Gemini CLI（`/usr/local/bin/gemini`）寫程式；Phil 做帳號、金鑰、決定與上線同意。
2026-11-18 由主線對話串「一人統帥 - AI點將台 - 2」接手（手機遠端開不了新對話串，進度在主線回報）。

## 階段表

| 階段 | 產出 | 誰做 | 驗收 |
|---|---|---|---|
| 0 準備 | 6 項待決定事項定案；空白試算表；網站放哪裡（已改採免費開源 Leaflet + Nominatim，免 Google Cloud 帳單與地圖金鑰） | Phil（Claude 給步驟與欄位清單） | 試算表建好、表頭與狀態下拉選單完成 |
| 1 收單流程 | n8n：收表單 → 必填與同意檢查 → 店名＋地區查重 → 地址轉座標 → 寫試算表（確認中）→ 回傳成功 → 通知 Phil | Gemini 寫產生程式，Claude 檢查、部署（先問） | 五筆假資料：有店面、只做宅配、地址寫錯、重複、亂填 |
| 2 表單＋地圖頁 | 同一個網頁：手機優先表單、地圖（類別／地區篩選、標記群聚）、店家卡片、公開收錄規則、回報有誤 | Gemini 寫，Claude 在瀏覽器實測 | 手機一分鐘內填完；別的網域載入地圖會失敗 |
| 3 審核 | 每天早上「確認中」清單、試算表狀態欄生效、審核備註 | Gemini 寫，Claude 檢查 | 改狀態後地圖重新整理就變 |
| 4 冷啟動 | 每家店自己的分享網址、連結預覽圖、預寫 Threads 分享文 | Gemini 寫，Claude 檢查；Phil 找 20～30 家種子店 | 貼到 Threads 預覽正確 |
| 5 LIFF 與去逛 | 註冊 LIFF（關加好友）、LINE 登入、「去 Threads／IG」外部開啟並記錄、人氣榜 | Phil 建 LINE Login／LIFF；Gemini 寫；Claude 檢查 | 從 LINE 打開能登入、去逛有紀錄 |
| 6 點數與任務 | 點數規則、今日三家任務、LINE 分享給點、防刷分 | 同上 | 上限與重複點擊都擋得住 |
| 7 徽章與配對 | 等級徽章、本週兩個排行、互推夥伴 | 同上 | 排行與徽章顯示正確 |

## 進度

- 2026-11-18：讀完計畫書，拆好階段表。Phil 確認六項決定照建議（宅配收、連鎖不收、酒吧收、Google 地圖、Geocoding 為主、Google 試算表），網站先放 GitHub Pages 新 repo；計畫書留言串已回覆定案。階段 0 帳號設定交給 Phil；階段 1 程式已交給 Gemini CLI（`n8n/TASK-stage1.md`，log 在 `n8n/gemini-stage1.log`）。
- 2026-11-18：Gemini CLI 第一次跑失敗：還沒登入（Interactive consent could not be obtained，exit 41），要 Phil 在電腦終端機跑一次 `gemini` 用 Google 帳號登入。階段 1 程式還沒產生。
- 2026-11-18：改由 Antigravity 接手協作；Phil 決定改用免費開源地圖（Leaflet + OpenStreetMap Nominatim），省去 Google Cloud 綁帳單與 API 金鑰。
- 2026-11-18：已完成階段 1（`n8n/收單流程.json`、`n8n/測試資料.sh`、`n8n/說明.md`）、階段 2（`web/` 免費開源 Leaflet 地圖＋表單單頁網頁）、階段 3（`n8n/每日審核推播.json`），待 Phil 完成試算表與 n8n 憑證綁定後實測。
