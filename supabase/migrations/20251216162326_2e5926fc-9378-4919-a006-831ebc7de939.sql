-- Drop existing overly permissive policies on candidates table
DROP POLICY IF EXISTS "Authenticated users can delete candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can read candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON public.candidates;

-- Create proper policies that actually require authentication
CREATE POLICY "Authenticated users can read candidates"
ON public.candidates
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert candidates"
ON public.candidates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update candidates"
ON public.candidates
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete candidates"
ON public.candidates
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Also fix candidate_actions table policies
DROP POLICY IF EXISTS "Authenticated users can insert actions" ON public.candidate_actions;
DROP POLICY IF EXISTS "Authenticated users can read actions" ON public.candidate_actions;

CREATE POLICY "Authenticated users can read actions"
ON public.candidate_actions
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert actions"
ON public.candidate_actions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);