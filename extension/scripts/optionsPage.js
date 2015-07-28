// Save the user's login credentials to Chrome's local storageArea
function saveCredentials () {
	chrome.storage.local.set({
		snapUsername: $('#username').val(),
		snapPassword: $('#password').val(),
		isPrepay: $('#isPrepay').val() == 'true' ? true : false
	});
}

// Function to unfreeze the input fields
function unfreezeInputFields () {
	$('input').prop('disabled', false);
	$('#loginButton').val('Save');
}

// Function to reset the browser action icon
function resetBrowserActionIcon () {
	chrome.browserAction.setIcon({path:'/img/browserAction/base.png'});
}

// When the options page has loaded...
$(document).ready(function(){

	// Position the upcoming "all set" message
	$('div#allSet').css('margin-left', -$('div#allSet').width() - 45 - 5 - 2);

	// When options page first loads, check if we have user's login credentials.
	chrome.storage.local.get(['snapUsername', 'snapPassword'], function(credentials){
		var snapUsername = credentials.snapUsername;
		var snapPassword = credentials.snapPassword;
		if (!credentialsLookOkay(snapUsername, snapPassword)) {
			$('#username').focus();
		} else {
			$('#username').val(credentials.snapUsername);
			$('#password').val(credentials.snapPassword);
		}
	});
	
	// Insert footer
	$('span#version').text(chrome.runtime.getManifest().version);
	
	// Handle submitting the login form
	$('form#login').submit(function(){
	
		// Freeze the input fields
		$(':focus').blur();
		$('input').prop('disabled', true);
		$('#loginButton').val('Saving...');
		
		// Require both username and password fields
		if ($('#username').val().length == 0 || $('#password').val().length == 0) {
			alert('Oops! Please enter your 2degrees Broadband username and password.');
			unfreezeInputFields();
			$('#username').val().length == 0 ? $('#username').focus() : $('#password').focus();
			return false;
		}
		
		setTimeout(function(){

			var isPrepay = substr_count($('#username').val().toLowerCase(), '@prepay.snap.net.nz') > 0 ? true : false;

			var loginUrl = '';
			var postData = {};
			var request;

			if (isPrepay) {

				$('#isPrepay').val('true');

				loginUrl = 'https://prepay.2degreesbroadband.co.nz/login_check';



				//loginUrl = '/Snap.html';




				postData = {
					_username: $('#username').val(),
					_password: $('#password').val(),
					_target_path: '/myprepay/'
				};
				request = $.post(loginUrl, postData)
				.done(function(result){

					if ($('h2.error', result).length > 0) {
						resetBrowserActionIcon();
						alert('Oops! Snap\'s prepay server returned the following error:\n\n"'+$('h2.error', result).text()+'"\n\nPlease ensure your username and password are correct.');
						unfreezeInputFields();
					}
					else {
						saveCredentials();
						chrome.runtime.getBackgroundPage(function(backgroundPage){
							backgroundPage.fetchDataUsage();
							chrome.browserAction.setPopup({popup:'/html/browserActionPopup.html'});
							$('#loginButton').val('Saved!');
							setTimeout(function(){
								//unfreezeInputFields();
								$('#mainContent, #footer').fadeOut();
								$('div#allSet').fadeIn();
							}, 1000);
						});
					}

					//console.log(result);
					/*
					// If Snap's page returns an error, display the error
					if ($('div.error', result).length > 0) {
						resetBrowserActionIcon();
						alert('Oops! Snap\'s server returned the following error:\n\n"'+$('div.error', result).text()+'"\n\nPlease ensure your username and password are correct.');
						unfreezeInputFields();
					} else if ($('h2:contains("Data Services")', result).length != 1) {
						resetBrowserActionIcon();
						saveCredentials();
						alert('Oops! Snap Usage Monitor logged into your account okay, but no Data Services were found.');
						unfreezeInputFields();
					} else {
						// Otherwise we have logged in successfully!
						saveCredentials();
						chrome.runtime.getBackgroundPage(function(backgroundPage){
							backgroundPage.fetchDataUsage();
							chrome.browserAction.setPopup({popup:'/html/browserActionPopup.html'});
							$('#loginButton').val('Saved!');
							setTimeout(function(){
								//unfreezeInputFields();
								$('#mainContent, #footer').fadeOut();
								$('div#allSet').fadeIn();
							}, 1000);
						});
					}
					*/


				})
				.fail(function(jqXHR, textStatus, errorThrown){
					resetBrowserActionIcon();
					alert('Oops! 2degrees Broadband Usage Monitor failed to log in because:\n\n'+errorThrown);
					unfreezeInputFields();
				});

			}
			else {

				$('#isPrepay').val('false');

				// POST user's credentials to the login URL with attribute names that match Snap's login form
				loginUrl = 'https://secure.2degreesbroadband.co.nz/login/?next=/summary';
				postData = {
					form_Username: $('#username').val(),
					form_Password: $('#password').val(),
					action: 'Login'
				};
				request = $.post(loginUrl, postData)
				.done(function(result){
					// If Snap's page returns an error, display the error
					if ($('div.error', result).length > 0) {
						resetBrowserActionIcon();
						alert('Oops! 2degrees\' server returned the following error:\n\n"'+$('div.error', result).text()+'"\n\nPlease ensure your username and password are correct.');
						unfreezeInputFields();
					} else if ($('h2:contains("Data Services")', result).length != 1) {
						resetBrowserActionIcon();
						saveCredentials();
						alert('Oops! 2degrees Broadband Usage Monitor logged into your account okay, but no Data Services were found.');
						unfreezeInputFields();
					} else {
						// Otherwise we have logged in successfully!
						saveCredentials();
						chrome.runtime.getBackgroundPage(function(backgroundPage){
							backgroundPage.fetchDataUsage();
							chrome.browserAction.setPopup({popup:'/html/browserActionPopup.html'});
							$('#loginButton').val('Saved!');
							setTimeout(function(){
								//unfreezeInputFields();
								$('#mainContent, #footer').fadeOut();
								$('div#allSet').fadeIn();
							}, 1000);
						});
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown){
					resetBrowserActionIcon();
					alert('Oops! 2degrees Broadband Usage Monitor failed to log in because:\n\n'+errorThrown);
					unfreezeInputFields();
				});

			}

		}, 400);

		return false;
	});
	
});
