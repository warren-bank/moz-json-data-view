# JSON-DataView
Firefox add-on that displays JSON data in a collapsible tree structure with syntax highlights.

## Screenshot

![JSONP response in Google data feed](https://raw.githubusercontent.com/warren-bank/moz-json-data-view/screenshots/01.png)

## Summary

  * [jsonTreeViewer](https://github.com/summerstyle/jsonTreeViewer) served as a solid starting point for creating a DOM structure from JSON data

      > nicely coded

  * [highlight.js](https://github.com/isagalaev/highlight.js) is used to provide syntax highlighting to the DOM structure

## Detection methodology

  * This add-on will modify the display of all server responses (or local files) that satisfy all of the following criteria:
    * none of the following short-circuit conditions are true:
      * the location protocol is 'view-source:'
      * the location hash contains: `No-JSON-DataView`

        > notes:
        > * not case sensitive
        > * can be combined with other hash tokens by using one of the separators: `/,`

    * either:
      * the HTTP header 'content-type' is one of:
        * 'application/json'
        * 'text/json'
        * 'text/x-json'
      * or both must be true:
        * the HTTP header 'content-type' is one of:
          * 'application/javascript'
          * 'application/x-javascript'
          * 'text/javascript'
          * 'text/plain'
        * and one of the following additional conditions are met:
          * the location pathname ends with '.json'
          * the location querystring contains 'callback=',
            and the response is structured as a JSONP callback function
          * the location hash contains: `JSON-DataView`

## Comments

  * It's become pretty standard practice for jsonp responses to contain javascript comments.
    The comments serve as a form of protection against an Adobe Flash Player exploit that uses jsonp to bypass the same-origin security policy. This [attack](https://github.com/mikispag/rosettaflash) is known as [Rosetta Flash](http://miki.it/blog/2014/7/8/abusing-jsonp-with-rosetta-flash/).

  * This addon will ignore both leading and trailing comments (in both `//` and `/* */` formats)
    when processing the response to determine whether it contains a valid jsonp callback function.
    After the format of the response is validated, the parameter string is extracted and treated as a string of JSON data.

  *	In the detection methodology, the inspection of the location hash for special `control tokens`
    provides a user the added ability to explicitly override the normal detection logic.

    This can be useful in a number of different circumstances. For instance:
      * A web server response is known to contain JSON data;
        however, the 'content-type' headers are too generic to pass normal detection.
        This would normally be the result of a misconfigured web server,
        or poorly written backend script.

        > the solution would be to manually append the `control token` that explicitly signals
          to the add-on that it should take action: `#JSON-DataView`

      * Another scenario (that I [recently ran into](https://github.com/warren-bank/moz-harviewer)) is when two different add-ons
        are both triggered to take action on the same page.

        JSON is a very general-purpose way to structure/serialize/transmit data.

        There are many `domain specific` data formats that are defined by a JSON schema.
        One such example is the [HTTP Archive format](http://www.softwareishard.com/blog/har-12-spec/).

        If there's an add-on that specifically targets one such format,
        then whether or not there is the potential for conflict between the two add-ons
        running at the same time depends on the particular data format.
        * If it has been assigned its own 'content-type' (and if servers tend to use it),
          then there won't be any conflict.
        * However, if this data format is sent with a generic JSON-ish 'content-type',
          then both add-ons will most likely be trying to detect the same conditions.

        This is where having the option to manually add `control tokens` is a very good thing.

        Concrete example:
        * both add-ons are installed:
          * [JSON-DataView](https://github.com/warren-bank/moz-json-data-view)
          * [HTTP Archive Viewer](https://github.com/warren-bank/moz-harviewer)
        * a HAR file is requested from a server
        * the 'content-type' of the response is: `application/json`
        * to view the HAR data in a rich visualization tool
          (with charts and graphs, etc) using the `HTTP Archive Viewer` add-on,
          the following `control tokens` could be used:
            * http://httparchive.webpagetest.org/export.php?test=140801_0_8JH&run=1&cached=0&pretty=1#HTTP-Archive-Viewer/No-JSON-DataView
        * conversely, to take a deep dive into the raw data using the `JSON-DataView` add-on,
          the following `control tokens` could be used:
            * http://httparchive.webpagetest.org/export.php?test=140801_0_8JH&run=1&cached=0&pretty=1#No-HTTP-Archive-Viewer/JSON-DataView
        * note that:
            * order of the `control tokens` doesn't matter
            * they are both case insensitive

              > the pretty capitalization is just for the README

## User Preferences:

  * syntax highlighting:
    * on/off toggle

      > default: on

    * choice of color scheme

      options consist of those provided by [highlight.js](https://github.com/isagalaev/highlight.js/tree/master/src/styles)

      > default: 'solarized_dark'

## Examples

  > URLs to render in-browser after the add-on has been installed, which illustrate its functionality

  * http://graph.facebook.com/coca-cola?callback=hello_world

    > * Facebook's graph API

    > * JSONP request/response

    > * 'content-type' of response === 'application/json'

      >> _note: this should be 'application/javascript' or 'text/javascript'_

    > * format of response content:

```javascript
/**/ hello_world({});
```

  * http://www.google.com/calendar/feeds/developer-calendar@google.com/public/full?alt=json&callback=hello_world

    >  * Google's calendar of developer events

    >  * JSONP request/response

    > * 'content-type' of response === 'text/javascript'

    > * format of response content:

```javascript
// API callback
hello_world({});
```

  * http://feeds.delicious.com/v2/json/popular?callback=hello_world

    > * delicious.com data feed; top 10 most popular.. somethings

    > * JSONP request/response

    > * 'content-type' of response === 'text/javascript'

    > * format of response content:

```javascript
hello_world([])
```

  * https://api.twitter.com/1.1/statuses/user_timeline.json

    > * response contains JSON data

    > * 'content-type' of response === 'application/json'

  * http://gdata.youtube.com/feeds/api/standardfeeds/most_popular?alt=json&v=2

    > * response contains JSON data

    > * 'content-type' of response === 'application/json'

  * http://headers.jsontest.com/?mime=1

    > * response contains JSON data

    > * 'content-type' of response === 'application/json'

  * http://headers.jsontest.com/?mime=2

    > * 'content-type' of response === 'application/javascript'

    > * __IS NOT__ acted upon
        * the criteria for the detection methodology are not met
        * any of the following methods could be used to satisfy these criteria:
          * wrap the response in a JSONP callback <sub>(requires cooperation server-side)</sub>:<br>
                http://headers.jsontest.com/?mime=2&callback=hello_world
          * add a `control token` to the hash:<br>
                http://headers.jsontest.com/?mime=2#JSON-DataView

  * http://headers.jsontest.com/?mime=3

    > * 'content-type' of response === 'text/javascript'

    > * __IS NOT__ acted upon
        * same work-around methods could be used (as in the earlier example)

  * http://headers.jsontest.com/?mime=4

    > * 'content-type' of response === 'text/html'

    > * __IS NOT__ acted upon.
        * This is an unsupported 'content-type'.
        * My understanding of how add-ons work within the larger application is very limited.
          Early on, I quickly worked through enough of the boilerplate framework
          that I felt I understood what was required to hook into responses of a
          particular 'content-type'. From that time on, all of my add-on development
          was focused on functionality that could be applied to a chosen group of 'content-types'.
        * Previously, I had said that there's no available work-around for this request.
          This comment was based on my limited understanding. Actual testing has proven me wrong.
        * I'm surprised to learn that a `control token` __CAN__ be added to the hash of this URL,
          and the add-on will take action on the response.
        * I'll be honest, I can't explain why the add-on is being invoked on this page.
          However, the conclusion that we have to draw is that the add-on will be invoked on all responses.
        * The add-on is written to short-circuit (exit immediately) unless some very specific conditions are met.
          So this won't prove to be any kind of performance suck.
        * It's actually a very pleasant surprise.
          It significantly broadens the scope of when/how this add-on can be used.
        * <sub>(If anybody with a deeper understanding of "nsIStreamConverter" components can explain what's going on here, please feel free to create an issue and share your insight. Thanks!)</sub>

  * http://headers.jsontest.com/?mime=5

    > * 'content-type' of response === 'text/plain'

    > * __IS NOT__ acted upon
        * same work-around methods could be used (as in the earlier example)

## License
  > [GPLv3](http://www.gnu.org/licenses/gpl-3.0.txt)
