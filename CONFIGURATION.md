# ⚙️ Configuration & Setup Guide

## 📦 Quick Setup (5 Minutes)

### Step 1: Google Sheet Setup
1. Create a new Google Sheet
2. Name it: "Family Organizer"
3. Keep it open (you'll need it)

### Step 2: Apps Script Deployment
1. In your Google Sheet: **Extensions → Apps Script**
2. Delete any existing code
3. Copy ALL code from `google-apps-script.gs`
4. Paste into Apps Script editor
5. **Line 6:** Change `'your.email@gmail.com'` to your actual Gmail address
6. **Save** (Ctrl+S / Cmd+S)

### Step 3: Run Test Setup
1. In Apps Script, select function: **`testSetup`** (dropdown at top)
2. Click **Run** (▶ play button)
3. **Grant permissions** when prompted:
   - Click "Review permissions"
   - Choose your Google account
   - Click "Advanced" → "Go to Family Organizer (unsafe)"
   - Click "Allow"
4. Check your Google Sheet - you should see **7 new tabs**:
   - TodoList
   - Shopping
   - Calendar
   - SpencerRoutine
   - GraingerRoutine
   - Birthdays
   - FamilyPoints

### Step 4: Deploy as Web App
1. In Apps Script: **Deploy → New deployment**
2. Click gear icon ⚙️ → **Web app**
3. Settings:
   - Description: "Family Organizer API"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. **Copy the Web App URL** (looks like: https://script.google.com/macros/s/ABC123.../exec)
6. Click **Done**

### Step 5: Configure HTML File
1. Open `family-organizer.html` in text editor
2. Find **line ~540** (search for `const API_URL`)
3. Replace the URL with your Web App URL from Step 4
4. **Save** the file

### Step 6: Test Locally
1. Open `family-organizer.html` in Chrome/Firefox/Safari
2. Try adding a task
3. Check your Google Sheet - task should appear!
4. Try other features

### Step 7: Deploy to Web (Optional)
See "Deployment Options" section below

---

## 🤖 AI Agent, Health Log & Daily Print Setup (new)

This update adds an AI email/quick-capture agent, a Health log, "Rob's Reminders",
escalating nudges, a weekly digest, two-way Google Calendar sync, and an unattended
daily printout. Do these steps **in order** — each one depends on the previous.

### Step A: Push the updated Apps Script code
1. Open your Google Sheet → **Extensions → Apps Script**
2. Replace the entire contents with the updated `google-apps-script.gs` from this repo
3. **Save** (Ctrl+S / Cmd+S)

### Step B: Set your Anthropic API key
The email agent and quick-capture both call Claude (Anthropic) to figure out what's
an event vs. a task. The key must live server-side only — **never** paste it into
`index.html`, since that file is public on GitHub Pages.
1. In the Apps Script editor: **Project Settings** (gear icon, left sidebar)
2. Scroll to **Script Properties** → **Add script property**
3. Property: `ANTHROPIC_API_KEY` — Value: your key from console.anthropic.com
4. **Save**

### Step C: Re-authorize (new permissions)
This update adds Gmail access and upgrades Calendar from read-only to full read/write.
Apps Script will ask you to re-approve.
1. In the Apps Script editor, select **`testCategorization`** from the function dropdown
2. Click **Run**
3. A permissions prompt appears — click **Review permissions → [your account] → Advanced → Go to Family Organizer (unsafe) → Allow**
4. Check the **Executions** log (left sidebar) — you should see two JSON results: a real event extracted from the first test, empty arrays for the second (newsletter-style) test

### Step D: One-time migration + sheet setup
Run each of these once, from the Apps Script function dropdown → Run:
1. `migrateAddSourceColumns` — adds the new Source/SourceRef/GCalEventId columns to your existing TodoList and Calendar sheets (safe to re-run, it skips if already done)
2. `testSetup` — creates the new **Health** sheet tab alongside the existing ones

### Step E: Turn on the new triggers
Run each of these once:
1. `createEmailProcessingTrigger` — checks robbukey@gmail.com every 15 minutes from now on
2. `createNudgeTriggers` — adds midday (12:30pm) and evening (5:30pm) check-ins, but only when something's still pending
3. `createWeeklyDigestTrigger` — Monday 7:30am email of what fell through the cracks

### Step F: Backfill this year's email
You asked for the agent to read everything from this year to get started, not just
unread-going-forward.
1. Run **`runBackfillNow`** from the function dropdown
2. Check the Executions log — it'll say how many threads it processed and whether more remain
3. **Run it again** if it says more remain (each run is capped at ~4.5 minutes to stay under Apps Script's limit) — repeat until it logs "Nothing left to process"
4. After this, the 15-minute trigger from Step E keeps it current automatically

### Step G: Deploy a new version
Changing `appsscript.json` scopes or any `.gs` code needs a new deployment version
for the public Web App URL to pick it up:
1. **Deploy → Manage deployments**
2. Click the pencil (edit) icon on the active deployment
3. **Version → New version → Deploy**
4. The existing Web App URL stays the same — no need to update `index.html`'s `API_URL`

### Step H: Daily printout (optional, local to your PC)
`PrintDailySheet.ps1` lives at `C:\Scripts\PrintDailySheet.ps1` on this computer (not
in this repo — it's machine-specific and has no secrets in it, just a public read
endpoint). It calls the new `getPrintSheet` endpoint and prints a plain-text "today"
sheet to your default printer.
1. **Test it manually first**, in a PowerShell prompt: `& "C:\Scripts\PrintDailySheet.ps1"` — confirm it actually prints something sensible (and check `print-log.txt` on your Desktop)
2. Only once that looks right, register it to run automatically every morning:
   ```powershell
   $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\Scripts\PrintDailySheet.ps1"'
   $trigger = New-ScheduledTaskTrigger -Daily -At 7:15AM
   $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
   Register-ScheduledTask -TaskName "FamilyOrganizerDailyPrint" -Action $action -Trigger $trigger -Settings $settings -Description "Prints daily family organizer sheet"
   ```
3. This needs your PC and printer on/ready at 7:15am — if the PC was asleep, `-StartWhenAvailable` means it still prints once it wakes up, just late.

---

## 🔧 Detailed Configuration

### Google Calendar Integration

**To fetch events from your Google Calendar:**

1. In `google-apps-script.gs` line 6:
   ```javascript
   const CALENDAR_ID = 'your.email@gmail.com';
   ```
   Replace with your Gmail address (the one that owns the calendar)

2. Ensure your Google Calendar timezone is set to:
   - Settings → General → Time zone
   - **(GMT+10:00/+11:00) Australian Eastern Time - Sydney**

3. Events from Google Calendar will appear with green 📅 badge in the app

**Note:** App only READS from Google Calendar. To add/delete events in Google Calendar, use the Google Calendar app directly.

---

### Weather API

**Current Configuration:**
- Provider: OpenWeather
- API Key: `d505edd7a0bf98a7a28bd658fa664f1d`
- Location: Warners Bay (-32.9719, 151.6535)
- Units: Celsius
- Cache: 6 hours

**To change location:**
In `family-organizer.html`, find line ~830:
```javascript
const location = { lat: -32.9719, lon: 151.6535 }; // Warners Bay
```
Replace with your coordinates.

**To get a new API key (if needed):**
1. Go to https://openweathermap.org
2. Sign up for free account
3. Get API key from dashboard
4. Replace in HTML file line ~539

---

### Family Members

**To change family members:**

1. In `family-organizer.html` line ~541:
   ```javascript
   const familyMembers = ['Rob', 'Jessie', 'Spencer', 'Grainger'];
   ```

2. Update the array with your family member names

3. **Important:** If you already have data in FamilyPoints sheet with old names, you'll need to manually update or reset

---

## 🌐 Deployment Options

### Option 1: GitHub Pages (Recommended - Free!)

1. **Create GitHub Account** (if you don't have one)
   - Go to https://github.com
   - Sign up

2. **Create New Repository**
   - Click **+** → New repository
   - Name: `family-organizer`
   - Public
   - ✅ Add README
   - Create repository

3. **Upload HTML File**
   - Click **Add file** → Upload files
   - Rename `family-organizer.html` to `index.html` (important!)
   - Upload
   - Commit changes

4. **Enable GitHub Pages**
   - Settings → Pages (left sidebar)
   - Source: **main** branch, **/ (root)** folder
   - Save
   - Wait 1-2 minutes

5. **Get Your URL**
   - Should appear as: `https://YOUR-USERNAME.github.io/family-organizer/`
   - Share this URL with family!

### Option 2: Google Drive

1. Upload `family-organizer.html` to Google Drive
2. Right-click → Share → Get link
3. Change to "Anyone with link can view"
4. Share URL with family

**Note:** Less ideal - Google Drive may not render correctly

### Option 3: Netlify (Free, Easy)

1. Go to https://netlify.com
2. Drag and drop `family-organizer.html` onto site
3. Rename to `index.html` if needed
4. Get your URL (e.g., `random-name-123.netlify.app`)
5. Optional: Connect custom domain

### Option 4: Local Network Only

1. Put `family-organizer.html` on computer
2. Start simple web server:
   ```bash
   python -m http.server 8000
   ```
3. Access from any device on same WiFi:
   - `http://YOUR-COMPUTER-IP:8000/family-organizer.html`

**Note:** Computer must stay on for others to access

---

## 🔒 Security & Privacy

### Data Storage
- All data stored in YOUR Google Sheet
- Only you control access
- Google's security protects it

### Web App Permissions
- Runs as YOU
- Only you can modify data
- Family members read/write through the app

### Sharing Safely
- Don't share your Google Sheet directly
- Only share the HTML app URL
- Family members don't need Google account (but recommended)

### API Keys
- Weather API key is public (low risk)
- Google Apps Script URL is public (controlled by permissions)
- No sensitive data exposed

---

## 📱 Mobile Setup

### iOS (iPhone/iPad)

**Add to Home Screen:**
1. Open app URL in Safari
2. Tap Share button (square with arrow)
3. Scroll down → **Add to Home Screen**
4. Name: "Family Organizer"
5. Tap **Add**
6. Icon appears on home screen!

### Android

**Add to Home Screen:**
1. Open app URL in Chrome
2. Tap menu (3 dots) → **Add to Home screen**
3. Name: "Family Organizer"
4. Tap **Add**
5. Icon appears on home screen!

**Now it works like a native app!**

---

## 🔄 Updating the App

### When You Make Changes:

**If hosted on GitHub Pages:**
1. Make changes to local HTML file
2. Go to GitHub repository
3. Click on `index.html`
4. Click pencil icon (Edit)
5. Paste new code
6. Commit changes
7. Wait 1-2 minutes for deployment
8. Family refreshes browser

**If hosted on Netlify:**
1. Drag and drop new file to Netlify site
2. Replaces old version
3. Family refreshes browser

**If on Google Drive:**
1. Upload new file
2. Share new link

**Apps Script Updates:**
1. Make changes in Apps Script editor
2. **Deploy → Manage deployments**
3. Click edit (pencil) on active deployment
4. **Version → New version**
5. **Deploy**
6. HTML app automatically uses new version (no URL change)

---

## 🧪 Testing Checklist

After setup, test these features:

- [ ] Add a task → appears in Google Sheet
- [ ] Complete task → points update
- [ ] Check leaderboard → shows scores
- [ ] Add shopping item → appears in list
- [ ] Add event → appears in calendar
- [ ] Check today's events on dashboard
- [ ] Add birthday → countdown shows
- [ ] Try Spencer's routine
- [ ] Try Grainger's routine
- [ ] Switch calendar to Month View
- [ ] Click a day in calendar → popup shows
- [ ] Check weather appears on events
- [ ] Delete an app event → removes from list
- [ ] Refresh page → data persists
- [ ] Close browser, reopen → data still there
- [ ] Try on phone → works on mobile
- [ ] Log a Health entry → appears in Health tab
- [ ] Send yourself a test email with an obvious event/task → appears in Tasks/Calendar within 15 min, tagged "via email"
- [ ] Use the ✏️ Quick Capture button → note files into Tasks or Calendar, tagged "via quick capture"
- [ ] Add an event in-app → check it also appears in your real Google Calendar (and your phone gets a notification)
- [ ] Check "Rob's Reminders" card on the Dashboard shows your unassigned/Rob-assigned pending tasks with zero clicks

---

## 🆘 Troubleshooting

### "Cannot connect to Google Sheets"
- Check API_URL is correct in HTML
- Verify Apps Script is deployed
- Try redeploying Apps Script
- Check browser console for errors

### "Points not saving"
- Run `testSetup()` in Apps Script
- Check FamilyPoints sheet exists
- Verify sheet has correct columns

### "Events duplicating"
- Update to latest code (fixed in v3)
- Clear old events from Google Sheets Calendar tab
- Redeploy Apps Script

### "Weather not loading"
- Check API key is valid
- Verify coordinates are correct
- Wait 10 seconds (cache may be loading)

### "Wrong timezone"
- Check Google Calendar timezone settings
- Verify Apps Script has Australia/Sydney
- Redeploy Apps Script

### "Email agent isn't adding anything"
- Check `ANTHROPIC_API_KEY` is set in Script Properties (Project Settings)
- Check you re-authorized after the scope change (Step C above) — re-run `testCategorization` if unsure
- Check the email actually has a concrete date/action — newsletters and receipts are deliberately ignored
- Check the thread doesn't already have the `FamilyOrganizer/Processed` Gmail label (it won't be reprocessed)

### "Two-way Calendar sync isn't showing on my phone"
- Confirm you re-authorized the upgraded `calendar` (not `calendar.readonly`) scope
- Confirm you deployed a new version after the scope change (Step G above)
- Check the Calendar app on your phone is signed into robbukey@gmail.com

### "Daily printout didn't print"
- Run `& "C:\Scripts\PrintDailySheet.ps1"` manually and read the error
- Check `print-log.txt` on the Desktop for the last attempt's result
- Confirm the PC was awake and the printer was on/ready at the scheduled time

---

## 💡 Pro Tips

1. **Bookmark the app URL** on all devices
2. **Pin to home screen** on phones
3. **Set up notifications** in Google Calendar (not the app)
4. **Backup your Google Sheet** regularly (File → Make a copy)
5. **Use Chrome** for best experience
6. **Test changes locally** before deploying
7. **Keep a copy** of working version before big changes

---

**Setup Time:** 5-10 minutes  
**Difficulty:** Easy (follow steps carefully)  
**Support:** Ask Claude Code for help!
