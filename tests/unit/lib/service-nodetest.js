const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const assert = chai.assert;

describe('Service', function() {
  let Service;

  before(function() {
    Service = require('../../../lib/service'); // eslint-disable-line node/no-missing-require
  });

  it('exists', function() {
    assert.ok(Service);
  });

  describe('#buildServiceCall', function() {
    it('can use functions that will be evaluated to create config', function() {
      let defaults = {
        url: 'url',
        method: 'POST',
        headers: {},
        apiKey: 'api-key',
        body() {
          return {
            apiKey: this.apiKey
          };
        }
      };

      let user = {};

      let service = new Service({ defaults, user });

      let serviceCallOpts = service.buildServiceCall();

      let expected = {
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
      let defaults = {
        url: 'url',
        method: 'POST',
        headers: {},
        apiKey: 'api-key',
        body() {
          return {
            apiKey: this.apiKey
          };
        }
      };

      let user = {
        apiKey: 'custom'
      };

      let service = new Service({ defaults, user });

      let serviceCallOpts = service.buildServiceCall();

      let expected = {
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
      let defaults = {
        url: 'url',
        method: 'POST',
        headers: {},
        apiKey: 'api-key',
        body() {
          return {
            apiKey: this.apiKey
          };
        }
      };

      let user = {
        body(context) {
          return {
            apiKey: context.apiKey
          };
        }
      };

      let context = {
        apiKey: 'context'
      };

      let service = new Service({ defaults, user });

      let serviceCallOpts = service.buildServiceCall(context);

      let expected = {
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
      let defaults = {
        url: 'url',
        method: 'POST',
        headers: {},
        apiKey: 'api-key',
        body() {
          return {
            apiKey: this.apiKey
          };
        }
      };

      let user = {
        url: 'lol',

        didActivate: {
          url: 'didActivate'
        }
      };

      let service = new Service({
        defaults,
        user,
        hook: user.didActivate
      });

      let serviceCallOpts = service.buildServiceCall(context);

      let expected = {
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
        let defaults = {
          url: 'url',
          method: 'POST',
          headers: {},
          apiKey: 'api-key',
          body() {
            return {
              apiKey: this.apiKey
            };
          }
        };

        let user = {
          auth: {
            user: 'tomster',
            pass: 'ember'
          }
        };

        let service = new Service({ defaults, user });

        let serviceCallOpts = service.buildServiceCall();

        let expected = {
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
        let defaults = {
          url: 'url',
          method: 'POST',
          headers: {},
          auth() {
            return {
              user: this.username,
              pass: this.password
            };
          },
          apiKey: 'api-key',
          body() {
            return {
              apiKey: this.apiKey
            };
          }
        };

        let user = {
          username: 'tomster',
          password: 'ember'
        };

        let service = new Service({ defaults, user });

        let serviceCallOpts = service.buildServiceCall();

        let expected = {
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
        let defaults = {
          url: 'url',
          method: 'POST',
          headers: {},
          apiKey: 'api-key',
          body() {
            return {
              apiKey: this.apiKey
            };
          }
        };

        let user = { critical: true };

        let service = new Service({ defaults, user });

        let serviceCallOpts = service.buildServiceCall();

        let expected = {
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
        let defaults = {
          url: 'url',
          method: 'POST',
          headers: {},
          critical() {
            return this.isCritical;
          },
          apiKey: 'api-key',
          body() {
            return {
              apiKey: this.apiKey
            };
          }
        };

        let user = { isCritical: true };

        let service = new Service({ defaults, user });

        let serviceCallOpts = service.buildServiceCall();

        let expected = {
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
