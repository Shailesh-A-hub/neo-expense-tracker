import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
export async function GET() {
 const supabase=await createClient();
 const {data}=await supabase.auth.getClaims();
 const userId=data?.claims?.sub;
 if(!userId)return NextResponse.json({error:"Unauthorised"},{status:401});
 const {data:rows,error}=await supabase.from("transactions").select("transaction_date,transaction_type,category,description,amount").eq("user_id",userId).order("transaction_date",{ascending:false});
 if(error)return NextResponse.json({error:error.message},{status:500});
 const q=(v:unknown)=>'"'+String(v??"").replaceAll('"','""')+'"';
 const csv=["Date,Type,Category,Description,Amount",...(rows??[]).map(x=>[x.transaction_date,x.transaction_type,x.category,x.description,x.amount].map(q).join(","))].join("\r\n");
 return new Response(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="neo-transactions.csv"',"Cache-Control":"no-store"}});
}