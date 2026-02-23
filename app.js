
const SUPABASE_URL="https://krmmmutcejnzdfupexpv.supabase.co";
const SUPABASE_KEY="sb_publishable_3NHjMMVw1lai9UNAA-0QZA_sKM21LgD";
const client=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

async function loadTracker(){
const {data}=await client.from("bet_tracker").select("*").order("created_at",{ascending:true});

let start=parseFloat(startingBankroll.value)||0;
let bankroll=start;
let profitTotal=0,winsCount=0,lossesCount=0,totalStake=0,totalOdds=0;
let history=[];

let html="<table><tr><th>Match</th><th>Stake</th><th>Result</th><th>Profit</th></tr>";

data.forEach(row=>{
let p=0;
if(row.result==="won"){p=row.stake*(row.odds-1);winsCount++;}
if(row.result==="lost"){p=-row.stake;lossesCount++;}

profitTotal+=p;
totalStake+=row.stake;
totalOdds+=row.odds;

bankroll=start+profitTotal;
history.push(bankroll);

let resultClass=row.result||"pending";

html+=`<tr>
<td>${row.match}</td>
<td>${row.stake}</td>
<td>
<select class="result-select ${resultClass}" onchange="updateResult(${row.id}, this)">
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
profit.innerText=profitTotal.toFixed(2);
roi.innerText=totalStake?((profitTotal/totalStake)*100).toFixed(1):0;
winrate.innerText=data.length?((winsCount/data.length)*100).toFixed(1):0;
wins.innerText=winsCount;
losses.innerText=lossesCount;
avgOdds.innerText=data.length?(totalOdds/data.length).toFixed(2):0;

renderChart(history);
}

async function updateResult(id, select){
const value=select.value;

select.classList.remove("won","lost","pending");
select.classList.add(value);

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

function exportCSV(){
client.from("bet_tracker").select("*").then(({data})=>{
let csv="match,odds,stake,result\n";
data.forEach(r=>{
csv+=`${r.match},${r.odds},${r.stake},${r.result}\n`;
});
const blob=new Blob([csv],{type:"text/csv"});
const url=URL.createObjectURL(blob);
const a=document.createElement("a");
a.href=url;
a.download="bet_tracker.csv";
a.click();
});
}

loadTracker();
