# Decent Mess Up

Want to understand my js? No way!

**Input:**

```js
const str = 'abc';
function func() {
  const obj = {};
  obj.property = {
    key1: 'value1',
    key2: str,
    ['key' + 3]: 'value3',
  };
  console.log(obj);
}
func();
```

**Output:**

```js
const _a = 'vcb3aotkleyr21ugp';
const _b = 'bcktuovea2grp1y3l';
const _c = 'yecauop3rkbltg2v1';
const str = _a[4] + _b[0] + _a[1];
function func() {
  const _a2 = _b;
  const _b2 = _a;
  const _c2 = _c;

  const obj = {};
  obj[_a2[12] + _c2[8] + _c2[5] + _a2[12] + _b2[9] + _c2[8] + _b2[6] + _a2[14]] = {
    [_b2[7] + _b2[9] + _a2[14] + _b2[13]]: _c2[15] + _c2[3] + _a2[16] + _b2[14] + _c2[1] + _a2[13],
    [_a2[2] + _c2[1] + _b2[10] + _a2[9]]: str,
    [_c2[9] + _a2[7] + _a2[14] + 3]: _c2[15] + _c2[3] + _c2[11] + _b2[14] + _a2[7] + _a2[15],
  };
  console[_a2[16] + _c2[5] + _b2[15]](obj);
}
func();
```

### Options

The default options are:

```typescript
interface Options {
  // The count of string variables in each function scope.
  stringVariableCounts?: number;
  // The options of terser.
  minifyOptions?: MinifyOptions | null;
  // The options of @babel/parser.
  parserOptions?: ParserOptions;
  // The options of @babel/generator.
  generatorOptions?: GeneratorOptions;
}
```

#### `stringVariableCounts`

The count of string variables in each function scope.

stringVariableCounts=1:

```js
var _a = '31olg2';
console[_a[3] + _a[2] + _a[4]](_a[1] + _a[5] + _a[0]);
```

stringVariableCounts=3:

```js
var _a = 'l1go23';
var _b = '13gol2';
var _c = '23og1l';
console[_b[4] + _b[3] + _b[2]](_b[0] + _b[5] + _b[1]);
```
