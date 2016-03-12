"use strict";

var flatten = require('array-flatten');

var PREFIX = {
  STATIC: '',
  VARIABLE: ':',
  OPTIONAL: '#',
  MUST_FOLLOW: '+',
  FOLLOW: '*',
};

var SUFFIX = {
  SINGLE: '',
  SINGLE_OPTIONAL: '?',
  MULTIPLE: '+',
  MULTIPLE_OPTIONAL: '*',
};

var PRESET_RULES = {
  INTEGER: '\\d+',
  STRING: '[a-z]+',
  BOOL: '[01]',
};

var CLIP_RULE = /\/([:#\+\*]?)([a-z][a-z_0-9]+)(?:\(([^\(\)\/]+)\))?(?:<([a-z][a-z_0-9]+)>)?([\?\*\+]?)?/ig;

var slice = Array.prototype.slice;

var isArray = Array.isArray;

module.exports = function RestToRegexp(path, keys, options) {
  options = options || {};
  keys = keys || [];

  var strict = options.strict;
  var flags = options.sensitive ? '' : 'i';
  var rules = {};
  var extension = '';
  var parsedNames = [];
  var expStack = [];

  path = path || '/';

  if ('string' === typeof path) {
      path = path.replace(/\s+/g, '');
  } else if ('object' === typeof path && !isArray(path)) {
    rules = path.rules;
    path = path.path;
  }

  path = path.replace(/\.([a-z]+)$/i, function (m, ext) {
    extension = ext;
    return '';
  }).replace(/\s+|\/+$/g, '');

  extension = extension || '';
  rules = rules || {};

  var parts = getParts(path, rules, extension);
  if (parts === false) {
    throw new Error('parse part fail, path: ' + path);
  }

  var lastSlash = true;
  parts.forEach(function(part){
    if (part.prefix !== PREFIX.STATIC) {
      keys.push({
        name: part.alias || part.name,
        optional: part.optional,
      });
    }

    if (part.last && !strict) {
      lastSlash = extension || part.optional;
    }

    var exp = part.exp;
    var dupId = parsedNames.indexOf(part.name);
    if (dupId !== -1) {
      var dupName = parsedNames[dupId];
      var dupExp = expStack[dupId];
      if (isArray(dupExp)) {
        dupExp = dupExp.join('');
      }
      expStack[dupId] = ['', '(?=/' + dupName + ')(?:(?:' + dupExp + ')(?!/' + dupName + '))?', ''];
    }
    parsedNames.push(part.name);

    var len = expStack.length;
    if (len !== 0 && (part.prefix === PREFIX.FOLLOW || part.prefix === PREFIX.MUST_FOLLOW)) {
      var prevExp = expStack[len - 1];

      if(!isArray(prevExp)) {
        throw new Error('Prefix:"' + PREFIX.FOLLOW + '", "' + PREFIX.MUST_FOLLOW + '" don\'t support static part.');
      }
      expStack[len - 1] = [
        prevExp[0] + prevExp[1] + '(?:' + exp[0],
        exp[1],
        exp[2] + ')' + (part.prefix === PREFIX.MUST_FOLLOW ? '' : '?') + prevExp[2]
      ];

    } else {
      expStack.push(exp);
    }
  });

  return new RegExp('^' + flatten(expStack).join('') + (lastSlash ? '' : '/?') + '$', flags);
};

function parsePart(last, ext, rules, match, prefix, name, inlineRule, alias, suffix, offset) {
  var exp = '/' + name;
  var optional = false;
  var rule = rules[name] || inlineRule || '\\d+';

  suffix = suffix || SUFFIX.SINGLE;
  prefix = prefix || PREFIX.STATIC;

  if (prefix === PREFIX.STATIC && (suffix !== SUFFIX.SINGLE || alias)) {
    throw new Error('Cannot use suffix and alias in static part, check:' + match);
  }

  if (rule instanceof RegExp) {
    rule = rule.source;
  } else if (typeof rule === 'string') {
    if (rule[0] === ':') {
      var preset = String.prototype.slice.call(rule, 1);
      if (Object.prototype.hasOwnProperty.call(PRESET_RULES, preset)) {
        rule = PRESET_RULES[preset];
      }
    }
  } else {
    throw new Error('Rule should be RegExp or string, check:' + match);
  }

  if (prefix === PREFIX.STATIC) {
    if (last) {
      if (ext) {
        exp += '\\.' + ext;
      } else {
        exp += '/?';
      }
    }
  } else {
    switch (suffix) {
      case SUFFIX.MULTIPLE_OPTIONAL:
        optional = true;
        exp += last && ext ? '(?:((?:/' + rule + ')+)\\.' + ext + '|/?)'
            : '((?:/' + rule + ')*)';
        break;
      case SUFFIX.SINGLE_OPTIONAL:
        optional = true;
        exp += last && ext ? '(?:/(?:(' + rule + ')\\.' + ext + ')?)?'
            : '(?:/(' + rule + ')?)?';
        break;
      case SUFFIX.MULTIPLE:
        exp += last && ext ? '((?:/' + rule + ')+)\\.' + ext
            : '((?:/' + rule + ')+)';
        break;
      case SUFFIX.SINGLE:
      default:
        exp += last && ext ? '/(' + rule + ')\\.' + ext
            : '/(' + rule + ')';
        break;
    }

    if (prefix === PREFIX.OPTIONAL) { // && !last
      exp = ['(?:', exp, ')?'];
    } else {
      exp = ['', exp, ''];
    }
  }

  return {
    prefix: prefix,
    suffix: suffix,
    offset: offset,
    optional: optional,
    name: name,
    alias: alias,
    rule: rule,
    last: last,
    ext: ext,
    exp: exp,
  };
}

function getParts(path, rules, extension) {
  var parts = [],
      matches = [],
      len;

  if (path === '/' || path === '') {
    return parts;
  }

  rules = rules || {};
  extension = extension || '';

  if (path.replace(CLIP_RULE, function () {
      matches.push(slice.call(arguments));
      return '';
    }) !== '' || (len = matches.length) === 0) {
    throw new Error('Parse fail, check the path: "' + path);
  }

  matches.forEach(function (match, i) {
    var last = i === len - 1;
    parts.push(parsePart.apply(null,
        [last, last ? extension : '', rules].concat(match)
    ));
  });

  return parts;
}