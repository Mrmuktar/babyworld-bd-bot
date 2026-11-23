const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const QRCode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const PORT = Number(process.env.PORT || 10000);
const ADMIN = String(process.env.ADMIN_NUMBER || '').replace(/\D/g, '');
const DATA_DIR = process.env.DATA_DIR || './data';
const AUTH_DIR = path.join(DATA_DIR, 'auth');
const DB_FILE = path.join(DATA_DIR, 'orders.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(AUTH_DIR, { recursive: true });

let db = { orders: [], nextId: 1001, activity: [] };
try { if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch(e) { console.error('DB load:',e); }
function save(){ fs.writeFileSync(DB_FILE, JSON.stringify(db,null,2)); }
function logActivity(text){ db.activity.unshift({at:new Date().toISOString(),text}); db.activity=db.activity.slice(0,200); save(); }
function money(n){ return Number(n||0).toLocaleString('en-BD'); }
function menu(){ return `🌟 *BABY WORLD BD — ORDER DESK* 🌟\n━━━━━━━━━━━━━━━━━━\n👑 *Admin Control Panel*\n\n1️⃣ নতুন অর্ডার\n2️⃣ সব অর্ডার\n3️⃣ Pending\n4️⃣ Confirmed\n5️⃣ Delivered\n6️⃣ Cancelled\n7️⃣ Return\n8️⃣ অর্ডার খুঁজুন\n9️⃣ অর্ডার আপডেট\n🔟 আজকের রিপোর্ট\n1️⃣1️⃣ মাসিক রিপোর্ট\n1️⃣2️⃣ Backup / ডেটা\n\n✍️ অপশন নম্বর লিখুন অথবা *menu* লিখুন।`; }
const statusMap={pending:'⏳ Pending',confirmed:'✅ Confirmed',booked:'🚚 Booked',delivered:'🎉 Delivered',cancelled:'❌ Cancelled',returned:'↩️ Returned'};
function orderCard(o){return `🧾 *Order #${o.id}*\n👤 ${o.name||'-'}\n📱 ${o.phone||'-'}\n📍 ${o.address||'-'}\n🛍️ ${o.items||'-'}\n💰 Total: ৳${money(o.total)}\n💵 COD: ৳${money(o.cod)}\n📌 ${statusMap[o.status]||o.status}\n📝 ${o.note||'No note'}`;}
function listOrders(filter){let arr=db.orders.filter(o=>!filter||o.status===filter).slice(-30).reverse(); return arr.length?arr.map(orderCard).join('\n\n────────────\n\n'):`কোনো অর্ডার পাওয়া যায়নি (${filter||'All'})`;}
function report(period){let now=new Date(), arr=db.orders.filter(o=>{let d=new Date(o.createdAt); return period==='day'?d.toDateString()===now.toDateString():d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}); let total=arr.reduce((s,o)=>s+Number(o.total||0),0); return `📊 *${period==='day'?'আজকের':'এই মাসের'} রিপোর্ট*\n🧾 অর্ডার: ${arr.length}\n💰 মোট বিক্রি: ৳${money(total)}\n⏳ Pending: ${arr.filter(o=>o.status==='pending').length}\n✅ Confirmed: ${arr.filter(o=>o.status==='confirmed').length}\n🚚 Booked: ${arr.filter(o=>o.status==='booked').length}\n🎉 Delivered: ${arr.filter(o=>o.status==='delivered').length}\n❌ Cancelled: ${arr.filter(o=>o.status==='cancelled').length}\n↩️ Return: ${arr.filter(o=>o.status==='returned').length}`;}
let flow=null;
let pairingQR='';
async function start(){
 const {state,saveCreds}=await useMultiFileAuthState(AUTH_DIR);
 const sock=makeWASocket({auth:state,logger:pino({level:'silent'}),printQRInTerminal:true});
 sock.ev.on('creds.update',saveCreds);
 sock.ev.on('connection.update',u=>{if(u.qr){pairingQR=u.qr;console.log('Pairing QR updated; open /pair on service URL.');}if(u.connection==='open'){pairingQR='';console.log('WhatsApp connected. Admin:',ADMIN);} if(u.connection==='close'){const code=u.lastDisconnect?.error?.output?.statusCode;if(code!==DisconnectReason.loggedOut)start();else console.log('Logged out. Remove /data/auth and redeploy to pair again.');}});
 sock.ev.on('messages.upsert',async ({messages})=>{
  for(const m of messages){if(!m.message||m.key.fromMe)continue;const jid=m.key.remoteJid;if(jid.endsWith('@g.us'))continue;const sender=jid.split('@')[0];if(!ADMIN||sender!==ADMIN){try{await sock.sendMessage(jid,{text:'🤖 Baby World BD order assistant. এই bot শুধুমাত্র admin ব্যবহারের জন্য।'});}catch{}continue;}
   const raw=m.message.conversation||m.message.extendedTextMessage?.text||'';
   const t=raw.trim(), low=t.toLowerCase();
   const send=async text=>sock.sendMessage(jid,{text},{quoted:m});
   if(low==='menu'||low==='start'||low==='hi'){flow=null;await send(menu());continue;}
   if(flow?.step==='new'){
    flow.data[flow.field]=t;
    const fields=['name','phone','address','items','total','cod'];
    const labels={name:'কাস্টমারের নাম',phone:'ফোন নম্বর',address:'ঠিকানা',items:'পণ্য/পরিমাণ',total:'মোট মূল্য (টাকা)',cod:'COD (টাকা)'};
    let next=fields[fields.indexOf(flow.field)+1];
    if(next){flow.field=next;await send(`✍️ লিখুন: *${labels[next]}*`);continue;}
    const o={id:db.nextId++,createdAt:new Date().toISOString(),status:'pending',note:'',...flow.data,total:Number(flow.data.total)||0,cod:Number(flow.data.cod)||0};
    db.orders.push(o);save();logActivity('New order #'+o.id);flow=null;await send(`🎉 *অর্ডার সেভ হয়েছে!*\n\n${orderCard(o)}\n\n${menu()}`);continue;
   }
   if(flow?.step==='search'){flow=null;let found=db.orders.filter(o=>String(o.id)===t||o.phone.includes(t)||o.name.toLowerCase().includes(low));await send(found.length?found.slice(-5).reverse().map(orderCard).join('\n\n'):'🔎 কিছু পাওয়া যায়নি।');continue;}
   if(flow?.step==='update'){flow=null;let [id,status]=t.split(/\s+/);status=status?.toLowerCase();let o=db.orders.find(x=>String(x.id)===id);if(!o){await send('Order ID পাওয়া যায়নি।');continue;}let aliases={'pending':'pending','confirm':'confirmed','confirmed':'confirmed','booked':'booked','delivered':'delivered','cancel':'cancelled','cancelled':'cancelled','return':'returned','returned':'returned'};if(!aliases[status]){await send('Status লিখুন: pending / confirm / booked / delivered / cancel / return');continue;}o.status=aliases[status];save();logActivity('Updated #'+id+' => '+o.status);await send('✅ আপডেট হয়েছে\n'+orderCard(o)+'\n\n'+menu());continue;}
   if(low==='1'){flow={step:'new',field:'name',data:{}};await send('🛒 *নতুন অর্ডার*\n\nকাস্টমারের নাম লিখুন:');continue;}
   if(low==='2'){await send('📦 *সব অর্ডার*\n\n'+listOrders(null));continue;}
   if(low==='3'){await send('⏳ *Pending*\n\n'+listOrders('pending'));continue;}
   if(low==='4'){await send('✅ *Confirmed*\n\n'+listOrders('confirmed'));continue;}
   if(low==='5'){await send('🎉 *Delivered*\n\n'+listOrders('delivered'));continue;}
   if(low==='6'){await send('❌ *Cancelled*\n\n'+listOrders('cancelled'));continue;}
   if(low==='7'){await send('↩️ *Return*\n\n'+listOrders('returned'));continue;}
   if(low==='8'){flow={step:'search'};await send('🔎 Order ID, ফোন নম্বর বা নাম লিখুন:');continue;}
   if(low==='9'){flow={step:'update'};await send('✏️ Order ID ও status লিখুন। উদাহরণ: *1001 confirm*\n\npending / confirm / booked / delivered / cancel / return');continue;}
   if(low==='10'){await send(report('day'));continue;}
   if(low==='11'){await send(report('month'));continue;}
   if(low==='12'){await send('💾 *Backup*\n\nডেটা /data/orders.json ফাইলে সংরক্ষিত। Render Disk ব্যবহার করুন; এই bot স্বয়ংক্রিয় cloud backup পাঠায় না।');continue;}
   await send(menu());
  }
 });
}
const app=express();
app.get('/qr',async(_,res)=>{if(!pairingQR)return res.status(404).send('QR is not available yet or already connected.');try{res.type('png').send(Buffer.from((await QRCode.toDataURL(pairingQR)).split(',')[1],'base64'));}catch(e){res.status(500).send('QR generation error');}});
app.get('/pair',(_,res)=>res.send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Baby World BD Pair</title></head><body style="font-family:Arial;text-align:center;background:#f4f7fb;padding:20px"><h2>Baby World BD WhatsApp Pairing</h2><p>WhatsApp → Linked devices → Link a device</p><img id="qr" style="width:min(90vw,360px);background:white;padding:12px;border-radius:12px" src="/qr"><p>QR refreshes automatically. Scan with WhatsApp.</p><script>setInterval(()=>{document.getElementById('qr').src='/qr?t='+Date.now()},5000)</script></body></html>`));
app.get('/',(_,res)=>res.send('<h1>Baby World BD Bot</h1><p>Service is running. WhatsApp pairing QR appears in server logs.</p>'));app.get('/health',(_,res)=>res.json({ok:true,orders:db.orders.length}));app.listen(PORT,()=>console.log('Web service running on',PORT));start().catch(console.error);
