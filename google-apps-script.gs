/**
 * Family Organizer - Updated Google Apps Script
 * With: Points tracking, Recurring tasks, Task cleanup
 */

const CALENDAR_ID = 'robbukey@gmail.com';

const SHEET_NAMES = {
  TODO: 'TodoList',
  SHOPPING: 'Shopping',
  CALENDAR: 'Calendar',
  SPENCER: 'SpencerRoutine',
  GRAINGER: 'GraingerRoutine',
  BIRTHDAYS: 'Birthdays',
  POINTS: 'FamilyPoints',
  TOKENS: 'Tokens'
};

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }
  return sheet;
}

function initializeSheet(sheet, sheetName) {
  switch(sheetName) {
    case SHEET_NAMES.TODO:
      sheet.getRange('A1:I1').setValues([['Task', 'Assignee', 'Priority', 'Frequency', 'Completed', 'CompletedDate', 'AddedDate', 'CompletedBy', 'LastReset']]);
      break;
    case SHEET_NAMES.SHOPPING:
      sheet.getRange('A1:B1').setValues([['Item', 'Completed']]);
      break;
    case SHEET_NAMES.CALENDAR:
      sheet.getRange('A1:E1').setValues([['Title', 'Date', 'Time', 'Description', 'AddedDate']]);
      break;
    case SHEET_NAMES.SPENCER:
    case SHEET_NAMES.GRAINGER:
      sheet.getRange('A1:B1').setValues([['Task', 'Completed']]);
      break;
    case SHEET_NAMES.BIRTHDAYS:
      sheet.getRange('A1:B1').setValues([['Name', 'Date']]);
      break;
    case SHEET_NAMES.POINTS:
      sheet.getRange('A1:C1').setValues([['Member', 'Points', 'LastUpdated']]);
      break;
  }
  sheet.getRange('1:1').setFontWeight('bold').setBackground('#1A5F7A').setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getData';
    const data = (e && e.parameter && e.parameter.data) ? JSON.parse(decodeURIComponent(e.parameter.data)) : null;
    let result;
    
    switch(action) {
      case 'getTasks': result = getTasks(); break;
      case 'getShopping': result = getShopping(); break;
      case 'getEvents': result = getEvents(); break;
      case 'getSpencerRoutine': result = getRoutine('spencer'); break;
      case 'getGraingerRoutine': result = getRoutine('grainger'); break;
      case 'getBirthdays': result = getBirthdays(); break;
      case 'getPoints': result = getPoints(); break;
      case 'getData':
        var cache = CacheService.getScriptCache();
        var cached = cache.get('allData');
        if (cached) {
          result = JSON.parse(cached);
        } else {
          result = {
            tasks: getTasks(),
            shopping: getShopping(),
            events: getEvents(),
            spencerRoutine: getRoutine('spencer'),
            graingerRoutine: getRoutine('grainger'),
            birthdays: getBirthdays(),
            points: getPoints()
          };
          cache.put('allData', JSON.stringify(result), 300); // cache 5 mins
        }
        break;

      case 'addTask': result = addTask(data); invalidateCache(); break;
      case 'completeTask': result = completeTask(data); invalidateCache(); break;
      case 'addShoppingItem': result = addShoppingItem(data); invalidateCache(); break;
      case 'toggleShoppingItem': result = toggleShoppingItem(data); invalidateCache(); break;
      case 'deleteShoppingItem': result = deleteShoppingItem(data); invalidateCache(); break;
      case 'addEvent': result = addEvent(data); invalidateCache(); break;
      case 'deleteEvent': result = deleteEvent(data); invalidateCache(); break;
      case 'addRoutineTask': result = addRoutineTask(data); invalidateCache(); break;
      case 'toggleRoutineTask': result = toggleRoutineTask(data); invalidateCache(); break;
      case 'addBirthday': result = addBirthday(data); invalidateCache(); break;
      case 'editBirthday': result = editBirthday(data); invalidateCache(); break;
      case 'deleteBirthday': result = deleteBirthday(data); invalidateCache(); break;
      case 'updatePoints': result = updatePoints(data); invalidateCache(); break;
      case 'resetRecurringTasks': result = resetRecurringTasks(); invalidateCache(); break;
      case 'saveToken': result = saveToken(data); break;
      
      default: result = { error: 'Unknown action' };
    }
    
    var json = JSON.stringify(result);
    var callback = e && e.parameter && e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + json + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    var errJson = JSON.stringify({ error: error.toString() });
    var callback = e && e.parameter && e.parameter.callback;
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + errJson + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(errJson).setMimeType(ContentService.MimeType.JSON);
  }
}

function invalidateCache() {
  CacheService.getScriptCache().remove('allData');
}

// ==================== TASKS ====================

function getTasks() {
  const sheet = getSheet(SHEET_NAMES.TODO);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const tasks = [];
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    
    // Skip completed tasks older than 2 days
    if (row[4] && row[5]) {
      try {
        const completedDate = new Date(row[5]);
        if (!isNaN(completedDate.getTime()) && completedDate < twoDaysAgo) continue;
      } catch (e) {}
    }
    
    tasks.push({
      task: row[0],
      assignee: row[1] || '',
      priority: row[2] || 'medium',
      frequency: row[3] || 'none',
      completed: row[4] || false,
      completedDate: row[5] ? new Date(row[5]).toISOString() : null,
      addedDate: row[6] ? new Date(row[6]).toISOString() : null,
      completedBy: row[7] || '',
      lastReset: row[8] ? new Date(row[8]).toISOString() : null,
      index: i - 1
    });
  }
  return tasks;
}

function addTask(data) {
  const sheet = getSheet(SHEET_NAMES.TODO);
  sheet.appendRow([
    data.task,
    data.assignee || '',
    data.priority || 'medium',
    data.frequency || 'none',
    false,
    '',
    new Date(),
    '',
    ''
  ]);
  return { success: true };
}

function completeTask(data) {
  const sheet = getSheet(SHEET_NAMES.TODO);
  const rowIndex = data.index + 2;

  sheet.getRange(rowIndex, 5).setValue(true);
  sheet.getRange(rowIndex, 6).setValue(new Date());
  sheet.getRange(rowIndex, 8).setValue(data.completedBy || '');
  sheet.getRange(rowIndex, 1, 1, 9).setFontColor('#94A3B8').setFontLine('line-through');

  // Award 1 point — default to Rob if no assignee
  const member = (data.completedBy && data.completedBy.trim()) ? data.completedBy : 'Rob';
  incrementPoints(member, 1);

  return { success: true };
}

function resetRecurringTasks() {
  const sheet = getSheet(SHEET_NAMES.TODO);
  const data = sheet.getDataRange().getValues();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let resetCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const frequency = row[3];
    const completed = row[4];
    const lastReset = row[8] ? new Date(row[8]) : null;
    
    if (!completed || frequency === 'none') continue;
    
    let shouldReset = false;
    
    switch(frequency) {
      case 'daily':
        shouldReset = true;
        break;
      case 'weekly':
        if (!lastReset || (today - lastReset) >= 7 * 24 * 60 * 60 * 1000) {
          shouldReset = true;
        }
        break;
      case 'monthly':
        if (!lastReset || (today.getMonth() !== lastReset.getMonth() || today.getFullYear() !== lastReset.getFullYear())) {
          shouldReset = true;
        }
        break;
      case 'yearly':
        if (!lastReset || today.getFullYear() !== lastReset.getFullYear()) {
          shouldReset = true;
        }
        break;
    }
    
    if (shouldReset) {
      sheet.getRange(i + 1, 5).setValue(false);
      sheet.getRange(i + 1, 6).setValue('');
      sheet.getRange(i + 1, 9).setValue(today);
      sheet.getRange(i + 1, 1, 1, 9).setFontColor('#0F172A').setFontLine('none');
      resetCount++;
    }
  }
  
  return { success: true, resetCount: resetCount };
}

// ==================== POINTS ====================

function getPoints() {
  const sheet = getSheet(SHEET_NAMES.POINTS);
  const data = sheet.getDataRange().getValues();
  
  const points = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      points[row[0]] = row[1] || 0;
    }
  }
  return points;
}

function incrementPoints(member, amount) {
  const sheet = getSheet(SHEET_NAMES.POINTS);
  const dataRange = sheet.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === member) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    sheet.appendRow([member, amount, new Date()]);
  } else {
    const current = Number(dataRange[rowIndex - 1][1]) || 0;
    sheet.getRange(rowIndex, 2).setValue(current + amount);
    sheet.getRange(rowIndex, 3).setValue(new Date());
  }
}

function updatePoints(data) {
  const sheet = getSheet(SHEET_NAMES.POINTS);
  const member = data.member;
  const points = data.points;
  
  // Find member's row
  const dataRange = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0] === member) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    // Add new member
    sheet.appendRow([member, points, new Date()]);
  } else {
    // Update existing
    sheet.getRange(rowIndex, 2).setValue(points);
    sheet.getRange(rowIndex, 3).setValue(new Date());
  }
  
  return { success: true };
}

// ==================== SHOPPING ====================

function getShopping() {
  const sheet = getSheet(SHEET_NAMES.SHOPPING);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const items = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    items.push({
      item: row[0],
      completed: row[1] || false,
      index: i - 1
    });
  }
  return items;
}

function addShoppingItem(data) {
  const sheet = getSheet(SHEET_NAMES.SHOPPING);
  sheet.appendRow([data.item, false]);
  return { success: true };
}

function toggleShoppingItem(data) {
  const sheet = getSheet(SHEET_NAMES.SHOPPING);
  const rowIndex = data.index + 2;
  const currentValue = sheet.getRange(rowIndex, 2).getValue();
  const newValue = !currentValue;
  sheet.getRange(rowIndex, 2).setValue(newValue);
  
  if (newValue) {
    sheet.getRange(rowIndex, 1, 1, 2).setFontColor('#94A3B8').setFontLine('line-through');
  } else {
    sheet.getRange(rowIndex, 1, 1, 2).setFontColor('#0F172A').setFontLine('none');
  }
  return { success: true };
}

function deleteShoppingItem(data) {
  const sheet = getSheet(SHEET_NAMES.SHOPPING);
  sheet.deleteRow(data.index + 2);
  return { success: true };
}

// ==================== CALENDAR ====================

function getEvents() {
  const sheet = getSheet(SHEET_NAMES.CALENDAR);
  const data = sheet.getDataRange().getValues();

  // Collect sheet events
  const sheetEvents = [];
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      sheetEvents.push({
        title: String(row[0] || ''),
        date: row[1] ? new Date(row[1]).toISOString().split('T')[0] : null,
        time: row[2] ? String(row[2]) : '',
        description: row[3] ? String(row[3]) : '',
        addedDate: row[4] ? new Date(row[4]).toISOString() : null,
        index: i - 1,
        source: 'sheet'
      });
    }
  }

  // Collect Google Calendar events
  const calEvents = [];
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (calendar) {
      const today = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(today.getMonth() + 3);
      calendar.getEvents(today, threeMonthsFromNow).forEach(event => {
        const startTime = event.getStartTime();
        const isAllDay = event.isAllDayEvent();
        calEvents.push({
          title: String(event.getTitle() || ''),
          date: Utilities.formatDate(startTime, 'Australia/Sydney', 'yyyy-MM-dd'),
          time: isAllDay ? '' : Utilities.formatDate(startTime, 'Australia/Sydney', 'HH:mm'),
          description: event.getDescription() || '',
          source: 'calendar'
        });
      });
    }
  } catch (e) {
    Logger.log('Error fetching calendar: ' + e.toString());
  }

  // Merge: dedup by title+date. Calendar events take priority over sheet events.
  const result = [];
  const seen = new Map(); // key → index in result

  sheetEvents.forEach(event => {
    const key = `${event.title.toLowerCase().trim()}-${event.date}`;
    if (!seen.has(key)) {
      seen.set(key, result.length);
      result.push(event);
    }
  });

  calEvents.forEach(event => {
    const key = `${event.title.toLowerCase().trim()}-${event.date}`;
    if (seen.has(key)) {
      // Replace sheet event with the Google Calendar version
      result[seen.get(key)] = event;
    } else {
      seen.set(key, result.length);
      result.push(event);
    }
  });

  return result;
}

function addEvent(data) {
  const sheet = getSheet(SHEET_NAMES.CALENDAR);
  sheet.appendRow([
    data.title,
    new Date(data.date),
    data.time || '',
    data.description || '',
    new Date()
  ]);
  
  // NOTE: NOT adding to Google Calendar here because events from 
  // Google Calendar are already fetched and displayed automatically.
  // This prevents duplicate events from appearing.
  
  return { success: true };
}

function deleteEvent(data) {
  const sheet = getSheet(SHEET_NAMES.CALENDAR);
  const rowIndex = data.index + 2; // +2 because: 1-indexed and skip header
  sheet.deleteRow(rowIndex);
  return { success: true };
}

// ==================== ROUTINES ====================

function getRoutine(child) {
  const sheetName = child === 'spencer' ? SHEET_NAMES.SPENCER : SHEET_NAMES.GRAINGER;
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const tasks = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    tasks.push({
      task: row[0],
      completed: row[1] || false,
      index: i - 1
    });
  }
  return tasks;
}

function addRoutineTask(data) {
  const sheetName = data.child === 'spencer' ? SHEET_NAMES.SPENCER : SHEET_NAMES.GRAINGER;
  const sheet = getSheet(sheetName);
  sheet.appendRow([data.task, false]);
  return { success: true };
}

function toggleRoutineTask(data) {
  const sheetName = data.child === 'spencer' ? SHEET_NAMES.SPENCER : SHEET_NAMES.GRAINGER;
  const sheet = getSheet(sheetName);
  const rowIndex = data.index + 2;
  const currentValue = sheet.getRange(rowIndex, 2).getValue();
  const newValue = !currentValue;
  sheet.getRange(rowIndex, 2).setValue(newValue);
  
  if (newValue) {
    sheet.getRange(rowIndex, 1, 1, 2).setFontColor('#94A3B8').setFontLine('line-through');
  } else {
    sheet.getRange(rowIndex, 1, 1, 2).setFontColor('#0F172A').setFontLine('none');
  }
  return { success: true };
}

// ==================== BIRTHDAYS ====================

function getBirthdays() {
  const sheet = getSheet(SHEET_NAMES.BIRTHDAYS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const birthdays = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    birthdays.push({
      name: row[0],
      date: row[1] ? new Date(row[1]).toISOString().split('T')[0] : null,
      index: i - 1
    });
  }
  return birthdays;
}

function addBirthday(data) {
  const sheet = getSheet(SHEET_NAMES.BIRTHDAYS);
  sheet.appendRow([data.name, new Date(data.date)]);
  return { success: true };
}

function editBirthday(data) {
  const sheet = getSheet(SHEET_NAMES.BIRTHDAYS);
  const rowIndex = data.index + 2;
  sheet.getRange(rowIndex, 1).setValue(data.name);
  sheet.getRange(rowIndex, 2).setValue(new Date(data.date));
  return { success: true };
}

function deleteBirthday(data) {
  const sheet = getSheet(SHEET_NAMES.BIRTHDAYS);
  sheet.deleteRow(data.index + 2);
  return { success: true };
}

function testSetup() {
  Logger.log('Testing setup...');
  Object.values(SHEET_NAMES).forEach(name => {
    getSheet(name);
    Logger.log('✓ ' + name);
  });
  Logger.log('✓ All sheets ready!');
}

function testCalendar() {
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!calendar) {
      Logger.log('❌ Calendar not found for ID: ' + CALENDAR_ID);
      return;
    }
    Logger.log('✓ Calendar connected: ' + calendar.getName());
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    const events = calendar.getEvents(today, threeMonthsFromNow);
    Logger.log('✓ Events found: ' + events.length);
    events.forEach(e => Logger.log('  - ' + e.getTitle() + ' on ' + e.getStartTime()));
  } catch (e) {
    Logger.log('❌ Error: ' + e.toString());
  }
}

// ==================== PUSH NOTIFICATIONS (FCM V1) ====================

function saveToken(data) {
  const sheet = getSheet(SHEET_NAMES.TOKENS);
  // Init headers if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Token', 'Device', 'SavedAt']);
    sheet.getRange('1:1').setFontWeight('bold').setBackground('#1A5F7A').setFontColor('#FFFFFF');
  }
  const rows = sheet.getDataRange().getValues();
  const exists = rows.some(r => r[0] === data.token);
  if (!exists) {
    sheet.appendRow([data.token, data.device || '', new Date()]);
  }
  return { success: true };
}

function sendPushNotifications() {
  const sheet = getSheet(SHEET_NAMES.TOKENS);
  if (sheet.getLastRow() < 2) return; // No tokens
  const tokens = sheet.getDataRange().getValues().slice(1).map(r => r[0]).filter(Boolean);
  if (!tokens.length) return;

  // Build summary body
  const tasks    = getTasks().filter(t => !t.completed);
  const shopping = getShopping().filter(s => !s.completed);
  const today    = Utilities.formatDate(new Date(), 'Australia/Sydney', 'yyyy-MM-dd');
  const events   = getEvents().filter(e => e.date === today);

  const lines = [];
  if (events.length)   lines.push('📅 ' + events.length + ' event' + (events.length > 1 ? 's' : '') + ' today');
  if (tasks.length)    lines.push('📝 ' + tasks.length + ' task' + (tasks.length > 1 ? 's' : '') + ' pending');
  if (shopping.length) lines.push('🛒 ' + shopping.length + ' shopping item' + (shopping.length > 1 ? 's' : ''));
  const body = lines.length ? lines.join(' · ') : 'All clear today! 🎉';

  // FCM V1 — uses Apps Script OAuth token (no server key required)
  const accessToken = ScriptApp.getOAuthToken();
  const projectId   = 'family-organizer-84c71';
  const url         = 'https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send';

  tokens.forEach(function(token) {
    var payload = JSON.stringify({
      message: {
        token: token,
        notification: { title: '👨‍👩‍👧‍👦 Family Morning Summary', body: body }
      }
    });
    try {
      var resp = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + accessToken },
        payload: payload,
        muteHttpExceptions: true
      });
      Logger.log('FCM response for token ' + token.substring(0, 20) + '...: ' + resp.getResponseCode());
    } catch (e) {
      Logger.log('Push failed: ' + e.toString());
    }
  });
}

function createPushTrigger() {
  // Remove existing push triggers first
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendPushNotifications') ScriptApp.deleteTrigger(t);
  });
  // 7am Sydney time = 8pm UTC (accounts for AEST UTC+10 / AEDT UTC+11)
  ScriptApp.newTrigger('sendPushNotifications')
    .timeBased()
    .atHour(20)
    .nearMinute(0)
    .everyDays(1)
    .create();
  Logger.log('✓ Daily push notification trigger created — fires at ~7am Sydney time');
}

// ==================== DAILY EMAIL ====================

const EMAIL_RECIPIENT = 'robbukey@gmail.com';

function sendDailyEmail() {
  const today = new Date();
  const todayStr = Utilities.formatDate(today, 'Australia/Sydney', 'yyyy-MM-dd');
  const displayDate = Utilities.formatDate(today, 'Australia/Sydney', 'EEEE, MMMM d, yyyy');

  // Gather all data
  const tasks     = getTasks();
  const shopping  = getShopping();
  const events    = getEvents();
  const birthdays = getBirthdays();
  const points    = getPoints();

  // --- Todays events ---
  const todayEvents = events.filter(e => e.date === todayStr);

  // --- Upcoming events (next 7 days, excluding today) ---
  const upcoming = events.filter(e => {
    if (!e.date || e.date === todayStr) return false;
    const diff = (new Date(e.date) - today) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 7;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  // --- Pending tasks ---
  const pendingTasks = tasks.filter(t => !t.completed);
  const highTasks    = pendingTasks.filter(t => t.priority === 'high');
  const medTasks     = pendingTasks.filter(t => t.priority === 'medium');
  const lowTasks     = pendingTasks.filter(t => t.priority === 'low');

  // --- Shopping list (pending items only) ---
  const pendingShopping = shopping.filter(s => !s.completed);

  // --- Upcoming birthdays (within 14 days) ---
  function daysUntilBirthday(dateStr) {
    const bd = new Date(dateStr);
    const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    return Math.ceil((next - today) / (1000 * 60 * 60 * 24));
  }
  const upcomingBirthdays = birthdays
    .map(b => ({ ...b, daysUntil: daysUntilBirthday(b.date) }))
    .filter(b => b.daysUntil <= 14)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // --- Points leaderboard ---
  const leaderboard = Object.entries(points)
    .sort((a, b) => b[1] - a[1])
    .map(([name, pts], i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
      return `<tr><td style="padding:8px 12px;font-size:15px;">${medal}</td><td style="padding:8px 12px;font-weight:600;">${name}</td><td style="padding:8px 12px;color:#1A5F7A;font-weight:700;">${pts} pts</td></tr>`;
    }).join('');

  // ---- Helper: section builder ----
  function section(emoji, title, color, rows) {
    if (!rows || rows.length === 0) return '';
    return `
      <div style="margin-bottom:28px;">
        <h2 style="margin:0 0 12px 0;font-size:17px;color:${color};border-bottom:2px solid ${color};padding-bottom:6px;">${emoji} ${title}</h2>
        ${rows}
      </div>`;
  }

  function taskRow(t) {
    const priorityColor = t.priority === 'high' ? '#EF4444' : t.priority === 'low' ? '#3B82F6' : '#F59E0B';
    const assignee = t.assignee ? `<span style="background:#1A5F7A;color:white;padding:1px 7px;border-radius:10px;font-size:12px;margin-left:6px;">${t.assignee}</span>` : '';
    const pri = `<span style="color:${priorityColor};font-size:12px;font-weight:700;margin-left:6px;">[${t.priority.toUpperCase()}]</span>`;
    return `<div style="padding:8px 0;border-bottom:1px solid #F1F5F9;">◦ ${t.task}${assignee}${pri}</div>`;
  }

  function eventRow(e) {
    const time = e.time ? `<span style="color:#64748B;font-size:13px;"> at ${e.time}</span>` : '';
    const source = e.source === 'calendar' ? `<span style="background:#34A853;color:white;padding:1px 6px;border-radius:8px;font-size:11px;margin-left:6px;">Google Cal</span>` : '';
    return `<div style="padding:8px 0;border-bottom:1px solid #F1F5F9;">📌 <strong>${e.title}</strong>${time}${source}</div>`;
  }

  // ---- Build HTML ----
  const todayEventsHtml   = todayEvents.length   ? todayEvents.map(eventRow).join('')   : '<div style="color:#94A3B8;font-style:italic;padding:8px 0;">Nothing scheduled today</div>';
  const upcomingHtml      = upcoming.map(e => {
    const daysLabel = Math.ceil((new Date(e.date) - today) / (1000 * 60 * 60 * 24));
    const time = e.time ? ` at ${e.time}` : '';
    return `<div style="padding:8px 0;border-bottom:1px solid #F1F5F9;">📌 <strong>${e.title}</strong><span style="color:#64748B;font-size:13px;"> — ${Utilities.formatDate(new Date(e.date), 'Australia/Sydney', 'EEE d MMM')}${time}</span> <span style="color:#FF8B3D;font-size:12px;font-weight:700;">in ${daysLabel}d</span></div>`;
  }).join('');

  const allTasksHtml = [
    ...highTasks.map(taskRow),
    ...medTasks.map(taskRow),
    ...lowTasks.map(taskRow)
  ].join('') || '<div style="color:#94A3B8;font-style:italic;padding:8px 0;">All caught up! 🎉</div>';

  const shoppingHtml = pendingShopping.length
    ? pendingShopping.map(s => `<div style="padding:6px 0;border-bottom:1px solid #F1F5F9;">🛒 ${s.item}</div>`).join('')
    : '<div style="color:#94A3B8;font-style:italic;padding:8px 0;">Shopping list is clear!</div>';

  const birthdayHtml = upcomingBirthdays.length
    ? upcomingBirthdays.map(b => {
        const label = b.daysUntil === 0 ? '🎉 TODAY!' : b.daysUntil === 1 ? 'Tomorrow' : `in ${b.daysUntil} days`;
        return `<div style="padding:8px 0;border-bottom:1px solid #F1F5F9;">🎂 <strong>${b.name}</strong> <span style="color:#FF8B3D;font-weight:700;">${label}</span></div>`;
      }).join('')
    : '';

  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1A5F7A,#114356);border-radius:16px;padding:28px 32px;margin-bottom:24px;">
        <div style="font-size:28px;margin-bottom:4px;">👨‍👩‍👧‍👦 Family Organizer</div>
        <div style="color:rgba(255,255,255,0.85);font-size:15px;">Daily Summary — ${displayDate}</div>
      </div>

      <!-- Body card -->
      <div style="background:white;border-radius:16px;padding:28px 32px;box-shadow:0 4px 6px rgba(15,23,42,0.08);">

        ${section('📅', "Today's Events", '#1A5F7A', todayEventsHtml)}
        ${upcomingBirthdays.length ? section('🎂', 'Upcoming Birthdays', '#FF8B3D', birthdayHtml) : ''}
        ${upcoming.length ? section('🗓️', 'Coming Up This Week', '#8B5CF6', upcomingHtml) : ''}
        ${section('📝', `To-Do List (${pendingTasks.length} pending)`, '#EF4444', allTasksHtml)}
        ${pendingShopping.length ? section('🛒', `Shopping List (${pendingShopping.length} items)`, '#22C55E', shoppingHtml) : ''}

        <!-- Leaderboard -->
        <div style="margin-bottom:8px;">
          <h2 style="margin:0 0 12px 0;font-size:17px;color:#F59E0B;border-bottom:2px solid #F59E0B;padding-bottom:6px;">🏆 Points Leaderboard</h2>
          <table style="width:100%;border-collapse:collapse;">${leaderboard}</table>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align:center;padding:16px;color:#94A3B8;font-size:13px;">
        Sent automatically by Family Organizer · Warners Bay, NSW
      </div>
    </div>
  </body>
  </html>`;

  const subject = `👨‍👩‍👧‍👦 Family Summary — ${displayDate}${todayEvents.length ? ` · ${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today` : ''}${upcomingBirthdays.filter(b => b.daysUntil === 0).length ? ' 🎂' : ''}`;

  MailApp.sendEmail({
    to: EMAIL_RECIPIENT,
    subject: subject,
    htmlBody: html
  });

  Logger.log('Daily email sent to ' + EMAIL_RECIPIENT);
}

// Run this ONCE to set up the daily 7am trigger (Sydney time)
function createDailyEmailTrigger() {
  // Remove any existing daily email triggers first
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendDailyEmail') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger at 7:00am Sydney time (UTC+10/11)
  // GAS doesn't support timezone-aware time triggers directly,
  // so we use hour 20-21 UTC which is 7am AEST (UTC+10)
  ScriptApp.newTrigger('sendDailyEmail')
    .timeBased()
    .atHour(20)   // 8pm UTC = 6am AEST / 7am AEDT
    .nearMinute(0)
    .everyDays(1)
    .create();

  Logger.log('✓ Daily email trigger created — will run at ~7am Sydney time');
}
