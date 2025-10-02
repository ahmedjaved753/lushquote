# 🚨 REVERT HACK MODE - Template Limits

## Quick Revert Instructions

To **disable hack mode** and restore original template limits, change this line in **ALL** these files:

```javascript
const BYPASS_TEMPLATE_LIMITS = true; // ← Change to false
```

**Files to modify:**

1. `/src/pages/TemplateBuilder.jsx` - Line 6
2. `/src/pages/Layout.jsx` - Line 8
3. `/src/pages/Dashboard.jsx` - Line 6

## Or Use Find & Replace

**Find:** `const BYPASS_TEMPLATE_LIMITS = true;`  
**Replace:** `const BYPASS_TEMPLATE_LIMITS = false;`

## What This Hack Does

When `BYPASS_TEMPLATE_LIMITS = true`:

- ✅ Free users can create unlimited templates
- ✅ Navigation to template builder always works
- ✅ Template save operation never blocks
- ✅ Dashboard shows "Create Template" button always enabled

## Production Warning ⚠️

**NEVER deploy with hack mode enabled!**
Make sure to revert before any production deployment.

## Quick Test

After reverting, try creating a 2nd template as a free user - you should see the upgrade dialog again.

