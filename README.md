# ember-cli-deploy-webhooks [![Build Status](https://travis-ci.org/simplabs/ember-cli-deploy-webhooks.svg)](https://travis-ci.org/simplabs/ember-cli-deploy-webhooks)

> An ember-cli-deploy plugin to notify external services (e.g. an error
> tracking service) of successful hook executions in your deploy pipeline.

[![](https://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/plugins/ember-cli-deploy-webhooks.svg)](http://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/)

## What is an ember-cli-deploy plugin?

A plugin is an addon that can be executed as a part of the ember-cli-deploy pipeline. A plugin will implement one or more of the ember-cli-deploy's pipeline hooks.

For more information on what plugins are and how they work, please refer to the [Plugin Documentation][1].

## Quick Start

To get up and running quickly, do the following:

- Install this plugin

```bash
$ ember install ember-cli-deploy-webhooks
```
- Place the following configuration into `config/deploy.js`


```javascript
ENV.webhooks = {
  services: {
    "<some-key>": {
      url: <service-url>,
      headers: {
        // custom headers go here
      },
      method: '<http-method>', // defaults to 'POST'
      body: function(/*context*/) {
        // return any object that should be passed as request body here
        return {
          apiKey: <your-api-key>
        };
      },
      didActivate: true
    }
  }
}
```

- Run the pipeline

```bash
$ ember deploy
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation][1].

- `configure`
- `setup`

_Hooks that can be used for webhooks:_

- `willDeploy`
- `willBuild`
- `build`
- `didBuild`
- `willPrepare`
- `prepare`
- `didPrepare`
- `willUpload`
- `upload`
- `didUpload`
- `willActivate`
- `activate`
- `didActivate`
- `teardown`
- `fetchRevisions`
- `displayRevisions`
- `didFail`

## Configuration Options

For detailed information on how configuration of plugins works, please refer to the [Plugin Documentation][1].

### services

An object that identifies all webhooks you want to notify. You will put a key for every service you want to call on deploy here.

A `service` configuration needs to provide four properties as configuration for
`ember-cli-deploy-webhooks` to know how to notify the service correctly:

- `url` The url to call
- `method` The HTTP-method to use for the call (defaults to `'POST'`)
- `headers` A property to specify custom HTTP-headers (defaults to `{}`)
- `body` The body of the request
- `auth` used for http-authentication
- `critical` if true, webhook failures will abort deploy

`auth` should be a hash containing values:

* `user` || `username`
* `pass` || `password`

Bearer authentication is also supported. Please refer to
[request](https://github.com/request/request#http-authentication)'s docs for
more details as `ember-cli-deploy-webhooks` uses `request` internally.

<hr/>
**Whenever one of these properties (except `auth`) returns a _falsy_ value, the service will _not_ be
called.**
<hr/>

All these properties can return a value directly or can be implemented as
a function which returns the value for this property and gets called with the
deployment context. The `this` scope will be set to the service config object
itself.

*Example:*

```javascript
ENV.webhooks = {
  services: {
    slack: {
      webhookURL: '<your-webhook-url>',
      url: function() {
        return this.webhookURL;
      },
      method: 'POST',
      headers: {},
      body: function(context) {
        var deployer = context.deployer;

        return {
          text: deployer + ' deployed a new revision'
        }
      }
    }
  }
};
```

Additionally you have to specify on which hook to notify the service in the
deploy pipeline. To do this you can simply pass a truthy value as a property
named the same as the hook at which you want to notify the service. This can
als be used to override the defaults that you specify on a service.

*Example:*

```javascript
  ENV.webhooks = {
    services: {
      slack: {
        url: 'your-webhook-url',
        method: 'POST',
        headers: {},
        body: {
          text: 'A new revision was activated!'
        },
        didActivate: true
        didDeploy: {
          body: {
            text: 'Deployment successful!'
          }
        },
        didFail: {
          body: {
            text: 'Deployment failed!'
          }
        }
      }
    }
  };
```

There are two types of services you can specify in the `services` property:

a)  __preconfigured services__

Preconfigured services only need to be passed service specific configuration
options. This depends on the service (see below) but you can also provide all
other service configuration properties that were explained before to override
the defaults.

*Example:*

```javascript
ENV.webhooks = {
  services: {
    bugsnag: {
      url: 'https://bugsnag.simplabs.com/deploy',
      apiKey: '1234',
      didActivate: true
    }
  }
};
```

Preconfigured services aren't very special but maintainers and contributors
have already provided a base configuration that can be overridden by the
plugin users. This for example is basically the default implementation that is
already configured for the slack service:

```javascript
  ENV.webhooks.services = {
    // ...
    slack: {
      url: function() {
        return this.webhookURL;
      },
      method: 'POST',
      headers: {}
    }
  };
```

Users then only have to provide `webhookURL` and a `body`-property for the
hooks that should send a message to slack.

*Example:*

```javascript
  ENV.webhooks.services = {
    slack: {
      webhookURL: '<your-slack-webhook-url>',
      didActivate: {
        body: {
          text: 'A new revision was activated!'
        }
      }
    }
  };
```

Currently available preconfigured services are:

- `bugsnag` [An error-tracking service](https://bugsnag.com)
- `slack` [The popular messaging app](https://slack.com/)

#### bugsnag

To configure bugsnag you need to at least provide an `apiKey` and specify
a hook on which bugsnag should be notified of a deployment. You'll most likely
want to notify bugsnag of a deployment in the `didActivate`-hook as this is the
hook that actually makes a new version of your app available to your users.

*Example:*

```javascript
  ENV.webhooks.services = {
    bugsnag: {
      apiKey: '<your-api-key>',
      didActivate: true
    }
  };
```

__Required configuration__

- `apiKey` The api-key to send as part of the request payload (identifies the
  application)

__Default configuration__

```
  ENV.webhooks.services = {
    bugsnag: {
      url: 'http://notify.bugsnag.com/deploy',
      method: 'POST',
      headers: {},
      body: function() {
        var apiKey = this.apiKey;

        if (!apiKey) { return; }

        return {
          apiKey: this.apiKey,
          releaseStage: process.env.DEPLOY_TARGET
        }
      }
    }
  }
```

#### slack

*Example:*

```javascript
  ENV.webhooks.services = {
    slack: {
      webhookURL: '<your-slack-webhook-url>',
      didActivate: {
        body: {
          text: 'A new revision was activated!'
        }
      }
    }
  };
```

__Required configuration__

- `webhookURL` The [incoming webhook's](https://api.slack.com/incoming-webhooks)-url that should be called.

- `body` You need to provide a payload that gets send to slack. Please refer to
  the [documentation](https://api.slack.com/incoming-webhooks) on how message
payloads can be used to customize the appearance of a message in slack. At
least you have to provide a `text` property in the payload.

__Default configuration__

```javascript
  ENV.webhooks.services = {
    // ...
    slack: {
      url: function() {
        return this.webhookURL;
      },
      method: 'POST',
      headers: {}
    }
  };
```

b) __custom services__

Custom services need to be configured with a `url` and `body` property.
`headers` will default to `{}` and `method` will default to `'POST'`. All these
options can be overridden as described before of course.

*Example:*

```javascript
ENV.webhooks = {
  services: {
    simplabs: {
      url: 'https://notify.simplabs.com/deploy',
      body: function(context) {
        var deployer = context.deployer;

        return {
          secret: 'supersecret',
          deployer: deployer
        }
      },
      didActivate: true
    },
    newRelic: {
      url: 'https://api.newrelic.com/deployments.json',
      headers: {
        "api-key": "<your-api-key>"
      },
      method: 'POST',
      body: {
        deployment: {
          // ...
        }
      },
      didDeploy: true
    }
  }
};
```

### httpClient

The underlying http-library used to send requests to the specified services. This allows users to customize the library that's used for http requests which is useful in tests but might be useful to some users as well. By default the plugin uses [request](https://github.com/request/request).

## Running Tests

- `yarn test`

[1]: http://ember-cli-deploy.com/docs/v0.6.x/plugins-overview/ "Plugin Documentation"

## License

ember-cli-deploy-webhooks is developed by and &copy;
[simplabs GmbH](http://simplabs.com) and contributors. It is released under the
[MIT License](https://github.com/simplabs/ember-cli-deploy-webhooks/blob/master/LICENSE).
