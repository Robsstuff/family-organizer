/**
 * Family Organizer - Updated Google Apps Script
 * With: Points tracking, Recurring tasks, Task cleanup
 */

const CALENDAR_ID = 'your.email@gmail.com'; // UPDATE THIS

const SHEET_NAMES = {
  TODO: 'TodoList',
  SHOPPING: 'Shopping',
  CALENDAR: 'Calendar',
  SPENCER: 'SpencerRoutine',
  GRAINGER: 'GraingerRoutine',
  BIRTHDAYS: 'Birthdays',
  POINTS: 'FamilyPoints'
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
        result = {
          tasks: getTasks(),
          shopping: getShopping(),
          events: getEvents(),
          spencerRoutine: getRoutine('spencer'),
          graingerRoutine: getRoutine('grainger'),
          birthdays: getBirthdays(),
          points: getPoints()
        };
        break;
      
      case 'addTask': result = addTask(data); break;
      case 'completeTask': result = completeTask(data); break;
      case 'addShoppingItem': result = addShoppingItem(data); break;
      case 'toggleShoppingItem': result = toggleShoppingItem(data); break;
      case 'deleteShoppingItem': result = deleteShoppingItem(data); break;
      case 'addEvent': result = addEvent(data); break;
      case 'deleteEvent': result = deleteEvent(data); break;
      case 'addRoutineTask': result = addRoutineTask(data); break;
      case 'toggleRoutineTask': result = toggleRoutineTask(data); break;
      case 'addBirthday': result = addBirthday(data); break;
      case 'updatePoints': result = updatePoints(data); break;
      case 'resetRecurringTasks': result = resetRecurringTasks(); break;
      
      default: result = { error: 'Unknown action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
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
  
  const events = [];
  
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      
      events.push({
        title: row[0],
        date: row[1] ? new Date(row[1]).toISOString().split('T')[0] : null,
        time: row[2] || '',
        description: row[3] || '',
        addedDate: row[4] ? new Date(row[4]).toISOString() : null,
        index: i - 1,
        source: 'sheet'
      });
    }
  }
  
  try {
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    if (calendar) {
      const today = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(today.getMonth() + 3);
      
      const calendarEvents = calendar.getEvents(today, threeMonthsFromNow);
      
      calendarEvents.forEach(event => {
        const startTime = event.getStartTime();
        const isAllDay = event.isAllDayEvent();
        
        // Format date in Australian timezone (AEST/AEDT)
        const dateInAustralia = Utilities.formatDate(startTime, 'Australia/Sydney', 'yyyy-MM-dd');
        const timeInAustralia = isAllDay ? '' : Utilities.formatDate(startTime, 'Australia/Sydney', 'HH:mm');
        
        events.push({
          title: event.getTitle(),
          date: dateInAustralia,
          time: timeInAustralia,
          description: event.getDescription() || '',
          source: 'calendar'
        });
      });
    }
  } catch (e) {
    Logger.log('Error fetching calendar: ' + e.toString());
  }
  
  const uniqueEvents = [];
  const seen = new Set();
  
  events.forEach(event => {
    const key = `${event.title}-${event.date}-${event.time}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueEvents.push(event);
    }
  });
  
  return uniqueEvents;
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

function testSetup() {
  Logger.log('Testing setup...');
  Object.values(SHEET_NAMES).forEach(name => {
    getSheet(name);
    Logger.log('✓ ' + name);
  });
  Logger.log('✓ All sheets ready! Update CALENDAR_ID on line 6');
}
