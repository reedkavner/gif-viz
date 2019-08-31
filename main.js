$( document ).ready(function() {
    
    // TODO establish websocket connection

    // Config constants
    const nameHeight = 20; // height of the slackName div in pixels
    const baseDuration = 10; //  base animation duration before scale is applied in seconds
    const maxScale = 1.3; // maximum scale
    const minScale = 0.3; // maximum scale
    const intervalReset = 10; // time in seconds for when a users gif displays at full scale

    const $main = $('#main');
    const $prompt = $('#prompt');

    // dummy incoming json
    const testGif = {
        'gifsrc' : 'https://media.giphy.com/media/mCRJDo24UvJMA/giphy.gif',
        'width' : 500,
        'height' : 362
    };
    
    // get window size
    var windowHeight = $(window).height();
    var windowWidth = $(window).width();

    // TODO listen for window size change and recalculate

    // keep track of users and when they last posted
    var users = {};

    /// get currect epoch time in seconds
    function timeNow(){
        var now = new Date();
        return Math.round(now.getTime() / 1000);
    }

    // generate a random position
    function randomPosition(j, scale){
        var totalHeight = j.height + nameHeight;
        var coords = {
            top : Math.floor( Math.random() * ( windowHeight - (scale * totalHeight) ) - ((totalHeight/2) * (1-scale)) ),
            right : Math.floor( Math.random() * ( windowWidth - (scale * j.width) ) - ((j.width/2) * (1-scale)) )
        };
        return coords;
    }

    function addGif(j){
        // get users last posted time
        var lastPosted = users[j.username];

        // TODO set this depending on users last posted time
        var scale;
        if (lastPosted === undefined){
            console.log('new user');
            scale = maxScale;
        }else{
            var userInterval = timeNow() - lastPosted;
            scale = userInterval / intervalReset;
            scale = Math.min(Math.max(scale, minScale), maxScale);
            console.log(scale);
        }

        // set the animation duration based on scale
        var duration = (baseDuration * scale).toString() + 's';

        // get the random position where we'll place this gif
        var coords = randomPosition(j, scale);

        // make the container element and add styling
        var $div = $("<div>", {"class": "gif-container"});
        $div.css({
            'transform' : 'scale(' + scale + ')', 
            'animation-duration' : duration,
            'top' : coords.top,
            'left': coords.right,
            'width': (j.width).toString() + 'px',
            'height': (j.width + nameHeight).toString() + 'px'
        });

        // make the other elements and put em together
        var $slackname = $("<div>", {"class": "slack-name"}).text(j.username);
        var $gif = $("<img>", {"class": "gif", "src": j.gifsrc});
        $div.append($gif).append($slackname);

        // display gif/container only once gif has loaded
        $gif.on('load', function(){
            $(this).parent().css({'opacity': 1}).addClass('shrinking');
            console.log('showing gif');
        });

        // remove from dom when animation finishes
        $div.on('animationend', function(){
            console.log('animationend');
            $(this).remove();

            // see if the there are any gifs on the page
            // if not, show the prompt after a few seconds
            if ( $('.gif-container').length === 0){
                setTimeout(function(){
                    // make sure this is still true
                    if ( $('.gif-container').length === 0){
                        $prompt.removeClass('hidden');
                    }
                }, 2000);
            }
        });

        // hide the prompt
        $prompt.addClass('hidden');

        // set current time for user
        users[j.username] = timeNow();
        
        // add the post to the page
        $main.append($div);

    }

    // test add new gif
    $(document).keypress(function(e){
        var testInput = testGif;
        testGif['username'] = 'xoxo person ' + e.key;
        addGif(testInput);
    });
});