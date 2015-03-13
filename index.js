var hawk = require('hawk');
var extend = require('./lib/extend');
var qs = require('qs');

exports =
module.exports = function (superagent) {
  var Request = superagent.Request;

  Request.prototype.hawk = function (credential, options) {
    this._enable_hawk_signing = true;
    this._hawk_credential = credential;
    this._hawk_options = options;

    return this;
  }

  Request.prototype._do_hawk_sign = function () {
    var contentType;
    var querystring = qs.stringify(this.qs);
    var method = this.method;
    var url = this.url;
    url += querystring.length
      ? '?' + querystring
      : '';

    if (this.getHeader && this.getHeader instanceof Function)
      contentType = this.getHeader('content-type');
    else if (this.get && this.get instanceof Function)
      contentType = this.get('content-type');

    var isJSON = this._data &&
                 this._data instanceof Object &&
                 contentType === 'application/json';

    var data = (isJSON) ? JSON.stringify(this._data) : this._data;

    var options = {
      credentials: this._hawk_credential,
      contentType: contentType,
      payload: data
    };

    if (options && typeof options == 'object')
      options = extend(options, this._hawk_options);

    if ('verifyResponse' in options && options['verifyResponse'])
      this._enable_hawk_response_verification = true;

    var hawk_header = hawk.client.header(url, method, options);

    this.set('Authorization', hawk_header.field);

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

  var oldEnd = Request.prototype.end;

  Request.prototype.end = function (response_handler) {
    this.end = oldEnd;

    if (this._enable_hawk_signing) {
      var artifacts = this._do_hawk_sign();

      if (this._enable_hawk_response_verification) {
        var hawk_credential = this._hawk_credential;
        var wrapped_response_handler = function(result) {
          verify_hawk_response(result, hawk_credential, artifacts);
          return response_handler(result);
        }
        return this.end(wrapped_response_handler);
      } else {
        return this.end(response_handler);
      }
    }
  };

  Request.prototype.bewit = function(bewit) {
    this.query({ bewit: bewit });
    return this;
  };
}
