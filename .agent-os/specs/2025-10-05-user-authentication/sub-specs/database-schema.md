# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-10-05-user-authentication/spec.md

## Schema Changes

### User Profiles Table

Supabase Auth automatically creates an `auth.users` table for authentication data (email, password hash, etc.). We need to create a `public.profiles` table to store additional user metadata.

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'instructor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policy: Profiles are created on signup (handled by trigger)
CREATE POLICY "Profiles can be created during signup"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index on email for faster lookups
CREATE INDEX profiles_email_idx ON public.profiles(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

### Automatic Profile Creation Trigger

Create a trigger to automatically create a profile entry when a user signs up via Supabase Auth.

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Rationale

### Separate Profiles Table
- **Separation of Concerns**: Supabase Auth manages authentication data (`auth.users`), while we manage application-specific user data (`public.profiles`)
- **Security**: Keeps sensitive auth data isolated from application data
- **Flexibility**: Allows us to add custom fields without modifying auth schema
- **Row Level Security**: Enables fine-grained access control via Postgres RLS policies

### Row Level Security Policies
- **Data Protection**: Ensures users can only access their own profile data
- **Zero Trust**: Security enforced at database level, not just application level
- **Future-Proof**: When team features are added, we can extend policies for shared access

### Automatic Profile Creation
- **User Experience**: Seamless profile creation during signup without extra steps
- **Data Integrity**: Guarantees every auth user has a corresponding profile
- **Metadata Storage**: Uses Supabase's `raw_user_meta_data` to pass signup form data to trigger

### Role Check Constraint
- **Data Integrity**: Ensures only valid roles ('student', 'instructor') are stored
- **Database-Level Validation**: Prevents invalid data even if application validation fails
- **Future Extensibility**: Easy to add more roles by modifying CHECK constraint

### Indexes
- **Performance**: Email index enables fast lookups when querying by email
- **Common Queries**: Optimizes profile retrieval and uniqueness checks

### Updated_at Trigger
- **Audit Trail**: Automatically tracks when profiles are modified
- **No Manual Updates**: Eliminates developer error of forgetting to update timestamp
- **Consistency**: Ensures all records have accurate modification times
