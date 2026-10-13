
import {supabase} from './supabase';

export async function trackEvent(event_name,event_category='general',metadata={},path=typeof window!=='undefined'?window.location.pathname:null){
  try{
    const {data:{session}}=await supabase.auth.getSession();
    await supabase.from('analytics_events').insert({
      user_id:session?.user?.id||null,event_name,event_category,path,metadata
    });
  }catch(_){}
}
