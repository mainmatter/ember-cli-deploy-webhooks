const CoreObject = require('core-object');
const merge = require('lodash/object/merge');
const mapValues = require('lodash/object/mapValues');
const pick = require('lodash/object/pick');

module.exports = CoreObject.extend({
  init(options) {
    this.serviceOptions = merge(options.defaults, options.user, options.hook || {});
  },

  buildServiceCall(context) {
    let opts = mapValues(this.serviceOptions, function(value) {
      return typeof value === 'function' ? value.bind(this.serviceOptions)(context) : value;
    }.bind(this));

    return pick(opts, ['url', 'method', 'headers', 'body', 'auth', 'critical']);
  }
});
