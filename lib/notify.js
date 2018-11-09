const RSVP = require('rsvp');
const CoreObject = require('core-object');
const request = require('request');
const merge = require('lodash/merge');

function optsValid(opts) {
  return opts.url && opts.headers && opts.method && opts.body;
}

module.exports = CoreObject.extend({
  init(options) {
    this._plugin = options.plugin;

    this._client = this._plugin.readConfig('httpClient') || request;
  },

  _defaults() {
    return {
      method: 'POST',
      headers: {},
      json: true
    };
  },

  send(serviceKey, opts = {}) {
    let plugin = this._plugin;
    let makeRequest = RSVP.denodeify(this._client);
    let critical = (('critical' in opts) ? delete opts.critical : false);

    let requestOpts = merge(this._defaults(), opts);

    if (optsValid(requestOpts)) {
      return makeRequest(requestOpts)
        .then(function(response) {
          let body = '';

          if (response && response.body) {
            body = response.body;
          }

          if (typeof body !== 'string') {
            body = JSON.stringify(body);
          }

          if (critical && !(response.statusCode < 300 && response.statusCode >= 200)) {
            return RSVP.reject(response.statusCode);
          }

          plugin.log(`${serviceKey} => ${body}`);
        })
        .catch(function(error) {
          let errorMessage = `${serviceKey} => ${error}`;

          if (critical) {
            return RSVP.reject(error);
          }
          plugin.log(errorMessage, { color: 'red' });
        });
    } else {
      let warningMessage = 'No request issued! Request options invalid! You have to specify `url`, `headers`, `method` and `body`.';

      if (critical) {
        return RSVP.reject(warningMessage);
      }
      plugin.log(`${serviceKey} => ${warningMessage}`, { color: 'yellow', verbose: true });
      return RSVP.resolve();
    }
  }
});
