$(window).on('load', function() {
	var text = [{
		description: 'This setup will take you through the steps to install developer tools.',
		btn: 'Start'
	}, {
		description: 'For offline use, a service worker needs to be installed.',
		btn: 'Install',
		onclick: function() {
			allowNext = false;
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('serviceWorker.js', {
					scope: './'
				}).then(function (registration) {
					allowNext = true;
					$('#start').attr('onclick', 'alert()');
				}).catch(function (err) {
					toSlide({
						title: 'An error occurred.',
						description: err
					});
				});
			} else {
				toSlide({
					title: 'An error occurred.',
					description: 'ServiceWorkers are not supported on your device yet...',
					btn: 'Enable',
					onclick: function () {
						window.open('chrome://flags');
					}
				});
			}
		}
	}, {
		title: 'Success!',
		description: 'The service worker has been installed. To start, drag this to your bookmarks bar.',
		btn: 'Drag Me!'
	}];
	var slide = 0;
	var allowNext = true;
	var toSlide = function(props) {
		if (props.title) {
			$('#title').text(props.title);
		}
		$('#description').text(props.description);
		$('#start').text(props.btn);
		if (props.onclick) {
			$('#start').one('click', function(e) {
				e.stopPropagation();
				props.onclick();
			});
		}
	};
	$('#start').click(function() {
		if (allowNext) {
			toSlide(++slide > text.length - 1 ? text.length - 1 : text[slide]);
		}
	});
	toSlide(text[slide]);
});