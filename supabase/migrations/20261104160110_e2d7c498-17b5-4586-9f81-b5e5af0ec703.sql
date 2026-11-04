ALTER TABLE public.services ALTER COLUMN price DROP NOT NULL;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
CREATE POLICY services_admin_insert ON public.services FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY services_admin_update ON public.services FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY services_admin_delete ON public.services FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
UPDATE public.services SET is_active = false;
INSERT INTO public.services (name, description, price, category, sort_order) VALUES
 ('Реставрация зуба', '', NULL, 'Общее', 1),
 ('Металлокерамическая коронка', '', NULL, 'Общее', 2),
 ('Удаление зуба', '', NULL, 'Общее', 3),
 ('Протезы (акрил/дефлекс)', '', NULL, 'Общее', 4);