window.bl = window.bl || {}
window.top.bl = window.bl

window.bl.expressionService = (function() {
  return {
    evaluateExpression: function(o) {
      return evaluate($.parseXML(o.expression).childNodes[0], o.symbols)
    }
  }

  function evaluate(expression, symbols) {
    switch (expression.nodeName) {
      case 'apply':
        return apply(expression.childNodes, symbols)
      case 'csymbol':
        resolveCSymbol(expression, symbols)
        return true;
      default:
        return false;
    }
  }

  function apply(nodes, symbols) {
    var op = nodes[0].nodeName
    var args = [].slice.call(nodes, 1).map(function(node) {
      return evaluate(node, symbols)
    })

    var fn = ({
      'in': isIn,
      'notin': notIn
    })[op]

    if (!fn) throw new Error('operation not supported: ' + op)
    return fn.apply(null, args)
  }

  function isIn(member, set) {
    console.log('isIn arguments:', arguments)
    return true
  }

  function notIn() {
    return !isIn.apply(null, arguments)
  }

  function resolveCSymbol(csymbol, symbols) {
    var definitionURL = $(csymbol).attr('definitionURL')
    if (typeof definitionURL != 'string') throw new Error('invalid csymbol - definitionURL attribute required')
    if (!/^local:\/\//.test(definitionURL)) throw new Error('invalid protocol for retrieving csymbol definition')

    var parts = definitionURL
      .match(/\/[^\/]+/g)
      .map(function(s) { return s.slice(1) })

    var obj = symbols
    var i = 0
    while (i < parts.length && obj) {
      obj = obj[parts[i++]]
      console.log(obj)
    }
  }
}())
