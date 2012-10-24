/* 
This is a jQuery plugin which will act like an infinite carousel for a set of "li" elements inside an unordered list.  3 of the list elements will show up
in a div window and the articles will rotate infinitely in order backwards or forwards.
The setup of the html for the plugin goes like so:
<div class="newsCarousel">
    <ul>
        <li>
            Put anything here, div, article, span, or even just straight <p> and <img>, whatever
        </li>
        <li>
            Anything again...
        </li>
        .
        .
        .
        .
    </ul>
</div>

This plugin currently only works as an implementation for a verticle carousel
IMPORTANT: THIS PLUGIN ONLY WORKS WITH 5 OR MORE <li> ELEMENTS WITHIN THE <ul>
if you only have 3-4 newsworth articles, then you can make empty <li> elements with heights of 0 and add them to the <ul>
*/ 
(function ($) {
    //This is the setup for a jQuery plugin
    $.fn.newsCarousel = function(options) {
        
        //Set default settings here which will be overwritten by any of the properties that will be passed in by "options"
        //For the properties not set in "options", the default values will apply
        var settings = $.extend({
            'interval': 7000, //interval is the time between each instance of the articles rotating automatically
            'speed'   : 1000, //speed is the speed of the animation
            'loop'    : false, //boolean which dictates whether the carousel will automatically rotate
            'btnPrev' : $('.btickerPrev'), //Defines the button which will cause the articles to rotate to the previous article
            'btnNext' : $('.btickerNext') //Defines the button which will cause the articles to rotate to the next article
        }, options || {});

        //Apply to each instance that calls .newsCarousel()
        return this.each(function() {
            
            //A little house-keeping ...
            //Get the relevant elements ready for repeated accessing
            var div                   = $(this),
                ul                    = $('ul', div),
                li                    = $('li', ul),
                onAutoLooping         = settings.loop, //Boolean for if automatic looping should be turned on, will be put directly in loopArticles()
                isLooping             = false, //Boolean that indicates if the carousel is currently rotating or if it's been stopped
                btnPrev               = settings.btnPrev,
                btnNext               = settings.btnNext,
                loop_interval; //This variable will be referenced for setInterval and clearInterval which controls the automatic looping

            //Since the articles are different heights, each time a new set of 3 articles is moved into the view, the combined height of the 3 visible articles
            //needs to be computed and then the div needs to be set to that height to maintain consistent spacing
            function visibleHeight() {
                totalHeight = $('li:nth-child(2)', ul).outerHeight() + $('li:nth-child(3)', ul).outerHeight() + $('li:nth-child(4)', ul).outerHeight();
                return totalHeight;
            }

            //This is the function that does the main work of "rotating" the list of articles
            function nextArticle() {
                //If the articles are currently looping, pause the looping so that 2 calls to nextArticle(), one from the automatic looping and one from
                //the button '.btnNext' don't cause double rotation
                if (isLooping) {
                    pauseLoopArticles();
                }
                /* 
                Here is the main process of rotating articles
                How it works:
                Imagine there is a set of articles
                ---------------------------------
                Article 1
                ---------------------------------
                Article 2
                ---------------------------------
                Article 3
                ---------------------------------
                Article 4
                ---------------------------------
                Article 5
                ---------------------------------

                Before anything is ever called, the order of the articles of is switched with the line "$('li:first', ul).before($('li:last', ul));"
                You will see this line if you scroll down in the code to after all the functions are defined.
                What this does is makes the articles like this:
                ----------------------------------
                Article 5
                ----------------------------------
                Article 1
                ----------------------------------
                Article 2
                ----------------------------------
                Article 3
                ----------------------------------
                Article 4
                ----------------------------------
                Basically the .before call sets the last element in the list as the first element in the list

                The css of the containing div is then set to:
                ----Note: This is not the actual css, it's simply something to make it clearer ------------
                "containing div" {
                    height: visibleHeight(); (height of article 1,2,3 combined)
                    overflow: hidden;
                }
                And the ul css is set to:
                "ul" {
                    top: -$('li:first', ul).outerHeight(); //Article 5 is $(li:first, ul)
                }
                
                Since overflow is hidden, the negative position on top for the ul and total height of the div will hide both article 5 and 4
                With these properties, the carousel now looks like:
                ----------------------------------
                Article 5 //HIDDEN
                ----------DIV STARTS HERE---------
                Article 1
                ----------------------------------
                Article 2
                ----------------------------------
                Article 3
                -----------DIV ENDS HERE----------
                Article 4 //HIDDEN
                ----------------------------------

                Now that the initial setup is done, which is all done outside of nextArticle(), the actual process of moving articles comes in
                First we get the height of the first visible article (Article 1), which is the 2nd child in the unordered list.  We use the jQuery function outerHeight() for this since we want the margins around the article as well
                
                Then we use the jQuery animate changing the css of the <ul> to {top: parseInt(ul.css('top')) - first_visible_height}
                So we make the negative position of the <ul> even more negative, thus moving the articles even further up
                The appearance of the carousel now looks like this:
                ----------------------------------
                Article 5 //HIDDEN
                ----------------------------------
                Article 1 //HIDDEN
                ----------DIV STARTS HERE---------
                Article 2
                ----------------------------------
                Article 3
                ----------------------------------
                Article 4
                -----------DIV ENDS HERE----------

                Next after the animation is done, we call:
                $('li:last', ul).after($('li:first', ul));
                ul.css({'top': -1*first_visible_height});
                div.css('height', visibleHeight());
                
                This then sets the list to this appearance:
                ----------------------------------
                Article 1 //HIDDEN
                ----------DIV STARTS HERE---------
                Article 2
                ----------------------------------
                Article 3
                ----------------------------------
                Article 4
                -----------DIV ENDS HERE----------
                Article 5 //HIDDEN
                ----------------------------------

                And we have successfully rotated the set of articles!
                */
                var first_visible_article = $('li:nth-child(2)', ul),
                    first_visible_height  = first_visible_article.outerHeight();
                    moving_height         = parseInt(ul.css('top')) - first_visible_height;
                ul.animate({'top': moving_height}, {
                    queue: false, //So that concurrent animations immediately fire instead of getting queued,  This is for when the user clicks on the buttons too quickly
                    duration: settings.speed,
                    complete: function () {
                        $('li:last', ul).after($('li:first', ul));
                        ul.css({'top': -1*first_visible_height});
                        div.css('height', visibleHeight());
                    }
                });
                //Resume looping if it was paused
                if (!isLooping) {
                    loopArticles();
                }
            }

            //Basically the same idea as the previously explained nextArticle(), except in the opposite direction, so I will forego an in-depth writeup for this function
            function previousArticle() {
                if (isLooping) {
                    pauseLoopArticles();
                }
                var last_article         = $('li:last', ul),
                    last_article_height  = last_article.outerHeight(),
                    moving_height        = 0;
                ul.animate({'top': 0}, {
                    queue: false,
                    duration: settings.speed,
                    complete: function () {
                        $('li:first', ul).before($('li:last', ul));
                        ul.css({'top': -1*last_article_height});
                        div.css('height', visibleHeight());
                    }
                });
                if (!isLooping) {
                    loopArticles();
                }
            }

            //The onAutoLooping boolean is here to simplify control flow
            //setInterval fires the given function nextArticle every n milliseconds, which is specified by settings.interval
            function loopArticles() {
                if (onAutoLooping) {
                    loop_interval = setInterval(nextArticle, settings.interval);
                    isLooping = true;
                }
            }

            //clearInterval needs a reference to the interval it's clearing, hence using the loop_interval variable
            function pauseLoopArticles() {
                if (onAutoLooping) {
                    clearInterval(loop_interval);
                    isLooping = false;
                }
            }

            //Begin the previously mentioned setup.
            div.css({'height' : visibleHeight(), 'overflow' : 'hidden'});
            $('li:first', ul).before($('li:last', ul));
            ul.css('top', -$('li:first', ul).outerHeight());

            loopArticles();

            /*---------BEGIN MOUSE ACTIONS TO SPECIFIC FUNCTIONS ----------*/

            btnNext.on('click', function(){
                nextArticle();
            });

            btnPrev.on('click', function() {
                previousArticle();
            });

            ul.parent().on('mouseenter', function () {
                if (isLooping && onAutoLooping) {
                    pauseLoopArticles();
                }
            });

            ul.parent().on('mouseleave', function () {
                if (!isLooping && onAutoLooping) {
                    loopArticles();
                }
            });

            $(btnPrev, btnNext).on('mouseenter', function () {
                if (isLooping && onAutoLooping) {
                    pauseLoopArticles();
                }
            });

            $(btnPrev, btnNext).on('mouseleave', function () {
                if (!isLooping && onAutoLooping) {
                    loopArticles();
                }
            });

            /*--------------END BINDING--------------------------------*/
        });
    }
})(jQuery);