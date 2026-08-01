import { supabase } from './supabase';

function post(accessToken: string, payload: object) {
  fetch('https://sagefield.co/api/notify/discord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function notifyDiscord(payload: object) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return;
  post(session.access_token, payload);
}

export function notifyDiscordAnon(payload: object) {
  const key = process.env.EXPO_PUBLIC_DISCORD_NOTIFY_KEY;
  if (!key) return;
  fetch('https://sagefield.co/api/notify/discord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-notify-key': key },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function notifyError(area: string, err: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return;
  post(session.access_token, {
    type: 'app_error',
    data: {
      error: err instanceof Error ? err.message : String(err),
      area,
      userId: session.user.id,
      userEmail: session.user.email ?? null,
    },
  });
}
