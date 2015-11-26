var assert = require('ember-cli/tests/helpers/assert');

describe('Service', function() {
  var Service;

  before(function() {
    Service = require('../../../lib/service');
  });

  it('exists', function() {
    assert.ok(Service);
  });

  describe('#buildServiceCall', function() {
    it('can use functions that will be evaluated to create config', function() {
      var defaults = {
        url: 'url',
        method: 'POST',
        headers: {},
        apiKey: 'api-key',
        body: function() {
          return {
            apiKey: this.apiKey
          }
        }
      };

      var user = {};

      var service = new Service({defaults: defaults, user: user});

      var serviceCallOpts = service.buildServiceCall();

      var expected = {
        url: 'url',
        method: 'POST',
        headers: {},
        body: {
          apiKey: 'api-key'
        }
      };

      assert.deepEqual(serviceCallOpts, expected);
    });

    it('options are overridable by user config', function() {
      var defaults = {
        url: 'url',
        method: 'POST',
        headers: {},
        apiKey: 'api-key',
        body: function() {
          return {
            apiKey: this.apiKey
          }
        }
      };

      var user = {
        apiKey: 'custom'
      };

      var service = new Service({defaults: defaults, user: user});

      var serviceCallOpts = service.buildServiceCall();

      var expected = {
        url: 'url',
        method: 'POST',
        headers: {},
        body: {
          apiKey: 'custom'
        }
      };

      assert.deepEqual(serviceCallOpts, expected);
    });

    it('calls functions in options with a context that gets passed in', function() {
      var defaults = {
        url: 'url',
        method: 'POST',
        headers: {},
        apiKey: 'api-key',
        body: function() {
          return {
            apiKey: this.apiKey
          }
        }
      };

      var user = {
        body: function(context) {
          return {
            apiKey: context.apiKey
          }
        }
      };

      var context = {
        apiKey: 'context'
      };

      var service = new Service({defaults: defaults, user: user});

      var serviceCallOpts = service.buildServiceCall(context);

      var expected = {
        url: 'url',
        method: 'POST',
        headers: {},
        body: {
          apiKey: 'context'
        }
      };

      assert.deepEqual(serviceCallOpts, expected);
    });

    it('can override options by passing specific properties (named like deploy hooks)', function() {
      var defaults = {
        url: 'url',
        method: 'POST',
        headers: {},
        apiKey: 'api-key',
        body: function() {
          return {
            apiKey: this.apiKey
          }
        }
      };

      var user = {
        url: 'lol',

        didActivate: {
          url: 'didActivate'
        }
      };

      var service = new Service({
        defaults: defaults,
        user: user,
        hook: user.didActivate
      });

      var serviceCallOpts = service.buildServiceCall(context);

      var expected = {
        url: 'didActivate',
        method: 'POST',
        headers: {},
        body: {
          apiKey: 'api-key'
        }
      };

      assert.deepEqual(serviceCallOpts, expected);
    });
  });
});
