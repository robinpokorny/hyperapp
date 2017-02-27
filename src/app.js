import { patch } from "./vdom"
import { isPrimitive, merge } from "./utils"

export default function (options) {
	var model = options.model
	var view = options.view

	var actions = {}
	var effects = options.effects || {}
	var reducers = options.reducers || options.update || {}

	var subs = options.subscriptions

	var router = options.router || Function.prototype

	var node
	var root

	var hooks = merge({
		onAction: Function.prototype,
		onUpdate: Function.prototype,
		onError: function (err) {
			throw err
		}
	}, options.hooks)

	for (var name in merge(reducers, effects)) {
		(function (name) {
			actions[name] = function (data) {
				hooks.onAction(name, data)

				var effect = effects[name]
				if (effect) {
					return effect(model, actions, data, hooks.onError)
				}

				var update = reducers[name], _model = model
				render(model = merge(model, update(model, data)), view, node)

				hooks.onUpdate(_model, model, data)
			}
		}(name))
	}

	ready(function () {
		root = options.root || document.body.appendChild(document.createElement("div"))

		if (typeof view === "function") {
			render(model, view)
		}

		router(function (newView) {
			render(model, view = newView ? newView : view, node)
		}, options)

		for (var key in subs) {
			subs[key](model, actions, hooks.onError)
		}
	})

	function ready(cb) {
		if (document.readyState !== "loading") {
			cb()
		} else {
			document.addEventListener("DOMContentLoaded", cb)
		}
	}

	function render(model, view, lastNode) {
		patch(root, node = view(model, actions), lastNode, 0)
	}
}
