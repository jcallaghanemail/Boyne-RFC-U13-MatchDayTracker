const { getApps, initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

function firebaseMessaging(){
  if(!getApps().length){
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if(!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
    const serviceAccount = JSON.parse(raw);
    if(serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getMessaging();
}

module.exports = { firebaseMessaging };
