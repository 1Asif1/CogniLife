// 🔴 REPLACE THESE WITH YOUR OWN KEYS
const SUPABASE_URL = "https://geptqqykttygcbsrlxay.supabase.co";
const SUPABASE_KEY = "sb_publishable_nQiMUdXLiqihN9IyUAWTeA_mcMPogk0";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SIGN UP
async function signup() {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  const { data, error } = await client.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Signup successful! Check your email.");
  }
}

// LOGIN
async function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const { data, error } = await client.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Login successful!");
    console.log(data);
  }
}