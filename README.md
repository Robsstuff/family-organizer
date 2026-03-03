# 👨‍👩‍👧‍👦 Family Organizer - Complete Project Documentation

## 📋 Project Overview

A comprehensive family organization web app with Google Sheets integration, designed for Rob, Jessie, Spencer, and Grainger's family in Warners Bay, Lake Macquarie, NSW, Australia.

---

## 🎯 Current Features

### ✅ Implemented & Working

1. **Dashboard Homepage**
   - Today's events display
   - To-Do list (side-by-side with shopping)
   - Shopping list
   - Birthday alerts (1 week notice)

2. **To-Do List System**
   - Task assignment (Rob, Jessie, Spencer, Grainger)
   - Priority levels (High, Medium, Low)
   - Frequency/Recurring tasks (Daily, Weekly, Monthly, Yearly)
   - Points system (10-15 points per task)
   - Completed tasks disappear after 2 days
   - Auto-reset for recurring tasks

3. **Shopping List**
   - Simple checkbox items
   - Completed items go to bottom
   - Delete completed items
   - Synced across devices

4. **Family Calendar**
   - List view (default) and Month grid view
   - Google Calendar integration (reads events)
   - Weather display (Warners Bay)
   - Click day for detailed popup
   - Delete app-created events
   - Filters out past events from list view
   - Timezone: Australia/Sydney

5. **Kids Routines**
   - Separate lists for Spencer and Grainger
   - Simple completion tracking
   - Completed items move to bottom
   - No points or assignments (just checkboxes)

6. **Birthday Tracker**
   - Age calculation and display
   - Countdown to next birthday
   - Dashboard alerts (1 week notice)
   - Shows in "Today's Events" on birthday
   - Date input: DD/MM/YYYY or YYYY-MM-DD

7. **Points & Leaderboard**
   - Individual scores per family member
   - Saves to Google Sheets (FamilyPoints tab)
   - Medal display (🥇🥈🥉)
   - Separate leaderboard page
   - Total family points in header

8. **Weather Integration**
   - Location: Warners Bay, Lake Macquarie NSW (-32.9719, 151.6535)
   - Temperature in Celsius
   - 5-day forecast
   - Shows on calendar events
   - No location permission prompts

---

## 🗂️ File Structure

```
FamilyOrganizerPackage/
├── README.md (this file)
├── family-organizer.html (main application)
├── google-apps-script.gs (backend API)
├── CONFIGURATION.md (setup instructions)
├── FEATURES.md (detailed feature list)
├── KNOWN-ISSUES.md (bugs and limitations)
└── ARCHITECTURE.md (technical details)
```

---

## 🔧 Configuration

### **Family Members:**
- Rob
- Jessie
- Spencer
- Grainger

### **Location:**
- Warners Bay, Lake Macquarie, NSW, Australia
- Coordinates: -32.9719, 151.6535
- Timezone: Australia/Sydney (AEST/AEDT)

### **API Keys & URLs:**
```javascript
// In family-organizer.html (line ~540)
const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
const WEATHER_API_KEY = 'd505edd7a0bf98a7a28bd658fa664f1d';
```

### **Google Sheets Structure:**
7 sheets required:
1. **TodoList** - Tasks with frequency, priority, assignee
2. **Shopping** - Shopping list items
3. **Calendar** - Events (app-created only)
4. **SpencerRoutine** - Spencer's daily tasks
5. **GraingerRoutine** - Grainger's daily tasks
6. **Birthdays** - Family birthdays with dates
7. **FamilyPoints** - Points tracking per member

---

## 🚀 Quick Start

### **For Development:**
1. Open `family-organizer.html` in browser (works standalone with localStorage)
2. Make changes
3. Test locally
4. Deploy to GitHub Pages or similar

### **For Production:**
1. Set up Google Sheet with 7 tabs (run `testSetup()` in Apps Script)
2. Deploy Apps Script as Web App
3. Update API_URL in HTML file
4. Upload HTML to hosting (GitHub Pages recommended)
5. Share URL with family

---

## 📊 Data Flow

```
User Action → HTML/JavaScript → Google Apps Script → Google Sheets
     ↓                                  ↓
  Local UI Update              Fetch/Store Data
     ↓                                  ↓
Weather API (OpenWeather)    Google Calendar (read-only)
```

### **Data Persistence:**
- **Primary:** Google Sheets (all data)
- **Cache:** localStorage (points, for faster loading)
- **Real-time:** API calls on each action

---

## 🎨 Design System

### **Colors:**
```css
--primary: #1A5F7A (Teal blue)
--accent: #FF8B3D (Orange)
--success: #22C55E (Green)
--warning: #F59E0B (Yellow)
--danger: #EF4444 (Red)
```

### **Font:**
System font stack (native to each device)

### **Layout:**
- Mobile-first responsive design
- Max width: 1600px
- Grid-based layout
- Card-based components

---

## 🐛 Known Issues

See `KNOWN-ISSUES.md` for complete list.

**Critical:**
- Points may not save if FamilyPoints sheet doesn't exist
- Timezone issues if Google Calendar timezone differs from Australia/Sydney
- Recurring tasks reset requires page refresh (runs every 24 hours)

**Minor:**
- Weather cache is 6 hours (can show slightly outdated data)
- No offline mode (requires internet for Google Sheets)
- Can't delete Google Calendar events from app

---

## 🔮 Future Enhancements / Wishlist

**Requested but not yet implemented:**
- Export tasks as PDF
- Weekly family report email
- Dark mode
- Task comments/notes
- Attachment support
- Mobile app version
- Notifications for upcoming events
- Task history/analytics
- Shared grocery list with store categories
- Meal planning integration

---

## 📞 Support & Troubleshooting

### **Points Not Saving:**
1. Check FamilyPoints sheet exists
2. Run `testSetup()` in Apps Script
3. Verify API_URL is correct
4. Check browser console for errors

### **Events Duplicating:**
- Fixed in latest version
- App no longer syncs to Google Calendar
- Only reads from Google Calendar

### **Timezone Wrong:**
- Apps Script uses Australia/Sydney
- Check Google Calendar timezone setting
- May need to redeploy Apps Script

### **Weather Not Loading:**
- Check API key is valid
- Verify coordinates are correct
- Check browser console for errors

---

## 🏗️ Architecture

See `ARCHITECTURE.md` for technical details.

**Tech Stack:**
- Frontend: Vanilla JavaScript (no frameworks)
- Backend: Google Apps Script
- Database: Google Sheets
- APIs: OpenWeather, Google Calendar
- Hosting: Static HTML (GitHub Pages compatible)

**Key Design Decisions:**
- No localStorage for data (Google Sheets only)
- Recurring tasks via server-side cron
- Read-only Google Calendar integration
- Client-side points calculation
- Server-side data persistence

---

## 📝 Version History

**v3 (Current):**
- Added recurring tasks (Daily/Weekly/Monthly/Yearly)
- Birthday age display and alerts
- Points save to Google Sheets
- Completed items go to bottom (all lists)
- Completed tasks disappear after 2 days
- Past events hidden from list view
- Delete events feature
- Fixed duplicate events
- List view default for calendar
- Timezone fixes (Australia/Sydney)

**v2:**
- Dashboard layout
- Kids routines
- Shopping list
- Calendar grid view
- Leaderboard separate page
- Weather integration

**v1:**
- Basic to-do list
- Calendar
- Birthdays
- Google Sheets integration

---

## 🤝 Contributing to This Project

When working with Claude Code:

1. **Be Specific:** "Add export to PDF for tasks" not "improve export"
2. **Test Incrementally:** Make small changes, test, repeat
3. **Keep Backup:** Always save working version before big changes
4. **Document Changes:** Update README when adding features
5. **Consider Mobile:** Test on phone after desktop changes

---

## 📄 License & Usage

Personal family project - free to use and modify.

---

## 🙏 Acknowledgments

Built through iterative development with Claude (Anthropic) via chat interface.
Ready for continued development with Claude Code.

---

**Last Updated:** March 2026
**Status:** Production-ready with known minor issues
**Next Steps:** See KNOWN-ISSUES.md and Future Enhancements section
