
const SUPABASE_URL = "https://krmmmutcejnzdfupexpv.supabase.co";
const SUPABASE_KEY = "sb_publishable_3NHjMMVw1lai9UNAA-0QZA_sKM21LgD";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const grid = document.getElementById("cardGrid");
const mainContainer = document.getElementById("mainContainer");

document.getElementById("wideBtn").addEventListener("click", () => {
  mainContainer.classList.toggle("wide");
});

function getValueClass(value){
  if(value >= 10) return "value-high";
  if(value >= 5) return "value-mid";
  return "value-low";
}

async function loadCards(){
  statusEl.textContent = "Loading...";
  
  const { data, error } = await client
    .from("value_bets")
    .select("*")
    .order("bet_date",{ascending:false});
    
  if(error){
    console.error(error);
    statusEl.textContent = "Error loading data";
    return;
  }
  
  if(!data || data.length === 0){
    statusEl.textContent = "No data found";
    countEl.textContent = "0 rows";
    return;
  }
  
  statusEl.textContent = "Live Supabase data";
  countEl.textContent = data.length + " bets";
  
  grid.innerHTML = "";
  
  data.forEach(row => {
    const card = document.createElement("div");
    card.className = "card";
    
    const title = document.createElement("div");
    title.className = "match-title";
    title.textContent = row.home + " vs " + row.away;
    
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = row.league + " • " + row.bet_date;
    
    const odds = document.createElement("span");
    odds.className = "badge odds";
    odds.textContent = "Odds: " + row.bookmaker_odds;
    
    const value = document.createElement("span");
    value.className = "badge " + getValueClass(row.value_percent || 0);
    value.style.marginLeft = "8px";
    value.textContent = "Value: " + (row.value_percent || 0) + "%";
    
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(odds);
    card.appendChild(value);
    
    grid.appendChild(card);
  });
}

loadCards();
