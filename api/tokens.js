const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');

function tableClient(){
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if(!connectionString) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  return TableClient.fromConnectionString(connectionString, 'FcmDevices');
}

async function ensureTable(client){ try{ await client.createTable(); }catch(error){ if(error.statusCode !== 409) throw error; } }
function tokenKey(token){ return Buffer.from(token).toString('base64url').slice(0, 900); }

async function saveToken(token, role){
  const client=tableClient(); await ensureTable(client);
  await client.upsertEntity({ partitionKey: role || 'all', rowKey: tokenKey(token), token, role: role || 'all', updatedAt: new Date().toISOString() }, 'Replace');
}

async function getTokens(audience){
  const client=tableClient(); await ensureTable(client); const tokens=[];
  const filter = audience && audience !== 'all' ? `PartitionKey eq '${audience.replace(/'/g,"''")}'` : undefined;
  for await (const item of client.listEntities({ queryOptions: filter ? { filter } : {} })) if(item.token) tokens.push(item.token);
  return [...new Set(tokens)];
}

async function removeToken(token, role){
  const client=tableClient();
  try{ await client.deleteEntity(role || 'all', tokenKey(token)); }catch(error){ if(error.statusCode !== 404) throw error; }
}

module.exports={saveToken,getTokens,removeToken};
