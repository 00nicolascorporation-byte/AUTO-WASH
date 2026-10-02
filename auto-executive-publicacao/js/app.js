/* Gestão Executiva — Estética Automotiva
   Frontend standalone. Dados persistem no LocalStorage.
*/
const KEY="autoExecutiveDB_v1";
const defaultDB={
  settings:{company:"AUTO EXECUTIVE",theme:"dark"},
  clients:[],vehicles:[],services:[],orders:[],products:[],purchases:[],
  employees:[],hours:[],machines:[],transactions:[],investments:[],goals:[]
};
let db=loadDB(), currentPage="dashboard", charts={};

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();
const brl=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
const num=v=>Number(String(v??"").replace(/\./g,"").replace(",", "."))||0;
const dateBR=v=>v?new Date(v+"T12:00:00").toLocaleDateString("pt-BR"):"—";
const today=()=>new Date().toISOString().slice(0,10);
function loadDB(){try{return {...structuredClone(defaultDB),...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return structuredClone(defaultDB)}}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function toast(msg,type=""){const el=document.createElement("div");el.className="toast "+type;el.textContent=msg;$("#toastStack").appendChild(el);setTimeout(()=>el.remove(),3200)}
function sum(arr,key){return arr.reduce((a,x)=>a+(Number(x[key])||0),0)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function statusBadge(status){
 const s=String(status||"").toLowerCase();
 let c=s.includes("crít")||s.includes("atras")||s.includes("cancel")?"red":s.includes("razo")||s.includes("pend")||s.includes("manut")?"yellow":s.includes("ót")||s.includes("pago")||s.includes("final")||s.includes("ativo")?"green":"gray";
 return `<span class="badge ${c}">${esc(status||"—")}</span>`;
}
function inventoryStatus(p){
 const q=Number(p.qty)||0,min=Number(p.min)||0,ideal=Number(p.ideal)||0;
 if(q<min)return ["CRÍTICO","red"]; if(q<ideal)return ["RAZOÁVEL","yellow"]; return ["ÓTIMO","green"];
}
function transactionsBy(type){return db.transactions.filter(x=>x.type===type)}
function revenue(){return sum(transactionsBy("revenue"),"value")}
function expenses(){return sum(transactionsBy("expense"),"value")}
function investments(){return sum(db.investments,"value")}
function gross(){return revenue()-expenses()}
function net(){return revenue()-expenses()-investments()}
function periodFilter(arr,start,end,dateKey="date"){return arr.filter(x=>{const d=x[dateKey]||"";return (!start||d>=start)&&(!end||d<=end)})}
function dateBounds(period){
 const d=new Date(), end=today(); let start=end;
 if(period==="week"){const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);start=d.toISOString().slice(0,10)}
 if(period==="month")start=new Date(d.getFullYear(),d.getMonth(),1).toISOString().slice(0,10);
 if(period==="year")start=new Date(d.getFullYear(),0,1).toISOString().slice(0,10);
 return [start,end]
}
function calcHours(h){if(!h.start||!h.end)return 0;const [a,b]=h.start.split(":").map(Number),[c,e]=h.end.split(":").map(Number);let m=(c*60+e)-(a*60+b)-(Number(h.break)||0);return Math.max(0,m)/60}
function stockValue(){return sum(db.products,"qty")?db.products.reduce((a,p)=>a+(Number(p.qty)||0)*(Number(p.cost)||0),0):0}
function renderNav(){ $$(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===currentPage));}
function render(){renderNav();const titles={dashboard:["VISÃO EXECUTIVA","Dashboard"],orders:["OPERAÇÃO","Ordens de Serviço"],services:["OPERAÇÃO","Serviços"],clients:["OPERAÇÃO","Clientes"],vehicles:["OPERAÇÃO","Veículos"],products:["ESTOQUE","Produtos"],inventory:["ESTOQUE","Estoque"],purchases:["ESTOQUE","Compras"],employees:["EQUIPE","Funcionários"],hours:["EQUIPE","Horas Trabalhadas"],machines:["EQUIPE","Máquinas"],finance:["FINANCEIRO","Financeiro"],investments:["FINANCEIRO","Investimentos"],goals:["ANÁLISES","Metas"],reports:["ANÁLISES","Relatórios"],settings:["SISTEMA","Configurações"]};$("#pageKicker").textContent=titles[currentPage]?.[0]||"GESTÃO";$("#pageTitle").textContent=titles[currentPage]?.[1]||"Gestão";$("#app").innerHTML=pages[currentPage]();lucide.createIcons();if(currentPage==="dashboard")drawDashboard();if(currentPage==="reports")drawReport();}

const header=(title,desc,action)=>`<div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div><div class="actions">${action||""}</div></div>`;
const addBtn=(label,kind)=>`<button class="btn primary" onclick="openForm('${kind}')"><i data-lucide="plus"></i> ${label}</button>`;
function metric(label,value,sub="",cls=""){return `<div class="card metric"><div class="label">${label}</div><div class="value ${cls}">${value}</div><div class="sub">${sub}</div></div>`}

function dashboard(){
 const [s,e]=dateBounds($("#periodSelect")?.value||"month");
 const rev=sum(periodFilter(transactionsBy("revenue"),s,e),"value"),exp=sum(periodFilter(transactionsBy("expense"),s,e),"value");
 const inv=sum(periodFilter(db.investments,s,e),"value"),hours=sum(periodFilter(db.hours,s,e).map(x=>({value:calcHours(x)})),"value");
 const sv=db.orders.filter(o=>o.date>=s&&o.date<=e&&o.status!=="Cancelada").length;
 return header("Visão executiva","Controle integrado da operação, estoque e financeiro.",
 `<select id="periodSelect" onchange="render()"><option value="day">Hoje</option><option value="week">Esta semana</option><option value="month" selected>Este mês</option><option value="year">Este ano</option></select>
 ${addBtn("Nova receita","revenue")}`)
 +`<div class="grid cards">
 ${metric("Receita",brl(rev),"Entradas no período","")}
 ${metric("Despesas",brl(exp),"Operação","bad")}
 ${metric("Investimentos",brl(inv),"Expansão/ativos","")}
 ${metric("Saldo bruto",brl(rev-exp),"Receita − despesas","")}
 ${metric("Saldo líquido",brl(rev-exp-inv),"Após investimentos",(rev-exp-inv)>=0?"":"bad")}
 ${metric("Estoque",brl(stockValue()),db.products.length+" produtos","")}
 </div>
 <div class="grid two" style="margin-top:14px">
   <section class="card section"><div class="section-head"><h3>Receita × despesas × saldo</h3><span>${dateBR(s)} — ${dateBR(e)}</span></div><div class="chart-box"><canvas id="financeChart"></canvas></div></section>
   <section class="card section"><div class="section-head"><h3>Saúde do estoque</h3><span>status automático</span></div>${stockPanel()}</section>
 </div>
 <div class="grid three" style="margin-top:14px">
  <section class="card section"><div class="section-head"><h3>Operação</h3></div>
   <div class="list"><div class="kpi"><span>Serviços no período</span><strong>${sv}</strong></div><div class="kpi"><span>Veículos cadastrados</span><strong>${db.vehicles.length}</strong></div><div class="kpi"><span>Horas trabalhadas</span><strong>${hours.toFixed(1)}h</strong></div><div class="kpi"><span>Funcionários</span><strong>${db.employees.length}</strong></div></div>
  </section>
  <section class="card section"><div class="section-head"><h3>Máquinas</h3></div>${machineMini()}</section>
  <section class="card section"><div class="section-head"><h3>Resumo automático</h3></div><div class="hero"><h2>${rev?`Movimentação de ${brl(rev)} em receitas.`:"Ainda não há receitas registradas."}</h2><p>${rev?`As despesas somam ${brl(exp)} e os investimentos ${brl(inv)}. Saldo líquido do período: ${brl(rev-exp-inv)}.`:"Cadastre a primeira receita ou carregue dados de demonstração para visualizar os indicadores."}</p></div></section>
 </div>`;
}
function stockPanel(){if(!db.products.length)return `<div class="empty">Nenhum produto cadastrado.</div>`;return `<div class="list">${db.products.slice(0,7).map(p=>{const [st,c]=inventoryStatus(p);return `<div class="list-row"><div class="list-main"><strong>${esc(p.name)}</strong><span>${p.qty||0} ${esc(p.unit||"un.")} · mínimo ${p.min||0}</span></div>${statusBadge(st)}</div>`}).join("")}</div>`}
function machineMini(){if(!db.machines.length)return `<div class="empty">Nenhuma máquina cadastrada.</div>`;return `<div class="list">${db.machines.slice(0,5).map(m=>`<div class="list-row"><div class="list-main"><strong>${esc(m.name)}</strong><span>${esc(m.model||"")}</span></div>${statusBadge(m.status)}</div>`).join("")}</div>`}

function tablePage(title,desc,kind,headers,rows,empty="Nenhum registro cadastrado."){
 return header(title,desc,addBtn("Adicionar",kind))+`<section class="card section"><div class="filters"><div class="search"><input id="tableSearch" placeholder="Pesquisar..." oninput="filterTable()"></div></div><div class="table-wrap"><table class="table" id="dataTable"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}<th>Ações</th></tr></thead><tbody>${rows||`<tr><td colspan="${headers.length+1}"><div class="empty">${empty}</div></td></tr>`}</tbody></table></div></section>`;
}
function actions(kind,id){return `<button class="btn small secondary" onclick="openForm('${kind}','${id}')">Editar</button> <button class="btn small danger" onclick="removeItem('${kind}','${id}')">Excluir</button>`}

function simpleRows(arr,cols,kind){return arr.map(x=>`<tr>${cols.map(c=>`<td>${c(x)}</td>`).join("")}<td>${actions(kind,x.id)}</td></tr>`).join("")}

function orders(){return tablePage("Ordens de Serviço","Atendimento e execução dos serviços.", "order",
["OS","Data","Cliente","Veículo","Serviço","Total","Status"],
simpleRows(db.orders,[x=>esc(x.code),x=>dateBR(x.date),x=>esc(db.clients.find(c=>c.id===x.clientId)?.name||"—"),x=>esc(db.vehicles.find(v=>v.id===x.vehicleId)?.model||"—"),x=>esc(db.services.find(s=>s.id===x.serviceId)?.name||x.service||"—"),x=>brl(x.total),x=>statusBadge(x.status)],"order"))}
function services(){return tablePage("Serviços","Catálogo de serviços, preços e tempo estimado.","service",["Serviço","Categoria","Preço","Tempo","Status"],simpleRows(db.services,[x=>`<strong>${esc(x.name)}</strong>`,x=>esc(x.category),x=>brl(x.price),x=>esc(x.duration)+" min",x=>statusBadge(x.status||"Ativo")],"service"))}
function clients(){return tablePage("Clientes","Cadastro e histórico de clientes.","client",["Nome","CPF/CNPJ","Telefone","Veículos","Cadastro"],simpleRows(db.clients,[x=>`<strong>${esc(x.name)}</strong>`,x=>esc(x.doc),x=>esc(x.phone),x=>db.vehicles.filter(v=>v.clientId===x.id).length,x=>dateBR(x.date||today())],"client"))}
function vehicles(){return tablePage("Veículos","Frota atendida e características dos veículos.","vehicle",["Modelo","Marca","Ano","Cor","Tipo","Cliente"],simpleRows(db.vehicles,[x=>`<strong>${esc(x.model)}</strong>`,x=>esc(x.brand),x=>esc(x.year),x=>esc(x.color),x=>esc(x.type),x=>esc(db.clients.find(c=>c.id===x.clientId)?.name||"—")],"vehicle"))}
function products(){return tablePage("Produtos","Cadastro mestre de produtos e custos.","product",["Produto","Categoria","Estoque","Custo","Venda","Status"],simpleRows(db.products,[x=>`<strong>${esc(x.name)}</strong>`,x=>esc(x.category),x=>`${x.qty||0} ${esc(x.unit||"un.")}`,x=>brl(x.cost),x=>brl(x.price),x=>{const [s]=inventoryStatus(x);return statusBadge(s)}],"product"))}
function inventory(){return tablePage("Estoque","Saldo, movimentações e necessidade de compra.","inventory",["Produto","Atual","Mínimo","Ideal","Valor","Status"],simpleRows(db.products,[x=>`<strong>${esc(x.name)}</strong>`,x=>x.qty||0,x=>x.min||0,x=>x.ideal||0,x=>brl((x.qty||0)*(x.cost||0)),x=>{const [s]=inventoryStatus(x);return statusBadge(s)}],"product"))}
function purchases(){return tablePage("Compras","Planejamento de compras e reposição.","purchase",["Data","Produto","Quantidade","Total","Status"],simpleRows(db.purchases,[x=>dateBR(x.date),x=>esc(db.products.find(p=>p.id===x.productId)?.name||"—"),x=>x.qty||0,x=>brl(x.total),x=>statusBadge(x.status)],"purchase"))}
function employees(){return tablePage("Funcionários","Equipe, cargos e valor de hora.","employee",["Nome","Cargo","Setor","Hora","Status"],simpleRows(db.employees,[x=>`<strong>${esc(x.name)}</strong>`,x=>esc(x.role),x=>esc(x.department),x=>brl(x.hour),x=>statusBadge(x.status||"Ativo")],"employee"))}
function hours(){return tablePage("Horas trabalhadas","Controle de jornada e custo de mão de obra.","hours",["Data","Funcionário","Entrada","Saída","Intervalo","Horas","Custo"],simpleRows(db.hours,[x=>dateBR(x.date),x=>esc(db.employees.find(e=>e.id===x.employeeId)?.name||"—"),x=>x.start,x=>x.end,x=>(x.break||0)+" min",x=>calcHours(x).toFixed(2)+"h",x=>brl(calcHours(x)*(Number(db.employees.find(e=>e.id===x.employeeId)?.hour)||0))],"hours"))}
function machines(){return tablePage("Máquinas e equipamentos","Utilização, manutenção e status dos ativos.","machine",["Máquina","Modelo","Setor","Valor","Status"],simpleRows(db.machines,[x=>`<strong>${esc(x.name)}</strong>`,x=>esc(x.model),x=>esc(x.department),x=>brl(x.value),x=>statusBadge(x.status)],"machine"))}
function finance(){const rev=revenue(),exp=expenses(),inv=investments();return header("Financeiro","Receitas, despesas, fluxo de caixa e resultado.","")+`<div class="grid cards">${metric("Receitas",brl(rev),"Entradas")}${metric("Despesas",brl(exp),"Operação")}${metric("Investimentos",brl(inv),"Ativos")}${metric("Saldo bruto",brl(rev-exp),"Receita − despesas")}${metric("Saldo líquido",brl(rev-exp-inv),"Após investimentos")}${metric("Margem líquida",rev?((rev-exp-inv)/rev*100).toFixed(1)+"%":"0%","Resultado / receita")}</div>
<div class="grid two" style="margin-top:14px"><section class="card section"><div class="section-head"><h3>Movimentações</h3><div class="actions">${addBtn("Receita","revenue")}${addBtn("Despesa","expense")}</div></div>${financeTable()}</section><section class="card section"><div class="section-head"><h3>Investimentos</h3><button class="btn small primary" onclick="openForm('investment')">Adicionar</button></div>${investmentTable()}</section></div>`}
function financeTable(){const a=db.transactions.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));if(!a.length)return `<div class="empty">Nenhuma movimentação.</div>`;return `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Ações</th></tr></thead><tbody>${a.map(x=>`<tr><td>${dateBR(x.date)}</td><td>${statusBadge(x.type==="revenue"?"Receita":"Despesa")}</td><td>${esc(x.description)}</td><td>${esc(x.category)}</td><td>${brl(x.value)}</td><td>${actions(x.type,x.id)}</td></tr>`).join("")}</tbody></table></div>`}
function investmentTable(){if(!db.investments.length)return `<div class="empty">Nenhum investimento.</div>`;return `<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Ações</th></tr></thead><tbody>${db.investments.map(x=>`<tr><td>${dateBR(x.date)}</td><td>${esc(x.description)}</td><td>${esc(x.category)}</td><td>${brl(x.value)}</td><td>${actions("investment",x.id)}</td></tr>`).join("")}</tbody></table></div>`}
function investments(){return tablePage("Investimentos","Aquisições, estrutura, expansão e ativos.","investment",["Data","Descrição","Categoria","Valor"],simpleRows(db.investments,[x=>dateBR(x.date),x=>esc(x.description),x=>esc(x.category),x=>brl(x.value)],"investment"))}
function goals(){return tablePage("Metas","Metas financeiras e operacionais.","goal",["Período","Descrição","Meta","Realizado","Progresso"],simpleRows(db.goals,[x=>esc(x.period),x=>esc(x.description),x=>brl(x.target),x=>brl(x.actual),x=>{const p=x.target?Math.min(100,x.actual/x.target*100):0;return `${p.toFixed(0)}% <div class="progress"><i style="width:${p}%"></i></div>`}],"goal"))}
function reports(){return header("Relatórios","Visões consolidadas para análise e impressão.",`<button class="btn primary" onclick="window.print()">Imprimir relatório</button>`)+`<section class="card section"><div class="filters"><div class="field"><label>Data inicial</label><input id="reportStart" type="date" value="${new Date(new Date().getFullYear(),new Date().getMonth(),1).toISOString().slice(0,10)}"></div><div class="field"><label>Data final</label><input id="reportEnd" type="date" value="${today()}"></div><button class="btn primary" onclick="drawReport()">Gerar</button></div><div id="reportOutput"></div></section>`}
function settings(){return header("Configurações","Personalize a identidade e os dados locais.","")+`<div class="grid two"><section class="card section"><div class="section-head"><h3>Empresa</h3></div><div class="form-grid"><div class="field"><label>Nome da empresa</label><input id="companyName" value="${esc(db.settings.company)}"></div><div class="field"><label>Moeda</label><input value="BRL — Real brasileiro" disabled></div></div><br><button class="btn primary" onclick="db.settings.company=$('#companyName').value.trim()||'AUTO EXECUTIVE';save();$('#brandName').textContent=db.settings.company;toast('Configurações salvas','success')">Salvar</button></section><section class="card section"><div class="section-head"><h3>Dados</h3></div><div class="list"><button class="btn" onclick="exportBackup()">Exportar backup JSON</button><button class="btn" onclick="$('#restoreInput').click()">Importar backup JSON</button><button class="btn danger" onclick="clearData()">Apagar todos os dados</button></div></section></div>`}
const pages={dashboard,orders,services,clients,vehicles,products,inventory,purchases,employees,hours,machines,finance,investments,goals,reports,settings};

function drawDashboard(){
 const ctx=$("#financeChart");if(!ctx)return; if(charts.finance)charts.finance.destroy();
 const now=new Date(), days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(),labels=[];
 for(let i=1;i<=days;i++)labels.push(String(i).padStart(2,"0"));
 const r=labels.map((_,i)=>db.transactions.filter(x=>x.type==="revenue"&&new Date(x.date+"T12:00:00").getMonth()===now.getMonth()&&new Date(x.date+"T12:00:00").getDate()===i+1).reduce((a,x)=>a+num(x.value),0));
 const e=labels.map((_,i)=>db.transactions.filter(x=>x.type==="expense"&&new Date(x.date+"T12:00:00").getMonth()===now.getMonth()&&new Date(x.date+"T12:00:00").getDate()===i+1).reduce((a,x)=>a+num(x.value),0));
 charts.finance=new Chart(ctx,{type:"line",data:{labels,datasets:[{label:"Receitas",data:r,borderColor:"#e07b25",backgroundColor:"rgba(224,123,37,.08)",fill:true,tension:.35},{label:"Despesas",data:e,borderColor:"#e25555",tension:.35},{label:"Saldo",data:r.map((v,i)=>v-e[i]),borderColor:"#2bb673",tension:.35}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:getComputedStyle(document.body).getPropertyValue("--muted"),font:{size:10}}}},scales:{x:{ticks:{color:"#7f8790",font:{size:9}},grid:{display:false}},y:{ticks:{color:"#7f8790",font:{size:9},callback:v=>"R$ "+v},grid:{color:"rgba(130,140,150,.12)"}}}}});
}
function drawReport(){
 const out=$("#reportOutput");if(!out)return;const s=$("#reportStart").value,e=$("#reportEnd").value;
 const rev=sum(periodFilter(transactionsBy("revenue"),s,e),"value"),exp=sum(periodFilter(transactionsBy("expense"),s,e),"value"),inv=sum(periodFilter(db.investments,s,e),"value");
 const hs=periodFilter(db.hours,s,e).reduce((a,x)=>a+calcHours(x),0);
 out.innerHTML=`<div class="grid four">${metric("Receita",brl(rev),"Período")}${metric("Despesas",brl(exp),"Período")}${metric("Investimentos",brl(inv),"Período")}${metric("Saldo líquido",brl(rev-exp-inv),"Resultado")}</div><br><div class="grid three"><div class="kpi"><span>Serviços</span><strong>${db.orders.filter(x=>x.date>=s&&x.date<=e).length}</strong></div><div class="kpi"><span>Horas</span><strong>${hs.toFixed(1)}h</strong></div><div class="kpi"><span>Estoque</span><strong>${brl(stockValue())}</strong></div></div><br><div class="note">Período: ${dateBR(s)} até ${dateBR(e)}. O relatório usa os registros salvos no navegador.</div>`;
}

const schemas={
 revenue:{title:"Nova receita",fields:[["date","Data","date",today()],["description","Descrição","text",""],["category","Categoria","select","Venda|Serviço|Produção|Comissão|Outros"],["value","Valor","number",""],["payment","Forma de recebimento","select","PIX|Dinheiro|Débito|Crédito|Transferência|Outros"]]},
 expense:{title:"Nova despesa",fields:[["date","Data","date",today()],["description","Descrição","text",""],["category","Categoria","select","Água|Energia|Internet|Aluguel|Funcionários|Produtos|Equipamentos|Manutenção|Marketing|Impostos|Outros"],["value","Valor","number",""],["status","Status","select","Pago|Pendente|Agendado"]]},
 investment:{title:"Novo investimento",fields:[["date","Data","date",today()],["description","Descrição","text",""],["category","Categoria","select","Máquinas|Equipamentos|Estrutura|Tecnologia|Marketing|Estoque|Expansão|Veículos|Outros"],["value","Valor","number",""]]},
 client:{title:"Novo cliente",fields:[["name","Nome","text",""],["doc","CPF/CNPJ","text",""],["phone","Telefone / WhatsApp","text",""],["email","E-mail","email",""],["date","Cadastro","date",today()]]},
 vehicle:{title:"Novo veículo",fields:[["clientId","Cliente","selectClients",""],["brand","Marca","text",""],["model","Modelo","text",""],["year","Ano","number",""],["color","Cor","text",""],["type","Tipo","select","Carro|SUV|Pickup|Caminhonete|Van|Moto|Caminhão|Comercial|Outros"]]},
 service:{title:"Novo serviço",fields:[["name","Nome","text",""],["category","Categoria","text","Estética"],["price","Preço","number",""],["duration","Tempo (min)","number","60"],["status","Status","select","Ativo|Inativo"]]},
 product:{title:"Novo produto",fields:[["name","Produto","text",""],["category","Categoria","text",""],["unit","Unidade","text","un."],["qty","Quantidade","number","0"],["min","Estoque mínimo","number","0"],["ideal","Estoque ideal","number","0"],["cost","Custo unitário","number","0"],["price","Preço de venda","number","0"]]},
 purchase:{title:"Nova compra",fields:[["date","Data","date",today()],["productId","Produto","selectProducts",""],["qty","Quantidade","number","1"],["unit","Valor unitário","number","0"],["status","Status","select","Solicitada|Aguardando|Comprada|Recebida|Cancelada"]]},
 employee:{title:"Novo funcionário",fields:[["name","Nome","text",""],["role","Cargo","text",""],["department","Setor","text",""],["hour","Valor da hora","number","0"],["status","Status","select","Ativo|Férias|Afastado|Inativo"]]},
 hours:{title:"Registro de horas",fields:[["date","Data","date",today()],["employeeId","Funcionário","selectEmployees",""],["start","Entrada","time","08:00"],["end","Saída","time","17:00"],["break","Intervalo (min)","number","60"]]},
 machine:{title:"Nova máquina",fields:[["name","Nome","text",""],["model","Modelo","text",""],["department","Setor","text",""],["value","Valor","number","0"],["status","Status","select","Operando|Parada|Manutenção|Inativa"]]},
 goal:{title:"Nova meta",fields:[["period","Período","select","Diária|Semanal|Mensal|Anual"],["description","Descrição","text",""],["target","Meta financeira","number","0"],["actual","Realizado","number","0"]]},
 order:{title:"Nova ordem de serviço",fields:[["code","Número da OS","text",""],["date","Data","date",today()],["clientId","Cliente","selectClients",""],["vehicleId","Veículo","selectVehicles",""],["serviceId","Serviço","selectServices",""],["total","Total","number","0"],["status","Status","select","Agendada|Aguardando|Em andamento|Finalizada|Entregue|Cancelada"]]}
};
function selectOptions(type){
 if(type==="selectClients")return db.clients.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
 if(type==="selectVehicles")return db.vehicles.map(x=>`<option value="${x.id}">${esc(x.brand)} ${esc(x.model)} — ${esc(x.color)}</option>`).join("");
 if(type==="selectProducts")return db.products.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
 if(type==="selectEmployees")return db.employees.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
 if(type==="selectServices")return db.services.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
 return "";
}
function openForm(kind,id){
 const schema=schemas[kind];if(!schema)return;const existing=findItem(kind,id)||{};
 const fields=schema.fields.map(([name,label,type,def])=>{
   const value=existing[name]??def??"";
   if(type.startsWith("select"))return `<div class="field"><label>${label}</label><select name="${name}">${type==="select"?def.split("|").map(o=>`<option ${String(value)===o?"selected":""}>${esc(o)}</option>`).join(""):selectOptions(type)}</select></div>`;
   return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${esc(value)}" ${name==="code"&&!existing.id?"placeholder":"".includes("")?"":" "}></div>`;
 }).join("");
 $("#modal").innerHTML=`<div class="modal-head"><h3>${schema.title}</h3><button class="icon-btn" onclick="closeModal()">×</button></div><form id="entityForm"><div class="modal-body"><div class="form-grid">${fields}</div></div><div class="modal-foot"><button type="button" class="btn" onclick="closeModal()">Cancelar</button><button class="btn primary">Salvar</button></div></form>`;
 $("#modalBackdrop").classList.remove("hidden");lucide.createIcons();
 $("#entityForm").onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());saveEntity(kind,id,data);closeModal();render();toast("Registro salvo com sucesso","success")}
}
function findItem(kind,id){const map={revenue:"transactions",expense:"transactions",investment:"investments",client:"clients",vehicle:"vehicles",service:"services",product:"products",purchase:"purchases",employee:"employees",hours:"hours",machine:"machines",goal:"goals",order:"orders"};const arr=db[map[kind]]||[];return arr.find(x=>x.id===id)}
function saveEntity(kind,id,d){
 const map={revenue:"transactions",expense:"transactions",investment:"investments",client:"clients",vehicle:"vehicles",service:"services",product:"products",purchase:"purchases",employee:"employees",hours:"hours",machine:"machines",goal:"goals",order:"orders"};
 const arr=db[map[kind]], obj={...d,id:id||uid()};
 if(kind==="revenue"||kind==="expense"){obj.type=kind;obj.value=num(d.value)}
 if(["investment","service","product","purchase","employee","goal","order"].includes(kind)){for(const k of ["value","price","cost","qty","min","ideal","hour","target","actual","total","unit","duration"])if(k in obj)obj[k]=num(obj[k])}
 if(kind==="purchase")obj.total=num(d.qty)*num(d.unit);
 const i=arr.findIndex(x=>x.id===obj.id);if(i>=0)arr[i]=obj;else arr.push(obj);
 save();
}
function removeItem(kind,id){if(!confirm("Excluir este registro?"))return;const map={revenue:"transactions",expense:"transactions",investment:"investments",client:"clients",vehicle:"vehicles",service:"services",product:"products",purchase:"purchases",employee:"employees",hours:"hours",machine:"machines",goal:"goals",order:"orders"};db[map[kind]]=db[map[kind]].filter(x=>x.id!==id);save();render();toast("Registro excluído")}
function filterTable(){const q=($("#tableSearch")?.value||"").toLowerCase();$$(`#dataTable tbody tr`).forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)?"":"none")}
function closeModal(){$("#modalBackdrop").classList.add("hidden")}
function exportBackup(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`backup-auto-executive-${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup exportado","success")}
function importBackup(file){const reader=new FileReader();reader.onload=()=>{try{db={...structuredClone(defaultDB),...JSON.parse(reader.result)};save();render();toast("Backup restaurado","success")}catch{toast("Arquivo inválido","error")}};reader.readAsText(file)}
function clearData(){if(confirm("Isso apagará todos os dados locais. Continuar?")){db=structuredClone(defaultDB);save();render();toast("Dados apagados")}}
function demo(){
 db=structuredClone(defaultDB);
 const cid=uid(),cid2=uid();db.clients=[{id:cid,name:"Cliente Demonstração",doc:"00.000.000/0000-00",phone:"(92) 99999-0000",email:"cliente@exemplo.com",date:today()},{id:cid2,name:"Frota Corporativa",doc:"11.111.111/0001-11",phone:"(92) 98888-0000",date:today()}];
 const vid=uid(),vid2=uid();db.vehicles=[{id:vid,clientId:cid,brand:"Toyota",model:"Corolla",year:2024,color:"Cinza",type:"Carro"},{id:vid2,clientId:cid2,brand:"Ford",model:"Ranger",year:2025,color:"Preto",type:"Pickup"}];
 const sid=uid(),sid2=uid();db.services=[{id:sid,name:"Lavagem Premium",category:"Lavagem",price:180,duration:90,status:"Ativo"},{id:sid2,name:"Higienização Interna",category:"Higienização",price:280,duration:150,status:"Ativo"}];
 const p1=uid(),p2=uid(),p3=uid();db.products=[{id:p1,name:"Shampoo Automotivo",category:"Químicos",unit:"L",qty:3,min:2,ideal:8,cost:45,price:70},{id:p2,name:"APC Concentrado",category:"Químicos",unit:"L",qty:10,min:4,ideal:8,cost:32,price:55},{id:p3,name:"Cera Premium",category:"Proteção",unit:"un.",qty:1,min:2,ideal:5,cost:95,price:160}];
 const e1=uid(),e2=uid();db.employees=[{id:e1,name:"João Silva",role:"Detailer",department:"Operação",hour:18,status:"Ativo"},{id:e2,name:"Marcos Lima",role:"Supervisor",department:"Operação",hour:25,status:"Ativo"}];
 db.machines=[{id:uid(),name:"Extratora",model:"Pro X",department:"Higienização",value:4800,status:"Operando"},{id:uid(),name:"Politriz",model:"Dual Action",department:"Polimento",value:3200,status:"Manutenção"}];
 db.transactions=[
  {id:uid(),type:"revenue",date:today(),description:"Lavagem Premium — Corolla",category:"Serviço",value:180,payment:"PIX"},
  {id:uid(),type:"revenue",date:today(),description:"Higienização — Ranger",category:"Serviço",value:280,payment:"Crédito"},
  {id:uid(),type:"expense",date:today(),description:"Compra de químicos",category:"Produtos",value:220,status:"Pago"},
  {id:uid(),type:"expense",date:today(),description:"Energia elétrica",category:"Energia",value:640,status:"Pendente"}
 ];
 db.investments=[{id:uid(),date:today(),description:"Equipamento de demonstração",category:"Equipamentos",value:1200}];
 db.hours=[{id:uid(),date:today(),employeeId:e1,start:"08:00",end:"17:00",break:60},{id:uid(),date:today(),employeeId:e2,start:"08:00",end:"18:00",break:60}];
 db.orders=[{id:uid(),code:"OS-0001",date:today(),clientId:cid,vehicleId:vid,serviceId:sid,total:180,status:"Finalizada"},{id:uid(),code:"OS-0002",date:today(),clientId:cid2,vehicleId:vid2,serviceId:sid2,total:280,status:"Em andamento"}];
 db.goals=[{id:uid(),period:"Mensal",description:"Receita de serviços",target:15000,actual:4600}];
 save();render();toast("Dados de demonstração carregados","success");
}
$$(".nav-item[data-page]").forEach(b=>b.addEventListener("click",()=>{currentPage=b.dataset.page;$("#sidebar").classList.remove("open");render()}));
$("#demoBtn").addEventListener("click",demo);$("#clearBtn").addEventListener("click",clearData);$("#backupBtn").addEventListener("click",exportBackup);$("#restoreInput").addEventListener("change",e=>e.target.files[0]&&importBackup(e.target.files[0]));$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#themeBtn").addEventListener("click",()=>{db.settings.theme=db.settings.theme==="dark"?"light":"dark";document.body.classList.toggle("light",db.settings.theme==="light");save()});
document.body.classList.toggle("light",db.settings.theme==="light");$("#brandName").textContent=db.settings.company;render();// Login online por MATRÍCULA + SENHA (Supabase Auth)
(function(){
 const gate=document.getElementById('loginGate'), form=document.getElementById('loginForm');
 const cfg=window.APP_CONFIG||{};
 const ready=cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_URL.includes('COLE_AQUI');
 if(!gate||!form)return;
 if(!ready){document.getElementById('loginError').textContent='Configure o Supabase em js/config.js para ativar o login online.';return;}
 const client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
 form.addEventListener('submit',async e=>{e.preventDefault();const m=document.getElementById('loginMatricula').value.trim(),pw=document.getElementById('loginPassword').value;const {data,error}=await client.auth.signInWithPassword({email:`matricula.${m}@autoexecutive.local`,password:pw});if(error){document.getElementById('loginError').textContent='Matrícula ou senha inválida.';return}gate.remove();window.__supabase=client;window.__currentUser=data.user;});
 client.auth.getSession().then(({data})=>{if(data.session){window.__supabase=client;window.__currentUser=data.session.user;gate.remove()}});
})();
