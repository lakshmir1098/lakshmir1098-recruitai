-- Drop existing permissive policies
DROP POLICY IF EXISTS "Public read access for candidates" ON public.candidates;
DROP POLICY IF EXISTS "Public insert access for candidates" ON public.candidates;
DROP POLICY IF EXISTS "Public update access for candidates" ON public.candidates;
DROP POLICY IF EXISTS "Public delete access for candidates" ON public.candidates;
DROP POLICY IF EXISTS "Public read access for actions" ON public.candidate_actions;
DROP POLICY IF EXISTS "Public insert access for actions" ON public.candidate_actions;

-- Create secure RLS policies for authenticated users only
CREATE POLICY "Authenticated users can read candidates"
ON public.candidates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert candidates"
ON public.candidates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates"
ON public.candidates FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete candidates"
ON public.candidates FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can read actions"
ON public.candidate_actions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert actions"
ON public.candidate_actions FOR INSERT
TO authenticated
WITH CHECK (true);