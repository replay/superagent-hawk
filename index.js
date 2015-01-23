var hawk = require('hawk');
var extend = require('./lib/extend');
var qs = require('qs');

exports =
module.exports = function addHawk (superagent) {
  var RequestProto = superagent.Test
                      ? superagent.Test.prototype
                      : superagent.Request.prototype;

  RequestProto.hawk = function(credential, moreOptions) {
    var url = this.url;
    var method = this.method;
    var querystring = qs.stringify(this.qs);

    url += querystring.length
      ? '?' + querystring
      : '';

    var contentType;
    if (this.getHeader && this.getHeader instanceof Function)
      contentType = this.getHeader('content-type');
    else if (this.get && this.get instanceof Function)
      contentType = this.get('content-type');

    var isJSON = this._data &&
                 this._data instanceof Object &&
                 contentType === 'application/json';

    var data = (isJSON) ? JSON.stringify(this._data) : this._data;

    var options = {
      credentials: credential,
      contentType: contentType,
      payload: data
    };

    if (options && typeof options == 'object')
      options = extend(options, moreOptions);

    var hawk_header = hawk.client.header(url, method, options);

    this.set('Authorization', hawk_header.field);

    /*
     * wraps this.end() into a wrapper function. the wrapper function wraps
     * the end handler that gets passed to this.end() into another function
     * that first verifies responses before calling the end handler that has
     * been passed.
     * afterwards the result of the verification can be retrieved inside the
     * end handler from:
     *
     *    this.is_response_verified
     */
    this.original_end = this.end;

    this.end = function (end_handler) {

      var wrapped_end_handler = function (result) {
        var options = {
          payload: this.r.res.text,
          required: true
        }

        this.is_response_verified =  hawk.client.authenticate(
            this.r.response,
            credential,
            hawk_header.artifacts,
            options);

        return end_handler(result);
      };
      this.original_end(wrapped_end_handler);
    }

    return this;
  };

  RequestProto.bewit = function(bewit) {
    this.query({ bewit: bewit });
    return this;
  };

  return superagent;
};
