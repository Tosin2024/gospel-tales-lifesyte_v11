import fs from 'node:fs';
const required = [
 'app/api/payments/initialize/route.js',
 'app/api/payments/verify/route.js',
 'app/api/payments/paystack/webhook/route.js',
 'app/api/payments/flutterwave/webhook/route.js',
 'supabase/stage11_live_business.sql',
 'lib/server/payment.js',
 'lib/server/supabase-admin.js'
];
const missing = required.filter(x=>!fs.existsSync(x));
if (missing.length) { console.error('Missing:', missing); process.exit(1); }
console.log('Stage 11 smoke check: OK');
