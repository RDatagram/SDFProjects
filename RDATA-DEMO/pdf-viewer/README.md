# Vendor Bill PDF Viewer - Side-by-Side Layout

This solution adds a **"Hide / Show PDF"** button to Vendor Bill records that toggles a side-by-side PDF viewer panel, matching the layout shown in your screenshot.

## Features

- **Toggle Button**: "Hide / Show PDF" button in the action bar
- **Side-by-Side Layout**: PDF displays on the left (50% width), record on the right
- **Resizable Panel**: Drag the border to adjust panel width
- **Toolbar Actions**: New Tab, Download, and Hide buttons
- **Smooth Transitions**: Animated panel show/hide
- **Automatic Detection**: Finds PDFs from custom field or attachments

## How It Works

1. When viewing a Vendor Bill with an attached PDF, the "Hide / Show PDF" button appears
2. Click the button to toggle the PDF panel on/off
3. The PDF displays on the left side of the screen
4. The Vendor Bill record shifts to the right
5. Drag the panel border to resize

## Components

### 1. User Event Script (`vb_pdf_viewer_ue.js`)
- Adds the "Hide / Show PDF" button via `form.addButton()`
- Injects HTML/CSS/JS for the side-by-side panel
- Detects attached PDF files

### 2. Suitelet (`vb_pdf_viewer_sl.js`)
- Serves the PDF file content
- Handles both inline viewing and downloads

### 3. Custom Field (Optional)
- `custbody_vb_linked_pdf` - Document field to explicitly link a PDF

## Installation

### SDF Deployment
```bash
cd src
suitecloud project:deploy
```

### Manual Installation

1. Upload scripts to SuiteScripts/rdata/
2. Create User Event Script:
   - Script ID: `customscript_vb_pdf_viewer_ue`
   - Deploy to Vendor Bill
3. Create Suitelet:
   - Script ID: `customscript_vb_pdf_viewer_sl`
   - Deployment ID: `customdeploy_vb_pdf_viewer_sl`

## File Structure

```
vendor_bill_pdf_viewer_v2/
├── src/
│   ├── FileCabinet/
│   │   └── SuiteScripts/
│   │       └── rdata/
│   │           ├── vb_pdf_viewer_ue.js
│   │           ├── vb_pdf_viewer_sl.js
│   │           └── vb_pdf_viewer_cs.js (optional)
│   ├── Objects/
│   │   ├── customscript_vb_pdf_viewer_ue.xml
│   │   ├── customscript_vb_pdf_viewer_sl.xml
│   │   └── custbody_vb_linked_pdf.xml
│   ├── manifest.xml
│   └── deploy.xml
└── README.md
```

## Customization

### Change Default Panel Width
In `vb_pdf_viewer_ue.js`, modify the CSS:
```css
#custpage_pdf_panel {
    width: 50%; /* Change to 40%, 60%, etc. */
}
```

### Change Panel Position
To show PDF on the right instead of left:
```css
#custpage_pdf_panel {
    left: auto;
    right: 0;
    border-left: 3px solid #607D8B;
    border-right: none;
}

body.pdf-panel-open #div__body {
    margin-left: 0 !important;
    margin-right: 50% !important;
}
```

## Script IDs

| Component | Script ID | Deployment ID |
|-----------|-----------|---------------|
| User Event | `customscript_vb_pdf_viewer_ue` | `customdeploy_vb_pdf_viewer_ue` |
| Suitelet | `customscript_vb_pdf_viewer_sl` | `customdeploy_vb_pdf_viewer_sl` |

## Troubleshooting

### Button Not Appearing
- Verify the UE script is deployed to Vendor Bill
- Check if PDF is attached or custom field is populated
- Review script execution logs

### PDF Not Loading
- Check Suitelet deployment and permissions
- Verify file exists in File Cabinet
- Check browser console for errors

### Layout Issues
- Clear browser cache
- Check for CSS conflicts with other customizations
- Try different browser

## Requirements

- NetSuite with SuiteScript 2.1
- PDF files stored in File Cabinet
- User Event and Suitelet permissions
