# ember-cli-deploy-notifications [![Build Status](https://travis-ci.org/simplabs/ember-cli-deploy-notifications.svg)](https://travis-ci.org/simplabs/ember-cli-deploy-notifications)

> An ember-cli-deploy plugin to notify external services (e.g. an error
> tracking service) of a successful deployment.

<hr/>
**WARNING: This plugin is only compatible with ember-cli-deploy versions >= 0.5.0**
<hr/>

## What is an ember-cli-deploy plugin?

A plugin is an addon that can be executed as a part of the ember-cli-deploy pipeline. A plugin will implement one or more of the ember-cli-deploy's pipeline hooks.

For more information on what plugins are and how they work, please refer to the [Plugin Documentation][2].

## Quick Start

To get up and running quickly, do the following:

- Install this plugin

```bash
$ ember install ember-cli-deploy-notifications
```
- Place the following configuration into `config/deploy.js`


```javascript
ENV.notifications = {
  services: {
    "<some-key>": {
      url: <service-url>,
      data: function(context) {
        // return any object that should be passed as data here
        return {
          apiKey: <your-api-key>
        };
      }
    }
  }
}
```

- Run the pipeline

```bash
$ ember deploy
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation][2].

- `configure`
- `didDeploy`

## Configuration Options

For detailed information on how configuration of plugins works, please refer to the [Plugin Documentation][2].

###services

An object that identifies all webhooks you want to notify of a successful deployment. You will put a key for every service you want to call after a successful deploy here.

There are two types of services you can specify in the `services` property:

a)  __preconfigured services__

Preconfigured services don't need to be passed a `url`-property as `ember-cli-deploy-notifications` already knows about the url it needs to call when notifying the service. You only need to pass a `data`-function as configuration property to these services.

*Example:*

```javascript
ENV.notifications = {
  services: {
    bugsnag: {
      data: function(context) {
        return {
          apiKey: '<your-api-key'
        }
      }
    }
  }
};
```

Currently available preconfigured services are:

- `bugsnag`

If you want to provide a custom url for preconfigured services you can though and `ember-cli-deploy-notifications` will notify the custom url instead.

b) __custom services__

Custom services need to be configured with a `url`-property and a `data`-function.

*Example:*

```javascript
ENV.notifications = {
  services: {
    bugsnag: {
      data: function() {
        return { apiKey: '1234' }
      }
    },
    simplabs: {
      url: 'https://notify.simplabs.com/deploy',
      data: function(context) {
        var deployer = context.deployer;
        
        return {
          secret: 'supersecret',
          deployer: deployer
        }
      }
    }
  }
}
```

As you can see in the last example the data function will be passed the current deploy context which can then be used to send data to services based on the current deploy.

*Default:* `{}`

###httpClient

The underlying http-library used to send POST-requests to the specified services. This allows users to customize the library that's used for http requests which is useful in tests but might be useful to some users as well. By default the plugin uses [request](https://github.com/request/request).

## Running Tests

- `npm test`

[2]: http://ember-cli.github.io/ember-cli-deploy/plugins "Plugin Documentation"
