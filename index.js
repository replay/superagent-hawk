var hawk = require('hawk');
var extend = require('./lib/extend');

exports =
module.exports = function addHawk (superagent) {
  superagent.Request.prototype.hawk = function(credentials, moreOptions) {
    var url = this.url;
    var method = this.method;

    var options = {
      credentials: credentials,
      contentType: this.header['Content-Type'],
      payload: this._data
    };

    if (options && typeof options == 'object')
      options = extend(options, moreOptions);

    this.set('Authorization',
      hawk.client.header(url, method, options).field);

    return this;
  };

  superagent.Request.prototype.bewit = function(bewit) {
    this.query({ bewit: bewit });
    return this;
  };

  return superagent;
};