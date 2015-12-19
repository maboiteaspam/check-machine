#!/usr/bin/env node

function usage () {/*

check-machine ...description...

Usage
...description...

Options
...description...

Examples
...description...
*/}

var argv  = require('minimist')(process.argv.slice(2));         if (argv.v) process.env['DEBUG'] = 'check-machine';
var debug = require('debug')('check-machine')

var rawArgs = argv['_']
if ((!rawArgs || rawArgs.length<3) || argv.h) {
    return console.error('%s\n%s', argv.h?'Help':'wrong command', require('multiline')(usage))
}
