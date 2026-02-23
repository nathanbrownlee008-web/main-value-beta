const SUPABASE_URL="https://krmmmutcejnzdfupexpv.supabase.co";
const SUPABASE_KEY="sb_publishable_3NHjMMVw1lai9UNAA-0QZA_sKM21LgD";
const client=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

document.getElementById("tabBets").onclick=()=>switchTab(true);
document.getElementById("tabTracker").onclick=()=>switchTab(false);

function switchTab(show){
betsSection.style.display=show?"block":"none";
trackerSection.style.display=show?"none":"block";
tabBets.classList.toggle("active",show);
tabTracker.classList.toggle("active",!show);
}

async function loadBets(){
const {data}=await client.from("value_bets").select("*").order("bet_date",{ascending:false});
betsGrid.innerHTML="";
data.forEach(row=>{
const card=document.createElement("div");
card.className="card";
card.innerHTML=`
<h3>${row.match}</h3>
<p>${row.market} • ${row.bet_date}</p>
<p>Odds: ${row.odds}</p>
<label>Stake: £</label>
<input type="number" id="stake_${row.id}" value="10"/>
<button onclick='addToTracker(${JSON.stringify(row)})'>Add to Tracker</button>
`;
betsGrid.appendChild(card);
});
}

async function addToTracker(row){
const stake=parseFloat(document.getElementById("stake_"+row.id).value);
await client.from("bet_tracker").insert({
match:row.match,
market:row.market,
odds:row.odds,
stake:stake,
result:"pending"
});
loadTracker();
}

let chart;

async function loadTracker(){
const {data}=await client.from("bet_tracker").select("*").order("created_at",{ascending:true});
let start=parseFloat(startingBankroll.value);
let bankroll=start;
let profit=0;
let wins=0;
let history=[];
let totalStake=0;

let html="<table><tr><th>Match</th><th>Stake</th><th>Result</th><th>Profit</th></tr>";

data.forEach(row=>{
let p=0;
if(row.result==="won"){p=row.stake*(row.odds-1);wins++;}
if(row.result==="lost"){p=-row.stake;}
profit+=p;
totalStake+=row.stake;
bankroll=start+profit;
history.push(bankroll);

html+=`<tr>
<td>${row.match}</td>
<td>£${row.stake}</td>
<td>
<select onchange="updateResult(${row.id},this.value)">
<option ${row.result==="pending"?"selected":""}>pending</option>
<option ${row.result==="won"?"selected":""}>won</option>
<option ${row.result==="lost"?"selected":""}>lost</option>
</select>
</td>
<td>£${p.toFixed(2)}</td>
</tr>`;
});

html+="</table>";
trackerTable.innerHTML=html;

document.getElementById("bankroll").innerText=bankroll.toFixed(2);
document.getElementById("profit").innerText=profit.toFixed(2);
document.getElementById("roi").innerText=totalStake?((profit/totalStake)*100).toFixed(1):0;
document.getElementById("winrate").innerText=data.length?((wins/data.length)*100).toFixed(1):0;

renderChart(history);
}

async function updateResult(id,val){
await client.from("bet_tracker").update({result:val}).eq("id",id);
loadTracker();
}

function renderChart(history){
if(chart) chart.destroy();
chart=new Chart(document.getElementById("chart"),{
type:"line",
data:{labels:history.map((_,i)=>i+1),datasets:[{data:history,tension:0.4,fill:false}]},
options:{responsive:true,plugins:{legend:{display:false}}}
});
}

function exportCSV(){
client.from("bet_tracker").select("*").then(({data})=>{
let csv="match,market,odds,stake,result\n";
data.forEach(r=>{
csv+=`${r.match},${r.market},${r.odds},${r.stake},${r.result}\n`;
});
const blob=new Blob([csv],{type:"text/csv"});
const url=URL.createObjectURL(blob);
const a=document.createElement("a");
a.href=url;
a.download="bet_tracker.csv";
a.click();
});
}

startingBankroll.addEventListener("input",loadTracker);

loadBets();
loadTracker();