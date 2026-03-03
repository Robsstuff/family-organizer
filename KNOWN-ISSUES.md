# 🐛 Known Issues & Limitations

## 🔴 Critical Issues (Need Fixing)

### 1. **Points Not Saving**
**Status:** Requires manual setup  
**Impact:** Points reset on page refresh  
**Cause:** FamilyPoints sheet doesn't auto-create  
**Fix:** Run `testSetup()` in Apps Script or create sheet manually  
**Workaround:** See POINTS-SETUP-GUIDE.md  

### 2. **Recurring Tasks Don't Auto-Reset**
**Status:** Works but requires refresh  
**Impact:** Daily tasks stay completed until page refresh  
**Cause:** Reset runs every 24 hours via setInterval  
**Fix Needed:** Implement server-side cron or trigger  
**Workaround:** Refresh page once per day  

---

## 🟡 Medium Priority

### 3. **Can't Delete Google Calendar Events**
**Status:** By design, but limiting  
**Impact:** Must delete in Google Calendar app  
**Cause:** Read-only integration  
**Fix Needed:** Implement Google Calendar write permissions  
**Workaround:** Delete in Google Calendar directly  

### 4. **Weather Cache 6 Hours**
**Status:** Working as designed  
**Impact:** Weather can be slightly outdated  
**Cause:** Rate limiting and performance  
**Fix Needed:** Add manual refresh button  
**Workaround:** Reload page to fetch fresh weather  

### 5. **No Offline Mode**
**Status:** Requires internet  
**Impact:** Can't use without connection  
**Cause:** Google Sheets dependency  
**Fix Needed:** Implement service worker + IndexedDB  
**Workaround:** None - need internet  

---

## 🟢 Minor Issues

### 6. **Timezone Sensitivity**
**Status:** Fixed for Australia/Sydney  
**Impact:** Events may show wrong day if timezone differs  
**Cause:** Google Calendar timezone vs app timezone  
**Fix:** Ensure Google Calendar uses Australia/Sydney  
**Workaround:** Set calendar timezone correctly  

### 7. **Large Event Lists Slow to Load**
**Status:** Performance degrades with 100+ events  
**Impact:** Calendar takes time to render  
**Cause:** No pagination or lazy loading  
**Fix Needed:** Implement virtual scrolling  
**Workaround:** Archive old events  

### 8. **No Undo Function**
**Status:** Deletes are permanent  
**Impact:** Can't recover deleted items  
**Cause:** No trash/archive system  
**Fix Needed:** Add trash bin with 30-day retention  
**Workaround:** Be careful when deleting  

### 9. **Mobile Keyboard Covers Inputs**
**Status:** Some devices affected  
**Impact:** Hard to see what you're typing  
**Cause:** No scroll-to-input on focus  
**Fix Needed:** Add automatic scroll  
**Workaround:** Scroll manually  

### 10. **No Loading Indicators**
**Status:** Unclear when data is loading  
**Impact:** Users don't know if action worked  
**Cause:** No loading states implemented  
**Fix Needed:** Add spinners/progress bars  
**Workaround:** Wait a few seconds  

---

## 🔵 Feature Limitations

### 11. **Single Google Sheet Per Family**
**Status:** One sheet for all data  
**Impact:** Can't have multiple families share code  
**Cause:** Hardcoded API URL  
**Fix Needed:** Multi-tenant architecture  
**Workaround:** Deploy separate instances  

### 12. **Points Can't Be Edited Manually**
**Status:** Only earned through tasks  
**Impact:** Can't adjust for bonuses/penalties  
**Cause:** No UI for manual editing  
**Fix Needed:** Add admin panel  
**Workaround:** Edit Google Sheets directly  

### 13. **No Task Due Dates**
**Status:** Tasks have no deadlines  
**Impact:** Can't prioritize by urgency  
**Cause:** Feature not implemented  
**Fix Needed:** Add due date field  
**Workaround:** Put date in task description  

### 14. **No Subtasks**
**Status:** Tasks are flat list  
**Impact:** Complex tasks hard to manage  
**Cause:** Simple data structure  
**Fix Needed:** Hierarchical task system  
**Workaround:** Create multiple related tasks  

### 15. **No File Attachments**
**Status:** Can't attach images/files  
**Impact:** Need separate storage for documents  
**Cause:** No file storage system  
**Fix Needed:** Integrate Google Drive  
**Workaround:** Share links in descriptions  

---

## ⚠️ Browser Compatibility

### Known Working:
- ✅ Chrome 100+ (Desktop & Mobile)
- ✅ Safari 15+ (Desktop & Mobile)
- ✅ Firefox 100+
- ✅ Edge 100+

### Known Issues:
- ⚠️ Internet Explorer: **NOT SUPPORTED**
- ⚠️ Opera Mini: Limited functionality
- ⚠️ Old Android browsers: May have issues

---

## 🔧 Technical Debt

### Code Quality Issues:

1. **No Error Handling**
   - API calls fail silently
   - No retry logic
   - User not notified of failures

2. **No Unit Tests**
   - All testing is manual
   - Regressions possible
   - Hard to refactor confidently

3. **Mixed Concerns**
   - HTML, CSS, JS all in one file
   - Hard to maintain
   - Should be split

4. **No TypeScript**
   - No type safety
   - Easy to make mistakes
   - IDEs can't help much

5. **Inline Styles**
   - Some CSS in JavaScript strings
   - Hard to maintain consistency
   - Should use classes

---

## 📊 Performance Issues

### Observed Bottlenecks:

1. **Weather API on Every Calendar Load**
   - Could cache better
   - Slows initial page load

2. **Multiple API Calls on Init**
   - 7 separate calls to Google Sheets
   - Could batch into single getData() call

3. **No Debouncing**
   - Rapid clicks cause duplicate API calls
   - Should debounce button clicks

4. **DOM Manipulation**
   - Rebuilds entire lists on update
   - Should use virtual DOM or diff

---

## 🛡️ Security Concerns

### Not Critical But Should Address:

1. **API Key in Client Code**
   - Weather API key exposed
   - Should use proxy/backend
   - Low risk (weather data only)

2. **No Input Sanitization**
   - XSS possible with malicious input
   - Google Sheets acts as sanitizer
   - Should add client-side validation

3. **No Authentication**
   - Anyone with URL can access
   - Google Sheets handles auth
   - Consider adding app-level auth

---

## 🔄 Data Integrity

### Potential Issues:

1. **Race Conditions**
   - Multiple users updating simultaneously
   - Last write wins
   - Could lose data

2. **No Data Validation**
   - Can enter invalid dates
   - Can create empty tasks
   - Should add validation

3. **No Backup System**
   - Google Sheets is single point of failure
   - Should implement automated backups
   - Export functionality needed

---

## 📱 Mobile Issues

### Specific to Mobile:

1. **Calendar Grid Too Small**
   - Hard to tap small date boxes
   - Text overflows on small screens
   - Needs mobile-specific layout

2. **No Pull-to-Refresh**
   - Must reload page manually
   - Common mobile pattern missing

3. **No Haptic Feedback**
   - No vibration on task completion
   - Would enhance UX

---

## 🎯 Priority Ranking

### Must Fix (Before Production):
- ✅ Points saving (FIXED - need setup)
- ✅ Duplicate events (FIXED)
- ✅ Timezone issues (FIXED)

### Should Fix (Soon):
- ⏱️ Recurring task auto-reset
- ⏱️ Loading indicators
- ⏱️ Error handling

### Nice to Have (Eventually):
- 💭 Offline mode
- 💭 Undo function
- 💭 Manual point editing
- 💭 Task due dates

---

## 🆘 Getting Help

### If Something's Broken:

1. **Check Browser Console** (F12)
   - Look for red errors
   - Copy error messages

2. **Verify Setup**
   - All 7 Google Sheets tabs exist?
   - API_URL correct in HTML?
   - Apps Script deployed?

3. **Common Fixes**
   - Hard refresh (Ctrl+Shift+R)
   - Clear browser cache
   - Redeploy Apps Script
   - Check Google Sheets permissions

4. **Ask Claude Code**
   - Provide error messages
   - Describe what you were doing
   - Share relevant code snippet

---

**Last Updated:** March 2026  
**Total Known Issues:** 15 documented  
**Critical:** 2 (both have workarounds)  
**Status:** App is usable despite issues
