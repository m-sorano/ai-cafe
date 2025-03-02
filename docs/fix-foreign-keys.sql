-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE IF EXISTS comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE IF EXISTS reactions DROP CONSTRAINT IF EXISTS reactions_user_id_fkey;

-- Add proper foreign key constraints with explicit names
ALTER TABLE posts 
  ADD CONSTRAINT posts_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE comments 
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE reactions 
  ADD CONSTRAINT reactions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Create a trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    new.id, 
    coalesce(new.raw_user_meta_data->>'name', new.email), 
    coalesce(new.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=' || new.email || '&background=random')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Refresh the schema cache to make sure Supabase recognizes the new relationships
SELECT pg_notify('pgrst', 'reload schema');
