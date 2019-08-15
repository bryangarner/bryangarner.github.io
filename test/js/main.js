$(function() {
    var $window = $(window),
        $body = $("body"),
        $modal = $(".modal"),
        scrollDistance = 0;

    $modal.on("show.bs.modal", function() {
        // Get the scroll distance at the time the modal was opened
        scrollDistance = $window.scrollTop();

        // Pull the top of the body up by that amount
        $body.css("top", scrollDistance * -1);
    });
});

$modal.on("hidden.bs.modal", function() {
    // Remove the negative top value on the body
    $body.css("top", "");

    // Set the window's scroll position back to what it was before the modal was opened
    $window.scrollTop(scrollDistance);  
});