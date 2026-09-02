const { getAuth } = require('firebase-admin/auth');
const { firebaseApp } = require('./firebase');

function bearerToken(request){
  const header = request.headers.get('authorization') || request.headers.get('x-boyne-authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
function allowedCoachEmail(email){
  const configured = String(process.env.COACH_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  return !configured.length || configured.includes(String(email || '').toLowerCase());
}
function tokenSummary(token){
  try{
    const parts=token.split('.');
    if(parts.length!==3) return {format:'not-jwt'};
    const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
    return {
      aud: payload.aud || null,
      iss: payload.iss || null,
      email: payload.email || null,
      exp: payload.exp || null,
      iat: payload.iat || null,
      now: Math.floor(Date.now()/1000)
    };
  }catch(error){
    return {format:'unreadable-jwt'};
  }
}
async function requireCoach(request){
  const token=bearerToken(request);
  if(!token) return {ok:false,status:401,error:'Coach login required',diagnostic:'No bearer token reached auth.js'};
  try{
    const app=firebaseApp();
    const decoded=await getAuth(app).verifyIdToken(token);
    const coachClaim=decoded.coach===true || decoded.role==='coach';
    if(!coachClaim && !allowedCoachEmail(decoded.email)){
      return {ok:false,status:403,error:'This account is not authorised as a coach',diagnostic:'Verified token email is not in COACH_EMAILS'};
    }
    return {ok:true,user:decoded};
  }catch(error){
    const summary=tokenSummary(token);
    const code=error && error.code ? String(error.code) : 'unknown';
    const message=error && error.message ? String(error.message) : String(error);
    console.error('Coach token verification failed',{code,message,summary});
    return {
      ok:false,
      status:401,
      error:'Invalid or expired coach login',
      diagnostic:code+' | '+message,
      token:summary
    };
  }
}
module.exports={requireCoach};
