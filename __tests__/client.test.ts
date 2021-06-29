import nock from 'nock';
import pino from 'pino';

import {makeAxiosInstanceWithRetry} from '../src/client';

const apiUrl = 'https://test.faros.ai';

describe('axios', () => {
  const logger = pino({
    name: 'faros-client',
    prettyPrint: {levelFirst: true, translateTime: true, ignore: 'pid,hostname'}
  });
  test('get resource with retry', async () => {
    const mock = nock(apiUrl)
      .get('/hi')
      .reply(502)
      .get('/hi')
      .reply(502)
      .get('/hi')
      .reply(502)
      .get('/hi')
      .reply(200, {tenantId: '1'});
    const client = makeAxiosInstanceWithRetry(
      {baseURL: apiUrl},
      logger,
      3,
      100
    );
    const res = await client.get('/hi');
    expect(res.status).toBe(200);
    expect(res.data).toStrictEqual({tenantId: '1'});
    mock.done();
  });
  test('give up after a retry', async () => {
    const mock = nock(apiUrl).get('/hi').reply(502).get('/hi').reply(404);
    const client = makeAxiosInstanceWithRetry(
      {baseURL: apiUrl},
      logger,
      1,
      100
    );
    await expect(client.get('/hi')).rejects.toThrowError(
      'Request failed with status code 404'
    );
    mock.done();
  });
});
