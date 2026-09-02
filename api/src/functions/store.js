const { app } = require('@azure/functions');
const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');
const { requireCoach } = require('../../auth');

const TABLE_NAME = process.env.PITCHSIDE_TABLE_NAME || 'PitchsideData';
const PARTITION_KEY = process.env.PITCHSIDE_PARTITION_KEY || 'boyne-u13';

function getTableClient() {
  const connectionString = process.env.PITCHSIDE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('PITCHSIDE_STORAGE_CONNECTION_STRING is not configured');
  }
  return TableClient.fromConnectionString(connectionString, TABLE_NAME);
}

function validKey(key) {
  return typeof key === 'string' && key.length > 0 && key.length <= 512 && !/[\\/#?\u0000-\u001f\u007f-\u009f]/.test(key);
}

function response(status, body) {
  return {
    status,
    jsonBody: body,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json'
    }
  };
}

app.http('store', {
  methods: ['GET', 'PUT', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'store',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204 };

    try {
      const table = getTableClient();
      await table.createTable().catch(error => {
        if (error.statusCode !== 409) throw error;
      });

      if (request.method === 'GET') {
        const key = request.query.get('key');
        if (!validKey(key)) return response(400, { error: 'A valid key is required' });

        try {
          const entity = await table.getEntity(PARTITION_KEY, key);
          return response(200, { value: entity.value ?? null, updatedAt: entity.updatedAt ?? null });
        } catch (error) {
          if (error.statusCode === 404) return response(200, { value: null });
          throw error;
        }
      }

      if (request.method === 'PUT') {
        const payload = await request.json();
        const key = payload && payload.key;
        const parentWritable = key === 'poll-votes' || key === 'news-reads' || (typeof key === 'string' && key.startsWith('rsvp-'));
        if (!parentWritable) {
          const auth = await requireCoach(request);
          if (!auth.ok) return response(auth.status, { error: auth.error });
        }
        const value = payload && payload.value;
        if (!validKey(key) || typeof value !== 'string') {
          return response(400, { error: 'A valid key and string value are required' });
        }

        await table.upsertEntity({
          partitionKey: PARTITION_KEY,
          rowKey: key,
          value,
          updatedAt: new Date().toISOString()
        }, 'Replace');

        return response(200, { ok: true });
      }

      if (request.method === 'DELETE') {
        const key = request.query.get('key');
        const auth = await requireCoach(request);
        if (!auth.ok) return response(auth.status, { error: auth.error });
        if (!validKey(key)) return response(400, { error: 'A valid key is required' });
        await table.deleteEntity(PARTITION_KEY, key).catch(error => {
          if (error.statusCode !== 404) throw error;
        });
        return response(200, { ok: true });
      }

      return response(405, { error: 'Method not allowed' });
    } catch (error) {
      context.error('Store API error', error);
      return response(500, { error: 'Shared storage operation failed', detail: error && error.message ? error.message : String(error) });
    }
  }
});
