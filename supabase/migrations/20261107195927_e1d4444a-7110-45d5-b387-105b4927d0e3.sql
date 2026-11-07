CREATE OR REPLACE FUNCTION public.current_doctor_id()
 RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT coalesce(
    (SELECT d.id FROM public.doctors d WHERE d.user_id = auth.uid() AND public.has_role(auth.uid(), 'doctor') LIMIT 1),
    (SELECT d.id FROM public.doctors d WHERE public.has_role(auth.uid(), 'admin') AND d.is_active ORDER BY d.sort_order, d.created_at LIMIT 1)
  )
$$;

CREATE POLICY doctors_admin_update ON public.doctors FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));