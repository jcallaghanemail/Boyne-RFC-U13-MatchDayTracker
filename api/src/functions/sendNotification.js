const { app } = require('@azure/functions');
const { firebaseMessaging } = require('../../firebase');
const { getTokens, removeToken } = require('../../tokens');
const { requireCoach } = require('../../auth');
app.http('send-notification', {
  methods:['POST'], authLevel:'anonymous', route:'send-notification',
  handler: async request => {
    const auth=await requireCoach(request);
    if(!auth.ok) return {status:auth.status,jsonBody:{error:auth.error}};
    const body=await request.json();
    if(!body.title || !body.body) return {status:400,jsonBody:{error:'title and body are required'}};
    const audience=['parent','coach','all'].includes(body.audience) ? body.audience : 'all';
    const tokens=await getTokens(audience);
    if(!tokens.length) return {status:200,jsonBody:{sent:0,failed:0,message:'No registered devices'}};
    let sent=0,failed=0;
    for(let i=0;i<tokens.length;i+=500){
      const batch=tokens.slice(i,i+500);
      const result=await firebaseMessaging().sendEachForMulticast({
        tokens:batch,
        notification:{title:String(body.title).slice(0,120),body:String(body.body).slice(0,240)},
        data:Object.fromEntries(Object.entries(body.data||{}).map(([k,v])=>[k,String(v)])),
        webpush:{fcmOptions:{link:(body.data&&body.data.url)||'/?portal=parent'}}
      });
      sent+=result.successCount; failed+=result.failureCount;
      await Promise.all(result.responses.map((r,index)=>{
        const code=r.error&&r.error.code;
        return ['messaging/invalid-registration-token','messaging/registration-token-not-registered'].includes(code)
          ? removeToken(batch[index], audience==='all' ? 'all' : audience).catch(()=>{}) : null;
      }));
    }
    return {status:200,jsonBody:{sent,failed,kind:body.kind||'general'}};
  }
});
