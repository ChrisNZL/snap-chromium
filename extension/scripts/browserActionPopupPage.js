// Function to display usage info in the pop-up page
function displayUsageInfo () {
	// Populate pop-up page with data
	chrome.storage.local.get(['dataService', 'timeDataWasLastFetched', 'offpeakDataUsed'], function(storage){
		var dataService = storage.dataService;
		var u = getUsageInfoObject(dataService);

		// Function to display a number nicely in GB
		var gbFormat = function (number) {
			return number_format(number, 2) + ' GB';
		}
		
		$('#planName a').text(u.planName);
		
		// Normal data
		$('#dataLimit').text(gbFormat(u.dataLimit));
		$('#dataUsed').text(gbFormat(u.dataUsed));
		$('#dataRemaining').text(gbFormat(u.dataRemaining));
		
		// Offpeak data
		if (dataService.uncappedNightsEnabled == true) {
			$('#offpeakDataUsed').text(gbFormat(storage.offpeakDataUsed));
			$('tr.offpeakData').css('display', 'table-row');
		}

		// Estimates
		$('#averageDailyUsage').html('<span class="tooltip">'+gbFormat(u.averageDailyUsage)+'</span>');
		var averageDailyKB = u.averageDailyUsage * 1048576;
		var averageDailyKBPerSecond = averageDailyKB / 86400;
		$('#averageDailyUsage').attr('title', number_format(averageDailyKBPerSecond, 1) + ' KB/s');
		
		$('#monthlyEstimate').text(gbFormat(u.monthlyEstimate));
		
		$('#suggestedDailyUsage').html('<span class="tooltip">'+gbFormat(u.suggestedDailyUsage)+'</span>');
		var kbRemaining = u.dataRemaining * 1048576; // 1 GB = 1048576 KB
		var kbPerSecond = kbRemaining / u.secondsRemaining;
		$('#suggestedDailyUsage').attr('title', number_format(kbPerSecond, 1) + ' KB/s');
		
		// Percentage bar
		$('#unfilledPortion').css('width', (100 - (u.dataUsedPercentage * 100)) + '%');
		$('#percentageBar').removeClass();
		$('#percentageBar').addClass(u.barColor);
		var percentageBarPixelWidth = $('#percentageBar').width();
		var notchMarginLeft = -3 + (percentageBarPixelWidth * u.daysElapsedPercentage);
		if (notchMarginLeft >= percentageBarPixelWidth - 3) {
			notchMarginLeft = percentageBarPixelWidth - 4;
		}
		$('#notch').css('margin-left', notchMarginLeft + 'px');
		
		// You have used X% of your monthly limit and are Y% through the current month
		var barTooltipText = Math.round(u.dataUsedPercentage * 100) + '% of your data limit has been used ('+u.barColor+' bar).\n'
			+ Math.round(u.daysElapsedPercentage * 100) + '% of the billing period has elapsed (black notch).';
		$('#percentageBar').attr('title', barTooltipText);
		
		// Time remaining
		if (u.daysRemaining >= 1) {
			var flooredDays = Math.floor(u.daysRemaining);
			if (flooredDays == 1) {
				var hrsCount = number_format(Math.floor(u.hoursRemaining) - 24, 0);
				var hrsText = '';
				if (hrsCount > 0) {
					hrsText = ', ' + hrsCount + (hrsCount == 1 ? ' hour' : ' hrs');
				}
				$('#timeRemaining').text(number_format(flooredDays, 0) + ' day' + hrsText);
			} else {
				$('#timeRemaining').text(number_format(flooredDays, 0) + ' days');
			}
		} else {
			if (u.hoursRemaining >= 1) {
				var hoursRemainingFormatted = number_format(Math.floor(u.hoursRemaining), 0)
				$('#timeRemaining').text(hoursRemainingFormatted + ' ' + (hoursRemainingFormatted == 1 ? 'hour' : 'hours'));
			} else {
				$('#timeRemaining').text('< 1 hour');
			}
		}
		
		// Time remaining tooltip
		var timeTooltipText;
		if (date('j F', u.billingPeriodEndTime) == date('j F')) {
			timeTooltipText = 'Your billing period resets today @ '+date('g:ia', u.billingPeriodEndTime)+'.';
		} else {
			timeTooltipText = 'Your billing period resets on '+date('j F Y @ g:ia', u.billingPeriodEndTime)+'.';
		}
			
		$('#timeRemaining').html('<span class="tooltip" title="'+timeTooltipText+'">'+$('#timeRemaining').text()+'</span>');
		
		// Time last updated
		var minutesUpdatedAgo = (time() - storage.timeDataWasLastFetched) / 60;
		var tooltipDate = date('j F Y @ g:ia', storage.timeDataWasLastFetched);
		if (minutesUpdatedAgo < 1) {
			$('#lastUpdated').html('Updated <span class="tooltip" title="'+tooltipDate+'">&lt; 1 min ago</span>');
		} else {
			var minsAgoText = number_format(minutesUpdatedAgo, 0);
			if (minsAgoText < 60) {
				$('#lastUpdated').html('Updated <span class="tooltip" title="'+tooltipDate+'">' + minsAgoText + ' min' + (minsAgoText == 1 ? '' : 's') + ' ago</span>');
			} else {
				var hoursAgoText = number_format(Math.floor(minsAgoText / 60), 0);
				$('#lastUpdated').html('Updated <span class="tooltip" title="'+tooltipDate+'">' + hoursAgoText + ' hour' + (hoursAgoText == 1 ? '' : 's') + ' ago</span>');
			}
		}
		
		// Add white space for readability
		$('tr.data').last().addClass('addWhiteSpaceBelow');
		$('tr.offpeakData').last().addClass('addWhiteSpaceBelow');
		$('tr.estimates').last().addClass('addWhiteSpaceBelow');
	});
}

// Function to display Network Status details
function displayNetworkStatus () {
	chrome.storage.sync.get(['newPlannedEvents', 'networkIsOkay'], function(storage){
		var plannedEventsExist = storage.newPlannedEvents != null && storage.newPlannedEvents.length > 0;
		var networkHasProblems = storage.networkIsOkay != null && storage.networkIsOkay == false;
		if (plannedEventsExist || networkHasProblems) {
			var networkStatusHtml = '<tr id="plannedEventsContainerRow"><td id="networkStatus" colspan="2"><div>\n';
			if (networkHasProblems) {
				networkStatusHtml += '<div class="networkStatusTitle"><a href="http://www.snap.net.nz/support/network-status" target="_blank">Snap\'s network is not OK &ndash; click here for details</a></div>\n';
			} else if (plannedEventsExist) {
				networkStatusHtml += '<img id="dismiss" src="/img/stop.png" title="Dismiss" />\n';
				networkStatusHtml += '<div class="networkStatusTitle"><a href="http://www.snap.net.nz/support/network-status" target="_blank">Upcoming network events:</a></div>\n';
				networkStatusHtml += '<div id="plannedEvents">';
				for (var x in storage.newPlannedEvents) {
					var newPlannedEvent = storage.newPlannedEvents[x];
					networkStatusHtml += '<a href="http://www.snap.net.nz'+newPlannedEvent.href+'" target="_blank">'+newPlannedEvent.text+'</a><br />\n';
				}
				networkStatusHtml += '</div>\n';
			}
			networkStatusHtml += '</div></td></tr>\n';
			$('tr#plannedEventsContainerRow').remove();
			$('tr#mainRow').after(networkStatusHtml);
			if (networkHasProblems) {
				$('td#networkStatus').addClass('networkIsNotOkay');
			}
			$('td#lastUpdated').parent('tr').addClass('addWhiteSpaceBelow');
			
			// When user clicks the Network Status #dismiss icon, mark newPlannedEvents as old so they don't get shown again, then shrink popup window
			if (plannedEventsExist && !networkHasProblems) {
				$('img#dismiss').on('click', function(){
					chrome.storage.sync.get(['oldPlannedEvents', 'newPlannedEvents'], function(storage) {
						var oldPlannedEvents = [];
						for (var x in storage.newPlannedEvents) {
							var newPlannedEvent = storage.newPlannedEvents[x];
							oldPlannedEvents.push(newPlannedEvent);
						}
						chrome.storage.sync.set({ oldPlannedEvents: oldPlannedEvents }, function(){
							chrome.storage.sync.remove('newPlannedEvents', function(){
								var bodyHeight = $('body').height();
								var containerHeight = $('tr#plannedEventsContainerRow').height();
								$('tr#plannedEventsContainerRow').remove();
								$('html, body').css('height', (bodyHeight - containerHeight) + 'px');
							});
						});
					});
				});
			}
		}
	});
}

$(document).ready(function(){

	// Display usage info when pop-up page is ready
	displayUsageInfo();
	displayNetworkStatus();
	
	// When user clicks the Reload icon, fetch new usage info
	$('#update img').click(function(){
		$('#lastUpdated').text('Updating...');
		setTimeout(function(){
			chrome.runtime.getBackgroundPage(function(bg){
				bg.fetchDataUsage();
			});
		}, 400);
	});
	
	// Refresh the data displayed in the pop-up once backgroundPage has finished fetching it
	chrome.runtime.onMessage.addListener(function(message){
		switch (message) {
			case 'Data has been fetched and saved':
				displayUsageInfo();
				break;
			case 'Network status planned events have been fetched and saved':
				displayNetworkStatus();
				break;
			case 'Network is not okay':
				displayNetworkStatus();
				break;
		}
	});
	
});
