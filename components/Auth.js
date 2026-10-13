"use client";
import { useState } from "react";
import { supabaseBrowser } from "../lib/supabase";

export default function Auth() {
  const supabase = supabaseBrowser();
  const [mode,setMode] = useState("login");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [name,setName] = useState("");
  const [message,setMessage] = useState("");

  async function submit(e){
    e.preventDefault(); setMessage("");
    if(mode==="signup"){
      const {error}=await supabase.auth.signUp({
        email,password,
        options:{data:{full_name:name}}
      });
      if(error) return setMessage(error.message);
      setMessage("Account created. Check your email if email confirmation is enabled.");
    }else{
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error) return setMessage(error.message);
      location.href="/";
    }
  }

  return <div className="panel" style={{maxWidth:500,margin:"40px auto"}}>
    <span className="pill">GOSPEL TALES LIFESYTE</span>
    <h1>{mode==="login"?"Welcome Back":"Create Learner Account"}</h1>
    <form onSubmit={submit}>
      {mode==="signup"&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} required/></label>}
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required/></label>
      <button className="btn primary">{mode==="login"?"Sign In":"Create Account"}</button>
    </form>
    {message&&<p className="muted">{message}</p>}
    <button className="btn secondary" onClick={()=>setMode(mode==="login"?"signup":"login")}>
      {mode==="login"?"Create a new account":"I already have an account"}
    </button>
  </div>
}
