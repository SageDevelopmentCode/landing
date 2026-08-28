/**
 * One-time backfill for mobile Fun Friday PIs missed before mobile metadata fix.
 * Run AFTER deploying the mobile parity changes to production.
 *
 * Usage: node scripts/backfill-mobile-fun-friday.mjs
 */
const PAYMENTS = [
  {
    paymentIntentId: "pi_3U9E1IPhDX9D4alP1UTWngXf",
    parentId: "635a0ec3-8b78-4712-b8f6-c6651f84ee61",
    label: "Nargis Aug 28 Fun Friday",
  },
  {
    paymentIntentId: "pi_3U971KPhDX9D4alP14AujkwT",
    parentId: "a838c094-fd95-4a83-ac8b-4881d464c2f1",
    label: "Benjamin Aug 21 Fun Friday",
  },
  {
    paymentIntentId: "pi_3U8hmsPhDX9D4alP12J2FUty",
    parentId: "18c3c0c1-36b5-4721-afdb-0865d33b07dc",
    label: "jameylynwarren Aug 28 Fun Friday",
  },
];

const API_BASE =
  process.env.BACKFILL_API_BASE_URL ?? "https://sagefield.co";

async function backfillViaApi(paymentIntentId, parentId) {
  const res = await fetch(`${API_BASE}/api/stripe/confirm-mobile-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentIntentId, parentId }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  for (const { paymentIntentId, parentId, label } of PAYMENTS) {
    const result = await backfillViaApi(paymentIntentId, parentId);
    if (result.ok) {
      console.log(`OK: ${label}`, result.data);
    } else {
      console.error(`FAIL (${result.status}): ${label}`, result.data);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
