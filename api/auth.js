const { getAuth } = require('firebase-admin/auth');
const { firebaseApp } = require('./firebase');

function bearerToken(request){
  const header = request.headers.get('authorization') || request.headers.get('x-boyne-authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}
function allowedCoachEmail(email){
  const configured = String(process.env.COACH_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  return !configured.length || configured.includes(String(email || '').toLowerCase());
}
async function requireCoach(request){
  const token = bearerToken(request);
  if(!token) return { ok:false, status:401, error:'Coach login required' };
  try{
    const decoded = await getAuth(firebaseApp()).verifyIdToken(token);
    const coachClaim = decoded.coach === true || decoded.role === 'coach';
    if(!coachClaim && !allowedCoachEmail(decoded.email)) return { ok:false, status:403, error:'This account is not authorised as a coach' };
    return { ok:true, user:decoded };
  }catch(error){
    return { ok:false, status:401, error:'Invalid or expired coach login' };
  }
}
module.exports = { requireCoach };
