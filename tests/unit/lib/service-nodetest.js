const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

const assert = chai.assert;

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

    describe('http-authentication', function() {
      it('users can pass the auth property', function() {
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
          auth: {
            user: 'tomster',
            pass: 'ember'
          }
        };

        var service = new Service({defaults: defaults, user: user});

        var serviceCallOpts = service.buildServiceCall();

        var expected = {
          url: 'url',
          method: 'POST',
          headers: {},
          auth: {
            user: 'tomster',
            pass: 'ember'
          },
          body: {
            apiKey: 'api-key'
          }
        };

        assert.deepEqual(serviceCallOpts, expected);
      });

      it('behaves like any configurable and can use a function for configuration', function() {
        var defaults = {
          url: 'url',
          method: 'POST',
          headers: {},
          auth: function() {
            return {
              user: this.username,
              pass: this.password
            }
          },
          apiKey: 'api-key',
          body: function() {
            return {
              apiKey: this.apiKey
            }
          }
        };

        var user = {
          username: 'tomster',
          password: 'ember'
        };

        var service = new Service({defaults: defaults, user: user});

        var serviceCallOpts = service.buildServiceCall();

        var expected = {
          url: 'url',
          method: 'POST',
          headers: {},
          auth: {
            user: 'tomster',
            pass: 'ember'
          },
          body: {
            apiKey: 'api-key'
          }
        };

        assert.deepEqual(serviceCallOpts, expected);

      });
    });

    describe('critical-webhook', function() {
      it('hook can be set as critical', function() {
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

        var user = { critical: true };

        var service = new Service({defaults: defaults, user: user});

        var serviceCallOpts = service.buildServiceCall();

        var expected = {
          url: 'url',
          method: 'POST',
          headers: {},
          critical: true,
          body: {
            apiKey: 'api-key'
          }
        };

        assert.deepEqual(serviceCallOpts, expected);
      });

      it('behaves like any configurable and can use a function for configuration', function() {
        var defaults = {
          url: 'url',
          method: 'POST',
          headers: {},
          critical: function() {
            return this.isCritical;
          },
          apiKey: 'api-key',
          body: function() {
            return {
              apiKey: this.apiKey
            }
          }
        };

        var user = { isCritical: true};

        var service = new Service({defaults: defaults, user: user});

        var serviceCallOpts = service.buildServiceCall();

        var expected = {
          url: 'url',
          method: 'POST',
          headers: {},
          critical: true,
          body: {
            apiKey: 'api-key'
          }
        };

        assert.deepEqual(serviceCallOpts, expected);

      });
    });
  });
});
