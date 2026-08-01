


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "admin";


ALTER SCHEMA "admin" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "attendance";


ALTER SCHEMA "attendance" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "billing";


ALTER SCHEMA "billing" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "blogs";


ALTER SCHEMA "blogs" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "budget";


ALTER SCHEMA "budget" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "calendar";


ALTER SCHEMA "calendar" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "care_log";


ALTER SCHEMA "care_log" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "chat";


ALTER SCHEMA "chat" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "contact";


ALTER SCHEMA "contact" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "contracts";


ALTER SCHEMA "contracts" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "donations";


ALTER SCHEMA "donations" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "email_logs";


ALTER SCHEMA "email_logs" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "feed";


ALTER SCHEMA "feed" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "inventory";


ALTER SCHEMA "inventory" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "marketing";


ALTER SCHEMA "marketing" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "messaging";


ALTER SCHEMA "messaging" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "newsletters";


ALTER SCHEMA "newsletters" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "parent_app";


ALTER SCHEMA "parent_app" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "reels";


ALTER SCHEMA "reels" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "teachers";


ALTER SCHEMA "teachers" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "waitlist";


ALTER SCHEMA "waitlist" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."lead_status" AS ENUM (
    'new_inquiry',
    'not_contacted',
    'contacted',
    'emailed',
    'application_sent',
    'application_submitted',
    'enrollment_offered',
    'enrolled',
    'waitlist',
    'nurture',
    'on_hold',
    'not_fit',
    'lost'
);


ALTER TYPE "public"."lead_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "attendance"."set_aftercare_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
 BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
 END;
 $$;


ALTER FUNCTION "attendance"."set_aftercare_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "billing"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;


ALTER FUNCTION "billing"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "budget"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;


ALTER FUNCTION "budget"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "care_log"."is_teacher_or_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.users
    WHERE id = auth.uid()
      AND role IN ('teacher', 'super_admin')
      AND is_deleted = false
  );
$$;


ALTER FUNCTION "care_log"."is_teacher_or_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "contact"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "contact"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "feed"."delete_own_post"("p_post_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'feed', 'auth', 'public'
    AS $$                                       
  BEGIN                                   
    UPDATE feed.posts
    SET is_deleted = true                                                   
    WHERE id = p_post_id
      AND teacher_id = auth.uid()                                           
      AND is_deleted = false;                           

    IF NOT FOUND THEN                         
      RAISE EXCEPTION 'Post not found or permission denied'
        USING ERRCODE = 'insufficient_privilege';
    END IF;                                                                 
  END;
  $$;


ALTER FUNCTION "feed"."delete_own_post"("p_post_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.users
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_deleted = false
  );
$$;


ALTER FUNCTION "inventory"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "inventory"."is_teacher_or_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.users
    WHERE id = auth.uid()
      AND role IN ('teacher', 'super_admin')
      AND is_deleted = false
  );
$$;


ALTER FUNCTION "inventory"."is_teacher_or_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "messaging"."find_or_create_conversation"("other_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$                                                                                                      
  DECLARE                                               
    conv_id uuid;                         
    my_id uuid := auth.uid();
  BEGIN                                                                                                      
    SELECT cp1.conversation_id INTO conv_id
    FROM messaging.conversation_participants cp1                                                             
    JOIN messaging.conversation_participants cp2        
      ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = my_id                                                                                
      AND cp2.user_id = other_user_id
    LIMIT 1;                                                                                                 
                                                        
    IF conv_id IS NOT NULL THEN                                                                              
      RETURN conv_id;                                   
    END IF;                                                                                                  
  
    INSERT INTO messaging.conversations DEFAULT VALUES                                                       
    RETURNING id INTO conv_id;                          
                                              
    INSERT INTO messaging.conversation_participants (conversation_id, user_id)
    VALUES (conv_id, my_id), (conv_id, other_user_id);
                                                                                                             
    RETURN conv_id;                       
  END;                                                                                                       
  $$;


ALTER FUNCTION "messaging"."find_or_create_conversation"("other_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "messaging"."is_participant"("conv_id" "uuid", "uid" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    select exists (
      select 1 from messaging.conversation_participants
      where conversation_id = conv_id and user_id = uid                                           
    );
  $$;


ALTER FUNCTION "messaging"."is_participant"("conv_id" "uuid", "uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "newsletters"."is_teacher_or_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin.users
    WHERE id = auth.uid()
      AND role IN ('teacher', 'super_admin')
      AND is_deleted = false
  );
$$;


ALTER FUNCTION "newsletters"."is_teacher_or_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "parent_app"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
 BEGIN
   NEW.updated_at = now();
   RETURN NEW;
 END;
 $$;


ALTER FUNCTION "parent_app"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_or_create_conversation"("other_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$                                                                                                      
  DECLARE                                                                                                    
    conv_id uuid;
    my_id uuid := auth.uid();                                                                                
  BEGIN                                                 
    SELECT cp1.conversation_id INTO conv_id
    FROM messaging.conversation_participants cp1
    JOIN messaging.conversation_participants cp2
      ON cp1.conversation_id = cp2.conversation_id
    WHERE cp1.user_id = my_id
      AND cp2.user_id = other_user_id                                                                        
    LIMIT 1;                                  
                                                                                                             
    IF conv_id IS NOT NULL THEN                         
      RETURN conv_id;                                                                                        
    END IF;
                                                                                                             
    INSERT INTO messaging.conversations DEFAULT VALUES  
    RETURNING id INTO conv_id;

    INSERT INTO messaging.conversation_participants (conversation_id, user_id)
    VALUES (conv_id, my_id), (conv_id, other_user_id);

    RETURN conv_id;                                                                                          
  END;
  $$;


ALTER FUNCTION "public"."find_or_create_conversation"("other_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_school_photos"() RETURNS json
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT json_agg(row_to_json(t) ORDER BY t.created_at DESC)
    FROM (
      SELECT
        p.id,
        p.teacher_id,
        p.storage_path,
        p.caption,
        p.taken_on,
        p.created_at,
        p.publication_labels,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'student_id',        s.id,
              'name',              s.child_legal_name,
              'profile_image_url', s.profile_image_url,
              'consent_level',     c.consent_level
            ))
            FROM teachers.photo_student_tags t2
            JOIN admin.students s ON s.id = t2.student_id
            LEFT JOIN parent_app.student_photo_release_consent c ON c.student_id = s.id
            WHERE t2.photo_id = p.id
          ),
          '[]'::json
        ) AS tags
      FROM teachers.photos p
      WHERE p.is_deleted = false
    ) t;
  $$;


ALTER FUNCTION "public"."get_all_school_photos"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_teacher_assignments"() RETURNS TABLE("assignment_id" "uuid", "teacher_id" "uuid", "teacher_name" "text", "student_id" "uuid", "program" "text", "classroom" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT
      ts.id          AS assignment_id,
      ts.teacher_id,
      u.full_name    AS teacher_name,
      ts.student_id,
      ts.program,
      ts.classroom
    FROM teachers.teacher_students ts
    JOIN admin.users u ON u.id = ts.teacher_id
    WHERE ts.is_deleted = false
      AND u.is_deleted = false
      AND u.role IN ('teacher', 'super_admin');
  $$;


ALTER FUNCTION "public"."get_all_teacher_assignments"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_channel_members"("p_channel_id" "uuid") RETURNS json
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
   SELECT json_agg(row_to_json(t))
   FROM (
     SELECT
       u.id,
       u.full_name,
       u.profile_image_url,
           u.profile_image_url,
           u.role,
           COALESCE(
             (
               SELECT json_agg(json_build_object(
                 'id',                s.id,
                 'child_legal_name',  s.child_legal_name,
                 'profile_image_url', s.profile_image_url
               ) ORDER BY s.child_legal_name)
               FROM admin.students s
               WHERE s.parent_id = u.id
                 AND s.is_deleted = false
             ),
             '[]'::json
           ) AS children
         FROM messaging.channel_members cm
         JOIN admin.users u ON u.id = cm.user_id
         WHERE cm.channel_id = p_channel_id
           AND u.is_deleted = false
           AND u.id != '893f483e-2724-428f-a2f9-4333831501c7'
         ORDER BY u.full_name
       ) t
     $$;


ALTER FUNCTION "public"."get_channel_members"("p_channel_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_channels_with_meta"("p_user_id" "uuid") RETURNS TABLE("channel_id" "uuid", "name" "text", "description" "text", "is_default" boolean, "updated_at" timestamp with time zone, "is_member" boolean, "member_count" bigint, "last_message_body" "text", "last_message_created_at" timestamp with time zone, "last_message_sender_id" "uuid", "unread_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT
      ch.id                         AS channel_id,
      ch.name,
      ch.description,
      ch.is_default,
      ch.updated_at,
      (cm.user_id IS NOT NULL)      AS is_member,
      (
        SELECT COUNT(*)
        FROM messaging.channel_members cm2
        WHERE cm2.channel_id = ch.id
      )                             AS member_count,
      lm.body                       AS last_message_body,
      lm.created_at                 AS last_message_created_at,
      lm.sender_id                  AS last_message_sender_id,
      CASE  
        WHEN cm.user_id IS NULL THEN 0
        WHEN cm.last_read_at IS NULL THEN (
          SELECT COUNT(*)
          FROM messaging.channel_messages msg
          WHERE msg.channel_id = ch.id
            AND msg.sender_id != p_user_id
        )
        ELSE (
          SELECT COUNT(*)
          FROM messaging.channel_messages msg
          WHERE msg.channel_id = ch.id
            AND msg.sender_id != p_user_id
            AND msg.created_at > cm.last_read_at
        )
      END                           AS unread_count
    FROM messaging.channels ch
    LEFT JOIN messaging.channel_members cm
      ON cm.channel_id = ch.id AND cm.user_id = p_user_id
    LEFT JOIN LATERAL (
      SELECT body, created_at, sender_id
      FROM messaging.channel_messages msg
      WHERE msg.channel_id = ch.id
      ORDER BY msg.created_at DESC
      LIMIT 1
    ) lm ON true
    ORDER BY ch.is_default DESC, ch.name ASC;
  $$;


ALTER FUNCTION "public"."get_channels_with_meta"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversation_list"("p_user_id" "uuid") RETURNS TABLE("id" "uuid", "other_user_id" "uuid", "other_user_name" "text", "other_user_profile_image" "text", "last_message_preview" "text", "last_message_at" timestamp with time zone, "unread_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'messaging', 'admin', 'public'
    AS $$
    with my_convs as (
      select conversation_id
      from messaging.conversation_participants
      where user_id = p_user_id
    ),
    other_parts as (
      select cp.conversation_id, cp.user_id as other_user_id
      from messaging.conversation_participants cp
      join my_convs mc on mc.conversation_id = cp.conversation_id
      where cp.user_id <> p_user_id
    ),
    last_msgs as (
      select distinct on (conversation_id)
        conversation_id, body, created_at
      from messaging.messages
      where conversation_id in (select conversation_id from my_convs)
      order by conversation_id, created_at desc
    ),
    unread as (
      select conversation_id, count(*) as cnt
      from messaging.messages
      where conversation_id in (select conversation_id from my_convs)
        and sender_id <> p_user_id
        and read_at is null
      group by conversation_id
    )
    select
      c.id,
      op.other_user_id,
      u.full_name,
      u.profile_image_url,
      lm.body,
      coalesce(lm.created_at, c.updated_at),
      coalesce(ur.cnt, 0)
    from messaging.conversations c
    join my_convs mc on mc.conversation_id = c.id
    left join other_parts op on op.conversation_id = c.id
    left join admin.users u on u.id = op.other_user_id
    left join last_msgs lm on lm.conversation_id = c.id
    left join unread ur on ur.conversation_id = c.id
    order by coalesce(lm.created_at, c.updated_at) desc
  $$;


ALTER FUNCTION "public"."get_conversation_list"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_conversations_with_meta"("p_user_id" "uuid") RETURNS TABLE("conversation_id" "uuid", "updated_at" timestamp with time zone, "other_user_id" "uuid", "other_full_name" "text", "other_role" "text", "other_profile_image_url" "text", "last_message_body" "text", "last_message_created_at" timestamp with time zone, "last_message_sender_id" "uuid", "unread_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    c.id                          AS conversation_id,
    c.updated_at,
    ou.id                         AS other_user_id,
    ou.full_name                  AS other_full_name,
    ou.role                       AS other_role,
    COALESCE(
      ou.profile_image_url,
      CASE WHEN ou.role = 'parent'
        THEN (
          SELECT s.profile_image_url
          FROM admin.students s
          WHERE s.parent_id = ou.id
            AND s.is_deleted = false
            AND s.profile_image_url IS NOT NULL
          LIMIT 1
        )
      END
    )                             AS other_profile_image_url,
    lm.body                       AS last_message_body,
    lm.created_at                 AS last_message_created_at,
    lm.sender_id                  AS last_message_sender_id,
    (
      SELECT COUNT(*)
      FROM messaging.messages m2
      WHERE m2.conversation_id = c.id
        AND m2.sender_id != p_user_id
        AND m2.read_at IS NULL
    )                             AS unread_count
  FROM messaging.conversation_participants cp
  JOIN messaging.conversations c ON c.id = cp.conversation_id
  JOIN messaging.conversation_participants cp2
    ON cp2.conversation_id = c.id AND cp2.user_id != p_user_id
  JOIN admin.users ou ON ou.id = cp2.user_id
  LEFT JOIN LATERAL (
    SELECT body, created_at, sender_id
    FROM messaging.messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE cp.user_id = p_user_id
  ORDER BY lm.created_at DESC NULLS LAST;
$$;


ALTER FUNCTION "public"."get_conversations_with_meta"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_dashboard_snapshot"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_active_sessions json;
  v_enrollment      json;
  v_financials      json;
  v_upcoming_tours   json;
  v_mobile_app_users json;
  v_month_start      date := date_trunc('month', now())::date;
  v_month_end       date := (date_trunc('month', now()) + interval '1 month - 1 day')::date;
  v_today           date := now()::date;
BEGIN
  -- 1. Employees currently clocked in (clock_out_at IS NULL, today)
  SELECT json_agg(row_to_json(t)) INTO v_active_sessions
  FROM (
    SELECT cs.id, cs.clock_in_at, u.full_name, u.profile_image_url
    FROM teachers.clock_sessions cs
    JOIN admin.users u ON u.id = cs.teacher_id
    WHERE cs.clock_out_at IS NULL
      AND cs.clock_in_at::date = v_today
    ORDER BY cs.clock_in_at ASC
  ) t;

  -- 2. Enrolled kids per program, excluding "Don't Include" tagged applications
  SELECT json_agg(row_to_json(t)) INTO v_enrollment
  FROM (
    SELECT program, count(*)::int AS count
    FROM parent_app.applications
    WHERE status = 'enrolled'
      AND is_active = true
      AND NOT (admin_tags @> ARRAY['Don''t Include'::text])
    GROUP BY program
    ORDER BY program
  ) t;

  -- 3. Revenue & expenses for the current month
  SELECT json_build_object(
    'revenue', coalesce(
      (SELECT sum(
         CASE WHEN cover_fees
           THEN coalesce(intended_amount_cents, amount_cents)
           ELSE amount_cents
         END
       )::numeric / 100
       FROM billing.stripe_transactions
       WHERE exclude_from_revenue = false
         AND is_deleted = false
         AND created_at::date >= v_month_start
         AND created_at::date <= v_month_end
      ), 0),
    'expenses', coalesce(
      (SELECT sum(amount)
       FROM budget.expenses
       WHERE is_deleted = false
         AND category <> 'Savings'
         AND expense_date::date >= v_month_start
         AND expense_date::date <= v_month_end
      ), 0)
  ) INTO v_financials;

  -- 4. Upcoming tour bookings (today onwards, not cancelled/completed/no_show), max 5
  SELECT json_agg(row_to_json(t)) INTO v_upcoming_tours
  FROM (
    SELECT id, first_name, last_name, tour_date, tour_time, status, num_children
    FROM marketing.tour_bookings
    WHERE is_deleted = false
      AND tour_date::date >= v_today
      AND status NOT IN ('cancelled', 'completed', 'no_show')
    ORDER BY tour_date ASC, tour_time ASC
    LIMIT 5
  ) t;

  -- 5. Users with push token (mobile app installed)
  SELECT json_build_object(
    'count', coalesce((SELECT count(*)::int FROM admin.users WHERE push_token IS NOT NULL AND is_deleted = false), 0),
    'users', coalesce(
      (SELECT json_agg(row_to_json(t)) FROM (
        SELECT id, full_name, email, role
        FROM admin.users
        WHERE push_token IS NOT NULL
          AND is_deleted = false
        ORDER BY full_name ASC
      ) t),
      '[]'::json
    )
  ) INTO v_mobile_app_users;

  RETURN json_build_object(
    'active_sessions',  coalesce(v_active_sessions, '[]'::json),
    'enrollment',       coalesce(v_enrollment, '[]'::json),
    'financials',       coalesce(v_financials, json_build_object('revenue', 0, 'expenses', 0)),
    'upcoming_tours',   coalesce(v_upcoming_tours, '[]'::json),
    'mobile_app_users', coalesce(v_mobile_app_users, json_build_object('count', 0))
  );
END;
$$;


ALTER FUNCTION "public"."get_dashboard_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_reels_with_authors"() RETURNS TABLE("id" "uuid", "teacher_id" "uuid", "teacher_name" "text", "teacher_role" "text", "teacher_profile_image_url" "text", "caption" "text", "storage_url" "text", "duration_secs" integer, "school_year" "text", "created_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT
      p.id,
      p.teacher_id,
      u.full_name     AS teacher_name,
      u.role          AS teacher_role,
      u.profile_image_url AS teacher_profile_image_url,
      p.caption,
      p.storage_url,
      p.duration_secs,
      p.school_year,
      p.created_at
    FROM reels.posts p
    JOIN admin.users u ON u.id = p.teacher_id
    WHERE p.is_deleted = false
      AND u.is_deleted = false
    ORDER BY p.created_at DESC;
  $$;


ALTER FUNCTION "public"."get_reels_with_authors"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_teacher_photos"("p_teacher_id" "uuid") RETURNS json
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT json_agg(row_to_json(t) ORDER BY t.created_at DESC)
  FROM (
    SELECT
      p.id,
      p.teacher_id,
      p.storage_path,
      p.caption,
      p.taken_on,
      p.created_at,
      p.publication_labels,
      COALESCE(
        (
          SELECT json_agg(json_build_object(
            'student_id',        s.id,
            'name',              s.child_legal_name,
            'profile_image_url', s.profile_image_url,
            'consent_level',     c.consent_level
          ))
          FROM teachers.photo_student_tags t2
          JOIN admin.students s ON s.id = t2.student_id
          LEFT JOIN parent_app.student_photo_release_consent c ON c.student_id = s.id
          WHERE t2.photo_id = p.id
        ),
        '[]'::json
      ) AS tags
    FROM teachers.photos p
    WHERE p.teacher_id = p_teacher_id
      AND p.is_deleted = false
  ) t
$$;


ALTER FUNCTION "public"."get_teacher_photos"("p_teacher_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_names"("user_ids" "uuid"[]) RETURNS TABLE("id" "uuid", "full_name" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT id, full_name FROM admin.users
    WHERE id = ANY(user_ids) AND is_deleted = false;
  $$;


ALTER FUNCTION "public"."get_user_names"("user_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_staff"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$                                                                            
    SELECT EXISTS (
      SELECT 1 FROM admin.users                                                    
      WHERE id = auth.uid()                                 
        AND role IN ('teacher', 'super_admin')
    );                                                                             
  $$;


ALTER FUNCTION "public"."is_staff"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT EXISTS (SELECT 1 FROM admin.users WHERE id = auth.uid() AND role =
  'super_admin');
  $$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rpc_home_screen_data"("p_user_id" "uuid", "p_parent_id" "uuid") RETURNS json
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT json_build_object(
    'profile', (
      SELECT json_build_object('full_name', full_name, 'profile_image_url', profile_image_url)
      FROM admin.users
      WHERE id = p_user_id
    ),
    'students', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
      FROM (
        SELECT id, child_legal_name, child_grade, profile_image_url
        FROM admin.students
        WHERE parent_id = p_parent_id
          AND is_deleted = false
      ) s
    ),
    'events', (
      SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json)
      FROM (
        SELECT id, title, event_date, is_all_day, start_time, end_time,
               color, category, description, location, attachment_links
        FROM calendar.events
        WHERE event_date >= current_date
        ORDER BY event_date ASC
        LIMIT 3
      ) e
    ),
    'pending_payments', (
      SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json)
      FROM (
        SELECT id, label, amount_cents, program, student_id
        FROM billing.pending_payment_requests
        WHERE status = 'pending'
        ORDER BY created_at DESC
        LIMIT 3
      ) p
    ),
    'onboarding', (
      SELECT row_to_json(o)
      FROM (
        SELECT completed
        FROM parent_app.onboarding_checklist
        WHERE parent_id = p_parent_id
        LIMIT 1
      ) o
    ),
    'dropoff', (
      SELECT row_to_json(d)
      FROM (
        SELECT slot
        FROM parent_app.dropoff_times
        WHERE parent_id = p_parent_id
        LIMIT 1
      ) d
    ),
    'applications', (
      SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
      FROM (
        SELECT id, student_id, status, program, drop_in_program, child_legal_name
        FROM parent_app.applications
        WHERE user_id = p_parent_id
          AND approved = true
          AND program IN ('summer_26', 'both', 'homeschool_drop_in', 'school_year_26_27')
      ) a
    ),
    'transactions', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT student_id, payment_type, status, metadata
        FROM billing.stripe_transactions
        WHERE parent_id = p_parent_id
          AND is_deleted = false
          AND status = 'completed'
      ) t
    )
  );
$$;


ALTER FUNCTION "public"."rpc_home_screen_data"("p_user_id" "uuid", "p_parent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_inventory_item"("item_id" "uuid") RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'inventory', 'public'
    AS $$
    UPDATE inventory.items
    SET is_deleted = true
    WHERE id = item_id AND is_deleted = false;
  $$;


ALTER FUNCTION "public"."soft_delete_inventory_item"("item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_student_profile_fields"("p_student_id" "uuid", "p_has_medical_conditions" "text" DEFAULT NULL::"text", "p_medical_conditions_description" "text" DEFAULT NULL::"text", "p_has_allergies" "text" DEFAULT NULL::"text", "p_allergies_description" "text" DEFAULT NULL::"text", "p_has_emergency_medications" "text" DEFAULT NULL::"text", "p_emergency_medications_description" "text" DEFAULT NULL::"text", "p_learning_style" "text" DEFAULT NULL::"text", "p_strengths_interests" "text" DEFAULT NULL::"text", "p_current_challenges" "text" DEFAULT NULL::"text", "p_dysregulation_response" "text" DEFAULT NULL::"text", "p_regulation_strategies" "text" DEFAULT NULL::"text", "p_activities_to_avoid" "text" DEFAULT NULL::"text", "p_needs_aide" "text" DEFAULT NULL::"text", "p_needs_aide_description" "text" DEFAULT NULL::"text", "p_history_flags" "text" DEFAULT NULL::"text", "p_history_explanation" "text" DEFAULT NULL::"text", "p_special_interests" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  DECLARE
    v_caller_id uuid := auth.uid();
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM admin.students
      WHERE id = p_student_id
        AND parent_id = v_caller_id
        AND is_deleted = false
    ) THEN
      RETURN json_build_object('error', 'not_authorized');
    END IF;

    UPDATE admin.students SET
      has_medical_conditions            = COALESCE(p_has_medical_conditions,            has_medical_conditions),
      medical_conditions_description    = COALESCE(p_medical_conditions_description,    medical_conditions_description),
      has_allergies                     = COALESCE(p_has_allergies,                     has_allergies),
      allergies_description             = COALESCE(p_allergies_description,             allergies_description),
      has_emergency_medications         = COALESCE(p_has_emergency_medications,         has_emergency_medications),
      emergency_medications_description = COALESCE(p_emergency_medications_description,
  emergency_medications_description),
      learning_style                    = COALESCE(p_learning_style,                    learning_style),
      special_interests                 = COALESCE(p_special_interests,                 special_interests),
      strengths_interests               = COALESCE(p_strengths_interests,               strengths_interests),
      current_challenges                = COALESCE(p_current_challenges,                current_challenges),
      dysregulation_response            = COALESCE(p_dysregulation_response,            dysregulation_response),
      regulation_strategies             = COALESCE(p_regulation_strategies,             regulation_strategies),
      activities_to_avoid               = COALESCE(p_activities_to_avoid,               activities_to_avoid),
      needs_aide                        = COALESCE(p_needs_aide,                        needs_aide),
      needs_aide_description            = COALESCE(p_needs_aide_description,            needs_aide_description),
      history_flags                     = COALESCE(p_history_flags,                     history_flags),
      history_explanation               = COALESCE(p_history_explanation,               history_explanation)
    WHERE id = p_student_id;

    RETURN json_build_object('success', true);
  END;
  $$;


ALTER FUNCTION "public"."update_student_profile_fields"("p_student_id" "uuid", "p_has_medical_conditions" "text", "p_medical_conditions_description" "text", "p_has_allergies" "text", "p_allergies_description" "text", "p_has_emergency_medications" "text", "p_emergency_medications_description" "text", "p_learning_style" "text", "p_strengths_interests" "text", "p_current_challenges" "text", "p_dysregulation_response" "text", "p_regulation_strategies" "text", "p_activities_to_avoid" "text", "p_needs_aide" "text", "p_needs_aide_description" "text", "p_history_flags" "text", "p_history_explanation" "text", "p_special_interests" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_student_profile_image"("p_student_id" "uuid", "p_image_url" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
  BEGIN                                                                                 
    UPDATE admin.students                               
    SET profile_image_url = p_image_url
    WHERE id = p_student_id
      AND parent_id = auth.uid();
  END;                                        
  $$;


ALTER FUNCTION "public"."update_student_profile_image"("p_student_id" "uuid", "p_image_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_profile_image"("p_image_url" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$                                  
  BEGIN
    UPDATE admin.users SET profile_image_url = p_image_url WHERE id = auth.uid();       
  END;                                                      
  $$;


ALTER FUNCTION "public"."update_user_profile_image"("p_image_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "reels"."is_teacher_or_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT EXISTS (
      SELECT 1 FROM admin.users
      WHERE id = auth.uid()
        AND role IN ('teacher', 'super_admin')
        AND is_deleted = false
    );
  $$;


ALTER FUNCTION "reels"."is_teacher_or_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "teachers"."get_classmate_ids_for_parent"("parent_uid" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'teachers', 'admin', 'public'
    AS $$                                    
    SELECT DISTINCT ts2.student_id
    FROM teachers.teacher_students ts2
    WHERE ts2.teacher_id IN (         
      SELECT DISTINCT ts1.teacher_id                                        
      FROM teachers.teacher_students ts1
      INNER JOIN admin.students s ON s.id = ts1.student_id                  
      WHERE s.parent_id = parent_uid                      
        AND ts1.is_deleted = false  
    )                                                                       
    AND ts2.is_deleted = false;
  $$;


ALTER FUNCTION "teachers"."get_classmate_ids_for_parent"("parent_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "teachers"."get_teacher_ids_for_parent"("parent_uid" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'teachers', 'admin', 'public'
    AS $$
    SELECT DISTINCT ts.teacher_id
    FROM teachers.teacher_students ts                                       
    INNER JOIN admin.students s ON s.id = ts.student_id
    WHERE s.parent_id = parent_uid                                          
      AND ts.is_deleted = false;                            
  $$;


ALTER FUNCTION "teachers"."get_teacher_ids_for_parent"("parent_uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "teachers"."is_parent_of_my_student"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'teachers', 'admin', 'public'
    AS $$                                                                                                      
    SELECT EXISTS (
      SELECT 1                                                                                               
      FROM admin.students s                             
      JOIN teachers.teacher_students ts ON ts.student_id = s.id
      WHERE s.parent_id = p_user_id                            
        AND ts.teacher_id = auth.uid()
        AND ts.is_deleted = false                                                                            
        AND s.is_deleted = false 
    );                                                                                                       
  $$;


ALTER FUNCTION "teachers"."is_parent_of_my_student"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "teachers"."is_teacher_of"("p_student_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'teachers', 'public'
    AS $$                                                                                                      
    SELECT EXISTS (                                     
      SELECT 1 FROM teachers.teacher_students
      WHERE student_id = p_student_id        
        AND teacher_id = auth.uid()  
        AND is_deleted = false     
    );                        
  $$;


ALTER FUNCTION "teachers"."is_teacher_of"("p_student_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "teachers"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END;
  $$;


ALTER FUNCTION "teachers"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "waitlist"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "waitlist"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "admin"."android_download_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "admin"."android_download_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "admin"."development_tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "assignee" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "development_tasks_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'done'::"text"])))
);


ALTER TABLE "admin"."development_tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "admin"."help_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "page_url" "text",
    CONSTRAINT "help_requests_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text"])))
);


ALTER TABLE "admin"."help_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "admin"."parent_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "categories" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "message" "text",
    "allow_follow_up" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "parent_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "admin"."parent_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "admin"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "child_legal_name" "text" NOT NULL,
    "dob_month" "text" NOT NULL,
    "dob_day" "text" NOT NULL,
    "dob_year" "text" NOT NULL,
    "special_interests" "text",
    "has_medical_conditions" "text",
    "medical_conditions_description" "text",
    "has_allergies" "text",
    "allergies_description" "text",
    "has_emergency_medications" "text",
    "emergency_medications_description" "text",
    "history_flags" "text",
    "history_explanation" "text",
    "needs_aide" "text",
    "needs_aide_description" "text",
    "learning_style" "text",
    "strengths_interests" "text",
    "current_challenges" "text",
    "dysregulation_response" "text",
    "regulation_strategies" "text",
    "activities_to_avoid" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "child_grade" "text",
    "profile_image_url" "text"
);


ALTER TABLE "admin"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "admin"."tuition_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "rating" smallint NOT NULL,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tuition_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "admin"."tuition_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "admin"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "full_name" "text" DEFAULT ''::"text",
    "g1_cell_phone" "text",
    "g1_work_phone" "text",
    "g1_preferred_contact" "text",
    "g1_lives_with_child" "text",
    "g1_has_custody" "text",
    "g2_full_name" "text",
    "g2_relationship" "text",
    "g2_relationship_other" "text",
    "g2_email" "text",
    "g2_cell_phone" "text",
    "g2_work_phone" "text",
    "g2_preferred_contact" "text",
    "g2_lives_with_child" "text",
    "g2_has_custody" "text",
    "has_custody_orders" "text",
    "custody_orders_description" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "stripe_customer_id" "text",
    "profile_image_url" "text",
    "push_token" "text",
    "hourly_rate" numeric(8,2) DEFAULT NULL::numeric,
    "employee_code" "text",
    CONSTRAINT "chk_employee_code_format" CHECK ((("employee_code" IS NULL) OR ("employee_code" ~ '^\d{5}$'::"text"))),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text", 'parent'::"text", 'teacher'::"text", 'teacher_aide'::"text"])))
);


ALTER TABLE "admin"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "admin"."volunteer_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid",
    "skills" "text" NOT NULL,
    "help_areas" "text"[] NOT NULL,
    "availability" "text"[] NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "admin"."volunteer_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "attendance"."aftercare_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "pickup_time" time without time zone,
    "recorded_by" "uuid" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "paid_for_day" boolean DEFAULT false NOT NULL,
    "picked_up_by_name" "text",
    "picked_up_by_relationship" "text",
    "pickup_recorded_by" "uuid"
);


ALTER TABLE "attendance"."aftercare_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "attendance"."check_ins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "checked_in_by" "uuid" NOT NULL,
    "checked_in_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checked_out_at" timestamp with time zone,
    "notes" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checked_out_by" "uuid"
);


ALTER TABLE "attendance"."check_ins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "attendance"."field_friday_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "recorded_by" "uuid" NOT NULL,
    "notes" "text",
    "paid_for_day" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pickup_time" "text",
    "picked_up_by_name" "text",
    "picked_up_by_relationship" "text",
    "pickup_recorded_by" "uuid"
);


ALTER TABLE "attendance"."field_friday_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "attendance"."summer_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "recorded_by" "uuid" NOT NULL,
    "notes" "text",
    "paid_for_day" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "pickup_time" "text",
    "picked_up_by_name" "text",
    "picked_up_by_relationship" "text",
    "pickup_recorded_by" "uuid"
);


ALTER TABLE "attendance"."summer_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "billing"."homeschool_day_commitments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "note" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "billing"."homeschool_day_commitments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "billing"."one_time_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stripe_session_id" "text",
    "payer_name" "text" NOT NULL,
    "payer_email" "text" NOT NULL,
    "payer_phone" "text",
    "child_name" "text",
    "child_age" integer,
    "memo" "text",
    "amount_cents" integer NOT NULL,
    "cover_fees" boolean DEFAULT false,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "billing"."one_time_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "billing"."pending_payment_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid",
    "program" "text" NOT NULL,
    "payment_type" "text" NOT NULL,
    "week" "text",
    "month" "text",
    "label" "text" NOT NULL,
    "amount_cents" integer,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "billing"."pending_payment_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "billing"."stripe_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stripe_session_id" "text" NOT NULL,
    "stripe_payment_intent_id" "text",
    "payment_type" "text" NOT NULL,
    "status" "text" DEFAULT 'completed'::"text" NOT NULL,
    "amount_cents" integer NOT NULL,
    "intended_amount_cents" integer,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "cover_fees" boolean DEFAULT false,
    "payer_name" "text",
    "payer_email" "text",
    "description" "text",
    "student_id" "uuid",
    "application_id" "uuid",
    "parent_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_deleted" boolean DEFAULT false NOT NULL,
    "exclude_from_revenue" boolean DEFAULT false NOT NULL
);


ALTER TABLE "billing"."stripe_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "billing"."summer_week_commitments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "application_id" "uuid" NOT NULL,
    "note" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "billing"."summer_week_commitments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "billing"."tuition_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "label" "text" NOT NULL,
    "amount_cents" integer NOT NULL,
    "parent_id" "uuid",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "billing"."tuition_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "blogs"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "excerpt" "text",
    "cover_image_path" "text",
    "cover_image_bucket" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "published_at" timestamp with time zone,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "meta_description" "text",
    CONSTRAINT "blog_posts_cover_image_bucket_check" CHECK (("cover_image_bucket" = ANY (ARRAY['blog-images'::"text", 'teacher-photos'::"text"]))),
    CONSTRAINT "blog_posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "blogs"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "budget"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "expense_name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "payment_method" "text",
    "expense_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "tax_deductible" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL
);


ALTER TABLE "budget"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "budget"."income" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" NOT NULL,
    "student_id" "uuid",
    "description" "text",
    "amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "income_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "parent_id" "uuid"
);


ALTER TABLE "budget"."income" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "budget"."line_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "item_name" "text" NOT NULL,
    "planned_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "budget"."line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "budget"."settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "budget"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "calendar"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "event_date" "date" NOT NULL,
    "is_all_day" boolean DEFAULT false NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "description" "text",
    "location" "text",
    "shared_with" "text"[] DEFAULT '{}'::"text"[],
    "programs" "text"[] DEFAULT '{}'::"text"[],
    "category" "text",
    "color" "text" DEFAULT '#5E7C68'::"text" NOT NULL,
    "recurrence" "text" DEFAULT 'None'::"text",
    "recurrence_end_date" "date",
    "attachment_links" "text"[] DEFAULT '{}'::"text"[],
    "rsvp_enabled" boolean DEFAULT false NOT NULL,
    "reminder_email" boolean DEFAULT false NOT NULL,
    "reminder_in_app" boolean DEFAULT false NOT NULL,
    "reminder_timing" "text" DEFAULT '30 min before'::"text",
    "internal_notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "calendar"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "care_log"."entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "activity" "text" NOT NULL,
    "logged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "logged_by" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "notes" "text",
    CONSTRAINT "entries_activity_check" CHECK (("activity" = ANY (ARRAY['sunscreen'::"text", 'bug_spray'::"text"])))
);


ALTER TABLE "care_log"."entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "contact"."account_deletion_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "reason" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL
);


ALTER TABLE "contact"."account_deletion_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "contact"."submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "email" character varying(255) NOT NULL,
    "phone" character varying(20),
    "subject" character varying(200) NOT NULL,
    "message" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "public"."lead_status" DEFAULT 'not_contacted'::"public"."lead_status",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "call_notes" "text"
);


ALTER TABLE "contact"."submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "contracts"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "requires_parent_signature" boolean DEFAULT false NOT NULL,
    "show_staff_signature" boolean DEFAULT false NOT NULL
);


ALTER TABLE "contracts"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "contracts"."history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "version" integer NOT NULL,
    "saved_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "contracts"."history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "donations"."donations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stripe_session_id" "text" NOT NULL,
    "stripe_payment_intent_id" "text",
    "amount_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "donor_name" "text",
    "donor_email" "text" NOT NULL,
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "donations"."donations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "email_logs"."sends" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid",
    "to_address" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "status" "text" NOT NULL,
    "error_message" "text",
    "sent_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "template" "text",
    CONSTRAINT "sends_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text"])))
);


ALTER TABLE "email_logs"."sends" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "feed"."post_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size_bytes" bigint,
    "kind" "text" NOT NULL,
    "storage_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "post_attachments_kind_check" CHECK (("kind" = ANY (ARRAY['pdf'::"text", 'doc'::"text", 'sheet'::"text", 'other'::"text"])))
);


ALTER TABLE "feed"."post_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "feed"."post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_comment_id" "uuid"
);


ALTER TABLE "feed"."post_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "feed"."post_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "kind" "text" NOT NULL,
    "storage_url" "text" NOT NULL,
    "display_order" smallint DEFAULT 0 NOT NULL,
    "duration_secs" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "post_media_kind_check" CHECK (("kind" = ANY (ARRAY['image'::"text", 'video'::"text"])))
);


ALTER TABLE "feed"."post_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "feed"."post_reactions" (
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "feed"."post_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "feed"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "school_year" "text" NOT NULL,
    "classroom" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "post_type" "text",
    "feed_mode" "text" DEFAULT 'feed'::"text" NOT NULL,
    CONSTRAINT "posts_feed_mode_check" CHECK (("feed_mode" = ANY (ARRAY['feed'::"text", 'reel'::"text"])))
);


ALTER TABLE "feed"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."history_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "performed_by" "uuid" NOT NULL,
    "count_before" integer,
    "count_after" integer,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "history_events_action_type_check" CHECK (("action_type" = ANY (ARRAY['taken'::"text", 'restocked'::"text", 'photo_added'::"text", 'note_added'::"text", 'status_changed'::"text", 'shopping_requested'::"text", 'created'::"text"])))
);


ALTER TABLE "inventory"."history_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "status" "text",
    "count" integer,
    "notes" "text",
    "classroom" "text",
    "added_by" "uuid" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "items_category_check" CHECK (("category" = ANY (ARRAY['Arts'::"text", 'Crafts'::"text", 'Science'::"text", 'Math'::"text", 'Writing'::"text", 'Sensory'::"text", 'Outdoor'::"text", 'General'::"text"]))),
    CONSTRAINT "items_count_check" CHECK (("count" >= 0)),
    CONSTRAINT "items_status_check" CHECK (("status" = ANY (ARRAY['Full'::"text", 'Running Out'::"text", 'Low'::"text"])))
);


ALTER TABLE "inventory"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "caption" "text",
    "is_primary" boolean DEFAULT false NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "inventory"."photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "inventory"."shopping_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "requested_by" "uuid" NOT NULL,
    "note" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "resolved_by" "uuid",
    "resolved_at" timestamp with time zone,
    "resolution_note" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shopping_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'purchased'::"text", 'denied'::"text"])))
);


ALTER TABLE "inventory"."shopping_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."beach_bash_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "referral_source" "text",
    "notes" "text",
    "emergency_name" "text",
    "emergency_phone" "text",
    "consent_outdoor" boolean DEFAULT false NOT NULL,
    "consent_photo" boolean DEFAULT false NOT NULL,
    "signature_name" "text" NOT NULL,
    "payment_method" "text" DEFAULT 'card'::"text" NOT NULL,
    "cover_fees" boolean DEFAULT false NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "stripe_session_id" "text",
    "source" "text" DEFAULT 'friday_page'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "children" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "child_count" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "marketing"."beach_bash_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."free_friday_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "track" "text" NOT NULL,
    "agreement_signed" boolean DEFAULT false,
    "signature_name" "text",
    "enrolled_parent_name" "text",
    "enrolled_child_name" "text",
    "friend_child_name" "text",
    "friend_child_age" integer,
    "friend_parent_name" "text",
    "friend_parent_email" "text",
    "friend_parent_phone" "text",
    "track_a_emergency_name" "text",
    "track_a_emergency_phone" "text",
    "track_a_notes" "text",
    "track_a_photo_consent" boolean DEFAULT false,
    "parent_name" "text",
    "email" "text",
    "phone" "text",
    "child_name" "text",
    "child_age" integer,
    "referral_source" "text",
    "notes" "text",
    "emergency_name" "text",
    "emergency_phone" "text",
    "consent_outdoor" boolean DEFAULT false,
    "consent_photo" boolean DEFAULT false,
    "interested_in_enrollment" boolean DEFAULT false,
    "status" "text" DEFAULT 'new'::"text",
    "admin_notes" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "free_friday_registrations_track_check" CHECK (("track" = ANY (ARRAY['enrolled'::"text", 'new'::"text"])))
);


ALTER TABLE "marketing"."free_friday_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."info_session_rsvps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "children" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "programs" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "hear_about_us" "text",
    "questions" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "info_session_rsvps_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'attended'::"text", 'no_show'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "marketing"."info_session_rsvps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."meet_miss_joy_rsvps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "child_name" "text" NOT NULL,
    "child_age" integer NOT NULL,
    "adults_attending" "text" NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "marketing"."meet_miss_joy_rsvps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."open_house_rsvps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "adults_attending" integer NOT NULL,
    "children_attending" integer NOT NULL,
    "notes" "text",
    CONSTRAINT "open_house_rsvps_adults_attending_check" CHECK ((("adults_attending" >= 1) AND ("adults_attending" <= 10))),
    CONSTRAINT "open_house_rsvps_children_attending_check" CHECK ((("children_attending" >= 0) AND ("children_attending" <= 10)))
);


ALTER TABLE "marketing"."open_house_rsvps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."referral_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_name" "text" NOT NULL,
    "referrer_email" "text" NOT NULL,
    "referrer_phone" "text",
    "referred_name" "text" NOT NULL,
    "referred_email" "text" NOT NULL,
    "referred_phone" "text",
    "child_age" integer,
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "marketing"."referral_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."school_year_2026_commitments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "intent" "text" NOT NULL,
    "first_name" "text",
    "email" "text",
    "phone" "text",
    "children" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "contact_method" "text" DEFAULT 'email'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "program_type" "text",
    "notes" "text"
);


ALTER TABLE "marketing"."school_year_2026_commitments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."shadow_day_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "shadow_date" "date" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "child_name" "text" NOT NULL,
    "child_grade" "text",
    "referral_source" "text",
    "notes" "text",
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "child_age" integer,
    "emergency_name" "text",
    "emergency_phone" "text",
    "consent_outdoor" boolean DEFAULT false NOT NULL,
    "consent_photo" boolean DEFAULT false NOT NULL,
    "interested_in_enrollment" boolean DEFAULT false NOT NULL,
    "signature_name" "text",
    "source" "text" DEFAULT 'shadow_page'::"text"
);


ALTER TABLE "marketing"."shadow_day_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid",
    "parent_name" "text" NOT NULL,
    "parent_email" "text" NOT NULL,
    "child_name" "text" NOT NULL,
    "testimonial" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "gift_card_sent" boolean DEFAULT false NOT NULL,
    "admin_notes" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "feature_consent" "text",
    CONSTRAINT "testimonials_feature_consent_check" CHECK (("feature_consent" = ANY (ARRAY['yes'::"text", 'ask'::"text"]))),
    CONSTRAINT "testimonials_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'featured'::"text", 'declined'::"text"])))
);


ALTER TABLE "marketing"."testimonials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."tour_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "child_name" "text" NOT NULL,
    "child_grade" "text" NOT NULL,
    "num_children" integer DEFAULT 1 NOT NULL,
    "tour_date" "date" NOT NULL,
    "tour_time" "text" NOT NULL,
    "how_did_you_hear" "text" NOT NULL,
    "accommodations" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tour_bookings_child_grade_check" CHECK (("child_grade" = ANY (ARRAY['Pre-K'::"text", 'Kindergarten'::"text", '1st Grade'::"text", '2nd Grade'::"text", '3rd Grade'::"text", '4th Grade'::"text", '5th Grade'::"text", '6th Grade'::"text", '7th Grade'::"text", '8th Grade'::"text"]))),
    CONSTRAINT "tour_bookings_how_did_you_hear_check" CHECK (("how_did_you_hear" = ANY (ARRAY['google'::"text", 'social_media'::"text", 'friend_family'::"text", 'flyer'::"text", 'other'::"text"]))),
    CONSTRAINT "tour_bookings_num_children_check" CHECK ((("num_children" >= 1) AND ("num_children" <= 5))),
    CONSTRAINT "tour_bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'cancelled'::"text", 'completed'::"text", 'no_show'::"text"])))
);


ALTER TABLE "marketing"."tour_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "marketing"."tour_unavailability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unavailable_date" "date" NOT NULL,
    "unavailable_time" "text",
    "reason" "text",
    "is_recurring" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "booking_id" "uuid"
);


ALTER TABLE "marketing"."tour_unavailability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "messaging"."channel_members" (
    "channel_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_read_at" timestamp with time zone
);


ALTER TABLE "messaging"."channel_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "messaging"."channel_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "image_url" "text",
    "file_url" "text",
    "file_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "messaging"."channel_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "messaging"."channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "messaging"."channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "messaging"."conversation_participants" (
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "messaging"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "messaging"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "messaging"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "messaging"."message_reactions" (
    "message_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "messaging"."message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "messaging"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    "image_url" "text",
    "file_url" "text",
    "file_name" "text"
);


ALTER TABLE "messaging"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "newsletters"."change_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "newsletter_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "summary" "text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "newsletters"."change_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "newsletters"."newsletters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "week_range" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "view_mode" "text" DEFAULT 'traditional'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "published_at" timestamp with time zone,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "access_password" "text",
    "cover_image_path" "text",
    CONSTRAINT "newsletters_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"]))),
    CONSTRAINT "newsletters_view_mode_check" CHECK (("view_mode" = ANY (ARRAY['traditional'::"text", 'slideshow'::"text"])))
);


ALTER TABLE "newsletters"."newsletters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "newsletters"."section_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source_bucket" "text" DEFAULT 'newsletter-images'::"text" NOT NULL
);


ALTER TABLE "newsletters"."section_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "newsletters"."sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "newsletter_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "visible" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_class_updates" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "newsletters"."sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "newsletters"."teacher_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "body" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "newsletters"."teacher_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."activity_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "participation_level" "text" NOT NULL,
    "notes" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "activity_preferences_participation_level_check" CHECK (("participation_level" = ANY (ARRAY['watch'::"text", 'cook_no_eat'::"text", 'full'::"text"])))
);


ALTER TABLE "parent_app"."activity_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."application_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "parent_app"."application_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'not_started'::"text" NOT NULL,
    "program" "text",
    "child_legal_name" "text",
    "preferred_name" "text",
    "dob_month" "text",
    "dob_day" "text",
    "dob_year" "text",
    "child_age" integer,
    "child_grade" "text",
    "address_street" "text",
    "address_city" "text",
    "address_state" "text",
    "address_zip" "text",
    "household_phone" "text",
    "is_homeschooled" "text",
    "homeschool_explanation" "text",
    "previous_schools" "text",
    "previous_schools_list" "text",
    "special_interests" "text",
    "g1_full_name" "text",
    "g1_relationship" "text",
    "g1_relationship_other" "text",
    "g1_email" "text",
    "g1_cell_phone" "text",
    "g1_work_phone" "text",
    "g1_preferred_contact" "text",
    "g1_lives_with_child" "text",
    "g1_has_custody" "text",
    "g2_full_name" "text",
    "g2_relationship" "text",
    "g2_relationship_other" "text",
    "g2_email" "text",
    "g2_cell_phone" "text",
    "g2_work_phone" "text",
    "g2_preferred_contact" "text",
    "g2_lives_with_child" "text",
    "g2_has_custody" "text",
    "has_custody_orders" "text",
    "custody_orders_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "has_medical_conditions" "text",
    "medical_conditions_description" "text",
    "has_allergies" "text",
    "allergies_description" "text",
    "has_emergency_medications" "text",
    "emergency_medications_description" "text",
    "history_flags" "text",
    "history_explanation" "text",
    "needs_aide" "text",
    "needs_aide_description" "text",
    "learning_style" "text",
    "strengths_interests" "text",
    "current_challenges" "text",
    "dysregulation_response" "text",
    "regulation_strategies" "text",
    "activities_to_avoid" "text",
    "g1_signature_name" "text",
    "g1_signature" "text",
    "g1_signature_date" "text",
    "g2_signature_name" "text",
    "g2_signature" "text",
    "g2_signature_date" "text",
    "approved" boolean DEFAULT false NOT NULL,
    "approved_at" timestamp with time zone,
    "denied" boolean DEFAULT false NOT NULL,
    "denied_at" timestamp with time zone,
    "denied_reason" "text",
    "student_id" "uuid",
    "registration_fee_paid" boolean DEFAULT false,
    "admin_notes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "drop_in_program" "text",
    "admin_tags" "text"[] DEFAULT '{}'::"text"[],
    "referred_by" "uuid"
);


ALTER TABLE "parent_app"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."dashboard_access_grants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "invited_email" "text" NOT NULL,
    "grantee_id" "uuid",
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "dashboard_access_grants_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'revoked'::"text"])))
);


ALTER TABLE "parent_app"."dashboard_access_grants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."dropoff_times" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "slot" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "parent_app"."dropoff_times" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."enrollment_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "contract_id" integer NOT NULL,
    "section_id" integer NOT NULL,
    "printed_name" "text" NOT NULL,
    "signature" "text" NOT NULL,
    "signed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "parent_app"."enrollment_signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."onboarding_checklist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "completed" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "parent_app"."onboarding_checklist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_email" "text",
    "referred_user_id" "uuid",
    "application_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "parent_app"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."student_authorized_pickup_persons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "full_name" "text" NOT NULL,
    "relationship" "text",
    "phone" "text",
    "email" "text",
    "dl_state_id_number" "text",
    "vehicle_info" "text",
    "license_plate_state" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "parent_app"."student_authorized_pickup_persons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."student_authorized_pickup_plan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "date_of_request" "text",
    "effective_until" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "parent_app"."student_authorized_pickup_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."student_default_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "participation_level" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "student_default_preferences_participation_level_check" CHECK (("participation_level" = ANY (ARRAY['watch'::"text", 'cook_no_eat'::"text", 'full'::"text"])))
);


ALTER TABLE "parent_app"."student_default_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."student_health_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "in_state_contact_name" "text",
    "in_state_contact_relation" "text",
    "in_state_contact_phone" "text",
    "out_of_state_contact_name" "text",
    "out_of_state_contact_relation" "text",
    "out_of_state_contact_phone" "text",
    "physician_name" "text",
    "clinic_name" "text",
    "physician_phone" "text",
    "insurance_provider" "text",
    "policy_number" "text",
    "group_number" "text",
    "preferred_hospital" "text",
    "health_conditions" "text",
    "ongoing_care" boolean DEFAULT false,
    "ongoing_care_description" "text",
    "emergency_medication_required" boolean DEFAULT false,
    "emergency_medication_description" "text",
    "immunization_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "student_health_info_immunization_status_check" CHECK (("immunization_status" = ANY (ARRAY['record'::"text", 'exemption'::"text"])))
);


ALTER TABLE "parent_app"."student_health_info" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."student_health_statement" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "option_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "student_health_statement_option_type_check" CHECK (("option_type" = ANY (ARRAY['professional'::"text", 'religious'::"text"])))
);


ALTER TABLE "parent_app"."student_health_statement" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."student_learning_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "note_text" "text" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "student_learning_notes_category_check" CHECK (("category" = ANY (ARRAY['academic'::"text", 'social'::"text", 'behavioral'::"text", 'health'::"text", 'other'::"text"])))
);


ALTER TABLE "parent_app"."student_learning_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."student_medication_plan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "emergency_procedure" "text",
    "special_instructions" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "parent_app"."student_medication_plan" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."student_medications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "medication_name" "text" NOT NULL,
    "condition_reason" "text",
    "dosage_frequency" "text",
    "physician_name" "text",
    "physician_phone" "text",
    "expiration_date" "text",
    "is_daily" boolean DEFAULT false,
    "is_emergency_only" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "parent_app"."student_medications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "parent_app"."student_photo_release_consent" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "consent_level" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "student_photo_release_consent_consent_level_check" CHECK (("consent_level" = ANY (ARRAY['FULL'::"text", 'LIMITED'::"text", 'NO'::"text"])))
);


ALTER TABLE "parent_app"."student_photo_release_consent" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "reels"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reel_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "reels"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "reels"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "caption" "text" DEFAULT ''::"text" NOT NULL,
    "storage_url" "text",
    "duration_secs" integer,
    "school_year" "text" DEFAULT '2025-2026'::"text" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "reels"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "reels"."reactions" (
    "reel_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL
);


ALTER TABLE "reels"."reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "includes_food" boolean DEFAULT false NOT NULL,
    "created_by" "uuid" NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "visibility" "text" DEFAULT 'private'::"text" NOT NULL,
    "activity_date" "date",
    CONSTRAINT "activities_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"]))),
    CONSTRAINT "activities_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text"])))
);


ALTER TABLE "teachers"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."activity_change_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "summary" "text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "teachers"."activity_change_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."activity_food_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "food_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "teachers"."activity_food_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."activity_foods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "allergens" "text"
);


ALTER TABLE "teachers"."activity_foods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."activity_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "teachers"."activity_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."activity_ingredient_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "teachers"."activity_ingredient_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."activity_ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "food_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "teachers"."activity_ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."clock_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "clock_in_at" timestamp with time zone NOT NULL,
    "clock_out_at" timestamp with time zone,
    "note" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "teachers"."clock_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."paystubs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "total_hours" numeric(8,2) NOT NULL,
    "hourly_rate_snapshot" numeric(8,2) NOT NULL,
    "gross_pay" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "approved_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "admin_note" "text",
    CONSTRAINT "paystubs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'paid'::"text"])))
);


ALTER TABLE "teachers"."paystubs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."photo_student_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "photo_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "teachers"."photo_student_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "caption" "text",
    "taken_on" "date",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "publication_labels" "text"[] DEFAULT '{}'::"text"[] NOT NULL
);


ALTER TABLE "teachers"."photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."teacher_experience" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "place" "text" NOT NULL,
    "period" "text" NOT NULL,
    "is_current" boolean DEFAULT false NOT NULL,
    "detail" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "teachers"."teacher_experience" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."teacher_note_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "note_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "teacher_note_attachments_file_type_check" CHECK (("file_type" = ANY (ARRAY['image'::"text", 'file'::"text"])))
);


ALTER TABLE "teachers"."teacher_note_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."teacher_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "note_text" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "is_shared" boolean DEFAULT false NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "teacher_notes_category_check" CHECK (("category" = ANY (ARRAY['general'::"text", 'behavioral'::"text", 'academic'::"text", 'social'::"text", 'health'::"text"])))
);


ALTER TABLE "teachers"."teacher_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."teacher_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bio" "text",
    "quote" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "years_experience" "text",
    "grade_range" "text"
);


ALTER TABLE "teachers"."teacher_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."teacher_qualifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "icon" "text" DEFAULT 'school-outline'::"text" NOT NULL,
    "text" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "teachers"."teacher_qualifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "teachers"."teacher_students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "program" "text" NOT NULL,
    "classroom" "text",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "teachers"."teacher_students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "waitlist"."submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "child_name" "text" NOT NULL,
    "child_age" integer NOT NULL,
    "special_interests" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "parent_name" "text" NOT NULL,
    "program_interest" "text" NOT NULL,
    "notes" "text",
    "phone" character varying,
    "status" "public"."lead_status" DEFAULT 'not_contacted'::"public"."lead_status",
    "is_deleted" boolean DEFAULT false NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "call_notes" "text",
    CONSTRAINT "submissions_child_age_check" CHECK ((("child_age" >= 1) AND ("child_age" <= 18))),
    CONSTRAINT "submissions_program_interest_check" CHECK (("program_interest" = ANY (ARRAY['summer-2026'::"text", 'school-year-2026'::"text", 'both'::"text", 'homeschool_drop_in'::"text"])))
);


ALTER TABLE "waitlist"."submissions" OWNER TO "postgres";


ALTER TABLE ONLY "admin"."android_download_requests"
    ADD CONSTRAINT "android_download_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "admin"."development_tasks"
    ADD CONSTRAINT "development_tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "admin"."help_requests"
    ADD CONSTRAINT "help_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "admin"."parent_feedback"
    ADD CONSTRAINT "parent_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "admin"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "admin"."tuition_feedback"
    ADD CONSTRAINT "tuition_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "admin"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "admin"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "admin"."users"
    ADD CONSTRAINT "users_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "admin"."volunteer_interests"
    ADD CONSTRAINT "volunteer_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "attendance"."aftercare_records"
    ADD CONSTRAINT "aftercare_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "attendance"."aftercare_records"
    ADD CONSTRAINT "aftercare_records_student_date_unique" UNIQUE ("student_id", "date");



ALTER TABLE ONLY "attendance"."check_ins"
    ADD CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "attendance"."field_friday_records"
    ADD CONSTRAINT "field_friday_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "attendance"."field_friday_records"
    ADD CONSTRAINT "field_friday_records_student_id_date_key" UNIQUE ("student_id", "date");



ALTER TABLE ONLY "attendance"."summer_records"
    ADD CONSTRAINT "summer_records_date_student_id_key" UNIQUE ("date", "student_id");



ALTER TABLE ONLY "attendance"."summer_records"
    ADD CONSTRAINT "summer_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "billing"."homeschool_day_commitments"
    ADD CONSTRAINT "homeschool_day_commitments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "billing"."homeschool_day_commitments"
    ADD CONSTRAINT "homeschool_day_commitments_unique" UNIQUE ("parent_id", "student_id", "application_id");



ALTER TABLE ONLY "billing"."one_time_payments"
    ADD CONSTRAINT "one_time_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "billing"."pending_payment_requests"
    ADD CONSTRAINT "pending_payment_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "billing"."stripe_transactions"
    ADD CONSTRAINT "stripe_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "billing"."stripe_transactions"
    ADD CONSTRAINT "stripe_transactions_stripe_session_id_key" UNIQUE ("stripe_session_id");



ALTER TABLE ONLY "billing"."summer_week_commitments"
    ADD CONSTRAINT "summer_week_commitments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "billing"."summer_week_commitments"
    ADD CONSTRAINT "summer_week_commitments_unique" UNIQUE ("parent_id", "student_id", "application_id");



ALTER TABLE ONLY "billing"."tuition_codes"
    ADD CONSTRAINT "tuition_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "billing"."tuition_codes"
    ADD CONSTRAINT "tuition_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "blogs"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "blogs"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "budget"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "budget"."income"
    ADD CONSTRAINT "income_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "budget"."line_items"
    ADD CONSTRAINT "line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "budget"."settings"
    ADD CONSTRAINT "settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "budget"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "calendar"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "care_log"."entries"
    ADD CONSTRAINT "entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "contact"."account_deletion_requests"
    ADD CONSTRAINT "account_deletion_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "contact"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "contracts"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "contracts"."history"
    ADD CONSTRAINT "history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "donations"."donations"
    ADD CONSTRAINT "donations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "donations"."donations"
    ADD CONSTRAINT "donations_stripe_session_id_key" UNIQUE ("stripe_session_id");



ALTER TABLE ONLY "email_logs"."sends"
    ADD CONSTRAINT "sends_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "feed"."post_attachments"
    ADD CONSTRAINT "post_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "feed"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "feed"."post_media"
    ADD CONSTRAINT "post_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "feed"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "feed"."post_reactions"
    ADD CONSTRAINT "uq_post_reactions_per_user_per_emoji" UNIQUE ("post_id", "user_id", "emoji");



ALTER TABLE ONLY "inventory"."history_events"
    ADD CONSTRAINT "history_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "inventory"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "inventory"."photos"
    ADD CONSTRAINT "photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "inventory"."shopping_requests"
    ADD CONSTRAINT "shopping_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."beach_bash_registrations"
    ADD CONSTRAINT "beach_bash_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."free_friday_registrations"
    ADD CONSTRAINT "free_friday_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."info_session_rsvps"
    ADD CONSTRAINT "info_session_rsvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."meet_miss_joy_rsvps"
    ADD CONSTRAINT "meet_miss_joy_rsvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."open_house_rsvps"
    ADD CONSTRAINT "open_house_rsvps_email_key" UNIQUE ("email");



ALTER TABLE ONLY "marketing"."open_house_rsvps"
    ADD CONSTRAINT "open_house_rsvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."referral_submissions"
    ADD CONSTRAINT "referral_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."school_year_2026_commitments"
    ADD CONSTRAINT "school_year_2026_commitments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."shadow_day_bookings"
    ADD CONSTRAINT "shadow_day_bookings_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "marketing"."shadow_day_bookings"
    ADD CONSTRAINT "shadow_day_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."shadow_day_bookings"
    ADD CONSTRAINT "shadow_day_bookings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "marketing"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."tour_bookings"
    ADD CONSTRAINT "tour_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "marketing"."tour_unavailability"
    ADD CONSTRAINT "tour_unavailability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "messaging"."channel_members"
    ADD CONSTRAINT "channel_members_pkey" PRIMARY KEY ("channel_id", "user_id");



ALTER TABLE ONLY "messaging"."channel_messages"
    ADD CONSTRAINT "channel_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "messaging"."channels"
    ADD CONSTRAINT "channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "messaging"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id", "user_id");



ALTER TABLE ONLY "messaging"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "messaging"."message_reactions"
    ADD CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("message_id", "user_id", "emoji");



ALTER TABLE ONLY "messaging"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "newsletters"."change_log"
    ADD CONSTRAINT "change_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "newsletters"."newsletters"
    ADD CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "newsletters"."section_images"
    ADD CONSTRAINT "section_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "newsletters"."sections"
    ADD CONSTRAINT "sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "newsletters"."teacher_updates"
    ADD CONSTRAINT "teacher_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "newsletters"."teacher_updates"
    ADD CONSTRAINT "teacher_updates_section_id_teacher_id_key" UNIQUE ("section_id", "teacher_id");



ALTER TABLE ONLY "parent_app"."activity_preferences"
    ADD CONSTRAINT "activity_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."activity_preferences"
    ADD CONSTRAINT "activity_preferences_student_id_activity_id_key" UNIQUE ("student_id", "activity_id");



ALTER TABLE ONLY "parent_app"."application_notes"
    ADD CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."dashboard_access_grants"
    ADD CONSTRAINT "dashboard_access_grants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."dropoff_times"
    ADD CONSTRAINT "dropoff_times_parent_id_key" UNIQUE ("parent_id");



ALTER TABLE ONLY "parent_app"."dropoff_times"
    ADD CONSTRAINT "dropoff_times_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."enrollment_signatures"
    ADD CONSTRAINT "enrollment_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."onboarding_checklist"
    ADD CONSTRAINT "onboarding_checklist_parent_id_key" UNIQUE ("parent_id");



ALTER TABLE ONLY "parent_app"."onboarding_checklist"
    ADD CONSTRAINT "onboarding_checklist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."student_authorized_pickup_persons"
    ADD CONSTRAINT "student_authorized_pickup_persons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."student_authorized_pickup_plan"
    ADD CONSTRAINT "student_authorized_pickup_plan_parent_id_student_id_key" UNIQUE ("parent_id", "student_id");



ALTER TABLE ONLY "parent_app"."student_authorized_pickup_plan"
    ADD CONSTRAINT "student_authorized_pickup_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."student_default_preferences"
    ADD CONSTRAINT "student_default_preferences_parent_id_student_id_key" UNIQUE ("parent_id", "student_id");



ALTER TABLE ONLY "parent_app"."student_default_preferences"
    ADD CONSTRAINT "student_default_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."student_health_info"
    ADD CONSTRAINT "student_health_info_parent_id_student_id_key" UNIQUE ("parent_id", "student_id");



ALTER TABLE ONLY "parent_app"."student_health_info"
    ADD CONSTRAINT "student_health_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."student_health_statement"
    ADD CONSTRAINT "student_health_statement_parent_id_student_id_key" UNIQUE ("parent_id", "student_id");



ALTER TABLE ONLY "parent_app"."student_health_statement"
    ADD CONSTRAINT "student_health_statement_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."student_learning_notes"
    ADD CONSTRAINT "student_learning_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."student_medication_plan"
    ADD CONSTRAINT "student_medication_plan_parent_id_student_id_key" UNIQUE ("parent_id", "student_id");



ALTER TABLE ONLY "parent_app"."student_medication_plan"
    ADD CONSTRAINT "student_medication_plan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."student_medications"
    ADD CONSTRAINT "student_medications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."student_photo_release_consent"
    ADD CONSTRAINT "student_photo_release_consent_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "parent_app"."enrollment_signatures"
    ADD CONSTRAINT "uq_enrollment_signature" UNIQUE ("parent_id", "student_id", "contract_id", "section_id");



ALTER TABLE ONLY "parent_app"."dashboard_access_grants"
    ADD CONSTRAINT "uq_owner_email" UNIQUE ("owner_id", "invited_email");



ALTER TABLE ONLY "parent_app"."student_photo_release_consent"
    ADD CONSTRAINT "uq_photo_release_consent" UNIQUE ("parent_id", "student_id");



ALTER TABLE ONLY "reels"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "reels"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "reels"."reactions"
    ADD CONSTRAINT "reactions_pkey" PRIMARY KEY ("reel_id", "user_id", "emoji");



ALTER TABLE ONLY "teachers"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."activity_change_log"
    ADD CONSTRAINT "activity_change_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."activity_food_images"
    ADD CONSTRAINT "activity_food_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."activity_foods"
    ADD CONSTRAINT "activity_foods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."activity_images"
    ADD CONSTRAINT "activity_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."activity_ingredient_images"
    ADD CONSTRAINT "activity_ingredient_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."activity_ingredients"
    ADD CONSTRAINT "activity_ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."clock_sessions"
    ADD CONSTRAINT "clock_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."paystubs"
    ADD CONSTRAINT "paystubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."paystubs"
    ADD CONSTRAINT "paystubs_teacher_id_period_start_period_end_key" UNIQUE ("teacher_id", "period_start", "period_end");



ALTER TABLE ONLY "teachers"."photo_student_tags"
    ADD CONSTRAINT "photo_student_tags_photo_id_student_id_key" UNIQUE ("photo_id", "student_id");



ALTER TABLE ONLY "teachers"."photo_student_tags"
    ADD CONSTRAINT "photo_student_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."photos"
    ADD CONSTRAINT "photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."teacher_experience"
    ADD CONSTRAINT "teacher_experience_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."teacher_note_attachments"
    ADD CONSTRAINT "teacher_note_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."teacher_notes"
    ADD CONSTRAINT "teacher_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."teacher_profiles"
    ADD CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."teacher_profiles"
    ADD CONSTRAINT "teacher_profiles_user_id_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "teachers"."teacher_qualifications"
    ADD CONSTRAINT "teacher_qualifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."teacher_students"
    ADD CONSTRAINT "teacher_students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "teachers"."teacher_students"
    ADD CONSTRAINT "teacher_students_teacher_id_student_id_school_year_key" UNIQUE ("teacher_id", "student_id", "program");



ALTER TABLE ONLY "waitlist"."submissions"
    ADD CONSTRAINT "submissions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_students_is_deleted" ON "admin"."students" USING "btree" ("is_deleted");



CREATE UNIQUE INDEX "idx_admin_users_employee_code" ON "admin"."users" USING "btree" ("employee_code") WHERE ("employee_code" IS NOT NULL);



CREATE INDEX "idx_admin_users_is_deleted" ON "admin"."users" USING "btree" ("is_deleted");



CREATE INDEX "idx_admin_users_push_token" ON "admin"."users" USING "btree" ("push_token") WHERE ("push_token" IS NOT NULL);



CREATE INDEX "idx_users_stripe_customer_id" ON "admin"."users" USING "btree" ("stripe_customer_id") WHERE ("stripe_customer_id" IS NOT NULL);



CREATE INDEX "idx_aftercare_records_date" ON "attendance"."aftercare_records" USING "btree" ("date");



CREATE INDEX "idx_aftercare_records_recorded_by" ON "attendance"."aftercare_records" USING "btree" ("recorded_by");



CREATE INDEX "idx_aftercare_records_student_id" ON "attendance"."aftercare_records" USING "btree" ("student_id");



CREATE INDEX "idx_check_ins_open" ON "attendance"."check_ins" USING "btree" ("checked_out_at") WHERE (("checked_out_at" IS NULL) AND ("is_deleted" = false));



CREATE INDEX "idx_check_ins_student_date" ON "attendance"."check_ins" USING "btree" ("student_id", "checked_in_at" DESC);



CREATE INDEX "idx_summer_records_date" ON "attendance"."summer_records" USING "btree" ("date");



CREATE INDEX "idx_summer_records_student" ON "attendance"."summer_records" USING "btree" ("student_id");



CREATE INDEX "homeschool_day_commitments_parent_id_idx" ON "billing"."homeschool_day_commitments" USING "btree" ("parent_id");



CREATE INDEX "homeschool_day_commitments_student_id_idx" ON "billing"."homeschool_day_commitments" USING "btree" ("student_id");



CREATE INDEX "one_time_payments_email_idx" ON "billing"."one_time_payments" USING "btree" ("payer_email");



CREATE INDEX "one_time_payments_session_idx" ON "billing"."one_time_payments" USING "btree" ("stripe_session_id");



CREATE INDEX "stripe_transactions_created_at_idx" ON "billing"."stripe_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "stripe_transactions_parent_id_idx" ON "billing"."stripe_transactions" USING "btree" ("parent_id");



CREATE INDEX "stripe_transactions_payer_email_idx" ON "billing"."stripe_transactions" USING "btree" ("payer_email");



CREATE INDEX "stripe_transactions_payment_type_idx" ON "billing"."stripe_transactions" USING "btree" ("payment_type");



CREATE INDEX "stripe_transactions_student_id_idx" ON "billing"."stripe_transactions" USING "btree" ("student_id");



CREATE INDEX "summer_week_commitments_parent_id_idx" ON "billing"."summer_week_commitments" USING "btree" ("parent_id");



CREATE INDEX "summer_week_commitments_student_id_idx" ON "billing"."summer_week_commitments" USING "btree" ("student_id");



CREATE INDEX "tuition_codes_lower_idx" ON "billing"."tuition_codes" USING "btree" ("lower"("code"));



CREATE INDEX "idx_blog_posts_created_at" ON "blogs"."blog_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_blog_posts_created_by" ON "blogs"."blog_posts" USING "btree" ("created_by");



CREATE INDEX "idx_blog_posts_slug" ON "blogs"."blog_posts" USING "btree" ("slug") WHERE ("is_deleted" = false);



CREATE INDEX "idx_blog_posts_status" ON "blogs"."blog_posts" USING "btree" ("status") WHERE ("is_deleted" = false);



CREATE INDEX "expenses_is_deleted_idx" ON "budget"."expenses" USING "btree" ("is_deleted");



CREATE INDEX "idx_budget_expenses_category" ON "budget"."expenses" USING "btree" ("category");



CREATE INDEX "idx_budget_expenses_date" ON "budget"."expenses" USING "btree" ("expense_date" DESC);



CREATE INDEX "idx_budget_income_date" ON "budget"."income" USING "btree" ("income_date" DESC);



CREATE INDEX "idx_budget_income_source" ON "budget"."income" USING "btree" ("source");



CREATE INDEX "idx_budget_line_items_category" ON "budget"."line_items" USING "btree" ("category");



CREATE INDEX "idx_budget_line_items_sort" ON "budget"."line_items" USING "btree" ("sort_order");



CREATE INDEX "idx_care_log_entries_date" ON "care_log"."entries" USING "btree" ("date");



CREATE INDEX "idx_care_log_entries_student_date" ON "care_log"."entries" USING "btree" ("student_id", "date");



CREATE INDEX "idx_contact_submissions_created_at" ON "contact"."submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_contact_submissions_email" ON "contact"."submissions" USING "btree" ("email");



CREATE INDEX "idx_contact_submissions_is_deleted" ON "contact"."submissions" USING "btree" ("is_deleted");



CREATE INDEX "idx_donations_created_at" ON "donations"."donations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_donations_email" ON "donations"."donations" USING "btree" ("donor_email");



CREATE INDEX "idx_donations_stripe_session" ON "donations"."donations" USING "btree" ("stripe_session_id");



CREATE INDEX "idx_feed_post_attachments_post_id" ON "feed"."post_attachments" USING "btree" ("post_id");



CREATE INDEX "idx_feed_post_comments_author_id" ON "feed"."post_comments" USING "btree" ("author_id");



CREATE INDEX "idx_feed_post_comments_is_deleted" ON "feed"."post_comments" USING "btree" ("is_deleted");



CREATE INDEX "idx_feed_post_comments_post_id" ON "feed"."post_comments" USING "btree" ("post_id", "created_at");



CREATE INDEX "idx_feed_post_media_post_id" ON "feed"."post_media" USING "btree" ("post_id", "display_order");



CREATE INDEX "idx_feed_post_reactions_post_id" ON "feed"."post_reactions" USING "btree" ("post_id");



CREATE INDEX "idx_feed_post_reactions_user_id" ON "feed"."post_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_feed_posts_classroom_school_year" ON "feed"."posts" USING "btree" ("classroom", "school_year");



CREATE INDEX "idx_feed_posts_created_at" ON "feed"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_feed_posts_feed_mode" ON "feed"."posts" USING "btree" ("feed_mode") WHERE ("is_deleted" = false);



CREATE INDEX "idx_feed_posts_is_deleted" ON "feed"."posts" USING "btree" ("is_deleted");



CREATE INDEX "idx_feed_posts_teacher_id" ON "feed"."posts" USING "btree" ("teacher_id");



CREATE INDEX "idx_inventory_history_item_id" ON "inventory"."history_events" USING "btree" ("item_id", "created_at" DESC);



CREATE INDEX "idx_inventory_items_category" ON "inventory"."items" USING "btree" ("category") WHERE ("is_deleted" = false);



CREATE INDEX "idx_inventory_items_created_at" ON "inventory"."items" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_inventory_items_is_deleted" ON "inventory"."items" USING "btree" ("is_deleted");



CREATE INDEX "idx_inventory_items_status" ON "inventory"."items" USING "btree" ("status") WHERE ("is_deleted" = false);



CREATE INDEX "idx_inventory_photos_item_id" ON "inventory"."photos" USING "btree" ("item_id") WHERE ("is_deleted" = false);



CREATE INDEX "idx_inventory_shopping_item_id" ON "inventory"."shopping_requests" USING "btree" ("item_id") WHERE ("is_deleted" = false);



CREATE INDEX "idx_inventory_shopping_status" ON "inventory"."shopping_requests" USING "btree" ("status") WHERE ("is_deleted" = false);



CREATE INDEX "idx_marketing_beach_bash_created_at" ON "marketing"."beach_bash_registrations" USING "btree" ("created_at");



CREATE INDEX "idx_marketing_beach_bash_email" ON "marketing"."beach_bash_registrations" USING "btree" ("email");



CREATE INDEX "idx_marketing_beach_bash_payment_status" ON "marketing"."beach_bash_registrations" USING "btree" ("payment_status");



CREATE INDEX "idx_marketing_info_session_rsvps_created_at" ON "marketing"."info_session_rsvps" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_marketing_info_session_rsvps_email" ON "marketing"."info_session_rsvps" USING "btree" ("email");



CREATE INDEX "idx_marketing_info_session_rsvps_is_deleted" ON "marketing"."info_session_rsvps" USING "btree" ("is_deleted");



CREATE INDEX "idx_marketing_tour_bookings_created_at" ON "marketing"."tour_bookings" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_marketing_tour_bookings_email" ON "marketing"."tour_bookings" USING "btree" ("email");



CREATE INDEX "idx_marketing_tour_bookings_is_deleted" ON "marketing"."tour_bookings" USING "btree" ("is_deleted");



CREATE INDEX "idx_marketing_tour_bookings_status" ON "marketing"."tour_bookings" USING "btree" ("status");



CREATE INDEX "idx_marketing_tour_bookings_tour_date" ON "marketing"."tour_bookings" USING "btree" ("tour_date");



CREATE INDEX "idx_marketing_tour_unavailability_date" ON "marketing"."tour_unavailability" USING "btree" ("unavailable_date");



CREATE INDEX "idx_tour_unavailability_booking_id" ON "marketing"."tour_unavailability" USING "btree" ("booking_id");



CREATE INDEX "testimonials_created_at_idx" ON "marketing"."testimonials" USING "btree" ("created_at" DESC);



CREATE INDEX "testimonials_parent_id_idx" ON "marketing"."testimonials" USING "btree" ("parent_id");



CREATE INDEX "testimonials_status_idx" ON "marketing"."testimonials" USING "btree" ("status");



CREATE INDEX "channel_members_user_id_idx" ON "messaging"."channel_members" USING "btree" ("user_id");



CREATE INDEX "channel_messages_channel_id_created_at_idx" ON "messaging"."channel_messages" USING "btree" ("channel_id", "created_at");



CREATE INDEX "message_reactions_message_id_idx" ON "messaging"."message_reactions" USING "btree" ("message_id");



CREATE INDEX "messages_conversation_id_created_at_idx" ON "messaging"."messages" USING "btree" ("conversation_id", "created_at");



CREATE INDEX "idx_newsletters_created_at" ON "newsletters"."newsletters" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_newsletters_created_by" ON "newsletters"."newsletters" USING "btree" ("created_by");



CREATE INDEX "idx_newsletters_is_deleted" ON "newsletters"."newsletters" USING "btree" ("is_deleted");



CREATE INDEX "idx_newsletters_status" ON "newsletters"."newsletters" USING "btree" ("status") WHERE ("is_deleted" = false);



CREATE INDEX "idx_nl_change_log_nl_id" ON "newsletters"."change_log" USING "btree" ("newsletter_id", "created_at" DESC);



CREATE INDEX "idx_nl_section_images_section_id" ON "newsletters"."section_images" USING "btree" ("section_id") WHERE ("is_deleted" = false);



CREATE INDEX "idx_nl_sections_newsletter_id" ON "newsletters"."sections" USING "btree" ("newsletter_id");



CREATE INDEX "idx_nl_sections_sort_order" ON "newsletters"."sections" USING "btree" ("newsletter_id", "sort_order");



CREATE INDEX "idx_nl_teacher_updates_sec" ON "newsletters"."teacher_updates" USING "btree" ("section_id");



CREATE INDEX "applications_user_id_idx" ON "parent_app"."applications" USING "btree" ("user_id");



CREATE INDEX "idx_dag_grantee" ON "parent_app"."dashboard_access_grants" USING "btree" ("grantee_id");



CREATE INDEX "idx_dag_owner" ON "parent_app"."dashboard_access_grants" USING "btree" ("owner_id");



CREATE INDEX "idx_dag_token" ON "parent_app"."dashboard_access_grants" USING "btree" ("token") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_enrollment_signatures_lookup" ON "parent_app"."enrollment_signatures" USING "btree" ("parent_id", "student_id", "contract_id");



CREATE INDEX "idx_parent_app_referrals_referrer_id" ON "parent_app"."referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_parent_app_referrals_status" ON "parent_app"."referrals" USING "btree" ("status");



CREATE INDEX "student_learning_notes_student_id_created_at_idx" ON "parent_app"."student_learning_notes" USING "btree" ("student_id", "created_at" DESC);



CREATE INDEX "idx_reels_posts_created" ON "reels"."posts" USING "btree" ("created_at" DESC) WHERE ("is_deleted" = false);



CREATE INDEX "idx_clock_sessions_clock_in_at" ON "teachers"."clock_sessions" USING "btree" ("clock_in_at");



CREATE INDEX "idx_clock_sessions_teacher_id" ON "teachers"."clock_sessions" USING "btree" ("teacher_id");



CREATE INDEX "idx_paystubs_period_start" ON "teachers"."paystubs" USING "btree" ("period_start" DESC);



CREATE INDEX "idx_paystubs_status" ON "teachers"."paystubs" USING "btree" ("status");



CREATE INDEX "idx_paystubs_teacher_id" ON "teachers"."paystubs" USING "btree" ("teacher_id");



CREATE INDEX "idx_teacher_note_attachments_note_id" ON "teachers"."teacher_note_attachments" USING "btree" ("note_id");



CREATE INDEX "idx_teacher_notes_is_deleted" ON "teachers"."teacher_notes" USING "btree" ("is_deleted");



CREATE INDEX "idx_teacher_notes_student_id" ON "teachers"."teacher_notes" USING "btree" ("student_id");



CREATE INDEX "idx_teacher_notes_teacher_id" ON "teachers"."teacher_notes" USING "btree" ("teacher_id");



CREATE INDEX "idx_teacher_students_is_deleted" ON "teachers"."teacher_students" USING "btree" ("is_deleted");



CREATE INDEX "idx_teacher_students_student_id" ON "teachers"."teacher_students" USING "btree" ("student_id");



CREATE INDEX "idx_teacher_students_teacher_id" ON "teachers"."teacher_students" USING "btree" ("teacher_id");



CREATE INDEX "photo_student_tags_photo_id_idx" ON "teachers"."photo_student_tags" USING "btree" ("photo_id");



CREATE INDEX "photo_student_tags_student_id_idx" ON "teachers"."photo_student_tags" USING "btree" ("student_id");



CREATE INDEX "photos_created_at_idx" ON "teachers"."photos" USING "btree" ("created_at" DESC) WHERE (NOT "is_deleted");



CREATE INDEX "photos_teacher_id_idx" ON "teachers"."photos" USING "btree" ("teacher_id") WHERE (NOT "is_deleted");



CREATE INDEX "idx_waitlist_submissions_created_at" ON "waitlist"."submissions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_waitlist_submissions_email" ON "waitlist"."submissions" USING "btree" ("email");



CREATE INDEX "idx_waitlist_submissions_is_deleted" ON "waitlist"."submissions" USING "btree" ("is_deleted");



CREATE OR REPLACE TRIGGER "update_admin_users_updated_at" BEFORE UPDATE ON "admin"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "aftercare_records_updated_at" BEFORE UPDATE ON "attendance"."aftercare_records" FOR EACH ROW EXECUTE FUNCTION "attendance"."set_aftercare_updated_at"();



CREATE OR REPLACE TRIGGER "homeschool_day_commitments_updated_at" BEFORE UPDATE ON "billing"."homeschool_day_commitments" FOR EACH ROW EXECUTE FUNCTION "billing"."set_updated_at"();



CREATE OR REPLACE TRIGGER "stripe_transactions_updated_at" BEFORE UPDATE ON "billing"."stripe_transactions" FOR EACH ROW EXECUTE FUNCTION "billing"."set_updated_at"();



CREATE OR REPLACE TRIGGER "summer_week_commitments_updated_at" BEFORE UPDATE ON "billing"."summer_week_commitments" FOR EACH ROW EXECUTE FUNCTION "billing"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_blog_posts_updated_at" BEFORE UPDATE ON "blogs"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_expenses_updated_at" BEFORE UPDATE ON "budget"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_income_updated_at" BEFORE UPDATE ON "budget"."income" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_line_items_updated_at" BEFORE UPDATE ON "budget"."line_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_settings_updated_at" BEFORE UPDATE ON "budget"."settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_calendar_events_updated_at" BEFORE UPDATE ON "calendar"."events" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contact_submissions_updated_at" BEFORE UPDATE ON "contact"."submissions" FOR EACH ROW EXECUTE FUNCTION "contact"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "donations"."donations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "feed-post-notification" AFTER INSERT ON "feed"."posts" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://vonuwpzepwrbdlectspd.supabase.co/functions/v1/send-feed-notification', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbnV3cHplcHdyYmRsZWN0c3BkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI0OTQ1MCwiZXhwIjoyMDg3ODI1NDUwfQ.3WsQFnDPv-gfhYhGvCMGAOHvWhIrdGDZVgZhIT8SnfU","x-webhook-secret":"sagefield"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "set_feed_post_comments_updated_at" BEFORE UPDATE ON "feed"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_feed_posts_updated_at" BEFORE UPDATE ON "feed"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_inventory_items_updated_at" BEFORE UPDATE ON "inventory"."items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_inventory_shopping_requests_updated_at" BEFORE UPDATE ON "inventory"."shopping_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_info_session_rsvps_updated_at" BEFORE UPDATE ON "marketing"."info_session_rsvps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_tour_bookings_updated_at" BEFORE UPDATE ON "marketing"."tour_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_tour_unavailability_updated_at" BEFORE UPDATE ON "marketing"."tour_unavailability" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "marketing"."meet_miss_joy_rsvps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "testimonials_updated_at" BEFORE UPDATE ON "marketing"."testimonials" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "send-message-notification" AFTER INSERT ON "messaging"."messages" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://vonuwpzepwrbdlectspd.supabase.co/functions/v1/send-message-notification', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbnV3cHplcHdyYmRsZWN0c3BkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI0OTQ1MCwiZXhwIjoyMDg3ODI1NDUwfQ.3WsQFnDPv-gfhYhGvCMGAOHvWhIrdGDZVgZhIT8SnfU","x-webhook-secret":"sagefield"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "set_newsletters_sections_updated_at" BEFORE UPDATE ON "newsletters"."sections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_newsletters_teacher_updates_updated_at" BEFORE UPDATE ON "newsletters"."teacher_updates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_newsletters_updated_at" BEFORE UPDATE ON "newsletters"."newsletters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_activity_preferences_updated_at" BEFORE UPDATE ON "parent_app"."activity_preferences" FOR EACH ROW EXECUTE FUNCTION "parent_app"."set_updated_at"();



CREATE OR REPLACE TRIGGER "teacher_profiles_updated_at" BEFORE UPDATE ON "teachers"."teacher_profiles" FOR EACH ROW EXECUTE FUNCTION "teachers"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_activities_updated_at" BEFORE UPDATE ON "teachers"."activities" FOR EACH ROW EXECUTE FUNCTION "teachers"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_clock_sessions_updated_at" BEFORE UPDATE ON "teachers"."clock_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teacher_notes_updated_at" BEFORE UPDATE ON "teachers"."teacher_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teacher_students_updated_at" BEFORE UPDATE ON "teachers"."teacher_students" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_waitlist_submissions_updated_at" BEFORE UPDATE ON "waitlist"."submissions" FOR EACH ROW EXECUTE FUNCTION "waitlist"."update_updated_at_column"();



ALTER TABLE ONLY "admin"."help_requests"
    ADD CONSTRAINT "help_requests_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id");



ALTER TABLE ONLY "admin"."parent_feedback"
    ADD CONSTRAINT "parent_feedback_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id");



ALTER TABLE ONLY "admin"."students"
    ADD CONSTRAINT "students_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "admin"."tuition_feedback"
    ADD CONSTRAINT "tuition_feedback_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "admin"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "admin"."volunteer_interests"
    ADD CONSTRAINT "volunteer_interests_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "attendance"."aftercare_records"
    ADD CONSTRAINT "aftercare_records_pickup_recorded_by_fkey" FOREIGN KEY ("pickup_recorded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "attendance"."aftercare_records"
    ADD CONSTRAINT "aftercare_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "attendance"."aftercare_records"
    ADD CONSTRAINT "aftercare_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "attendance"."check_ins"
    ADD CONSTRAINT "check_ins_checked_in_by_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "admin"."users"("id");



ALTER TABLE ONLY "attendance"."check_ins"
    ADD CONSTRAINT "check_ins_checked_out_by_fkey" FOREIGN KEY ("checked_out_by") REFERENCES "admin"."users"("id");



ALTER TABLE ONLY "attendance"."check_ins"
    ADD CONSTRAINT "check_ins_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id");



ALTER TABLE ONLY "attendance"."field_friday_records"
    ADD CONSTRAINT "field_friday_records_pickup_recorded_by_fkey" FOREIGN KEY ("pickup_recorded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "attendance"."field_friday_records"
    ADD CONSTRAINT "field_friday_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "attendance"."field_friday_records"
    ADD CONSTRAINT "field_friday_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id");



ALTER TABLE ONLY "attendance"."summer_records"
    ADD CONSTRAINT "summer_records_pickup_recorded_by_fkey" FOREIGN KEY ("pickup_recorded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "attendance"."summer_records"
    ADD CONSTRAINT "summer_records_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "admin"."users"("id");



ALTER TABLE ONLY "attendance"."summer_records"
    ADD CONSTRAINT "summer_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id");



ALTER TABLE ONLY "billing"."homeschool_day_commitments"
    ADD CONSTRAINT "homeschool_day_commitments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "parent_app"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "billing"."homeschool_day_commitments"
    ADD CONSTRAINT "homeschool_day_commitments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "billing"."homeschool_day_commitments"
    ADD CONSTRAINT "homeschool_day_commitments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "billing"."pending_payment_requests"
    ADD CONSTRAINT "pending_payment_requests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "billing"."pending_payment_requests"
    ADD CONSTRAINT "pending_payment_requests_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "billing"."pending_payment_requests"
    ADD CONSTRAINT "pending_payment_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id");



ALTER TABLE ONLY "billing"."stripe_transactions"
    ADD CONSTRAINT "stripe_transactions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "parent_app"."applications"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "billing"."stripe_transactions"
    ADD CONSTRAINT "stripe_transactions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "billing"."stripe_transactions"
    ADD CONSTRAINT "stripe_transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "billing"."summer_week_commitments"
    ADD CONSTRAINT "summer_week_commitments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "parent_app"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "billing"."summer_week_commitments"
    ADD CONSTRAINT "summer_week_commitments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "billing"."summer_week_commitments"
    ADD CONSTRAINT "summer_week_commitments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "billing"."tuition_codes"
    ADD CONSTRAINT "tuition_codes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "blogs"."blog_posts"
    ADD CONSTRAINT "blog_posts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "budget"."income"
    ADD CONSTRAINT "income_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "budget"."income"
    ADD CONSTRAINT "income_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "calendar"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "care_log"."entries"
    ADD CONSTRAINT "entries_logged_by_fkey" FOREIGN KEY ("logged_by") REFERENCES "admin"."users"("id");



ALTER TABLE ONLY "care_log"."entries"
    ADD CONSTRAINT "entries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id");



ALTER TABLE ONLY "contracts"."history"
    ADD CONSTRAINT "history_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "contracts"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "email_logs"."sends"
    ADD CONSTRAINT "sends_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "parent_app"."applications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "feed"."post_attachments"
    ADD CONSTRAINT "post_attachments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "feed"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "feed"."post_comments"
    ADD CONSTRAINT "post_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "feed"."post_comments"
    ADD CONSTRAINT "post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "feed"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "feed"."post_comments"
    ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "feed"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "feed"."post_media"
    ADD CONSTRAINT "post_media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "feed"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "feed"."post_reactions"
    ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "feed"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "feed"."post_reactions"
    ADD CONSTRAINT "post_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "feed"."posts"
    ADD CONSTRAINT "posts_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "inventory"."history_events"
    ADD CONSTRAINT "history_events_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "inventory"."history_events"
    ADD CONSTRAINT "history_events_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "inventory"."items"
    ADD CONSTRAINT "items_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "inventory"."photos"
    ADD CONSTRAINT "photos_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "inventory"."photos"
    ADD CONSTRAINT "photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "inventory"."shopping_requests"
    ADD CONSTRAINT "shopping_requests_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory"."items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "inventory"."shopping_requests"
    ADD CONSTRAINT "shopping_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "inventory"."shopping_requests"
    ADD CONSTRAINT "shopping_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "marketing"."shadow_day_bookings"
    ADD CONSTRAINT "shadow_day_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "marketing"."tour_unavailability"
    ADD CONSTRAINT "tour_unavailability_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "marketing"."tour_bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "messaging"."channel_members"
    ADD CONSTRAINT "channel_members_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "messaging"."channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "messaging"."channel_members"
    ADD CONSTRAINT "channel_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "messaging"."channel_messages"
    ADD CONSTRAINT "channel_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "messaging"."channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "messaging"."channel_messages"
    ADD CONSTRAINT "channel_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "messaging"."channels"
    ADD CONSTRAINT "channels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "messaging"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "messaging"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "messaging"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "messaging"."message_reactions"
    ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messaging"."channel_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "messaging"."message_reactions"
    ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "messaging"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "messaging"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "messaging"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "newsletters"."change_log"
    ADD CONSTRAINT "change_log_newsletter_id_fkey" FOREIGN KEY ("newsletter_id") REFERENCES "newsletters"."newsletters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "newsletters"."change_log"
    ADD CONSTRAINT "change_log_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "newsletters"."newsletters"
    ADD CONSTRAINT "newsletters_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "newsletters"."section_images"
    ADD CONSTRAINT "section_images_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "newsletters"."sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "newsletters"."section_images"
    ADD CONSTRAINT "section_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "newsletters"."sections"
    ADD CONSTRAINT "sections_newsletter_id_fkey" FOREIGN KEY ("newsletter_id") REFERENCES "newsletters"."newsletters"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "newsletters"."teacher_updates"
    ADD CONSTRAINT "teacher_updates_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "newsletters"."sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "newsletters"."teacher_updates"
    ADD CONSTRAINT "teacher_updates_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "parent_app"."activity_preferences"
    ADD CONSTRAINT "activity_preferences_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "teachers"."activities"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."activity_preferences"
    ADD CONSTRAINT "activity_preferences_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."activity_preferences"
    ADD CONSTRAINT "activity_preferences_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."application_notes"
    ADD CONSTRAINT "application_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "parent_app"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."applications"
    ADD CONSTRAINT "applications_referred_by_fkey" FOREIGN KEY ("referred_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "parent_app"."applications"
    ADD CONSTRAINT "applications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."applications"
    ADD CONSTRAINT "applications_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "admin"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."dashboard_access_grants"
    ADD CONSTRAINT "dashboard_access_grants_grantee_id_fkey" FOREIGN KEY ("grantee_id") REFERENCES "admin"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "parent_app"."dashboard_access_grants"
    ADD CONSTRAINT "dashboard_access_grants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."dropoff_times"
    ADD CONSTRAINT "dropoff_times_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."enrollment_signatures"
    ADD CONSTRAINT "fk_parent" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."onboarding_checklist"
    ADD CONSTRAINT "fk_parent" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."enrollment_signatures"
    ADD CONSTRAINT "fk_student" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."referrals"
    ADD CONSTRAINT "referrals_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "parent_app"."applications"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "parent_app"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "parent_app"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."student_authorized_pickup_persons"
    ADD CONSTRAINT "student_authorized_pickup_persons_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."student_authorized_pickup_persons"
    ADD CONSTRAINT "student_authorized_pickup_persons_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."student_authorized_pickup_plan"
    ADD CONSTRAINT "student_authorized_pickup_plan_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."student_authorized_pickup_plan"
    ADD CONSTRAINT "student_authorized_pickup_plan_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."student_health_info"
    ADD CONSTRAINT "student_health_info_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id");



ALTER TABLE ONLY "parent_app"."student_health_info"
    ADD CONSTRAINT "student_health_info_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id");



ALTER TABLE ONLY "parent_app"."student_health_statement"
    ADD CONSTRAINT "student_health_statement_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."student_health_statement"
    ADD CONSTRAINT "student_health_statement_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."student_medication_plan"
    ADD CONSTRAINT "student_medication_plan_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id");



ALTER TABLE ONLY "parent_app"."student_medication_plan"
    ADD CONSTRAINT "student_medication_plan_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id");



ALTER TABLE ONLY "parent_app"."student_medications"
    ADD CONSTRAINT "student_medications_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id");



ALTER TABLE ONLY "parent_app"."student_medications"
    ADD CONSTRAINT "student_medications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id");



ALTER TABLE ONLY "parent_app"."student_photo_release_consent"
    ADD CONSTRAINT "student_photo_release_consent_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "parent_app"."student_photo_release_consent"
    ADD CONSTRAINT "student_photo_release_consent_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "reels"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "reels"."comments"
    ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "reels"."comments"("id");



ALTER TABLE ONLY "reels"."comments"
    ADD CONSTRAINT "comments_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "reels"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "reels"."posts"
    ADD CONSTRAINT "posts_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "reels"."reactions"
    ADD CONSTRAINT "reactions_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "reels"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "reels"."reactions"
    ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "teachers"."activities"
    ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "teachers"."activity_change_log"
    ADD CONSTRAINT "activity_change_log_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "teachers"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."activity_change_log"
    ADD CONSTRAINT "activity_change_log_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "admin"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."activity_food_images"
    ADD CONSTRAINT "activity_food_images_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "teachers"."activity_foods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."activity_food_images"
    ADD CONSTRAINT "activity_food_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "teachers"."activity_foods"
    ADD CONSTRAINT "activity_foods_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "teachers"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."activity_images"
    ADD CONSTRAINT "activity_images_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "teachers"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."activity_images"
    ADD CONSTRAINT "activity_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "teachers"."activity_ingredient_images"
    ADD CONSTRAINT "activity_ingredient_images_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "teachers"."activity_ingredients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."activity_ingredient_images"
    ADD CONSTRAINT "activity_ingredient_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "teachers"."activity_ingredients"
    ADD CONSTRAINT "activity_ingredients_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "teachers"."activity_foods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."clock_sessions"
    ADD CONSTRAINT "clock_sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."paystubs"
    ADD CONSTRAINT "paystubs_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."photo_student_tags"
    ADD CONSTRAINT "photo_student_tags_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "teachers"."photos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."photo_student_tags"
    ADD CONSTRAINT "photo_student_tags_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."photos"
    ADD CONSTRAINT "photos_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."teacher_experience"
    ADD CONSTRAINT "teacher_experience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."teacher_note_attachments"
    ADD CONSTRAINT "teacher_note_attachments_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "teachers"."teacher_notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."teacher_notes"
    ADD CONSTRAINT "teacher_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."teacher_notes"
    ADD CONSTRAINT "teacher_notes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."teacher_profiles"
    ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."teacher_qualifications"
    ADD CONSTRAINT "teacher_qualifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."teacher_students"
    ADD CONSTRAINT "teacher_students_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "admin"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "teachers"."teacher_students"
    ADD CONSTRAINT "teacher_students_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "admin"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Active grantee can view owner students" ON "admin"."students" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "students"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Parents can insert own help requests" ON "admin"."help_requests" FOR INSERT TO "authenticated" WITH CHECK (("parent_id" = "auth"."uid"()));



CREATE POLICY "Parents can insert own tuition feedback" ON "admin"."tuition_feedback" FOR INSERT WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can view own help requests" ON "admin"."help_requests" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "Public can read development tasks" ON "admin"."development_tasks" FOR SELECT USING (true);



CREATE POLICY "Service role full access" ON "admin"."development_tasks" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can update own push_token" ON "admin"."users" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can view their own admin record" ON "admin"."users" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



ALTER TABLE "admin"."android_download_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_can_read_users" ON "admin"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



ALTER TABLE "admin"."development_tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "admin"."parent_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parent_select_own_students" ON "admin"."students" FOR SELECT USING ((("auth"."uid"() = "parent_id") AND ("is_deleted" = false)));



CREATE POLICY "parents_insert_own_feedback" ON "admin"."parent_feedback" FOR INSERT TO "authenticated" WITH CHECK (("parent_id" = "auth"."uid"()));



CREATE POLICY "parents_insert_own_volunteer_interest" ON "admin"."volunteer_interests" FOR INSERT TO "authenticated" WITH CHECK (("parent_id" = "auth"."uid"()));



CREATE POLICY "parents_read_assigned_teacher_names" ON "admin"."users" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("teachers"."teacher_students" "ts"
     JOIN "admin"."students" "s" ON (("ts"."student_id" = "s"."id")))
  WHERE (("ts"."teacher_id" = "users"."id") AND ("s"."parent_id" = "auth"."uid"()) AND ("s"."is_deleted" = false)))));



CREATE POLICY "parents_read_classmates" ON "admin"."students" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "teachers"."get_classmate_ids_for_parent"("auth"."uid"()) AS "get_classmate_ids_for_parent")));



CREATE POLICY "parents_read_own_feedback" ON "admin"."parent_feedback" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "parents_read_own_students" ON "admin"."students" FOR SELECT TO "authenticated" USING ((("parent_id" = "auth"."uid"()) AND ("is_deleted" = false)));



CREATE POLICY "parents_read_own_volunteer_interests" ON "admin"."volunteer_interests" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "staff_select_students" ON "admin"."students" FOR SELECT TO "authenticated" USING ("public"."is_staff"());



ALTER TABLE "admin"."students" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teachers_select_assigned_students" ON "admin"."students" FOR SELECT TO "authenticated" USING ("teachers"."is_teacher_of"("id"));



CREATE POLICY "teachers_select_parent_users" ON "admin"."users" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "teachers"."is_parent_of_my_student"("id")));



ALTER TABLE "admin"."tuition_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_read_own_record" ON "admin"."users" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "admin"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "admin"."volunteer_interests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Active grantee can view aftercare attendance" ON "attendance"."aftercare_records" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("admin"."students" "s"
     JOIN "parent_app"."dashboard_access_grants" "g" ON (("g"."owner_id" = "s"."parent_id")))
  WHERE (("s"."id" = "aftercare_records"."student_id") AND ("g"."grantee_id" = "auth"."uid"()) AND ("g"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can view field friday attendance" ON "attendance"."field_friday_records" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("admin"."students" "s"
     JOIN "parent_app"."dashboard_access_grants" "g" ON (("g"."owner_id" = "s"."parent_id")))
  WHERE (("s"."id" = "field_friday_records"."student_id") AND ("g"."grantee_id" = "auth"."uid"()) AND ("g"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can view summer attendance" ON "attendance"."summer_records" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("admin"."students" "s"
     JOIN "parent_app"."dashboard_access_grants" "g" ON (("g"."owner_id" = "s"."parent_id")))
  WHERE (("s"."id" = "summer_records"."student_id") AND ("g"."grantee_id" = "auth"."uid"()) AND ("g"."status" = 'active'::"text")))));



ALTER TABLE "attendance"."aftercare_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_delete_aftercare" ON "attendance"."aftercare_records" FOR DELETE TO "authenticated" USING (("recorded_by" = "auth"."uid"()));



CREATE POLICY "authenticated_delete_field_friday_records" ON "attendance"."field_friday_records" FOR DELETE TO "authenticated" USING (("recorded_by" = "auth"."uid"()));



CREATE POLICY "authenticated_insert_aftercare" ON "attendance"."aftercare_records" FOR INSERT TO "authenticated" WITH CHECK (("recorded_by" = "auth"."uid"()));



CREATE POLICY "authenticated_insert_field_friday_records" ON "attendance"."field_friday_records" FOR INSERT TO "authenticated" WITH CHECK (("recorded_by" = "auth"."uid"()));



CREATE POLICY "authenticated_read_aftercare" ON "attendance"."aftercare_records" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_field_friday_records" ON "attendance"."field_friday_records" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_update_aftercare" ON "attendance"."aftercare_records" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_update_field_friday_records" ON "attendance"."field_friday_records" FOR UPDATE TO "authenticated" USING (("recorded_by" = "auth"."uid"())) WITH CHECK (("recorded_by" = "auth"."uid"()));



ALTER TABLE "attendance"."check_ins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "attendance"."field_friday_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parents_insert_checkins" ON "attendance"."check_ins" FOR INSERT WITH CHECK (("checked_in_by" = "auth"."uid"()));



CREATE POLICY "parents_read_own_checkins" ON "attendance"."check_ins" FOR SELECT USING (("checked_in_by" = "auth"."uid"()));



CREATE POLICY "parents_update_own_checkins" ON "attendance"."check_ins" FOR UPDATE USING (("checked_in_by" = "auth"."uid"())) WITH CHECK (("checked_in_by" = "auth"."uid"()));



CREATE POLICY "staff_delete_aftercare_records" ON "attendance"."aftercare_records" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['teacher'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "staff_delete_field_friday_records" ON "attendance"."field_friday_records" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "staff_delete_summer_records" ON "attendance"."summer_records" FOR DELETE TO "authenticated" USING ("public"."is_staff"());



CREATE POLICY "staff_insert_aftercare_records" ON "attendance"."aftercare_records" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "admin"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['teacher'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "staff_insert_field_friday_records" ON "attendance"."field_friday_records" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "recorded_by"));



CREATE POLICY "staff_insert_summer_records" ON "attendance"."summer_records" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_staff"() AND ("recorded_by" = "auth"."uid"())));



CREATE POLICY "staff_select_aftercare_records" ON "attendance"."aftercare_records" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['teacher'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "staff_select_field_friday_records" ON "attendance"."field_friday_records" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "staff_select_summer_records" ON "attendance"."summer_records" FOR SELECT TO "authenticated" USING ("public"."is_staff"());



CREATE POLICY "staff_update_aftercare_records" ON "attendance"."aftercare_records" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['teacher'::"text", 'super_admin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "admin"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['teacher'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "staff_update_field_friday_records" ON "attendance"."field_friday_records" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "staff_update_summer_records" ON "attendance"."summer_records" FOR UPDATE TO "authenticated" USING ("public"."is_staff"());



ALTER TABLE "attendance"."summer_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teachers_select_assigned_checkins" ON "attendance"."check_ins" FOR SELECT TO "authenticated" USING ("teachers"."is_teacher_of"("student_id"));



CREATE POLICY "Active grantee can view owner transactions" ON "billing"."stripe_transactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "stripe_transactions"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Parents can view own pending payment requests" ON "billing"."pending_payment_requests" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "Parents can view own transactions" ON "billing"."stripe_transactions" FOR SELECT TO "authenticated" USING ((("parent_id" = "auth"."uid"()) AND ("is_deleted" = false)));



ALTER TABLE "billing"."homeschool_day_commitments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "billing"."one_time_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parent_select_own_transactions" ON "billing"."stripe_transactions" FOR SELECT USING ((("auth"."uid"() = "parent_id") AND ("is_deleted" = false)));



ALTER TABLE "billing"."pending_payment_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff_select_stripe_transactions" ON "billing"."stripe_transactions" FOR SELECT TO "authenticated" USING ("public"."is_staff"());



ALTER TABLE "billing"."stripe_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "billing"."summer_week_commitments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "billing"."tuition_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "blogs"."blog_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_published_posts" ON "blogs"."blog_posts" FOR SELECT TO "anon" USING ((("status" = 'published'::"text") AND ("is_deleted" = false)));



CREATE POLICY "teachers_insert_posts" ON "blogs"."blog_posts" FOR INSERT TO "authenticated" WITH CHECK (("newsletters"."is_teacher_or_admin"() AND ("created_by" = "auth"."uid"())));



CREATE POLICY "teachers_read_posts" ON "blogs"."blog_posts" FOR SELECT TO "authenticated" USING ((("is_deleted" = false) AND "newsletters"."is_teacher_or_admin"()));



CREATE POLICY "teachers_update_posts" ON "blogs"."blog_posts" FOR UPDATE TO "authenticated" USING ((("is_deleted" = false) AND "newsletters"."is_teacher_or_admin"())) WITH CHECK ("newsletters"."is_teacher_or_admin"());



ALTER TABLE "budget"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "budget"."income" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "budget"."line_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "budget"."settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "super_admin_only_expenses" ON "budget"."expenses" USING ("budget"."is_super_admin"()) WITH CHECK ("budget"."is_super_admin"());



CREATE POLICY "super_admin_only_income" ON "budget"."income" USING ("budget"."is_super_admin"()) WITH CHECK ("budget"."is_super_admin"());



CREATE POLICY "super_admin_only_line_items" ON "budget"."line_items" USING ("budget"."is_super_admin"()) WITH CHECK ("budget"."is_super_admin"());



CREATE POLICY "super_admin_only_settings" ON "budget"."settings" USING ("budget"."is_super_admin"()) WITH CHECK ("budget"."is_super_admin"());



CREATE POLICY "authenticated_read_parent_events" ON "calendar"."events" FOR SELECT TO "authenticated" USING (("shared_with" @> ARRAY['Parents'::"text"]));



ALTER TABLE "calendar"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "super_admin_only_calendar_events" ON "calendar"."events" USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



ALTER TABLE "care_log"."entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teachers_insert_entries" ON "care_log"."entries" FOR INSERT TO "authenticated" WITH CHECK (("care_log"."is_teacher_or_admin"() AND ("logged_by" = "auth"."uid"())));



CREATE POLICY "teachers_read_entries" ON "care_log"."entries" FOR SELECT TO "authenticated" USING ("care_log"."is_teacher_or_admin"());



CREATE POLICY "Admins can delete contact submissions" ON "contact"."submissions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can update contact submissions" ON "contact"."submissions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all contact submissions" ON "contact"."submissions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Allow insert contact submissions" ON "contact"."submissions" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Allow public insert to contact" ON "contact"."submissions" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Prevent public read of contact" ON "contact"."submissions" FOR SELECT TO "anon" USING (false);



ALTER TABLE "contact"."account_deletion_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "contact"."submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Allow admin insert" ON "contracts"."documents" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow admin insert history" ON "contracts"."history" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow admin read" ON "contracts"."documents" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow admin read history" ON "contracts"."history" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow admin update" ON "contracts"."documents" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "contracts"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "contracts"."history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "donations"."donations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins have full access to comments" ON "feed"."post_comments" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "admins have full access to posts" ON "feed"."posts" TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "authenticated users can insert comments" ON "feed"."post_comments" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "authenticated users can read comments" ON "feed"."post_comments" FOR SELECT TO "authenticated" USING (("is_deleted" = false));



CREATE POLICY "authenticated users can read post attachments" ON "feed"."post_attachments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "feed"."posts" "p"
  WHERE (("p"."id" = "post_attachments"."post_id") AND ("p"."is_deleted" = false)))));



CREATE POLICY "authenticated users can read post media" ON "feed"."post_media" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "feed"."posts" "p"
  WHERE (("p"."id" = "post_media"."post_id") AND ("p"."is_deleted" = false)))));



CREATE POLICY "authenticated users can read posts" ON "feed"."posts" FOR SELECT TO "authenticated" USING (("is_deleted" = false));



CREATE POLICY "authenticated users can read reactions" ON "feed"."post_reactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "comment authors can delete their own comments" ON "feed"."post_comments" FOR DELETE TO "authenticated" USING (("author_id" = "auth"."uid"()));



CREATE POLICY "comment authors can update their own comments" ON "feed"."post_comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "post owner can manage attachments" ON "feed"."post_attachments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "feed"."posts" "p"
  WHERE (("p"."id" = "post_attachments"."post_id") AND ("p"."teacher_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "feed"."posts" "p"
  WHERE (("p"."id" = "post_attachments"."post_id") AND ("p"."teacher_id" = "auth"."uid"())))));



CREATE POLICY "post owner can manage media" ON "feed"."post_media" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "feed"."posts" "p"
  WHERE (("p"."id" = "post_media"."post_id") AND ("p"."teacher_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "feed"."posts" "p"
  WHERE (("p"."id" = "post_media"."post_id") AND ("p"."teacher_id" = "auth"."uid"())))));



ALTER TABLE "feed"."post_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "feed"."post_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "feed"."post_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "feed"."post_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "feed"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teachers can delete their own posts" ON "feed"."posts" FOR DELETE TO "authenticated" USING (("teacher_id" = "auth"."uid"()));



CREATE POLICY "teachers can insert their own posts" ON "feed"."posts" FOR INSERT TO "authenticated" WITH CHECK (("teacher_id" = "auth"."uid"()));



CREATE POLICY "teachers can update their own posts" ON "feed"."posts" FOR UPDATE TO "authenticated" USING (("teacher_id" = "auth"."uid"())) WITH CHECK (("teacher_id" = "auth"."uid"()));



CREATE POLICY "users can delete their own reactions" ON "feed"."post_reactions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users can insert their own reactions" ON "feed"."post_reactions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "admin_update_shopping" ON "inventory"."shopping_requests" FOR UPDATE TO "authenticated" USING ((("is_deleted" = false) AND ("inventory"."is_admin"() OR (("requested_by" = "auth"."uid"()) AND ("status" = 'pending'::"text"))))) WITH CHECK (("inventory"."is_admin"() OR (("requested_by" = "auth"."uid"()) AND ("status" = 'pending'::"text"))));



ALTER TABLE "inventory"."history_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "inventory"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "inventory"."photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "inventory"."shopping_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff can soft delete items" ON "inventory"."items" FOR UPDATE USING ((("is_deleted" = false) AND "inventory"."is_teacher_or_admin"())) WITH CHECK ((("is_deleted" = true) AND "inventory"."is_teacher_or_admin"()));



CREATE POLICY "teachers_insert_history" ON "inventory"."history_events" FOR INSERT TO "authenticated" WITH CHECK (("inventory"."is_teacher_or_admin"() AND ("performed_by" = "auth"."uid"())));



CREATE POLICY "teachers_insert_items" ON "inventory"."items" FOR INSERT TO "authenticated" WITH CHECK (("inventory"."is_teacher_or_admin"() AND ("added_by" = "auth"."uid"())));



CREATE POLICY "teachers_insert_photos" ON "inventory"."photos" FOR INSERT TO "authenticated" WITH CHECK (("inventory"."is_teacher_or_admin"() AND ("uploaded_by" = "auth"."uid"())));



CREATE POLICY "teachers_insert_shopping" ON "inventory"."shopping_requests" FOR INSERT TO "authenticated" WITH CHECK (("inventory"."is_teacher_or_admin"() AND ("requested_by" = "auth"."uid"())));



CREATE POLICY "teachers_read_history" ON "inventory"."history_events" FOR SELECT TO "authenticated" USING ("inventory"."is_teacher_or_admin"());



CREATE POLICY "teachers_read_items" ON "inventory"."items" FOR SELECT TO "authenticated" USING ((("is_deleted" = false) AND "inventory"."is_teacher_or_admin"()));



CREATE POLICY "teachers_read_photos" ON "inventory"."photos" FOR SELECT TO "authenticated" USING ((("is_deleted" = false) AND "inventory"."is_teacher_or_admin"()));



CREATE POLICY "teachers_read_shopping" ON "inventory"."shopping_requests" FOR SELECT TO "authenticated" USING ((("is_deleted" = false) AND "inventory"."is_teacher_or_admin"()));



CREATE POLICY "teachers_softdelete_photos" ON "inventory"."photos" FOR UPDATE TO "authenticated" USING (("inventory"."is_teacher_or_admin"() AND (("uploaded_by" = "auth"."uid"()) OR "inventory"."is_admin"()))) WITH CHECK ("inventory"."is_teacher_or_admin"());



CREATE POLICY "teachers_update_items" ON "inventory"."items" FOR UPDATE TO "authenticated" USING ((("is_deleted" = false) AND "inventory"."is_teacher_or_admin"())) WITH CHECK ("inventory"."is_teacher_or_admin"());



CREATE POLICY "Admins can delete info_session_rsvps" ON "marketing"."info_session_rsvps" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can delete meet_miss_joy_rsvps" ON "marketing"."meet_miss_joy_rsvps" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can delete tour_bookings" ON "marketing"."tour_bookings" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can delete tour_unavailability" ON "marketing"."tour_unavailability" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can insert tour_unavailability" ON "marketing"."tour_unavailability" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can read info_session_rsvps" ON "marketing"."info_session_rsvps" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can read meet_miss_joy_rsvps" ON "marketing"."meet_miss_joy_rsvps" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can read tour_bookings" ON "marketing"."tour_bookings" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can update info_session_rsvps" ON "marketing"."info_session_rsvps" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can update meet_miss_joy_rsvps" ON "marketing"."meet_miss_joy_rsvps" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can update tour_bookings" ON "marketing"."tour_bookings" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can update tour_unavailability" ON "marketing"."tour_unavailability" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Allow authenticated read" ON "marketing"."open_house_rsvps" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow public RSVP inserts" ON "marketing"."open_house_rsvps" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow public insert" ON "marketing"."free_friday_registrations" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow public insert to info_session_rsvps" ON "marketing"."info_session_rsvps" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow public insert to meet_miss_joy_rsvps" ON "marketing"."meet_miss_joy_rsvps" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow public insert to tour_bookings" ON "marketing"."tour_bookings" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "Allow public read of tour_unavailability" ON "marketing"."tour_unavailability" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Prevent public read" ON "marketing"."free_friday_registrations" FOR SELECT TO "anon" USING (false);



CREATE POLICY "Prevent public read of info_session_rsvps" ON "marketing"."info_session_rsvps" FOR SELECT TO "anon" USING (false);



CREATE POLICY "Prevent public read of meet_miss_joy_rsvps" ON "marketing"."meet_miss_joy_rsvps" FOR SELECT TO "anon" USING (false);



CREATE POLICY "Prevent public read of tour_bookings" ON "marketing"."tour_bookings" FOR SELECT TO "anon" USING (false);



CREATE POLICY "admin_all_beach_bash" ON "marketing"."beach_bash_registrations" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "anon_insert_beach_bash" ON "marketing"."beach_bash_registrations" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "anon_insert_shadow_day_bookings" ON "marketing"."shadow_day_bookings" FOR INSERT TO "anon" WITH CHECK (true);



CREATE POLICY "anon_insert_testimonials" ON "marketing"."testimonials" FOR INSERT TO "anon" WITH CHECK (("parent_id" IS NULL));



CREATE POLICY "authenticated_all_shadow_day_bookings" ON "marketing"."shadow_day_bookings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "authenticated_insert_testimonials" ON "marketing"."testimonials" FOR INSERT TO "authenticated" WITH CHECK (("parent_id" = "auth"."uid"()));



CREATE POLICY "authenticated_select_own_testimonials" ON "marketing"."testimonials" FOR SELECT TO "authenticated" USING ((("parent_id" = "auth"."uid"()) AND ("is_deleted" = false)));



ALTER TABLE "marketing"."beach_bash_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "marketing"."free_friday_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "marketing"."info_session_rsvps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "marketing"."meet_miss_joy_rsvps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "marketing"."open_house_rsvps" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public can insert referral_submissions" ON "marketing"."referral_submissions" FOR INSERT TO "anon" WITH CHECK (true);



ALTER TABLE "marketing"."referral_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "marketing"."school_year_2026_commitments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service role full access referral_submissions" ON "marketing"."referral_submissions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role full access" ON "marketing"."school_year_2026_commitments" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all_testimonials" ON "marketing"."testimonials" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "shadow_bookings_owner_read" ON "marketing"."shadow_day_bookings" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "marketing"."shadow_day_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "marketing"."testimonials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "marketing"."tour_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "marketing"."tour_unavailability" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Participants can mark messages read" ON "messaging"."messages" FOR UPDATE USING ("messaging"."is_participant"("conversation_id", "auth"."uid"())) WITH CHECK ("messaging"."is_participant"("conversation_id", "auth"."uid"()));



CREATE POLICY "authenticated_can_insert_conversations" ON "messaging"."conversations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "authenticated_can_insert_participants" ON "messaging"."conversation_participants" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "messaging"."channel_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "channel_members_delete" ON "messaging"."channel_members" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) AND (NOT ("channel_id" IN ( SELECT "channels"."id"
   FROM "messaging"."channels"
  WHERE ("channels"."is_default" = true))))));



CREATE POLICY "channel_members_insert" ON "messaging"."channel_members" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "channel_members_insert_policy" ON "messaging"."channel_members" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "channel_members_read_own" ON "messaging"."channel_members" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "messaging"."channel_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "channel_messages_delete" ON "messaging"."channel_messages" FOR DELETE TO "authenticated" USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "channel_messages_insert" ON "messaging"."channel_messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = "auth"."uid"()) AND ("channel_id" IN ( SELECT "channel_members"."channel_id"
   FROM "messaging"."channel_members"
  WHERE ("channel_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "channel_messages_read" ON "messaging"."channel_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "messaging"."channel_members"
  WHERE (("channel_members"."channel_id" = "channel_messages"."channel_id") AND ("channel_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "channel_messages_update" ON "messaging"."channel_messages" FOR UPDATE TO "authenticated" USING (("sender_id" = "auth"."uid"())) WITH CHECK (("sender_id" = "auth"."uid"()));



ALTER TABLE "messaging"."channels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "channels_insert_teacher" ON "messaging"."channels" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "users"."role"
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"())) = ANY (ARRAY['teacher'::"text", 'super_admin'::"text"])));



CREATE POLICY "channels_read" ON "messaging"."channels" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "messaging"."conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "messaging"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "messaging"."message_reactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "message_reactions_delete" ON "messaging"."message_reactions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "message_reactions_insert" ON "messaging"."message_reactions" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND ("message_id" IN ( SELECT "channel_messages"."id"
   FROM "messaging"."channel_messages"
  WHERE ("channel_messages"."channel_id" IN ( SELECT "channel_members"."channel_id"
           FROM "messaging"."channel_members"
          WHERE ("channel_members"."user_id" = "auth"."uid"())))))));



CREATE POLICY "message_reactions_read" ON "messaging"."message_reactions" FOR SELECT TO "authenticated" USING (("message_id" IN ( SELECT "channel_messages"."id"
   FROM "messaging"."channel_messages"
  WHERE ("channel_messages"."channel_id" IN ( SELECT "channel_members"."channel_id"
           FROM "messaging"."channel_members"
          WHERE ("channel_members"."user_id" = "auth"."uid"()))))));



ALTER TABLE "messaging"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "participant can insert conversation" ON "messaging"."conversations" FOR INSERT WITH CHECK (true);



CREATE POLICY "participant can insert messages" ON "messaging"."messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "messaging"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "cp"."conversation_id") AND ("cp"."user_id" = "auth"."uid"()))))));



CREATE POLICY "participant can insert self" ON "messaging"."conversation_participants" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "participant can read conversation" ON "messaging"."conversations" FOR SELECT USING ("messaging"."is_participant"("id", "auth"."uid"()));



CREATE POLICY "participant can read messages" ON "messaging"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "messaging"."conversation_participants" "cp"
  WHERE (("cp"."conversation_id" = "cp"."conversation_id") AND ("cp"."user_id" = "auth"."uid"())))));



CREATE POLICY "participant can read participants" ON "messaging"."conversation_participants" FOR SELECT USING ("messaging"."is_participant"("conversation_id", "auth"."uid"()));



ALTER TABLE "newsletters"."change_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "newsletters"."newsletters" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parents_read_published_newsletters" ON "newsletters"."newsletters" FOR SELECT TO "authenticated" USING ((("status" = 'published'::"text") AND ("is_deleted" = false)));



CREATE POLICY "parents_read_section_images" ON "newsletters"."section_images" FOR SELECT TO "authenticated" USING ((("is_deleted" = false) AND (EXISTS ( SELECT 1
   FROM ("newsletters"."sections" "s"
     JOIN "newsletters"."newsletters" "n" ON (("n"."id" = "s"."newsletter_id")))
  WHERE (("s"."id" = "section_images"."section_id") AND ("n"."status" = 'published'::"text") AND ("n"."is_deleted" = false))))));



CREATE POLICY "parents_read_sections" ON "newsletters"."sections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "newsletters"."newsletters" "n"
  WHERE (("n"."id" = "sections"."newsletter_id") AND ("n"."status" = 'published'::"text") AND ("n"."is_deleted" = false)))));



CREATE POLICY "parents_read_teacher_updates" ON "newsletters"."teacher_updates" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("newsletters"."sections" "s"
     JOIN "newsletters"."newsletters" "n" ON (("n"."id" = "s"."newsletter_id")))
  WHERE (("s"."id" = "teacher_updates"."section_id") AND ("n"."status" = 'published'::"text") AND ("n"."is_deleted" = false)))));



ALTER TABLE "newsletters"."section_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "newsletters"."sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "newsletters"."teacher_updates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teachers_delete_sections" ON "newsletters"."sections" FOR DELETE TO "authenticated" USING ("newsletters"."is_teacher_or_admin"());



CREATE POLICY "teachers_insert_change_log" ON "newsletters"."change_log" FOR INSERT TO "authenticated" WITH CHECK (("newsletters"."is_teacher_or_admin"() AND ("teacher_id" = "auth"."uid"())));



CREATE POLICY "teachers_insert_newsletters" ON "newsletters"."newsletters" FOR INSERT TO "authenticated" WITH CHECK (("newsletters"."is_teacher_or_admin"() AND ("created_by" = "auth"."uid"())));



CREATE POLICY "teachers_insert_section_images" ON "newsletters"."section_images" FOR INSERT TO "authenticated" WITH CHECK (("newsletters"."is_teacher_or_admin"() AND ("uploaded_by" = "auth"."uid"())));



CREATE POLICY "teachers_insert_sections" ON "newsletters"."sections" FOR INSERT TO "authenticated" WITH CHECK ("newsletters"."is_teacher_or_admin"());



CREATE POLICY "teachers_insert_teacher_updates" ON "newsletters"."teacher_updates" FOR INSERT TO "authenticated" WITH CHECK ("newsletters"."is_teacher_or_admin"());



CREATE POLICY "teachers_read_change_log" ON "newsletters"."change_log" FOR SELECT TO "authenticated" USING ("newsletters"."is_teacher_or_admin"());



CREATE POLICY "teachers_read_newsletters" ON "newsletters"."newsletters" FOR SELECT TO "authenticated" USING ((("is_deleted" = false) AND "newsletters"."is_teacher_or_admin"()));



CREATE POLICY "teachers_read_section_images" ON "newsletters"."section_images" FOR SELECT TO "authenticated" USING ((("is_deleted" = false) AND "newsletters"."is_teacher_or_admin"()));



CREATE POLICY "teachers_read_sections" ON "newsletters"."sections" FOR SELECT TO "authenticated" USING ("newsletters"."is_teacher_or_admin"());



CREATE POLICY "teachers_read_teacher_updates" ON "newsletters"."teacher_updates" FOR SELECT TO "authenticated" USING ("newsletters"."is_teacher_or_admin"());



CREATE POLICY "teachers_softdelete_section_images" ON "newsletters"."section_images" FOR UPDATE TO "authenticated" USING ("newsletters"."is_teacher_or_admin"()) WITH CHECK ("newsletters"."is_teacher_or_admin"());



CREATE POLICY "teachers_update_newsletters" ON "newsletters"."newsletters" FOR UPDATE TO "authenticated" USING ((("is_deleted" = false) AND "newsletters"."is_teacher_or_admin"())) WITH CHECK ("newsletters"."is_teacher_or_admin"());



CREATE POLICY "teachers_update_sections" ON "newsletters"."sections" FOR UPDATE TO "authenticated" USING ("newsletters"."is_teacher_or_admin"()) WITH CHECK ("newsletters"."is_teacher_or_admin"());



CREATE POLICY "teachers_update_teacher_updates" ON "newsletters"."teacher_updates" FOR UPDATE TO "authenticated" USING ("newsletters"."is_teacher_or_admin"()) WITH CHECK ("newsletters"."is_teacher_or_admin"());



CREATE POLICY "Active grantee can access owner checklist" ON "parent_app"."onboarding_checklist" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "onboarding_checklist"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "onboarding_checklist"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can access owner dropoff times" ON "parent_app"."dropoff_times" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "dropoff_times"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "dropoff_times"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can access owner learning notes" ON "parent_app"."student_learning_notes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "student_learning_notes"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "student_learning_notes"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can access owner pickup persons" ON "parent_app"."student_authorized_pickup_persons" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "student_authorized_pickup_persons"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "student_authorized_pickup_persons"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can access owner pickup plan" ON "parent_app"."student_authorized_pickup_plan" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "student_authorized_pickup_plan"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "student_authorized_pickup_plan"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can access owner preferences" ON "parent_app"."activity_preferences" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "activity_preferences"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "activity_preferences"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can view owner applications" ON "parent_app"."applications" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "applications"."user_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can view owner enrollment signatures" ON "parent_app"."enrollment_signatures" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "enrollment_signatures"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can view owner health info" ON "parent_app"."student_health_info" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "student_health_info"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can view owner health statement" ON "parent_app"."student_health_statement" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "student_health_statement"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can view owner medication plan" ON "parent_app"."student_medication_plan" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "student_medication_plan"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can view owner photo release" ON "parent_app"."student_photo_release_consent" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "student_photo_release_consent"."parent_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Active grantee can view owner referrals" ON "parent_app"."referrals" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "parent_app"."dashboard_access_grants"
  WHERE (("dashboard_access_grants"."owner_id" = "referrals"."referrer_id") AND ("dashboard_access_grants"."grantee_id" = "auth"."uid"()) AND ("dashboard_access_grants"."status" = 'active'::"text")))));



CREATE POLICY "Admin full access" ON "parent_app"."dashboard_access_grants" USING (true) WITH CHECK (true);



CREATE POLICY "Admin full access" ON "parent_app"."student_authorized_pickup_persons" USING (true) WITH CHECK (true);



CREATE POLICY "Admin full access" ON "parent_app"."student_authorized_pickup_plan" USING (true) WITH CHECK (true);



CREATE POLICY "Admin full access to health statement" ON "parent_app"."student_health_statement" USING (true) WITH CHECK (true);



CREATE POLICY "Admin full access to photo release consent" ON "parent_app"."student_photo_release_consent" USING (true) WITH CHECK (true);



CREATE POLICY "Grantee can view own grants" ON "parent_app"."dashboard_access_grants" FOR SELECT TO "authenticated" USING (("grantee_id" = "auth"."uid"()));



CREATE POLICY "Parents can read own applications" ON "parent_app"."applications" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Parents can read own authorized pickup plan" ON "parent_app"."student_authorized_pickup_plan" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "Parents can read own health info" ON "parent_app"."student_health_info" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "Parents can read own health statement" ON "parent_app"."student_health_statement" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "Parents can read own medication plan" ON "parent_app"."student_medication_plan" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "Parents can read own photo release consent" ON "parent_app"."student_photo_release_consent" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "Parents can read own signatures" ON "parent_app"."enrollment_signatures" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "Parents can view their own referrals" ON "parent_app"."referrals" FOR SELECT USING (("referrer_id" = "auth"."uid"()));



CREATE POLICY "Staff can view all activity preferences" ON "parent_app"."activity_preferences" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['teacher'::"text", 'super_admin'::"text"]))))));



CREATE POLICY "Users can insert own onboarding checklist" ON "parent_app"."onboarding_checklist" FOR INSERT TO "authenticated" WITH CHECK (("parent_id" = "auth"."uid"()));



CREATE POLICY "Users can read own onboarding checklist" ON "parent_app"."onboarding_checklist" FOR SELECT TO "authenticated" USING (("parent_id" = "auth"."uid"()));



CREATE POLICY "Users can update own onboarding checklist" ON "parent_app"."onboarding_checklist" FOR UPDATE TO "authenticated" USING (("parent_id" = "auth"."uid"())) WITH CHECK (("parent_id" = "auth"."uid"()));



ALTER TABLE "parent_app"."activity_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "parent_app"."application_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "parent_app"."applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "consent_select_for_staff" ON "parent_app"."student_photo_release_consent" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "parent_app"."dashboard_access_grants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "parent_app"."dropoff_times" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "parent_app"."enrollment_signatures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "parent_app"."onboarding_checklist" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parent can delete own defaults" ON "parent_app"."student_default_preferences" FOR DELETE USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can delete own pickup persons" ON "parent_app"."student_authorized_pickup_persons" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can delete own pickup plan" ON "parent_app"."student_authorized_pickup_plan" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can insert own defaults" ON "parent_app"."student_default_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can insert own dropoff slot" ON "parent_app"."dropoff_times" FOR INSERT WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can insert own pickup persons" ON "parent_app"."student_authorized_pickup_persons" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can insert own pickup plan" ON "parent_app"."student_authorized_pickup_plan" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can read own defaults" ON "parent_app"."student_default_preferences" FOR SELECT USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can read own dropoff slot" ON "parent_app"."dropoff_times" FOR SELECT USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can select own pickup persons" ON "parent_app"."student_authorized_pickup_persons" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can select own pickup plan" ON "parent_app"."student_authorized_pickup_plan" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can update own defaults" ON "parent_app"."student_default_preferences" FOR UPDATE USING (("auth"."uid"() = "parent_id")) WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can update own dropoff slot" ON "parent_app"."dropoff_times" FOR UPDATE USING (("auth"."uid"() = "parent_id")) WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can update own pickup persons" ON "parent_app"."student_authorized_pickup_persons" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "parent_id")) WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent can update own pickup plan" ON "parent_app"."student_authorized_pickup_plan" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "parent_id")) WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent own row" ON "parent_app"."dropoff_times" USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent_delete_own_prefs" ON "parent_app"."activity_preferences" FOR DELETE USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent_insert_own_prefs" ON "parent_app"."activity_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent_own_notes" ON "parent_app"."student_learning_notes" USING (("parent_id" = "auth"."uid"())) WITH CHECK (("parent_id" = "auth"."uid"()));



CREATE POLICY "parent_select_own_prefs" ON "parent_app"."activity_preferences" FOR SELECT USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "parent_update_own_prefs" ON "parent_app"."activity_preferences" FOR UPDATE USING (("auth"."uid"() = "parent_id")) WITH CHECK (("auth"."uid"() = "parent_id"));



ALTER TABLE "parent_app"."referrals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff can read student_default_preferences" ON "parent_app"."student_default_preferences" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "staff_select_applications" ON "parent_app"."applications" FOR SELECT TO "authenticated" USING ("public"."is_staff"());



ALTER TABLE "parent_app"."student_authorized_pickup_persons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "parent_app"."student_authorized_pickup_plan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "parent_app"."student_default_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "parent_app"."student_health_statement" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "parent_app"."student_learning_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "parent_app"."student_photo_release_consent" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teachers_select_student_applications" ON "parent_app"."applications" FOR SELECT TO "authenticated" USING ("teachers"."is_teacher_of"("student_id"));



CREATE POLICY "teachers_select_student_health_info" ON "parent_app"."student_health_info" FOR SELECT TO "authenticated" USING ("teachers"."is_teacher_of"("student_id"));



CREATE POLICY "authenticated_read_comments" ON "reels"."comments" FOR SELECT TO "authenticated" USING (("is_deleted" = false));



CREATE POLICY "authenticated_read_reactions" ON "reels"."reactions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_reels" ON "reels"."posts" FOR SELECT TO "authenticated" USING (("is_deleted" = false));



ALTER TABLE "reels"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "reels"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "reels"."reactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teachers_insert_reels" ON "reels"."posts" FOR INSERT TO "authenticated" WITH CHECK (("reels"."is_teacher_or_admin"() AND ("teacher_id" = "auth"."uid"())));



CREATE POLICY "teachers_update_own_reels" ON "reels"."posts" FOR UPDATE TO "authenticated" USING (("teacher_id" = "auth"."uid"())) WITH CHECK (("teacher_id" = "auth"."uid"()));



CREATE POLICY "users_delete_own_reaction" ON "reels"."reactions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_insert_own_comment" ON "reels"."comments" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "users_insert_own_reaction" ON "reels"."reactions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_soft_delete_own_comment" ON "reels"."comments" FOR UPDATE TO "authenticated" USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Active grantee can view teacher assignments" ON "teachers"."teacher_students" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("admin"."students" "s"
     JOIN "parent_app"."dashboard_access_grants" "g" ON (("g"."owner_id" = "s"."parent_id")))
  WHERE (("s"."id" = "teacher_students"."student_id") AND ("g"."grantee_id" = "auth"."uid"()) AND ("g"."status" = 'active'::"text")))));



CREATE POLICY "Admin full access" ON "teachers"."clock_sessions" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admin full access" ON "teachers"."teacher_students" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins have full access to note attachments" ON "teachers"."teacher_note_attachments" USING ((("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text"));



CREATE POLICY "Admins have full access to teacher notes" ON "teachers"."teacher_notes" USING ((("auth"."jwt"() ->> 'role'::"text") = 'super_admin'::"text"));



CREATE POLICY "Authenticated users can read teacher experience" ON "teachers"."teacher_experience" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_deleted" = false)));



CREATE POLICY "Authenticated users can read teacher profiles" ON "teachers"."teacher_profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can read teacher qualifications" ON "teachers"."teacher_qualifications" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_deleted" = false)));



CREATE POLICY "Teachers can manage their own experience" ON "teachers"."teacher_experience" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Teachers can manage their own note attachments" ON "teachers"."teacher_note_attachments" USING (("note_id" IN ( SELECT "teacher_notes"."id"
   FROM "teachers"."teacher_notes"
  WHERE ("teacher_notes"."teacher_id" = "auth"."uid"())))) WITH CHECK (("note_id" IN ( SELECT "teacher_notes"."id"
   FROM "teachers"."teacher_notes"
  WHERE ("teacher_notes"."teacher_id" = "auth"."uid"()))));



CREATE POLICY "Teachers can manage their own notes" ON "teachers"."teacher_notes" USING (("teacher_id" = "auth"."uid"())) WITH CHECK (("teacher_id" = "auth"."uid"()));



CREATE POLICY "Teachers can manage their own profile" ON "teachers"."teacher_profiles" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Teachers can manage their own qualifications" ON "teachers"."teacher_qualifications" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Teachers can manage their own sessions" ON "teachers"."clock_sessions" USING (("teacher_id" = "auth"."uid"()));



CREATE POLICY "Teachers can view their own students" ON "teachers"."teacher_students" FOR SELECT USING (("teacher_id" = "auth"."uid"()));



ALTER TABLE "teachers"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "teachers"."activity_change_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "teachers"."activity_food_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "teachers"."activity_foods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "teachers"."activity_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "teachers"."activity_ingredient_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "teachers"."activity_ingredients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_select_activity_foods" ON "teachers"."activity_foods" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "teachers"."activities" "a"
  WHERE (("a"."id" = "activity_foods"."activity_id") AND ("a"."status" = 'published'::"text") AND ("a"."visibility" = 'public'::"text") AND ("a"."is_deleted" = false)))));



CREATE POLICY "authenticated_select_ingredients" ON "teachers"."activity_ingredients" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("teachers"."activity_foods" "f"
     JOIN "teachers"."activities" "a" ON (("a"."id" = "f"."activity_id")))
  WHERE (("f"."id" = "activity_ingredients"."food_id") AND ("a"."status" = 'published'::"text") AND ("a"."visibility" = 'public'::"text") AND ("a"."is_deleted" = false)))));



CREATE POLICY "authenticated_select_published_activities" ON "teachers"."activities" FOR SELECT TO "authenticated" USING ((("status" = 'published'::"text") AND ("visibility" = 'public'::"text") AND ("is_deleted" = false)));



ALTER TABLE "teachers"."clock_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parents_read_own_student_teachers" ON "teachers"."teacher_students" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."students" "s"
  WHERE (("s"."id" = "teacher_students"."student_id") AND ("s"."parent_id" = "auth"."uid"()) AND ("s"."is_deleted" = false)))));



CREATE POLICY "parents_read_teacher_roster" ON "teachers"."teacher_students" FOR SELECT TO "authenticated" USING (("teacher_id" IN ( SELECT "teachers"."get_teacher_ids_for_parent"("auth"."uid"()) AS "get_teacher_ids_for_parent")));



ALTER TABLE "teachers"."paystubs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "teachers"."photo_student_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "photo_tags_delete" ON "teachers"."photo_student_tags" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "teachers"."photos" "p"
  WHERE (("p"."id" = "photo_student_tags"."photo_id") AND ("p"."teacher_id" = "auth"."uid"())))));



CREATE POLICY "photo_tags_insert" ON "teachers"."photo_student_tags" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "teachers"."photos" "p"
  WHERE (("p"."id" = "photo_student_tags"."photo_id") AND ("p"."teacher_id" = "auth"."uid"())))));



CREATE POLICY "photo_tags_select" ON "teachers"."photo_student_tags" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "teachers"."photos" "p"
  WHERE (("p"."id" = "photo_student_tags"."photo_id") AND ("p"."teacher_id" = "auth"."uid"())))));



ALTER TABLE "teachers"."photos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teacher_delete_activity_foods" ON "teachers"."activity_foods" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "teachers"."activities" "a"
  WHERE (("a"."id" = "activity_foods"."activity_id") AND ("a"."created_by" = "auth"."uid"())))));



CREATE POLICY "teacher_delete_activity_images" ON "teachers"."activity_images" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "teachers"."activities" "a"
  WHERE (("a"."id" = "activity_images"."activity_id") AND ("a"."created_by" = "auth"."uid"())))));



CREATE POLICY "teacher_delete_food_images" ON "teachers"."activity_food_images" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("teachers"."activity_foods" "f"
     JOIN "teachers"."activities" "a" ON (("a"."id" = "f"."activity_id")))
  WHERE (("f"."id" = "activity_food_images"."food_id") AND ("a"."created_by" = "auth"."uid"())))));



CREATE POLICY "teacher_delete_ingredient_images" ON "teachers"."activity_ingredient_images" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("teachers"."activity_ingredients" "i"
     JOIN "teachers"."activity_foods" "f" ON (("f"."id" = "i"."food_id")))
     JOIN "teachers"."activities" "a" ON (("a"."id" = "f"."activity_id")))
  WHERE (("i"."id" = "activity_ingredient_images"."ingredient_id") AND ("a"."created_by" = "auth"."uid"())))));



CREATE POLICY "teacher_delete_ingredients" ON "teachers"."activity_ingredients" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("teachers"."activity_foods" "f"
     JOIN "teachers"."activities" "a" ON (("a"."id" = "f"."activity_id")))
  WHERE (("f"."id" = "activity_ingredients"."food_id") AND ("a"."created_by" = "auth"."uid"())))));



ALTER TABLE "teachers"."teacher_experience" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teacher_insert_activities" ON "teachers"."activities" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "teacher_insert_activity_foods" ON "teachers"."activity_foods" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "teachers"."activities" "a"
  WHERE (("a"."id" = "activity_foods"."activity_id") AND ("a"."created_by" = "auth"."uid"())))));



CREATE POLICY "teacher_insert_activity_images" ON "teachers"."activity_images" FOR INSERT TO "authenticated" WITH CHECK ((("uploaded_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "teachers"."activities" "a"
  WHERE (("a"."id" = "activity_images"."activity_id") AND ("a"."created_by" = "auth"."uid"()))))));



CREATE POLICY "teacher_insert_change_log" ON "teachers"."activity_change_log" FOR INSERT TO "authenticated" WITH CHECK ((("teacher_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "teachers"."activities" "a"
  WHERE (("a"."id" = "activity_change_log"."activity_id") AND ("a"."created_by" = "auth"."uid"()))))));



CREATE POLICY "teacher_insert_food_images" ON "teachers"."activity_food_images" FOR INSERT TO "authenticated" WITH CHECK ((("uploaded_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("teachers"."activity_foods" "f"
     JOIN "teachers"."activities" "a" ON (("a"."id" = "f"."activity_id")))
  WHERE (("f"."id" = "activity_food_images"."food_id") AND ("a"."created_by" = "auth"."uid"()))))));



CREATE POLICY "teacher_insert_ingredient_images" ON "teachers"."activity_ingredient_images" FOR INSERT TO "authenticated" WITH CHECK ((("uploaded_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM (("teachers"."activity_ingredients" "i"
     JOIN "teachers"."activity_foods" "f" ON (("f"."id" = "i"."food_id")))
     JOIN "teachers"."activities" "a" ON (("a"."id" = "f"."activity_id")))
  WHERE (("i"."id" = "activity_ingredient_images"."ingredient_id") AND ("a"."created_by" = "auth"."uid"()))))));



CREATE POLICY "teacher_insert_ingredients" ON "teachers"."activity_ingredients" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("teachers"."activity_foods" "f"
     JOIN "teachers"."activities" "a" ON (("a"."id" = "f"."activity_id")))
  WHERE (("f"."id" = "activity_ingredients"."food_id") AND ("a"."created_by" = "auth"."uid"())))));



CREATE POLICY "teacher_insert_own_paystubs" ON "teachers"."paystubs" FOR INSERT WITH CHECK (("auth"."uid"() = "teacher_id"));



ALTER TABLE "teachers"."teacher_note_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "teachers"."teacher_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teacher_photos_insert" ON "teachers"."photos" FOR INSERT TO "authenticated" WITH CHECK (("teacher_id" = "auth"."uid"()));



CREATE POLICY "teacher_photos_select" ON "teachers"."photos" FOR SELECT TO "authenticated" USING ((("teacher_id" = "auth"."uid"()) AND ("is_deleted" = false)));



CREATE POLICY "teacher_photos_update" ON "teachers"."photos" FOR UPDATE TO "authenticated" USING (("teacher_id" = "auth"."uid"())) WITH CHECK (("teacher_id" = "auth"."uid"()));



ALTER TABLE "teachers"."teacher_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "teachers"."teacher_qualifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teacher_read_own_paystubs" ON "teachers"."paystubs" FOR SELECT USING (("auth"."uid"() = "teacher_id"));



CREATE POLICY "teacher_read_own_sessions" ON "teachers"."clock_sessions" FOR SELECT USING (("auth"."uid"() = "teacher_id"));



CREATE POLICY "teacher_select_activity_foods" ON "teachers"."activity_foods" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "teachers"."activities" "a"
  WHERE (("a"."id" = "activity_foods"."activity_id") AND ("a"."created_by" = "auth"."uid"()) AND ("a"."is_deleted" = false)))));



CREATE POLICY "teacher_select_activity_images" ON "teachers"."activity_images" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "teachers"."activities" "a"
  WHERE (("a"."id" = "activity_images"."activity_id") AND ("a"."created_by" = "auth"."uid"()) AND ("a"."is_deleted" = false)))));



CREATE POLICY "teacher_select_change_log" ON "teachers"."activity_change_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "teachers"."activities" "a"
  WHERE (("a"."id" = "activity_change_log"."activity_id") AND ("a"."created_by" = "auth"."uid"())))));



CREATE POLICY "teacher_select_food_images" ON "teachers"."activity_food_images" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("teachers"."activity_foods" "f"
     JOIN "teachers"."activities" "a" ON (("a"."id" = "f"."activity_id")))
  WHERE (("f"."id" = "activity_food_images"."food_id") AND ("a"."created_by" = "auth"."uid"()) AND ("a"."is_deleted" = false)))));



CREATE POLICY "teacher_select_ingredient_images" ON "teachers"."activity_ingredient_images" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM (("teachers"."activity_ingredients" "i"
     JOIN "teachers"."activity_foods" "f" ON (("f"."id" = "i"."food_id")))
     JOIN "teachers"."activities" "a" ON (("a"."id" = "f"."activity_id")))
  WHERE (("i"."id" = "activity_ingredient_images"."ingredient_id") AND ("a"."created_by" = "auth"."uid"()) AND ("a"."is_deleted" = false)))));



CREATE POLICY "teacher_select_ingredients" ON "teachers"."activity_ingredients" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("teachers"."activity_foods" "f"
     JOIN "teachers"."activities" "a" ON (("a"."id" = "f"."activity_id")))
  WHERE (("f"."id" = "activity_ingredients"."food_id") AND ("a"."created_by" = "auth"."uid"()) AND ("a"."is_deleted" = false)))));



CREATE POLICY "teacher_select_own_activities" ON "teachers"."activities" FOR SELECT TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND ("is_deleted" = false)));



ALTER TABLE "teachers"."teacher_students" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teacher_update_own_activities" ON "teachers"."activities" FOR UPDATE TO "authenticated" USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "teachers can delete own photos" ON "teachers"."photos" FOR DELETE TO "authenticated" USING (("teacher_id" = "auth"."uid"()));



CREATE POLICY "teachers can insert own photo tags" ON "teachers"."photo_student_tags" FOR INSERT TO "authenticated" WITH CHECK (("photo_id" IN ( SELECT "photos"."id"
   FROM "teachers"."photos"
  WHERE ("photos"."teacher_id" = "auth"."uid"()))));



CREATE POLICY "teachers can insert own photos" ON "teachers"."photos" FOR INSERT TO "authenticated" WITH CHECK (("teacher_id" = "auth"."uid"()));



CREATE POLICY "teachers can update own photos" ON "teachers"."photos" FOR UPDATE TO "authenticated" USING (("teacher_id" = "auth"."uid"()));



CREATE POLICY "teachers_insert_own_attachments" ON "teachers"."teacher_note_attachments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "teachers"."teacher_notes" "tn"
  WHERE (("tn"."id" = "teacher_note_attachments"."note_id") AND ("tn"."teacher_id" = "auth"."uid"())))));



CREATE POLICY "teachers_insert_own_notes" ON "teachers"."teacher_notes" FOR INSERT TO "authenticated" WITH CHECK (("teacher_id" = "auth"."uid"()));



CREATE POLICY "teachers_select_own_attachments" ON "teachers"."teacher_note_attachments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "teachers"."teacher_notes" "tn"
  WHERE (("tn"."id" = "teacher_note_attachments"."note_id") AND ("tn"."teacher_id" = "auth"."uid"())))));



CREATE POLICY "teachers_select_own_notes" ON "teachers"."teacher_notes" FOR SELECT TO "authenticated" USING (("teacher_id" = "auth"."uid"()));



CREATE POLICY "teachers_select_own_students" ON "teachers"."teacher_students" FOR SELECT TO "authenticated" USING (("teacher_id" = "auth"."uid"()));



CREATE POLICY "teachers_update_own_notes" ON "teachers"."teacher_notes" FOR UPDATE TO "authenticated" USING (("teacher_id" = "auth"."uid"())) WITH CHECK (("teacher_id" = "auth"."uid"()));



CREATE POLICY "Admins can delete waitlist submissions" ON "waitlist"."submissions" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can update waitlist submissions" ON "waitlist"."submissions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all waitlist submissions" ON "waitlist"."submissions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "admin"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Allow insert waitlist submissions" ON "waitlist"."submissions" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Prevent public read of waitlist" ON "waitlist"."submissions" FOR SELECT TO "anon" USING (false);



ALTER TABLE "waitlist"."submissions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "messaging"."messages";



GRANT USAGE ON SCHEMA "admin" TO "authenticated";
GRANT USAGE ON SCHEMA "admin" TO "service_role";



GRANT USAGE ON SCHEMA "attendance" TO "authenticated";
GRANT USAGE ON SCHEMA "attendance" TO "anon";
GRANT USAGE ON SCHEMA "attendance" TO "service_role";



GRANT USAGE ON SCHEMA "billing" TO "service_role";
GRANT USAGE ON SCHEMA "billing" TO "authenticated";



GRANT USAGE ON SCHEMA "blogs" TO "authenticated";
GRANT USAGE ON SCHEMA "blogs" TO "service_role";
GRANT USAGE ON SCHEMA "blogs" TO "anon";



GRANT USAGE ON SCHEMA "budget" TO "authenticated";
GRANT USAGE ON SCHEMA "budget" TO "service_role";



GRANT USAGE ON SCHEMA "calendar" TO "anon";
GRANT USAGE ON SCHEMA "calendar" TO "authenticated";
GRANT USAGE ON SCHEMA "calendar" TO "service_role";



GRANT USAGE ON SCHEMA "care_log" TO "authenticated";
GRANT USAGE ON SCHEMA "care_log" TO "service_role";



GRANT USAGE ON SCHEMA "contact" TO "anon";
GRANT USAGE ON SCHEMA "contact" TO "authenticated";



GRANT USAGE ON SCHEMA "contracts" TO "anon";
GRANT USAGE ON SCHEMA "contracts" TO "authenticated";



GRANT USAGE ON SCHEMA "donations" TO "service_role";



GRANT USAGE ON SCHEMA "email_logs" TO "service_role";



GRANT USAGE ON SCHEMA "feed" TO "authenticated";
GRANT USAGE ON SCHEMA "feed" TO "service_role";



GRANT USAGE ON SCHEMA "inventory" TO "authenticated";
GRANT USAGE ON SCHEMA "inventory" TO "service_role";



GRANT USAGE ON SCHEMA "marketing" TO "anon";
GRANT USAGE ON SCHEMA "marketing" TO "authenticated";
GRANT USAGE ON SCHEMA "marketing" TO "service_role";



GRANT USAGE ON SCHEMA "messaging" TO "anon";
GRANT USAGE ON SCHEMA "messaging" TO "authenticated";
GRANT USAGE ON SCHEMA "messaging" TO "service_role";






GRANT USAGE ON SCHEMA "newsletters" TO "authenticated";
GRANT USAGE ON SCHEMA "newsletters" TO "service_role";



GRANT USAGE ON SCHEMA "parent_app" TO "authenticated";
GRANT USAGE ON SCHEMA "parent_app" TO "anon";
GRANT USAGE ON SCHEMA "parent_app" TO "service_role";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "reels" TO "service_role";



GRANT USAGE ON SCHEMA "teachers" TO "authenticated";
GRANT USAGE ON SCHEMA "teachers" TO "service_role";
GRANT USAGE ON SCHEMA "teachers" TO "anon";



GRANT USAGE ON SCHEMA "waitlist" TO "anon";
GRANT USAGE ON SCHEMA "waitlist" TO "authenticated";



GRANT ALL ON FUNCTION "budget"."is_super_admin"() TO "authenticated";



GRANT ALL ON FUNCTION "care_log"."is_teacher_or_admin"() TO "authenticated";






















































































































































GRANT ALL ON FUNCTION "feed"."delete_own_post"("p_post_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "inventory"."is_admin"() TO "authenticated";



GRANT ALL ON FUNCTION "inventory"."is_teacher_or_admin"() TO "authenticated";



GRANT ALL ON FUNCTION "messaging"."is_participant"("conv_id" "uuid", "uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "messaging"."is_participant"("conv_id" "uuid", "uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "messaging"."is_participant"("conv_id" "uuid", "uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "newsletters"."is_teacher_or_admin"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."find_or_create_conversation"("other_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."find_or_create_conversation"("other_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_or_create_conversation"("other_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_school_photos"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_school_photos"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_school_photos"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_teacher_assignments"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_teacher_assignments"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_teacher_assignments"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_channel_members"("p_channel_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_channel_members"("p_channel_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_channel_members"("p_channel_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_channels_with_meta"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_channels_with_meta"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_channels_with_meta"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversation_list"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversation_list"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversation_list"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_conversations_with_meta"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_conversations_with_meta"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_conversations_with_meta"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_dashboard_snapshot"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_snapshot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_snapshot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_reels_with_authors"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_reels_with_authors"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reels_with_authors"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_teacher_photos"("p_teacher_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_teacher_photos"("p_teacher_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_teacher_photos"("p_teacher_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_names"("user_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_names"("user_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_names"("user_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_staff"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_staff"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_staff"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rpc_home_screen_data"("p_user_id" "uuid", "p_parent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_home_screen_data"("p_user_id" "uuid", "p_parent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_home_screen_data"("p_user_id" "uuid", "p_parent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."soft_delete_inventory_item"("item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."soft_delete_inventory_item"("item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_inventory_item"("item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_student_profile_fields"("p_student_id" "uuid", "p_has_medical_conditions" "text", "p_medical_conditions_description" "text", "p_has_allergies" "text", "p_allergies_description" "text", "p_has_emergency_medications" "text", "p_emergency_medications_description" "text", "p_learning_style" "text", "p_strengths_interests" "text", "p_current_challenges" "text", "p_dysregulation_response" "text", "p_regulation_strategies" "text", "p_activities_to_avoid" "text", "p_needs_aide" "text", "p_needs_aide_description" "text", "p_history_flags" "text", "p_history_explanation" "text", "p_special_interests" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_student_profile_fields"("p_student_id" "uuid", "p_has_medical_conditions" "text", "p_medical_conditions_description" "text", "p_has_allergies" "text", "p_allergies_description" "text", "p_has_emergency_medications" "text", "p_emergency_medications_description" "text", "p_learning_style" "text", "p_strengths_interests" "text", "p_current_challenges" "text", "p_dysregulation_response" "text", "p_regulation_strategies" "text", "p_activities_to_avoid" "text", "p_needs_aide" "text", "p_needs_aide_description" "text", "p_history_flags" "text", "p_history_explanation" "text", "p_special_interests" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_student_profile_fields"("p_student_id" "uuid", "p_has_medical_conditions" "text", "p_medical_conditions_description" "text", "p_has_allergies" "text", "p_allergies_description" "text", "p_has_emergency_medications" "text", "p_emergency_medications_description" "text", "p_learning_style" "text", "p_strengths_interests" "text", "p_current_challenges" "text", "p_dysregulation_response" "text", "p_regulation_strategies" "text", "p_activities_to_avoid" "text", "p_needs_aide" "text", "p_needs_aide_description" "text", "p_history_flags" "text", "p_history_explanation" "text", "p_special_interests" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_student_profile_image"("p_student_id" "uuid", "p_image_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_student_profile_image"("p_student_id" "uuid", "p_image_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_student_profile_image"("p_student_id" "uuid", "p_image_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_profile_image"("p_image_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_profile_image"("p_image_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_profile_image"("p_image_url" "text") TO "service_role";












GRANT ALL ON TABLE "admin"."android_download_requests" TO "service_role";



GRANT ALL ON TABLE "admin"."development_tasks" TO "service_role";



GRANT ALL ON TABLE "admin"."help_requests" TO "service_role";
GRANT SELECT,INSERT ON TABLE "admin"."help_requests" TO "authenticated";



GRANT ALL ON TABLE "admin"."parent_feedback" TO "service_role";
GRANT SELECT,INSERT ON TABLE "admin"."parent_feedback" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "admin"."students" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "admin"."students" TO "authenticated";
GRANT SELECT,INSERT,UPDATE ON TABLE "admin"."students" TO "service_role";



GRANT ALL ON TABLE "admin"."tuition_feedback" TO "service_role";



GRANT SELECT ON TABLE "admin"."users" TO "authenticated";
GRANT ALL ON TABLE "admin"."users" TO "service_role";



GRANT SELECT,INSERT ON TABLE "admin"."volunteer_interests" TO "service_role";
GRANT SELECT,INSERT ON TABLE "admin"."volunteer_interests" TO "authenticated";



GRANT ALL ON TABLE "attendance"."aftercare_records" TO "anon";
GRANT ALL ON TABLE "attendance"."aftercare_records" TO "authenticated";
GRANT ALL ON TABLE "attendance"."aftercare_records" TO "service_role";



GRANT ALL ON TABLE "attendance"."check_ins" TO "authenticated";
GRANT ALL ON TABLE "attendance"."check_ins" TO "anon";
GRANT ALL ON TABLE "attendance"."check_ins" TO "service_role";



GRANT ALL ON TABLE "attendance"."field_friday_records" TO "anon";
GRANT ALL ON TABLE "attendance"."field_friday_records" TO "authenticated";
GRANT ALL ON TABLE "attendance"."field_friday_records" TO "service_role";



GRANT ALL ON TABLE "attendance"."summer_records" TO "anon";
GRANT ALL ON TABLE "attendance"."summer_records" TO "authenticated";
GRANT ALL ON TABLE "attendance"."summer_records" TO "service_role";



GRANT ALL ON TABLE "billing"."homeschool_day_commitments" TO "service_role";



GRANT ALL ON TABLE "billing"."one_time_payments" TO "service_role";



GRANT ALL ON TABLE "billing"."pending_payment_requests" TO "service_role";
GRANT SELECT ON TABLE "billing"."pending_payment_requests" TO "authenticated";



GRANT ALL ON TABLE "billing"."stripe_transactions" TO "service_role";
GRANT SELECT ON TABLE "billing"."stripe_transactions" TO "authenticated";



GRANT ALL ON TABLE "billing"."summer_week_commitments" TO "service_role";



GRANT ALL ON TABLE "billing"."tuition_codes" TO "service_role";



GRANT ALL ON TABLE "blogs"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "blogs"."blog_posts" TO "service_role";
GRANT SELECT ON TABLE "blogs"."blog_posts" TO "anon";



GRANT ALL ON TABLE "budget"."expenses" TO "authenticated";
GRANT SELECT ON TABLE "budget"."expenses" TO "service_role";



GRANT ALL ON TABLE "budget"."income" TO "authenticated";
GRANT SELECT ON TABLE "budget"."income" TO "service_role";



GRANT ALL ON TABLE "budget"."line_items" TO "authenticated";
GRANT SELECT ON TABLE "budget"."line_items" TO "service_role";



GRANT ALL ON TABLE "budget"."settings" TO "authenticated";
GRANT SELECT ON TABLE "budget"."settings" TO "service_role";



GRANT ALL ON TABLE "calendar"."events" TO "anon";
GRANT ALL ON TABLE "calendar"."events" TO "authenticated";
GRANT ALL ON TABLE "calendar"."events" TO "service_role";



GRANT ALL ON TABLE "care_log"."entries" TO "authenticated";
GRANT ALL ON TABLE "care_log"."entries" TO "service_role";



GRANT INSERT ON TABLE "contact"."account_deletion_requests" TO "anon";
GRANT ALL ON TABLE "contact"."account_deletion_requests" TO "authenticated";



GRANT INSERT ON TABLE "contact"."submissions" TO "anon";
GRANT ALL ON TABLE "contact"."submissions" TO "authenticated";



GRANT SELECT,INSERT,UPDATE ON TABLE "contracts"."documents" TO "authenticated";
GRANT SELECT ON TABLE "contracts"."documents" TO "anon";



GRANT SELECT,INSERT ON TABLE "contracts"."history" TO "authenticated";
GRANT SELECT ON TABLE "contracts"."history" TO "anon";



GRANT ALL ON TABLE "donations"."donations" TO "service_role";



GRANT ALL ON TABLE "email_logs"."sends" TO "service_role";









GRANT ALL ON TABLE "feed"."post_attachments" TO "authenticated";
GRANT ALL ON TABLE "feed"."post_attachments" TO "service_role";



GRANT ALL ON TABLE "feed"."post_comments" TO "authenticated";
GRANT ALL ON TABLE "feed"."post_comments" TO "service_role";



GRANT ALL ON TABLE "feed"."post_media" TO "authenticated";
GRANT ALL ON TABLE "feed"."post_media" TO "service_role";



GRANT ALL ON TABLE "feed"."post_reactions" TO "authenticated";
GRANT ALL ON TABLE "feed"."post_reactions" TO "service_role";



GRANT ALL ON TABLE "feed"."posts" TO "authenticated";
GRANT ALL ON TABLE "feed"."posts" TO "service_role";



GRANT ALL ON TABLE "inventory"."history_events" TO "authenticated";
GRANT ALL ON TABLE "inventory"."history_events" TO "service_role";



GRANT ALL ON TABLE "inventory"."items" TO "authenticated";
GRANT ALL ON TABLE "inventory"."items" TO "service_role";



GRANT ALL ON TABLE "inventory"."photos" TO "authenticated";
GRANT ALL ON TABLE "inventory"."photos" TO "service_role";



GRANT ALL ON TABLE "inventory"."shopping_requests" TO "authenticated";
GRANT ALL ON TABLE "inventory"."shopping_requests" TO "service_role";



GRANT ALL ON TABLE "marketing"."beach_bash_registrations" TO "service_role";
GRANT INSERT ON TABLE "marketing"."beach_bash_registrations" TO "anon";



GRANT INSERT ON TABLE "marketing"."free_friday_registrations" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "marketing"."free_friday_registrations" TO "authenticated";
GRANT ALL ON TABLE "marketing"."free_friday_registrations" TO "service_role";



GRANT INSERT ON TABLE "marketing"."info_session_rsvps" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "marketing"."info_session_rsvps" TO "authenticated";
GRANT ALL ON TABLE "marketing"."info_session_rsvps" TO "service_role";



GRANT INSERT ON TABLE "marketing"."meet_miss_joy_rsvps" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "marketing"."meet_miss_joy_rsvps" TO "authenticated";
GRANT ALL ON TABLE "marketing"."meet_miss_joy_rsvps" TO "service_role";



GRANT INSERT ON TABLE "marketing"."open_house_rsvps" TO "anon";
GRANT SELECT ON TABLE "marketing"."open_house_rsvps" TO "authenticated";
GRANT ALL ON TABLE "marketing"."open_house_rsvps" TO "service_role";



GRANT INSERT ON TABLE "marketing"."referral_submissions" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "marketing"."referral_submissions" TO "authenticated";
GRANT ALL ON TABLE "marketing"."referral_submissions" TO "service_role";



GRANT ALL ON TABLE "marketing"."school_year_2026_commitments" TO "service_role";



GRANT ALL ON TABLE "marketing"."shadow_day_bookings" TO "service_role";
GRANT INSERT ON TABLE "marketing"."shadow_day_bookings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "marketing"."shadow_day_bookings" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "marketing"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "marketing"."testimonials" TO "service_role";



GRANT INSERT ON TABLE "marketing"."tour_bookings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "marketing"."tour_bookings" TO "authenticated";
GRANT ALL ON TABLE "marketing"."tour_bookings" TO "service_role";



GRANT SELECT ON TABLE "marketing"."tour_unavailability" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "marketing"."tour_unavailability" TO "authenticated";
GRANT ALL ON TABLE "marketing"."tour_unavailability" TO "service_role";



GRANT ALL ON TABLE "messaging"."channel_members" TO "service_role";
GRANT SELECT,INSERT,DELETE ON TABLE "messaging"."channel_members" TO "authenticated";



GRANT ALL ON TABLE "messaging"."channel_messages" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "messaging"."channel_messages" TO "authenticated";



GRANT ALL ON TABLE "messaging"."channels" TO "service_role";
GRANT SELECT ON TABLE "messaging"."channels" TO "authenticated";



GRANT SELECT,INSERT ON TABLE "messaging"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "messaging"."conversation_participants" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "messaging"."conversations" TO "authenticated";
GRANT ALL ON TABLE "messaging"."conversations" TO "service_role";



GRANT ALL ON TABLE "messaging"."message_reactions" TO "service_role";
GRANT SELECT,INSERT,DELETE ON TABLE "messaging"."message_reactions" TO "authenticated";



GRANT SELECT,INSERT,UPDATE ON TABLE "messaging"."messages" TO "authenticated";
GRANT ALL ON TABLE "messaging"."messages" TO "service_role";



GRANT ALL ON TABLE "newsletters"."change_log" TO "authenticated";
GRANT ALL ON TABLE "newsletters"."change_log" TO "service_role";



GRANT ALL ON TABLE "newsletters"."newsletters" TO "authenticated";
GRANT ALL ON TABLE "newsletters"."newsletters" TO "service_role";



GRANT ALL ON TABLE "newsletters"."section_images" TO "authenticated";
GRANT ALL ON TABLE "newsletters"."section_images" TO "service_role";



GRANT ALL ON TABLE "newsletters"."sections" TO "authenticated";
GRANT ALL ON TABLE "newsletters"."sections" TO "service_role";



GRANT ALL ON TABLE "newsletters"."teacher_updates" TO "authenticated";
GRANT ALL ON TABLE "newsletters"."teacher_updates" TO "service_role";



GRANT ALL ON TABLE "parent_app"."activity_preferences" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "parent_app"."activity_preferences" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."application_notes" TO "service_role";



GRANT ALL ON TABLE "parent_app"."applications" TO "anon";
GRANT ALL ON TABLE "parent_app"."applications" TO "authenticated";
GRANT ALL ON TABLE "parent_app"."applications" TO "service_role";



GRANT ALL ON TABLE "parent_app"."dashboard_access_grants" TO "service_role";
GRANT SELECT ON TABLE "parent_app"."dashboard_access_grants" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."dropoff_times" TO "authenticated";
GRANT ALL ON TABLE "parent_app"."dropoff_times" TO "service_role";



GRANT ALL ON TABLE "parent_app"."enrollment_signatures" TO "service_role";
GRANT SELECT ON TABLE "parent_app"."enrollment_signatures" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."onboarding_checklist" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "parent_app"."onboarding_checklist" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."referrals" TO "service_role";
GRANT SELECT ON TABLE "parent_app"."referrals" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."student_authorized_pickup_persons" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "parent_app"."student_authorized_pickup_persons" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."student_authorized_pickup_plan" TO "service_role";
GRANT SELECT ON TABLE "parent_app"."student_authorized_pickup_plan" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."student_default_preferences" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "parent_app"."student_default_preferences" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."student_health_info" TO "service_role";
GRANT SELECT ON TABLE "parent_app"."student_health_info" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."student_health_statement" TO "service_role";
GRANT SELECT ON TABLE "parent_app"."student_health_statement" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."student_learning_notes" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "parent_app"."student_learning_notes" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."student_medication_plan" TO "service_role";
GRANT SELECT ON TABLE "parent_app"."student_medication_plan" TO "authenticated";



GRANT ALL ON TABLE "parent_app"."student_medications" TO "service_role";



GRANT ALL ON TABLE "parent_app"."student_photo_release_consent" TO "service_role";
GRANT SELECT ON TABLE "parent_app"."student_photo_release_consent" TO "authenticated";



GRANT ALL ON TABLE "reels"."comments" TO "service_role";



GRANT ALL ON TABLE "reels"."posts" TO "service_role";



GRANT ALL ON TABLE "reels"."reactions" TO "service_role";



GRANT ALL ON TABLE "teachers"."activities" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "teachers"."activities" TO "authenticated";



GRANT ALL ON TABLE "teachers"."activity_change_log" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "teachers"."activity_change_log" TO "authenticated";



GRANT ALL ON TABLE "teachers"."activity_food_images" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "teachers"."activity_food_images" TO "authenticated";



GRANT ALL ON TABLE "teachers"."activity_foods" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "teachers"."activity_foods" TO "authenticated";



GRANT ALL ON TABLE "teachers"."activity_images" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "teachers"."activity_images" TO "authenticated";



GRANT ALL ON TABLE "teachers"."activity_ingredient_images" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "teachers"."activity_ingredient_images" TO "authenticated";



GRANT ALL ON TABLE "teachers"."activity_ingredients" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "teachers"."activity_ingredients" TO "authenticated";



GRANT ALL ON TABLE "teachers"."clock_sessions" TO "authenticated";
GRANT ALL ON TABLE "teachers"."clock_sessions" TO "service_role";



GRANT ALL ON TABLE "teachers"."paystubs" TO "service_role";
GRANT SELECT,INSERT ON TABLE "teachers"."paystubs" TO "authenticated";



GRANT ALL ON TABLE "teachers"."photo_student_tags" TO "service_role";
GRANT SELECT,INSERT ON TABLE "teachers"."photo_student_tags" TO "authenticated";



GRANT ALL ON TABLE "teachers"."photos" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "teachers"."photos" TO "authenticated";



GRANT ALL ON TABLE "teachers"."teacher_experience" TO "authenticated";
GRANT ALL ON TABLE "teachers"."teacher_experience" TO "service_role";



GRANT ALL ON TABLE "teachers"."teacher_note_attachments" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "teachers"."teacher_note_attachments" TO "authenticated";



GRANT ALL ON TABLE "teachers"."teacher_notes" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "teachers"."teacher_notes" TO "authenticated";



GRANT ALL ON TABLE "teachers"."teacher_profiles" TO "authenticated";
GRANT ALL ON TABLE "teachers"."teacher_profiles" TO "service_role";



GRANT ALL ON TABLE "teachers"."teacher_qualifications" TO "authenticated";
GRANT ALL ON TABLE "teachers"."teacher_qualifications" TO "service_role";



GRANT ALL ON TABLE "teachers"."teacher_students" TO "authenticated";
GRANT ALL ON TABLE "teachers"."teacher_students" TO "service_role";









GRANT INSERT ON TABLE "waitlist"."submissions" TO "anon";
GRANT ALL ON TABLE "waitlist"."submissions" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "attendance" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "attendance" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "attendance" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "attendance" GRANT ALL ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "billing" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "billing" GRANT ALL ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "calendar" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "calendar" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "calendar" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "calendar" GRANT ALL ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "donations" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "donations" GRANT ALL ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "email_logs" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "email_logs" GRANT ALL ON TABLES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop policy "Allow insert contact submissions" on "contact"."submissions";

drop policy "Allow insert waitlist submissions" on "waitlist"."submissions";


  create policy "Allow insert contact submissions"
  on "contact"."submissions"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Allow insert waitlist submissions"
  on "waitlist"."submissions"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Authenticated users can read teacher photos"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'teacher-photos'::text));



  create policy "Authenticated users can upload message files"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'message-files'::text));



  create policy "Authenticated users can upload message images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'message-images'::text));



  create policy "Authenticated users can upload profile images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'profile-images'::text));



  create policy "Parents and super_admins can view immunization records"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'immunization-records'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR public.is_super_admin())));



  create policy "Parents can delete their own immunization records"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'immunization-records'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Parents can read their own help request attachments"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'help-request-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Parents can upload help request attachments"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'help-request-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Parents can upload their own immunization records"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'immunization-records'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Public can view profile images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'profile-images'::text));



  create policy "Service role can read all help request attachments"
  on "storage"."objects"
  as permissive
  for select
  to service_role
using ((bucket_id = 'help-request-attachments'::text));



  create policy "Service role full access to health info forms"
  on "storage"."objects"
  as permissive
  for all
  to service_role
using ((bucket_id = 'health-info-forms'::text))
with check ((bucket_id = 'health-info-forms'::text));



  create policy "Service role full access to note attachments"
  on "storage"."objects"
  as permissive
  for all
  to service_role
using ((bucket_id = 'teacher-note-attachments'::text))
with check ((bucket_id = 'teacher-note-attachments'::text));



  create policy "Service role full access to religious exemption affidavits"
  on "storage"."objects"
  as permissive
  for all
  to service_role
using ((bucket_id = 'religious-exemption-affidavits'::text))
with check ((bucket_id = 'religious-exemption-affidavits'::text));



  create policy "Teachers can delete their own note attachments"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'teacher-note-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Teachers can read their own note attachments"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'teacher-note-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Teachers can upload their own note attachments"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'teacher-note-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can delete their own message files"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'message-files'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can delete their own message images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'message-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can delete their own religious exemption affidavits"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'religious-exemption-affidavits'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can read their own religious exemption affidavits"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'religious-exemption-affidavits'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload religious exemption affidavits"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'religious-exemption-affidavits'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "auth users update own profile image"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'profile-images'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))));



  create policy "auth users update student profile images"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'profile-images'::text) AND (name ~~ 'students/%'::text)));



  create policy "auth users upload own profile image"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'profile-images'::text) AND (name ~~ ((auth.uid())::text || '/%'::text))));



  create policy "auth users upload student profile images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'profile-images'::text) AND (name ~~ 'students/%'::text)));



  create policy "authenticated users can read feed attachments"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'feed-attachments'::text));



  create policy "authenticated users can read feed media"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'feed-media'::text));



  create policy "authenticated_read_reel_videos"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'feed-media'::text) AND (name ~~ 'reels/%'::text)));



  create policy "parents_read_newsletter_images"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'newsletter-images'::text));



  create policy "teacher_delete_activity_images_storage"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'activity-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teacher_photos_storage_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'teacher-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teacher_photos_storage_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'teacher-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teacher_photos_storage_select"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'teacher-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teacher_read_activity_images"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'activity-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teacher_upload_activity_images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'activity-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teachers can delete own photos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'teacher-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teachers can delete their own feed attachments"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'feed-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teachers can delete their own feed media"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'feed-media'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teachers can read own photos"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'teacher-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teachers can upload feed attachments"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'feed-attachments'::text));



  create policy "teachers can upload feed media"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'feed-media'::text));



  create policy "teachers can upload own photos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'teacher-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teachers_delete_inventory_photos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'inventory-photos'::text) AND inventory.is_teacher_or_admin()));



  create policy "teachers_delete_newsletter_images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'newsletter-images'::text) AND newsletters.is_teacher_or_admin()));



  create policy "teachers_delete_own_reel_videos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'feed-media'::text) AND (name ~~ 'reels/%'::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "teachers_read_inventory_photos"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'inventory-photos'::text) AND inventory.is_teacher_or_admin()));



  create policy "teachers_read_newsletter_images"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'newsletter-images'::text) AND newsletters.is_teacher_or_admin()));



  create policy "teachers_read_own_attachments"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'teacher-note-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teachers_upload_inventory_photos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'inventory-photos'::text) AND inventory.is_teacher_or_admin()));



  create policy "teachers_upload_newsletter_images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'newsletter-images'::text) AND newsletters.is_teacher_or_admin()));



  create policy "teachers_upload_own_attachments"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'teacher-note-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "teachers_upload_reel_videos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'feed-media'::text) AND (name ~~ 'reels/%'::text) AND reels.is_teacher_or_admin() AND ((storage.foldername(name))[2] = (auth.uid())::text)));



