Webflow.push(function() {
  $('.project-thumbnail').click(function(e) {
    e.preventDefault();
	$('body').css('overflow', 'hidden');
  });

  $('.close').click(function(e) {
    e.preventDefault();
	$('body').css('overflow', 'auto');
  });
});