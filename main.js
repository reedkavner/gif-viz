$(document).ready(function() {

    // Config constants
    const nameHeight = 20; // height of the slackName div in pixels
    const baseDuration = 20; //  base animation duration in seconds
    const maxScale = .9; // maximum scale
    const minScale = 0.2; // maximum scale
    const intervalReset = 10; // time in seconds for when a users gif displays at full scale
    const spawnaArea = .15 // percentage margin around the screen

    const $main = $('#main');

    const connection = new signalR.HubConnectionBuilder()
        .withUrl(`https://xoxo-closing-party.azurewebsites.net/api`)
        .configureLogging(signalR.LogLevel.Information)
        .build();

    // TODO make this call an actual function
    connection.on('newMessage', function(j) {
        console.log('got a message!');
        console.log(j.url);
        addPost(j);
    });

    connection.onclose(() => console.log('disconnected'));

    console.log('connecting...');
    connection.start()
        .then(() => console.log("Connected!"))
        .catch(console.error);

    // get window size
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();

    // create a smaller area in the middle of the window to spawn new posts
    var spawnHeight = windowHeight * (1 - spawnaArea);
    var spawnHeightOffset = windowHeight - spawnHeight;
    var spawnWidth = windowWidth * (1 - spawnaArea);
    var spawnWidthOffset = windowWidth - spawnWidth;

    console.log(spawnHeightOffset, spawnHeight, spawnWidthOffset, spawnWidth);

    // keep track of users and when they last posted
    var users = {};

    // get currect epoch time in seconds
    function timeNow() {
        var now = new Date();
        return Math.round(now.getTime() / 1000);
    }

    // get a random int between two given ints (inclusive)
    function randomInt(min, max) {
        console.log(min, max);
        return Math.floor(Math.random() * (max - min + 1) + min);
    };

    // generate a random position
    function randomPosition(height, width, scale) {
        var totalHeight = height + nameHeight;
        
        var top = randomInt(
            spawnHeightOffset - (totalHeight/2 * (1-scale)), 
            spawnHeight - (scale * totalHeight) - ((totalHeight / 2) * (1 - scale))
        );

        var left = randomInt(
            spawnWidthOffset - (width/2 * (1-scale)),
            spawnWidth - (scale * width) - ((width / 2) * (1 - scale))
        );

        var coords = {
            'top' : top,
            'left' : left
        };

        console.log(coords);
        return coords;
    }

    function addPost(j) {
        var username = j.user;
        // get users last posted time
        var lastPosted = users[username];

        var scale;

        if (lastPosted === undefined) {
            console.log('new user');
            zIndex = timeNow();
            scale = maxScale;
        } else {
            var userInterval = timeNow() - lastPosted;
            scale = userInterval / intervalReset;
            scale = Math.min(Math.max(scale, minScale), maxScale);
            // adjust z index to favor infrequent posters
            zIndex = timeNow() + userInterval - intervalReset;
            zIndex = Math.min(timeNow(), zIndex);
        }

        // set the animation duration based on scale
        var duration = (baseDuration * scale).toString() + 's';

        // make the container element
        var $container = $("<div>", { "class": "post-container" });
        var coords;
        var $content;

        // determine what kind of content
        // TODO DRY this up with a styleContainer function
        if ('url' in j) {
            // it's a GIF!!
            $content = $("<img>", { "class": "post-content", "src": j.url });
            coords = randomPosition(j.height, j.width, scale);
            $container.css({
                'width': (j.width).toString() + 'px',
                'height': (j.height + nameHeight).toString() + 'px'
            });
            $container.addClass('gif');
        } else if ('text' in j) {
            // it's text!!!
            // always give text max z
            zIndex = zIndex + 30;
            $content = $("<div>", { "class": "post-content" }).html(j.text);
            coords = randomPosition(400, 400, scale);
            $container.css({
                'width': '400px',
                'max-height': '400px'
            });
            $container.addClass('text');
        }

        // style container div
        $container.css({
            'transform': 'scale(' + scale + ')',
            'animation-duration': duration,
            'top': coords.top,
            'left': coords.left,
            'z-index': zIndex
        });

        // create name label and add it and the the content to the container div
        var $slackname = $("<div>", { "class": "slack-name" }).text(username);
        $container.append($content).append($slackname);

        // set current time for user
        users[username] = timeNow();

        // add the post to the page (but it won't be displayed until below)
        $main.append($container);

        // display gif/container only once gif has loaded
        // if it's a text post, just show the text
        // TODO handle emoji
        if ($container.hasClass('gif')) {
            $content.on('load', function() {
                $container.css({ 'opacity': 1 })
                .addClass('grow');
            });
        } else {
                $container.css({ 'opacity': 1 })
                .addClass('grow');
        }

        // clean up when items are done growing
        $container.on('animationend', function() {
            if ( $(this).hasClass('text') ){
                $(this).remove();
            }else{
                $(this).addClass('done-growing');
                if ( $('.done-growing').length > 1 ){
                    $('.done-growing')[0].remove();
                }
            }
        });
    }

    // test add new gif
    $(document).keypress(function(e) {
        if (isNaN(e.key)) {
            var testPost = {
                'url': 'https://media.giphy.com/media/mCRJDo24UvJMA/giphy.gif',
                'width': 500,
                'height': 362
            };
        } else {
            var testPost = {
                'text': 'hit me baby one more time'
            };
        }
        testPost['user'] = 'xoxo person ' + e.key;
        addPost(testPost);
    });
});