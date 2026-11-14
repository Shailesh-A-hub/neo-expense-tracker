import React,{useEffect,useState} from "react";
import {SafeAreaView,View,Text,TextInput,TouchableOpacity,FlatList,Alert,ActivityIndicator,KeyboardAvoidingView,Platform} from "react-native";
import {StatusBar} from "expo-status-bar";
import {supabase} from "./src/supabase";
import {initLocal,listLocal,saveLocal,removeLocal,queued,markSynced,mergeRemote,clearUserLocal} from "./src/local";

const C={bg:"#101827",panel:"#1B2738",field:"#243247",gold:"#D6B56D",text:"#F5F7FA",muted:"#9EADBF",green:"#75D49A",red:"#FF8585",line:"#34445A"};
const today=()=>new Date().toISOString().slice(0,10);
function Button({label,onPress,secondary=false}){return <TouchableOpacity onPress={onPress} style={{backgroundColor:secondary?C.field:C.gold,padding:14,borderRadius:12,alignItems:"center",marginTop:12}}><Text style={{color:secondary?C.text:"#101827",fontWeight:"800"}}>{label}</Text></TouchableOpacity>}
function Field({label,value,onChangeText,placeholder,secure=false,keyboardType="default"}){return <View style={{marginTop:12}}><Text style={{color:C.muted,marginBottom:6,fontSize:12}}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder||label} placeholderTextColor="#718096" secureTextEntry={secure} keyboardType={keyboardType} autoCapitalize="none" style={{backgroundColor:C.field,color:C.text,padding:13,borderRadius:10,borderWidth:1,borderColor:C.line}}/></View>}
export default function App(){
 const [session,setSession]=useState(null),[boot,setBoot]=useState(true),[email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [rows,setRows]=useState([]),[kind,setKind]=useState("expense"),[amount,setAmount]=useState(""),[category,setCategory]=useState("Food"),[description,setDescription]=useState("");
 const [busy,setBusy]=useState(false),[online,setOnline]=useState(false),[tab,setTab]=useState("Home");
 useEffect(()=>{initLocal();if(!supabase){setBoot(false);return;}supabase.auth.getSession().then(({data})=>{setSession(data.session);setBoot(false);}).catch(()=>setBoot(false));const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);});return()=>subscription.unsubscribe();},[]);
 const refresh=async(userId)=>{setRows(listLocal(userId));};
 const sync=async(userId)=>{
   if(!supabase)return;
   try{
    const pending=queued(userId);
    for(const op of pending){
      if(op.operation==="upsert"){
        const p=JSON.parse(op.payload);
        const {error}=await supabase.from("transactions").upsert({id:p.id,user_id:userId,transaction_type:p.transaction_type,amount:p.amount,category:p.category,description:p.description,transaction_date:p.transaction_date},{onConflict:"id"});
        if(error)throw error;
      }else{
        const {error}=await supabase.from("transactions").delete().eq("id",op.id).eq("user_id",userId);
        if(error)throw error;
      }
      markSynced(op.id,userId);
    }
    const {data,error}=await supabase.from("transactions").select("id,user_id,transaction_type,amount,category,description,transaction_date,created_at").eq("user_id",userId).order("transaction_date",{ascending:false}).limit(500);
    if(error)throw error;
    mergeRemote(data||[],userId);setOnline(true);
   }catch(e){setOnline(false);}
   setRows(listLocal(userId));
 };
 useEffect(()=>{if(session?.user?.id){refresh(session.user.id);sync(session.user.id);}else setRows([]);},[session?.user?.id]);
 const signIn=async()=>{if(!supabase)return Alert.alert("Configuration needed","Set the Supabase URL and publishable key in mobile/.env.");setBusy(true);const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});setBusy(false);if(error)Alert.alert("Sign in failed",error.message);};
 const signUp=async()=>{if(!supabase)return Alert.alert("Configuration needed","Set the Supabase URL and publishable key in mobile/.env.");setBusy(true);const {error}=await supabase.auth.signUp({email:email.trim(),password});setBusy(false);if(error)Alert.alert("Sign up failed",error.message);else Alert.alert("Check your email","Confirm your email if confirmation is enabled, then sign in.");};
 const add=()=>{const n=Number(amount);if(!n||n<=0)return Alert.alert("Invalid amount","Enter an amount greater than zero.");const tx={id:makeId(),user_id:session.user.id,transaction_type:kind,amount:n,category:category.trim()||"Other",description:description.trim(),transaction_date:today(),created_at:new Date().toISOString(),pending:1};saveLocal(tx);setRows(listLocal(session.user.id));setAmount("");setDescription("");sync(session.user.id);};
 const del=(id)=>Alert.alert("Delete transaction?","This change will sync when you are online.",[{text:"Cancel"},{text:"Delete",style:"destructive",onPress:()=>{removeLocal(id,session.user.id);setRows(listLocal(session.user.id));sync(session.user.id);}}]);
 const signOut=async()=>{clearUserLocal(session.user.id);await supabase?.auth.signOut();setRows([]);};
 const totalIncome=rows.filter(x=>x.transaction_type==="income").reduce((a,x)=>a+Number(x.amount),0);
 const totalExpense=rows.filter(x=>x.transaction_type==="expense").reduce((a,x)=>a+Number(x.amount),0);
 if(boot)return <SafeAreaView style={{flex:1,backgroundColor:C.bg,justifyContent:"center"}}><ActivityIndicator color={C.gold}/></SafeAreaView>;
 return <SafeAreaView style={{flex:1,backgroundColor:C.bg}}><StatusBar style="light"/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
 <View style={{padding:20,paddingBottom:10,flexDirection:"row",justifyContent:"space-between"}}><Text style={{color:C.gold,fontSize:27,fontWeight:"900"}}>neo.</Text><Text style={{color:C.muted,fontSize:11,alignSelf:"center"}}>{session?(online?"SYNCED / ONLINE":"OFFLINE · SAVED LOCALLY"):"PRIVATE FINANCE"}</Text></View>
 {!session?<View style={{padding:20}}><Text style={{color:C.text,fontSize:25,fontWeight:"900"}}>Your money, your space.</Text><Text style={{color:C.muted,marginTop:8}}>Sign in to your private account. Each family member uses a separate account and sees only their own records.</Text><Field label="Email" value={email} onChangeText={setEmail}/><Field label="Password" value={password} onChangeText={setPassword} secure/><Button label={busy?"Please wait…":"Sign in"} onPress={signIn}/><Button label="Create private account" onPress={signUp} secondary/></View>:
 <>
 <View style={{paddingHorizontal:20,flexDirection:"row",justifyContent:"space-between"}}><Text style={{color:C.text,fontSize:18,fontWeight:"800"}}>{session.user.email}</Text><TouchableOpacity onPress={signOut}><Text style={{color:C.red}}>Sign out</Text></TouchableOpacity></View>
 <View style={{flex:1,paddingHorizontal:18,paddingTop:12}}>
 {tab==="Home"?<><Text style={{color:C.text,fontSize:23,fontWeight:"900"}}>Your overview</Text><View style={{backgroundColor:C.panel,padding:17,borderRadius:15,marginTop:12}}><Text style={{color:C.muted}}>NET CASH FLOW</Text><Text style={{color:C.text,fontSize:30,fontWeight:"900",marginTop:6}}>{money(totalIncome-totalExpense)}</Text><Text style={{color:C.green,marginTop:10}}>Income  {money(totalIncome)}</Text><Text style={{color:C.red,marginTop:4}}>Expenses  {money(totalExpense)}</Text><Text style={{color:C.muted,marginTop:12,fontSize:11}}>History remains available from this device when offline.</Text></View><Button label="＋ Add transaction" onPress={()=>setTab("Transactions")}/><Text style={{color:C.text,fontSize:17,fontWeight:"800",marginTop:22}}>Recent activity</Text><FlatList data={rows.slice(0,5)} keyExtractor={x=>x.id} renderItem={({item})=><TxRow item={item} onDelete={del}/>} ListEmptyComponent={<Text style={{color:C.muted,marginTop:12}}>No transactions yet.</Text>}/></>:
 <><Text style={{color:C.text,fontSize:23,fontWeight:"900"}}>Transactions</Text><View style={{backgroundColor:C.panel,padding:15,borderRadius:15,marginTop:12}}><View style={{flexDirection:"row",gap:8}}>{["expense","income"].map(k=><TouchableOpacity key={k} onPress={()=>setKind(k)} style={{flex:1,padding:11,borderRadius:9,backgroundColor:kind===k?C.gold:C.field,alignItems:"center"}}><Text style={{color:kind===k?"#101827":C.text,fontWeight:"800"}}>{k.toUpperCase()}</Text></TouchableOpacity>)}</View><Field label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad"/><Field label="Category" value={category} onChangeText={setCategory}/><Field label="Description" value={description} onChangeText={setDescription}/><Button label="Save on this device" onPress={add}/></View><Text style={{color:C.text,fontSize:17,fontWeight:"800",marginTop:20}}>History · {rows.length}</Text><FlatList data={rows} keyExtractor={x=>x.id} renderItem={({item})=><TxRow item={item} onDelete={del}/>} ListEmptyComponent={<Text style={{color:C.muted,marginTop:12}}>No saved transactions.</Text>}/></>}
 </View>
 <View style={{flexDirection:"row",backgroundColor:"#0C1421",borderTopWidth:1,borderColor:C.line,padding:12,justifyContent:"space-around"}}>{["Home","Transactions"].map(t=><TouchableOpacity key={t} onPress={()=>setTab(t)}><Text style={{color:tab===t?C.gold:C.muted,fontWeight:"800"}}>{t}</Text></TouchableOpacity>)}</View>
 </>}
 </KeyboardAvoidingView></SafeAreaView>;
}
function TxRow({item,onDelete}){return <View style={{backgroundColor:C.panel,padding:14,borderRadius:12,marginTop:9,flexDirection:"row",alignItems:"center"}}><View style={{flex:1}}><Text style={{color:C.text,fontWeight:"800"}}>{item.category}</Text><Text style={{color:C.muted,fontSize:11,marginTop:3}}>{item.transaction_type} · {item.transaction_date}{item.pending?" · pending sync":""}{item.description?" · "+item.description:""}</Text></View><Text style={{color:item.transaction_type==="income"?C.green:C.red,fontWeight:"900"}}>{item.transaction_type==="income"?"+":"−"}{money(item.amount)}</Text><TouchableOpacity onPress={()=>onDelete(item.id)} style={{paddingLeft:12}}><Text style={{color:C.red}}>×</Text></TouchableOpacity></View>}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
function makeId(){return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==="x"?r:(r&3|8)).toString(16);});}
