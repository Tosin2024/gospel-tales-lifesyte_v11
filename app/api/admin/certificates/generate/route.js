
import {NextResponse} from 'next/server';

/*
  Production certificate generation endpoint.
  The route must be connected to the authenticated admin session and a
  server-side PDF library/storage provider. Do not generate certificate
  URLs from untrusted browser input.

  Suggested flow:
  1. Verify authenticated admin.
  2. Load certificate by ID.
  3. Render approved template.
  4. Generate PDF server-side.
  5. Upload PDF to private/controlled storage.
  6. Update competition_certificates.pdf_url.
  7. Mark certificate_generation_jobs completed.
*/
export async function POST(){
 return NextResponse.json({
  ok:false,
  status:501,
  message:'Certificate PDF generation requires the production server-side PDF/storage configuration.'
 },{status:501});
}
