CREATE TABLE public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  legal_first_name text NOT NULL,
  legal_last_name text NOT NULL,
  date_of_birth date NOT NULL,
  nationality text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  id_document_type text NOT NULL CHECK (id_document_type IN ('passport','drivers_license','national_id')),
  id_document_number text NOT NULL,
  id_front_path text NOT NULL,
  id_back_path text,
  proof_of_address_path text NOT NULL,
  selfie_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.kyc_submissions TO authenticated;
GRANT ALL ON public.kyc_submissions TO service_role;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own KYC, admins view all" ON public.kyc_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Users submit own KYC as pending" ON public.kyc_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.kyc_submissions k WHERE k.user_id = auth.uid() AND k.status IN ('pending','approved')));
CREATE INDEX kyc_submissions_user_idx ON public.kyc_submissions(user_id, created_at DESC);
CREATE TRIGGER update_kyc_submissions_updated_at BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Mark profile as pending when a submission is made
CREATE OR REPLACE FUNCTION public.kyc_on_submit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM set_config('arigi.kyc_bypass', 'on', true);
  UPDATE public.profiles SET verification_status = 'pending' WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_kyc_on_submit AFTER INSERT ON public.kyc_submissions FOR EACH ROW EXECUTE FUNCTION public.kyc_on_submit();

-- Admin review
CREATE OR REPLACE FUNCTION public.review_kyc_submission(_submission_id uuid, _approve boolean, _notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only administrators can review KYC submissions'; END IF;
  UPDATE public.kyc_submissions
    SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
        reviewer_notes = _notes, reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = _submission_id AND status = 'pending'
    RETURNING user_id INTO _uid;
  IF _uid IS NULL THEN RAISE EXCEPTION 'Submission not found or already reviewed'; END IF;
  PERFORM set_config('arigi.kyc_bypass', 'on', true);
  UPDATE public.profiles SET verification_status = CASE WHEN _approve THEN 'verified' ELSE 'rejected' END WHERE id = _uid;
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (_uid, 'kyc', CASE WHEN _approve THEN 'Identity verified' ELSE 'Verification needs attention' END,
          CASE WHEN _approve THEN 'Your identity has been verified. Wallet payments are now unlocked.'
               ELSE 'Your verification was not approved. ' || COALESCE(_notes, 'Please resubmit your documents.') END,
          '/consumer-journey');
END; $$;
REVOKE EXECUTE ON FUNCTION public.review_kyc_submission(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_kyc_submission(uuid, boolean, text) TO authenticated;

-- Stop users from self-verifying via profile updates
CREATE OR REPLACE FUNCTION public.protect_verification_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND current_setting('arigi.kyc_bypass', true) IS DISTINCT FROM 'on'
     AND auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    NEW.verification_status := OLD.verification_status;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_protect_verification_status BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_verification_status();

-- Storage: users upload/read in their own folder, admins read all
CREATE POLICY "KYC upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "KYC read own or admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));