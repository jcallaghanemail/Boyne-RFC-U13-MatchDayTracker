const { app } = require('@azure/functions');
const { saveToken, removeToken } = require('../../tokens');
const { requireCoach } = require('../../auth');
app.http('register-device', {
  methods: ['POST','DELETE'], authLevel: 'anonymous', route: 'register-device',
  handler: async request => {
    const body=await request.json();
    if(!body.token || typeof body.token !== 'string') return { status:400, jsonBody:{error:'A valid FCM token is required'} };
    if(request.method === 'DELETE'){
      await Promise.all(['parent','coach','all'].map(role=>removeToken(body.token,role).catch(()=>{})));
      return {status:200,jsonBody:{removed:true}};
    }
    let role=['parent','coach'].includes(body.role) ? body.role : 'all';
    if(role === 'coach'){
      const auth=await requireCoach(request);
      if(!auth.ok) role='parent';
    }
    await saveToken(body.token,role);
    return { status:200, jsonBody:{registered:true,role} };
  }
});
