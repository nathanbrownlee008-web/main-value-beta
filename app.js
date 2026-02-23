
const SUPABASE_URL="https://krmmmutcejnzdfupexpv.supabase.co";
const SUPABASE_KEY="sb_publishable_3NHjMMVw1lai9UNAA-0QZA_sKM21LgD";
const client=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

async function loadTracker(){
const {data}=await client.from("bet_tracker").select("*").order("created_at",{ascending:true});

let start=parseFloat(startingBankroll.value)||0;
let bankroll=start;
let profit=0,wins=0,losses=0,totalStake=0,totalOdds=0;
let history=[];

let html="<table><tr><th>Match</th><th>Stake</th><th>Result</th><th>Profit</th></tr>";

data.forEach(row=>{
let p=0;
if(row.result==="won"){p=row.stake*(row.odds-1);wins++;}
if(row.result==="lost"){p=-row.stake;losses++;}
profit+=p;
totalStake+=row.stake;
totalOdds+=row.odds;
bankroll=start+profit;
history.push(bankroll);

let resultClass=row.result||"pending";

html+=`<tr>
<td>${row.match}</td>
<td>${row.stake}</td>
<td>
<select class="${resultClass}" onchange="updateResult(${row.id},this)">
<option value="pending" ${row.result==="pending"?"selected":""}>pending</option>
<option value="won" ${row.result==="won"?"selected":""}>won</option>
<option value="lost" ${row.result==="lost"?"selected":""}>lost</option>
</select>
</td>
<td>£${p.toFixed(2)}</td>
</tr>`;
});

html+="</table>";
trackerTable.innerHTML=html;

currentBankroll.innerText=bankroll.toFixed(2);
profit.innerText=profit.toFixed(2);
roi.innerText=totalStake?((profit/totalStake)*100).toFixed(1):0;
winrate.innerText=data.length?((wins/data.length)*100).toFixed(1):0;
wins.innerText=wins;
losses.innerText=losses;
avgOdds.innerText=data.length?(totalOdds/data.length).toFixed(2):0;

renderChart(history);
}

async function updateResult(id,select){
let value=select.value;
select.className=value;
await client.from("bet_tracker").update({result:value}).eq("id",id);
loadTracker();
}

let chart;
function renderChart(history){
if(chart) chart.destroy();
chart=new Chart(document.getElementById("chart"),{
type:"line",
data:{labels:history.map((_,i)=>i+1),
datasets:[{data:history,tension:0.4}]},
options:{responsive:true,plugins:{legend:{display:false}}}
});
}

loadTracker();
