const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
const nock = require('nock');

chai.use(chaiAsPromised);

const assert = chai.assert;

describe('Notify', function() {
  var Notify, subject, mock_request, mock_request_bad_url, mockUi, plugin, url, serviceKey;

  before(function() {
    Notify = require('../../../lib/notify');
  });

  beforeEach(function() {
    serviceKey = 'test';

    mockUi = {
      messages: [],
      write: function() {},
      writeLine: function(message) {
        this.messages.push(message);
      }
    };
    plugin = {
      ui: mockUi,
      readConfig: function(propertyName) {
        if (propertyName === 'httpClient') {
          return undefined;
        }
      },
      log: function(message, opts) {
        opts = opts || {};

        if (!opts.verbose || (opts.verbose && this.ui.verbose)) {
          this.ui.write('|    ');
          this.ui.writeLine('- ' + message);
        }
      }
    };

    mock_request = nock('http://notify.bugsnag.com')
      .post('/deploy', {
        apiKey: '1234'
      })
      .reply(200, 'OK')
      .post('/deploy', {
        apiKey: '4321'
      })
      .reply(200, { status: 'OK' })
      .post('/deploy', {
        apiKey: '4321',
        bar: 'foo'
      })
      .reply(500, { status: 'Internal Server Error' });

      mock_request_bad_url = nock('http://notify.bugsnag.comm')
        .post('/deploy', {})
        .replyWithError('Timeout');
  });

  describe('#send', function() {
    beforeEach(function() {
      url = 'http://notify.bugsnag.com/deploy';
      bad_url = 'http://notify.bugsnag.comm/deploy';
      subject = new Notify({
        plugin: plugin
      });
    });

    describe('does not issue requests when `url`,`method`, `headers` or `body` is falsy in opts', function() {
      it('logs to the console when one of the properties is missing (verbose logging)', function() {
        mockUi.verbose = true;

        var promise = subject.send(serviceKey, {
          url: url
        });

        return assert.isFulfilled(promise)
          .then(function() {
            var messages = mockUi.messages;

            assert.isAbove(messages.length, 0);
            assert.equal(messages[0], '- '+serviceKey+' => No request issued! Request options invalid! You have to specify `url`, `headers`, `method` and `body`.');
          });
      });

      it('resolves immediately when no body is specified', function() {
        var promise = subject.send(serviceKey, {
          url: '/fubar'
        });

        return assert.isFulfilled(promise);
      });

      it('resolves immediately when no url is specified', function() {
        var promise = subject.send(serviceKey, {
          body: {
            apiKey: '1234'
          }
        });

        return assert.isFulfilled(promise);
      });

      it('resolves immediately when `body` is false', function() {
        var promise = subject.send(serviceKey, {
          url: false,
          body: {
            apiKey: '1234'
          }
        });

        return assert.isFulfilled(promise);
      });

      it('resolves immediately when `body` is false', function() {
        var promise = subject.send(serviceKey, {
          url: '/fubar',
          body: false
        });

        return assert.isFulfilled(promise);
      });

      it('resolves immediately when `headers` is false', function() {
        var promise = subject.send(serviceKey, {
          url: '/fubar',
          body: {
            apiKey: '1234'
          },
          headers: false
        });

        return assert.isFulfilled(promise);
      });

      it('resolves immediately when `method` is false', function() {
        var promise = subject.send(serviceKey, {
          url: '/fubar',
          body: {
            apiKey: '1234'
          },
          method: false
        });

        return assert.isFulfilled(promise);
      });
    });

    it('calls the correct url', function() {
      var data = { apiKey: '1234' };

      var opts = {
        url: url,
        body: data
      }

      var promise = subject.send(serviceKey, opts);

      return assert.isFulfilled(promise);
    });

    it('logs when a request was successful', function() {
      var data = { apiKey: '1234' };

      var opts = {
        url: url,
        body: data
      }

      var promise = subject.send(serviceKey, opts);

      return assert.isFulfilled(promise)
        .then(function() {
          var messages = mockUi.messages;

          assert.isAbove(messages.length, 0);
          assert.equal(messages[0], '- '+serviceKey+' => OK');
        });
    });

    it('logs when a request is an object', function() {
      var data = { apiKey: '4321' };

      var opts = {
        url: url,
        body: data
      }

      var promise = subject.send(serviceKey, opts);

      return assert.isFulfilled(promise)
        .then(function() {
          var messages = mockUi.messages;

          assert.isAbove(messages.length, 0);
          assert.equal(messages[0], '- '+serviceKey+' => {"status":"OK"}');
        });
    });

    it('logs when a request was successful and critical is true', function() {
      var opts = {
        url: url,
        body: { apiKey: '4321' },
        critical: true
      }

      var promise = subject.send(serviceKey, opts);

      return assert.isFulfilled(promise)
        .then(function() {
          var messages = mockUi.messages;

          assert.isAbove(messages.length, 0);
          assert.equal(messages[0], '- '+serviceKey+' => {"status":"OK"}');
        });
    });

    describe('when request fails', function() {
      it('resolves when the request fails', function() {
        var promise = subject.send(serviceKey, {
          url: bad_url,
          body: {}
        });

        return assert.isFulfilled(promise);
      });

      it('logs to the console', function() {
        var promise = subject.send(serviceKey, {
          url: bad_url,
          body: {}
        });

        return assert.isFulfilled(promise)
          .then(function() {
            var messages = mockUi.messages;

            assert.isAbove(messages.length, 0);
            assert.equal(messages[0], '- '+serviceKey+' => Error: Timeout');
          });
      });
    });

    describe('when request fails and critical is true', function() {
      it('reject when the request fails', function() {
        var promise = subject.send(serviceKey, {
          url: bad_url,
          body: {},
          critical: true
        });
        return assert.isRejected(promise);
      });

      it('reject when the status code is not 2xx', function() {
        var promise = subject.send(serviceKey, {
          url: url,
          body: {
            apiKey: '4321',
            bar: 'foo'
          },
          critical: true
        });

        return assert.isRejected(promise);
      });
    });
  });
});
