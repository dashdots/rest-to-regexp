# REST-to-RegExp

Turn a REST style path string into a regular expression.

## Usage

```javascript
var restToRegexp = require('rest-to-regexp');
```

### 1. restToRegexp(path, keys, options)

### 2. restToRegexp({path, rules}, keys, options)

 - **path** A string in the express format, an array of such strings, or a regular expression
 - **rules** An object of regular expression mapping.
 - **keys** An array to be populated with the keys present in the url.  Once the function completes, this will be an array of strings.
 - **options**
   - **options.sensitive** Defaults to false, set this to true to make routes case sensitive
   - **options.strict** Defaults to false, set this to true to make the trailing slash matter.
   
```javascript
var keys = [];

var exp1 = restToRegexp('/foo/:bar', keys);

var exp2 = restToRegexp({
  path:'/foo/:bar',
  rules:{
    bar: '[a-f]{2}'
  }
}, keys);

//keys = ['bar']
```

## Format of path
### \(/ \[prefix\] name \(validator\) \<alias\> \[suffix\]\)+


### Alias

```javascript
var keys = [];
var exp = restToRegexp('/article/:list<page>?.html', keys);
//keys = ['list', 'page']

// matches
exp.test('/article/list/1.html');
exp.test('/article/list');

// not match
exp.test('/article/page');
exp.test('/article/list/1');
```

### rules

```javascript
var keys = [];
var exp = restToRegexp('/:foo([a-f0-9]{2})/#bar([1-9]\d*)<baz>*', keys);
//keys = ['foo', 'baz']

// also you can define rules this way:
exp = restToRegexp({
  path:'/:foo/#bar<baz>*',
  rules: {
    foo:'[a-f0-9]{2}',
    bar:'[1-9]\d*'
  }
}, keys);

// matches
exp.test('/foo/0d');
exp.test('/foo/0d/bar');
exp.test('/foo/0d/bar/1');
exp.test('/foo/0d/bar/1/23');

// not match
exp.test('/foo/d1/bar/0');
```

### Prefixes

#### 1. normal part (:)
```javascript
var exp = restToRegexp('/foo/:bar', keys);
// keys = ['bar']

// matches
exp.text('/foo/bar/2');

// not match
exp.text('/foo/bar');
exp.text('/foo');
```

#### 2. optional part (#)

```javascript
var exp = restToRegexp('/foo/#bar', keys);
// keys = ['bar']

// matches
exp.test('/foo/bar/2');
exp.test('/foo');

// not match
exp.test('/foo/bar');
```

#### 3. follow previous part (+ or \*)

```javascript
var exp = restToRegexp('/data/#filter/+begin/*end/:list<page>?.html', keys);
// keys = ['filter', 'begin', 'end', 'page']

// /+begin should follow /#filter
// /*end follow /+begin optional

// matches
exp.test('/data/list');
exp.test('/data/filter/begin/10/list/1.html');
exp.test('/data/filter/begin/10/end/200/list/1.html');

// not match
exp.test('/data/filter/list/1.html');
exp.test('/data/filter/end/200/list/1.html');
exp.test('/data/filter/begin/end/200/list/1.html');
exp.test('/data/filter/begin/10/end/list/1.html');
```

### Usage of suffixes

#### 1. match single value (&lt;empty\> or ?)
```javascript
var exp = restToRegexp('/foo/:bar/:baz?/#qux?', keys);
// keys = ['bar', 'baz', 'qux']

// matches
exp.test('/foo/bar/1/baz');
exp.test('/foo/bar/1/baz/1/qux');
exp.test('/foo/bar/1/baz/1/qux/1');

// not match
exp.test('/foo/bar/baz');
```

#### 2. match multiple values (+ or \*)
```javascript
var exp = restToRegexp('/foo/:bar+/:baz*/#qux*', keys);
// keys = ['bar', 'baz', 'qux']

// matches
exp.test('/foo/bar/1/baz');
exp.test('/foo/bar/1/2/baz/1/qux');
exp.test('/foo/bar/1/2/3/baz/1/2/qux/1');
exp.test('/foo/bar/1/2/3/baz/1/2/qux/1/2');

// not match
exp.test('/foo/bar/baz');
```

## License

MIT
