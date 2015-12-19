
var debug   = require('debug')('check-machine')
var SSH2    = require('ssh2-utils')
var ssh     = new SSH2();

module.exports = function (version) {
  return function (sshConn, argv) {
    version = version || argv.version || ''
    return function (next) {
      var that = this
      ssh.exec(sshConn, 'php -v', function (err, stdout, stderr) {
        debug('%j', err)
        debug('%j', stdout)
        debug('%j', stderr)
        var subject = stdout.match(/\s([0-9]+[.][0-9]+[.][0-9]+)\s/)
        if (subject) subject = subject[1]
        that.emit('message', {
          message: 'assert',
          error: err,
          full_subject: stdout,
          subject: subject,
          expected: version,
          description: 'check php version',
          result: !!subject && subject.match(version)
        })
        next(err, sshConn)
      })
    };
  }
};
