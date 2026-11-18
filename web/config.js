// 脆友美食地圖設定檔
// 上線前請填入你實際的 Google 試算表 CSV 網址與 n8n Webhook 網址
window.FOOD_MAP_CONFIG = {
  // Google 試算表「檔案 -> 共用 -> 發佈到網路 -> 選擇『店家』工作表與『逗號分隔值 (.csv)』」產生的網址
  // 若留空或維持 __SHEET_CSV_URL__，網頁會自動載入範例資料供預覽介面
  SHEET_CSV_URL: '__SHEET_CSV_URL__',

  // n8n 收單 Webhook 網址（例如：https://你的n8n網域/webhook/food-map-submit）
  SUBMIT_WEBHOOK_URL: '__SUBMIT_WEBHOOK_URL__',

  // 階段 5～7：n8n 互動與點數 API Webhook 網址（例如：https://你的n8n網域/webhook/food-map-action）
  // 未設定時，任務與個人頁會以示範模式呈現
  EVENT_WEBHOOK_URL: '__EVENT_WEBHOOK_URL__',

  // 階段 5：LINE Login LIFF ID（例如：1234567890-abcdefgh）
  // 未設定時，網頁以一般瀏覽器模式運作，並提供體驗預覽登入按鈕
  LIFF_ID: '__LIFF_ID__',

  // 管理者 Threads 帳號（供「回報資訊有誤」私訊或聯絡用）
  ADMIN_THREADS_HANDLE: 'its.all.good.73',
};
