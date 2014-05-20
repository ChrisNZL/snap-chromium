### Snap Usage Monitor extension for Chromium-based browsers

**Requires a Chromium-based browser built on Chromium version 27 or higher.**

![](http://iforce.co.nz/i/1ahpkr4f.rez.png)

If [Snap](http://www.snap.net.nz/) is your ISP in New Zealand, this extension lets you view details of your data usage with the click of a button:
* Data used
* Data remaining
* Off-peak data used (if you have Uncapped Nights from 1am-7am)
* Free YouTube data used (if you have All You Can Eat YouTube)
* Average daily usage
* Billing period estimate
* Suggested daily usage
* Time remaining
* Network status announcements

And a visual progress bar that displays:
* Percentage of data used towards your limit
* How far through the billing period you are

This extension has been tested on:
* [Chromium](https://download-chromium.appspot.com/) v30
* [Comodo Dragon](http://www.comodo.com/home/browsers-toolbars/browser.php) v27
* [Google Chrome](https://www.google.com/intl/en/chrome/browser/) v27
* [Opera Next](http://www.opera.com/developer/next) v15

---

### Installation instructions

#### Using Google Chrome or Chromium?

[Download from the Chrome Web Store.](https://chrome.google.com/webstore/detail/snap-usage-monitor/okffoefibimfmcddjbmbfnlbjdpjokkn)

#### Using Opera Next?

[Download from Opera Add-ons.](https://addons.opera.com/en/extensions/details/snap-usage-monitor/?display=en)

#### Using a different browser or want to install manually?

1. Right-click [SnapChromium_0.5.2.crx](https://github.com/ChrisNZL/snap-chromium/raw/master/releases/SnapChromium_0.5.2.crx) (78 KB) and save this CRX file to your computer.
2. Open your Chromium-based browser's extensions page.
3. Click and drag the downloaded SnapChromium_0.5.2.crx file from your computer to your browser's extensions page; your browser will say "Drop to install".
4. Follow the installation prompts.

#### Wanting to update?

If your browser hasn't automatically updated the extension for you, you can force your browser to try and update:

1. Go to your browser's extensions page.
2. Select "Developer Mode".
3. Click the "Update extensions now" button.

Please note that the Opera Add-ons site can take a couple of days to review and publish updated versions.

---

### Help, FAQ

Please view the [Help/FAQ wiki page](https://github.com/ChrisNZL/snap-chromium/wiki/Help-FAQ) for other details.

---

### Changelog

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

This extension is unofficial and not maintained by Snap.

If you need assistance, tweet me on Twitter [@ChrisNZL](https://twitter.com/ChrisNZL), or email me chrisnzl@snap.net.nz - thanks!
