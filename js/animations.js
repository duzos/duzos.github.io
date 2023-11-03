/**
 * This script file contains a few example functions that illustrate some nice visual effects.
 * These can be adjusted as needed for each project.
 */


/**
 *  Collapse navbar on scroll
 */
$(window).scroll(function() {
    if ($(".navbar-container.navbar-fixed-top ").length) {
        if ($(".navbar-container.navbar-fixed-top ").offset().top > 50) {
            $(".navbar-fixed-top").addClass("top-nav-collapse");
        } else {
            $(".navbar-fixed-top").removeClass("top-nav-collapse");
        }
    }
});

/**
 *  Enable a scrolling effect when navigating to an item on the page.
 *  @param target the item to scroll to when some event occurs. Either a componet ID or CSS selector string.
 */
function scrollTo(target) {
    var selector = target;
    
    if ((selector.indexOf(' ') == -1) && (selector.indexOf('.') != 0) && (selector.indexOf('#') != 0))
        selector = '#' + selector; 
        
       $('html, body').stop().animate({
            scrollTop: $(selector).offset().top
        }, 1500, 'easeInOutExpo');
}

/**
 *  Progressively animates text expansion and shrinkage.
 *  @param targetId the item containing the text to expand and shrink.
 */
function expandAndShrinkText(targetId) {
    expandText(targetId);
    setTimeout(function(){shrinkText(targetId)}, 1000);
}

/**
 *  Progressively animates text expansion.
 *  @param targetId the item containing the text to expand.
 */
function expandText(targetId) {
     if ($('#'+targetId).hasClass("shrink-text"))
      	$('#'+targetId).removeClass("shrink-text");
     $('#'+targetId).addClass("expand-text");
}

/**
 *  Progressively shrinks text.
 *  @param targetId the item containing the text that requires shrinking.
 */
function shrinkText(targetId) {
     if ($('#'+targetId).hasClass("expand-text"))
      	$('#'+targetId).removeClass("expand-text");
     $('#'+targetId).addClass("shrink-text");
};

/**
 *  Calculates if an item is within the visible container.
 */
$.fn.inView = function(){
    var win = $(window);
    //Object to Check
    obj = $(this);
    //the top Scroll Position in the page
    var scrollPosition = win.scrollTop();
    //the end of the visible area in the page, starting from the scroll position
    var visibleArea = win.scrollTop() + win.height();
    //the end of the object to check
    var objEndPos = (obj.offset().top + obj.outerHeight());
    return(visibleArea >= objEndPos && scrollPosition <= objEndPos ? true : false)
};

/**
 *  Animates the easing-in of an item from the left when it becomes visible
 */
$(function() {
    if($(".slideFromLeftOnScroll, .slideFromRightOnScroll, .slideFromTopOnScroll, .slideFromBottomOnScroll").length ) {
        //animate anything current visible
        checkForContentToAnimate();
        //connect to page scroll to animate anything scrolled into view
        $(window).scroll(checkForContentToAnimate);
    }
});

function checkForContentToAnimate()
{
                $(".slideFromLeftOnScroll").each(function() {
                if ($(this).inView()) {
                    $(this).addClass("easeInFromLeft");
                }
            });
            $(".slideFromRightOnScroll").each(function() {
                if ($(this).inView()) {
                    $(this).addClass("easeInFromRight");
                }
            });
    $(".slideFromTopOnScroll").each(function() {
                if ($(this).inView()) {
                    $(this).addClass("easeInFromTop");
                }
            });
    $(".slideFromBottomOnScroll").each(function() {
                if ($(this).inView()) {
                    $(this).addClass("easeInFromBottom");
                }
            });


}



