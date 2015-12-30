
var debug   = require('debug')('check-machine')
var SSH2    = require('ssh2-utils')
var ssh     = new SSH2();

module.exports = function (module) {
  return function (sshConn, argv) {
    module = !module.unshift ? [module] : module;
    return function (next) {
      var that = this
      ssh.exec(sshConn, 'php -m', function (err, stdout, stderr) {
        debug('err: %j', err)
        debug('stdout: %j', stdout)
        debug('stderr: %j', stderr)
        module.forEach(function (m){
          var subject = stdout
          that.emit('message', {
            message: 'assert',
            error: err,
            full_subject: stdout,
            subject: subject.replace(/\n/g, ' '),
            expected: m,
            description: 'check php module',
            result: !!subject && subject.match(m)
          })
        })
        next(err, sshConn)
      })
    };
  }
};
