# Google Sheets RSVP Database Setup Guide

Follow these simple steps to connect your invitation webpage to a Google Sheet. Once done, all guest RSVPs will automatically save into your spreadsheet in real-time, and the webpage will load blessings directly from it!

---

## Step 1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.google.com) and create a **Blank Spreadsheet**.
2. Rename the spreadsheet to something like `Shivam & Richa RSVPs`.
3. In the first row, create the following headers in columns **A** to **E**:
   - **Column A:** `Timestamp`
   - **Column B:** `Guest Name`
   - **Column C:** `Attendance Status`
   - **Column D:** `Number of Guests`
   - **Column E:** `Wishes & Blessings`

---

## Step 2: Add Google Apps Script
1. In the Google Sheets menu, click **Extensions** -> **Apps Script**.
2. Delete any default code in the editor (`Code.gs`) and paste the following script:

```javascript
// Google Apps Script to handle RSVP submissions and retrievals.
// Paste this directly into the Apps Script editor.

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  try {
    var data = JSON.parse(e.postData.contents);
    var name = data.name;
    var status = data.status === 'yes' ? 'Attending' : 'Declined';
    var guests = data.status === 'yes' ? data.guests : '0';
    var message = data.message;
    var timestamp = new Date();
    
    // Append RSVP details into Google Sheet
    sheet.appendRow([timestamp, name, status, guests, message]);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
                         .setMimeType(ContentService.MimeType.JSON)
                         .setHeaders({
                           'Access-Control-Allow-Origin': '*'
                         });
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON)
                         .setHeaders({
                           'Access-Control-Allow-Origin': '*'
                         });
  }
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var wishes = [];
  
  // Read saved sheet rows (skip header row 0)
  for (var i = 1; i < rows.length; i++) {
    if (!rows[i][1]) continue; // Skip empty rows
    wishes.push({
      name: rows[i][1],
      status: rows[i][2] === 'Attending' ? 'yes' : 'no',
      guests: rows[i][3].toString(),
      message: rows[i][4]
    });
  }
  
  // Show latest submissions at the top
  wishes.reverse();
  
  return ContentService.createTextOutput(JSON.stringify(wishes))
                       .setMimeType(ContentService.MimeType.JSON)
                       .setHeaders({
                         'Access-Control-Allow-Origin': '*'
                       });
}
```

3. Click the **Save icon (Disk)** at the top of the editor.

---

## Step 3: Deploy as a Web App
1. Click the blue **Deploy** button in the top right corner and choose **New deployment**.
2. Click the gear icon next to "Select type" and select **Web app**.
3. Fill in the configuration:
   - **Description:** `RSVP Web Service`
   - **Execute as:** `Me (your email)`
   - **Who has access:** `Anyone` (This is crucial so the guest webpage can submit RSVPs).
4. Click **Deploy**.
5. Google will ask you to **Authorize Access**. Click *Authorize Access*, select your Google Account, click *Advanced* (under warning), and click **Go to RSVP Web Service (unsafe)** to approve permissions.
6. Once deployed, copy the **Web app URL** (it looks like `https://script.google.com/macros/s/.../exec`).

---

## Step 4: Configure the Webpage
1. Open the project file **[script.js](file:///d:/rsem/script.js)**.
2. Find the configuration line at the top:
   ```javascript
   const GOOGLE_SHEET_URL = "";
   ```
3. Paste your copied Web App URL inside the quotes:
   ```javascript
   const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/YOUR-COPIED-ID/exec";
   ```
4. Save the file.

---

## Step 5: Host Your Website Live (100% Free)
Since your invitation is now serverless, you can deploy it to any free static host. The fastest and easiest is **Netlify** or **Vercel**:

### Option A: Netlify Drop (No Terminal/Git Required)
1. Open [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop your project folder `d:\rsem` (containing `index.html`, `style.css`, `script.js`, and `assets/`) directly onto the page.
3. Within 10 seconds, Netlify will generate a live, shareable URL for your invitation!
4. (Optional) Under site settings, you can rename the site to something like `shivam-richa-engagement.netlify.app`.

### Option B: Vercel CLI (Via Terminal)
1. Open PowerShell and run:
   ```bash
   npx vercel
   ```
2. Follow the prompt to log in and set up a new project in the directory. Within a minute, your invitation will be live on a Vercel URL!
