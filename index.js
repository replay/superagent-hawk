var request = require('superagent');
var hawk = require('hawk');
var extend = require('./lib/extend');

request.Request.prototype.hawk = function(credentials, moreOptions) {
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

request.Request.prototype.bewit = function(bewit) {
  this.query({ bewit: bewit });
  return this;
};

module.exports = request;