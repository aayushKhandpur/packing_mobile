// Using the "wc-" prefix in all directives as per angular guides, in order to avoid compatibility issues
angular.module('woocommerce-api.directives', [])

// star rating element with support for half-stars
// top rating is assumed to be 5
.directive('wcRating',  function() {

    var createHTML = function(r) {
    	var html = '';
        var count = 0;

        while (r-- >= 1) {
            html += '<i class="icon ion-ios-star"> </i>';
            count++;
        }
        if (r >= -.5) {
            html += '<i class="icon ion-ios-star-half"> </i>';
            count++;
        }
        for (var i = 0; i < (5 - count); i++)
            html += '<i class="icon ion-ios-star-outline"> </i>';

        return html;
    }

    return {
        restrict: 'EA',
        scope: {
        	rating: '='
        },
        link: function(scope, elem, attr) {
        	scope.$watch('rating', function(newValue, oldValue, scope) {

        		if (typeof newValue == 'string')
					elem.html(createHTML(parseFloat(newValue)));
				else
					elem.html(createHTML(newValue));
        	});
        }
    }
});
