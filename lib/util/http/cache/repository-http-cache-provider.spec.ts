import { Http } from '..';
import { resetCache } from '../../cache/repository';
import { repoCacheProvider } from './repository-http-cache-provider';
import * as httpMock from '~test/http-mock';

describe('util/http/cache/repository-http-cache-provider', () => {
  beforeEach(() => {
    resetCache();
  });

  const http = new Http('test', {
    cacheProvider: repoCacheProvider,
  });

  it('reuses data with etag', async () => {
    const scope = httpMock.scope('https://example.com');

    scope.get('/foo/bar').reply(200, { msg: 'Hello, world!' }, { etag: '123' });
    const res1 = await http.getJsonUnchecked('https://example.com/foo/bar');
    expect(res1).toMatchObject({
      statusCode: 200,
      body: { msg: 'Hello, world!' },
      authorization: false,
    });

    scope.get('/foo/bar').reply(304);
    const res2 = await http.getJsonUnchecked('https://example.com/foo/bar');
    expect(res2).toMatchObject({
      statusCode: 200,
      body: { msg: 'Hello, world!' },
      authorization: false,
    });
  });

  it('reuses data with last-modified', async () => {
    const scope = httpMock.scope('https://example.com');

    scope
      .get('/foo/bar')
      .reply(
        200,
        { msg: 'Hello, world!' },
        { 'last-modified': 'Mon, 01 Jan 2000 00:00:00 GMT' },
      );
    const res1 = await http.getJsonUnchecked('https://example.com/foo/bar');
    expect(res1).toMatchObject({
      statusCode: 200,
      body: { msg: 'Hello, world!' },
      authorization: false,
    });

    scope.get('/foo/bar').reply(304);
    const res2 = await http.getJsonUnchecked('https://example.com/foo/bar');
    expect(res2).toMatchObject({
      statusCode: 200,
      body: { msg: 'Hello, world!' },
      authorization: false,
    });
  });

  it('handles abrupt cache reset', async () => {
    const scope = httpMock.scope('https://example.com');

    scope.get('/foo/bar').reply(200, { msg: 'Hello, world!' }, { etag: '123' });
    const res1 = await http.getJsonUnchecked('https://example.com/foo/bar');
    expect(res1).toMatchObject({
      statusCode: 200,
      body: { msg: 'Hello, world!' },
      authorization: false,
    });

    resetCache();

    scope.get('/foo/bar').reply(304);
    const res2 = await http.getJsonUnchecked('https://example.com/foo/bar');
    expect(res2).toMatchObject({
      statusCode: 304,
      authorization: false,
    });
  });

  it('bypasses for statuses other than 200 and 304', async () => {
    const scope = httpMock.scope('https://example.com');
    scope.get('/foo/bar').reply(203);

    const res = await http.getJsonUnchecked('https://example.com/foo/bar');

    expect(res).toMatchObject({
      statusCode: 203,
      authorization: false,
    });
  });

  it('supports authorization', async () => {
    const scope = httpMock.scope('https://example.com');

    scope.get('/foo/bar').reply(200, { msg: 'Hello, world!' }, { etag: '123' });
    const res1 = await http.getJsonUnchecked('https://example.com/foo/bar', {
      headers: { authorization: 'Bearer 123' },
    });
    expect(res1).toMatchObject({
      statusCode: 200,
      body: { msg: 'Hello, world!' },
      authorization: true,
    });

    scope.get('/foo/bar').reply(304);
    const res2 = await http.getJsonUnchecked('https://example.com/foo/bar', {
      headers: { authorization: 'Bearer 123' },
    });
    expect(res2).toMatchObject({
      statusCode: 200,
      body: { msg: 'Hello, world!' },
      authorization: true,
    });
  });
});
