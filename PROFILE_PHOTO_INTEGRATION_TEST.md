# Profile Photo Integration Test Guide

## Overview
This guide helps verify that profile photos are properly displayed across all member-related pages in the Settlio application.

## Prerequisites
1. Backend server running on port 5000
2. Frontend server running on port 3000
3. User account with uploaded profile photo
4. Group with multiple members (some with profile photos, some without)

## Test Scenarios

### 1. Header Avatar Display ✅
**Location**: Top navigation bar
**Expected**: Profile photo should display in header avatar
**Fallback**: User initial if no profile photo

### 2. Balance Page Member Avatars
**Location**: `/groups/{groupId}/balances`
**Components**: BalancesView
**Expected**:
- Member balance cards show profile photos where available
- Fallback to initials for members without photos
- Proper sizing and circular display

### 3. Group Balance Dashboard
**Location**: GroupDetails → Balances tab
**Components**: GroupBalances
**Expected**:
- Member balance cards display profile photos
- Simplified debt relationship avatars show profile photos
- Settlement history participant avatars show profile photos

### 4. Settlement Form
**Location**: Settlement modal in balance pages
**Components**: SettlementForm
**Expected**:
- Member info card shows profile photo
- Large avatar size for clear visibility

### 5. Group Members List
**Location**: GroupDetails → Overview tab → Members section
**Components**: GroupDetails
**Expected**:
- Large member avatars in member cards show profile photos
- Small avatars in expense form member selection show profile photos
- Admin/Member/Pending status preserved with photos

## Testing Steps

### Step 1: Verify Backend Data
1. Check MongoDB that users have `profilePhoto` field populated
2. Verify API responses include `profilePhoto` in user objects:
   - `/api/groups/{id}/balances` - should include `memberUser.profilePhoto`
   - `/api/groups/{id}/summary` - should include profile photos in member balances
   - `/api/groups/{id}` - should include profile photos in member user objects

### Step 2: Test Frontend Display
1. **Login with profile photo user**
2. **Navigate to group with mixed members (some with/without photos)**
3. **Check each component systematically**:

#### Balance View Test:
```
Navigate to: /groups/{groupId}/balances
✓ Member balance cards show profile photos
✓ "Settle Up" buttons functional
✓ Member names and balances display correctly
```

#### Group Balance Dashboard Test:
```
Navigate to: /groups/{groupId} → Balances tab
✓ Member balance cards show profile photos
✓ Simplified debts show profile photos for both participants
✓ Settlement history shows profile photos for payer and payee
✓ Tab switching works correctly
```

#### Settlement Form Test:
```
From balance page, click "Settle Up" on any member
✓ Modal opens with member profile photo
✓ Large avatar displays clearly
✓ Form submission works correctly
```

#### Group Members Test:
```
Navigate to: /groups/{groupId} → Overview tab
✓ Member cards show large profile photos
✓ Admin badges and status indicators work
✓ Quick expense form member selection shows small profile photos
```

## Expected Profile Photo URLs
- Format: `http://localhost:5000/uploads/profiles/profile-{userId}-{timestamp}.jpg`
- Size: 400x400 pixels
- Fallback: User initials in colored circle

## API Response Verification

### Balance API Response:
```javascript
{
  balances: [{
    memberEmail: "user@example.com",
    memberName: "User Name",
    memberUser: {
      _id: "userId",
      username: "username",
      email: "user@example.com",
      profilePhoto: "/uploads/profiles/profile-userId-timestamp.jpg" // ← Should be present
    },
    balanceAmount: 100.00,
    // ... other fields
  }]
}
```

### Group Summary Response:
```javascript
{
  memberBalances: [{
    user: {
      _id: "userId",
      username: "username", 
      email: "user@example.com",
      profilePhoto: "/uploads/profiles/profile-userId-timestamp.jpg" // ← Should be present
    },
    balance: 50.00,
    // ... other fields
  }],
  simplifiedDebts: [{
    from: {
      _id: "userId1",
      username: "user1",
      email: "user1@example.com",
      profilePhoto: "/uploads/profiles/profile-userId1-timestamp.jpg" // ← Should be present
    },
    to: {
      _id: "userId2", 
      username: "user2",
      email: "user2@example.com",
      profilePhoto: "/uploads/profiles/profile-userId2-timestamp.jpg" // ← Should be present
    }
    // ... other fields
  }]
}
```

## Troubleshooting

### Profile Photos Not Loading:
1. Check browser network tab for 404 errors on image URLs
2. Verify CORS headers allow image loading from backend
3. Check that profile photo files exist in `uploads/profiles/` directory
4. Verify API responses include `profilePhoto` field

### Avatars Showing Initials Instead:
1. Check that `profilePhoto` field is populated in API response
2. Verify `getAvatarProps` utility is being used correctly
3. Check browser console for JavaScript errors
4. Verify Avatar component is imported and used properly

### CSS Styling Issues:
1. Check that `ProfilePhotoAvatars.css` is imported
2. Verify CSS class names match component usage
3. Check for CSS specificity conflicts
4. Test responsive behavior on different screen sizes

## Files Modified for Profile Photo Integration:

### Backend:
- `src/controllers/balanceController.js` - Added `profilePhoto` to populate calls
- `src/controllers/groupController.js` - Added `profilePhoto` to populate calls  
- `src/controllers/expenseController.js` - Added `profilePhoto` to populate calls
- `src/controllers/newExpenseController.js` - Added `profilePhoto` to populate calls

### Frontend:
- `client/src/utils/profilePhotoUtils.ts` - New utility functions
- `client/src/services/balancesAPI.ts` - Updated interfaces to include profilePhoto
- `client/src/services/groupsAPI.ts` - Updated User interface
- `client/src/components/balances/BalancesView.tsx` - Integrated profile photos
- `client/src/components/balances/GroupBalances.tsx` - Integrated profile photos
- `client/src/components/balances/SettlementForm.tsx` - Integrated profile photos  
- `client/src/components/groups/GroupDetails.tsx` - Already had profile photo support
- `client/src/components/balances/ProfilePhotoAvatars.css` - New styling

## Success Criteria
✅ All member avatars show profile photos where available
✅ Fallback initials display for users without profile photos  
✅ Profile photos are properly sized and styled
✅ All existing functionality continues to work
✅ No console errors or broken images
✅ Responsive design maintained across devices