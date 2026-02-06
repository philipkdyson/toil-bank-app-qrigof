# TOIL Bank

A Time Off In Lieu (TOIL) tracking app with manager approval workflow.

## Features

- ✅ Track TOIL time (ADD/TAKE)
- ✅ Manager approval system for TOIL requests
- ✅ Real-time balance calculation (only approved events count)
- ✅ Role-based access control (User/Manager)
- ✅ Speech-to-text for notes
- ✅ Offline-first with backend sync
- ✅ Cross-platform (iOS, Android, Web)

## Backend Integration Status

✅ **COMPLETE** - All backend endpoints are integrated:

### Implemented Endpoints

1. **GET /api/user/role** - Get current user's role
   - Returns: `{ role: 'user' | 'manager' }`
   - Used in: Profile screen, Approvals screen

2. **GET /api/toil/events/pending** - Get pending TOIL events (manager only)
   - Returns: Array of pending events with user details
   - Used in: Approvals screen

3. **PUT /api/toil/events/:id/approve** - Approve a TOIL event (manager only)
   - Sets status to 'APPROVED'
   - Used in: Approvals screen

4. **PUT /api/toil/events/:id/reject** - Reject a TOIL event (manager only)
   - Sets status to 'REJECTED'
   - Used in: Approvals screen

5. **GET /api/toil/events** - Get all TOIL events for user
   - Returns: Array of events with status field
   - Used in: History screen, useToilData hook

6. **POST /api/toil/events** - Create new TOIL event
   - Creates event with status 'PENDING'
   - Used in: Home screen (logging)

7. **GET /api/toil/balance** - Get TOIL balance
   - Only counts APPROVED events
   - Used in: useToilData hook

## Testing the Manager Approval System

### Prerequisites

1. **Backend URL**: Already configured in `app.json`
   ```
   https://gbdn4gw2tf38dxa995db3qban2afxa7x.app.specular.dev
   ```

2. **Authentication**: The app uses Better Auth with email/password + OAuth

### Test Scenarios

#### Scenario 1: Regular User Flow

1. **Sign Up / Sign In**
   - Create a new account or sign in
   - Default role: `user`

2. **Add TOIL Time**
   - Go to Home tab
   - Select ADD or TAKE
   - Choose time amount (15m, 30m, 45m, 1h, etc.)
   - Add optional note (use microphone for speech-to-text)
   - Tap "ADD [time]" button
   - Event is created with status: `PENDING`

3. **View History**
   - Go to History tab
   - See all your TOIL events
   - Notice status badges: PENDING (clock icon), APPROVED (checkmark), REJECTED (X)
   - Balance only counts APPROVED events

4. **Check Approvals Tab**
   - Go to Approvals tab
   - See "Manager Access Only" message
   - Regular users cannot approve events

5. **View Profile**
   - Go to Profile tab
   - See role: "Team Member"
   - No manager permissions note

#### Scenario 2: Manager Flow

**Note**: To test manager functionality, you need to promote a user to manager role. This requires:
- Direct database access, OR
- A manager user already exists, OR
- Use the PUT /api/user/role endpoint (if you have admin access)

1. **Promote User to Manager** (Database)
   ```sql
   UPDATE user SET role = 'manager' WHERE email = 'manager@example.com';
   ```

2. **Sign In as Manager**
   - Sign in with manager account
   - Go to Profile tab
   - See role: "Manager"
   - See green badge: "You have manager permissions to approve TOIL requests"

3. **View Pending Approvals**
   - Go to Approvals tab
   - See list of pending TOIL requests from all users
   - Each request shows:
     - Time amount (+30m, -1h, etc.)
     - User name and email
     - Optional note
     - Approve/Reject buttons

4. **Approve a Request**
   - Tap "Approve" button on a pending event
   - Event is removed from pending list
   - User's balance is updated (if they refresh)
   - Event status changes to APPROVED

5. **Reject a Request**
   - Tap "Reject" button on a pending event
   - Event is removed from pending list
   - User's balance is NOT affected
   - Event status changes to REJECTED

#### Scenario 3: Balance Calculation

1. **Create Multiple Events**
   - User creates: +2h (PENDING)
   - User creates: +1h (PENDING)
   - User creates: -30m (PENDING)
   - **Balance shows: 0** (no approved events yet)

2. **Manager Approves First Event**
   - Manager approves +2h
   - **User's balance: 2h**

3. **Manager Approves Second Event**
   - Manager approves +1h
   - **User's balance: 3h**

4. **Manager Rejects Third Event**
   - Manager rejects -30m
   - **User's balance: 3h** (rejected events don't count)

5. **Manager Approves Third Event** (if re-created)
   - User creates new -30m event
   - Manager approves it
   - **User's balance: 2h 30m**

### Testing Checklist

- [ ] User can sign up/sign in
- [ ] User can create ADD events (status: PENDING)
- [ ] User can create TAKE events (status: PENDING)
- [ ] User can view history with status badges
- [ ] User balance only counts APPROVED events
- [ ] Regular user sees "Manager Access Only" in Approvals tab
- [ ] Manager can view pending events from all users
- [ ] Manager can approve events
- [ ] Manager can reject events
- [ ] Approved events update user balance
- [ ] Rejected events do NOT update user balance
- [ ] Profile shows correct role (User/Manager)
- [ ] Speech-to-text works for notes
- [ ] Offline mode works (local storage)
- [ ] Backend sync works when online

### Known Limitations

1. **No Manager Promotion UI**: Currently, users must be promoted to manager via database or API
2. **No Event Editing After Approval**: Once approved/rejected, events cannot be edited
3. **No Approval Notifications**: Users are not notified when their events are approved/rejected

### Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

### Backend Configuration

The backend URL is configured in `app.json`:

```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://gbdn4gw2tf38dxa995db3qban2afxa7x.app.specular.dev"
    }
  }
}
```

**IMPORTANT**: Never hardcode the backend URL in code. Always use:

```typescript
import Constants from 'expo-constants';
const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl;
```

### Architecture

- **Frontend**: React Native + Expo 54
- **Backend**: Fastify + Better Auth + Drizzle ORM
- **Database**: PostgreSQL
- **Authentication**: Email/Password + Google OAuth + Apple OAuth
- **State Management**: React Context + AsyncStorage
- **API Client**: Custom wrapper in `utils/api.ts`

### File Structure

```
app/
├── (tabs)/
│   ├── (home)/
│   │   └── index.tsx          # TOIL logging screen
│   ├── approvals.tsx           # Manager approval screen
│   ├── history.tsx             # TOIL history screen
│   └── profile.tsx             # User profile screen
├── auth.tsx                    # Authentication screen
├── auth-popup.tsx              # OAuth popup (web)
├── auth-callback.tsx           # OAuth callback handler
└── _layout.tsx                 # Root layout with navigation

contexts/
├── AuthContext.tsx             # Authentication state
├── OnboardingContext.tsx       # Onboarding state
└── WidgetContext.tsx           # Widget state

hooks/
└── useToilData.ts              # TOIL data management hook

utils/
└── api.ts                      # API client wrapper

types/
└── toil.ts                     # TypeScript types
```

---

This app was built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

Made with 💙 for creativity.
