// Function to create a custom browser action icon for the extension
function createBrowserActionIcon () {
	
	// Only create icon if dataService storage info exists
	chrome.storage.local.get('dataService', function(storage){
		var dataService = storage.dataService;
		if (dataService != null) {
		
			// Function to load specified images for canvas - derived from http://www.html5canvastutorials.com/tutorials/html5-canvas-image-loader/
			var loadImages = function (sources, callback) {
				var images = {};
				var loadedImages = 0;
				var numImages = 0;
				// get num of sources
				for (var src in sources) {
					numImages++;
				}
				for (var src in sources) {
					images[src] = new Image();
					images[src].onload = function() {
						if (++loadedImages >= numImages) {
							callback(images);
						}
					};
					images[src].src = sources[src];
				}
			}

			// Set the images we will load
			var sources = {
				base: '/img/browserAction/base.png',
				barGreen: '/img/browserAction/barGreen.png',
				barOrange: '/img/browserAction/barOrange.png',
				barRed: '/img/browserAction/barRed.png',
				horizontalShadow: '/img/browserAction/horizontalShadow.png',
				notch: '/img/browserAction/notch.png'
			};
			
			// Create a canvas
			$('#myCanvas').remove();
			$('body').append('<canvas id="myCanvas" width="19" height="19"></canvas>');
			var myCanvas = document.getElementById('myCanvas');
			var context = myCanvas.getContext('2d');

			// Load images onto canvas
			loadImages(sources, function(images) {
			
				// Base icon - contains "s!" text and bar background)
				context.drawImage(images.base, 0, 0, 19, 19);
				
				// Percentage bar - either green, orange, or red
				var barColorImage;	
				var u = getUsageInfoObject(dataService);
				switch (u.barColor) {
					case 'green':
						barColorImage = images.barGreen;
						break;
					case 'orange':
						barColorImage = images.barOrange;
						break;
					case 'red':
						barColorImage = images.barRed;
						break;
				}
				var barWidth = Math.round( 17 * (u.dataLimit ? u.dataUsedPercentage : u.daysElapsedPercentage) );
				context.drawImage(barColorImage, 1, 14, barWidth, 4);
				
				// Horizontal shadow - goes to the right of the percentage bar
				if (barWidth < 17) {
					context.drawImage(images.horizontalShadow, barWidth + 1, 14, 1, 4);
				}
				
				// Notch - for the visual date representation
				var notchPosition = Math.round(u.daysElapsedPercentage * 17);
				notchPosition = Math.max(0, notchPosition);
				notchPosition = Math.min(16, notchPosition);
				context.drawImage(images.notch, notchPosition, 14, 3, 2);
				
				// Set the icon using the canvas' ImageData
				chrome.browserAction.setIcon({ imageData: context.getImageData(0, 0, 19, 19) });
			});
		}
	});
}

// Function to fetch Network Status info
function fetchNetworkStatus () {
	var networkStatusUrl = 'http://www.snap.net.nz/support/network-status';
	var request = $.get(networkStatusUrl, function(){})
		.done(function(result){
			$('p', result).each(function(){
				switch ($(this).text()) {
				
					case 'Planned Events':
						var sendDoneMessage = function () {
							chrome.runtime.sendMessage(null, 'Network status planned events have been fetched and saved');
						}
						var plannedEvents = [];
						var plannedEventsCount = 0;
						var plannedEvent;
						var ul = $(this).next('ul.phpmyfaq_ul');
						$('li', ul).each(function(){
							plannedEvent = {
								href: $('a', this).attr('href'),
								text: $('a', this).text()
							};
							plannedEventsCount++;
							plannedEvents.push(plannedEvent);
						});
						if (plannedEventsCount > 0) {
							// Determine whether to save these events or not
							chrome.storage.sync.get('oldPlannedEvents', function(storage){
								var newPlannedEvents = [];
								for (var x in plannedEvents) {
									var plannedEvent = plannedEvents[x];
									var plannedEventIsOld = false;
									for (var y in storage.oldPlannedEvents) {
										var oldPlannedEvent = storage.oldPlannedEvents[y];
										if (oldPlannedEvent.href == plannedEvent.href) {
											plannedEventIsOld = true;
											break;
										}
									}
									if (plannedEventIsOld == false) {
										newPlannedEvents.push(plannedEvent);
									}
								}
								if (newPlannedEvents.length > 0) {
									chrome.storage.sync.set({ newPlannedEvents: plannedEvents }, sendDoneMessage);
								}
							});
						} else {
							chrome.storage.sync.remove(['newPlannedEvents', 'oldPlannedEvents'], sendDoneMessage);
						}
						break;
						
					case 'Network Status':
						var ul = $(this).next('ul.phpmyfaq_ul');
						var a = $('a', ul);
						if (a.length == 1 && a.text() == 'OK - No Known Network Problems') {
							chrome.storage.local.remove('networkIsOkay');
						} else {
							chrome.storage.local.set({ networkIsOkay: false }, function(){
								chrome.runtime.sendMessage(null, 'Network is not okay');
							});
						}
						break;
				}
			});	
			
		})
		.fail(function(jqXHR, textStatus, errorThrown){
			console.warn('Oops! Snap Usage Monitor failed to fetch the network status page because:\n\n'+errorThrown);
		});
}

// Function to fetch data usage info from Snap
function fetchDataUsage () {

	// Only fetch data if credentials are stored
	chrome.storage.local.get(['snapUsername', 'snapPassword', 'isPrepay'], function(credentials){
		if (credentialsLookOkay(credentials.snapUsername, credentials.snapPassword)) {
			chrome.browserAction.setPopup({popup:'/html/browserActionPopup.html'});
		
			// Create (or replace existing) alarm to get data usage again in 15 minutes
			chrome.alarms.create('fetchDataUsageAlarm', { periodInMinutes:15 });

			if (credentials.isPrepay && credentials.isPrepay == true) {
				// POST user's credentials to the login URL with attribute names that match Snap's prepay login form
				//var loginUrl = 'http://127.0.0.1:8080/Myaccount.html';
				//var loginUrl = 'https://myaccount.snap.net.nz/login/?next=/summary';
				//var loginUrl = '/Snap.html'; // for testing
				var loginUrl = 'https://prepay.snap.net.nz/login_check';

				var postData = {
					_username: credentials.snapUsername,
					_password: credentials.snapPassword,
					_target_path: '/myprepay/'
				};
				var request = $.post(loginUrl, postData)
				.done(function(result){
					if ($('h2.error', result).length > 0) {
						console.warn('Oops! Snap\'s prepay server returned the following error:\n\n"'+$('h2.error', result).text()+'"\n\nPlease ensure your username and password are correct.');
					}
					else if ($('h1:contains("Account Details")', result).length != 1) {
						console.warn('Oops! Snap Usage Monitor supposedly logged into your prepay account okay, but no Account Details were found on your account page.');
					}
					else {
						// Logged in successfully! Parse the fetched HTML
						var tableRow = $('table.view.tablesorter tbody tr', result).first();
						
						// Plan details
						//var planCell = $('td', tableRow).eq(0);
						var planName = 'Snap Prepay'; //$('a', planCell).text();

						var prepayDateParts = $('td', tableRow).eq(3).text().split('-');

						var prepayDataExpirationDate = prepayDateParts[2]+'-'+prepayDateParts[1]+'-'+prepayDateParts[0] + ' 23:59';
						//var prepayDataExpirationDate = $('td', tableRow).eq(3).text();

						//var billingPeriodDates = $('span', planCell).text().split('-');
						//var billingPeriodStartDate = $.trim(billingPeriodDates[0]);
						//var billingPeriodEndDate = $.trim(billingPeriodDates[1]);
						
						// Used
						var usedCellString = $('td', tableRow).eq(1).text();
						//console.log(usedCellString.substring(usedCellString.length-2));
						if (usedCellString.substring(usedCellString.length-2) == 'GB') {
							usedGB = usedCellString.substring(0, usedCellString.length - 2);
						}
						else {
							usedGB = usedCellString.substring(0, usedCellString.length - 2) / 1024;
						}
						
						// Remaining
						var remainingCellString = $('td', tableRow).eq(2).text();
						if (remainingCellString.substring(remainingCellString.length-2) == 'GB') {
							remainingGB = remainingCellString.substring(0, remainingCellString.length - 2);
						}
						else {
							remainingGB = remainingCellString.substring(0, remainingCellString.length - 2) / 1024;
						}
						
						// Limit
						limitGB = parseFloat(usedGB) + parseFloat(remainingGB);
						/*if (remainingCell[0] == 'N/A') {
							limitGB = false;
						} else {
							var limitCell = $('td', tableRow).eq(3).text().split(' ');
							limitGB = limitCell[0];
						}*/
						
						/*// See if user has uncapped nights
						var uncappedNightsEnabled = false;
						$('div#mod-id > p', result).each(function(){
							if ($(this).text() == 'You currently have unlimited data between 1am and 7am.') {
								uncappedNightsEnabled = true;
							}
						});
						
						// See if user has free YouTube data
						var freeYouTubeEnabled = false;
						$('table.zebra > tbody td', result).each(function(){
							if ($(this).text().trim() == '+ All You Can Eat YouTube') {
								freeYouTubeEnabled = true;
							}
						});*/

						// Topups Activated
						var topupsActivated = 0;
						var topupTable = $('table.view.tablesorter', result).eq(1);
						 $('tbody tr', topupTable).each(function(){
							if (substr_count($('td', this).eq(5).text(), 'Yes')) {
								topupsActivated++;
							}
						});
						//console.log("topups: " + topupsActivated);
						
						// Record the time that this was fetched
						chrome.storage.local.set({ timeDataWasLastFetched: time() });
						
						// Save the data and finish
						var dataService = {
							isPrepay: true,
							planName: planName,
							prepayDataExpirationDate: prepayDataExpirationDate,
							//billingPeriodStartDate: billingPeriodStartDate,
							//billingPeriodEndDate: billingPeriodEndDate,
							limitGB: limitGB,
							usedGB: usedGB,
							remainingGB: remainingGB,
							//uncappedNightsEnabled: false,
							//freeYouTubeEnabled: false,
							
							// Legacy (for compatibility)
							//gigabyteLimit: limitGB,
							//gigabytesRemaining: remainingGB

							prepayTopupsActivated: topupsActivated
						};
						chrome.storage.local.set({ dataService: dataService }, function(){
							createBrowserActionIcon();
							/*if (dataService.uncappedNightsEnabled == true || dataService.freeYouTubeEnabled == true) {
								fetchFreeDataUsage(dataService);
							}*/
							fetchNetworkStatus();
							chrome.runtime.sendMessage(null, 'Data has been fetched and saved');
						});
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown){
					console.warn('Oops! Snap Usage Monitor failed to log in because:\n\n'+errorThrown);
				});


			}
			else {

				// POST user's credentials to the login URL with attribute names that match Snap's standard login form
				var loginUrl = 'https://myaccount.snap.net.nz/login/?next=/summary';
				//var loginUrl = '/Snap.html'; // for testing
				var postData = {
					form_Username: credentials.snapUsername,
					form_Password: credentials.snapPassword,
					action: 'Login'
				};
				var request = $.post(loginUrl, postData)
				.done(function(result){
					if ($('div.error', result).length > 0) {
						console.warn('Oops! Snap\'s server returned the following error:\n\n"'+$('div.error', result).text()+'"\n\nPlease ensure your username and password are correct.');
					}
					else if ($('h2:contains("Data Services")', result).length != 1) {
						console.warn('Oops! Snap Usage Monitor logged into your account okay, but no Data Services were found.');
					}
					else {
						// Logged in successfully! Parse the fetched HTML
						var tableRow = $('div.service tbody tr', result).first();
						
						// Plan details
						var planCell = $('td', tableRow).eq(0);
						var planName = $('a', planCell).text();
						var billingPeriodDates = $('span', planCell).text().split('-');
						var billingPeriodStartDate = $.trim(billingPeriodDates[0]);
						var billingPeriodEndDate = $.trim(billingPeriodDates[1]);
						
						// Used
						var usedCell = $('td', tableRow).eq(1).text().split(' ');
						if (usedCell[1] == 'GB') {
							usedGB = usedCell[0];
						}
						else {
							usedGB = usedCell[0] / 1024;
						}
						
						// Remaining
						var remainingCell = $('td', tableRow).eq(2).text().split(' ');
						if (remainingCell[0] == 'N/A') {
							remainingGB = false;
						}
						else if (remainingCell[1] == 'GB') {
							remainingGB = remainingCell[0];
						}
						else {
							remainingGB = remainingCell[0] / 1024;
						}
						
						// Limit
						if (remainingCell[0] == 'N/A') {
							limitGB = false;
						}
						else {
							var limitCell = $('td', tableRow).eq(3).text().split(' ');
							limitGB = limitCell[0];
						}
						
						// See if user has uncapped nights
						var uncappedNightsEnabled = false;
						$('div#mod-id > p', result).each(function(){
							if ($(this).text() == 'You currently have unlimited data between 1am and 7am.') {
								uncappedNightsEnabled = true;
							}
						});
						
						// See if user has free YouTube data
						var freeYouTubeEnabled = false;
						$('table.zebra > tbody td', result).each(function(){
							if ($(this).text().trim() == '+ All You Can Eat YouTube') {
								freeYouTubeEnabled = true;
							}
						});
						
						// Record the time that this was fetched
						chrome.storage.local.set({ timeDataWasLastFetched: time() });
						
						// Save the data and finish
						var dataService = {
							planName: planName,
							billingPeriodStartDate: billingPeriodStartDate,
							billingPeriodEndDate: billingPeriodEndDate,
							limitGB: limitGB,
							usedGB: usedGB,
							remainingGB: remainingGB,
							uncappedNightsEnabled: uncappedNightsEnabled,
							freeYouTubeEnabled: freeYouTubeEnabled,
							
							// Legacy (for compatibility)
							gigabyteLimit: limitGB,
							gigabytesRemaining: remainingGB
						};
						chrome.storage.local.set({ dataService: dataService }, function(){
							createBrowserActionIcon();
							if (dataService.uncappedNightsEnabled == true || dataService.freeYouTubeEnabled == true) {
								fetchFreeDataUsage(dataService);
							}
							fetchNetworkStatus();
							chrome.runtime.sendMessage(null, 'Data has been fetched and saved');
						});
					}
				})
				.fail(function(jqXHR, textStatus, errorThrown){
					console.warn('Oops! Snap Usage Monitor failed to log in because:\n\n'+errorThrown);
				});


			}

		}
	});
}

// Function to retrieve free data usage (eg Uncapped Nights and Free YouTube) (sits on a different page from the fetchDataUsage function)
// Example URL: https://myaccount.snap.net.nz/summary/dynamic/daily/?date=2013-06-10%2013:00:00
function fetchFreeDataUsage (dataService) {

	var getGigabytesFromCell = function (cell) {
		var usageText = $('b', cell).text();
		var usageParts = usageText.split(' ');
		var gigabytes = usageParts[0] / (usageParts[1] == 'GB' ? 1 : 1024);
		return gigabytes;
	};

	var u = getUsageInfoObject(dataService);
	var dailyBreakdownUrl = 'https://myaccount.snap.net.nz/summary/dynamic/daily/?date=' + date('Y-m-d%20H:i:s', u.billingPeriodStartTime);
	//var dailyBreakdownUrl = 'http://127.0.0.1/snap/dailyBreakdown.htm';
	$.get(dailyBreakdownUrl)
	.done(function(result){
		var offpeakDataUsed = 0;
		var youTubeDataUsed = 0;
		$('div#total_usage td', result).each(function(){
			if (substr_count($(this).text(), 'Uncapped Nights') > 0) {
				offpeakDataUsed = getGigabytesFromCell($(this));
			} else if (substr_count($(this).text(), 'Free Youtube') > 0) {
				youTubeDataUsed = getGigabytesFromCell($(this));
			}
		});
		chrome.storage.local.set({ offpeakDataUsed:offpeakDataUsed, youTubeDataUsed:youTubeDataUsed }, function(){
			chrome.runtime.sendMessage(null, 'Data has been fetched and saved');
		});
	})
	.fail(function(jqXHR, textStatus, errorThrown){
		console.warn('Oops! Snap Usage Monitor failed to fetch offpeak data usage because:\n\n'+errorThrown);
	});
}

$(document).ready(function(){

	// Enable the browser action pop-up page if user has credentials stored
	chrome.storage.local.get(['snapUsername', 'snapPassword'], function(credentials){
		if (credentialsLookOkay(credentials.snapUsername, credentials.snapPassword)) {
			chrome.browserAction.setPopup({popup:'/html/browserActionPopup.html'});
		}
	});

	// When this extension is first installed, prompt user to enter their login credentials
	chrome.runtime.onInstalled.addListener(
		function (details) {
			switch (details.reason) {
				case "install":
					chrome.tabs.create({url:"/html/options.html"});
					break;
				case "update":
					fetchDataUsage();
					break;
				case "chrome_update":
				
					break;
			}
		}
	);

	// Fetch data when Chrome starts
	chrome.runtime.onStartup.addListener(fetchDataUsage);

	// Alarm handler
	chrome.alarms.onAlarm.addListener(function(alarm){
		switch (alarm.name) {
			case 'fetchDataUsageAlarm':
				fetchDataUsage();
				break;
		}
	});

	// Check if data should be fetched
	chrome.storage.local.get('timeDataWasLastFetched', function(storage){
		chrome.alarms.get('fetchDataUsageAlarm', function(alarm){
			if (alarm == null || storage.timeDataWasLastFetched == null || time() >= parseInt(storage.timeDataWasLastFetched) + (60 * 15)) {
				fetchDataUsage();
			} else {
				createBrowserActionIcon();
			}
		});
	});
	
});
