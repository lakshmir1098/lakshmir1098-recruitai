-- Add user_id column to candidates table
ALTER TABLE public.candidates ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing candidates to have null user_id (they'll need to be re-screened or manually assigned)
-- New candidates will automatically get the user_id set

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Authenticated users can delete candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can read candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON public.candidates;

-- Create new RLS policies that restrict access to user's own candidates
CREATE POLICY "Users can read their own candidates"
ON public.candidates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own candidates"
ON public.candidates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own candidates"
ON public.candidates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own candidates"
ON public.candidates
FOR DELETE
USING (auth.uid() = user_id);

-- Also update candidate_actions to be user-isolated
ALTER TABLE public.candidate_actions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Authenticated users can insert actions" ON public.candidate_actions;
DROP POLICY IF EXISTS "Authenticated users can read actions" ON public.candidate_actions;

CREATE POLICY "Users can read their own actions"
ON public.candidate_actions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own actions"
ON public.candidate_actions
FOR INSERT
WITH CHECK (auth.uid() = user_id);