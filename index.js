if (false) {
window.bl = window.bl || {}
//window.top.bl = window.bl

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
    if (!/^local:\/\//.test(csymbol)) throw new Error('invalid protocol for retrieving csymbol definition')
    console.log(csymbol.match(/\/([^\/]+)/g))
  }
}())
}
