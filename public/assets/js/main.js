/*
	Spatial by TEMPLATED
	templated.co @templatedco
	Released for free under the Creative Commons Attribution 3.0 license (templated.co/license)
*/

(function($) {

	skel.breakpoints({
		xlarge:	'(max-width: 1680px)',
		large:	'(max-width: 1280px)',
		medium:	'(max-width: 980px)',
		small:	'(max-width: 736px)',
		xsmall:	'(max-width: 480px)'
	});

	$(function() {

		var	$window = $(window),
			$body = $('body');

		// Disable animations/transitions until the page has loaded.
			$body.addClass('is-loading');

			$window.on('load', function() {
				window.setTimeout(function() {
					$body.removeClass('is-loading');
				}, 100);
			});

		// Fix: Placeholder polyfill.
			$('form').placeholder();

		// Prioritize "important" elements on medium.
			skel.on('+medium -medium', function() {
				$.prioritize(
					'.important\\28 medium\\29',
					skel.breakpoint('medium').active
				);
			});

		// Off-Canvas Navigation.

			// Navigation Panel Toggle.
				$('<a href="#navPanel" class="navPanelToggle"></a>')
					.appendTo($body);

			// Navigation Panel.
				$(
					'<div id="navPanel">' +
						$('#nav').html() +
						'<a href="#navPanel" class="close"></a>' +
					'</div>'
				)
					.appendTo($body)
					.panel({
						delay: 500,
						hideOnClick: true,
						hideOnSwipe: true,
						resetScroll: true,
						resetForms: true,
						side: 'right'
					});

			// Fix: Remove transitions on WP<10 (poor/buggy performance).
				if (skel.vars.os == 'wp' && skel.vars.osVersion < 10)
					$('#navPanel')
						.css('transition', 'none');

        $(window).scroll(function () {
          if ($(window).scrollTop() >= 50) {
            $('#header').css('background','white');
            $('#a').css('color', 'black')
            $('#nav').css('color', 'black')
          } else {
            $('.header').css('background','transparent');
             $('#a', '#nav').css('color', 'white')
          }
        });

        $('#testimonial').hide()
        $('.testimonial').on('click', function () {
          // body...
          $('#testimonial').toggle();
        })

        $('.mailForm').on('submit', function(e){
          e.preventDefault();
          $.ajax({
            method: 'POST',
            url: '/mail',
            data: {
              name: $('#name').val(),
              email: $('#email').val(),
              message: $('#message').val()
            }
          }).done((fromServer) => {
            console.log("This is the response from the server", fromServer.thanks)
            $('#ThanksForMail').append(`<h3 style="color: white;"> ${fromServer.thanks} </h3>`)
            $('#name').val('');
            $('#email').val('');
            $('#message').val('');
          })
        })

        $('#adminCourseForm').on('submit', (e)=>{
          e.preventDefault();
          $.ajax({
            type: 'POST',
            url: '/admin/addACourse',
            data: {
              date: $('.date').val(),
              url: $('.url').val(),
              title: $('.title').val(),
              description: $('.description').val()
            }
          }).done((response) => {
            console.log('response', response);
            var data = JSON.parse(response).thanks;
            $('#thanksss').append(data)
          })
        })

        $('#updateButton').on('click', ()=> {
          $('#submitted').append('Your update to this course has been made. You will be redirected in five seconds.')
        })

        $('deleteButton').on('click', ()=> {
          $('#deleted').append('This specific course has been deleted');
        })



	});

})(jQuery);
