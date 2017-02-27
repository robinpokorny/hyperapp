import { isPrimitive, merge } from "./utils"

function shouldUpdate(a, b) {
  return a.tag !== b.tag
    || typeof a !== typeof b
    || isPrimitive(typeof a) && a !== b
}

function removeElementData(element, name, value) {
  element.removeAttribute(name === "className" ? "class" : name)

  if (typeof value === "boolean" || value === "true" || value === "false") {
    element[name] = false
  }
}

function defer(fn, data) {
  setTimeout(function () {
    fn(data)
  }, 0)
}

function setElementData(element, name, value, oldValue) {
  if (name === "style") {
    for (var i in value) {
      element.style[i] = value[i]
    }

  } else if (name[0] === "o" && name[1] === "n") {
    var event = name.substr(2)
    element.removeEventListener(event, oldValue)
    element.addEventListener(event, value)

  } else {
    if (value === "false" || value === false) {
      element.removeAttribute(name)
      element[name] = false
    } else {
      element.setAttribute(name, value)
      if (element.namespaceURI !== "http://www.w3.org/2000/svg") {
        element[name] = value
      }
    }
  }
}

function createElementFrom(node) {
  var element
  if (isPrimitive(typeof node)) {
    element = document.createTextNode(node)

  } else {
    element = node.data && node.data.ns
      ? document.createElementNS(node.data.ns, node.tag)
      : document.createElement(node.tag)

    for (var name in node.data) {
      if (name === "oncreate") {
        defer(node.data[name], element)
      } else {
        setElementData(element, name, node.data[name])
      }
    }

    for (var i = 0; i < node.children.length; i++) {
      var childNode = node.children[i]

      if (childNode !== undefined && typeof childNode !== "boolean" && childNode !== null) {
        element.appendChild(createElementFrom(childNode))
      }
    }
  }

  return element
}

function updateElementData(element, data, oldData) {
  for (var name in merge(oldData, data)) {
    var value = data[name]
    var oldValue = oldData[name]
    var realValue = element[name]

    if (value === undefined) {
      removeElementData(element, name, oldValue)

    } else if (name === "onupdate") {
      defer(value, element)

    } else if (value !== oldValue
      || typeof realValue === "boolean" && realValue !== value) {
      setElementData(element, name, value, oldValue)
    }
  }
}

export function patch(parent, node, oldNode, index) {
  if (node === null) {
    return
  }

  if (oldNode === undefined) {
    parent.appendChild(createElementFrom(node))

  } else if (node === undefined) {
    while (index > 0 && !parent.childNodes[index]) {
      index--
    }

    var element = parent.childNodes[index]

    if (oldNode && oldNode.data) {
      var hook = oldNode.data.onremove
      if (hook) {
        defer(hook, element)
      }
    }

    parent.removeChild(element)

  } else if (shouldUpdate(node, oldNode)) {
    var element = parent.childNodes[index]

    if (typeof node === "boolean") {
      parent.removeChild(element)

    } else if (element === undefined) {
      parent.appendChild(createElementFrom(node))

    } else {
      parent.replaceChild(createElementFrom(node), element)
    }
  } else if (node.tag) {
    var element = parent.childNodes[index]

    updateElementData(element, node.data, oldNode.data)

    var len = node.children.length, oldLen = oldNode.children.length

    for (var i = 0; i < len || i < oldLen; i++) {
      patch(element, node.children[i], oldNode.children[i], i)
    }
  }
}
