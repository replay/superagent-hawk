var hawk = require('hawk');
var extend = require('./lib/extend');
var qs = require('qs');

exports =
module.exports = function (superagent) {
  var RequestProto = superagent.Test
                      ? superagent.Test.prototype
                      : superagent.Request.prototype;

  RequestProto.hawk = function (credential, options) {
    this._enable_hawk_signing = true;
    this._hawk_credential = credential;
    this._hawk_options = options;

    return this;
  }

  var do_hawk_sign = function (data) {
    var params = this._hawk_parameters;
    var isJSON = data &&
                 data instanceof Object &&
                 params['content_type'] === 'application/json';
    var data = (isJSON) ? JSON.stringify(data) : data;

    var options = {
      credentials: params['hawk_credential'],
      contentType: params['content_type'],
      payload: data
    };

    if (options && typeof options == 'object')
      options = extend(options, params['hawk_options']);

    if ('verifyResponse' in options && options['verifyResponse'])
      this._enable_hawk_response_verification = true;

    var hawk_header = hawk.client.header(
      params['url'],
      params['method'],
      options
    );

    this.setHeader('Authorization', hawk_header.field);

    return hawk_header.artifacts;
  };

  var verify_hawk_response = function(result, credential, artifacts) {
    var hawk_options = {
      payload: result.res.text,
      required: true
    }

    var verified =  hawk.client.authenticate(
        result,
        credential,
        artifacts,
        hawk_options);

    if (!verified) {
      result.error = new Error(
          'Hawk response signature verification failed');
    }
  }

  var oldRequest = RequestProto.request;

  RequestProto.hawk_parameters = function() {
    return {
      url: this.url,
      method: this.method,
      hawk_credential: this._hawk_credential,
      hawk_options: this._hawk_options,
      content_type: this.req.getHeader('content-type')
    }
  }

  RequestProto.request = function() {

    var req =  oldRequest.apply(this, arguments);
    req._hawk_parameters = this.hawk_parameters();

    if (req.has_hawk || !this._enable_hawk_signing)
      return req;

    req._do_hawk_sign = do_hawk_sign;
    var oldEnd = req.end;

    req.end = function(data) {
      var artifacts = this._do_hawk_sign(data);

      var response = oldEnd.apply(this, arguments);

      /*if (enable_hawk_response_verification) {
        var hawk_credential = hawk_credential;
        var wrapped_response_handler = function(err, res) {
          verify_hawk_response(res, hawk_credential, artifacts);
          if (2 == response_handler.length) return response_handler(err, res);
          if (err) return this.emit('error', err);
          return response_handler(res);
        }
        return this.end(wrapped_response_handler);
      }*/

      return response
    }

    req.has_hawk = true;
    return req;
  };

  RequestProto.bewit = function(bewit) {
    this.query({ bewit: bewit });
    return this;
  };

  return superagent;
}
