var assert = require('ember-cli/tests/helpers/assert');
var nock = require('nock');


describe('Notify', function() {
  var Notify, subject, scope, mockUi, plugin, url;

  before(function() {
    Notify = require('../../../lib/notify');
  });

  beforeEach(function() {
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
        this.ui.write('|    ');
        this.ui.writeLine('- ' + message);
      }
    };

    scope = nock('http://notify.bugsnag.com')
      .post('/deploy', {
        apiKey: '12341234'
      })
      .reply(200, 'OK')
      .post('/deploy', {})
      .replyWithError(401, 'Bad Request');
  });

  describe('#send', function() {
    beforeEach(function() {
      url = 'http://notify.bugsnag.com/deploy';
      subject = new Notify({
        plugin: plugin
      });
    });

    it('calls the correct url', function() {
      var data = { apiKey: '12341234' };

      var promise = subject.send(url, data);

      return assert.isFulfilled(promise);
    });

    it('rejects when the request fails', function() {
      var promise = subject.send(url);

      return assert.isRejected(promise);
    });

    it('logs when a success was successful', function() {
      var data = { apiKey: '12341234' };

      var promise = subject.send(url, data);

      return assert.isFulfilled(promise)
        .then(function() {
          var messages = mockUi.messages;

          assert.isAbove(messages.length, 0);
          assert.equal(messages[0], '- '+url+' => OK');
        });
    });
  });
});
