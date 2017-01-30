(function() {
	/***
	 *  @property currentScript
	 *  @property SecurityPolicyViolationEvent
	 */
	let devtools = {
		/*
		 Contains various shared items across devtools
		 */
		target: window,
		config: {
			/*console: {
				 history: [{
					 type: 'user',
					 value: [{
						 innerText: 'console.log("test")',
						 cursorPos: 0
					 }]
				 }]
			 }*/
		},
		modules: {
			global: {
				exit: function() {
				},
				events: {
					shutdown: []
				},
				elements: {
					devtoolsFrame: document.createElement('div'),
					allDevtoolsContainer: document.createElement('div')
				},
				snap: function(directions) {
				},
				querySnappedStatus: function() {
					return {
						top: true,
						left: true,
						bottom: true,
						right: true
					};
				}
			},
			inspector: {
				init: function(/*VM*/) {
					throw new Error('Inspector improperly initialized!');
				},
				events: {
					shutdown: []
				},
				title: 'Elements',
				focus: {
					temporary: [],
					persistent: []
				}
			},
			console: {
				init: function(/*VM*/) {
					throw new Error('Console improperly initialized!');
				},
				events: {
					shutdown: []
				},
				callCommand: function(/*consoleCommand*/) {
					return function() {
					};
				},
				title: 'Console',
				focus: {
					temporary: [],
					persistent: []
				},
				eval: function(cmd, callback) {
					callback(eval.call(window, cmd));
				}
			}
		},
		mode: document.currentScript ? 'embedded' : 'injected'
	};
	devtools.modules.inspector.init = function(VM) {
		let model;
		let view;
		let controller;
		model = {
			init: {
				init: function() {
					model.init.initGlobalData();
				},
				initGlobalData: function() {
					devtools.config.inspector = devtools.config.inspector || {
							showInspector: true /* Shouldn't really be a reason to turn this on, except for shits n giggles */
						};
				},
				styles: `
					div#domAnalyzer {
						-webkit-user-select: none;
						cursor: default;
						display: flex;
						flex-direction: column;
						position: relative;
						overflow-x: hidden;
					}
					div#domAnalyzer > div.newLevel {
						padding-left: 0;
					}
					div#domAnalyzer > span.htmlManifest {
						padding-left: 16px;
						color: #9E9E9E;
					}
					div#domAnalyzer span, div#domAnalyzer pre{
						letter-spacing: -.05em;
					}
					div#domAnalyzer div.newLevel {
						display: flex;
						flex-direction: column;
						padding-left: 14px;
					}
					div#domAnalyzer div.newLevel > :not(.wrapper) {
						padding-left: 14px;
					}
					div#domAnalyzer div.wrapper {
						display: flex;
					}
					div#domAnalyzer div.wrapper div.innerWrapper {
						display: inline;
						width: 100%;
					}
					div#domAnalyzer div.domElementActiveSlider {
						background-color: #1565C0;
						left: 0;
						top: 0;
						height: 0px;
						position: absolute;
						transform: translateY(0px);
						transition: transform ease-in-out 80ms, height ease-in-out 80ms;
						width: 100%;
						z-index: -1;
					}
					div#domAnalyzer svg.expandingArrow {
						cursor: pointer;
						display: inline-block;
						fill: #424242;
						max-height: 14px;
						max-width: 14px;
						min-height: 14px;
						min-width: 14px;
						transform: rotate(0deg);
						transition: transform 100ms ease-out;
					}
					div#domAnalyzer div.highContrast svg.expandingArrow {
						fill: white;
						transition: fill 100ms ease-in-out, transform 100ms ease-out;
					}
					div#domAnalyzer svg.expandingArrow.objectCollapsed {
						transform: rotate(-90deg);
					}
					div#domAnalyzer .highContrast svg.expandingArrow {
						fill: white;
						transition: fill 100ms ease-in-out;
					}
					div#domAnalyzer div.onelineWrapper > * {
						display: inline-block;
					}
					div#domAnalyzer div.onelineWrapper > * > * {
						display: inline-block;
					}
					div#domAnalyzer span.gap {
						color: black;
						letter-spacing: -.3em;
					}
					div#domAnalyzer .highContrast span.gap {
						color: white;
						transition: color 100ms ease-in-out;
					}
					div#domAnalyzer span.gap + span.lineElementDescriptor {
						padding-left: 3px;
					}
					div#domAnalyzer span.tagName {
						color: #6A1B9A;
					}
					div#domAnalyzer .highContrast span.tagName:not(.currentlyEditing) {
						color: white;
						transition: color 100ms ease-in-out;
					}
					div#domAnalyzer span.lineElementDescriptor span.equalsAtribute {
						padding: 0 2px 0 2px;
					}
					div#domAnalyzer span.lineElementDescriptor > * {
						display: inline-block;
						word-break: break-all;
					}
					div#domAnalyzer span.lineElementDescriptor span.attributeName {
						color: #D84315;
						padding-left: 5px;
						transition: color 100ms ease-in-out;
					}
					div#domAnalyzer .highContrast span.lineElementDescriptor span.attributeName:not(.currentlyEditing) {
						color: white;
					}
					div#domAnalyzer span.lineElementDescriptor span.attributeValue {
						color: #3F51B5;
						transition: color 100ms ease-in-out;
					}
					div#domAnalyzer .highContrast span.lineElementDescriptor span.attributeValue:not(.currentlyEditing) {
						color: white;
					}
					div#domAnalyzer pre.innerText {
						color: black;
						display: inline;
						margin: 0;
						transition: color 100ms ease-in-out;
						padding: 0;
						background: none;
					}
					div#domAnalyzer .highContrast pre.innerText :not(.currentlyEditing) {
						color: white;
					}
					div#domAnalyzer .highContrast span.currentlyEditing {
						background-color: white;
						border: #9E9E9E solid 1px;
						-webkit-user-modify: read-write-plaintext-only;
					}
				`
			}
		};
		controller = {
			init: {
				init: function() {
					model.init.init();
					view.init.init();
				},
				getCSS: function() {
					return model.init.styles;
				}
			},
			filterEligibleChildren: function(elements) {
				let children = [];
				if (devtools.config.inspector.showInspector) {
					children = elements.children;
				} else {
					for (let i = 0, ii = elements.children.length; i != ii; i++) {
						if (!devtools.modules.global.elements.allDevtoolsContainer.contains(elements.children[i])) {
							children.push(elements.children[i]);
						}
					}
				}
				children.innerHTML = elements.children.length ? '' : elements.innerHTML || '';
				children.innerText = elements.children.length ? '' : elements.innerText || '';
				for (let i = 0, ii = children.length; i != ii; i++) {
					children.innerHTML += children[i].innerHTML;
					children.innerText += children[i].innerText;
				}
				children.parent = elements;
				return children;
			}
		};
		view = {
			panes: {
				domAnalyzer: document.createElement('div')
			},
			init: {
				init: function() {
					this.loadCSS();
					view.domAnalyzer.init.init(view.panes.domAnalyzer);
				},
				loadCSS: function() {
					let styleElem = document.createElement('style');
					styleElem.innerHTML = controller.init.getCSS();
					VM.appendChild(styleElem);
				}
			},
			makeEditable: function(props) {
				let editFunc = function() {
					props.elem.setAttribute('contenteditable', '');
					props.elem.setAttribute('autocomplete', 'off');
					props.elem.setAttribute('autocorrect', 'off');
					props.elem.setAttribute('autocapitalize', 'off');
					props.elem.setAttribute('spellcheck', 'false');
					props.elem.classList.add('currentlyEditing');
					props.elem.focus();
					let range = document.createRange();
					range.selectNodeContents(props.elem);
					let sel = window.getSelection();
					sel.removeAllRanges();
					sel.addRange(range);
				}.bind(this);
				let applyFunc = function() {
					props.elem.removeAttribute('contenteditable');
					props.elem.removeAttribute('autocomplete');
					props.elem.removeAttribute('autocorrect');
					props.elem.removeAttribute('autocapitalize');
					props.elem.removeAttribute('spellcheck');
					props.elem.classList.remove('currentlyEditing');
					if (props.equivElem) {
						props.equivElem.innerText = props.elem.innerText;
					}
					props.callback(props.elem.innerText);
				}.bind(this);
				let observer = new MutationObserver(function() {
					view.domAnalyzer.slider.shiftFocus(view.domAnalyzer.slider.currentFocus);
					if (props.elem.innerText.includes('\n')) {
						props.elem.innerText = props.elem.innerText.split('\n').join('');
						applyFunc();
					}
				});
				/*
				 @XXX: Not unregistered
				 */
				props.elem.addEventListener('dblclick', editFunc);
				/*
				 @XXX: Not unregistered
				 */
				props.elem.addEventListener('blur', applyFunc);
				/*
				 @XXX: Not unregistered
				 */
				observer.observe(props.elem, {
					attributes: true,
					childList: true,
					characterData: true
				});
			},
			domAnalyzer: {
				init: {
					init: function(pane) {
						pane.id = 'domAnalyzer';
						let manifest = view.domAnalyzer.init.initHTMLManifest();
						let doc = view.domAnalyzer.elemToString(document.documentElement);
						view.domAnalyzer.toTree(view.panes.domAnalyzer, doc);
						VM.appendChild(pane);
						manifest.click();
					},
					initHTMLManifest: function() {
						let manifest = view.domAnalyzer.init.getHTMLManifestTag();
						let fn = view.domAnalyzer.slider.shiftFocus.bind(this, manifest);
						manifest.addEventListener('click', fn);
						devtools.modules.inspector.events.shutdown.push(function() {
							manifest.removeEventListener('click', fn);
						}.bind(this));
						view.panes.domAnalyzer.appendChild(manifest);
						view.domAnalyzer.slider.init();
						return manifest;
					},
					getHTMLManifestTag: function() {
						let manifest = document.createElement('span');
						manifest.className = 'htmlManifest';
						if (document.doctype) {
							manifest.innerText = '<!DOCTYPE ' + document.doctype.name + (document.doctype.name.publicId ? ' PUBLIC "' +
									document.doctype.publicId + '"' : '') + (!document.doctype.publicId && document.doctype.systemId ? ' SYSTEM' : '') +
								(document.doctype.systemId ? ' "' + document.doctype.systemId + '"' : '') + '>';
						} else {
							if (document.compatMode == 'BackCompat') {
								manifest.innerText = '/* Quirks Mode */';
							} else {
								manifest.innerText = '/* Unknown Doctype */';
							}
						}
						return manifest;
					}
				},
				elemToString: function(elem) {
					let selfClosing = elem.outerHTML.indexOf('/>') == elem.outerHTML.length - 2;
					let str1 = document.createElement('span');
					str1.className = 'lineElementDescriptor';
					let openAngle = document.createElement('span');
					openAngle.innerText = '<';
					openAngle.style.color = '#6A1B9A';
					str1.appendChild(openAngle);
					let tag = document.createElement('span');
					let closeTag = document.createElement('span');
					tag.innerText = elem.tagName.toLowerCase();
					tag.className = 'tagName';
					if (![document.documentElement, document.body, document.head].includes(elem)) {
						view.makeEditable({
							elem: tag,
							equivElem: closeTag,
							callback: function(val) {
							}
						});
					}
					str1.appendChild(tag);
					for (let i = 0, ii = elem.attributes.length; i != ii; i++) {
						let attribute = document.createElement('span');
						attribute.className = 'attributeName';
						let name = elem.attributes[i].name;
						let value = elem.attributes[i].value;
						attribute.innerText = name;
						view.makeEditable({
							elem: attribute,
							callback: function(val) {
								elem.removeAttribute(name);
								elem.setAttribute(val, value || '');
								name = val;
							}
						});
						str1.appendChild(attribute);
						if (value) {
							let black = document.createElement('span');
							black.className = 'equalsAtribute';
							black.innerText = '=';
							str1.appendChild(black);
							let openQuote = document.createElement('span');
							openQuote.className = 'quote';
							openQuote.innerText = '"';
							str1.appendChild(openQuote);
							let val = document.createElement('span');
							val.innerText = value;
							val.className = 'attributeValue';
							view.makeEditable({
								elem: val,
								callback: function(val) {
									elem.setAttribute(name, val);
									value = val;
								}
							});
							str1.appendChild(val);
							let closeQuote = document.createElement('span');
							closeQuote.className = 'quote';
							closeQuote.innerText = '"';
							str1.appendChild(closeQuote);
						}
					}
					let closeAngle = document.createElement('span');
					closeAngle.innerText = selfClosing ? '/>' : '>';
					closeAngle.style.color = '#6A1B9A';
					str1.appendChild(closeAngle);
					let str0 = document.createElement('span');
					str0.className = 'gap';
					str0.innerText = '...';
					let str2 = document.createElement('span');
					str2.className = 'lineElementDescriptor';
					let openCloseAngle = document.createElement('span');
					openCloseAngle.innerText = '</';
					openCloseAngle.style.color = '#6A1B9A';
					str2.appendChild(openCloseAngle);
					closeTag.innerText = elem.tagName.toLowerCase();
					closeTag.className = 'tagName';
					if (![document.documentElement, document.body, document.head].includes(elem)) {
						view.makeEditable({
							elem: closeTag,
							equivElem: tag,
							callback: function(val) {
							}
						});
					}
					str2.appendChild(closeTag);
					let closeCloseAngle = document.createElement('span');
					closeCloseAngle.innerText = '>';
					closeCloseAngle.style.color = '#6A1B9A';
					str2.appendChild(closeCloseAngle);
					return {
						open: str1,
						gap: selfClosing ? null : str0,
						close: selfClosing ? null : str2,
						element: elem
					};
				},
				elemToPlainString: function(elemArray) {
					let txt = document.createElement('pre');
					txt.className = 'innerText';
					let _txt = document.createElement('span');
					view.makeEditable({
						elem: _txt,
						callback: function(val) {
							elemArray.parent.innerHTML = val;
						}
					});
					_txt.innerText = elemArray.innerHTML.trim();
					txt.appendChild(_txt);
					return txt;
				},
				toTree: function(parent, props) {
					let newLevel = document.createElement('div');
					newLevel.className = 'newLevel';
					let children;
					try {
						children = controller.filterEligibleChildren(props.element);
					} catch (err) {
						children = [];
					}
					let outerWrapper = document.createElement('div');
					let wrapper = document.createElement('div');
					/*
					 assert getReasonFor(children.length > 0) == "Because that it is impossible to display zero children";
					 assert getReasonFor(children.innerHTML.includes('\n')) == "Because that a rogue document could just have \n\n\n\n\n\n..., but even one <br> could harm user experience";
					 assert getReasonFor(children.innerHTML != children.innerText) == "Because that we need to detect when elements/something_other_than_text_nodes exists";
					 assert getReasonFor(children.innerHTML.trim().length > 30) == "Because that ultra-long innerTexts can be laggy and can be abused by malicious documents";
					 */
					let isExpandable = children.length || children.innerHTML.includes('\n') || children.innerHTML != children.innerText || children.innerHTML.trim().length > 30;
					if (isExpandable) {
						outerWrapper.className = 'wrapper';
						wrapper.className = 'innerWrapper';
						let tree = view.domAnalyzer.getTreeExpander();
						let expandFunc = function(e) {
							e.stopPropagation();
							tree.classList.toggle('objectCollapsed');
							if (tree.classList.contains('objectCollapsed')) {
								/* Collapse the tree */
								for (let i = newLevel.children.length - 1; i-- !== 1;) {
									newLevel.removeChild(newLevel.children[i]);
								}
								if (props.close) {
									wrapper.appendChild(props.gap);
									wrapper.appendChild(props.close);
								}
							} else {
								/* Expand the tree */
								wrapper.removeChild(props.close);
								wrapper.removeChild(props.gap);
								if (children.length) {
									for (let i = 0, ii = children.length; i != ii; i++) {
										view.domAnalyzer.toTree(newLevel, view.domAnalyzer.elemToString(children[i]));
									}
								} else {
									let pseudoNewLevel = document.createElement('div');
									pseudoNewLevel.className = 'newLevel';
									pseudoNewLevel.appendChild(view.domAnalyzer.elemToPlainString(children));
									newLevel.appendChild(pseudoNewLevel);
								}
								newLevel.appendChild(props.close);
							}
							view.domAnalyzer.slider.repositionIfNecessary(wrapper);
						}.bind(this);
						/*
						 @XXX: Not Removed
						 */
						tree.addEventListener('click', expandFunc);
						outerWrapper.appendChild(tree);
					} else {
						outerWrapper.className = 'onelineWrapper';
						props.gap = view.domAnalyzer.elemToPlainString(children);
					}
					/*
					 @XXX: Not Removed
					 */
					outerWrapper.addEventListener('click', view.domAnalyzer.slider.shiftFocus.bind(this, outerWrapper));
					/*
					 @XXX: Not Removed
					 */
					wrapper.addEventListener('click', view.domAnalyzer.slider.shiftFocus.bind(this, wrapper));
					wrapper.appendChild(props.open);
					if (props.close) {
						wrapper.appendChild(props.gap);
						wrapper.appendChild(props.close);
						if (isExpandable) {
							/*
							 @XXX: Not Removed
							 */
							props.close.addEventListener('click', view.domAnalyzer.slider.shiftFocus.bind(this, props.close));
						}
					}
					outerWrapper.appendChild(wrapper);
					newLevel.appendChild(outerWrapper);
					parent.appendChild(newLevel);
				},
				getTreeExpander: function() {
					let treeExpander = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
					treeExpander.innerHTML = '<path d="M0 6l5 5 5-5z"></path>';
					treeExpander.setAttribute('fill', '#000000');
					treeExpander.setAttribute('height', '14');
					treeExpander.setAttribute('width', '14');
					treeExpander.setAttribute('viewBox', '0 0 12 16');
					treeExpander.setAttribute('class', 'expandingArrow objectCollapsed');
					return treeExpander;
				},
				slider: {
					slider: document.createElement('div'),
					currentFocus: null,
					currentFocusParent: null,
					init: function() {
						this.slider.className = 'domElementActiveSlider';
						view.panes.domAnalyzer.appendChild(this.slider);
						let fn = function(e) {
							e.detail.then(function() {
								view.domAnalyzer.slider.shiftFocus(view.domAnalyzer.slider.currentFocus);
							}.bind(this));
						};
						devtools.modules.global.elements.devtoolsFrame.addEventListener('beforeresize', fn);
						devtools.modules.inspector.events.shutdown.push(function() {
							devtools.modules.global.elements.devtoolsFrame.removeEventListener('beforeresize', fn);
						}.bind(this));
					},
					shiftFocus: function(elemRow) {
						if (view.domAnalyzer.slider.currentFocus) {
							view.domAnalyzer.slider.currentFocus.classList.remove('highContrast');
						}
						view.domAnalyzer.slider.currentFocus = elemRow;
						view.domAnalyzer.slider.currentFocusParent = elemRow.parentNode;
						elemRow.classList.add('highContrast');
						view.domAnalyzer.slider.slider.style.transform = 'translateY(' + elemRow.offsetTop + 'px)';
						view.domAnalyzer.slider.slider.style.height = elemRow.offsetHeight + 'px';
					},
					repositionIfNecessary: function(elem) {
						if (view.domAnalyzer.slider.currentFocus.parentNode == view.domAnalyzer.slider.currentFocusParent && view.panes.domAnalyzer.contains(view.domAnalyzer.slider.currentFocus)) {
							/* Reapply highlighter if DOM is collapsed and parentNode has changed */
							view.domAnalyzer.slider.shiftFocus(view.domAnalyzer.slider.currentFocus);
						} else {
							/* Shift highlighter to top of collapsed parent */
							view.domAnalyzer.slider.shiftFocus(elem);
						}
					}
				}
			}
		};
		devtools.modules.inspector.focus.temporary.push(function() {
			try {
				controller.init.init();
			} catch (err) {
				console.error(err);
			}
		});
	};
	devtools.modules.console.init = function(VM) {
		/*
		 Initializes the console section of devtools.
		 */
		let model;
		let view;
		let controller;
		model = {
			init: {
				init: function() {
					let overrides = model.overrides;
					Object.keys(overrides).forEach(function(i) {
						overrides[i].element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
						overrides[i].element.setAttribute('class', 'vectorDrawablePrefix');
						if (overrides[i].innerHTML) {
							overrides[i].element.innerHTML = overrides[i].innerHTML;
							let _attr = Object.keys(overrides[i].attributes);
							for (let ii of _attr) {
								overrides[i].element.setAttribute(ii, overrides[i].attributes[ii]);
							}
						}
						if (Array.isArray(overrides[i].replace)) {
							overrides[i].original = overrides[i].replace[0][overrides[i].replace[1]];
							overrides[i].replace[0][overrides[i].replace[1]] = function() {
								let colors = [];
								if (overrides[i].color) {
									colors.push(overrides[i].color);
									for (let ii = 0; ii != arguments.length; ii++) {
										colors.push(overrides[i].color);
									}
								} else {
									for (let i of arguments) {
										colors.push(model.dataTypes.colorize(i));
									}
								}
								model.storage.history.add(arguments, 'log');
								controller.log({
									message: Array.from(arguments),
									color: colors,
									background: overrides[i].backgroundColor,
									preIcon: overrides[i].element.cloneNode(true)
								});
								overrides[i].original.apply(console, arguments);
							}.bind(this);
						}
					});
					model.init.hookError();
					devtools.modules.console.callCommand = function(cmd) {
						if (model.overrides[cmd]) {
							return model.overrides[cmd].onCall;
						}
						return -1;
					};
					model.init.startPlugins.call(this);
				},
				hookError: function() {
					Error.stackTraceLimit = Infinity;
					try {
						Object.defineProperty(window, 'onerror', {
							value: function(message, source, lineno, colno, error) {
								console.error(error || message);
							},
							writable: false,
							configurable: false
						});
					} catch (err) {
						console.warn('Unable to hook onto window.onerror, external script errors may not be caught.');
					}
					let errFuncEvt = console.error;
					window.addEventListener('error', errFuncEvt);
					devtools.modules.console.events.shutdown.push(function() {
						window.removeEventListener('beforeresize', errFuncEvt);
					}.bind(this));
				},
				startPlugins: function() {
					let _plugins = Object.keys(model.plugins);
					_plugins.forEach(function(i) {
						if (model.plugins[i].init) {
							try {
								model.plugins[i].init();
							} catch (err) {
								console.error(err);
							}
						}
					});
				},
				commonJavascriptKeywords: {
					'var': true,
					'let': true,
					'const': true,
					'class': true,
					'function': true,
					'return': true,
					'if': true,
					'else': true,
					'switch': true,
					'break': true,
					'continue': true,
					'default': true,
					'for': true,
					'in': true,
					'of': true,
					'do': true,
					'while': true,
					'try': true,
					'catch': true,
					'throw': true,
					'finally': true,
					'yield': true,
					'with': true,
					'extends': true,
					'debugger': true,
					'delete': true,
					'null': true,
					'void': true
				}
			},
			styles: `
				div#bodyArea {
					overflow-y: auto;
					overflow-x: hidden;
					word-break: break-all;
					padding-bottom: 5px;
				}
				div#bodyArea #logArea {
					display: flex;
					flex-direction: column;
				}
				div#bodyArea #logArea .logMessageWrapper {
					border-bottom: solid 0.1vh #E0E0E0;
					display: flex;
					text-overflow: ellipsis;
					overflow: hidden;
					cursor: default;
					min-height: 17px;
				}
				div#bodyArea #logArea div.expanded {
					overflow: auto;
					overflow-wrap: break-word;
					white-space: normal;
				}
				div#bodyArea #logArea div.expandableList {
					cursor: pointer;
				}
				div#bodyArea .greaterThanArrow {
					display: inline-block;
					margin-left: 5px;
					margin-right: 7px;
					min-width: 16px;
					max-width: 16px;
					font-size: 1em;
					color: #616161;
					cursor: default;
					-webkit-user-select: none;
				}
				div#bodyArea .vectorDrawablePrefix {
					min-width: 16px;
					max-width: 16px;
					min-height: 16px;
					max-height: 16px;
					margin-left: 2px;
					margin-right: 10px;
				}
				div#bodyArea .outputArrow {
					display: inline-block;
					margin-left: 5px;
					margin-right: 7px;
					min-width: 16px;
					max-width: 16px;
					font-size: 1em;
					letter-spacing: -2px;
					color: #616161;
				}
				.multiMessageWrapper {
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 3;
					text-overflow: ellipsis;
					padding: 1px;
				}
				.multiMessageWrapper div {
					display: inline-block;
					min-width: 8px;
				}
				div#bodyArea .multiMessageWrapper div.objTree {
					display: inline-flex;
					flex-direction: row;
					justify-content: center;
					-webkit-user-select: none;
					word-break: initial;
				}
				div#bodyArea .multiMessageWrapper div.objTree div {
					display: flex;
				}
				div#bodyArea div.objTree.expanded {
					display: flex;
					flex-direction: column;
				}
				div#bodyArea div.objTree div div.centerer {
					display: flex;
					flex-direction: column;
					justify-content: center;
					min-width: 14px;
					padding-right: 3px;
					cursor: pointer;
				}
				div#bodyArea svg.expandingArrow {
					min-height: 14px;
					max-height: 14px;
					min-width: 14px;
					max-width: 14px;
					display: inline-block;
					transform: rotate(0deg);
					transition: transform 200ms ease-out;
				}
				div#bodyArea svg.expandingArrow.objectCollapsed {
					transform: rotate(-90deg);
				}
				div#bodyArea div.objTree.expanded div.brancher {
					display: flex;
					flex-direction: column;
					padding-left: 18px;
				}
				div#bodyArea div.flexBoxContainer {
					display: inline-flex;
					flex-direction: row;
					overflow: hidden;
					max-width: 100%;
					width: 100%;
				}
				div#bodyArea div.flexBoxContainer .greaterThanArrow.active {
					color: #2196F3;
					font-weight: bold;
				}
				div#bodyArea div.flexBoxContainer span#inputAreaContainer {
					display: inline;
					width: 100%;
				}
				div#bodyArea div.flexBoxContainer span#inputAreaContainer span#inputArea {
					height: auto;
					outline: none;
					z-index: 1;
					padding: 1px;
					padding-right: 0;
					word-wrap: break-word;
					-webkit-user-modify: read-write-plaintext-only;
					-webkit-line-break: after-white-space;
					font-size: small;
					border: none;
					display: inline-block;
				}
				div#bodyArea div.flexBoxContainer span#inputAreaContainer span#suggestionsEngine {
					all: initial;
					height: auto;
					opacity: .5;
					color: #000000;
					padding: 1px;
					padding-left: 0;
					font-family: consolas, sans-serif;
					font-size: small;
				}
				div#allDevtoolsContainer div.allSuggestionsChooser {
					overflow-y: auto;
					max-height: 350px;
					display: flex;
					flex-direction: column;
					box-shadow: 0 0 10px #616161;
					width: max-content;
					position: absolute;
					background-color: #F5F5F5;
					-webkit-user-select: none;
				}
				div#allDevtoolsContainer div.allSuggestionsChooser div {
					border-bottom: solid 1px #E0E0E0;
					padding: 3px;
					cursor: pointer;
				}
				div#allDevtoolsContainer div.allSuggestionsChooser div.active {
					background-color: #BDBDBD;
				}
			`,
			dataTypes: {
				exceptions: [
					Error,
					EvalError,
					RangeError,
					ReferenceError,
					SyntaxError,
					TypeError,
					URIError,
					window.SecurityPolicyViolationEvent
				],
				colorize: function(typeObj) {
					switch (typeof typeObj) {
						case 'boolean':
						case 'number':
						case 'function':
							return '#3F51B5';
						case 'undefined':
							return '#9E9E9E';
						case 'string':
							return '#E53935';
					}
					if (typeObj === null) {
						return '#9E9E9E';
					}
					if (Array.isArray(typeObj)) {
						return '#3F51B5';
					}
					return 'black';
				}
			},
			overrides: {
				info: {
					replace: [console, 'info'],
					backgroundColor: 'white',
					innerHTML: `
						<path d="M0 0h24v24H0z" fill="none"/>
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
					`,
					attributes: {
						class: 'vectorDrawablePrefix',
						fill: '#2962FF',
						height: '16',
						width: '16',
						viewBox: '0 0 24 24',
						xmlns: 'http://www.w3.org/2000/svg'
					}
				},
				log: {
					replace: [console, 'log'],
					backgroundColor: 'white'
				},
				warn: {
					replace: [console, 'warn'],
					backgroundColor: '#FFF9C4',
					innerHTML: `
						<path d="M0 0h24v24H0z" fill="none"/>
						<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
					`,
					attributes: {
						class: 'vectorDrawablePrefix',
						fill: '#FFC107',
						height: '16',
						width: '16',
						viewBox: '0 0 24 24',
						xmlns: 'http://www.w3.org/2000/svg'
					}
				},
				error: {
					replace: [console, 'error'],
					backgroundColor: '#FFCDD2',
					color: '#B71C1C',
					innerHTML: `
						<path d="M0 0h24v24H0z" fill="none"/>
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
					`,
					attributes: {
						class: 'vectorDrawablePrefix',
						fill: '#D50000',
						height: '16',
						width: '16',
						viewBox: '0 0 24 24',
						xmlns: 'http://www.w3.org/2000/svg'
					}
				},
				tree: {
					innerHTML: `
						<path d="M7 10l5 5 5-5z"/>
						<path d="M0 0h24v24H0z" fill="none"/>
					`,
					attributes: {
						class: 'objectCollapsed',
						fill: '#000000',
						height: '24',
						width: '24',
						viewBox: '0 0 24 24',
						xmlns: 'http://www.w3.org/2000/svg'
					}
				}
			},
			storage: {
				history: {
					history: {
						user: [],
						response: [],
						error: [],
						log: []
					},
					add: function(entry, type) {
						model.storage.history.history[type].push(entry);
					},
					get: function(pos, grp, direction) {
						/*
						 // pos is inversed.
						 if (data == ['1', '2']) {
						 get(1) == '2';
						 }
						 */
						let _pos = model.storage.history.history[grp].length - pos;
						let tooHigh = pos < 1;
						let tooLow = _pos < 0;
						if (tooHigh) {
							if (_pos == model.storage.history.history[grp].length) {
								if (direction > 0) {
									model.storage.history.browsing = false;
									return model.storage.history.temp;
								}
							}
							return -1;
						}
						if (tooLow) {
							return -1;
						}
						return model.storage.history.history[grp][_pos];
					},
					temp: {
						cursorPos: 0,
						innerText: null
					},
					queuePos: 0,
					browsing: false
				}
			},
			plugins: {
				'pm': {
					init: function() {
						controller.log({
							message: Object.keys(model.plugins).length + ' custom plugins loaded, type "pm --list" to view.',
							type: 'output',
							color: '#9E9E9E',
							unquot: true
						});
						Object.keys(model.plugins).forEach(function(item) {
							model.plugins.pm.args.disable[item] = true;
						});
					},
					args: {
						'--list': true,
						'--help': true,
						'disable': {
							/* plugins go here */
						}
					},
					onCall: function(resolve, reject, args) {
						let usage = 'Usage: pm option [plugin]\n' +
							'Lists, disables, and adds plugins\n\n' +
							'Mandatory arguments:\n' +
							'    --help          Displays this help section\n' +
							'    --list          Lists all plugins\n' +
							'    disable X Y     Disables plugins X and Y\n\n' +
							'Plugins can also be executed within a script with modules.console.callCommand("cmd")("argument1", "argument2")';
						if (args.length > 0) {
							if (args.length == 1 && args[0] == '--list') {
								resolve(['Tip: treat these commands like as if they are in a terminal.\ncommands: ', Object.keys(model.plugins)]);
							} else if (args.length == 1 && args[0] == '--help') {
								resolve(usage);
							} else if (args[0] == 'disable') {
								if (args.length == 1) {
									reject('Usage: pm disable program1[, program2]\n\tDisables plugin "program1"[ and "program2"].');
								} else if (args.length > 1) {
									for (let i = 1, ii = args.length; i != ii; i++) {
										reject('Feature not implemented yet... :/');
									}
								}
							}
						}
						reject(usage);
					}
				},
				'embeddedDetector': {
					init: function() {
						if (document.currentScript && document.currentScript.getAttribute('embeddedDetector')) {
							let config = document.currentScript.getAttribute('embeddedDetector');
							if (config.includes('snap')) {
								controller.log({
									message: 'Running in embedded script mode, snapping to configuration...',
									type: 'output',
									color: '#9E9E9E',
									unquot: true
								});
								let snapCfg = {
									left: config.includes('left'),
									right: config.includes('right'),
									top: config.includes('top'),
									bottom: config.includes('bottom')
								};
								devtools.modules.global.snap(snapCfg);
							}
							document.currentScript.removeAttribute('embeddedDetector');
							document.currentScript.parentNode.removeChild(document.currentScript);
						}
					}
				},
				'enableEval': {
					init: function() {
						window.evalDisabled = true;
						this.key = Math.random();
						try {
							controller._eval('window.evalDisabled = false;', function() {
								if (window.evalDisabled) {
									controller.log({
										message: 'Some websites or extensions may block eval, which is required to run code. Type enableEval re-enable.',
										type: 'output',
										color: '#9E9E9E',
										unquot: true
									});
									controller.history.push('enableEval', 'user');
								}
							}.bind(this));
						} catch (err) {
							controller.log({
								message: 'Some websites or extensions may block eval, which is required to run code. Type enableEval re-enable.',
								type: 'output',
								color: '#9E9E9E',
								unquot: true
							});
							controller.history.push('enableEval', 'user');
						}
					},
					onCall: function(resolve, reject) {
						console.log('Waiting for user consent...');
						window.webkitStorageInfo.requestQuota(window.PERSISTENT, 1024 * 1024, function(grantedBytes) {
							window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, function(fs) {
								let entrypointName = '_devTools';
								while (window[entrypointName]) {
									entrypointName = '_' + entrypointName;
								}
								Object.defineProperty(window, entrypointName, {
									value: function(command, key) {
										if (key == this.key) {
											/* Can easily be hacked */
											this.key = Math.random();
											let response = command.call(devtools);
											if (typeof response == 'undefined' && !command.toString().includes('return ')) {
												view.log.log({
													message: 'No Return Statement',
													color: '#9E9E9E',
													background: 'white',
													type: 'output',
													unquot: true
												});
											} else {
												console.log(response);
											}
										} else {
											throw window.SecurityPolicyViolationEvent ? new window.SecurityPolicyViolationEvent('Nonmatching Keys.') : new Error('Security Exception: Nonmatching Keys.');
										}
									}.bind(this),
									writable: false,
									enumerable: false,
									configurable: false
								});
								devtools.modules.console.eval = function(command) {
									if (!command.includes('return ')) {
										let cmd = command.split(';');
										if (cmd[cmd.length - 1].trim() === '') {
											cmd.pop();
										}
										let last = 'return ' + cmd.pop();
										command = cmd.join(';') + last;
									}
									command = `try {
										window.` + entrypointName + `(function() {
											` + command + `
										}, ` + this.key + `);
									} catch (err) {
										console.error(err);
									}`;
									fs.root.getFile('evalScript.js', {create: true}, function(file) {
										let createFile = function() {
											fs.root.getFile('evalScript.js', {create: true}, function(file) {
												file.createWriter(function(fileWriter) {
													fileWriter.onwriteend = function() {
														let script = 'filesystem:' + location.origin;
														script += '/persistent/evalScript.js';
														let scriptElem = document.createElement('script');
														scriptElem.src = script;
														/*
														 @XXX: Not Removed
														 */
														scriptElem.addEventListener('error', function(err) {
															console.error(err);
														});
														document.body.appendChild(scriptElem);
													}.bind(this);
													fileWriter.onerror = console.error.bind(console);
													let blob = new Blob([command], {type: 'text/plain'});
													fileWriter.write(blob);
												}.bind(this), console.error);
											}.bind(this), console.error);
										}.bind(this);
										file.remove(createFile, console.error);
									}.bind(this), console.error);
								}.bind(this);
								resolve('Eval Re-enabled! You may have to enter "return myValue" in order for values to display.');
							}.bind(this), reject);
						}.bind(this), reject);
					}
				},
				'clear': {
					onCall: function(resolve, reject, args) {
						if (args.length !== 0) {
							reject('Unknown Args: ' + args.join(' '));
						} else {
							while (view.logArea.firstChild) {
								view.logArea.removeChild(view.logArea.firstChild);
							}
						}
					}
				},
				'exit': {
					onCall: function(resolve) {
						resolve('Broadcasting Exit Signal...');
						devtools.modules.global.exit();
					}
				},
				'reposition': {
					onCall: function(resolve, reject, args) {
						if (args.length !== 0) {
							reject('Unknown Args: ' + args.join(' '));
						} else {
							/*
							 @TODO: Use DispatchEvent instead of manually adjusting only for this VM
							 */
							let scrolledBottom = VM.scrollTop == view.bodyArea.scrollHeight - VM.clientHeight;
							let left = '25vw';
							let top = '25vh';
							let height = window.innerHeight / 2 + 'px';
							let width = window.innerWidth / 2 + 'px';
							devtools.modules.global.elements.devtoolsFrame.style.left = left;
							devtools.modules.global.elements.devtoolsFrame.style.top = top;
							devtools.modules.global.elements.devtoolsFrame.style.height = height;
							devtools.modules.global.elements.devtoolsFrame.style.width = width;
							if (scrolledBottom) {
								VM.scrollTop = view.bodyArea.scrollHeight;
							}
							resolve(['Repositioned to (', left, ' , ', top, '), ', height, ' * ', width, '.']);
						}
					}
				},
				'opacity': {
					args: {
						'--help': true,
						'0.1': true,
						'0.2': true,
						'0.3': true,
						'0.4': true,
						'0.5': true,
						'0.6': true,
						'0.7': true,
						'0.8': true,
						'0.9': true,
						'1.0': true
					},
					onCall: function(resolve, reject, args) {
						let usage = 'Usage: opacity [0 - 1]\nReturns the opacity of devtools\n\nArguments:\n--help    Displays this help section\n[0 - 1]   Changes the the opacity from 0% to 100%';
						if (args.length == 1) {
							if (args[0] == '--help') {
								resolve(usage);
							} else {
								let val = parseFloat(args[0]);
								if (val < 0) {
									throw new Error('Opacity cannot be negative.');
								}
								if (val > 1) {
									throw new Error('Opacity cannot be greater than 1 (100%).');
								}
								devtools.modules.global.elements.allDevtoolsContainer.style.opacity = val;
							}
						} else if (args.length !== 0) {
							reject('Too many arguments.\n' + usage);
						}
						resolve(parseFloat(devtools.modules.global.elements.allDevtoolsContainer.style.opacity) || 0.8);
					}
				},
				'google': {
					onCall: function(resolve, reject, args) {
						if (args.length === 0) {
							reject('Usage: google <search query>\nOpens a new tab that Googles the search query.');
						} else {
							let url = 'https://www.google.com/search?q=' + encodeURI(args.join(' '));
							window.open(url);
							resolve(['Opened Page: ', url]);
						}
					}
				},
				'destroyThisPage': {
					args: {
						'--help': true,
						'--confirm': true
					},
					onCall: function(resolve, reject, args) {
						let help = 'destroyThisPage --help\nDisplays this help dialogue\ndestroyThisPage --confirm\nDestroys windows, timeouts, intervals, and iframes (for this session).';
						if (args.length === 1) {
							if (args[0] == '--confirm') {
								(function(timeout, interval) {
									for (let i = 0; i <= timeout; i++) {
										clearTimeout(i);
									}
									for (let i = 0; i <= interval; i++) {
										clearInterval(i);
									}
								})(setTimeout(function() {}, 10), setInterval(function() {}, 10));
								(function(probe, _loc, freezeRay) {
									let whitelist = [window.location];
									let tried = [];
									let del = function(target) {
										probe(target).forEach(function(i) {
											try {
												if (!whitelist.includes(target[i])) {
													try {
														target[i] = undefined;
													} catch (err) {}
													try {
														delete target[i];
													} catch (err) {}
													if (target[i] && !tried.includes(target[i])) {
														tried.push(target[i]);
														del(target[i]);
													}
												}
											} catch (err) {}
										});
									};
									let iframes = document.querySelectorAll('iframe');
									for (let i = iframes.length; i--;) {
										try {
											del(iframes[i].contentWindow);
										} catch (err) {}
									}
									del(_loc);
									freezeRay(_loc);
								})(Object.getOwnPropertyNames, window, Object.freeze);
								resolve('Session destroyed!');
							} else if (args[0] == '--help') {
								resolve(help);
							}
						}
						reject(help);
					}
				}
			}
		},
			controller = {
				init: {
					init: function() {
						view.init.init();
						model.init.init();
					},
					getCSS: function() {
						return model.styles;
					}
				},
				history: {
					push: function(message, sector) {
						if (sector == 'user') {
							model.storage.history.browsing = false;
							model.storage.history.queuePos = 0;
						}
						if (model.storage.history.get(1, sector).innerText != message.innerText) {
							model.storage.history.add(message, sector);
						} else if (sector == 'user') {
							model.storage.history.get(1, 'user').cursorPos = message.cursorPos;
						}
					},
					getPreviousEntry: function(text, newPos) {
						if (!model.storage.history.browsing) {
							model.storage.history.browsing = true;
							model.storage.history.temp.innerText = text;
							model.storage.history.temp.cursorPos = view.inputArea.getPos();
						}
						let result = model.storage.history.get(++model.storage.history.queuePos, 'user', -1);
						if (result == -1) {
							model.storage.history.queuePos--;
						}
						return result;
					},
					getNextEntry: function(newPos) {
						let result = model.storage.history.get(--model.storage.history.queuePos, 'user', 1);
						if (result == -1) {
							model.storage.history.queuePos++;
						}
						return result;
					}
				},
				isException: function(msg) {
					return model.dataTypes.exceptions.includes(msg.constructor);
				},
				_eval: function(cmd, callback) {
					devtools.modules.console.eval(cmd, callback);
				},
				getCommand: function(command) {
					if (!command) {
						return Object.keys(model.plugins);
					}
					if (Object.keys(model.plugins).includes(command)) {
						return model.plugins[command].onCall || function(resolve, reject, strArgs) {
								reject('Command not executable!');
							};
					}
					return false;
				},
				getArgs: function(command) {
					return model.plugins[command].args || {};
				},
				getColor: function(data) {
					return model.dataTypes.colorize(data);
				},
				log: function() {
					view.log.log.apply(this, arguments);
				},
				getKeys: function(obj) {
					try {
						let keys = Object.getOwnPropertyNames(obj);
						for (let i in obj) {
							if (!keys.includes(i)) {
								keys.push(i);
							}
						}
						return keys;
					} catch (err) {
						return [];
					}
				},
				getCommonJavascriptKeywords: function() {
					return model.init.commonJavascriptKeywords;
				}
			},
			view = {
				init: {
					initialized: false,
					init: function() {
						view.init.loadCSS();
						view.init.loadElements();
						devtools.modules.console.focus.temporary.push(function() {
							view.suggestionsEngine.init(view.inputAreaContainer, view.inputArea);
							view.log.init();
						}.bind(this));
						devtools.modules.console.focus.persistent.push(function() {
							view.inputArea.focus();
						}.bind(this));
					},
					loadCSS: function() {
						let styleElem = document.createElement('style');
						styleElem.innerHTML = controller.init.getCSS();
						VM.appendChild(styleElem);
					},
					loadElements: function() {
						let bodyArea = document.createElement('div');
						bodyArea.id = 'bodyArea';
						let focusEvt = function() {
							view.inputArea.focus();
						};
						VM.addEventListener('click', focusEvt);
						devtools.modules.console.events.shutdown.push(function() {
							VM.removeEventListener('click', focusEvt);
						}.bind(this));
						let logArea = document.createElement('div');
						logArea.id = 'logArea';
						bodyArea.appendChild(logArea);
						view.logArea = logArea;
						let flexBoxContainer = document.createElement('div');
						flexBoxContainer.className = 'flexBoxContainer';
						let greaterThanArrow = document.createElement('div');
						greaterThanArrow.className = 'greaterThanArrow active';
						greaterThanArrow.innerText = '>   ';
						flexBoxContainer.appendChild(greaterThanArrow);
						let inputAreaContainer = document.createElement('span');
						inputAreaContainer.id = 'inputAreaContainer';
						let inputArea = document.createElement('span');
						inputArea.id = 'inputArea';
						inputArea.setAttribute('contenteditable', '');
						inputArea.setAttribute('spellcheck', 'false');
						let keypress = view.event.keypress.bind(this);
						inputArea.addEventListener('keypress', keypress);
						devtools.modules.console.events.shutdown.push(function() {
							inputArea.removeEventListener('keypress', keypress);
						}.bind(this));
						let keydown = view.event.keydown.bind(this);
						inputArea.addEventListener('keydown', keydown);
						devtools.modules.console.events.shutdown.push(function() {
							inputArea.removeEventListener('keydown', keydown);
						}.bind(this));
						(function() {
							let pos = 0;
							let consoleKey = function(e) {
								if (e.key == 'ControlLeft' || e.key == 'l' && e.ctrlKey) {
									e.stopPropagation();
									e.preventDefault();
									view.inputArea.setPos(pos);
								}
							}.bind(this);
							window.addEventListener('keydown', consoleKey);
							devtools.modules.console.events.shutdown.push(function() {
								window.removeEventListener('keydown', consoleKey);
							}.bind(this));
							let blurDetector = function() {
								pos = view.inputArea.getPos();
								if (!pos) {
									pos = 0;
								}
							}.bind(this);
							inputArea.addEventListener('blur', blurDetector);
							devtools.modules.console.events.shutdown.push(function() {
								inputArea.removeEventListener('blur', blurDetector);
							}.bind(this));
						})();
						inputArea.setPos = function(pos) {
							if (!this.firstChild) {
								return false;
							}
							try {
								let range = document.createRange();
								let sel = window.getSelection();
								range.setStart(this.firstChild, pos);
								range.collapse(true);
								sel.removeAllRanges();
								sel.addRange(range);
							} catch (err) {
								return false;
							}
							return true;
						}.bind(inputArea);
						inputArea.getPos = function() {
							let caretOffset = 0;
							let doc = inputArea.ownerDocument || inputArea.document;
							let win = doc.defaultView || doc.parentWindow;
							let sel;
							if (typeof win.getSelection != 'undefined') {
								sel = win.getSelection();
								if (sel.rangeCount > 0) {
									let range = win.getSelection().getRangeAt(0);
									let preCaretRange = range.cloneRange();
									preCaretRange.selectNodeContents(inputArea);
									preCaretRange.setEnd(range.endContainer, range.endOffset);
									caretOffset = preCaretRange.toString().length;
								}
							} else if ((sel = doc.selection) && sel.type != 'Control') {
								let textRange = sel.createRange();
								let preCaretTextRange = doc.body.createTextRange();
								preCaretTextRange.moveToElementText(inputArea);
								preCaretTextRange.setEndPoint('EndToEnd', textRange);
								caretOffset = preCaretTextRange.text.length;
							}
							return caretOffset;
						}.bind(this);
						inputAreaContainer.appendChild(inputArea);
						flexBoxContainer.appendChild(inputAreaContainer);
						view.inputAreaContainer = inputAreaContainer;
						bodyArea.appendChild(flexBoxContainer);
						VM.appendChild(bodyArea);
						view.inputArea = inputArea;
						view.bodyArea = bodyArea;
						view.logArea = logArea;
						let positionRetainer = function(e) {
							if (VM.scrollTop == view.bodyArea.scrollHeight - VM.clientHeight) {
								/* If the log area is already scrolled to the bottom, scroll to bottom after resize. */
								e.detail.then(function() {
									VM.scrollTop = view.bodyArea.scrollHeight;
								}.bind(this));
							}
						}.bind(this);
						devtools.modules.global.elements.devtoolsFrame.addEventListener('beforeresize', positionRetainer);
						devtools.modules.console.events.shutdown.push(function() {
							devtools.modules.global.elements.devtoolsFrame.removeEventListener('beforeresize', positionRetainer);
						}.bind(this));
					}
				},
				event: {
					keypress: function(e) {
						let cont = true;
						e.stopPropagation = function(stopProp) {
							stopProp.call(e);
							cont = false;
						}.bind(this, e.stopPropagation);
						Object.keys(view.event).forEach(function(item) {
							if (item && typeof view.event[item] == 'object') {
								if (cont && view.event[item].keypress) {
									view.event[item].keypress.call(view.event[item], e);
								}
							}
						});
					}.bind(this),
					keydown: function(e) {
						let cont = true;
						e.stopPropagation = function(stopProp) {
							stopProp.call(e);
							cont = false;
						}.bind(this, e.stopPropagation);
						Object.keys(view.event).forEach(function(item) {
							if (item && typeof view.event[item] == 'object') {
								if (cont && view.event[item].keydown) {
									view.event[item].keydown.call(view.event[item], e);
								}
							}
						});
					}.bind(this),
					suggestionsEngine: {
						allSuggestions: {},
						keydown: function(e) {
							if (e.key == 'Tab') {
								e.preventDefault();
								e.stopPropagation();
								view.inputArea.innerText += this.allSuggestions.currentSuggestion.element.innerText;
								view.inputArea.setPos(view.inputArea.innerText.length);
							} else if (e.key == 'ArrowUp' || e.key == 'ArrowDown') {
								if (!this.allSuggestions.modal) {
									return;
								}
								let switchSelection = false;
								if (e.key == 'ArrowUp') {
									if (this.allSuggestions.index-- === 0) {
										this.allSuggestions.modal.children[0].removeAttribute('class');
										this.allSuggestions.index = this.allSuggestions.eligible.length - 1;
									} else {
										this.allSuggestions.modal.children[this.allSuggestions.index + 1].removeAttribute('class');
										switchSelection = true;
									}
								} else if (e.key == 'ArrowDown') {
									if (++this.allSuggestions.index == this.allSuggestions.eligible.length) {
										this.allSuggestions.modal.children[this.allSuggestions.index - 1].removeAttribute('class');
										this.allSuggestions.index = 0;
									} else {
										this.allSuggestions.modal.children[this.allSuggestions.index - 1].removeAttribute('class');
										switchSelection = true;
									}
								}
								this.allSuggestions.modal.children[this.allSuggestions.index].className = 'active';
								let current = this.allSuggestions.eligible[this.allSuggestions.index].suggestion;
								this.allSuggestions.currentSuggestion.element.innerText = current.substring(this.allSuggestions.start, current.length);
								if (switchSelection) {
									e.preventDefault();
									e.stopPropagation();
								}
							}
						}
					},
					previousEntryChooser: {
						keydown: function(e) {
							if (e.keyCode == 38) {
								e.preventDefault();
								e.stopPropagation();
								let command = view.inputArea.innerText;
								let line1 = command.split('\n', 1)[0].length;
								let oneLine = command.split('\n', 2).length == 1;
								if (oneLine || view.inputArea.getPos() <= line1) {
									let previousEntry = controller.history.getPreviousEntry(command, view.inputArea.getPos());
									if (previousEntry != -1) {
										e.preventDefault();
										view.inputArea.innerText = previousEntry.innerText;
										view.inputArea.setPos(previousEntry.cursorPos);
									}
								}
							}
							if (e.keyCode == 40) {
								e.preventDefault();
								e.stopPropagation();
								let command = view.inputArea.innerText;
								let lastLine = command.length - command.split('\n', 1).pop().length;
								let oneLine = command.split('\n', 2).length == 1;
								if (oneLine || view.inputArea.getPos() > lastLine) {
									let nextEntry = controller.history.getNextEntry(view.inputArea.getPos());
									if (nextEntry != -1) {
										e.preventDefault();
										view.inputArea.innerText = nextEntry.innerText;
										view.inputArea.setPos(nextEntry.cursorPos);
									}
								}
							}
						},
						keypress: function(e) {
							if (e.keyCode == 13 && !e.shiftKey) {
								e.preventDefault();
								e.stopPropagation();
								let command = view.inputArea.innerText;
								let cursorPos = view.inputArea.getPos();
								if (command.length > 0) {
									view.inputArea.innerText = '';
									controller.history.push({
										innerText: command,
										cursorPos: cursorPos
									}, 'user');
									view.log.log({
										message: [command],
										color: 'black',
										background: 'white',
										type: 'input'
									});
									let result;
									let internalCommand = command.split(' ');
									let callFunc = controller.getCommand(internalCommand[0]);
									if (callFunc) {
										let strArgs = internalCommand.slice(1, internalCommand.length);
										result = new Promise(function(resolve, reject) {
											try {
												let ret = callFunc(resolve, reject, strArgs);
												if (ret !== undefined && ret !== null) {
													if (Array.isArray(ret)) {
														resolve(ret);
													} else {
														resolve([ret]);
													}
												}
											} catch (err) {
												reject(['Uncaught', err]);
											}
										}.bind(this));
									} else {
										result = new Promise(function(resolve, reject) {
											try {
												controller._eval(command, function(response) {
													resolve([response]);
												}.bind(this));
											} catch (err) {
												reject(['Uncaught', err]);
											}
										});
									}
									result.then(function(args) {
										if (!Array.isArray(args)) {
											args = [args];
										}
										controller.history.push({
											innerText: args
										}, 'response');
										let colors = [];
										for (let i of args) {
											colors.push(controller.getColor(i));
										}
										view.log.log({
											message: args,
											color: colors,
											background: 'white',
											type: 'output',
											unquot: true
										});
									}.bind(this)).catch(function(args) {
										if (!Array.isArray(args)) {
											args = [args];
										}
										controller.history.push({
											innerText: args
										}, 'error');
										let colors = [];
										for (let i = 0; i != args.length; i++) {
											colors.push('#D50000');
										}
										view.log.log({
											message: args,
											color: colors,
											background: 'FFCDD2',
											type: 'output',
											unquot: true
										});
									});
								}
							}
						}
					}
				},
				log: {
					init: function() {
						/*
						 Previous code for registering double-click (highlightAll), and delayed single-click (expandMessage) events.
						 */
						let clickTimeouts = [];
						view.log._event.expandMessage = function(multiMessageWrapper, e) {
							e.stopPropagation();
							clickTimeouts.push(setTimeout(function() {
								let sel = window.getSelection();
								if (!sel.baseNode || sel.isCollapsed || sel.baseNode.parentNode.parentNode != multiMessageWrapper) {
									let scrolledBottom = VM.scrollTop == view.bodyArea.scrollHeight - VM.clientHeight;
									/*
									 Let the user see 10 more lines with each additional click; give 200ms of waitTime to allow for double click to register
									 */
									multiMessageWrapper.style.webkitLineClamp = (parseInt(multiMessageWrapper.style.webkitLineClamp || '3') + 10).toString();
									if (scrolledBottom) {
										VM.scrollTop = view.bodyArea.scrollHeight;
									}
								}
							}.bind(this), 200));
						}.bind(this);
						view.log._event.highlightAll = function(multiMessageWrapper, e) {
							e.preventDefault();
							clickTimeouts.forEach(function(t) {
								clearTimeout(t);
							});
							clickTimeouts = [];
							let range = document.createRange();
							range.selectNode(multiMessageWrapper);
							window.getSelection().addRange(range);
						}.bind(this);
					},
					_stringify: function(entry, userInput, minify) {
						/*
						 Generates a valid string preview of an object, array, string, etc.
						 */
						let entryElem = document.createElement('span');
						if (entry === null) {
							entryElem.innerText = 'null';
							entryElem.style.color = '#9E9E9E';
						} else if (Array.isArray(entry)) {
							if (minify) {
								entryElem.innerText = 'Array [' + entry.length + ']';
							} else {
								let openBracket = document.createElement('span');
								openBracket.style.color = '#3F51B5';
								openBracket.innerText = '[';
								entryElem.appendChild(openBracket);
								for (let i = 0, ii = entry.length; i != ii; i++) {
									let span = view.log._stringify(entry[i], false, true);
									entryElem.appendChild(span);
									if (i == 5 && ii > 5) {
										let etc = document.createElement('span');
										etc.style.fontSize = 'x-small';
										etc.innerText = '...';
										entryElem.appendChild(etc);
										break;
									}
									let comma = document.createElement('span');
									comma.innerText = ', ';
									entryElem.appendChild(comma);
								}
								let closeBracket = entryElem.lastChild.innerText == ', ' ? entryElem.lastChild : document.createElement('span');
								closeBracket.style.color = '#3F51B5';
								closeBracket.innerText = ']';
								entryElem.appendChild(closeBracket);
							}
						} else if (typeof entry == 'object') {
							/*
							 @TODO: Differentiate from Error objects
							 */
							if (minify) {
								let inc = 0;
								let _entry = entry.toString();
								if (_entry.substring(0, 1) == '[' && _entry.slice(-1) == ']') {
									inc = 1;
								}
								entryElem.innerText = _entry.substring(_entry.indexOf(' ') + inc, _entry.length - inc);
							} else {
								try {
									let prefix = document.createElement('span');
									let inc = 0;
									let _entry = entry.toString();
									let start = _entry.indexOf(' ');
									if (_entry.substring(0, 1) == '[' && _entry.slice(-1) == ']') {
										inc = 1;
									}
									prefix.innerText = _entry.substring(start + inc, _entry.length - inc) + ' {';
									entryElem.appendChild(prefix);
									controller.getKeys(entry).some(function(ent) {
										if (entry[ent] !== null && typeof entry[ent] == 'object') {
											let prefix = document.createElement('span');
											prefix.innerText = ent;
											prefix.style.color = '#9C27B0';
											entryElem.appendChild(prefix);
											let match = document.createElement('span');
											match.innerText = ': ';
											entryElem.appendChild(match);
											entryElem.appendChild(view.log._stringify(entry[ent], false, true));
											let comma = document.createElement('span');
											comma.innerText = ', ';
											entryElem.appendChild(comma);
										}
										if (entryElem.children.length >= 15) {
											if (controller.getKeys(entry).length > 5) {
												entryElem.lastChild.style.fontSize = 'x-small';
												entryElem.lastChild.innerText = '...';
											}
											return true;
										}
									});
									let postFix = entryElem.lastChild.innerText == ', ' ? entryElem.lastChild : document.createElement('span');
									postFix.innerText = '}';
									entryElem.appendChild(postFix);
								} catch (err) {
									try {
										entryElem.innerText = entry.toString().length > JSON.stringify(entry).length ? entry.toString() : JSON.stringify(entry);
									} catch (err) {
										entryElem.innerText = err.toString();
									}
								}
							}
						} else if (typeof entry == 'string' && !userInput) {
							let quot = document.createElement('span');
							quot.innerText = '"';
							entryElem.appendChild(quot);
							let content = document.createElement('span');
							content.innerText = entry;
							content.style.color = '#E53935';
							entryElem.appendChild(content);
							entryElem.appendChild(quot.cloneNode(true));
						} else if (typeof entry == 'function') {
							/* Get entry function arguments */
							let _entry = entry.toString();
							let args = _entry.substring(_entry.indexOf('(') + 1, _entry.indexOf(')')).split(',');
							let prefix = document.createElement('span');
							prefix.innerText = 'function';
							prefix.style.color = '#6A1B9A';
							entryElem.appendChild(prefix);
							let openParen = document.createElement('span');
							openParen.innerText = '(';
							entryElem.appendChild(openParen);
							args.forEach(function(arg) {
								let currArg = document.createElement('span');
								currArg.innerText = arg.trim();
								currArg.style.color = '#BF360C';
								entryElem.appendChild(currArg);
								let comma = document.createElement('span');
								comma.innerText = ', ';
								entryElem.appendChild(comma);
							});
							if (minify) {
								entryElem.lastChild.innerText = ')';
							} else {
								entryElem.lastChild.innerText = ') ' + _entry.substring(_entry.indexOf('{'), _entry.length);
							}
						} else if (typeof entry == 'number') {
							entryElem.innerText = entry;
							entryElem.style.color = '#3F51B5';
						} else {
							entryElem.innerText = entry;
						}
						return entryElem;
					},
					_format: function(obj) {
						/*
						 Formats the parameters inputted into log function.
						 */
						obj.color = obj.color || [];
						obj.background = obj.background || 'white';
						if (!obj.preIcon) {
							obj.preIcon = document.createElement('div');
							obj.preIcon.className = 'greaterThanArrow';
							if (obj.type == 'input') {
								obj.preIcon.innerText = '>   ';
							} else if (obj.type == 'output') {
								obj.preIcon.innerText = '<-';
								obj.preIcon.className = 'outputArrow';
							}
						}
						if (!Array.isArray(obj.message)) {
							obj.message = [obj.message];
						}
						obj.color = obj.color || 'black';
						if (!Array.isArray(obj.color)) {
							obj.color = [obj.color];
						}
						let _obj = [];
						for (let i of obj.message) {
							let spaceHolder = document.createElement('span');
							spaceHolder.innerText = ' ';
							_obj.push({
								_value: i,
								value: view.log._stringify(i, obj.type == 'input' || obj.unquot),
								tree: i && typeof i == 'object',
								expandable: typeof i == 'string'
							}, {
								value: spaceHolder,
								spaceHolder: true
							});
							if (!(i && typeof i == 'object')) {
								obj._expandable = true;
							}
						}
						_obj.pop();
						obj.message = _obj;
						_obj = [];
						for (let i of obj.color) {
							_obj.push(i, 'black');
						}
						_obj.pop();
						obj.color = _obj;
						obj.background = obj.background || 'white';
					},
					_event: {
						expandMessage: function() {
						},
						highlightAll: function() {
						},
						expandTree: function(entry, rootExpander, e) {
							e.stopPropagation();
							entry.classList.toggle('expanded');
							let expander;
							if (rootExpander) {
								expander = entry.children[0].children[0].children[0];
							} else {
								expander = entry.children[0];
							}
							expander.classList.toggle('objectCollapsed');
							if (entry.classList.contains('expanded')) {
								/* Regenerate list items */
								/* Preprocessing to generate brancher */
								let val = entry._value;
								let branched = document.createElement('div');
								branched.className = 'brancher';
								controller.getKeys(val).forEach(function(ent) {
									let elem = document.createElement('div');
									try {
										elem._value = val[ent];
									} catch (err) {
										elem._value = err;
										elem.style.paddingLeft = '14px';
									}
									if (elem._value && typeof elem._value != 'string' && controller.getKeys(elem._value).length > 0) {
										let _expander = view.log.getTreeExpander();
										elem.appendChild(_expander);
										elem.style.cursor = 'pointer';
										/*
										 @XXX: Never Unhooked
										 */
										elem.addEventListener('click', view.log._event.expandTree.bind(this, elem, false));
									} else {
										elem.style.paddingLeft = '14px';
									}
									let key = document.createElement('span');
									key.style.color = '#9C27B0';
									key.innerText = ent;
									elem.appendChild(key);
									let colon = document.createElement('span');
									colon.innerText = ': ';
									colon.style.paddingRight = '4px';
									elem.appendChild(colon);
									let _str = view.log._stringify(elem._value, false, true);
									elem.appendChild(_str);
									branched.appendChild(elem);
								});
								if (rootExpander) {
									/* Clean up root node */
									entry.originalText = entry.children[0].children[1].cloneNode(true);
									let originalTextReference = entry.children[0].children[1];
									let closingTag = entry.children[0].children[1].lastChild.cloneNode(true);
									entry.children[0].appendChild(originalTextReference.firstChild);
									entry.children[0].removeChild(originalTextReference);
									/* Add branchers */
									entry.appendChild(branched);
									entry.appendChild(closingTag);
								} else {
									/* Insert indented brancher adjacent to current branch */
									entry.parentNode.insertBefore(branched, entry.nextSibling);
								}
							} else {
								/* Delete all items off of list */
								if (rootExpander) {
									while (entry.children.length > 1) {
										entry.removeChild(entry.lastChild);
									}
									entry.children[0].removeChild(entry.children[0].childNodes[1]);
									entry.children[0].appendChild(entry.originalText);
								} else {
									entry.parentNode.removeChild(entry.nextSibling);
								}
							}
						}
					},
					/*
					 @PARAM: obj: {
					 message: ["asdf", "asdf2"] || "asdf",
					 colors: ["black", "green"] || "black",
					 type: "input" || "output" || undefined,
					 preIcon: document.createElement('img' || 'svg') || undefined,
					 unquot: true || undefined
					 }
					 */
					log: function(obj) {
						view.log._format(obj);
						/*
						 obj: {
						 message: [{
						 _value: { ... },
						 value: document.createElement('span').innerText = "{ ... }",
						 tree: true
						 }, {
						 _value: ' ',
						 value: document.createElement('span').innerText = ' ',
						 tree: undefined,
						 spaceHolder: true
						 }, {
						 _value: "asdf2",
						 value: document.createElement('span').innerText = "asdf2",
						 tree: false
						 }],
						 backgroundColor: "white",
						 type: "input" || !"input",
						 _expandable: true || false,
						 preIcon: document.createElement('div' || 'svg'),
						 unquot: true || undefined
						 }
						 */
						let logMessageWrapper = document.createElement('div');
						logMessageWrapper.className = 'logMessageWrapper';
						logMessageWrapper.appendChild(obj.preIcon);
						let multiMessageWrapper = document.createElement('div');
						multiMessageWrapper.className = 'multiMessageWrapper';
						if (obj._expandable) {
							/*
							 @XXX: Never unhooked
							 */
							multiMessageWrapper.addEventListener('click', view.log._event.expandMessage.bind(undefined, multiMessageWrapper));
							/*
							 @XXX: Never unhooked
							 */
							multiMessageWrapper.addEventListener('dblclick', view.log._event.highlightAll.bind(undefined, multiMessageWrapper));
						}
						for (let index = 0; index != obj.message.length; index++) {
							let entry = document.createElement('div');
							if (!obj.message[index].spaceHolder) {
								entry._value = obj.message[index]._value;
								if (obj.message[index].tree) {
									/* Each object logged in console extends the global line-clamp */
									let horizontalAligner = document.createElement('div');
									horizontalAligner.className = 'horizontalAligner';
									let centerer = document.createElement('div');
									centerer.className = 'centerer';
									centerer.appendChild(view.log.getTreeExpander());
									horizontalAligner.appendChild(centerer);
									horizontalAligner.appendChild(obj.message[index].value);
									entry.className = 'objTree';
									entry.expanded = false;
									multiMessageWrapper.style.webkitLineClamp = (parseInt(multiMessageWrapper.style.webkitLineClamp || '3') + 1).toString();
									entry.appendChild(horizontalAligner);
									/*
									 @XXX: Never unhooked
									 */
									horizontalAligner.addEventListener('click', view.log._event.expandTree.bind(this, entry, true));
									/*
									 @XXX: Never unhooked
									 */
									horizontalAligner.addEventListener('dblclick', function(e) {e.stopPropagation();});
								} else if (obj._expandable && obj.message[index].expandable) {
									entry.setAttribute('title', 'Click to expand');
									entry.appendChild(obj.message[index].value);
								} else {
									entry.appendChild(obj.message[index].value);
								}
							}
							multiMessageWrapper.appendChild(entry);
						}
						logMessageWrapper.style.backgroundColor = obj.background;
						logMessageWrapper.appendChild(multiMessageWrapper);
						let scrolledBottom = VM.scrollTop == view.bodyArea.scrollHeight - VM.clientHeight;
						view.logArea.appendChild(logMessageWrapper);
						if (scrolledBottom) {
							VM.scrollTop = view.bodyArea.scrollHeight;
						}
					},
					getTreeExpander: function() {
						let treeExpander = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
						treeExpander.innerHTML = '<path d="M0 6l5 5 5-5z"></path>';
						treeExpander.setAttribute('fill', '#000000');
						treeExpander.setAttribute('height', '14');
						treeExpander.setAttribute('width', '14');
						treeExpander.setAttribute('viewBox', '0 0 12 16');
						treeExpander.setAttribute('class', 'expandingArrow objectCollapsed');
						return treeExpander;
					}
				},
				suggestionsEngine: {
					namespaces: [
						{
							obj: {
								/*Filled with custom commands after init*/
							},
							color: '#2E7D32',
							delimiter: ' '
						}, {
							obj: controller.getCommonJavascriptKeywords(),
							color: '#6A1B9A',
							delimiter: '.'
						}, {
							obj: {devtools: devtools},
							color: '#304FFE',
							delimiter: '.'
						}, {
							obj: devtools.target,
							color: '#000000',
							delimiter: '.'
						}
					],
					init: function(consoleBody, inputArea) {
						let allSuggestions = {
							eligible: [],
							prefix: '',
							start: 0,
							index: 0,
							modal: null,
							currentSuggestion: {
								element: document.createElement('span')
							}
						};
						allSuggestions.currentSuggestion.element.id = 'suggestionsEngine';
						consoleBody.appendChild(allSuggestions.currentSuggestion.element);
						let custComm = controller.getCommand();
						let objComm = view.suggestionsEngine.namespaces[0].obj;
						custComm.forEach(function(i) {
							objComm[i] = controller.getArgs(i);
						});
						view.event.suggestionsEngine.allSuggestions = allSuggestions;
						view.suggestionsEngine.namespaces.forEach(function(obj) {
							/* Initialize configuration */
							obj.color = obj.color || '#000000';
							obj.opacity = obj.opacity || '.5';
						});
						let lastLeft = allSuggestions.currentSuggestion.element.offsetLeft;
						view.suggestionsEngine.preSuggestion = function() {
							let userInput = inputArea.innerText.split(new RegExp('[ \n]')).pop();
							if (allSuggestions.modal) {
								devtools.modules.global.elements.allDevtoolsContainer.removeChild(allSuggestions.modal);
								allSuggestions.modal = null;
							}
							if (userInput === '') {
								allSuggestions.currentSuggestion.element.innerText = '';
								lastLeft = allSuggestions.currentSuggestion.element.offsetLeft;
								return;
							}
							let eligibleSuggestions = [];
							let setText = false;
							view.suggestionsEngine.namespaces.forEach(function(target) {
								let paths = userInput.split(target.delimiter);
								let currObjSuggestion = paths.pop();
								let _target = target.obj;
								for (let i = 0, ii = paths.length; i != ii; i++) {
									_target = _target[paths[i]];
									if (_target === undefined || _target === null) {
										return;
									}
								}
								let keys = controller.getKeys(_target);
								for (let i = 0, ii = keys.length; i != ii; i++) {
									if (keys[i].indexOf(currObjSuggestion) === 0) {
										eligibleSuggestions.push({
											suggestion: keys[i],
											color: target.color,
											opacity: target.opacity,
											delimiter: target.delimiter
										});
									}
								}
								if (!setText && eligibleSuggestions.length > 0) {
									setText = true;
									let prefix = paths.join(target.delimiter);
									if (prefix.length !== 0) {
										prefix += target.delimiter;
									}
									let suggestion = prefix + eligibleSuggestions[0].suggestion;
									allSuggestions.prefix = prefix; /* Save these to a wider scope to allow for completion engine */
									allSuggestions.start = userInput.split(target.delimiter).pop().length;
									if (userInput.endsWith(target.delimiter)) {
										lastLeft = allSuggestions.currentSuggestion.element.offsetLeft;
									}
									allSuggestions.currentSuggestion.element.innerText = suggestion.substring(userInput.length, suggestion.length);
								}
							});
							if (eligibleSuggestions.length > 0) {
								allSuggestions.eligible = eligibleSuggestions;
								allSuggestions.index = 0;
								allSuggestions.currentSuggestion.element.style.color = eligibleSuggestions[0].color;
								allSuggestions.currentSuggestion.element.style.opacity = eligibleSuggestions[0].opacity;
								if (eligibleSuggestions.length > 1) {
									/*
									 Show the long list of all suggestions
									 */
									allSuggestions.modal = document.createElement('div');
									allSuggestions.modal.className = 'allSuggestionsChooser';
									/*
									 @XXX: Not Removed
									 */
									allSuggestions.modal.addEventListener('mouseover', function(e) {
										e.stopPropagation();
										if (typeof e.target.index != 'undefined') {
											allSuggestions.modal.children[allSuggestions.index].classList.remove('active');
											allSuggestions.index = e.target.index;
											e.target.classList.add('active');
											let current = allSuggestions.eligible[allSuggestions.index].suggestion;
											allSuggestions.currentSuggestion.element.innerText = current.substring(allSuggestions.start, current.length);
										}
									}.bind(this));
									/*
									 @XXX: Not Removed
									 */
									allSuggestions.modal.addEventListener('mousedown', function(e) {
										e.stopPropagation();
										if (e.target != allSuggestions.modal) {
											let evt = new Event('keydown');
											evt.key = 'Tab';
											evt.keyCode = 9;
											view.inputArea.dispatchEvent(evt);
										}
									});
									let index = 0;
									eligibleSuggestions.forEach(function(sugg) {
										let _sugg = sugg.suggestion.split(sugg.delimiter).pop(); /* Trim each suggestion to relevant attributes */
										let suggestion = document.createElement('div');
										suggestion.index = index++;
										suggestion.innerText = _sugg;
										suggestion.style.color = sugg.color;
										allSuggestions.modal.appendChild(suggestion);
									});
									allSuggestions.modal.children[0].className = 'active';
									let repositionModal = function(e) {
										e.detail.then(function() {
											if (allSuggestions.modal) {
												allSuggestions.modal.style.left = devtools.modules.global.elements.devtoolsFrame.offsetLeft + lastLeft + 'px';
												let top = (VM.offsetHeight < view.bodyArea.offsetHeight ? VM.offsetHeight : view.bodyArea.offsetHeight) +
													allSuggestions.currentSuggestion.element.offsetTop - view.logArea.offsetHeight +
													devtools.modules.global.elements.devtoolsFrame.offsetTop;
												if (top + allSuggestions.modal.offsetHeight < window.innerHeight) {
													allSuggestions.modal.style.top = top + 'px';
												} else {
													allSuggestions.modal.style.top = devtools.modules.global.elements.devtoolsFrame.offsetTop -
														allSuggestions.modal.offsetHeight + allSuggestions.currentSuggestion.element.offsetTop + 'px';
												}
											}
										}.bind(this));
									}.bind(this);
									/*
									 @XXX: Not Removed
									 */
									devtools.modules.global.elements.devtoolsFrame.addEventListener('beforemove', repositionModal);
									/*
									 @XXX: Not Removed
									 */
									devtools.modules.global.elements.devtoolsFrame.addEventListener('beforeresize', repositionModal);
									devtools.modules.global.elements.allDevtoolsContainer.appendChild(allSuggestions.modal);
									repositionModal({
										detail: {
											then: function(f) {
												f();
											}
										}
									});
								}
							} else {
								allSuggestions.currentSuggestion.element.innerText = '';
							}
						}.bind(this);
						view.suggestionsEngine.inputArea = inputArea;
						view.suggestionsEngine.activate();
						let clearSuggestions = function(e) {
							/*
							 Clear suggestions to allow cursor to appear after user clicks on body (to allow cursor to focus correctly)
							 */
							e.stopPropagation();
							if (allSuggestions.modal) {
								devtools.modules.global.elements.allDevtoolsContainer.removeChild(allSuggestions.modal);
								allSuggestions.modal = null;
							}
							allSuggestions.currentSuggestion.element.innerText = '';
						}.bind(this);
						VM.addEventListener('mousedown', clearSuggestions);
						devtools.modules.console.events.shutdown.push(function() {
							VM.removeEventListener('mousedown', clearSuggestions);
						}.bind(this));
					},
					activate: function() {
						/*
						 Implement activate-deactivate system in future after addition of settings pane
						 view.suggestionsEngine.inputArea.addEventListener('keydown', view.suggestionsEngine.keyListener);
						 */
						view.suggestionsEngine.mutationObserver = view.suggestionsEngine.mutationObserver || new MutationObserver(view.suggestionsEngine.preSuggestion);
						view.suggestionsEngine.mutationObserver.observe(view.suggestionsEngine.inputArea, {
							childList: true,
							subtree: true,
							characterData: true
						});
					},
					deactivate: function() {
						/*
						 Implement activate-deactivate system in future after addition of settings pane
						 view.suggestionsEngine.inputArea.removeEventListener('keydown', view.suggestionsEngine.keyListener);
						 */
						view.suggestionsEngine.mutationObserver.disconnect();
					}
				}
			};
		controller.init.init();
	};
	(function(devtoolsFrame) {
		/*
		 Initializes the "frame" of the devtools, which includes
		 functions such as the actual window of devtools, global
		 synced data, and tabs for modules.
		 */
		let model;
		let view;
		let controller;
		model = {
			init: {
				global: {
					styles: `
						div#allDevtoolsContainer {
							all: initial;
							-webkit-user-drag: none;
							font-family: consolas, sans-serif;
							font-size: small;
							position: fixed;
							top: 0;
							left: 0;
							opacity: 0.8;
							backdrop-filter: blur(5px);
							z-index: 2147483647;
						}
						div#devtoolsFrame {
							position: fixed;
							margin: 0;
							padding: 0;
							display: flex;
							flex-direction: column;
							background-color: white;
							text-align: left;
						}
						div#devtoolsFrame.borderLeft > div#borderLeft {
							cursor: ew-resize;
							border-left: solid #9E9E9E 1px;
							width: 8px;
							left: 0;
							top: 2%;
							bottom: 2%;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderLeft > div#borderTopLeft {
							cursor: nwse-resize;
							border-left: solid #9E9E9E 1px;
							width: 8px;
							left: 0;
							top: 0;
							height: 2%;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderLeft:not(.borderTop) > div#borderTopLeft {
							cursor: ew-resize;
						}
						div#devtoolsFrame.borderLeft > div#borderBottomLeft {
							cursor: nesw-resize;
							border-left: solid #9E9E9E 1px;
							width: 8px;
							left: 0;
							bottom: 0;
							height: 2%;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderLeft:not(.borderBottom) > div#borderBottomLeft {
							cursor: ew-resize;
						}
						div#devtoolsFrame.borderRight > div#borderRight {
							cursor: ew-resize;
							border-right: solid #9E9E9E 1px;
							width: 8px;
							top: 2%;
							bottom: 2%;
							right: 0;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderRight > div#borderTopRight {
							cursor: nesw-resize;
							border-right: solid #9E9E9E 1px;
							width: 8px;
							top: 0;
							height: 2%;
							right: 0;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderRight:not(.borderTop) > div#borderTopRight {
							cursor: ew-resize;
						}
						div#devtoolsFrame.borderRight > div#borderBottomRight {
							cursor: nwse-resize;
							border-right: solid #9E9E9E 1px;
							width: 8px;
							bottom: 0;
							height: 2%;
							right: 0;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderRight:not(.borderBottom) > div#borderBottomRight {
							cursor: ew-resize;
						}
						div#devtoolsFrame.borderTop > div#borderTop {
							cursor: ns-resize;
							border-top: solid #9E9E9E 1px;
							height: 6px;
							left: 2%;
							right: 2%;
							top: 0;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderTop > div#borderLeftTop {
							cursor: nwse-resize;
							border-top: solid #9E9E9E 1px;
							height: 6px;
							width: 2%;
							left: 0;
							top: 0;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderTop:not(.borderLeft) > div#borderLeftTop {
							cursor: ns-resize;
						}
						div#devtoolsFrame.borderTop > div#borderRightTop {
							cursor: nesw-resize;
							border-top: solid #9E9E9E 1px;
							height: 6px;
							width: 2%;
							right: 0;
							top: 0;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderTop:not(.borderRight) > div#borderRightTop {
							cursor: ns-resize;
						}
						div#devtoolsFrame.borderBottom > div#borderBottom {
							cursor: ns-resize;
							border-bottom: solid #9E9E9E 1px;
							height: 8px;
							left: 2%;
							right: 2%;
							bottom: 0;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderBottom > div#borderLeftBottom {
							cursor: nesw-resize;
							border-bottom: solid #9E9E9E 1px;
							height: 8px;
							width: 2%;
							left: 0;
							bottom: 0;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderBottom:not(.borderLeft) > div#borderLeftBottom {
							cursor: ns-resize;
						}
						div#devtoolsFrame.borderBottom > div#borderRightBottom {
							cursor: nwse-resize;
							border-bottom: solid #9E9E9E 1px;
							height: 8px;
							width: 2%;
							right: 0;
							bottom: 0;
							position: absolute;
							z-index: 1;
						}
						div#devtoolsFrame.borderBottom:not(.borderRight) > div#borderRightBottom {
							cursor: ns-resize;
						}
						div#devtoolsFrame div#headerBar svg#dragHandle {
							cursor: move;
							padding: 0 0 1px 1px;
							transform: rotate(90deg);
						}
						div#devtoolsFrame div#headerBar div#centerer {
							display: flex;
							flex-direction: column;
							justify-content: center;
						}
						div#devtoolsFrame div#headerBar div#centerer span#divider {
							padding-right: 1px;
							margin-right: 5px;
							border-right: solid #BDBDBD 1px;
							height: 17px;
						}
						div#devtoolsFrame div#headerBar #modulesSection {
							display: flex;
						}
						div#devtoolsFrame #headerBar #modulesSection div.moduleTab {
							-webkit-user-select: none;
							cursor: pointer;
							display: flex;
							flex-direction: column;
							justify-content: center;
							padding: 0 5px 0 5px;
							font-size: small;
							letter-spacing: -.04em;
							transition: background-color ease-in-out 150ms;
						}
						div#devtoolsFrame div#headerBar #modulesSection span#fancyBar {
							position: absolute;
							height: 2px;
							width: 0px;
							bottom: 0;
							left: 0;
							background-color: #2196F3;
							transition: left ease-in-out 150ms, width linear 150ms;
						}
						div#devtoolsFrame #headerBar #modulesSection div.moduleTab:hover {
							background-color: #E0E0E0;
						}
						div#devtoolsFrame #headerBar {
							border-bottom: solid 0.1vw #BDBDBD;
							cursor: default;
							display: flex;
							position: relative;
							background-color: #EEEEEE;
						}
						div#windowResizeOverlay {
							position: fixed;
							width: 98vw;
							height: 98vh;
							bottom: 1vh;
							top: 1vh;
							left: 1vw;
							right: 1vw;
							opacity: 0;
							background-color: #FFFFFF;
							transition: bottom .25s ease-in-out, top .25s ease-in-out, left .25s ease-in-out, right .25s ease-in-out, width .25s ease-in-out, height .25s ease-in-out, opacity .25s ease-in-out;
							pointer-events: none;
							border: 1px solid #DADADA;
							box-shadow: 0 0 10px #2196F3;
							outline: none;
							border-color: #2196F3;
						}
						#devtoolsFrame #devtoolsVM {
							overflow: auto;
							max-height: 100%;
							height: 100%;
							max-width: 100%;
							width: 100%;
						}
						div#windowResizeOverlay.active {
							opacity: .25;
						}
					`,
					init: function() {
					}
				},
				init: function() {
					model.init.global.init();
					devtools.modules.global.exit = function() {
						controller.exit();
					}.bind(this);
				}
			}
		};
		controller = {
			init: {
				getCSS: function() {
					return model.init.global.styles;
				},
				init: function() {
					model.init.init();
					view.init.init();
				}
			},
			exit: function() {
				Object.keys(devtools.modules).forEach(function(i) {
					let obj = devtools.modules[i].events;
					try {
						if (obj && obj.shutdown) {
							for (let ii of obj.shutdown) {
								try {
									ii();
								} catch(err) {
									console.error(err);
								}
							}
						}
					} catch(err) {
						console.error(err);
					}
				});
				document.body.removeChild(devtools.modules.global.elements.allDevtoolsContainer);
			}
		};
		view = {
			activeVM: null,
			init: {
				init: function() {
					view.init.loadCSS();
					view.init.loadElements();
					view.mobility.init();
					view.init.addBoarders();
					view.init.loadModules();
					view.fancyBar.init();
					view.modulesSection.children[0].click();
					if (document.compatMode == 'BackCompat') {
						console.warn('Devtools may not play nicely with Quirks Mode, and visual/functional glitches may appear. Your warranty is now void.');
					}
				},
				loadCSS: function() {
					let styleElem = document.createElement('style');
					styleElem.innerHTML = controller.init.getCSS();
					devtools.modules.global.elements.devtoolsFrame.appendChild(styleElem);
				},
				preventEventPropagation: function() {
					[{
						name: 'keydown',
						stopPropagation: true
					}, {
						name: 'keypress',
						stopPropagation: true
					}, {
						name: 'keyup',
						stopPropagation: true
					}, {
						name: 'mousedown',
						stopPropagation: true
					}, {
						name: 'mouseup',
						stopPropagation: true
					}, {
						name: 'click',
						stopPropagation: true
					}, {
						name: 'wheel',
						preventDefault: true,
						stopPropagation: true
					}].forEach(function(i) {
						let preventer = function(e) {
							if (i.stopPropagation) {
								e.stopPropagation();
							}
							if (i.preventDefault) {
								e.preventDefault();
							}
						}.bind(this);
						devtoolsFrame.addEventListener(i.name, preventer);
						devtools.modules.global.events.shutdown.push(function() {
							devtoolsFrame.removeEventListener(i.name, preventer);
						}.bind(this));
					});
				},
				loadElements: function() {
					let allDevtoolsContainer = devtools.modules.global.elements.allDevtoolsContainer;
					view.allDevtoolsContainer = allDevtoolsContainer;
					allDevtoolsContainer.id = 'allDevtoolsContainer';
					devtoolsFrame.id = 'devtoolsFrame';
					devtoolsFrame.style.height = window.innerHeight / 2 + 'px';
					devtoolsFrame.style.width = window.innerWidth / 2 + 'px';
					devtoolsFrame.style.left = '25vw';
					devtoolsFrame.style.right = '25vw';
					devtoolsFrame.style.top = '25vh';
					devtoolsFrame.style.bottom = '25vh';
					view.init.preventEventPropagation();
					let headerBar = document.createElement('div');
					view.headerBar = headerBar;
					headerBar.style.minHeight = window.innerHeight * 0.025 + 'px';
					headerBar.id = 'headerBar';
					view.init.addTools();
					view.modulesSection = document.createElement('div');
					view.modulesSection.id = 'modulesSection';
					headerBar.appendChild(view.modulesSection);
					devtoolsFrame.appendChild(headerBar);
					allDevtoolsContainer.appendChild(devtoolsFrame);
					document.body.appendChild(allDevtoolsContainer);
				},
				addBoarders: function() {
					let devtoolsFrame = devtools.modules.global.elements.devtoolsFrame;
					let evtPool = [];
					let dragEnd = function() {
						while (evtPool.length) {
							document.removeEventListener('mousemove', evtPool.pop());
						}
					}.bind(this);
					[
						'borderLeft',
						'borderTopLeft',
						'borderBottomLeft',
						'borderRight',
						'borderTopRight',
						'borderBottomRight',
						'borderTop',
						'borderLeftTop',
						'borderRightTop',
						'borderBottom',
						'borderLeftBottom',
						'borderRightBottom'
					].forEach(function(id) {
						let i = document.createElement('div');
						i.id = id;
						devtoolsFrame.appendChild(i);
						let getSide = function(id) {
							let side = null;
							['Top', 'Right', 'Bottom', 'Left'].forEach(function(i) {
								if (id.lastIndexOf(i) + i.length == id.length) {
									side = i.toLowerCase();
								}
							});
							return side;
						};
						let getSecondarySide = function(id, primarySide) {
							return id.substring(6, id.length - primarySide.length).toLowerCase() || null;
						};
						let getDirectionExpansion = function(frameSpecs, primarySide, secondarySide) {
							if (frameSpecs[secondarySide]) {
								return [primarySide];
							}
							return [primarySide, secondarySide];
						};
						let initialProps = {
							startHeight: 0
						};
						let dragCatalyze = function(_e) {
							_e.stopPropagation();
							initialProps.startHeight = devtools.modules.global.elements.devtoolsFrame.clientHeight;
							initialProps.startWidth = devtools.modules.global.elements.devtoolsFrame.clientWidth;
							let frameSpecs = devtools.modules.global.querySnappedStatus();
							let side = getSide(i.id);
							let side2 = getSecondarySide(i.id, side);
							let directions = side2 ? getDirectionExpansion(frameSpecs, side, side2) : [side];
							directions.forEach(function(dir) {
								let adjustVertical = null;
								let adjustHorizontal = null;
								let mousemove;
								if (dir == 'top') {
									mousemove = function(dir, e) {
										e.stopPropagation();
										e.preventDefault();
										if (adjustVertical === null) {
											adjustVertical = _e.clientY * 2 - e.clientY;
										}
										let height = _e.clientY * 2 - e.clientY - adjustVertical + initialProps.startHeight;
										if (height > 150) {
											devtoolsFrame.dispatchEvent(view._event.resizeEvent.event);
											let top = e.clientY - _e.layerY + window.scrollY;
											devtools.modules.global.elements.devtoolsFrame.style.top = (top > 0 ? top : 0) + 'px';
											devtools.modules.global.elements.devtoolsFrame.style.height = (top > 0 ? height : height + top) + 'px';
											view._event.resizeEvent.after();
										}
									}.bind(this, dir);
								} else if (dir == 'bottom') {
									mousemove = function(dir, e) {
										e.stopPropagation();
										e.preventDefault();
										if (adjustVertical === null) {
											adjustVertical = _e.clientY - e.clientY;
										}
										let height = e.clientY - _e.clientY - adjustVertical + initialProps.startHeight;
										if (height > 150) {
											devtoolsFrame.dispatchEvent(view._event.resizeEvent.event);
											devtools.modules.global.elements.devtoolsFrame.style.height = (height + devtoolsFrame.offsetTop < window.innerHeight ? height : window.innerHeight - devtoolsFrame.offsetTop) + 'px';
											view._event.resizeEvent.after();
										}
									}.bind(this, dir);
								} else if (dir == 'left') {
									mousemove = function(dir, e) {
										e.stopPropagation();
										e.preventDefault();
										if (adjustHorizontal === null) {
											adjustHorizontal = _e.clientX * 2 - e.clientX;
										}
										let width = _e.clientX * 2 - e.clientX - adjustHorizontal + initialProps.startWidth;
										if (width > view.getMinWidth()) {
											devtoolsFrame.dispatchEvent(view._event.resizeEvent.event);
											let left = e.clientX - _e.layerX + window.scrollX;
											devtools.modules.global.elements.devtoolsFrame.style.left = (left > 0 ? left : 0) + 'px';
											devtools.modules.global.elements.devtoolsFrame.style.width = (left > 0 ? width : width + left) + 'px';
											view._event.resizeEvent.after();
										}
									}.bind(this, dir);
								} else if (dir == 'right') {
									mousemove = function(dir, e) {
										e.stopPropagation();
										e.preventDefault();
										if (adjustHorizontal === null) {
											adjustHorizontal = _e.clientX - e.clientX;
										}
										let width = e.clientX - _e.clientX - adjustHorizontal + initialProps.startWidth;
										if (width > view.getMinWidth()) {
											devtoolsFrame.dispatchEvent(view._event.resizeEvent.event);
											devtools.modules.global.elements.devtoolsFrame.style.width = (width + devtoolsFrame.offsetLeft < window.innerWidth ? width : window.innerWidth - devtoolsFrame.offsetLeft) + 'px';
											view._event.resizeEvent.after();
										}
									}.bind(this, dir);
								}
								document.addEventListener('mousemove', mousemove);
								evtPool.push(mousemove);
							});
						}.bind(this);
						i.addEventListener('mousedown', dragCatalyze);
						i.addEventListener('mouseup', dragEnd);
						devtools.modules.global.events.shutdown.push(function() {
							i.removeEventListener('mousedown', dragCatalyze);
							i.removeEventListener('mouseup', dragEnd);
						}.bind(this));
					});
					document.addEventListener('mouseup', dragEnd);
					devtools.modules.global.elements.devtoolsFrame.addEventListener('mouseup', dragEnd);
					devtools.modules.global.events.shutdown.push(function() {
						document.removeEventListener('mouseup', dragEnd);
						devtools.modules.global.elements.devtoolsFrame.removeEventListener('mouseup', dragEnd);
					}.bind(this));
					devtoolsFrame.classList.add('borderTop', 'borderLeft', 'borderBottom', 'borderRight');
				},
				loadModules: function() {
					Object.keys(devtools.modules).forEach(function(i) {
						if (i != 'global' && devtools.modules[i].init) {
							let newVM = document.createElement('div');
							newVM.id = 'devtoolsVM';
							try {
								view.init.registerModule(newVM, devtools.modules[i].title || i, devtools.modules[i]);
							} catch (err) {
								console.error(err);
							}
						}
					});
				},
				registerModule: function(frame, moduleName, module) {
					module.frame = frame;
					module.tab = document.createElement('div');
					module.tab.className = 'moduleTab';
					let inited = false;
					module.tab.innerText = moduleName;
					let clickStopper = function(e) {
						e.stopPropagation();
					};
					let switchTabs = function() {
						if (view.activeVM) {
							view.activeVM.frame.style.display = 'none';
						}
						view.activeVM = module;
						module.frame.style.display = 'block';
						view.fancyBar.slideTo(module.tab);
						if (!inited) {
							devtools.modules.global.elements.devtoolsFrame.appendChild(module.frame);
							inited = true;
						}
						if (module.focus) {
							if (module.focus.temporary) {
								module.focus.temporary.forEach(function(f) {
									f();
								});
								module.focus.temporary = [];
							}
							if (module.focus.persistent) {
								module.focus.persistent.forEach(function(f) {
									f();
								});
							}
						}
					}.bind(this);
					let allower = function(e) {
						e.stopPropagation();
					};
					module.tab.addEventListener('mousedown', clickStopper);
					module.tab.addEventListener('click', switchTabs);
					frame.addEventListener('wheel', allower);
					devtools.modules.global.events.shutdown.push(function() {
						module.tab.removeEventListener('mousedown', clickStopper);
						module.tab.removeEventListener('click', switchTabs);
						frame.addEventListener('wheel', allower);
					}.bind(this));
					view.modulesSection.appendChild(module.tab);
					module.init(module.frame);
				},
				addTools: function() {
					let dragHandle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
					dragHandle.id = 'dragHandle';
					dragHandle.setAttribute('height', '24');
					dragHandle.setAttribute('width', '24');
					dragHandle.setAttribute('fill', '#000000');
					dragHandle.setAttribute('viewBox', '0 0 24 24');
					dragHandle.innerHTML = `
						<path fill="#000000" d="M7,19V17H9V19H7M11,19V17H13V19H11M15,
							19V17H17V19H15M7,15V13H9V15H7M11,15V13H13V15H11M15,
							15V13H17V15H15M7,11V9H9V11H7M11,11V9H13V11H11M15,
							11V9H17V11H15M7,7V5H9V7H7M11,7V5H13V7H11M15,7V5H17V7H15Z"/>
					`;
					view.headerBar.appendChild(dragHandle);
					let centerer = document.createElement('div');
					centerer.id = 'centerer';
					let divider = document.createElement('span');
					divider.id = 'divider';
					centerer.appendChild(divider);
					view.headerBar.appendChild(centerer);
				}
			},
			_event: {
				resizeEvent: {
					queue: [],
					event: new CustomEvent('beforeresize', {
						detail: {
							then: function(fn) {
								view._event.resizeEvent.queue.push(fn);
							}.bind(this)
						}
					}),
					after: function() {
						while (view._event.resizeEvent.queue.length) {
							try {
								view._event.resizeEvent.queue.pop()();
							} catch (err) {
								console.error(err);
							}
						}
					}.bind(this)
				},
				moveEvent: {
					queue: [],
					event: new CustomEvent('beforemove', {
						detail: {
							then: function(fn) {
								view._event.moveEvent.queue.push(fn);
							}.bind(this)
						}
					}),
					after: function() {
						while (view._event.moveEvent.queue.length) {
							try {
								view._event.moveEvent.queue.pop()();
							} catch (err) {
								console.error(err);
							}
						}
					}.bind(this)
				}
			},
			getMinWidth: function() {
				let minWidth = 0;
				for (let i = 0, ii = view.headerBar.children.length; i != ii; i++) {
					minWidth += view.headerBar.children[i].offsetWidth || view.headerBar.children[i].clientWidth||0;
				}
				return minWidth > 100 ? minWidth : 100;
			},
			mobility: {
				externalizeSnapFunctions: function() {
					devtools.modules.global.snap = function(directions) {
						this.initDrag.actions.snap(directions);
					}.bind(this);
					devtools.modules.global.querySnappedStatus = function() {
						return this.initDrag.props.snapped ? this.initDrag.props.snap : {};
					}.bind(this);
				},
				init: function() {
					/*
					 Handles all gestures and movement with devtoolsFrame, including dragging, double tap, etc.
					 */
					this.externalizeSnapFunctions();
					this.initDrag.initOverlay();
					this.initDrag.hookStart();
					this.initDrag.hookDrag();
					this.initDrag.hookEnd();
				},
				initDrag: {
					actions: {
						previewSnap: function(props) {
							view.mobility.initDrag.props.nextSnap = props;
							if (props.left || props.right || props.top || props.bottom) {
								view.mobility.initDrag.props.nextSnap.active = true;
								view.mobility.initDrag.props.windowResizeOverlay.removeAttribute('style');
								if (!props.left && !props.right) {
									props.left = true;
									props.right = true;
								}
								if (props.left) {
									view.mobility.initDrag.props.windowResizeOverlay.style.left = '1vw';
									view.mobility.initDrag.props.windowResizeOverlay.style.width = '48vw';
								}
								if (props.right) {
									view.mobility.initDrag.props.windowResizeOverlay.style.left = props.left ? '1vw' : '51vw';
									view.mobility.initDrag.props.windowResizeOverlay.style.width = props.left ? '98vw' : '48vw';
								}
								if (!props.top && !props.bottom) {
									props.top = true;
									props.bottom = true;
								}
								if (props.top) {
									view.mobility.initDrag.props.windowResizeOverlay.style.top = '1vh';
									view.mobility.initDrag.props.windowResizeOverlay.style.height = '48vh';
								}
								if (props.bottom) {
									view.mobility.initDrag.props.windowResizeOverlay.style.top = props.top ? '1vh' : '51vh';
									view.mobility.initDrag.props.windowResizeOverlay.style.height = props.top ? '98vh' : '48vh';
								}
								view.mobility.initDrag.props.windowResizeOverlay.classList.add('active');
							} else {
								view.mobility.initDrag.props.nextSnap.active = false;
								view.mobility.initDrag.props.windowResizeOverlay.classList.remove('active');
							}
						},
						snap: function(props) {
							view.mobility.initDrag.props.snap = props;
							view.mobility.initDrag.props.snapped = true;
							devtoolsFrame.dispatchEvent(view._event.resizeEvent.event);
							if (props.left) {
								devtoolsFrame.style.left = '0';
								devtoolsFrame.style.width = '50vw';
								devtoolsFrame.classList.remove('borderLeft');
							}
							if (props.right) {
								devtoolsFrame.style.left = props.left ? '0' : '50vw';
								devtoolsFrame.style.width = props.left ? '100vw' : '50vw';
								devtoolsFrame.classList.remove('borderRight');
							}
							if (props.top) {
								devtoolsFrame.style.top = '0';
								devtoolsFrame.style.height = '50vh';
								devtoolsFrame.classList.remove('borderTop');
							}
							if (props.bottom) {
								devtoolsFrame.style.top = props.top ? '0' : '50vh';
								devtoolsFrame.style.height = props.top ? '100vh' : '50vh';
								devtoolsFrame.classList.remove('borderBottom');
							}
							view._event.resizeEvent.after();
						},
						unsnap: function() {
							if (view.mobility.initDrag.props.snapped) {
								view.mobility.initDrag.props.snapped = false;
								devtoolsFrame.dispatchEvent(view._event.resizeEvent.event);
								devtoolsFrame.style.left = view.mobility.initDrag.props.preSnappedProps.left + 'px';
								devtoolsFrame.style.width = view.mobility.initDrag.props.preSnappedProps.width + 'px';
								devtoolsFrame.style.top = view.mobility.initDrag.props.preSnappedProps.top + 'px';
								devtoolsFrame.style.height = view.mobility.initDrag.props.preSnappedProps.height + 'px';
								devtoolsFrame.classList.add('borderBottom', 'borderTop', 'borderRight', 'borderLeft');
								view._event.resizeEvent.after();
							}
						}
					},
					props: {
						snapped: false,
						moving: 0,
						/*
						 0: unmovable,
						 1: movable,
						 2: moved
						 */
						snap: {
							top: false,
							right: false,
							bottom: false,
							left: false
						},
						preSnappedProps: {
							left: 0,
							width: 100,
							top: 0,
							height: 100
						},
						nextSnap: {
							/* Dirty hack, generated by previewSnap */
							top: false,
							right: false,
							bottom: false,
							left: false,
							active: false
						},
						hookStart: {
							startX: 0,
							startY: 0
						},
						windowResizeOverlay: null
					},
					initOverlay: function() {
						let windowResizeOverlay = document.createElement('div');
						windowResizeOverlay.id = 'windowResizeOverlay';
						this.props.windowResizeOverlay = windowResizeOverlay;
						view.allDevtoolsContainer.appendChild(windowResizeOverlay);
					},
					hookStart: function() {
						let dblclick = false;
						let dragStart = function(e) {
							e.preventDefault();
							if (e.buttons == 1) {
								if (dblclick) {
									this.props.moving = 0;
									if (this.props.snapped) {
										this.actions.unsnap();
									} else {
										this.actions.snap({
											top: true,
											right: true,
											bottom: true,
											left: true
										});
									}
									dblclick = false;
								} else {
									dblclick = true;
									this.props.moving = 1;
									if (!this.props.snapped) {
										this.props.preSnappedProps = {
											left: devtoolsFrame.offsetLeft,
											width: devtoolsFrame.offsetWidth,
											top: devtoolsFrame.offsetTop,
											height: devtoolsFrame.offsetHeight
										};
									}
									this.props.hookStart.startX = e.layerX - window.scrollX;
									this.props.hookStart.startY = e.layerY - window.scrollY;
									setTimeout(function() {
										dblclick = false;
									}.bind(this), 350);
								}
							}
						}.bind(this);
						view.headerBar.addEventListener('mousedown', dragStart);
						devtools.modules.global.events.shutdown.push(function() {
							view.headerBar.removeEventListener('mousedown', dragStart);
						}.bind(this));
					},
					hookDrag: function() {
						let durringDrag = function(e) {
							if (this.props.moving && e.buttons == 1) {
								e.preventDefault();
								this.props.moving = 2;
								if (this.props.snapped) {
									this.props.hookStart.startX += e.clientX * (this.props.preSnappedProps.width / devtoolsFrame.offsetWidth - 1);
								}
								devtoolsFrame.dispatchEvent(view._event.moveEvent.event);
								let x = e.clientX - this.props.hookStart.startX;
								let y = e.clientY - this.props.hookStart.startY;
								this.actions.unsnap();
								view._event.moveEvent.after();
								if (e.clientX >= 0 && e.clientX <= window.innerWidth) {
									devtoolsFrame.style.left = x + 'px';
								}
								if (e.clientY >= 0 && e.clientY <= window.innerHeight) {
									devtoolsFrame.style.top = y + 'px';
								}
								let atLeftRight = x <= -this.props.hookStart.startX + 15 ||
									x >= window.innerWidth - this.props.hookStart.startX - 16;
								let atTopBottom = y <= - this.props.hookStart.startY + 15 ||
									y >= window.innerHeight -  this.props.hookStart.startY - 16;
								this.actions.previewSnap({
									top: atTopBottom && y <= -this.props.hookStart.startY,
									right: atLeftRight && x >= window.innerWidth - this.props.hookStart.startX - 1,
									bottom: atTopBottom && y >= window.innerHeight - this.props.hookStart.startY - 1,
									left: atLeftRight && x <= this.props.hookStart.startX
								});
							}
						}.bind(this);
						document.addEventListener('mousemove', durringDrag);
						devtools.modules.global.events.shutdown.push(function() {
							document.removeEventListener('mousemove', durringDrag);
						}.bind(this));
					},
					hookEnd: function() {
						let dragEnd = function(e) {
							if (this.props.moving == 2) {
								e.stopPropagation();
								if (this.props.nextSnap.active) {
									this.actions.snap(this.props.nextSnap);
									this.actions.previewSnap({});
								}
								this.props.moving = 0;
							}
						}.bind(this);
						view.headerBar.addEventListener('mouseup', dragEnd);
						window.addEventListener('mouseup', dragEnd);
						devtools.modules.global.events.shutdown.push(function() {
							view.headerBar.removeEventListener('mouseup', dragEnd);
							window.removeEventListener('mouseup', dragEnd);
						}.bind(this));
					}
				}
			},
			fancyBar: {
				init: function() {
					view.fancyBar.fancyBar = document.createElement('span');
					view.fancyBar.fancyBar.id = 'fancyBar';
					view.modulesSection.appendChild(view.fancyBar.fancyBar);
				},
				slideTo: function(elem) {
					view.fancyBar.fancyBar.style.left = elem.offsetLeft + 'px';
					view.fancyBar.fancyBar.style.width = elem.offsetWidth + 'px';
				}
			}
		};
		controller.init.init();
	})(devtools.modules.global.elements.devtoolsFrame);
})();
