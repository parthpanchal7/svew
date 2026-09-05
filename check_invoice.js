import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://rlepsimezrfpcpbejyce.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZXBzaW1lenJmcGNwYmVqeWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzM5MjEsImV4cCI6MjA4NzMwOTkyMX0.SANwCVFmXoP0y70k89djoY0tW2_H9kgDRsMyDyNUNpY"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data: invs, error: invErr } = await supabase.from('invoices').select('*');
  console.log("Invoices count:", invs?.length, "Invs:", invs, "Err:", invErr);

  const { data: items, error: itemErr } = await supabase.from('invoice_items').select('*');
  console.log("Invoice items count:", items?.length, "Items:", items, "Err:", itemErr);

  const { data: firms, error: firmErr } = await supabase.from('firms').select('*');
  console.log("Firms count:", firms?.length, "Err:", firmErr);

  const { data: parties, error: partyErr } = await supabase.from('parties').select('*');
  console.log("Parties count:", parties?.length, "Err:", partyErr);
}

test();
