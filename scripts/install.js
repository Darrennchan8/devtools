$(window).on('load', function() {
	'use strict';
	let text = [{
		success: {
			title: 'Welcome to the Developer Tools Setup!',
			description: 'This setup will take you through the steps to install developer tools.',
			btn: 'Start',
			onclick: function(props) {
				props.response.resolve();
			}
		},
		fail: {
			title: 'An error occurred.',
			description: 'An unexpected error occurred during initialization.',
			btn: 'Refresh Page',
			onclick: function(props) {
				props.btn.disable();
				location.reload();
			}
		}
	}, {
		success: {
			title: 'Install a ServiceWorker',
			description: 'For offline use, a service worker needs to be installed.',
			btn: 'Install',
			onclick: function(props) {
				props.btn.disable();
				if ('serviceWorker' in navigator && navigator.serviceWorker.register) {
					navigator.serviceWorker.register('serviceWorker.js', {
						scope: './'
					}).then(function (registration) {
						console.log(registration);
						props.response.resolve();
					}).catch(function () {
						props.response.reject();
					});
				} else {
					props.response.reject();
				}
			}
		},
		fail: {
			title: 'An error occurred.',
			description: 'An unexpected error occurred during initialization.',
			btn: 'Refresh Page',
			onclick: function(props) {
				props.btn.disable();
				location.reload();
			}
		}
	}, {
		success: {
			enter: function(props) {
				props.btn.disable();
				$.ajax('scripts/inject.js', {
					dataType: 'text'
				}).done(function(data) {
					props.response.resolve();
					props.btn.enableCode(data, 'Developer Tools');
				}).fail(function() {
					props.response.reject();
				});
			},
			title: 'Gathering data...',
			description: 'The service worker has been installed. Fetching the injection script...',
			btn: 'Fetching...'
		},
		fail: {
			title: 'An error occurred.',
			description: 'ServiceWorkers may not have been enabled for this browser. To enable, go to chrome://flags, and enable service workers.',
			btn: 'Refresh Page',
			onclick: function(props) {
				props.btn.disable();
				location.reload();
			}
		}
	}, {
		success: {
			title: 'All Done!',
			description: 'Drag this button to your bookmarks bar, and click to trigger developer tools.',
			btn: 'Drag Me!'
		},
		fail: {
			title: 'An error occurred.',
			description: 'Unable to get the installation script',
			btn: 'Refresh Page',
			onclick: function(props) {
				props.btn.disable();
				location.reload();
			}
		},
	}];
	let slide = 0;
	let start = $('#start');
	let target;
	let linkerItem = $('#linkerItem');
	let props = {
		response: {
			resolve: function() {
				props.btn.enable();
				toSlide(++slide, true);
			},
			reject: function() {
				props.btn.enable();
				toSlide(++slide, false);
			}
		},
		btn: {
			currText: '',
			disable: function() {
				start.addClass('disabled');
				start.removeClass('noclick');
				linkerItem.addClass('noclick');
			},
			enable: function() {
				start.removeClass('disabled');
				start.removeClass('noclick');
				linkerItem.addClass('noclick');
			},
			text: function(txt) {
				start.text(txt);
			},
			enableCode: function(code, hintText) {
				let link = $('#linker');
				link.text(hintText);
				link.attr('href', 'javascript:' + code);
				linkerItem.removeClass('noclick');
				start.addClass('noclick');
			}
		}
	};
	start.on('click', function(e) {
		if (target.onclick) {
			target.onclick(props, e);
		}
	});
	let toSlide = function(index, success) {
		target = text[index][success ? 'success' : 'fail'];
		if (target.enter) {
			target.enter(props);
		}
		if (target.title) {
			$('#title').text(target.title);
		}
		$('#description').text(target.description);
		start.text(target.btn);
	};
	toSlide(slide, true);
});