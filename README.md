# check-machine

Check machine properties over ssh

## Install

    npm i check-machine -g

## Usage

`check-machine` is a binary to install globally,
it expects that a file `check-machine.js` exists on `cwd`,

```bash
check-machine 1.0.0

    Usage
        check-machine [opts] -- [machine] [constraint1 constraint2 constraint3 ...]
        check-machine [machine] [constraint1 constraint2 constraint3 ...]

    Options
        -v verbose
        -h help

    Examples
        check-machine lb1 lb
        check-machine lb2 lb
        check-machine web2 web db redis
```

__check-machine.js__

Is a node module which exports a function. This handler receives `argv`,
returns a configuration object of ssh `hosts` and `constraints`,

```js
    {
    machines: {
      'vagrant': ssh host
    },
    constraints: {
      'constraint 1': function (sshConn, argv){},
      'constraint 2': require(...)(...),
      'constraint 3': ['constraint 1', 'constraint 2']
    }
  }
```

#### ssh host

SSH hosts are plain objects

```js
{ host: '127.0.0.1',
    port: 2222,
    username: 'vagrant',
    password: 'vagrant' }
```

#### constraint

Constraints are `function (sshConn, argv)` which returns `function (next)`.
```js
    function notFound(sshConn, argv) {
        return function (next) {
            that.emit('message', {
                message: 'assert',
                ...
            })
            next('not found')
        };
    }
```

When constraints are require-able, they are
are `function (params...)`
which returns `function (sshConn, argv)`
which returns `function (next)`.

```js
module.exports = function (param) {
  return function (sshConn, argv) {
    param = !param ? ... : ...;
    return function (next) {
        that.emit('message', {
            message: 'assert',
            ...
        })
        next(err, sshConn)
    };
  }
};

```

#### rendering

To render the status of the test, the constraints are invoked into the context af an event emitter.

Constraints are expected to `emit('message', {})` events, such

```js
that.emit('message', {
    message: 'assert',                          // message type
    error: err,                                 // execution error
    full_subject: stdout,                       // full content on which the tests is performed
    subject: subject.replace(/\n/g, ' '),       // When possible, a reduced part of the content
    expected: m,                                // the expectation
    description: 'check php module',            // a descriptive text for humans
    result: !!subject && subject.match(m)       // a boolean indicating the result
})
```

## Dev

Kick-start your hacks like this,

```
git clone..
vagrant up
node bin.js vagrant php
node bin.js vagrant php_version
```

## More

- https://github.com/maboiteaspam/check-machine/blob/master/check-machine.js
- https://github.com/maboiteaspam/check-machine/blob/master/php-module.js
- https://github.com/maboiteaspam/check-machine/blob/master/php-version.js
- https://github.com/maboiteaspam/ssh2-utils
