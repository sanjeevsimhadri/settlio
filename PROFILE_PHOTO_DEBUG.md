# Profile Photo Debug Guide

## Quick Test Steps

### 1. Check Profile Photo Upload
1. Navigate to Profile Settings
2. Upload a profile photo
3. Verify it shows in the header avatar

### 2. Test Member Cards (Groups Page)
1. Go to a group details page
2. Look at the "Members" section
3. **Expected**: Profile photos should show in large circular avatars
4. **Fallback**: If no photo, should show first letter of username

### 3. Test Balance Page
1. Go to group → Balances tab or direct balance page
2. Look at member balance cards
3. **Expected**: Profile photos should appear next to member names
4. **Fallback**: If no photo, should show first letter of member name

### 4. Test Settlement Form
1. From balance page, click "Settle Up" on any member
2. Look at the member info card in the modal
3. **Expected**: Large profile photo should be displayed
4. **Fallback**: If no photo, should show first letter in gray circle

## Debug Console Commands

Open browser dev tools (F12) and run these in the Console tab:

### Check if profile photos are being received from API:
```javascript
// Check current user data
console.log('Current user:', JSON.parse(localStorage.getItem('user') || '{}'));

// Check API response for groups (replace GROUP_ID)
fetch('http://localhost:5000/api/groups/YOUR_GROUP_ID', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(data => {
  console.log('Group data:', data);
  console.log('Members with photos:', data.data.members.map(m => ({
    email: m.email,
    username: m.userId?.username,
    hasPhoto: !!m.userId?.profilePhoto,
    photoPath: m.userId?.profilePhoto
  })));
});

// Check balance API response (replace GROUP_ID)
fetch('http://localhost:5000/api/groups/YOUR_GROUP_ID/balances', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(data => {
  console.log('Balance data:', data);
  console.log('Members with photos in balances:', data.data.balances.map(b => ({
    name: b.memberName,
    email: b.memberEmail,
    hasPhoto: !!b.memberUser?.profilePhoto,
    photoPath: b.memberUser?.profilePhoto
  })));
});
```

### Check if images are loading correctly:
```javascript
// Test profile photo URL loading
const testProfilePhotoUrl = 'http://localhost:5000/uploads/profiles/SOME_PHOTO_PATH.jpg';
const img = new Image();
img.onload = () => console.log('✅ Profile photo loaded successfully');
img.onerror = () => console.log('❌ Profile photo failed to load');
img.src = testProfilePhotoUrl;
```

## Common Issues & Solutions

### Issue 1: Profile Photos Not Showing
**Symptoms**: Only initials show, never profile photos
**Check**:
1. Open Network tab in dev tools
2. Look for 404 errors on image requests
3. Verify API responses include `profilePhoto` field

**Solutions**:
- Restart backend server
- Check CORS configuration
- Verify profile photo files exist in `uploads/profiles/` folder

### Issue 2: Mixed Results (Some Show, Some Don't)
**Symptoms**: Some members show photos, others show initials
**This is normal**: Members without uploaded photos will show initials

### Issue 3: Images Load But Don't Display
**Symptoms**: Network tab shows 200 OK for images, but still showing initials
**Check**:
1. Open Elements tab in dev tools
2. Look for avatar containers
3. Check if img elements are present but hidden

## Manual Verification Steps

### Step 1: Verify Backend Data
```bash
# Connect to MongoDB and check user data
# Look for users with profilePhoto field populated
```

### Step 2: Check File System
```bash
# Check if profile photos exist on disk
dir "C:\Users\ssimhadri\settlio\uploads\profiles"
# Should show .jpg files like: profile-userId-timestamp.jpg
```

### Step 3: Test Direct Image URL
Open in browser: `http://localhost:5000/uploads/profiles/FILENAME.jpg`
Should display the image directly.

### Step 4: Component-by-Component Test

#### GroupDetails Member Cards:
- Location: Group page → Overview tab → Members section
- Look for: Large circular avatars with profile photos
- Element to inspect: `.member-avatar-large img`

#### BalancesView Member List:
- Location: Group page → Balances (separate page)
- Look for: Medium circular avatars next to member names
- Element to inspect: `.member-avatar img`

#### GroupBalances Dashboard:
- Location: Group page → Balances tab
- Look for: Multiple avatar locations:
  - Member balance cards: `.member-avatar-inner img`
  - Debt relationships: `.participant-avatar img`
  - Settlement history: `.participant-avatar img`

#### SettlementForm Modal:
- Location: Balance page → Click "Settle Up"
- Look for: Large avatar in member info card
- Element to inspect: Modal with 80px × 80px avatar

## Expected HTML Structure

### Working Profile Photo:
```html
<div class="member-avatar-large">
  <img src="http://localhost:5000/uploads/profiles/profile-123-456.jpg" 
       alt="Username" 
       style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
  <div class="avatar-fallback" style="display: none;">U</div>
</div>
```

### Fallback (No Photo):
```html
<div class="member-avatar-large">
  <div class="avatar-fallback" style="display: flex; ...">U</div>
</div>
```

## Troubleshooting Commands

### Clear Browser Cache:
```javascript
// Clear localStorage and reload
localStorage.clear();
location.reload();
```

### Force Refresh Profile Data:
```javascript
// Re-fetch current user profile
fetch('http://localhost:5000/api/auth/me', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
.then(r => r.json())
.then(data => {
  console.log('Current user profile:', data);
  localStorage.setItem('user', JSON.stringify(data.data));
});
```

## Success Indicators
✅ **Profile photos appear in member cards**
✅ **Fallback initials show when no photo available** 
✅ **No 404 errors in network tab**
✅ **Image onError handlers work correctly**
✅ **All existing functionality still works**

If you're still seeing issues, please share:
1. Console error messages
2. Network tab showing image request status
3. Specific page where photos aren't showing