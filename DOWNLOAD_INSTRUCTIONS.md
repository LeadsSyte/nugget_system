# How to Download the Code

There are several ways to get the Hot Leathers personalization code:

## Option 1: Clone the Git Repository (Recommended)

If you have git installed:

```bash
# Clone the repository
git clone [REPOSITORY_URL]

# Navigate to the directory
cd nugget_system

# List all files
ls -la
```

All files will be in the `nugget_system` directory.

---

## Option 2: Download Individual Files from Git Web Interface

### On GitHub:

1. Navigate to the repository on GitHub
2. Click on the file you want (e.g., `hotleathers-personalization.js`)
3. Click the **Raw** button (top right of file view)
4. Right-click → **Save As** → Save to your computer
5. Repeat for each file you need

### On GitLab:

1. Navigate to the repository on GitLab
2. Click on the file you want
3. Click **Download** or **Raw**
4. Save the file

---

## Option 3: Download as ZIP

### On GitHub:

1. Go to the repository main page
2. Click the green **Code** button
3. Select **Download ZIP**
4. Extract the ZIP file on your computer

### On GitLab:

1. Go to the repository main page
2. Click the download icon (↓)
3. Select **zip**
4. Extract the ZIP file

---

## Option 4: Use Command Line (curl or wget)

If you have access to the raw file URLs:

```bash
# Download using curl
curl -O https://[git-host]/[repo]/raw/[branch]/hotleathers-personalization.js

# Or using wget
wget https://[git-host]/[repo]/raw/[branch]/hotleathers-personalization.js
```

---

## Files You Need

### For Basic Exit-Intent Setup:
- ✅ `hotleathers-personalization.js` - Main script
- ✅ `HOTLEATHERS_INSTALLATION.md` - Installation guide
- ✅ `HOTLEATHERS_QUICK_REFERENCE.md` - Quick reference

### For A/B Testing (50/50 split):
- ✅ `hotleathers-personalization-abtest.js` - A/B test version
- ✅ `ABTEST_GUIDE.md` - A/B testing guide
- ✅ `HOTLEATHERS_INSTALLATION.md` - Installation guide

### For Post-Purchase Upsell:
- ✅ `thank-you-page-upsell.liquid` - Simple version (Shopify Plus)
- ✅ `post-purchase-upsell.jsx` - Advanced version (optional)

### Optional Documentation:
- 📄 `README.md` - Overview
- 📄 `SHOPIFY_INSTALLATION_GUIDE.md` - General Shopify guide
- 📄 `EXAMPLES.md` - Code examples
- 📄 `CONFIGURATION.md` - Configuration guide

---

## Quick Start After Download

1. **Create RIDE5 discount** in Shopify Admin
2. **Upload JavaScript file** to Shopify Assets
3. **Add script tag** to theme.liquid
4. **Test** on duplicate theme
5. **Publish** when ready

See `HOTLEATHERS_INSTALLATION.md` for detailed steps.

---

## Which Version Should I Use?

### Use `hotleathers-personalization.js` if:
- ✅ You want exit-intent for ALL users (100%)
- ✅ You've already tested or don't need A/B test
- ✅ You want simplest implementation

### Use `hotleathers-personalization-abtest.js` if:
- ✅ You want to test with 50% of users first
- ✅ You want to measure conversion rate impact
- ✅ You need analytics tracking
- ✅ You want data before full rollout

**Recommendation:** Start with A/B test version to measure impact, then switch to regular version once you confirm it works.

---

## File Sizes

| File | Size | Type |
|------|------|------|
| hotleathers-personalization.js | ~15 KB | JavaScript |
| hotleathers-personalization-abtest.js | ~20 KB | JavaScript |
| thank-you-page-upsell.liquid | ~8 KB | Liquid/JS |
| post-purchase-upsell.jsx | ~5 KB | React JSX |
| HOTLEATHERS_INSTALLATION.md | ~30 KB | Markdown |
| ABTEST_GUIDE.md | ~15 KB | Markdown |

All files are text-based and lightweight.

---

## Verifying Downloaded Files

After downloading, verify files are correct:

### Check File Contents

Open files in text editor and verify:

**hotleathers-personalization.js** should start with:
```javascript
/**
 * Hot Leathers Personalization Agent with RIDE5 Discount
 * Version: 1.0.0 - Customized for hotleathers.com
```

**hotleathers-personalization-abtest.js** should start with:
```javascript
/**
 * Hot Leathers Personalization Agent - A/B TEST VERSION
 * Version: 1.0.0-AB-TEST
```

### Check File Extensions

Make sure files have correct extensions:
- `.js` files → JavaScript
- `.liquid` files → Shopify Liquid
- `.jsx` files → React JSX
- `.md` files → Documentation (Markdown)

### Check for Corruption

If files won't upload to Shopify:
- Re-download using different method
- Check file isn't in wrong encoding
- Try opening in different text editor
- Make sure no extra characters added

---

## Alternative: Copy-Paste Method

If download isn't working, you can copy-paste:

1. **View the file** in git web interface
2. **Select all text** (Ctrl+A or Cmd+A)
3. **Copy** (Ctrl+C or Cmd+C)
4. **Create new file** in text editor
5. **Paste** content
6. **Save** with correct filename and extension

**Example:**
- Create new file: `hotleathers-personalization.js`
- Copy all code from git
- Paste into file
- Save

Make sure to use a plain text editor (VS Code, Sublime, Notepad++), not Word or rich text editor.

---

## Need Help?

### Files Won't Download:
- Try different browser
- Disable ad blockers
- Use different download method
- Contact git repository administrator

### Files Won't Open:
- Use plain text editor (VS Code, Notepad++, Sublime Text)
- Check file extensions are correct
- Make sure not corrupted during download

### Files Won't Upload to Shopify:
- Check file size < 20 MB (all files are tiny, so this shouldn't be issue)
- Verify file extension (.js for JavaScript)
- Try different browser
- Clear Shopify cache

---

## Ready to Install?

Once you have the files:

1. ✅ Read `HOTLEATHERS_INSTALLATION.md` first
2. ✅ If doing A/B test, also read `ABTEST_GUIDE.md`
3. ✅ Follow installation steps carefully
4. ✅ Test on duplicate theme first
5. ✅ Keep `HOTLEATHERS_QUICK_REFERENCE.md` handy for troubleshooting

---

**Total download size:** ~100 KB (all files)
**Estimated time:** 2-5 minutes to download all files
