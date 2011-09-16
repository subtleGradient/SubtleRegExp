SubtleRegExp = require('./SubtleRegExp').SubtleRegExp

console.assert(SubtleRegExp.escape('\\') == '\\\\')

console.assert('' + SubtleRegExp.notChar("'") == (/[^']/).source, ''+SubtleRegExp.notChar("'"))
console.assert('' + SubtleRegExp.notChar("'",'\\') == (/(?:\\'|[^'])/).source, ''+SubtleRegExp.notChar("'",'\\'))

console.assert(SubtleRegExp.countCaptures(/0/) === 0)
console.assert(SubtleRegExp.countCaptures(/(1)(2(3(4(5))))/) === 5)

var pattern = RegExp(SubtleRegExp.any(1,2,3))
console.assert( pattern.test(0) === false )
console.assert( pattern.test(1) )
console.assert( pattern.test(2) )
console.assert( pattern.test(3) )
console.assert( pattern.test(4) === false )

pattern = RegExp(SubtleRegExp(/[0-9a-f]/), 'gim')
console.assert(''+pattern == ''+(/[0-9a-f]/gim), pattern)
pattern = RegExp(SubtleRegExp(pattern).exact(), 'gim')
console.assert(''+pattern == ''+(/^(?:[0-9a-f])$/gim))
pattern = RegExp(SubtleRegExp().exact(), 'gim')

pattern = RegExp(SubtleRegExp(SubtleRegExp.escape('(foo)|(bar)')))
console.assert(SubtleRegExp.countCaptures(pattern) === 0, 'must escape strings passed into SubtleRegExp')

////////////////////////////////////////////////////////////////////////////////


function FAIL(message){throw Error(message)}

var html, tag

HTMLAttribute = new SubtleRegExp(
    [
        /\s+/,
        {name: /[-._:a-z0-9]+/i},
        '=',
        {value: {
            unquoted:/[-._:a-z0-9]+/i,
            quoted: {
                'double': SubtleRegExp.balanced('"'),
                single: SubtleRegExp.balanced("'")
            }
        }}
    ]).min(0).max(1)

console.log(''+HTMLAttribute)

HTMLTag = new SubtleRegExp(
    [
        '<',
        {"Boolean isClose": '/?'},
        {tagName: /[^>\s]+/},
        // {"Array attributes": /[^\/>]*/},
        {"Array attributes": SubtleRegExp(HTMLAttribute).max(false)},
        {"Boolean isVoid": '/?'},
        '>'
    ]).min(1).max(false)


console.log(''+HTMLTag)
HTMLTag_re = RegExp(HTMLTag, "i")

html = "<tagName>"
HTMLTag.test(html) || FAIL("HTMLTag must match " + html);
// HTMLTag.test('') && FAIL("HTMLTag must NOT match blank");
console.log(HTMLTag_re)
HTMLTag_re.exec(html)
console.log(HTMLTag_re)
// HTMLTag.exec(html)

html = "</tagName>"
HTMLTag.test(html) || FAIL("HTMLTag must match " + html);

html = "<tagName>lorem</tagName>"
HTMLTag.test(html) || FAIL("HTMLTag must match " + html);
