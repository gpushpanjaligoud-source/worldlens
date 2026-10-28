const countries = [
  ["IND","India"],["USA","United States"],["JPN","Japan"],["CHN","China"],["GBR","United Kingdom"],
  ["BRA","Brazil"],["DEU","Germany"],["FRA","France"],["CAN","Canada"],["AUS","Australia"],
  ["ZAF","South Africa"],["IDN","Indonesia"],["MEX","Mexico"],["KOR","South Korea"],["NGA","Nigeria"],
  ["PAK","Pakistan"],["BGD","Bangladesh"],["ITA","Italy"],["ESP","Spain"],["SGP","Singapore"]
];
const indicators = {
  population:{label:"Population",code:"SP.POP.TOTL",unit:"people",format:v=>new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:2}).format(v),full:v=>new Intl.NumberFormat("en",{maximumFractionDigits:0}).format(v)},
  gdp:{label:"GDP (current US$)",code:"NY.GDP.MKTP.CD",unit:"US dollars",format:v=>"$"+new Intl.NumberFormat("en",{notation:"compact",maximumFractionDigits:2}).format(v),full:v=>"$"+new Intl.NumberFormat("en",{maximumFractionDigits:0}).format(v)},
  life:{label:"Life expectancy at birth",code:"SP.DYN.LE00.IN",unit:"years",format:v=>Number(v).toFixed(1),full:v=>Number(v).toFixed(2)+" years"}
};
const samples = {
 population:{IND:{2019:1383112050,2020:1396387127,2021:1407563842,2022:1425423212,2023:1438069596},USA:{2019:328329953,2020:331511512,2021:332031554,2022:333287557,2023:334914895},JPN:{2019:126633000,2020:126261000,2021:125681593,2022:125124989,2023:124516650},CHN:{2019:1407745000,2020:1411100000,2021:1412360000,2022:1412175000,2023:1410710000}},
 gdp:{IND:{2019:2835600000000,2020:2671600000000,2021:3150300000000,2022:3385700000000,2023:3567600000000},USA:{2019:21381000000000,2020:21060000000000,2021:23315000000000,2022:25744000000000,2023:27361000000000},JPN:{2019:5120600000000,2020:5057800000000,2021:5040100000000,2022:4261100000000,2023:4212900000000},CHN:{2019:14343000000000,2020:14688000000000,2021:17820000000000,2022:17963000000000,2023:18378000000000}},
 life:{IND:{2019:70.91,2020:70.15,2021:67.24,2022:67.74,2023:67.95},USA:{2019:78.79,2020:77,2021:76.33,2022:77.43,2023:78.4},JPN:{2019:84.36,2020:84.62,2021:84.45,2022:84,2023:84.04},CHN:{2019:77.97,2020:78.08,2021:78.21,2022:78.59,2023:78}}
};
const $=id=>document.getElementById(id);
let seriesA=[],seriesB=[],chart=null,currentRows=[];
const name=code=>countries.find(c=>c[0]===code)?.[1]||code;
function fillCountries(){["countryA","countryB"].forEach((id,index)=>{const sel=$(id);countries.forEach(([code,label])=>{const opt=document.createElement("option");opt.value=code;opt.textContent=label;sel.appendChild(opt)});sel.value=index===0?"IND":"USA"});}
function sampleSeries(key,code){const data=samples[key]?.[code];if(data)return Object.entries(data).map(([year,value])=>({year:Number(year),value}));const base=key==="population"?50000000:key==="gdp"?800000000000:70;return [2019,2020,2021,2022,2023].map((year,i)=>({year,value:key==="life"?base+i*.25:base*(1+i*.025)}));}
async function fetchSeries(code,indicator){const url=`https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&per_page=100`;const res=await fetch(url);if(!res.ok)throw new Error("World Bank API returned "+res.status);const json=await res.json();if(!Array.isArray(json)||!Array.isArray(json[1]))throw new Error("Unexpected API response");return json[1].filter(r=>r.value!==null&&Number(r.date)>=2000).map(r=>({year:Number(r.date),value:Number(r.value)})).sort((a,b)=>a.year-b.year);}
function showNotice(message){const el=$("notice");if(!message){el.classList.add("hidden");el.textContent="";return}el.classList.remove("hidden");el.textContent=message;}
function render(){
 const a=$("countryA").value,b=$("countryB").value,key=$("indicator").value,ind=indicators[key],aMap=new Map(seriesA.map(d=>[d.year,d.value])),bMap=new Map(seriesB.map(d=>[d.year,d.value]));
 let years=[...new Set([...aMap.keys(),...bMap.keys()])].sort((x,y)=>x-y);years=years.slice(-Number($("yearRange").value));
 currentRows=years.map(year=>({year,a:aMap.get(year)??null,b:bMap.get(year)??null}));
 $("nameA").textContent=name(a);$("nameB").textContent=name(b);$("labelA").textContent=ind.label;$("labelB").textContent=ind.label;$("chartTitle").textContent=ind.label+" over time";$("chartSubtitle").textContent=`Year-by-year comparison for ${name(a)} and ${name(b)}`;$("unit").textContent="UNIT: "+ind.unit.toUpperCase();$("thA").textContent=name(a).toUpperCase();$("thB").textContent=name(b).toUpperCase();$("yearCount").textContent=years.length;$("recordCount").textContent=years.length+" records";
 const latestA=seriesA[seriesA.length-1],latestB=seriesB[seriesB.length-1];$("valueA").textContent=latestA?ind.format(latestA.value):"—";$("valueB").textContent=latestB?ind.format(latestB.value):"—";$("yearA").textContent=latestA?`Latest available · ${latestA.year}`:"No value available";$("yearB").textContent=latestB?`Latest available · ${latestB.year}`:"No value available";
 $("updated").textContent="Updated "+new Date().toLocaleTimeString();const tbody=$("tableBody");tbody.innerHTML="";
 if(!currentRows.length){tbody.innerHTML='<tr><td colspan="4" class="empty">No data to display.</td></tr>'}else currentRows.slice().reverse().forEach(row=>{const tr=document.createElement("tr");tr.innerHTML=`<td class="year-cell">${row.year}</td><td>${row.a===null?'<span class="missing">No data</span>':ind.full(row.a)}</td><td>${row.b===null?'<span class="missing">No data</span>':ind.full(row.b)}</td><td><span class="chip">${ind.label}</span></td>`;tbody.appendChild(tr)});
 const ctx=$("comparisonChart").getContext("2d");if(chart)chart.destroy();chart=new Chart(ctx,{type:"line",data:{labels:years,datasets:[{label:name(a),data:currentRows.map(r=>r.a),borderColor:"#3568d4",backgroundColor:"#3568d4",borderWidth:3,tension:.3,spanGaps:true,pointRadius:3},{label:name(b),data:currentRows.map(r=>r.b),borderColor:"#e78168",backgroundColor:"#e78168",borderWidth:3,tension:.3,spanGaps:true,pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},plugins:{legend:{position:"top",align:"end",labels:{usePointStyle:true,boxWidth:7,boxHeight:7,font:{family:"DM Sans",size:11}}},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.raw==null?"No data":ind.full(ctx.raw)}`}}},scales:{x:{grid:{display:false},ticks:{color:"#7b8495",font:{size:11}}},y:{grid:{color:"#e9edf3",drawBorder:false},ticks:{color:"#7b8495",maxTicksLimit:6,callback:v=>ind.format(v)}}}}});
}
async function compare(){
 const a=$("countryA").value,b=$("countryB").value,key=$("indicator").value;
 if(a===b){showNotice("Please choose two different countries.");return}
 $("compareBtn").disabled=true;$("compareBtn").textContent="Loading data…";$("loading").classList.remove("hidden");$("sourceBadge").textContent="Connecting to World Bank API…";showNotice("");
 try{const [da,db]=await Promise.all([fetchSeries(a,indicators[key].code),fetchSeries(b,indicators[key].code)]);if(!da.length||!db.length)throw new Error("No data available");seriesA=da;seriesB=db;$("sourceBadge").textContent="Live data · World Bank API";render();}
 catch(err){seriesA=sampleSeries(key,a);seriesB=sampleSeries(key,b);$("sourceBadge").textContent="Sample fallback data · API unavailable";render();showNotice("We couldn't reach the World Bank API. The chart is showing sample data so you can continue exploring. Sample values for some countries are illustrative, not official statistics.");}
 finally{$("loading").classList.add("hidden");$("compareBtn").disabled=false;$("compareBtn").innerHTML='Compare countries <b>↗</b>';}
}
function exportCsv(){if(!currentRows.length)return;const a=$("countryA").value,b=$("countryB").value,ind=indicators[$("indicator").value];const rows=[["Year",name(a),name(b),"Indicator"],...currentRows.map(r=>[r.year,r.a??"",r.b??"",ind.label])];const csv=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\r\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`worldlens-${$("indicator").value}-${a}-${b}.csv`;link.click();URL.revokeObjectURL(url);}
fillCountries();$("compareBtn").addEventListener("click",compare);$("exportBtn").addEventListener("click",exportCsv);["countryA","countryB","indicator","yearRange"].forEach(id=>$(id).addEventListener("change",compare));compare();
