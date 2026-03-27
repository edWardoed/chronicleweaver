

## Plan: Clear Authentication Data for Fresh Admin Setup

### What will happen
Delete all user-related data from the database so the next person to sign up becomes the new admin (via the existing `handle_new_user` trigger that assigns admin to the first user).

### Steps

1. **Delete dependent data first** (respecting foreign key constraints):
   - `adventure_access` — remove all user-adventure assignments
   - `entry_characters`, `entry_locations` — remove entry links
   - `entries`, `characters`, `locations` — remove adventure content
   - `adventures` — remove all adventures

2. **Delete auth-related public tables**:
   - `user_roles` — clear all role assignments
   - `profiles` — clear all profiles

3. **Delete auth.users** via direct database query to fully remove authentication records

After this, the database will be completely fresh. The first user to sign up will automatically receive the **admin** role.

### Technical details
- Uses direct `DELETE` SQL statements executed in dependency order
- The `handle_new_user` trigger on `auth.users` ensures the first new signup gets the admin role automatically

