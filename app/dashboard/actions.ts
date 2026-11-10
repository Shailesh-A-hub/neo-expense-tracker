"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function addTransaction(formData: FormData) {
  const supabase = await createClient(); const { data: { claims } } = await supabase.auth.getClaims(); const userId = claims?.sub;
  if (!userId) redirect("/login");
  const amount = Number(formData.get("amount")); const type = String(formData.get("transaction_type"));
  const category = String(formData.get("category") || "Other"); const description = String(formData.get("description") || "");
  const date = String(formData.get("transaction_date") || new Date().toISOString().slice(0,10));
  if (!Number.isFinite(amount) || amount <= 0 || !["income","expense"].includes(type)) return;
  const { error } = await supabase.from("transactions").insert({ user_id: userId, transaction_type: type, amount, category, description, transaction_date: date });
  if (error) throw new Error(error.message); revalidatePath("/dashboard");
}
export async function signOut() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/login"); }