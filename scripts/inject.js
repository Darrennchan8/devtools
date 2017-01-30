/**
 * Created by Darren on 1/27/2017.
 * This is the code that goes in the 'bookmarklet,'
 * which should have a minimal amount of code.
 */
!function(scriptName) {
	'use strict';
	let handleError = function(action, err) {
		alert('An Error occurred while ' + action + '.\n\nDetails: ' + err);
	};
	let xhr = new XMLHttpRequest();
	xhr.open('GET', 'https://devtools-12883.firebaseapp.com/scripts/devtools/devtools.js', true);
	xhr.send();
	xhr.onload = function() {
		let code = xhr.responseText;
		/**
		 *  @property webkitStorageInfo
		 *  @property requestQuota
		 *  @property PERSISTENT
		 *  @property webkitRequestFileSystem
		 *  @property getFile
		 *  @property createWriter
		 */
		window.webkitStorageInfo.requestQuota(window.PERSISTENT, 1024 * 1024, function(grantedBytes) {
			window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes, function(fs) {
				fs.root.getFile(scriptName, {create: true}, function(file) {
					file.remove(function() {
						fs.root.getFile(scriptName, {create: true}, function(file) {
							file.createWriter(function(fileWriter) {
								fileWriter.onwriteend = function() {
									let script = 'filesystem:' + location.origin + '/persistent/' + scriptName;
									let scriptElem = document.createElement('script');
									scriptElem.src = script;
									scriptElem.addEventListener('error', function(err) {
										handleError('loading ' + scriptName + ', a locally cached version of devtools', err);
									});
									document.body.appendChild(scriptElem);
								}.bind(this);
								fileWriter.onerror = handleError.bind('writing to a locally cached version of devtools');
								let blob = new Blob([code], {type: 'text/plain'});
								fileWriter.write(blob);
							}.bind(this), handleError.bind('using the File.createWriter API'));
						}.bind(this), handleError.bind('recreating a locally cached version of devtools'));
					}.bind(this), handleError.bind('deleting an old cached version of devtools'));
				}.bind(this), handleError.bind('creating/obtaining a locally cached version of devtools'));
			}.bind(this), handleError.bind('requesting the FileSystem'));
		}.bind(this), handleError.bind('obtaining the FileSystem'));
	};
}('devtoolsScript.js');