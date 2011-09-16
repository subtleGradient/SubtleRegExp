;/*{       name: 'SubtleRegExp',
         author: 'Thomas Aylott <thomas@mootools.net>',
        license: 'to be decided'
      copyright: '2011 Sencha, Inc.',
    description: 'Build concise complex maintainable RegExps without having to remember the syntax!',

}*/

/*jshint asi:true, laxbreak:true*/

(function(){
////////////////////////////////////////////////////////////////////////////////
if (typeof exports != 'undefined') exports.SubtleRegExp = SubtleRegExp

var slice = Array.prototype.slice

var sr = SubtleRegExp

/** @constructor */
function SubtleRegExp(object){
    if (this instanceof SubtleRegExp) return this['new'].apply(this, arguments)
    return sr.cast(object)
}

/** Convert a `pattern` into a SubtleRegExp, without cloning */
sr.cast = function(pattern){
    if (pattern instanceof SubtleRegExp)
        return pattern
    
    var regex = new SubtleRegExp
    
    if (pattern && typeof pattern == 'object' && !(pattern instanceof RegExp)){
        if (pattern instanceof Array) return regex.appendMany(pattern)
        else return regex.appendObj(pattern)
    }
    
    regex.patterns.push(pattern)
    return regex
}


////////////////////////////////////////////////////////////////////////////////

sr.prototype = {
    
    /** @private */
    'new': function(){
        this.patterns = []
        this.appendMany(arguments)
    },
    
    /** Augment the current pattern with another alternative match, with higher priority */
    prependAlt: function(pattern){
        this.patterns.unshift('|')
        this.prepend(pattern)
        return this
    },
    
    /** Augment the current pattern with another alternative match, with lower priority */
    appendAlt: function(pattern){
        this.append(pattern)
        this.patterns.push('|')
        return this
    },
    
    /** Augment the current pattern by adding an additional pattern before it */
    prepend: function(pattern){
        this.patterns.unshift(SubtleRegExp(pattern))
        return this
    },
    
    /** Augment the current pattern by adding an additional pattern after it */
    append: function(pattern){
        this.patterns.push(SubtleRegExp(pattern))
        return this
    },
    
    /** Augment the current pattern by adding multiple additional patterns after it */
    appendMany: function(patterns){
        for (var i=0; i < patterns.length; i++) {
            this.append(patterns[i])
        }
        return this
    },
    
    /** Augment the current pattern by adding multiple named captures */
    appendObj: function(patternObj){
        var i = 0
        for (var captureName in patternObj) {
            this['appendCapture' + (i==0? '' : 'Alt')](captureName, patternObj[captureName])
            i++
        }
        return this
    },
    
    /** Augment the current pattern by adding multiple alternative named captures */
    appendCaptureAlt: function(captureName, pattern){
        this.patterns.push('|')
        this.appendCapture(captureName, pattern)
        return this
    },
    
    /** Augment the current pattern by adding multiple required named captures */
    appendCapture: function(captureName, pattern){
        pattern = SubtleRegExp(pattern)
        pattern.captureName = captureName
        this.append(pattern)
        return this
    },
    
    captureName: null,
    
    _min: 1,
    _max: 1,
    
    /** Declare that this pattern should only match once */
    one: function(){
        this._min = 1
        this._max = 1
        return this
    },
    /** Declare that this pattern should match at least `min` times */
    min: function(min){
        this._min = min || 0
        return this
    },
    /** Declare that this pattern should match at most `max` times */
    max: function(max){
        this._max = max || null
        return this
    },
    
    /** Declare that this pattern must be matched exactly from beginning to end */
    exact: function(isExact){
        if (isExact == null) isExact = true
        this['^'] = isExact
        this.$ = isExact
        return this
    },
    
    /** Test a string to see if matches this pattern. Cf. RegExp.prototype.test */
    test: function(){
        // FIXME: Implement SubtleRegExp.prototype.test
        return true
    },
    
    // Result: Object,
    // /** Execute this pattern on a string. Returns the next match. Cf. RegExp.prototype.exec */
    // exec: function(string){
    //     // FIXME: Implement SubtleRegExp.exec
    //     // FIXME: Implement SubtleRegExp.exec support for named captures
    //     // FIXME: Implement SubtleRegExp.exec support for sub-patterns
    //     string = String(string)
    //     result = new this.Result
    //     result[0] = string
    //     return result
    // },
    
    /** Convert this custom object to a string for use as a RegExp */
    toString: function(){
        var group = !!this._group
          , patterns = slice.call(this.patterns)
          , patternCount = patterns.length
          , index = patternCount
          , regex = ''
          , repeat
        
        while (--index >= 0) {
            if (patterns[index] instanceof RegExp) patterns[index] = patterns[index].source
        }
        
        if (patternCount > 1 || this['^'] || this.$) group = true
        
        regex += patterns.join('')
        
        if      (this._min == 1 && this._max == 1   ) repeat = ''
        else if (this._min == 0 && this._max == 1   ) repeat = '?', group = true
        else if (this._min == 0 && this._max == null) repeat = '*', group = true
        else if (this._min == 1 && this._max == null) repeat = '+', group = true
        else repeat = '{' + this._min + ',' + this._max + '}', group = true
        
        if (this.captureName != null) {
            if (this.debug) regex = "<"+this.captureName+">" + regex
            regex = '(' + regex
            if (this.debug) regex += "</"+this.captureName+">"
            regex += ')'
        }
        else if (group) regex = '(?:' + regex + ')'
        regex += repeat
        
        if (this['^']) regex = '^' + regex
        if (this.$) regex += '$'
        
        return regex
    },
    
    debug: false
}


/** Augment the current pattern with another alternative match, with lower priority */
sr.or = sr.appendAlt

////////////////////////////////////////////////////////////////////////////////

/** Escape a string for use in a RegExp */
sr.escape = function(string){
    return string.replace(sr.escape_re, '\\')
}
sr.escape_re = /(?=[-[\]{}()*+?.\\^$|,#\s])/g

/** Create a balanced pattern
    such as quoted strings with support for escaped quotes */
sr.balanced = function(begin, end, exceptAfter){
    if (end == null) end = begin
    return new SubtleRegExp(begin, sr.notChar(end, exceptAfter || '/').min(0).max(false), end)
}

/** Create a pattern that matches any character that is not `chr`
    without exceptAfter
        e.g. /'[^']*'/
    with exceptAfter '\'
        e.g. /'(?:\\'|[^'])*'/
*/
sr.notChar = function(chr, exceptAfter){
    if (chr.length > 1) throw Error('notChar is for single chars only')
    var pattern = SubtleRegExp('[^' + sr.escape(chr) + ']')
    if (exceptAfter != null) pattern.prependAlt(sr.escape(exceptAfter + chr))
    return pattern
}

/** Create a pattern that matches any of the arguments */
sr.any = function(){
    return SubtleRegExp(slice.call(arguments).join('|'))
}

/** Return the number of capture groups in the pattern */
sr.countCaptures = function(pattern){
    return ''.match(pattern + "|").length - 1
}

////////////////////////////////////////////////////////////////////////////////
}());

/** Run the tests if executed directly */
if (typeof module == 'object' && module.id == '.') {
    require('./SubtleRegExp.test')
}
