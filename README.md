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
    * the location protocol is not 'view-source:'
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
          * the location querystring contains 'JSON-DataView=json'
          * the location hash is '#JSON-DataView'

## Comments

  * It's become pretty standard practice for jsonp responses to contain javascript comments.
    The comments serve as a form of protection against an Adobe Flash Player exploit that uses jsonp to bypass the same-origin security policy. This [attack](https://github.com/mikispag/rosettaflash) is known as [Rosetta Flash](http://miki.it/blog/2014/7/8/abusing-jsonp-with-rosetta-flash/).

  * This addon will ignore both leading and trailing comments (in both `//` and `/* */` formats)
    when processing the response to determine whether it contains a valid jsonp callback function.
    After the format of the response is validated, the parameter string is extracted and treated as a string of JSON data.

  *	In the detection methodology, the inspection of the requested URL for an explicit trigger
    in either the querystring or hash
    gives the added ability to signal to the addon that the response contains JSON data.
    This becomes extremely useful when the content-type is too generic
    (either a misconfigured web server, poorly written backend script, or a local file read directly from disk)
    and the pathname doesn't include the proper file extension.

        > http://hostname/path/to/some_data.txt#JSON-DataView

        > http://hostname/path/to/some_data.txt?JSON-DataView=json

        > http://hostname/retrieve_data.php?id=some#JSON-DataView

        > http://hostname/retrieve_data.php?id=some&JSON-DataView=json

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

    > * __IS NOT__ acted upon by this addon, since the criteria for the detection methodology are not met

    > * any of the following methods could be used to satisfy these criteria:

    >   * wrap the response in a JSONP callback:

    >     > http://headers.jsontest.com/?mime=2&callback=hello_world

    >   * append the custom hash value:

    >     > http://headers.jsontest.com/?mime=2#JSON-DataView

    >   * append the custom querystring parameter:

    >     > http://headers.jsontest.com/?mime=2&JSON-DataView=json

  * http://headers.jsontest.com/?mime=3

    > * 'content-type' of response === 'text/javascript'

    > * __IS NOT__ acted upon; same work-around methods could be used (as in the earlier example)

  * http://headers.jsontest.com/?mime=4

    > * 'content-type' of response === 'text/html'

    > * __IS NOT__ acted upon. This is an unsupported 'content-type'; there is no available work-around.

  * http://headers.jsontest.com/?mime=5

    > * 'content-type' of response === 'text/plain'

    > * __IS NOT__ acted upon; same work-around methods could be used (as in the earlier example)

## License
  > [GPLv3](http://www.gnu.org/licenses/gpl-3.0.txt)
