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

console.log('HTMLAttribute')
SubtleRegExp.debug = true
console.log(''+HTMLAttribute)
SubtleRegExp.debug = false
console.log(HTMLAttribute.getCaptureNames())

HTMLTag = new SubtleRegExp(
    [
        '<',
        {"Boolean isClose": '/?'},
        {tagName: /[^>\s]+/},
        // {"Array attributes": /[^\/>]*/},
        {"Array attributes": new SubtleRegExp(HTMLAttribute).min(0).max(false).disableSubCaptures()},
        {"Boolean isVoid": '/?'},
        '>'
    ]).min(1).max(false)

HTMLTag.defineSubPattern('attributes', HTMLAttribute)

// TODO: Assert that new SubtleRegExp(mySubtleRegExp) clones or wraps without modifying the original

console.log('')
console.log('HTMLTag')
SubtleRegExp.debug = true
console.log(''+HTMLTag)
SubtleRegExp.debug = false
console.log(HTMLTag.getCaptureNames())

console.log('')

HTMLTag_re = RegExp(HTMLTag, "ig")

html = "<tagName>innerText</tagName>"
HTMLTag.test(html) || FAIL("HTMLTag must match " + html);
// HTMLTag.test('') && FAIL("HTMLTag must NOT match blank");
// console.log(HTMLTag_re)
// HTMLTag_re.exec(html)
// console.log(HTMLTag_re)
// HTMLTag.exec(html)

var result

result = HTMLTag_re.exec(html)
// console.log(result)
console.assert(result.index === 0)
console.assert(HTMLTag_re.lastIndex === 9)
console.assert(result[2] === 'tagName')
console.assert(result[HTMLTag.indexOf('tagName')] == 'tagName')
console.assert(!result[HTMLTag.indexOf('isClose')])

result = HTMLTag_re.exec(html)
// console.log(result, HTMLTag.getCaptureNames())
console.assert(result.index === 18)
console.assert(HTMLTag_re.lastIndex === 28)
console.assert(result[HTMLTag.indexOf('tagName')] == 'tagName')
console.assert(result[HTMLTag.indexOf('isClose')])

result = HTMLTag_re.exec(html)
console.assert(result == null)
console.assert(HTMLTag_re.lastIndex === 0)


html = "<tagName attr=val attr1='val1' attr2=\"val2\">innerText</tagName>"

html.replace(HTMLTag_re, function(tag, isClose, tagName, attributes, index, html){
    console.log(arguments)
    var attributesPattern = HTMLTag.lookupSubPattern(HTMLTag.getCaptureNames()[2])
    attributes.replace(RegExp(attributesPattern, 'gi'), function(){
        console.log(
            arguments[arguments.length-2]
            ,
            tagName
            ,
            arguments[attributesPattern.indexOf('name')]
            ,
            arguments[attributesPattern.indexOf('value.unquoted')]
            || arguments[attributesPattern.indexOf('value.quoted.double.contents')]
            || arguments[attributesPattern.indexOf('value.quoted.single.contents')]
        )
    })
})
// console.assert(result == null)



html = "</tagName>"
HTMLTag.test(html) || FAIL("HTMLTag must match " + html);

html = "<tagName>lorem</tagName>"
HTMLTag.test(html) || FAIL("HTMLTag must match " + html);


