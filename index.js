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
    var contentType;
    var host;
    /*var querystring = qs.stringify(this.qs);*/
    var method = this.method;
    //var url = this.path;
    /*url += querystring.length
      ? '?' + querystring
      : '';*/

    if (this.getHeader && this.getHeader instanceof Function) {
      contentType = this.getHeader('content-type');
      host = this.getHeader('host');
    }
    else if (this.get && this.get instanceof Function) {
      contentType = this.get('content-type');
      host = this.get('host');
    }

    var url = host + '/' + this.path;

    var isJSON = data &&
                 data instanceof Object &&
                 contentType === 'application/json';

    var data = (isJSON) ? JSON.stringify(data) : data;

    var options = {
      credentials: this._hawk_credential,
      contentType: contentType,
      payload: data
    };

    if (options && typeof options == 'object')
      options = extend(options, this._hawk_options);

    if ('verifyResponse' in options && options['verifyResponse'])
      this._enable_hawk_response_verification = true;

    //debugger;
    var hawk_header = hawk.client.header(url, method, options);

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

  RequestProto.request = function() {

    var req =  oldRequest.apply(this, arguments);
    if (req.has_hawk || !this._enable_hawk_signing)
      return req;

    var oldEnd = req.end;
    req._hawk_credential = this._hawk_credential;
    //var enable_hawk_response_verification = this._enable_hawk_response_verification;
    req._hawk_options = this._hawk_options;
    req._do_hawk_sign = do_hawk_sign;

    req.end = function(data) {
      this.end = oldEnd;
      var artifacts = this._do_hawk_sign();

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
      return oldEnd.apply(this, arguments);
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
