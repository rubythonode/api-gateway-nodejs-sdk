'use strict';

const format = require('url').format;
const httpx = require('httpx');

const Base = require('./base');

/**
 * API Gateway Simple client that use appcode
 */
class SimpleClient extends Base {
  constructor(appcode) {
    super();
    this.appcode = appcode;
  }

  * request(method, url, opts) {
    var options = {
      method: method,
      headers: {
        'authorization': 'APPCODE ' + this.appcode
      },
      data: opts.data,
      beforeRequest: function (opts) {
        // FIXME: 证书有问题
        opts.rejectUnauthorized = false;
        return opts;
      }
    };

    var response = yield httpx.request(url, options);

    var headers = response.headers;
    var code = response.statusCode;
    if (code !== 200) {
      var err = new Error(`${method} '${format(url)}' failed width code(${code}).` +
        ` request id: ${headers['x-ca-request-id']},` +
        ` error message: ${headers['x-ca-error-message']}`);
      throw err;
    }

    var result = yield httpx.read(response, 'utf8');
    var contentType = response.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      try {
        result = JSON.parse(result);
      } catch (ex) {
        ex.message = `${method} ${format(url)} failed. ` + ex.message;
        ex.data = result;
        throw ex;
      }
    }
    return result;
  }
}

module.exports = SimpleClient;
