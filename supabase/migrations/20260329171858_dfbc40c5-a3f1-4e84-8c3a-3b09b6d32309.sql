
-- Fix: Allow service_role to insert into tables blocked by security hardening

-- blockchain_logs: edge functions insert via service_role
DROP POLICY IF EXISTS "System can insert blockchain logs" ON public.blockchain_logs;
CREATE POLICY "service_role_insert_blockchain_logs"
  ON public.blockchain_logs FOR INSERT TO service_role
  WITH CHECK (true);

-- notifications: edge functions insert via service_role
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "service_role_insert_notifications"
  ON public.notifications FOR INSERT TO service_role
  WITH CHECK (true);

-- payouts: edge functions insert via service_role
DROP POLICY IF EXISTS "System can create payouts for transactions" ON public.payouts;
CREATE POLICY "service_role_insert_payouts"
  ON public.payouts FOR INSERT TO service_role
  WITH CHECK (true);
