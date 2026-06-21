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
  TOKENS: 'Tokens',
  CLEANING: 'CleaningTasks',
  HEALTH: 'Health'
};

const CLEANING_ROOMS = ['Bathrooms', 'Kitchen and Dining', 'Lounge and Playroom', 'Bedroom and Hallway', 'Kids Bedrooms'];

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
      sheet.getRange('A1:K1').setValues([['Task', 'Assignee', 'Priority', 'Frequency', 'Completed', 'CompletedDate', 'AddedDate', 'CompletedBy', 'LastReset', 'Source', 'SourceRef']]);
      break;
    case SHEET_NAMES.SHOPPING:
      sheet.getRange('A1:B1').setValues([['Item', 'Completed']]);
      break;
    case SHEET_NAMES.CALENDAR:
      sheet.getRange('A1:H1').setValues([['Title', 'Date', 'Time', 'Description', 'AddedDate', 'Source', 'SourceRef', 'GCalEventId']]);
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
    case SHEET_NAMES.CLEANING:
      sheet.getRange('A1:F1').setValues([['Room', 'AssignedDay', 'Completed', 'CompletedBy', 'CompletedDate', 'LastReset']]);
      break;
    case SHEET_NAMES.HEALTH:
      sheet.getRange('A1:F1').setValues([['Activity', 'Notes', 'Date', 'Duration', 'AddedDate', 'Source']]);
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
      case 'getHealth': result = getHealth(); break;
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
            points: getPoints(),
            cleaning: getCleaning(),
            health: getHealth()
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
      case 'saveToken':          result = saveToken(data); break;
      case 'getCleaning':        result = getCleaning(); break;
      case 'updateCleaningDay':  result = updateCleaningDay(data); invalidateCache(); break;
      case 'toggleCleaningRoom': result = toggleCleaningRoom(data); invalidateCache(); break;
      case 'resetCleaningTasks': result = resetCleaningTasks(); invalidateCache(); break;
      case 'addHealthEntry':     result = addHealthEntry(data); invalidateCache(); break;
      case 'deleteHealthEntry':  result = deleteHealthEntry(data); invalidateCache(); break;
      case 'quickCapture':       result = quickCapture(data); invalidateCache(); break;
      case 'getPrintSheet':      result = getPrintSheet(); break;

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
      source: row[9] || '',
      sourceRef: row[10] || '',
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
    '',
    data.source || '',
    data.sourceRef || ''
  ]);
  return { success: true };
}

function completeTask(data) {
  const sheet = getSheet(SHEET_NAMES.TODO);
  const rowIndex = data.index + 2;

  sheet.getRange(rowIndex, 5).setValue(true);
  sheet.getRange(rowIndex, 6).setValue(new Date());
  sheet.getRange(rowIndex, 8).setValue(data.completedBy || '');
  sheet.getRange(rowIndex, 1, 1, 11).setFontColor('#94A3B8').setFontLine('line-through');

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
      sheet.getRange(i + 1, 1, 1, 11).setFontColor('#0F172A').setFontLine('none');
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
        createdVia: row[5] || '', // who/what created it (email/quick_capture/manual) — distinct from the "sheet" vs "calendar" provenance below
        sourceRef: row[6] || '',
        gcalEventId: row[7] || '',
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
          id: event.getId(),
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

  // Merge: prefer matching by GCalEventId (precise — set when the app itself created
  // the Calendar event via addEvent()), falling back to title+date dedup for events
  // created directly in Google Calendar (bypassing the app) or predating this column.
  const result = [];
  const seen = new Map(); // title+date key → index in result
  const seenById = new Map(); // gcalEventId → index in result

  sheetEvents.forEach(event => {
    const key = `${event.title.toLowerCase().trim()}-${event.date}`;
    if (!seen.has(key)) {
      seen.set(key, result.length);
      if (event.gcalEventId) seenById.set(event.gcalEventId, result.length);
      result.push(event);
    }
  });

  calEvents.forEach(event => {
    if (seenById.has(event.id)) {
      // This Calendar event corresponds to a sheet row the app already created —
      // use the Calendar version (authoritative for date/time edits) without duplicating,
      // but keep the sheet's index/gcalEventId/createdVia/sourceRef so the app can still
      // delete it and show the right "via email"/"via quick capture" badge.
      const idx = seenById.get(event.id);
      const sheetSide = result[idx];
      result[idx] = Object.assign({}, event, {
        createdVia: sheetSide.createdVia,
        sourceRef: sheetSide.sourceRef,
        index: sheetSide.index,
        gcalEventId: sheetSide.gcalEventId
      });
      return;
    }
    const key = `${event.title.toLowerCase().trim()}-${event.date}`;
    if (seen.has(key)) {
      // Replace sheet event with the Google Calendar version (legacy title+date match)
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
  let gcalEventId = '';

  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (calendar) {
      let created;
      if (data.time) {
        const start = new Date(data.date + 'T' + data.time + ':00');
        const end = new Date(start.getTime() + 60 * 60 * 1000); // default 1hr window
        created = calendar.createEvent(data.title, start, end, { description: data.description || '' });
      } else {
        created = calendar.createAllDayEvent(data.title, new Date(data.date), { description: data.description || '' });
      }
      gcalEventId = created.getId();
    }
  } catch (e) {
    Logger.log('addEvent: failed to create Google Calendar event: ' + e.toString());
    // Fall through — still record in the sheet below so the item is never lost.
  }

  sheet.appendRow([
    data.title,
    new Date(data.date),
    data.time || '',
    data.description || '',
    new Date(),
    data.source || '',
    data.sourceRef || '',
    gcalEventId
  ]);

  return { success: true, gcalEventId: gcalEventId };
}

function deleteEvent(data) {
  const sheet = getSheet(SHEET_NAMES.CALENDAR);
  const rowIndex = data.index + 2; // +2 because: 1-indexed and skip header
  const gcalEventId = sheet.getRange(rowIndex, 8).getValue(); // column H

  if (gcalEventId) {
    try {
      const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
      const calEvent = calendar ? calendar.getEventById(gcalEventId) : null;
      if (calEvent) calEvent.deleteEvent();
    } catch (e) {
      Logger.log('deleteEvent: failed to remove Google Calendar event ' + gcalEventId + ': ' + e.toString());
      // Fall through — still delete the sheet row so it disappears from the app either way.
    }
  }

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

// ==================== CLEANING ROTA ====================

function getCleaning() {
  const sheet = getSheet(SHEET_NAMES.CLEANING);
  // Auto-init rows if sheet is new/empty
  if (sheet.getLastRow() <= 1) {
    CLEANING_ROOMS.forEach(function(room) {
      sheet.appendRow([room, 'Any', false, '', '', '']);
    });
  }
  const data = sheet.getDataRange().getValues();
  const result = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    result.push({
      room: row[0],
      assignedDay: row[1] || 'Any',
      completed: row[2] || false,
      completedBy: row[3] || '',
      completedDate: row[4] ? new Date(row[4]).toISOString() : null,
      index: i - 1
    });
  }
  return result;
}

function updateCleaningDay(data) {
  var sheet = getSheet(SHEET_NAMES.CLEANING);
  sheet.getRange(data.index + 2, 2).setValue(data.day);
  return { success: true };
}

function toggleCleaningRoom(data) {
  var sheet = getSheet(SHEET_NAMES.CLEANING);
  var rowIndex = data.index + 2;
  var newVal = !sheet.getRange(rowIndex, 3).getValue();
  sheet.getRange(rowIndex, 3).setValue(newVal);
  if (newVal) {
    sheet.getRange(rowIndex, 4).setValue(data.completedBy || '');
    sheet.getRange(rowIndex, 5).setValue(new Date());
    if (data.completedBy) incrementPoints(data.completedBy, 1);
  } else {
    sheet.getRange(rowIndex, 4).setValue('');
    sheet.getRange(rowIndex, 5).setValue('');
  }
  return { success: true };
}

function resetCleaningTasks() {
  var sheet = getSheet(SHEET_NAMES.CLEANING);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    sheet.getRange(i + 1, 3).setValue(false);
    sheet.getRange(i + 1, 4).setValue('');
    sheet.getRange(i + 1, 5).setValue('');
    sheet.getRange(i + 1, 6).setValue(new Date());
  }
  return { success: true };
}

function createCleaningTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'resetCleaningTasks') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('resetCleaningTasks')
    .timeBased()
    .inTimezone('Australia/Sydney')
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(17)
    .nearMinute(0)
    .create();
  Logger.log('✓ Cleaning reset trigger set — Sundays 5pm Sydney time');
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
  if (sheet.getLastRow() < 2) return;
  const tokens = sheet.getDataRange().getValues().slice(1).map(r => r[0]).filter(Boolean);
  if (!tokens.length) return;

  const today   = Utilities.formatDate(new Date(), 'Australia/Sydney', 'yyyy-MM-dd');
  const dayName = Utilities.formatDate(new Date(), 'Australia/Sydney', 'EEEE d MMM');
  const todayMD = Utilities.formatDate(new Date(), 'Australia/Sydney', 'MM-dd');

  const pendingTasks    = getTasks().filter(t => !t.completed);
  const pendingShopping = getShopping().filter(s => !s.completed);
  const todayEvents     = getEvents().filter(e => e.date === today);
  const todayBirthdays  = getBirthdays().filter(b => b.date && b.date.substring(5) === todayMD);

  // --- Notification title ---
  const title = '👨‍👩‍👧‍👦 Good morning! ' + dayName;

  // --- Notification body: show actual event names, not just counts ---
  const bodyLines = [];
  todayBirthdays.forEach(b => bodyLines.push('🎂 ' + b.name + "'s birthday today!"));

  if (todayEvents.length) {
    todayEvents.slice(0, 3).forEach(e => {
      bodyLines.push('📅 ' + e.title + (e.time ? ' at ' + e.time : ''));
    });
    if (todayEvents.length > 3) bodyLines.push('  +' + (todayEvents.length - 3) + ' more events');
  } else {
    bodyLines.push('📅 No events today');
  }

  bodyLines.push(pendingTasks.length
    ? '📝 ' + pendingTasks.length + ' task' + (pendingTasks.length > 1 ? 's' : '') + ' pending'
    : '📝 All tasks done! 🎉');

  if (pendingShopping.length) {
    bodyLines.push('🛒 ' + pendingShopping.length + ' item' + (pendingShopping.length > 1 ? 's' : '') + ' needed');
  }

  const body = bodyLines.join('\n');

  sendPushNotificationPayload(title, body, 'daily_summary');
}

// Shared FCM V1 sender — used by the daily summary push above and by the
// escalating nudge functions below. Looks up tokens itself so callers just
// supply a title/body.
function sendPushNotificationPayload(title, body, notifType) {
  const sheet = getSheet(SHEET_NAMES.TOKENS);
  if (sheet.getLastRow() < 2) return;
  const tokens = sheet.getDataRange().getValues().slice(1).map(r => r[0]).filter(Boolean);
  if (!tokens.length) return;

  const accessToken = ScriptApp.getOAuthToken();
  const projectId   = 'family-organizer-84c71';
  const url         = 'https://fcm.googleapis.com/v1/projects/' + projectId + '/messages:send';

  const deadTokens = [];

  tokens.forEach(function(token) {
    var payload = JSON.stringify({
      message: {
        token: token,
        notification: { title: title, body: body },
        data: { type: notifType || 'general' }
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
      var code = resp.getResponseCode();
      Logger.log('FCM ' + code + ' for ' + token.substring(0, 20) + '...');
      if (code === 404) deadTokens.push(token); // expired/unregistered token
    } catch (e) {
      Logger.log('Push failed: ' + e.toString());
    }
  });

  // Remove expired tokens from the sheet
  if (deadTokens.length) {
    var rows = sheet.getDataRange().getValues();
    for (var i = rows.length - 1; i >= 1; i--) {
      if (deadTokens.indexOf(rows[i][0]) !== -1) sheet.deleteRow(i + 1);
    }
    Logger.log('Removed ' + deadTokens.length + ' expired token(s)');
  }
}

function createPushTrigger() {
  // Remove existing push triggers first
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendPushNotifications') ScriptApp.deleteTrigger(t);
  });
  // Use inTimezone so GAS respects DST automatically — always fires at 7am Sydney local time
  ScriptApp.newTrigger('sendPushNotifications')
    .timeBased()
    .inTimezone('Australia/Sydney')
    .atHour(7)
    .nearMinute(0)
    .everyDays(1)
    .create();
  Logger.log('✓ Daily push trigger set — 7:00am Australia/Sydney (DST-aware)');
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

// ==================== HEALTH LOG ====================

function getHealth() {
  const sheet = getSheet(SHEET_NAMES.HEALTH);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const entries = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    entries.push({
      activity: row[0],
      notes: row[1] || '',
      date: row[2] ? new Date(row[2]).toISOString().split('T')[0] : null,
      duration: row[3] || '',
      addedDate: row[4] ? new Date(row[4]).toISOString() : null,
      source: row[5] || 'manual',
      index: i - 1
    });
  }
  return entries;
}

function addHealthEntry(data) {
  const sheet = getSheet(SHEET_NAMES.HEALTH);
  sheet.appendRow([
    data.activity,
    data.notes || '',
    new Date(data.date || new Date()),
    data.duration || '',
    new Date(),
    data.source || 'manual'
  ]);
  return { success: true };
}

function deleteHealthEntry(data) {
  const sheet = getSheet(SHEET_NAMES.HEALTH);
  sheet.deleteRow(data.index + 2);
  return { success: true };
}

// ==================== SCHEMA MIGRATION (run once manually) ====================
//
// TodoList/Calendar already existed before the Source/SourceRef/GCalEventId
// columns were added, so initializeSheet() (which only runs for brand-new
// sheets) never retrofits them. Run this once from the Apps Script editor
// before relying on email/quick-capture tagging or two-way calendar sync.

function migrateAddSourceColumns() {
  const todoSheet = getSheet(SHEET_NAMES.TODO);
  if (todoSheet.getRange('J1').getValue() !== 'Source') {
    todoSheet.getRange('J1:K1').setValues([['Source', 'SourceRef']])
      .setFontWeight('bold').setBackground('#1A5F7A').setFontColor('#FFFFFF');
    Logger.log('✓ TodoList: added Source/SourceRef columns');
  } else {
    Logger.log('TodoList already migrated');
  }

  const calSheet = getSheet(SHEET_NAMES.CALENDAR);
  if (calSheet.getRange('F1').getValue() !== 'Source') {
    calSheet.getRange('F1:H1').setValues([['Source', 'SourceRef', 'GCalEventId']])
      .setFontWeight('bold').setBackground('#1A5F7A').setFontColor('#FFFFFF');
    Logger.log('✓ Calendar: added Source/SourceRef/GCalEventId columns');
  } else {
    Logger.log('Calendar already migrated');
  }

  Logger.log('✓ Migration complete');
}

// ==================== AI CATEGORIZATION (SHARED) ====================
//
// Single entry point used by BOTH the email agent and quick-capture, so the
// prompt and parsing logic only exist once. Takes raw text (an email body or
// a quick-capture note) and returns { events: [...], tasks: [...] } — empty
// arrays for non-actionable content or on any API/parse failure (this must
// never throw, since it also runs inside unattended time-based triggers).

const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001'; // cheap/fast, plenty capable for structured extraction; swap to claude-sonnet-4-6 if quality ever disappoints

const CATEGORIZATION_SYSTEM_PROMPT = `You extract actionable calendar events and to-do tasks from short pieces of text (emails or quick notes) for a busy parent. Respond with ONLY a JSON object, no prose, no markdown fences, matching this exact shape:
{"events":[{"title":"string","date":"YYYY-MM-DD","time":"HH:MM or empty string","description":"string"}],"tasks":[{"task":"string","priority":"high|medium|low"}]}
Rules:
- If the text is a newsletter, receipt, marketing email, automated notification, promotional event listing, or "what's on" guide, return {"events":[],"tasks":[]} — even if it mentions real dates.
- A date being mentioned is NOT enough to extract an event. Only extract an event if there is clear evidence the recipient personally is attending or booked for it — e.g. a ticket confirmation, booking/order reference, "your booking", "your reservation", "your tickets", a calendar invite, or a personal message confirming attendance.
- A venue, comedy club, board game cafe, theatre, etc. emailing about "upcoming shows this month", "events near you", or anything generally on sale is advertising, not a personal commitment — ignore it, even though it has real dates and looks event-like.
- When genuinely unsure whether the recipient is personally attending vs. just being advertised to, do NOT extract an event — skip it rather than guess.
- Only extract a task if there is a concrete action the recipient must personally take.
- Never invent dates, times, or details not present in the source text.
- Resolve relative dates (e.g. "tomorrow", "next Friday") against the provided "today" date.
- Keep titles/tasks short (under 80 chars) and close to the source text's own words — do not paraphrase excessively.`;

function getAnthropicKey() {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) throw new Error('ANTHROPIC_API_KEY not set — add it in Apps Script: Project Settings → Script Properties.');
  return key;
}

function buildCategorizationPrompt(sourceType, sourceText, sourceMeta, today) {
  return 'Today\'s date: ' + today + ' (Australia/Sydney)\n' +
    'Source type: ' + sourceType + '\n' +
    (sourceMeta ? 'Source metadata: ' + JSON.stringify(sourceMeta) + '\n' : '') +
    '---\n' + sourceText + '\n---\nReturn the JSON object now.';
}

function parseClaudeJsonResponse(rawBody) {
  try {
    const outer = JSON.parse(rawBody);
    const text = outer.content && outer.content[0] && outer.content[0].text;
    if (!text) return { events: [], tasks: [] };
    // Claude sometimes wraps in ```json fences despite instructions — strip defensively
    const cleaned = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : []
    };
  } catch (e) {
    Logger.log('Failed to parse Claude response: ' + e.toString() + ' | raw: ' + rawBody.substring(0, 500));
    return { events: [], tasks: [] };
  }
}

function categorizeWithClaude(sourceType, sourceText, sourceMeta) {
  const today = Utilities.formatDate(new Date(), 'Australia/Sydney', 'yyyy-MM-dd');
  const prompt = buildCategorizationPrompt(sourceType, sourceText, sourceMeta, today);

  const payload = {
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: CATEGORIZATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }]
  };

  let resp;
  try {
    resp = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': getAnthropicKey(),
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log('Claude API call failed: ' + e.toString());
    return { events: [], tasks: [] };
  }

  if (resp.getResponseCode() !== 200) {
    Logger.log('Claude API error ' + resp.getResponseCode() + ': ' + resp.getContentText());
    return { events: [], tasks: [] }; // fail safe: never half-parse, never throw into a trigger
  }

  return parseClaudeJsonResponse(resp.getContentText());
}

// Quick manual test — run from the Apps Script editor (select this function,
// click Run) and check the Executions log to confirm the API key + prompt work
// before turning on the email trigger.
function testCategorization() {
  Logger.log('--- Actionable test (should return a real event) ---');
  Logger.log(JSON.stringify(categorizeWithClaude('test', 'Reminder: school assembly next Tuesday at 9am, please arrive 10 minutes early.', null)));
  Logger.log('--- Non-actionable test (should return empty) ---');
  Logger.log(JSON.stringify(categorizeWithClaude('test', 'Unsubscribe from our newsletter anytime! 20% off everything this week only, shop now.', null)));
  Logger.log('--- Promotional event listing test (should ALSO return empty — has a real date but is not a personal booking) ---');
  Logger.log(JSON.stringify(categorizeWithClaude('test', 'Whats On This Month at The Laugh Track: catch our headline comedy night this Saturday 8pm, tickets from $35 still available. Plus board game social every Thursday — drop in any time, all welcome!', null)));
}

// ==================== EMAIL AGENT ====================
//
// Reads robbukey@gmail.com (the same Google account running this script),
// runs each new thread through categorizeWithClaude(), and auto-files the
// results. Idempotency is via a Gmail label (not a tracking sheet) — Gmail's
// own search index already does the "have I seen this" lookup for free.

const PROCESSED_LABEL_NAME = 'FamilyOrganizer/Processed';
const EMAIL_BACKFILL_AFTER = '2026/01/01'; // permanent lower bound for "this year" backfill — never needs updating, later mail trivially satisfies "after" this date too

function getOrCreateProcessedLabel() {
  let label = GmailApp.getUserLabelByName(PROCESSED_LABEL_NAME);
  if (!label) label = GmailApp.createLabel(PROCESSED_LABEL_NAME);
  return label;
}

function emailSearchQuery() {
  return 'in:inbox after:' + EMAIL_BACKFILL_AFTER + ' -label:"' + PROCESSED_LABEL_NAME + '"';
}

// Shared per-thread handler used by both the ongoing trigger and the manual
// backfill. Only labels the thread on success, so a transient failure (e.g. a
// Claude API hiccup) gets retried automatically on the next run.
function processOneThread(thread, label) {
  try {
    const messages = thread.getMessages();
    const latest = messages[messages.length - 1];
    const subject = thread.getFirstMessageSubject();
    const body = latest.getPlainBody().substring(0, 6000); // cap to keep the prompt small
    const permalink = 'https://mail.google.com/mail/u/0/#inbox/' + thread.getId();

    const result = categorizeWithClaude('email', subject + '\n\n' + body, { subject: subject, from: latest.getFrom() });

    result.events.forEach(function(ev) {
      addEvent({ title: ev.title, date: ev.date, time: ev.time || '', description: ev.description || '', source: 'email', sourceRef: permalink });
    });
    result.tasks.forEach(function(t) {
      addTask({ task: t.task, assignee: '', priority: t.priority || 'medium', frequency: 'none', source: 'email', sourceRef: permalink });
    });

    thread.addLabel(label); // marks processed even when 0 items were extracted
  } catch (e) {
    Logger.log('processOneThread error: ' + e.toString());
    // Deliberately do NOT label on error — next run retries this thread.
  }
}

// Trigger target — run every 15 minutes. Capped at 20 threads/run to stay
// well inside Apps Script's 6-minute execution limit.
function processIncomingEmails() {
  const label = getOrCreateProcessedLabel();
  const threads = GmailApp.search(emailSearchQuery(), 0, 20);
  threads.forEach(function(thread) { processOneThread(thread, label); });
  if (threads.length) invalidateCache();
  Logger.log('processIncomingEmails: handled ' + threads.length + ' thread(s)');
}

// Manual, repeat-until-done helper for the initial "process this whole year"
// backfill Rob asked for. Run this a few times from the Apps Script editor
// right after setup (click Run, check the log, click Run again) until it
// logs 0 remaining — much faster than waiting for the 15-min trigger alone.
function runBackfillNow() {
  const startTime = Date.now();
  const maxRuntimeMs = 4.5 * 60 * 1000; // stay under the 6-min execution cap
  const label = getOrCreateProcessedLabel();
  let totalProcessed = 0;

  while (Date.now() - startTime < maxRuntimeMs) {
    const threads = GmailApp.search(emailSearchQuery(), 0, 20);
    if (!threads.length) break;
    threads.forEach(function(thread) { processOneThread(thread, label); });
    totalProcessed += threads.length;
  }

  invalidateCache();
  const remaining = GmailApp.search(emailSearchQuery(), 0, 1).length;
  Logger.log('Backfill pass: processed ' + totalProcessed + ' thread(s) this run. ' +
    (remaining ? 'More remain — run again.' : 'Nothing left to process. ✓'));
}

function createEmailProcessingTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'processIncomingEmails') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('processIncomingEmails')
    .timeBased()
    .everyMinutes(15)
    .create();
  Logger.log('✓ Email processing trigger set — every 15 minutes');
}

// ==================== QUICK CAPTURE ====================
//
// Reuses the exact same categorizeWithClaude() engine as the email agent.

function quickCapture(data) {
  const result = categorizeWithClaude('quick_capture', data.text, null);
  const added = [];

  result.events.forEach(function(ev) {
    addEvent({ title: ev.title, date: ev.date, time: ev.time || '', description: ev.description || '', source: 'quick_capture', sourceRef: '' });
    added.push('event: ' + ev.title);
  });
  result.tasks.forEach(function(t) {
    addTask({ task: t.task, assignee: '', priority: t.priority || 'medium', frequency: 'none', source: 'quick_capture', sourceRef: '' });
    added.push('task: ' + t.task);
  });

  // If nothing actionable was found, file the raw note as a task anyway —
  // for someone relying on this to not forget things, a captured thought
  // must never silently vanish.
  if (!result.events.length && !result.tasks.length) {
    addTask({ task: data.text, assignee: '', priority: 'medium', frequency: 'none', source: 'quick_capture', sourceRef: '' });
    added.push('task (uncategorized): ' + data.text);
  }

  return { success: true, added: added };
}

// ==================== ESCALATING NUDGES ====================
//
// Extends the existing 7am push with check-ins later in the day — but only
// when something is actually still outstanding, so a clear day stays quiet.

function sendNudgeIfPending(slotLabel) {
  const today   = Utilities.formatDate(new Date(), 'Australia/Sydney', 'yyyy-MM-dd');
  const nowHHMM = Utilities.formatDate(new Date(), 'Australia/Sydney', 'HH:mm');

  const pendingTasks  = getTasks().filter(function(t) { return !t.completed; });
  const todayEvents   = getEvents().filter(function(e) { return e.date === today; });
  const upcomingToday = todayEvents.filter(function(e) { return !e.time || e.time >= nowHHMM; });

  if (!pendingTasks.length && !upcomingToday.length) {
    Logger.log('Nudge skipped (' + slotLabel + '): nothing pending');
    return;
  }

  const bodyParts = [];
  if (pendingTasks.length) bodyParts.push(pendingTasks.length + ' task' + (pendingTasks.length > 1 ? 's' : '') + ' still pending.');
  if (upcomingToday.length) bodyParts.push(upcomingToday.length + ' event' + (upcomingToday.length > 1 ? 's' : '') + ' left today.');

  sendPushNotificationPayload('⏰ ' + slotLabel + ' check-in', bodyParts.join(' '), 'nudge');
}

function sendNudgeMidday() { sendNudgeIfPending('Midday'); }
function sendNudgeEvening() { sendNudgeIfPending('Evening'); }

function createNudgeTriggers() {
  ['sendNudgeMidday', 'sendNudgeEvening'].forEach(function(fn) {
    ScriptApp.getProjectTriggers().forEach(function(t) {
      if (t.getHandlerFunction() === fn) ScriptApp.deleteTrigger(t);
    });
  });
  ScriptApp.newTrigger('sendNudgeMidday').timeBased().inTimezone('Australia/Sydney').atHour(12).nearMinute(30).everyDays(1).create();
  ScriptApp.newTrigger('sendNudgeEvening').timeBased().inTimezone('Australia/Sydney').atHour(17).nearMinute(30).everyDays(1).create();
  Logger.log('✓ Nudge triggers set — 12:30pm and 5:30pm Sydney');
}

// ==================== WEEKLY DIGEST ====================

function sendWeeklyDigest() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStr = Utilities.formatDate(now, 'Australia/Sydney', 'yyyy-MM-dd');

  const tasks  = getTasks();
  const events = getEvents();

  // Tasks added more than 7 days ago that are still incomplete — "fell through the cracks"
  const staleTasks = tasks.filter(function(t) {
    if (t.completed || !t.addedDate) return false;
    return new Date(t.addedDate) < sevenDaysAgo;
  });

  // Events in the past 7 days that have already happened
  const pastWeekEvents = events.filter(function(e) {
    return e.date && e.date < todayStr && new Date(e.date) >= sevenDaysAgo;
  }).sort(function(a, b) { return new Date(a.date) - new Date(b.date); });

  function staleTaskRow(t) {
    const assignee = t.assignee ? '<span style="background:#1A5F7A;color:white;padding:1px 7px;border-radius:10px;font-size:12px;margin-left:6px;">' + t.assignee + '</span>' : '';
    return '<div style="padding:8px 0;border-bottom:1px solid #F1F5F9;">◦ ' + t.task + assignee + '</div>';
  }
  function pastEventRow(e) {
    return '<div style="padding:8px 0;border-bottom:1px solid #F1F5F9;">📌 <strong>' + e.title + '</strong> <span style="color:#64748B;font-size:13px;">— ' +
      Utilities.formatDate(new Date(e.date), 'Australia/Sydney', 'EEE d MMM') + '</span></div>';
  }

  const staleHtml = staleTasks.length ? staleTasks.map(staleTaskRow).join('') : '<div style="color:#94A3B8;font-style:italic;padding:8px 0;">Nothing stuck around more than a week — nice!</div>';
  const pastHtml  = pastWeekEvents.length ? pastWeekEvents.map(pastEventRow).join('') : '<div style="color:#94A3B8;font-style:italic;padding:8px 0;">No events in the past week.</div>';

  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#1A5F7A,#114356);border-radius:16px;padding:28px 32px;margin-bottom:24px;">
        <div style="font-size:28px;margin-bottom:4px;">📊 Weekly Digest</div>
        <div style="color:rgba(255,255,255,0.85);font-size:15px;">What fell through the cracks this week</div>
      </div>
      <div style="background:white;border-radius:16px;padding:28px 32px;box-shadow:0 4px 6px rgba(15,23,42,0.08);">
        <div style="margin-bottom:28px;">
          <h2 style="margin:0 0 12px 0;font-size:17px;color:#EF4444;border-bottom:2px solid #EF4444;padding-bottom:6px;">📝 Tasks Pending 7+ Days</h2>
          ${staleHtml}
        </div>
        <div style="margin-bottom:8px;">
          <h2 style="margin:0 0 12px 0;font-size:17px;color:#8B5CF6;border-bottom:2px solid #8B5CF6;padding-bottom:6px;">📅 Past Week's Events</h2>
          ${pastHtml}
        </div>
      </div>
      <div style="text-align:center;padding:16px;color:#94A3B8;font-size:13px;">Sent automatically by Family Organizer · Warners Bay, NSW</div>
    </div>
  </body>
  </html>`;

  MailApp.sendEmail({
    to: EMAIL_RECIPIENT,
    subject: '📊 Weekly Digest — week of ' + Utilities.formatDate(sevenDaysAgo, 'Australia/Sydney', 'd MMM'),
    htmlBody: html
  });
  Logger.log('Weekly digest sent');
}

function createWeeklyDigestTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendWeeklyDigest') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendWeeklyDigest')
    .timeBased().inTimezone('Australia/Sydney').onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).nearMinute(30).create();
  Logger.log('✓ Weekly digest trigger set — Mondays 7:30am Sydney');
}

// ==================== PRINT SHEET (for the local daily printout) ====================
//
// Returns plain data for PrintDailySheet.ps1 (a local script on Rob's PC,
// not part of this repo) to format and send to the printer each morning.

function getPrintSheet() {
  const today = Utilities.formatDate(new Date(), 'Australia/Sydney', 'yyyy-MM-dd');
  const dayName = Utilities.formatDate(new Date(), 'Australia/Sydney', 'EEEE d MMMM');
  const isMonday = Utilities.formatDate(new Date(), 'Australia/Sydney', 'EEEE') === 'Monday';

  const tasks  = getTasks().filter(function(t) { return !t.completed && (!t.assignee || t.assignee === 'Rob'); });
  const events = getEvents().filter(function(e) { return e.date === today; });
  const spencerR  = getRoutine('spencer').filter(function(r) { return !r.completed; }).map(function(r) { return { child: 'Spencer', task: r.task }; });
  const graingerR = getRoutine('grainger').filter(function(r) { return !r.completed; }).map(function(r) { return { child: 'Grainger', task: r.task }; });

  return {
    dayName: dayName,
    events: events,
    tasks: tasks,
    routines: spencerR.concat(graingerR),
    isMonday: isMonday
  };
}
