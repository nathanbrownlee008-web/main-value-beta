
const SUPABASE_URL = "https://krmmmutcejnzdfupexpv.supabase.co";
const SUPABASE_KEY = "sb_publishable_3NHjMMVw1lai9UNAA-0QZA_sKM21LgD";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const betsGrid = document.getElementById("betsGrid");
const trackerTable = document.getElementById("trackerTable");

document.getElementById("tabBets").onclick = () => switchTab(true);
document.getElementById("tabTracker").onclick = () => switchTab(false);

function switchTab(showBets){
  document.getElementById("betsSection").style.display = showBets ? "block":"none";
  document.getElementById("trackerSection").style.display = showBets ? "none":"block";
  document.getElementById("tabBets").classList.toggle("active", showBets);
  document.getElementById("tabTracker").classList.toggle("active", !showBets);
}

async function loadBets(){
  const { data } = await client.from("value_bets").select("*").order("bet_date",{ascending:false});
  betsGrid.innerHTML = "";
  data.forEach(row=>{
    const card = document.createElement("div");
    card.className="card";
    card.innerHTML = `
      <h3>${row.match}</h3>
      <p>${row.market} • ${row.bet_date}</p>
      <p>Odds: ${row.odds}</p>
      <p>Value: ${row.value_rating}</p>
      <button class="button" onclick='addToTracker(${JSON.stringify(row)})'>Add to Tracker</button>
    `;
    betsGrid.appendChild(card);
  });
}

async function addToTracker(row){
  await client.from("bet_tracker").insert({
    match:row.match,
    market:row.market,
    odds:row.odds,
    value_rating:row.value_rating,
    stake:10
  });
  alert("Added to tracker");
  loadTracker();
}

let chart;

async function loadTracker(){
  const { data } = await client.from("bet_tracker").select("*").order("created_at",{ascending:true});
  let bankroll = parseFloat(document.getElementById("startingBankroll").value);
  let totalProfit = 0;

  let html = "<table><tr><th>Match</th><th>Result</th><th>Profit</th></tr>";
  let bankrollHistory = [];

  data.forEach(row=>{
    let profit = 0;
    if(row.result==="won") profit = row.stake*(row.odds-1);
    if(row.result==="lost") profit = -row.stake;
    totalProfit += profit;
    bankrollHistory.push(bankroll + totalProfit);

    html+=`
      <tr>
        <td>${row.match}</td>
        <td>
          <select onchange="updateResult(${row.id},this.value)">
            <option ${row.result==="pending"?"selected":""}>pending</option>
            <option ${row.result==="won"?"selected":""}>won</option>
            <option ${row.result==="lost"?"selected":""}>lost</option>
          </select>
        </td>
        <td>£${profit.toFixed(2)}</td>
      </tr>`;
  });

  html+="</table>";
  trackerTable.innerHTML = html;

  document.getElementById("currentBankroll").innerText = (bankroll + totalProfit).toFixed(2);
  document.getElementById("totalProfit").innerText = totalProfit.toFixed(2);
  document.getElementById("roi").innerText = data.length?((totalProfit/(data.length*10))*100).toFixed(1):0;

  renderChart(bankrollHistory);
}

async function updateResult(id,value){
  await client.from("bet_tracker").update({result:value}).eq("id",id);
  loadTracker();
}

function renderChart(history){
  const ctx = document.getElementById("bankrollChart");
  if(chart) chart.destroy();
  chart = new Chart(ctx,{
    type:"line",
    data:{
      labels:history.map((_,i)=>i+1),
      datasets:[{data:history}]
    },
    options:{responsive:true}
  });
}

document.getElementById("startingBankroll").addEventListener("input", loadTracker);

loadBets();
loadTracker();
