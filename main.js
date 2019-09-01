$(document).ready(function() {

    // Config constants
    const nameHeight = 20; // height of the slackName div in pixels
    const baseDuration = 10; //  base animation duration before scale is applied in seconds
    const maxScale = 1.3; // maximum scale
    const minScale = 0.3; // maximum scale
    const intervalReset = 10; // time in seconds for when a users gif displays at full scale

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

    // TODO listen for window size change and recalculate

    // keep track of users and when they last posted
    var users = {};

    /// get currect epoch time in seconds
    function timeNow() {
        var now = new Date();
        return Math.round(now.getTime() / 1000);
    }

    // generate a random position
    function randomPosition(height, width, scale) {
        var totalHeight = height + nameHeight;
        var coords = {
            top: Math.floor(Math.random() * (windowHeight - (scale * totalHeight)) - ((totalHeight / 2) * (1 - scale))),
            right: Math.floor(Math.random() * (windowWidth - (scale * width)) - ((width / 2) * (1 - scale)))
        };
        return coords;
    }

    function addPost(j) {
        var username = j.user;
        // get users last posted time
        var lastPosted = users[username];

        var scale;

        if (lastPosted === undefined) {
            console.log('new user');
            scale = maxScale;
        } else {
            var userInterval = timeNow() - lastPosted;
            scale = userInterval / intervalReset;
            scale = Math.min(Math.max(scale, minScale), maxScale);
            console.log(scale);
        }

        // set the animation duration based on scale
        var duration = (baseDuration * scale).toString() + 's';

        // make the container element
        var $div = $("<div>", { "class": "post-container" });
        var coords;
        var $content;
        
        // determine what kind of content
        // TODO DRY this up with a styleContainer function
        if ('url' in j) {
            // it's a GIF!!
            $content = $("<img>", { "class": "gif post-content", "src": j.url });
            coords = randomPosition(j.height, j.width, scale);
            $div.css({
                'width': (j.width).toString() + 'px',
                'height': (j.height + nameHeight).toString() + 'px'
            });
        } else if ('text' in j) {
            // it's text!!!
            $content = $("<div>", { "class": "text post-content" }).text(j.text);
            var coords = randomPosition(j, scale);
            coords = randomPosition(500, 600, scale);
            $div.css({
                'max-width': '500px',
                'max-height': '600px'
            });
        }

        $div.css({
            'transform': 'scale(' + scale + ')',
            'animation-duration': duration,
            'top': coords.top,
            'left': coords.right
        });

        // create name label and add it and the the content to the container div
        var $slackname = $("<div>", { "class": "slack-name" }).text(username);
        $div.append($content).append($slackname);

        // display gif/container only once gif has loaded
        // if it's a text post, just show the text
        // TODO handle emoji
        if ($content.hasClass('gif')) {
            $content.on('load', function() {
                $div.css({ 'opacity': 1 }).addClass('shrinking');
                console.log('showing gif');
            });
        } else {
            $div.css({ 'opacity': 1 }).addClass('shrinking');
        }

        // remove from dom when animation finishes
        $div.on('animationend', function() {
            console.log('animationend');
            $(this).remove();
        });

        // set current time for user
        users[username] = timeNow();

        // add the post to the page
        $main.append($div);
    }

    // test add new gif
    $(document).keypress(function(e) {
        if (isNaN(e.key)) {
            var testPost = {
                'url': 'https://media.giphy.com/media/mCRJDo24UvJMA/giphy.gif',
                'width': 500,
                'height': 362
            };
        }else{
            var testPost = {
                'text' : 'When the moon hits your eye like a big pizza pie'
            };
        }
        testPost['user'] = 'xoxo person ' + e.key;
        addPost(testPost);
    });
});