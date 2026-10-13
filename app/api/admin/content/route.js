
import {NextResponse} from 'next/server';

/*
  Stage 10 privileged CRUD endpoint placeholder.
  Use authenticated admin session + server-side Supabase client.
  Never accept an `is_admin` boolean from the browser.
*/
export async function POST(){
 return NextResponse.json({ok:false,status:501,message:'Connect authenticated server-side admin CRUD before enabling writes.'},{status:501});
}
