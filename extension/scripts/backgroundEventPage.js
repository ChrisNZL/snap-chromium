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
				var barWidth = Math.round(17 * u.dataUsedPercentage);
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
	chrome.storage.local.get(['snapUsername', 'snapPassword'], function(credentials){
		if (credentialsLookOkay(credentials.snapUsername, credentials.snapPassword)) {
			chrome.browserAction.setPopup({popup:'/html/browserActionPopup.html'});
		
			// Create (or replace existing) alarm to get data usage again in 15 minutes
			chrome.alarms.create('fetchDataUsageAlarm', { periodInMinutes:15 });
			
			// POST user's credentials to the login URL with attribute names that match Snap's login form
			var loginUrl = 'https://myaccount.snap.net.nz/login/?next=/summary';
			var postData = {
				form_Username: credentials.snapUsername,
				form_Password: credentials.snapPassword,
				action: 'Login'
			};
			var request = $.post(loginUrl, postData)
			.done(function(result){
				if ($('div.error', result).length > 0) {
					console.warn('Oops! Snap\'s server returned the following error:\n\n"'+$('div.error', result).text()+'"\n\nPlease ensure your username and password are correct.');
				} else if ($('h2:contains("Data Services")', result).length != 1) {
					console.warn('Oops! Snap Usage Monitor logged into your account okay, but no Data Services were found.');
				} else {
					// Logged in successfully!
					// Parse the fetched HTML
					var tableRow = $('div.service tbody tr', result).first();
					var cell_0 = $('td', tableRow).first();
					var planName = $('a', cell_0).text();
					var billingPeriodDates = $('span', cell_0).text().split('-');
					var billingPeriodStartDate = $.trim(billingPeriodDates[0]);
					var billingPeriodEndDate = $.trim(billingPeriodDates[1]);
					var gigabyteLimit = $('td', tableRow).last().text().split(' ')[0];
					var gigabytesRemaining;
					var remainingCell = $('td', tableRow).last().prev();
					var remainingNumbers = remainingCell.text().split(' ')[0];
					// Remaining data cell is normally in GB
					if (substr_count(remainingCell.text(), 'GB') == 1) {
						gigabytesRemaining = remainingNumbers;
					// But if there's less than 1 GB remaining, data is displayed in MB
					} else {
						gigabytesRemaining = remainingNumbers / 1024;
					}
					
					// See if user has uncapped nights
					var uncappedNightsEnabled = false;
					$('div#mod-id > p', result).each(function(){
						if ($(this).text() == 'You currently have unlimited data between 1am and 7am.') {
							uncappedNightsEnabled = true;
						}
					});
					
					// Record the time that this was fetched
					chrome.storage.local.set({ timeDataWasLastFetched: time() });
					
					// Save the data and finish
					var dataService = {
						planName: planName,
						billingPeriodStartDate: billingPeriodStartDate,
						billingPeriodEndDate: billingPeriodEndDate,
						gigabyteLimit: gigabyteLimit,
						gigabytesRemaining: gigabytesRemaining,
						uncappedNightsEnabled: uncappedNightsEnabled
					};
					chrome.storage.local.set({ dataService: dataService }, function(){
						createBrowserActionIcon();
						if (dataService.uncappedNightsEnabled == true) {
							fetchOffpeakDataUsage(dataService);
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
	});
}

// Function to retrieve offpeak/unlimited/free data (sits on a different page from the fetchDataUsage function)
function fetchOffpeakDataUsage (dataService) {
	// Example URL: https://myaccount.snap.net.nz/summary/dynamic/daily/?date=2013-06-10%2013:00:00
	var u = getUsageInfoObject(dataService);
	var dailyBreakdownUrl = 'https://myaccount.snap.net.nz/summary/dynamic/daily/?date=' + date('Y-m-d%20H:i:s', u.billingPeriodStartTime);
	$.get(dailyBreakdownUrl)
	.done(function(result){
		if ($('div#total_usage td', result).length == 3) {
			var uncappedNightsCell = $('div#total_usage td', result).last();
			var usageText = $('b', uncappedNightsCell).text();
			var usageParts = usageText.split(' ');
			var gigabytes = usageParts[0] / (usageParts[1] == 'GB' ? 1 : 1024);
			chrome.storage.local.set({ offpeakDataUsed: gigabytes }, function(){
				chrome.runtime.sendMessage(null, 'Data has been fetched and saved');
			});
		}
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
