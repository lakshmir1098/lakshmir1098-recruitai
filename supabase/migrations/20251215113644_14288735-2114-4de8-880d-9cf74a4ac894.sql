-- Create candidates table to store all candidate data
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  fit_score INTEGER NOT NULL,
  fit_category TEXT NOT NULL CHECK (fit_category IN ('Strong', 'Medium', 'Low')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Invited', 'Rejected', 'Review')),
  screening_summary TEXT,
  strengths TEXT[],
  gaps TEXT[],
  recommended_action TEXT,
  action_comment TEXT,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_info TEXT,
  resume_text TEXT,
  resume_file_path TEXT,
  job_description TEXT,
  screened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_candidates_email ON public.candidates(email);
CREATE INDEX idx_candidates_status ON public.candidates(status);
CREATE INDEX idx_candidates_screened_at ON public.candidates(screened_at DESC);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- For now, allow all authenticated users to manage candidates (recruiter app)
CREATE POLICY "Authenticated users can view candidates" 
ON public.candidates 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert candidates" 
ON public.candidates 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update candidates" 
ON public.candidates 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete candidates" 
ON public.candidates 
FOR DELETE 
TO authenticated
USING (true);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Storage policies for resumes bucket
CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can view resumes"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can delete resumes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'resumes');

-- Create candidate_actions table to log all actions (audit trail)
CREATE TABLE public.candidate_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('screened', 'invited', 'rejected', 'reviewed', 'status_changed')),
  comment TEXT,
  previous_status TEXT,
  new_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on actions
ALTER TABLE public.candidate_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view actions" 
ON public.candidate_actions 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert actions" 
ON public.candidate_actions 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();