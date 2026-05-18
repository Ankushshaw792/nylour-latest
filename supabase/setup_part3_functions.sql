-- =============================================
-- PART 3: FUNCTIONS, TRIGGERS & AUTH TRIGGERS
-- =============================================

-- Auth trigger functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->>'first_name',''), COALESCE(NEW.raw_user_meta_data ->>'last_name',''))
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer'::user_role) ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Error in handle_new_user: %', SQLERRM; RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_customer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.customers (user_id, first_name, last_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->>'first_name', NEW.raw_user_meta_data ->>'last_name', NEW.email);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_salon_owner_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.salon_owners (user_id, first_name, last_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->>'first_name',''), COALESCE(NEW.raw_user_meta_data ->>'last_name',''))
  ON CONFLICT (user_id) DO NOTHING;
  IF NEW.raw_user_meta_data ->>'user_type' = 'salon_owner' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'salon_owner'::user_role) ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'Error in handle_salon_owner_signup: %', SQLERRM; RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER on_auth_user_created_customer AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_customer();

-- Salon activity trigger
CREATE OR REPLACE FUNCTION update_salon_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN UPDATE public.salons SET last_activity = now() WHERE id = NEW.salon_id; RETURN NEW; END;
$$;
CREATE TRIGGER update_salon_activity_on_booking AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_salon_activity();

-- Booking status change handler
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id) VALUES (
      NEW.customer_id,
      CASE NEW.status WHEN 'confirmed' THEN 'Booking Confirmed!' WHEN 'rejected' THEN 'Booking Declined' WHEN 'in_progress' THEN 'Your Service Has Started' WHEN 'completed' THEN 'Service Completed' WHEN 'cancelled' THEN 'Booking Cancelled' ELSE 'Booking Status Updated' END,
      CASE NEW.status WHEN 'confirmed' THEN 'Your booking has been confirmed by the salon.' WHEN 'rejected' THEN 'Sorry, your booking could not be confirmed.' WHEN 'in_progress' THEN 'Your service is now in progress.' WHEN 'completed' THEN 'Thank you for your visit!' WHEN 'cancelled' THEN 'Your booking has been cancelled.' ELSE 'Your booking status has been updated to: ' || NEW.status END,
      CASE NEW.status WHEN 'confirmed' THEN 'booking_confirmation'::notification_type ELSE 'general'::notification_type END,
      NEW.id
    );
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
      UPDATE public.bookings SET queue_position = (SELECT COALESCE(MAX(queue_position), 0) + 1 FROM public.bookings WHERE salon_id = NEW.salon_id AND status IN ('confirmed', 'in_progress') AND booking_date = NEW.booking_date) WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;
CREATE TRIGGER on_booking_status_change AFTER UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION handle_booking_status_change();

-- Queue sync on booking status
CREATE OR REPLACE FUNCTION public.sync_queue_status_on_booking_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    UPDATE public.queue_entries SET status = 'in_service', service_start_time = NOW(), updated_at = NOW() WHERE booking_id = NEW.id AND status = 'waiting';
  END IF;
  IF NEW.status IN ('completed', 'cancelled', 'rejected') AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'cancelled', 'rejected')) THEN
    UPDATE public.queue_entries SET status = 'completed', service_end_time = NOW(), updated_at = NOW() WHERE booking_id = NEW.id AND status IN ('waiting', 'in_service');
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_sync_queue_on_booking_status ON public.bookings;
CREATE TRIGGER trigger_sync_queue_on_booking_status AFTER UPDATE OF status ON public.bookings FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION public.sync_queue_status_on_booking_change();

-- Queue entry creation on booking confirm
CREATE OR REPLACE FUNCTION public.create_queue_entry_on_booking_confirm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE next_position INTEGER;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    IF NEW.customer_id IS NOT NULL AND NEW.arrival_deadline IS NULL THEN NEW.arrival_deadline := NOW() + INTERVAL '10 minutes'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.queue_entries WHERE booking_id = NEW.id) THEN
      SELECT COALESCE(MAX(position), 0) + 1 INTO next_position FROM public.queue_entries WHERE salon_id = NEW.salon_id AND status IN ('waiting', 'called', 'in_service');
      INSERT INTO public.queue_entries (booking_id, salon_id, customer_id, position, status, estimated_wait_time, check_in_time)
      VALUES (NEW.id, NEW.salon_id, NEW.customer_id, next_position, 'waiting', next_position * COALESCE((SELECT avg_service_time FROM public.salons WHERE id = NEW.salon_id), 20), now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_create_queue_on_booking_confirm ON public.bookings;
CREATE TRIGGER trigger_create_queue_on_booking_confirm BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.create_queue_entry_on_booking_confirm();

CREATE OR REPLACE FUNCTION public.create_queue_entry_on_booking_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE next_position INTEGER;
BEGIN
  IF NEW.status = 'confirmed' THEN
    IF NEW.customer_id IS NOT NULL AND NEW.arrival_deadline IS NULL THEN
      UPDATE public.bookings SET arrival_deadline = NOW() + INTERVAL '10 minutes' WHERE id = NEW.id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.queue_entries WHERE booking_id = NEW.id) THEN
      SELECT COALESCE(MAX(position), 0) + 1 INTO next_position FROM public.queue_entries WHERE salon_id = NEW.salon_id AND status IN ('waiting', 'called', 'in_service');
      INSERT INTO public.queue_entries (booking_id, salon_id, customer_id, position, status, estimated_wait_time, check_in_time)
      VALUES (NEW.id, NEW.salon_id, NEW.customer_id, next_position, 'waiting', next_position * COALESCE((SELECT avg_service_time FROM public.salons WHERE id = NEW.salon_id), 20), now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_create_queue_on_booking_insert ON public.bookings;
CREATE TRIGGER trigger_create_queue_on_booking_insert AFTER INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.create_queue_entry_on_booking_insert();

-- Prevent multiple active bookings
CREATE OR REPLACE FUNCTION public.prevent_multiple_active_bookings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.bookings WHERE customer_id = NEW.customer_id AND status IN ('pending', 'confirmed', 'in_progress') AND booking_date >= CURRENT_DATE AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      RAISE EXCEPTION 'You already have an active booking.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER enforce_single_active_booking BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.prevent_multiple_active_bookings();

-- Queue position recalculation
CREATE OR REPLACE FUNCTION public.recalculate_queue_positions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  WITH ranked_entries AS (SELECT id, ROW_NUMBER() OVER (ORDER BY check_in_time ASC) as new_position FROM public.queue_entries WHERE salon_id = COALESCE(NEW.salon_id, OLD.salon_id) AND status IN ('waiting', 'called', 'in_service'))
  UPDATE public.queue_entries qe SET position = re.new_position, estimated_wait_time = (re.new_position - 1) * COALESCE((SELECT avg_service_time FROM public.salons WHERE id = qe.salon_id), 30), updated_at = NOW() FROM ranked_entries re WHERE qe.id = re.id;
  RETURN COALESCE(NEW, OLD);
END;
$$;
DROP TRIGGER IF EXISTS trigger_recalculate_positions ON public.queue_entries;
CREATE TRIGGER trigger_recalculate_positions AFTER UPDATE OF status ON public.queue_entries FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status) EXECUTE FUNCTION public.recalculate_queue_positions();

-- Queue expiration trigger
CREATE OR REPLACE FUNCTION public.set_queue_expiration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN NEW.expires_at = NEW.check_in_time + interval '1 hour'; RETURN NEW; END;
$$;
CREATE TRIGGER set_queue_expiration_trigger BEFORE INSERT ON public.queue_entries FOR EACH ROW EXECUTE FUNCTION public.set_queue_expiration();

-- RPC Functions
CREATE OR REPLACE FUNCTION public.check_active_booking(p_customer_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.bookings WHERE customer_id = p_customer_id AND status IN ('pending', 'confirmed', 'in_progress') AND booking_date >= CURRENT_DATE); END;
$$;

CREATE OR REPLACE FUNCTION public.apply_cancellation_fee(p_booking_id uuid, p_customer_id uuid, p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_cancellation_fee numeric := 5.00;
BEGIN
  INSERT INTO public.booking_cancellations (booking_id, customer_id, cancellation_fee, reason) VALUES (p_booking_id, p_customer_id, v_cancellation_fee, p_reason);
  UPDATE public.customers SET cancellation_count = cancellation_count + 1, total_cancellation_fees = total_cancellation_fees + v_cancellation_fee, updated_at = now() WHERE user_id = p_customer_id;
  UPDATE public.bookings SET status = 'cancelled', updated_at = now() WHERE id = p_booking_id;
  INSERT INTO public.notifications (user_id, title, message, type, related_id) VALUES (p_customer_id, 'Booking Cancelled', 'Your booking has been cancelled. A cancellation fee of ₹5 has been applied.', 'general', p_booking_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_next_customer(p_salon_id uuid, p_message text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE next_customer_id uuid; next_booking_id uuid;
BEGIN
  SELECT customer_id, id INTO next_customer_id, next_booking_id FROM public.bookings WHERE salon_id = p_salon_id AND status = 'confirmed' AND booking_date = CURRENT_DATE ORDER BY queue_position ASC, created_at ASC LIMIT 1;
  IF next_customer_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id) VALUES (next_customer_id, 'Your Turn is Next!', COALESCE(p_message, 'Please get ready, your service will begin shortly.'), 'queue_update', next_booking_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.salon_owner_has_customer(p_customer_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM bookings b JOIN salons s ON s.id = b.salon_id WHERE b.customer_id = p_customer_id AND s.owner_id = auth.uid()); END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_wait_time(p_position integer, p_salon_id uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN RETURN p_position * COALESCE((SELECT avg_service_time FROM public.salons WHERE id = p_salon_id), 30); END;
$$;

CREATE OR REPLACE FUNCTION public.expire_overdue_arrivals()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE expired_booking RECORD; customer_user_id uuid;
BEGIN
  FOR expired_booking IN SELECT b.id, b.customer_id, b.salon_id, s.name as salon_name FROM public.bookings b JOIN public.salons s ON s.id = b.salon_id WHERE b.status = 'confirmed' AND b.arrival_deadline IS NOT NULL AND b.arrival_deadline < NOW()
  LOOP
    UPDATE public.bookings SET status = 'cancelled', notes = COALESCE(notes || ' | ', '') || 'Auto-cancelled: Did not arrive within 10 minutes', updated_at = NOW() WHERE id = expired_booking.id;
    UPDATE public.queue_entries SET status = 'completed', updated_at = NOW() WHERE booking_id = expired_booking.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_walkin_first_position(p_salon_id uuid, p_service_id uuid, p_customer_name text, p_phone text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE new_booking_id uuid; service_price decimal;
BEGIN
  SELECT price INTO service_price FROM public.salon_services WHERE id = p_service_id;
  UPDATE public.queue_entries SET position = position + 1 WHERE salon_id = p_salon_id AND status IN ('waiting', 'called', 'in_service');
  INSERT INTO public.bookings (salon_id, service_id, customer_id, booking_date, booking_time, status, total_price, notes)
  VALUES (p_salon_id, p_service_id, NULL, CURRENT_DATE, NOW()::TIME, 'confirmed', COALESCE(service_price, 0), 'Walk-in: ' || p_customer_name || COALESCE(' | Phone: ' || p_phone, ''))
  RETURNING id INTO new_booking_id;
  INSERT INTO public.queue_entries (booking_id, salon_id, customer_id, position, status, estimated_wait_time, check_in_time) VALUES (new_booking_id, p_salon_id, NULL, 1, 'waiting', 0, NOW());
  RETURN new_booking_id;
END;
$$;

-- Queue display function
CREATE OR REPLACE FUNCTION public.get_queue_display(p_salon_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (queue_entry_id uuid, booking_id uuid, queue_position integer, queue_status text, check_in_time timestamptz, display_name text, service_summary text, is_walk_in boolean, avatar_url text, party_size integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_user_id uuid;
BEGIN
  SELECT c.id INTO current_user_id FROM customers c WHERE c.user_id = auth.uid();
  RETURN QUERY
  SELECT qe.id, qe.booking_id, qe.position, qe.status,
    qe.check_in_time,
    CASE WHEN qe.customer_id IS NULL OR b.notes LIKE 'Walk-in:%' THEN COALESCE(NULLIF(TRIM(SPLIT_PART(SPLIT_PART(b.notes, 'Walk-in:', 2), ' - ', 1)), ''), 'Walk-in')
      WHEN c.first_name IS NOT NULL AND c.first_name != '' THEN c.first_name || COALESCE(' ' || LEFT(c.last_name, 1) || '.', '') ELSE 'Customer' END,
    COALESCE((SELECT CASE WHEN COUNT(*) = 1 THEN MAX(srv.name) ELSE MAX(srv.name) || ' +' || (COUNT(*) - 1)::text || ' more' END FROM booking_services bs JOIN salon_services ss ON ss.id = bs.salon_service_id JOIN services srv ON srv.id = ss.service_id WHERE bs.booking_id = b.id),
      (SELECT srv.name FROM salon_services ss JOIN services srv ON srv.id = ss.service_id WHERE ss.id = b.service_id), 'Service'),
    (qe.customer_id IS NULL OR b.notes LIKE 'Walk-in:%'),
    CASE WHEN qe.customer_id = current_user_id THEN c.avatar_url ELSE NULL END,
    COALESCE(b.party_size, 1)
  FROM queue_entries qe LEFT JOIN bookings b ON b.id = qe.booking_id LEFT JOIN customers c ON c.id = qe.customer_id
  WHERE qe.salon_id = p_salon_id AND qe.status = 'waiting' AND DATE(qe.check_in_time) = p_date ORDER BY qe.position ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_queue_display(uuid, date) TO authenticated;
