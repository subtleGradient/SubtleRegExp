;/*{       name: 'SubtleRegExp',
         author: 'Thomas Aylott <thomas@mootools.net>',
        license: 'to be decided'
      copyright: '2011 Sencha, Inc.',
    description: 'Build concise complex maintainable RegExps without having to remember the syntax!',

}*/
(function(){
var undefined
////////////////////////////////////////////////////////////////////////////////
if (typeof exports != 'undefined') exports.SubtleRegExp = SubtleRegExp

var sr = SubtleRegExp

function SubtleRegExp(object){
    if (this instanceof SubtleRegExp) return this['new'].apply(this, arguments)
    return sr.cast(object)
}

sr.cast = function(pattern){
    if (pattern instanceof SubtleRegExp) return pattern
    var regex = new SubtleRegExp
    
    if (pattern instanceof SubtleRegExp)
        return Object.create(pattern)
    
    else if (pattern instanceof RegExp) 
        regex.patterns.push(pattern.source)
    
    else if (typeof pattern == 'object'){
        if (pattern instanceof Array) return regex.appendMany(pattern)
        else return regex.appendObj(pattern)
    }
    
    else regex.patterns.push(pattern)
    return regex
}


////////////////////////////////////////////////////////////////////////////////

sr.prototype = {
    
    'new': function(){
        this.patterns = []
        this.appendMany(arguments)
    },
    
    prependAlt: function(pattern){
        this.patterns.unshift('|')
        this.prepend(pattern)
        return this
    },
    
    appendAlt: function(pattern){
        this.append(pattern)
        this.patterns.push('|')
        return this
    },
    
    prepend: function(pattern){
        this.patterns.reverse()
        this.append(pattern)
        this.patterns.reverse()
        return this
    },
    
    append: function(pattern){
        // console.log('append', require('util').inspect(pattern,false,1))
        this.patterns.push(SubtleRegExp(pattern))
        return this
    },
    
    appendObj: function(patternObj){
        console.log('appendObj')
        var i = 0
        for (var captureName in patternObj) {
            this['appendCapture' + (i==0? '' : 'Alt')](captureName, patternObj[captureName])
            i++
        }
        return this
    },
    appendCaptureAlt: function(captureName, pattern){
        this.patterns.push('|')
        this.appendCapture(captureName, pattern)
        return this
    },
    appendCapture: function(captureName, pattern){
        pattern = SubtleRegExp(pattern)
        pattern.captureName = captureName
        this.append(pattern)
        return this
    },
    
    appendMany: function(patterns){
        for (var i=0; i < patterns.length; i++) {
            this.append(patterns[i])
        }
        return this
    },
    
    captureName: null,
    
    _min: 1,
    _max: 1,
    
    one: function(){
        this._min = 1
        this._max = 1
        return this
    },
    min: function(min){
        this._min = min || 0
        return this
    },
    max: function(max){
        this._max = max || null
        return this
    },
    
    test: function(){
        return true
    },
    
    Result: Object,
    
    exec: function(string){
        string = String(string)
        result = new this.Result
        result[0] = string
        return result
    },
    
    toString: function(){
        // console.log(require('util').inspect(this.patterns,false,9))
        
        var group = !!this._group
          , patternCount = this.patterns.length
          , regex = ''
          , repeat
        
        if (patternCount > 1) group = true
        
        regex += this.patterns.join('')
        
        if      (this._min == 1 && this._max == 1   ) repeat = ''
        else if (this._min == 0 && this._max == 1   ) repeat = '?', group = true
        else if (this._min == 0 && this._max == null) repeat = '*', group = true
        else if (this._min == 1 && this._max == null) repeat = '+', group = true
        else repeat = '{' + this._min + ',' + this._max + '}', group = true
        
        if (group) {
            regex = '(?:' + regex
            regex += ')'
        }
        if (this.captureName) {
            regex = '(' + /*"<"+this.captureName+">" + */regex
            regex += ')'
        }
        regex += repeat
        return regex
    },
    
    0:0
}

sr.or = sr.appendAlt

////////////////////////////////////////////////////////////////////////////////

sr.escape = function(string){// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
    return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, sr.escapeChar)
}
sr.escapeChar = function(match){ return '\\' + match }

sr.balanced = function(begin, end){
    if (end == null) end = begin
    return new SubtleRegExp(begin, sr.notChar(end,'/').min(0).max(false), end)
}

/*
    without exceptAfter
    e.g. /'[^']*'/
    with exceptAfter '\'
    e.g. /'(?:\\'|[^'])*'/
*/

sr.notChar = function(chr, exceptAfter){
    if (chr.length > 1) throw new Error('notChar is for single chars only')
    var pattern = new SubtleRegExp("[^" + sr.escape(chr) + "]")
    if (exceptAfter != null) pattern.prependAlt(sr.escape(exceptAfter + chr))
    return pattern
}

sr.any = function(){
    var patterns = Array.prototype.slice.call(arguments)
      , patternChoices = []
    for (var i=0; i < patterns.length; i++) {
        if (i != 0) patternChoices.push('|')
        patternChoices.push(patterns[i])
    }
    return new SubtleRegExp(patternChoices)
}

sr.countCaptures = function(regexp){
    return ''.match(regexp + "|").length - 1
}

////////////////////////////////////////////////////////////////////////////////
}());
