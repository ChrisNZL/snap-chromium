// Function to get usage info object, derived StorageArea's dataService object
function getUsageInfoObject (dataService) {
	var planName = dataService.planName;
	var dataLimit = dataService.limitGB;
	var dataUsed = dataService.usedGB;
	var dataUsedPercentage = dataLimit ? dataUsed / dataLimit : false;
	var dataRemaining = dataService.remainingGB;
	var billingPeriodStartTime = strtotime(fixBillingPeriodDate(dataService.billingPeriodStartDate));
	var billingPeriodEndTime = strtotime(fixBillingPeriodDate(dataService.billingPeriodEndDate));
	var daysInBillingPeriod = (billingPeriodEndTime - billingPeriodStartTime) / 86400; // (60 seconds * 60 minutes * 24 hours)
	var daysElapsed = (time() - billingPeriodStartTime) / 86400;
	var daysElapsedPercentage = daysElapsed / daysInBillingPeriod;
	var secondsRemaining = billingPeriodEndTime - time();
	var hoursRemaining = secondsRemaining / 3600; // (60 seconds * 60 minutes)
	var daysRemaining = secondsRemaining / 86400;
	var averageDailyUsage = dataUsed / daysElapsed;
	var monthlyEstimate = averageDailyUsage * daysInBillingPeriod;
	var suggestedDailyUsage = dataLimit ? Math.min(dataRemaining / daysRemaining, dataRemaining) : false;
	  
	// Bar colour logic
  var barColor;
	if (dataLimit && dataUsed >= dataLimit) {
		barColor = 'red';
	} else if (dataLimit && monthlyEstimate > dataLimit) {
		barColor = 'orange';
	} else {
		barColor = 'green';
	}
	
	return {
		planName: planName,
		dataLimit: dataLimit,
		dataUsed: dataUsed,
		dataUsedPercentage: dataUsedPercentage,
		dataRemaining: dataRemaining,
		billingPeriodStartTime:	billingPeriodStartTime,
		billingPeriodEndTime: billingPeriodEndTime,
		daysInBillingPeriod: daysInBillingPeriod,
		daysElapsed: daysElapsed,
		daysElapsedPercentage: daysElapsedPercentage,
		secondsRemaining: secondsRemaining,
		hoursRemaining: hoursRemaining,
		daysRemaining: daysRemaining,
		averageDailyUsage: averageDailyUsage,
		monthlyEstimate: monthlyEstimate,
		suggestedDailyUsage: suggestedDailyUsage,
		barColor: barColor
	};
}

// Function to check if credentials look okay; returns true if username and password exist and contain characters
function credentialsLookOkay (username, password) {
	return (!username || !username.length || !password || !password.length) ? false : true;
}

// Function to add a space before the am/pm to help out strtotime()
function fixBillingPeriodDate (dateString) {
	dateString = str_replace('am ', ' am ', dateString);
	return str_replace('pm ', ' pm ', dateString);
}

// http://phpjs.org/functions/time/
function time () {
	return Math.floor(new Date().getTime() / 1000);
}

// http://phpjs.org/functions/number_format/
function number_format (number, decimals, dec_point, thousands_sep) {
	  // Strip all characters but numerical ones.
	  number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
	  var n = !isFinite(+number) ? 0 : +number,
		prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
		sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
		dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
		s = '',
		toFixedFix = function (n, prec) {
		  var k = Math.pow(10, prec);
		  return '' + Math.round(n * k) / k;
		};
	  // Fix for IE parseFloat(0.55).toFixed(0) = 0;
	  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
	  if (s[0].length > 3) {
		s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
	  }
	  if ((s[1] || '').length < prec) {
		s[1] = s[1] || '';
		s[1] += new Array(prec - s[1].length + 1).join('0');
	  }
	  return s.join(dec);
}

// http://phpjs.org/functions/strtotime/
function strtotime (text, now) {
	if (!text)
		return null;

	// Unecessary spaces
	text = text.trim()
		.replace(/\s{2,}/g, ' ')
		.replace(/[\t\r\n]/g, '')
		.toLowerCase();

	var parsed;

	if (text === 'now')
		return now === null || isNaN(now) ? new Date().getTime() / 1000 | 0 : now | 0;
	else if (!isNaN(parse = Date.parse(text)))
		return parse / 1000 | 0;
	if (text == 'now')
		return new Date().getTime() / 1000; // Return seconds, not milli-seconds
	else if (!isNaN(parsed = Date.parse(text)))
		return parsed / 1000;

	var match = text.match(/^(\d{2,4})-(\d{2})-(\d{2})(?:\s(\d{1,2}):(\d{2})(?::\d{2})?)?(?:\.(\d+)?)?$/);
	if (match) {
		var year = match[1] >= 0 && match[1] <= 69 ? +match[1] + 2000 : match[1];
		return new Date(year, parseInt(match[2], 10) - 1, match[3],
			match[4] || 0, match[5] || 0, match[6] || 0, match[7] || 0) / 1000;
	}

	var date = now ? new Date(now * 1000) : new Date();
	var days = {
		'sun': 0,
		'mon': 1,
		'tue': 2,
		'wed': 3,
		'thu': 4,
		'fri': 5,
		'sat': 6
	};
	var ranges = {
		'yea': 'FullYear',
		'mon': 'Month',
		'day': 'Date',
		'hou': 'Hours',
		'min': 'Minutes',
		'sec': 'Seconds'
	};

	function lastNext(type, range, modifier) {
		var day = days[range];

		if (typeof(day) !== 'undefined') {
			var diff = day - date.getDay();

			if (diff === 0)
				diff = 7 * modifier;
			else if (diff > 0 && type === 'last')
				diff -= 7;
			else if (diff < 0 && type === 'next')
				diff += 7;

			date.setDate(date.getDate() + diff);
		}
	}
	function process(val) {
		var split = val.split(' ');
		var type = split[0];
		var range = split[1].substring(0, 3);
		var typeIsNumber = /\d+/.test(type);

		var ago = split[2] === 'ago';
		var num = (type === 'last' ? -1 : 1) * (ago ? -1 : 1);

		if (typeIsNumber)
			num *= parseInt(type, 10);

		if (ranges.hasOwnProperty(range))
			return date['set' + ranges[range]](date['get' + ranges[range]]() + num);
		else if (range === 'wee')
			return date.setDate(date.getDate() + (num * 7));

		if (type === 'next' || type === 'last')
			lastNext(type, range, num);
		else if (!typeIsNumber)
			return false;

		return true;
	}

	var regex = '([+-]?\\d+\\s' +
		'(years?|months?|weeks?|days?|hours?|min|minutes?|sec|seconds?' +
		'|sun\\.?|sunday|mon\\.?|monday|tue\\.?|tuesday|wed\\.?|wednesday' +
		'|thu\\.?|thursday|fri\\.?|friday|sat\\.?|saturday)|(last|next)\\s' +
		'(years?|months?|weeks?|days?|hours?|min|minutes?|sec|seconds?' +
		'|sun\\.?|sunday|mon\\.?|monday|tue\\.?|tuesday|wed\\.?|wednesday' +
		'|thu\\.?|thursday|fri\\.?|friday|sat\\.?|saturday))(\\sago)?';

	match = text.match(new RegExp(regex, 'gi'));
	if (!match)
		return false;

	for (var i = 0, len = match.length; i < len; i++)
		if (!process(match[i]))
			return false;

	// ECMAScript 5 only
	//if (!match.every(process))
	//	return false;

	return (date.getTime() / 1000);
}

// http://phpjs.org/functions/date/
function date (format, timestamp) {
    var that = this,
      jsdate,
      f,
      formatChr = /\\?([a-z])/gi,
      formatChrCb,
      // Keep this here (works, but for code commented-out
      // below for file size reasons)
      //, tal= [],
      _pad = function (n, c) {
        n = n.toString();
        return n.length < c ? _pad('0' + n, c, '0') : n;
      },
      txt_words = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  formatChrCb = function (t, s) {
    return f[t] ? f[t]() : s;
  };
  f = {
    // Day
    d: function () { // Day of month w/leading 0; 01..31
      return _pad(f.j(), 2);
    },
    D: function () { // Shorthand day name; Mon...Sun
      return f.l().slice(0, 3);
    },
    j: function () { // Day of month; 1..31
      return jsdate.getDate();
    },
    l: function () { // Full day name; Monday...Sunday
      return txt_words[f.w()] + 'day';
    },
    N: function () { // ISO-8601 day of week; 1[Mon]..7[Sun]
      return f.w() || 7;
    },
    S: function(){ // Ordinal suffix for day of month; st, nd, rd, th
      var j = f.j()
      i = j%10;
      if (i <= 3 && parseInt((j%100)/10) == 1) i = 0;
      return ['st', 'nd', 'rd'][i - 1] || 'th';
    },
    w: function () { // Day of week; 0[Sun]..6[Sat]
      return jsdate.getDay();
    },
    z: function () { // Day of year; 0..365
      var a = new Date(f.Y(), f.n() - 1, f.j()),
        b = new Date(f.Y(), 0, 1);
      return Math.round((a - b) / 864e5);
    },

    // Week
    W: function () { // ISO-8601 week number
      var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3),
        b = new Date(a.getFullYear(), 0, 4);
      return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
    },

    // Month
    F: function () { // Full month name; January...December
      return txt_words[6 + f.n()];
    },
    m: function () { // Month w/leading 0; 01...12
      return _pad(f.n(), 2);
    },
    M: function () { // Shorthand month name; Jan...Dec
      return f.F().slice(0, 3);
    },
    n: function () { // Month; 1...12
      return jsdate.getMonth() + 1;
    },
    t: function () { // Days in month; 28...31
      return (new Date(f.Y(), f.n(), 0)).getDate();
    },

    // Year
    L: function () { // Is leap year?; 0 or 1
      var j = f.Y();
      return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
    },
    o: function () { // ISO-8601 year
      var n = f.n(),
        W = f.W(),
        Y = f.Y();
      return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
    },
    Y: function () { // Full year; e.g. 1980...2010
      return jsdate.getFullYear();
    },
    y: function () { // Last two digits of year; 00...99
      return f.Y().toString().slice(-2);
    },

    // Time
    a: function () { // am or pm
      return jsdate.getHours() > 11 ? "pm" : "am";
    },
    A: function () { // AM or PM
      return f.a().toUpperCase();
    },
    B: function () { // Swatch Internet time; 000..999
      var H = jsdate.getUTCHours() * 36e2,
        // Hours
        i = jsdate.getUTCMinutes() * 60,
        // Minutes
        s = jsdate.getUTCSeconds(); // Seconds
      return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
    },
    g: function () { // 12-Hours; 1..12
      return f.G() % 12 || 12;
    },
    G: function () { // 24-Hours; 0..23
      return jsdate.getHours();
    },
    h: function () { // 12-Hours w/leading 0; 01..12
      return _pad(f.g(), 2);
    },
    H: function () { // 24-Hours w/leading 0; 00..23
      return _pad(f.G(), 2);
    },
    i: function () { // Minutes w/leading 0; 00..59
      return _pad(jsdate.getMinutes(), 2);
    },
    s: function () { // Seconds w/leading 0; 00..59
      return _pad(jsdate.getSeconds(), 2);
    },
    u: function () { // Microseconds; 000000-999000
      return _pad(jsdate.getMilliseconds() * 1000, 6);
    },

    // Timezone
    e: function () { // Timezone identifier; e.g. Atlantic/Azores, ...
      // The following works, but requires inclusion of the very large
      // timezone_abbreviations_list() function.
/*              return that.date_default_timezone_get();
*/
      throw 'Not supported (see source code of date() for timezone on how to add support)';
    },
    I: function () { // DST observed?; 0 or 1
      // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
      // If they are not equal, then DST is observed.
      var a = new Date(f.Y(), 0),
        // Jan 1
        c = Date.UTC(f.Y(), 0),
        // Jan 1 UTC
        b = new Date(f.Y(), 6),
        // Jul 1
        d = Date.UTC(f.Y(), 6); // Jul 1 UTC
      return ((a - c) !== (b - d)) ? 1 : 0;
    },
    O: function () { // Difference to GMT in hour format; e.g. +0200
      var tzo = jsdate.getTimezoneOffset(),
        a = Math.abs(tzo);
      return (tzo > 0 ? "-" : "+") + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
    },
    P: function () { // Difference to GMT w/colon; e.g. +02:00
      var O = f.O();
      return (O.substr(0, 3) + ":" + O.substr(3, 2));
    },
    T: function () { // Timezone abbreviation; e.g. EST, MDT, ...
      // The following works, but requires inclusion of the very
      // large timezone_abbreviations_list() function.
/*              var abbr = '', i = 0, os = 0, default = 0;
      if (!tal.length) {
        tal = that.timezone_abbreviations_list();
      }
      if (that.php_js && that.php_js.default_timezone) {
        default = that.php_js.default_timezone;
        for (abbr in tal) {
          for (i=0; i < tal[abbr].length; i++) {
            if (tal[abbr][i].timezone_id === default) {
              return abbr.toUpperCase();
            }
          }
        }
      }
      for (abbr in tal) {
        for (i = 0; i < tal[abbr].length; i++) {
          os = -jsdate.getTimezoneOffset() * 60;
          if (tal[abbr][i].offset === os) {
            return abbr.toUpperCase();
          }
        }
      }
*/
      return 'UTC';
    },
    Z: function () { // Timezone offset in seconds (-43200...50400)
      return -jsdate.getTimezoneOffset() * 60;
    },

    // Full Date/Time
    c: function () { // ISO-8601 date.
      return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
    },
    r: function () { // RFC 2822
      return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
    },
    U: function () { // Seconds since UNIX epoch
      return jsdate / 1000 | 0;
    }
  };
  this.date = function (format, timestamp) {
    that = this;
    jsdate = (timestamp === undefined ? new Date() : // Not provided
      (timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
      new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
    );
    return format.replace(formatChr, formatChrCb);
  };
  return this.date(format, timestamp);
}

// http://phpjs.org/functions/str_replace/
function str_replace (search, replace, subject, count) {
  var i = 0,
    j = 0,
    temp = '',
    repl = '',
    sl = 0,
    fl = 0,
    f = [].concat(search),
    r = [].concat(replace),
    s = subject,
    ra = Object.prototype.toString.call(r) === '[object Array]',
    sa = Object.prototype.toString.call(s) === '[object Array]';
  s = [].concat(s);
  if (count) {
    this.window[count] = 0;
  }

  for (i = 0, sl = s.length; i < sl; i++) {
    if (s[i] === '') {
      continue;
    }
    for (j = 0, fl = f.length; j < fl; j++) {
      temp = s[i] + '';
      repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
      s[i] = (temp).split(f[j]).join(repl);
      if (count && s[i] !== temp) {
        this.window[count] += (temp.length - s[i].length) / f[j].length;
      }
    }
  }
  return sa ? s : s[0];
}

// http://phpjs.org/functions/substr_count/
function substr_count (haystack, needle, offset, length) {

  var cnt = 0;

  haystack += '';
  needle += '';
  if (isNaN(offset)) {
    offset = 0;
  }
  if (isNaN(length)) {
    length = 0;
  }
  if (needle.length == 0) {
    return false;
  }
  offset--;

  while ((offset = haystack.indexOf(needle, offset + 1)) != -1) {
    if (length > 0 && (offset + needle.length) > length) {
      return false;
    }
    cnt++;
  }

  return cnt;
}
