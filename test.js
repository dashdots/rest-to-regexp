var mocha = require('mocha');
var chai = require('chai');
var restToRegexp = require('./index');

var describe = mocha.describe;
var it = mocha.it;
var expect = chai.expect;


describe('test exp1', () => {
  var keys = [];
  var exp = restToRegexp('/sec1/:sec2/#sec3?/+sec4<foo>/*sec5/:sec6<bar>?/+sec7?/+sec8+/+sec9*', keys);

  it('keys', () => {
    expect(keys).to.deep.equal([
      {name: 'sec2', optional: false},
      {name: 'sec3', optional: true},
      {name: 'foo', optional: false},
      {name: 'sec5', optional: false},
      {name: 'bar', optional: true},
      {name: 'sec7', optional: true},
      {name: 'sec8', optional: false},
      {name: 'sec9', optional: true},
    ]);
  });

  it('matches', () => {
    expect(exp.test('/sec1/sec2/2/sec3/3/sec4/4/sec5/5/sec6/6/sec7/sec8/8/8/sec9/9/9')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec6/sec7/sec8/8/8/sec9/9/9')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec6/sec7/sec8/8/8/sec9')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec6/sec7/sec8/8/8/sec9')).to.be.equal(true);
  });
});

describe('test exp2', () => {
  var keys = [];
  var exp = restToRegexp('/sec1/:sec2/:sec3?/+sec4/+sec5?/#sec6?/*sec7?/+sec8?/+sec9?', keys);
  it('keys', () => {
    expect(keys).to.deep.equal([
      {name: 'sec2', optional: false},
      {name: 'sec3', optional: true},
      {name: 'sec4', optional: false},
      {name: 'sec5', optional: true},
      {name: 'sec6', optional: true},
      {name: 'sec7', optional: true},
      {name: 'sec8', optional: true},
      {name: 'sec9', optional: true},
    ]);
  });

  it('matches', () => {
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6/')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6/sec7/sec8/sec9')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6/sec7/sec8/sec9/')).to.be.equal(true);
  });
});


describe('test exp2(with extension)', () => {
  var keys = [];
  var exp = restToRegexp('/sec1/:sec2/:sec3?/+sec4/+sec5?/#sec6([yn])?/*sec7(:BOOL)?/+sec8?/+sec9?.html', keys);
  it('keys', () => {
    expect(keys).to.deep.equal([
      {name: 'sec2', optional: false},
      {name: 'sec3', optional: true},
      {name: 'sec4', optional: false},
      {name: 'sec5', optional: true},
      {name: 'sec6', optional: true},
      {name: 'sec7', optional: true},
      {name: 'sec8', optional: true},
      {name: 'sec9', optional: true},
    ]);
  });
  it('matches', () => {
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6/')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6/y/sec7/1/sec8/sec9')).to.be.equal(true);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6/n/sec7/0/sec8/sec9/9.html')).to.be.equal(true);
  });
  it('not match', () => {
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6.html')).to.be.equal(false);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6/sec7/sec8/sec9.html')).to.be.equal(false);
    expect(exp.test('/sec1/sec2/2/sec3/sec4/4/sec5/sec6/sec7/sec8/sec9/.html')).to.be.equal(false);
  });
});


describe('test exp3', () => {
  var keys = [];
  var exp = restToRegexp('/data/#filter?/+begin/*end/:list<page>?.html', keys, {strict:true});
  it('keys', () => {
    expect(keys).to.deep.equal([
      {name: 'filter', optional: true},
      {name: 'begin', optional: false},
      {name: 'end', optional: false},
      {name: 'page', optional: true}
    ]);
  });

  it('matches', () => {
    expect(exp.test('/data/list')).to.be.equal(true);
    expect(exp.test('/data/filter/begin/10/list/1.html')).to.be.equal(true);
    expect(exp.test('/data/filter/begin/10/end/200/list/1.html')).to.be.equal(true);
  });
  it('not match', () => {
    expect(exp.test('/data/filter/list/1.html')).to.be.equal(false);
    expect(exp.test('/data/filter/end/200/list/1.html')).to.be.equal(false);
    expect(exp.test('/data/filter/begin/end/200/list/1.html')).to.be.equal(false);
    expect(exp.test('/data/filter/begin/10/end/list/1.html')).to.be.equal(false);
  });
});


describe('test exp4', () => {
  var keys = [];
  var exp = restToRegexp('/foo/:bar/:baz?/#qux?', keys, {strict:true});

  it('keys', () => {
    expect(keys).to.deep.equal([
      {name: 'bar', optional: false},
      {name: 'baz', optional: true},
      {name: 'qux', optional: true},
    ]);
  });

  it('matches', () => {
    expect(exp.test('/foo/bar/1/baz')).to.be.equal(true);
    expect(exp.test('/foo/bar/1/baz/')).to.be.equal(true);
    expect(exp.test('/foo/bar/1/baz/1/qux')).to.be.equal(true);
    expect(exp.test('/foo/bar/1/baz/1/qux/')).to.be.equal(true);
    expect(exp.test('/foo/bar/1/baz/1/qux/1')).to.be.equal(true);
  });
  it('not match', () => {
    expect(exp.test('/foo/bar/baz')).to.be.equal(false);
  });
});


describe('test exp5', () => {
  var keys = [];
  var exp = restToRegexp('/article/:list<page>?.html', keys, {strict:true});

  it('keys', () => {
    expect(keys).to.deep.equal([
      {name: 'page', optional: true},
    ]);
  });

  it('matches', () => {
    expect(exp.test('/article/list/1.html')).to.be.equal(true);
    expect(exp.test('/article/list')).to.be.equal(true);
  });
  it('not match', () => {
    expect(exp.test('/article/page')).to.be.equal(false);
    expect(exp.test('/article/list/1')).to.be.equal(false);
  });
});

describe('test exp6', () => {
  var keys = [];
  var exp = restToRegexp('/foo/:bar+/:baz*/#qux*', keys, {strict:true});

  it('keys', () => {
    expect(keys).to.deep.equal([
      {name: 'bar', optional: false},
      {name: 'baz', optional: true},
      {name: 'qux', optional: true},
    ]);
  });

  it('matches', () => {
    expect(exp.test('/foo/bar/1/baz')).to.be.equal(true);
    expect(exp.test('/foo/bar/1/2/baz/1/qux')).to.be.equal(true);
    expect(exp.test('/foo/bar/1/2/3/baz/1/2/qux/1')).to.be.equal(true);
    expect(exp.test('/foo/bar/1/2/3/baz/1/2/qux/1/2')).to.be.equal(true);
  });
  it('not match', () => {
    expect(exp.test('/foo/bar/baz')).to.be.equal(false);
  });
});

describe('test exp7', () => {
  var keys = [];
  var exp = restToRegexp({
    path:'/:foo/#bar<baz>*',
    rules: {
      foo:'[a-f0-9]{2}',
      bar:'[1-9]\\d*'
    }
  }, keys, {strict:true});

  it('keys', () => {
    expect(keys).to.deep.equal([
      {name: 'foo', optional: false},
      {name: 'baz', optional: true},
    ]);
  });

  it('matches', () => {
    expect(exp.test('/foo/0d')).to.be.equal(true);
    expect(exp.test('/foo/0d/bar')).to.be.equal(true);
    expect(exp.test('/foo/0d/bar/1')).to.be.equal(true);
    expect(exp.test('/foo/0d/bar/1/23')).to.be.equal(true);
  });
  it('not match', () => {
    expect(exp.test('/foo/d1/bar/0')).to.be.equal(false);
  });
});

