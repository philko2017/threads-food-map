/**
 * 脆友美食地圖｜瀏覽人數與瀏覽次數計數器（Google Apps Script Web App）
 * 綁定於「脆友美食地圖」Google 試算表，部署為網頁應用程式：
 * - 執行身分：我（philko.2017@gmail.com）
 * - 誰可以存取：所有人（Anyone）
 *
 * 呼叫方式：
 * - GET ?mode=hit   新訪客：瀏覽人數 +1、瀏覽次數 +1
 * - GET ?mode=view  回訪客：僅瀏覽次數 +1
 * - GET ?mode=get   唯讀查詢：不加數，僅回傳目前數字
 */
function doGet(e) {
  var params = (e && e.parameter) || {};
  var mode = String(params.mode || 'view').toLowerCase();
  var props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  var locked = false;

  try {
    locked = lock.tryLock(5000);
    var visitors = parseInt(props.getProperty('visitors') || '0', 10) || 0;
    var views = parseInt(props.getProperty('views') || '0', 10) || 0;

    if (mode === 'hit') {
      visitors += 1;
      views += 1;
      props.setProperties({ visitors: String(visitors), views: String(views) });
    } else if (mode === 'view') {
      views += 1;
      if (visitors === 0) visitors = 1;
      props.setProperties({ visitors: String(visitors), views: String(views) });
    }

    if (views < visitors) views = visitors;

    // 同步記錄到「統計」工作表，方便直接在試算表查看
    if (mode === 'hit' || mode === 'view') {
      try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        if (ss) {
          var sheet = ss.getSheetByName('統計') || ss.insertSheet('統計');
          var nowStr = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
          sheet.getRange(1, 1, 3, 3).setValues([
            ['項目', '數值', '最後更新時間'],
            ['瀏覽人數（不重複訪客）', visitors, nowStr],
            ['瀏覽次數（累積瀏覽）', views, nowStr],
          ]);
        }
      } catch (sheetErr) {}
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, visitors: visitors, views: views }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (locked) lock.releaseLock();
  }
}
