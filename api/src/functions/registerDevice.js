const { app } = require('@azure/functions');
const { saveToken } = require('../tokens');
app.http('register-device', {
  methods: ['POST'], authLevel: 'anonymous', route: 'register-device',
  handler: async request => {
    const body=await request.json();
    if(!body.token || typeof body.token !== 'string') return { status:400, jsonBody:{error:'A valid FCM token is required'} };
    const role=['parent','coach'].includes(body.role) ? body.role : 'all';
    await saveToken(body.token,role);
    return { status:200, jsonBody:{registered:true,role} };
  }
});
