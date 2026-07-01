import { supabase } from "./supabase";
export async function getSession(){
  if(!supabase) return {user:null,profile:null};
  const {data}=await supabase.auth.getSession();
  const user=data?.session?.user; if(!user) return {user:null,profile:null};
  const {data:profile}=await supabase.from("user_profiles").select("*").eq("id",user.id).maybeSingle();
  return {user, profile:profile||{id:user.id,email:user.email,full_name:user.email,role:"admin"}};
}
export async function login(email,password){
  if(!supabase) return {user:{id:"demo",email}, profile:{id:"demo",email,full_name:email.includes("epc")?"EPC Demo":"Ugo Demo",role:email.includes("epc")?"epc_pm":"admin"}};
  const {data,error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error;
  let {data:profile}=await supabase.from("user_profiles").select("*").eq("id",data.user.id).maybeSingle();
  if(!profile){ const ins=await supabase.from("user_profiles").insert({id:data.user.id,email:data.user.email,full_name:data.user.email,role:"admin"}).select("*").single(); profile=ins.data; }
  return {user:data.user,profile};
}
export async function logout(){ if(supabase) await supabase.auth.signOut(); }
export const portalForRole = role => ["epc_pm","site_manager"].includes(role) ? "epc" : "ipp";
