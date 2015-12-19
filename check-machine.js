
var debug   = require('debug')('check-machine')
var SSH2    = require('ssh2-utils')
var ssh     = new SSH2();

module.exports = function (argv) {
  return {
    machines: {
      'vagrant': {
        host:'127.0.0.1',
        port: 2222,
        username: 'vagrant',
        password: 'vagrant'
      }
    },
    constraints: {
      'php_version': require('./php-version')(/^5[.]4/),
      'php_module': require('./php-module')([/shmop/,/zip/,/mbstring/]),
      'not_found': function (sshConn, argv) {
        return function (next) {
          next('not found')
        };
      },
      'php': ['php_version', 'php_module'],
      'alias': ['php_version', 'not_found']
    }
  };
};
