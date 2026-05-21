CREATE OR REPLACE FUNCTION public.update_student_profile_fields(
  p_student_id                          uuid,
  p_has_medical_conditions              text DEFAULT NULL,
  p_medical_conditions_description      text DEFAULT NULL,
  p_has_allergies                       text DEFAULT NULL,
  p_allergies_description               text DEFAULT NULL,
  p_has_emergency_medications           text DEFAULT NULL,
  p_emergency_medications_description   text DEFAULT NULL,
  p_learning_style                      text DEFAULT NULL,
  p_strengths_interests                 text DEFAULT NULL,
  p_current_challenges                  text DEFAULT NULL,
  p_dysregulation_response              text DEFAULT NULL,
  p_regulation_strategies               text DEFAULT NULL,
  p_activities_to_avoid                 text DEFAULT NULL,
  p_needs_aide                          text DEFAULT NULL,
  p_needs_aide_description              text DEFAULT NULL,
  p_history_flags                       text DEFAULT NULL,
  p_history_explanation                 text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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
    emergency_medications_description = COALESCE(p_emergency_medications_description, emergency_medications_description),
    learning_style                    = COALESCE(p_learning_style,                    learning_style),
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
