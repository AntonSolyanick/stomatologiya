CREATE OR REPLACE FUNCTION public.claim_my_appointments()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_email text; v_n int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 0; END IF;
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RETURN 0; END IF;
  UPDATE public.appointments SET user_id = auth.uid()
  WHERE user_id IS NULL AND lower(patient_email) = v_email;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END; $$;
REVOKE ALL ON FUNCTION public.claim_my_appointments() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_my_appointments() TO authenticated;

CREATE OR REPLACE FUNCTION public.book_appointment(p_doctor_id uuid, p_service_id uuid, p_date date, p_time time without time zone, p_name text, p_email text, p_phone text, p_birthdate date DEFAULT NULL::date, p_patient_id uuid DEFAULT NULL::uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
  v_is_doctor boolean := (public.current_doctor_id() IS NOT NULL AND public.current_doctor_id() = p_doctor_id);
  v_user uuid;
  v_active int;
  v_limit int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.doctors WHERE id = p_doctor_id AND is_active) THEN
    RAISE EXCEPTION 'Врач недоступен для записи';
  END IF;
  IF p_date < current_date THEN RAISE EXCEPTION 'Нельзя записаться на прошедшую дату'; END IF;
  IF extract(dow from p_date) = 0 THEN RAISE EXCEPTION 'Воскресенье — выходной день'; END IF;
  IF p_time < time '09:00' OR p_time > time '18:00' THEN RAISE EXCEPTION 'Выбранное время вне рабочих часов'; END IF;
  IF coalesce(trim(p_name), '') = '' OR coalesce(trim(p_email), '') = '' THEN RAISE EXCEPTION 'Укажите имя и email'; END IF;

  v_user := CASE WHEN v_is_doctor THEN p_patient_id ELSE auth.uid() END;

  IF NOT v_is_doctor THEN
    v_limit := CASE WHEN auth.uid() IS NULL THEN 1 ELSE 2 END;
    SELECT count(*) INTO v_active FROM public.appointments a
    WHERE a.status = 'confirmed' AND a.appointment_date >= current_date
      AND ((v_user IS NOT NULL AND a.user_id = v_user)
           OR a.patient_email = lower(trim(p_email))
           OR (coalesce(trim(p_phone), '') <> '' AND a.patient_phone = trim(p_phone)));
    IF v_active >= v_limit THEN
      IF v_limit = 1 THEN
        RAISE EXCEPTION 'Без регистрации можно иметь только 1 активную запись. Войдите или зарегистрируйтесь, чтобы записаться ещё';
      ELSE
        RAISE EXCEPTION 'У вас уже 2 активные записи. Отмените одну из них, чтобы записаться снова';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.appointments (user_id, created_by, doctor_id, patient_name, patient_email, patient_phone,
    patient_birthdate, service_id, appointment_date, appointment_time)
  VALUES (v_user, auth.uid(), p_doctor_id, trim(p_name), lower(trim(p_email)), trim(coalesce(p_phone,'')),
    p_birthdate, p_service_id, p_date, p_time)
  RETURNING id INTO v_id;
  RETURN v_id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Этот слот уже занят, выберите другое время' USING ERRCODE = '23505';
END;
$function$;