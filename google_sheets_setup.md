# Google Sheets RSVP Database Setup Guide (CORS-Proof Version)

Follow these steps to connect your invitation webpage to a Google Sheet. By using a GET query system, we bypass browser CORS blocks completely, making the RSVP form 100% reliable on Vercel or GitHub Pages!

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
// Google Apps Script to handle both RSVP submissions and retrievals.
// Paste this directly into the Apps Script editor.

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 1. DATA SUBMISSION: If name parameter is present, append a new RSVP row
  if (e.parameter.name) {
    try {
      var name = e.parameter.name;
      var status = e.parameter.status === 'yes' ? 'Attending' : 'Declined';
      var guests = e.parameter.status === 'yes' ? e.parameter.guests : '0';
      var message = e.parameter.message || '';
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
  
  // 2. DATA RETRIEVAL: Otherwise, read all RSVP rows and return them as a JSON list
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

## Step 3: Deploy/Redeploy as a Web App
> [!IMPORTANT]
> Since you have already deployed, you must deploy a **New Version** for Google to update the code.
1. Click **Deploy** -> **Manage deployments** at the top right of your Apps Script editor.
2. Click the **Edit icon (pencil)**.
3. In the **Version** dropdown, select **New version**.
4. Set "Who has access" to **Anyone** and click **Deploy**.
5. Copy the **Web app URL** (it should look like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Step 4: Configure the Webpage
1. Open the project file **[script.js](file:///d:/rsem/script.js)**.
2. Paste the copied Web App URL inside the quotes for `GOOGLE_SHEET_URL` at the top:
   ```javascript
   const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/YOUR-COPIED-ID/exec";
   ```
3. Save the file.
