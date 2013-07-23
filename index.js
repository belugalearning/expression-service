window.bl = window.bl || {}
window.top.bl = window.bl

window.bl.expressionService = (function() {
  return {
    evaluateExpression: function(o) {
      var expression = $.parseXML(o.expression).childNodes[0]
      //var expression = $(expression).children('apply')[0]
      console.log('EXPR:', expression)
      return evaluate(expression, o.symbols)
    }
  }

  function evaluate(node, symbols) {
    var nodeName = typeof node.nodeName == 'string' && node.nodeName.toLowerCase()

    switch (nodeName) {
      case 'apply':
        return apply(node.childNodes, symbols)
      case 'csymbol':
        return evaluate(resolveCSymbol(node, symbols))
      case 'cn':
        return Number($(node).text())
      case 'string':
        return $(node).text()
      case 'boolean':
        return $(node).text() == 'true'
      default:
        return node
    }
  }

  function resolveCSymbol(csymbol, symbols) {
    var definitionURL = $(csymbol).attr('definitionURL')
    if (typeof definitionURL != 'string') throw new Error('invalid csymbol - definitionURL attribute required')
    if (!/^local:\/\//.test(definitionURL)) throw new Error('invalid protocol for retrieving csymbol definition')

    var parts = definitionURL
      .match(/\/[^\/]+/g)
      .map(function(s) { return s.slice(1) })

    if (parts[0] != 'symbols') throw new Error('invalid csymbol definitionURL -- path must start /symbols')

    var obj = symbols
    var i = 1
    while (i < parts.length && obj) {
      obj = obj[parts[i++]]
    }

    if (!obj) throw new Error('object not found at csymbol definitionURL: ' + definitionURL)

    return typeof obj.mathml == 'string'
      ? obj.mathml
      : obj
  }

  function apply(nodes, symbols) {
    var op = nodes[0].nodeName.toLowerCase()
    var operands = [].slice.call(nodes, 1).map(function(node) {
      return evaluate(node, symbols)
    })

    console.log('apply', op)
    operands.forEach(function(operand) {
      console.log('\toperand:', operand)
    })

    var fn = ({
      'eq': eq,
      'and': and,
      'in': isIn,
      'notin': notIn,
      'cardinality': cardinality,
      'property': property
    })[op]

    if (!fn) throw new Error('operation not implemented: ' + op)
    var res = fn.call(this, operands, symbols)
    console.log('RES', res, 'op:', op, 'operands:', operands)
    return res
  }

  function eq(operands, symbols) {
    if (
        operands
        .filter(function(arg) { return typeof arg == 'object' })
        .length
    ) {
      throw new Error('as yet "eq" function only handles primitives')
    }

    if (operands.length < 2) throw new Error('eq requires at least two operands')
    var result = true
    var i = 0
    while (result && ++i < operands.length) {
      result = operands[i] === operands[i-1]
    }
    return result
  }

  function and(operands, symbols) {
    var result = true
    var i = 0
    while (result && i < operands.length) {
      result = evaluate(operands[i++], symbols) === true
    }
    return result
  }

  function isIn(operands, symbols) {
    var member = operands[0]
    var collection = operands[1]

    if (!(member instanceof Element)) {
      member = $('<csymbol/>').attr('definitionURL', member.definitionURL)[0]
    }

    var firstChild = $(collection).children()[0]
    if (firstChild && firstChild.nodeName == 'members') {
      throw new Error('collection members iteration not implemented yet for isIn')
    } else {
      var bvar = firstChild
      var condition = $(collection).children()[1]
      if (!bvar || !condition || bvar.nodeName.toLowerCase() != 'bvar' || condition.nodeName.toLowerCase() != 'condition') {
        throw new Error('collection must be definied either by members of bvar+condition')
      }

      var ci = $(bvar).children()[0]
      if (!ci || ci.nodeName.toLowerCase() != 'ci' || !$(ci).text().length) throw new Error('invalid bvar')

      $(condition).find('ci:contains(' + $(ci).text() + ')')
        .replaceWith(member)

      console.log('----> isIn eval:', condition.childNodes[0])
      return evaluate(condition.childNodes[0], symbols)
    }
  }

  function notIn() {
    return !isIn.apply(this, arguments)
  }

  function property(operands, symbols) {
    console.log('PROP')
    var obj = operands[0]
    var key = operands[1]
    console.log('property', key, obj)
    return obj[key]
  }

  function cardinality(operands, symbols) {
    var collection = operands[0]
    var $members = $(collection).children('members')
    if (!$members[0]) throw new Error('function cardinality requires collection with members child node')
    return $members.children().length
  }
}())
