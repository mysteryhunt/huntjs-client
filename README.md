# HuntJS Client

The HuntJS client connectors a HuntJS backend running either on a server
or locally in a browser. While the constructors are different in these
two cases, the API is identical, so you only have to write your frontend
once.

## Setup

```
<!-- Include the HuntJS Client -->
<script type="text/javascript" src="https://storage.googleapis.com/hunt2018-js/huntjs-client/huntjs-client.min.js"></script>

<!--
  To run in-browser, also include your puzzle's compiled Javascript (from
  running `yarn build-browser` from the backend folder)
-->
<script type="text/javascript" src="./mypuzzle.js"></script>

<!--
  Create your client and connect to the backend. HuntJSClient will automatically
  detect whether you've included the puzzle client-side to know whether to
  operate in-browser or connect to the server
-->
<script type="text/javascript">
  /*
    The first argument here is the name of your puzzle. This MUST match the
    HUNT_APP_NAME define in your backend's webpack.config.js.

    The second argument here is the URL of your puzzle backend's server. The
    tech team will let you know what URL to use once they set up the
    server.
  */
  var client = HuntJSClient.connect('MyPuzzle', 'https://my-puzzle.hunt2018.com');

  client.get('/someGetEndpoint').then(
    function(result) { alert(result); },
    function(error) { console.error(error); alert(error.message); }
  )

  client.post('/somePostEndpoint').then(
    function(result) { alert(result); },
    function(error) { console.error(error); alert(error.message); }
  )

  // This only works with server-based ones right now
  var ws = client.subscribe('someChannel', function(data) {
    console.log(data);
  });
  ws.addEventListener('open', function() {
    // called when the websocket connects or re-connects
  });
</script>
```
