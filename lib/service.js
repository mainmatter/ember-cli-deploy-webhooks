var CoreObject = require('core-object');
var merge = require('lodash/object/merge');
var mapValues = require('lodash/object/mapValues');
var pick = require('lodash/object/pick');

module.exports = CoreObject.extend({
  init: function(options) {
    this.serviceOptions = merge(options.defaults, options.user, options.hook || {});
  },

  buildServiceCall: function(context) {
    var opts = mapValues(this.serviceOptions, function(value) {
      return typeof value === 'function' ? value.bind(this.serviceOptions)(context) : value;
    }.bind(this));

    return pick(opts, ['url', 'method', 'headers', 'body']);
  }
});
