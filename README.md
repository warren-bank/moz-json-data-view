# JSON-DataView
Firefox add-on that displays JSON data in a collapsible tree structure with syntax highlights.

## Summary

  * [jsonTreeViewer](https://github.com/summerstyle/jsonTreeViewer) served as a solid starting point for creating a DOM structure from JSON data

      > nicely coded

  * [highlight.js](https://github.com/isagalaev/highlight.js) is used to provide syntax highlighting to the DOM structure

## Detection methodology

  * the add-on modifies all server responses that satisfy all of the following criteria:
    * the HTTP header 'content-type' is either:
      * 'application/json'
      * 'text/json'
      * 'text/x-json'
      * 'text/plain'
      * 'text/javascript'
      * 'application/javascript'
      * 'application/x-javascript'
    * the location protocol is not 'view-source:'
    * either:
      * the location pathname ends with '.json'
      * the location querystring contains 'callback=',
        and the response is structured as a JSONP callback function
      * the location querystring contains 'JSON-DataView=json'

        this gives the ability to explicitly signal to the addon that the response contains JSON data

        > http://hostname/path/to/some_data.txt?JSON-DataView=json

        > http://hostname/retrieve_data.php?id=some&JSON-DataView=json

## Comments

  * It's become pretty standard practice for jsonp responses to contain javascript comments.
    The comments serve as a form of protection against an Adobe Flash Player exploit that uses jsonp to bypass the same-origin security policy. This [attack](https://github.com/mikispag/rosettaflash) is known as [Rosetta Flash](http://miki.it/blog/2014/7/8/abusing-jsonp-with-rosetta-flash/).

  * this addon will ignore both leading and trailing comments (in both `//` and `/* */` formats)
    when processing the response to determine whether it contains a valid jsonp callback function.
    After the format of the response is validated, the parameter string is extracted and treated as a string of JSON data.

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

    > * raw .json data

    > * 'content-type' of response === 'application/json'

  * http://gdata.youtube.com/feeds/api/standardfeeds/most_popular?alt=json&v=2

    > * raw .json data

    > * 'content-type' of response === 'application/json'

    > * __IS NOT__ acted upon by this addon, since the criteria for the detection methodology are not met

  * http://gdata.youtube.com/feeds/api/standardfeeds/most_popular?alt=json&v=2&JSON-DataView=json

    > * same request/response as above with the addition of the querystring parameter: `JSON-DataView=json`

    > * __IS__ acted upon by this addon and rendered properly

## License
  > [GPLv3](http://www.gnu.org/licenses/gpl-3.0.txt)
