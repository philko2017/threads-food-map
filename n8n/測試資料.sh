#!/usr/bin/env bash
set -euo pipefail

if [ -z "${WEBHOOK_URL:-}" ]; then
  echo "請先設定環境變數 WEBHOOK_URL，例如："
  echo "  export WEBHOOK_URL='https://你的n8n網域/webhook/food-map-submit'"
  exit 1
fi

post_case() {
  local label="$1"
  local payload="$2"
  echo "=== ${label} ==="
  curl -sS -w "\nHTTP_STATUS:%{http_code}\n\n" \
    -X POST "${WEBHOOK_URL}" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d "${payload}"
}

# (a) 有店面、資料完整
post_case "(a) 有店面、資料完整" '{
  "店名": "測試巷口咖啡",
  "類別": "咖啡",
  "有沒有實體店面": true,
  "縣市": "台北市",
  "區": "大安區",
  "地址": "忠孝東路四段100號",
  "Threads 帳號": "@test_alley_coffee",
  "IG 帳號": "test_alley_coffee",
  "一句話介紹": "手沖單品與肉桂捲專賣",
  "電話": "02-2700-0001",
  "營業時間": "10:00-19:00",
  "同意聲明": true
}'

# (b) 只做宅配（沒有地址）
post_case "(b) 只做宅配（沒有地址）" '{
  "店名": "測試宅配布朗尼",
  "類別": "甜點",
  "有沒有實體店面": false,
  "縣市": "新北市",
  "區": "板橋區",
  "地址": "",
  "Threads 帳號": "test_delivery_brownie",
  "IG 帳號": "",
  "一句話介紹": "低糖濃郁生巧克力布朗尼",
  "電話": "",
  "營業時間": "週一至週五出貨",
  "同意聲明": true
}'

# (c) 地址寫錯（查不到座標）
post_case "(c) 地址寫錯（查不到座標）" '{
  "店名": "測試迷路麵攤",
  "類別": "小吃",
  "有沒有實體店面": true,
  "縣市": "台中市",
  "區": "西區",
  "地址": "不存在的火星路99999號地下8樓",
  "Threads 帳號": "",
  "IG 帳號": "@test_lost_noodle",
  "一句話介紹": "深夜限定古早味乾麵",
  "電話": "",
  "營業時間": "18:00-01:00",
  "同意聲明": true
}'

# (d) 跟 (a) 同店名同地區（重複，測全形/大小寫/空白正規化）
post_case "(d) 與 (a) 重複（同店名同地區）" '{
  "店名": "測試 巷口咖啡",
  "類別": "咖啡",
  "有沒有實體店面": true,
  "縣市": "台北市",
  "區": "大安區",
  "地址": "忠孝東路四段100號",
  "Threads 帳號": "test_alley_coffee",
  "IG 帳號": "",
  "一句話介紹": "重複測試",
  "同意聲明": true
}'

# (e) 亂填（缺店名、沒勾同意）
post_case "(e) 亂填（缺店名、沒勾同意）" '{
  "店名": "",
  "類別": "未知類別",
  "有沒有實體店面": true,
  "縣市": "台北市",
  "區": "信義區",
  "地址": "",
  "Threads 帳號": "",
  "IG 帳號": "",
  "一句話介紹": "這是一段超過三十個字的一句話介紹測試文字看看會不會被擋下來才對吧應該超過了",
  "同意聲明": false
}'
