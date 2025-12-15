-- Drop existing RLS policies and recreate with public access
-- (since this is an internal recruitment tool)

DROP POLICY IF EXISTS "Authenticated users can view candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can insert candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can delete candidates" ON public.candidates;

DROP POLICY IF EXISTS "Authenticated users can view actions" ON public.candidate_actions;
DROP POLICY IF EXISTS "Authenticated users can insert actions" ON public.candidate_actions;

-- Create new policies with public access
CREATE POLICY "Public read access for candidates" 
ON public.candidates 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for candidates" 
ON public.candidates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access for candidates" 
ON public.candidates 
FOR UPDATE 
USING (true);

CREATE POLICY "Public delete access for candidates" 
ON public.candidates 
FOR DELETE 
USING (true);

CREATE POLICY "Public read access for actions" 
ON public.candidate_actions 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for actions" 
ON public.candidate_actions 
FOR INSERT 
WITH CHECK (true);