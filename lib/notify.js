var Promise    = require('ember-cli/lib/ext/promise');
var CoreObject = require('core-object')
var request    = require('request');

var post = Promise.denodeify(request.post);

module.exports = CoreObject.extend({
  init: function(options) {
    this._plugin = options.plugin;

    this._client = this._plugin.readConfig('httpClient') || request;
  },

  send: function(url, data) {
    var post       = Promise.denodeify(this._client.post);
    var dataToSend = data || {};

    return post(url, { form: dataToSend })
      .then(function(response) {
        var plugin = this._plugin;
        var body = '';

        if (response && response.body) {
          body = response.body;
        }

        plugin.log(url + ' => ' + body);
      }.bind(this));
  }
});
