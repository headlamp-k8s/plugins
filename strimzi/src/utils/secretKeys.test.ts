import { isSecretLikeKey } from './secretKeys';

describe('isSecretLikeKey', () => {
  it.each([
    'database.password',
    'connection.password',
    'aws.secret.access.key',
    'aws.access.key.id',
    'oauth.token',
    'auth.bearer.token',
    'consumer.client.secret',
    'kafka.credential',
    'apiKey',
    'api_key',
    'api-key',
    'privateKey',
    'private-key',
    'signing.key',
  ])('flags %s as secret-like', key => {
    expect(isSecretLikeKey(key)).toBe(true);
  });

  it.each([
    'database.hostname',
    'database.dbname',
    'topic.prefix',
    'topics',
    's3.bucket.name',
    'transforms',
    'tasks.max',
    'connector.class',
  ])('does not flag %s', key => {
    expect(isSecretLikeKey(key)).toBe(false);
  });
});
