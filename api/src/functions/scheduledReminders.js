const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');
const { firebaseMessaging } = require('../../firebase');
const { getTokens, removeToken } = require('../../tokens');

const TABLE_NAME = process.env.PITCHSIDE_TABLE_NAME || 'PitchsideData';
const PARTITION_KEY = process.env.PITCHSIDE_PARTITION_KEY || 'boyne-u13';
const WINDOWS = [
  { key:'5d', milliseconds:5*24*60*60*1000, label:'5 days' },
  { key:'3d', milliseconds:3*24*60*60*1000, label:'3 days' },
  { key:'2d', milliseconds:2*24*60*60*1000, label:'2 days' },
  { key:'1d', milliseconds:24*60*60*1000, label:'1 day' },
  { key:'3h', milliseconds:3*60*60*1000, label:'3 hours' },
  { key:'1h', milliseconds:60*60*1000, label:'1 hour' }
];
const MATCH_TOLERANCE_MS = 35*60*1000;

function tableClient(){
  const connectionString=process.env.PITCHSIDE_STORAGE_CONNECTION_STRING;
  if(!connectionString) throw new Error('PITCHSIDE_STORAGE_CONNECTION_STRING is not configured');
  return TableClient.fromConnectionString(connectionString,TABLE_NAME);
}
async function readJson(table,key,fallback){
  try{
    const entity=await table.getEntity(PARTITION_KEY,key);
    return entity.value ? JSON.parse(entity.value) : fallback;
  }catch(error){
    if(error.statusCode===404) return fallback;
    throw error;
  }
}
async function writeJson(table,key,value){
  await table.upsertEntity({partitionKey:PARTITION_KEY,rowKey:key,value:JSON.stringify(value),updatedAt:new Date().toISOString()},'Replace');
}
function eventDate(event){
  const date=String(event.date||'');
  const time=String(event.time||'09:00');
  const value=new Date(date+'T'+time+':00');
  return Number.isNaN(value.getTime()) ? null : value;
}
async function sendToParents(title,body,data){
  const tokens=await getTokens('parent');
  if(!tokens.length) return {sent:0,failed:0};
  let sent=0,failed=0;
  for(let index=0;index<tokens.length;index+=500){
    const batch=tokens.slice(index,index+500);
    const result=await firebaseMessaging().sendEachForMulticast({
      tokens:batch,
      notification:{title:String(title).slice(0,120),body:String(body).slice(0,240)},
      data:Object.fromEntries(Object.entries(data||{}).map(([key,value])=>[key,String(value)])),
      webpush:{fcmOptions:{link:(data&&data.url)||'/?portal=parent'}}
    });
    sent+=result.successCount;failed+=result.failureCount;
    await Promise.all(result.responses.map((response,offset)=>{
      const code=response.error&&response.error.code;
      return ['messaging/invalid-registration-token','messaging/registration-token-not-registered'].includes(code)
        ? removeToken(batch[offset],'parent').catch(()=>{}) : null;
    }));
  }
  return {sent,failed};
}

app.timer('scheduled-reminders',{
  schedule:'0 0 * * * *',
  runOnStartup:false,
  handler:async (timer,context)=>{
    const table=tableClient();
    await table.createTable().catch(error=>{if(error.statusCode!==409)throw error;});
    const events=await readJson(table,'events',[]);
    const log=await readJson(table,'reminder-log',{});
    const now=Date.now();
    for(const event of Array.isArray(events)?events:[]){
      if(event.movedToHistory||event.archived) continue;
      const starts=eventDate(event);
      if(!starts||starts.getTime()<=now) continue;
      const remaining=starts.getTime()-now;
      const window=WINDOWS.find(item=>Math.abs(remaining-item.milliseconds)<=MATCH_TOLERANCE_MS);
      if(!window) continue;
      const logKey=event.id+':'+window.key;
      if(log[logKey]) continue;
      const type=event.type==='match'?'Fixture':'Training';
      const detail=[event.title,type+' in '+window.label,event.location||'', 'Please update availability in the app.'].filter(Boolean).join(' · ');
      const result=await sendToParents(type+' Reminder',detail,{url:'/?portal=parent',eventId:event.id,reminderWindow:window.key,kind:'automatic-reminder'});
      log[logKey]={sentAt:new Date().toISOString(),sent:result.sent,failed:result.failed};
      context.log('Scheduled reminder processed',logKey,result);
    }
    const cutoff=now-120*24*60*60*1000;
    Object.keys(log).forEach(key=>{if(new Date(log[key].sentAt||0).getTime()<cutoff)delete log[key];});
    await writeJson(table,'reminder-log',log);
  }
});
