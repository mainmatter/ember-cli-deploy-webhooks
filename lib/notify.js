var RSVP       = require('rsvp');
var CoreObject = require('core-object');
var request    = require('request');
var merge      = require('lodash/object/merge');

var post = RSVP.denodeify(request.post);

function optsValid(opts) {
  return opts.url && opts.headers && opts.method && opts.body;
}

module.exports = CoreObject.extend({
  init: function(options) {
    this._plugin = options.plugin;

    this._client = this._plugin.readConfig('httpClient') || request;
  },

  _defaults: function() {
    return {
      method: 'POST',
      headers: {},
      json: true
    }
  },

  send: function(serviceKey, opts) {
    var opts        = opts || {};
    var plugin      = this._plugin;
    var makeRequest = RSVP.denodeify(this._client);
    var critical = (('critical' in opts) ? delete opts.critical : false);

    var requestOpts = merge(this._defaults(), opts);

    if (optsValid(requestOpts)) {
      return makeRequest(requestOpts)
        .then(function(response) {
          var body = '';

          if (response && response.body) {
            body = response.body;
          }

          if (typeof body !== 'string') {
            body = JSON.stringify(body);
          }

          if (critical && !(300 > response.statusCode && response.statusCode >= 200)) {
            return RSVP.reject(response.statusCode);
          }

          plugin.log(serviceKey + ' => ' + body);
        }.bind(this))
        .catch(function(error) {
          var errorMessage = serviceKey + ' => ' + error;

          if (critical) {
            return RSVP.reject(error);
          }
          plugin.log(errorMessage, { color: 'red' });
        });
    } else {
      var warningMessage = 'No request issued! Request options invalid! You have to specify `url`, `headers`, `method` and `body`.';

      if (critical) {
        return RSVP.reject(warningMessage);
      }
      plugin.log(serviceKey+' => '+warningMessage, { color: 'yellow', verbose: true });
      return RSVP.resolve();
    }
  }
});
