# School Year Newsletter Email — Reference

## Supabase project

- Project ID: `vonuwpzepwrbdlectspd`
- Schema: `newsletters`
- MCP tool: `execute_sql` (read-only SELECT)

## List recent newsletters

```sql
SELECT id, title, week_range, status, access_password, published_at, created_at
FROM newsletters.newsletters
WHERE is_deleted = false
ORDER BY created_at DESC
LIMIT 20;
```

## Search by title or week

```sql
SELECT id, title, week_range, status, access_password, published_at
FROM newsletters.newsletters
WHERE is_deleted = false
  AND (
    title ILIKE '%week two%'
    OR week_range ILIKE '%aug%'
  )
ORDER BY created_at DESC;
```

Replace the `ILIKE` patterns with what the user provided.

## Fetch full newsletter content

Replace `{newsletter_id}` with the UUID.

```sql
SELECT
  n.id,
  n.title,
  n.week_range,
  n.status,
  n.access_password,
  s.id AS section_id,
  s.label,
  s.body,
  s.is_class_updates,
  s.sort_order,
  tu.id AS teacher_update_id,
  tu.body AS teacher_body,
  u.id AS teacher_id,
  u.full_name AS teacher_name
FROM newsletters.newsletters n
JOIN newsletters.sections s ON s.newsletter_id = n.id
LEFT JOIN newsletters.teacher_updates tu
  ON tu.section_id = s.id AND s.is_class_updates = true
LEFT JOIN admin.users u ON u.id = tu.teacher_id
WHERE n.id = '{newsletter_id}'
  AND n.is_deleted = false
ORDER BY s.sort_order, u.full_name;
```

## Section mapping logic

After querying, group rows:

1. **Welcome Message** — use `body` for intro (first 1–2 sentences if long)
2. **Class Updates** (`is_class_updates = true`) — group by `teacher_name` + `teacher_body`; skip empty bodies
3. **Upcoming Events** — parse markdown list items from `body` into email `<li>`
4. **Parent Reminders** — same as events
5. **Photo Gallery** — ignore for email

## Markdown to email bullets

Newsletter bodies use markdown. For Events and Reminders:

- Lines starting with `-` or `*` → `<li>` items
- `**bold**` → `<strong>bold</strong>`
- `[text](url)` → `<a href="url" style="color: #2C5F2E;">text</a>`
- Escape HTML entities in email: `&` → `&amp;`

For class teasers, summarize `teacher_body` to one line — do not render full markdown.

## Newsletter URL and password

```
URL:      https://sagefield.co/newsletter/{id}
Password: {access_password from newsletters row}
```

## Email HTML skeleton

Use this structure inside `buildSchoolYearWeek{N}NewsletterEmail`. Replace placeholders.

```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 32px 24px; line-height: 1.7;">

  <p style="margin-bottom: 24px;">Hi ${firstName}!</p>

  <!-- Welcome intro: 1-2 paragraphs from Welcome Message section -->
  <p style="margin-bottom: 20px;">{welcome_intro}</p>

  <p style="margin-bottom: 20px; font-size: 14px; color: #444;">We've put together our school year newsletter — a closer look at the week through photos and classroom moments.</p>

  <!-- Newsletter CTA (main section) -->
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin: 28px 0; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: bold; color: #2C5F2E;">📰 {cta_title}</p>
    <p style="margin: 0 0 18px 0; font-size: 13px; color: #555;">Photos, classroom moments, and a deeper look into our week.</p>
    <a href="https://sagefield.co/newsletter/{newsletter_id}" style="background: #2C5F2E; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Read the Newsletter →</a>
    <div style="margin-top: 14px;">
      <span style="display: inline-block; background: #f7f4f0; border: 1px solid #a8c5a0; border-radius: 999px; padding: 5px 14px; font-size: 12px; color: #555;">🔑 Password: <strong>{password}</strong></span>
    </div>
  </div>

  <!-- Classroom Highlights (teasers) -->
  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🌿 Classroom Highlights</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <!-- One <li> per teacher with content -->
      <li>🌱 <strong>Joy's Class (Pre-K–K)</strong> — {teaser topics}</li>
    </ul>
    <p style="margin: 16px 0 0 0; font-size: 13px; color: #555;">Read the full classroom stories, photos, and details in the newsletter above.</p>
  </div>

  <!-- Upcoming Events -->
  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">📅 Upcoming Events</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <!-- <li> per event from Upcoming Events section -->
    </ul>
  </div>

  <!-- Parent Reminders -->
  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">📣 Parent Reminders</h2>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 16px 20px; border-radius: 4px; margin-bottom: 24px;">
    <ul style="margin: 0; padding-left: 18px; line-height: 2.1; font-size: 14px; color: #2c2c2c;">
      <!-- <li> per reminder from Parent Reminders section -->
    </ul>
  </div>

  <!-- Download the App — copy verbatim from buildSchoolYearWeekOneNewsletterEmail -->
  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">📱 The Sage Field App Is Now Available!</h2>
  <p style="margin-bottom: 12px; font-size: 14px; color: #2c2c2c;">We're excited to share that the <strong>Sage Field app is officially live</strong> — download it today and have everything you need right in your pocket.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="https://sagefield.co/download" style="background: #2C5F2E; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Download the App</a>
  </div>
  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">With the app you can:</p>
  <ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 2;">
    <li>💳 Pay tuition directly</li>
    <li>📸 View the school feed</li>
    <li>💬 Message staff</li>
    <li>🌿 Join the community channel</li>
    <li>👧 Check your children's profiles</li>
    <li>📅 Schedule parent-teacher conferences</li>
  </ul>
  <div style="background: #f7f4f0; border-left: 3px solid #a8c5a0; padding: 14px 18px; margin: 20px 0 24px 0; border-radius: 4px; font-size: 14px;">
    <p style="margin: 0;"><strong>Android users:</strong> When you tap the Google Play button on the download page, it will prompt you with an email address — we'll use that to send you a direct install link right away.</p>
  </div>

  <!-- Referral Program — copy verbatim from buildSchoolYearWeekOneNewsletterEmail -->
  <h2 style="font-size: 17px; color: #2C5F2E; margin-top: 32px; margin-bottom: 14px;">🎁 Referral Program</h2>
  <div style="background: #eef6ee; border: 1px solid #a8c5a0; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">We're excited to share our <strong>referral program</strong> — and we'd love your help spreading the word about Sage Field!</p>
    <p style="margin: 0 0 12px 0;">When a family you refer <strong>enrolls in our current school program and pays their registration fee</strong>, you'll receive a <strong>$500 gift card of your choice</strong>. 🎉</p>
    <p style="margin: 0 0 16px 0;">Simply share your unique referral link — you can find it on your home dashboard. If sharing the link isn't convenient, you can also just let the family know to <strong>mention your name when they apply</strong> and it will still count toward your referral.</p>
    <p style="margin: 0; color: #888; font-size: 13px;">⏳ This offer is available through the end of our school year.</p>
  </div>

  <!-- Share Your Story — copy verbatim from buildSchoolYearWeekOneNewsletterEmail -->
  <h2 style="font-size: 17px; color: #b45309; margin-top: 32px; margin-bottom: 14px;">🌟 Share Your Story</h2>
  <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; font-size: 14px; color: #2c2c2c;">
    <p style="margin: 0 0 12px 0;">Has Sage Field made a difference for your family? We'd love to hear about it — and so would other families looking for the right fit for their child.</p>
    <p style="margin: 0 0 12px 0;">As a thank-you for sharing your experience, we'll send you a <strong>$15 Starbucks gift card ☕</strong>. It only takes a few minutes and means the world to us.</p>
    <div style="text-align: center; margin-top: 16px;">
      <a href="https://sagefield.co/testimonial" style="background: #d97706; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-family: Georgia, serif; font-size: 15px; display: inline-block;">Share a Testimonial →</a>
    </div>
  </div>

  <p style="margin-bottom: 8px; font-size: 14px; color: #555;">{closing_line}</p>

  <p style="margin-top: 32px; margin-bottom: 4px;">Warmly,</p>
  <p style="margin-top: 4px;"><strong>Sage Field School</strong></p>

</body>
</html>
```

## Server action template

Copy `app/actions/sendSchoolYearWeekOneNewsletterEmail.ts`:

```ts
"use server"
import { buildSchoolYearWeek{N}NewsletterEmail, sendZohoEmail } from "../lib/zoho"

export async function sendSchoolYearWeek{N}NewsletterEmail(opts: {
  g1FullName: string
  childLegalName: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, content } = await buildSchoolYearWeek{N}NewsletterEmail({
    g1FullName: opts.g1FullName,
    childLegalName: opts.childLegalName,
  })
  return sendZohoEmail({ toAddress: opts.email, subject, content })
}
```

## Admin button (ApplicationDetailSidebar)

Add to `outreachTab === 'schoolYear'` block in `app/admin/components/ApplicationDetailSidebar.tsx`:

- Import `sendSchoolYearWeek{N}NewsletterEmail`
- State: `schoolYearWeek{N}NewsletterSending | Sent | Error`
- Handler: mirror `handleSendSchoolYearWeekOneNewsletter`
- Button label: `Send School Year Week {N} Newsletter`
