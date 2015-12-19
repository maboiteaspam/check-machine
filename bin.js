#!/usr/bin/env node

function usage () {/*

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
*/}
var pkg     = require('./package.json')
var argv    = require('minimist')(process.argv.slice(2));
var debug   = require('set-verbosity')(pkg.name, argv.v || argv.verbose);
var fs      = require('fs')
var async   = require('async');
var chalk   = require('chalk');
var symbols = require('symbolsjs');
var EventEmitter = require('events');

require('show-help')(usage, process.argv, pkg)

var rawArgs = argv['_']
if ((!rawArgs || rawArgs.length<2)) {
    return require('show-help').print(usage, pkg) && process.exit(0)
}

var machine = rawArgs.shift()
var constraints = [].concat(rawArgs)
var todo = []

var localConfig = {
    machines: {},
    constraints: {}
};
if (fs.existsSync('./check-machine.js')) localConfig = require('./check-machine.js')(argv)

if (!(machine in localConfig.machines)) return console.log('Machine "%s" is not configured', machine)
machine = localConfig.machines[machine]

var resolveStr = function (str){
    if (str in localConfig.constraints) {
        return localConfig.constraints[str]
    } else {
        try {
            return require(str)
        }catch(ex) {
            debug(ex)
        }
    }
    return function (next) {
        debug('%j', str)
        next('undefined constraint '+ str)
    }
}

var SSH2    = require('ssh2-utils')
var ssh     = new SSH2();

machine = machine.indexOf ? machine : [machine];

machine.forEach(function (m) {

    var ctx = new EventEmitter();
    ctx.on('message', showAssert(m))

    ssh.getConnReady(m, function (err, sshConn) {
        debug('connection acquired: %s', err?'no':'yes')
        if(err) throw err

        var jobs = [];
        constraints.forEach(function (c) {
            var constraint = resolveStr(c)

            if (typeof(constraint)==='object') {
                var subJobs = []
                constraint.forEach(function (aliased) {
                    subJobs.push(resolveStr(aliased)(sshConn, argv).bind(ctx))
                })
                jobs.push(function (next) {
                    async.series(subJobs, next)
                })
            } else {
                jobs.push(constraint(sshConn, argv).bind(ctx))
            }
        })

        async.parallelLimit(jobs, 4, function (err){
            sshConn.end()
        })
    })
})


function showAssert(machine){
    return function (data){
        if (data.result) {
            console.log(
              ' %s %s',
              chalk.green(symbols.ok),
              data.description
            )
            console.log(
              '\t= expected: %s',
              data.expected
            )
            console.log(
              '\t%s@%s:%s',
              machine.username,
              machine.host,
              machine.port
            )
        } else {
            console.log(
              ' %s %s',
              chalk.red(symbols.err),
              data.description
            )
            if (!data.error)
                console.log(
                  '\t+ expected: %s\n\t- got: %s',
                  data.expected,
                  data.subject
                )
            if (argv.f || argv.full)
                console.log(
                  '\t= full_subject:\n%s',
                  data.full_subject
                )
            console.log(
              '\t  %s@%s:%s',
              machine.username,
              machine.host,
              machine.port
            )
            if (data.error)
                console.log(
                  '\t  got error: %s',
                  chalk.red(data.error.message)
                )
        }
    };
}
