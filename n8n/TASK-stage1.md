# 給 Gemini CLI：階段 1「收單流程」

只在這個資料夾（20261118_脆友美食地圖/n8n/）建立檔案，不要改資料夾以外的任何東西，不要執行網路請求或部署。

## 要產出
1. `收單流程.json`：可以匯入 n8n（1.x，typeVersion 用 n8n 2.x 的常見版本）的工作流程 JSON，名稱「脆友美食地圖｜收單（自動執行）」。
2. `測試資料.sh`：用 curl POST 五筆假資料到 `$WEBHOOK_URL`（環境變數，不寫死網址），印出每筆的 HTTP 狀態與回應。五筆：(a) 有店面、資料完整 (b) 只做宅配（沒有地址）(c) 地址寫錯（查不到座標）(d) 跟 (a) 同店名同地區（重複） (e) 亂填（缺店名、沒勾同意）。
3. `說明.md`：每個節點做什麼、要建哪些憑證、怎麼測。

## 流程
Webhook（POST，路徑 `food-map-submit`，responseMode=responseNode，允許跨網域）
→ Code「檢查資料」：必填＝店名、類別、有沒有實體店面、縣市、區、同意聲明（true）；有實體店面時地址必填；Threads 帳號與 IG 帳號至少一個；一句話介紹最多 30 字；每個字串去頭尾空白、限制長度（店名 60、地址 120、帳號 60、電話 30、營業時間 100）；帳號去掉開頭 @。類別只能是：餐廳、小吃、咖啡、甜點、飲料、烘焙、伴手禮、酒吧居酒屋。不合格 → 回 400 {ok:false, error:"欄位代號", message:"給店家看的中文說明"}。
→ Google Sheets 讀取全部列（工作表「店家」）
→ Code「查重複」：店名（去空白、全形半形、大小寫一致後比對）＋縣市＋區 相同且狀態不是「已下架」→ 回 409 {ok:false, error:"duplicate", message:"這家店已經在地圖上了"}。
→ 有地址才走 HTTP Request「地址轉座標」：GET https://maps.googleapis.com/maps/api/geocode/json?address=縣市區地址&region=tw&language=zh-TW，金鑰用 n8n 的 Query Auth 憑證（參數名 key，憑證名稱「脆友美食地圖 Geocoding」），失敗時繼續（不要整條停掉）；查不到就經緯度留空。沒有地址（只做宅配）就不查。
→ Code「組一列」：編號（FM- 加 6 碼，用時間＋亂數，不重複即可）、送出時間（台灣時間 ISO）、狀態「確認中」、其餘欄位照表單。
→ Google Sheets 新增一列（工作表「店家」，欄位依下列表頭對應）
→ 回 200 {ok:true, id, status:"確認中", geocoded:true|false, message:"已上架，確認中，三天內完成審核"}
→ （回應後）HTTP Request「通知 Phil」：LINE Messaging API push，POST https://api.line.me/v2/bot/message/push，Header Auth 憑證名稱「脆友美食地圖 LINE」，to 用 n8n 變數或程式頂端常數 `NOTIFY_TO`（先放佔位字 `__NOTIFY_TO__`），文字：「新店家：店名（類別，縣市區）狀態確認中」＋ Threads／IG 連結。失敗時繼續。

Google Sheets 節點用 n8n 內建 Google Sheets 節點（OAuth2 憑證名稱「Google philko.2017」），文件 ID 用佔位字 `__SHEET_ID__`。

## 試算表表頭（第一列，順序固定）
編號、送出時間、店名、類別、有沒有實體店面、縣市、區、地址、Threads 帳號、IG 帳號、一句話介紹、電話、營業時間、同意聲明、緯度、經度、狀態、審核備註、審核日期、店家 LINE 帳號

## 注意
- 不要寫任何真實金鑰、網址或個人資料；全部用佔位字。
- 節點名稱用中文、清楚。JSON 要能被 `python3 -m json.tool` 讀。
