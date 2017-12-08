### 2degrees Broadband Usage Monitor extension for Chrome

*Previously known as Snap Usage Monitor.*

---

⚠ <b>2017-12-08 edit:</b>

2degrees recently changed their login and details page (resulting in parsing errors), and I've just switched ISPs, so I don't plan to continue supporting this extension at this time.

As such, I've unpublished this extension from the Chrome Web Store.

If anyone else would like to take over, please post a pull request or issue.

---

![](http://i.imgur.com/v88qYcb.png) ![](http://i.imgur.com/tExcgLi.png)

If you're a [2degrees Broadband](https://www.2degreesmobile.co.nz/broadband) or [Snap Prepay](https://prepay.2degreesbroadband.co.nz/) customer in New Zealand, this Chrome extension lets you view details of your data usage with the click of a button:
* Data used
* Data remaining
* Off-peak data used (if you have Uncapped Nights from 1am-7am)
* Free YouTube data used (if you have All You Can Eat YouTube)
* Average daily usage
* Billing period estimate
* Suggested daily usage
* Time remaining

And a visual progress bar that displays:
* Percentage of data used towards your limit
* How far through the billing period you are

---

### Installation instructions

Using Chrome? [Download from the Chrome Web Store.](https://chrome.google.com/webstore/detail/okffoefibimfmcddjbmbfnlbjdpjokkn)

Using Opera? Download [2degrees_Opera_0.7.1a.nex](https://github.com/ChrisNZL/snap-chromium/raw/master/releases/2degrees_Opera_0.7.1a.nex) and drag it to your Extensions page.


#### Wanting to update?

If your browser hasn't automatically updated the extension for you, you can force your browser to try and update:

1. Go to your browser's extensions page.
2. Select "Developer Mode".
3. Click the "Update extensions now" button.

---

### Help, FAQ

Please view the [Help/FAQ wiki page](https://github.com/ChrisNZL/snap-chromium/wiki/Help-FAQ) for other details.

---

### Changelog
v0.7.1 - 4 September 2015
* Fixed some issues with the new 2degrees Prepay Broadband page.

v0.7.0 - 28 July 2015
* Embraced the 2degrees Broadband launch. RIP Snap.

v0.6.0 - 6 April 2015
* Added support for Snap Prepay; use your full xxxxx@prepay.snap.net.nz username when logging in.

v0.5.3 - 21 May 2014
* Fixed a number parsing error.

v0.5.2 - 20 May 2014
* Fixed data limit being parsed improperly.

v0.5.1 - 18 May 2014
* If you have Unlimited Data, your usage bar now fills with green to match how far through the current billing period you are.
* Updated jQuery to v2.1.1.
* Big thank you to Ed Linklater!

v0.4.0 - 5 July 2013
* Free YouTube data usage is now shown if you have it.
* Fixed Uncapped Nights data usage not displaying correctly in some
cases.
* Free YouTube and Uncapped Nights usage is now slightly faded to
increase readability and visual separation from regular data
calculations.
* Close button to dismiss network messages is now visible by default.
* Plan names that contain "& Snap Plus" are now truncated to not make
the pop-up window be too wide.

---

This extension is unofficial and not maintained by 2degrees.

If you need assistance, tweet me on Twitter [@ChrisNZL](https://twitter.com/ChrisNZL), or email me chrisnzl@snap.net.nz - thanks!
