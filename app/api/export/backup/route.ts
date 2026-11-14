import {createClient} from "@/lib/supabase/server";
import {NextResponse} from "next/server";
export async function GET(){
 const supabase=await createClient();const {data:claims}=await supabase.auth.getClaims();const uid=claims?.claims?.sub;
 if(!uid)return NextResponse.json({error:"Unauthorised"},{status:401});
 const names=["accounts","transactions","budgets","savings_goals","asset_lots","asset_rates","asset_disposals","liabilities"] as const;
 const results=await Promise.all(names.map(name=>supabase.from(name).select("*").eq("user_id",uid)));
 const failed=results.find(x=>x.error);if(failed?.error)return NextResponse.json({error:failed.error.message},{status:500});
 const payload={exported_at:new Date().toISOString(),currency:"INR",data:Object.fromEntries(names.map((name,i)=>[name,results[i].data??[]]))};
 return new Response(JSON.stringify(payload,null,2),{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":'attachment; filename="neo-full-backup.json"',"Cache-Control":"no-store"}});
}