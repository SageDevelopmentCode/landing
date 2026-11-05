-- Void failed mobile ACH school-year tuition for Grayson Carretta (Nov + Dec 2026–27).
-- Row was recorded as completed at ACH "processing"; bank payment did not succeed.
-- Stripe PaymentIntent: pi_3UX9VOPhDX9D4alP19qXKk0z
-- billing.stripe_transactions.id: b3e788da-c373-4778-b69b-0e37b2d5bbb6

UPDATE billing.stripe_transactions
SET
  is_deleted = true,
  updated_at = now()
WHERE id = 'b3e788da-c373-4778-b69b-0e37b2d5bbb6'
  AND student_id = 'd5cbe365-9ce1-46dc-b106-82e8f50c12a1'
  AND payment_type = 'school_year_tuition'
  AND is_deleted = false
  AND metadata->>'selected_months' = '4,5';
