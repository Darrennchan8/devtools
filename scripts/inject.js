/**
 * Created by Darren on 1/27/2017.
 * This is the code that goes in the 'bookmarklet,'
 * which should have a minimal amount of code.
 */
!function() {
	let a = document.createElement('script');
	a.src = '//devtools-12883.firebaseapp.com/scripts/devtools/devtools.js';
	document.body.appendChild(a);
}();