// angular.module is a global place for creating, registering and retrieving Angular modules
// the 2nd parameter is an array of 'requires'
angular.module('woocommerce-api', ['ionic', 'woocommerce-api.controllers',
    'woocommerce-api.data', 'woocommerce-api.filters', 'woocommerce-api.directives', 'easypiechart'
])

.run(function($rootScope, $ionicPlatform, $ionicLoading, CONFIG, PAYMENT_CONFIG) {

    $ionicPlatform.ready(function() {

        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

        // Open any external link with InAppBrowser Plugin
        $(document).on('click', 'a[href^=http], a[href^=https]', function(e) {

            e.preventDefault();
            var $this = $(this);
            var target = $this.data('inAppBrowser') || '_blank';

            window.open($this.attr('href'), target);

        });

        // PayPal Configuration
        var clientIDs = {
            "PayPalEnvironmentProduction": PAYMENT_CONFIG.paypal.production_client_id, // not needed while testing
            "PayPalEnvironmentSandbox": PAYMENT_CONFIG.paypal.sandbox_client_id
        };

        window.PayPalMobile.init(
            clientIDs,
            function() {
                window.PayPalMobile.prepareToRender(
                    "PayPalEnvironmentSandbox", // or "PayPalEnvironmentProduction" for production mode
                    new PayPalConfiguration(PAYMENT_CONFIG.paypal.config),
                    function() { console.log("OK, ready to accept payments!"); }
                );
            }
        );

        // Stripe Configuration
        // Stripe.setPublishableKey(PAYMENT_CONFIG.stripe.public_key);

    });
    // Global loading screen views
    $rootScope.$on('loading:show', function() {
        $ionicLoading.show({
            template: '<ion-spinner class="custom-icon" icon="spiral"></ion-spinner>',

            //Will a dark overlay or backdrop cover the entire view
            showBackdrop: false,

            // The delay in showing the indicator
            showDelay: 10
        })
    });

    $rootScope.$on('loading:hide', function() {
        $ionicLoading.hide()
    });

})

.config(function($stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider) {

    // $ionicConfigProvider
    // http://ionicframework.com/docs/api/provider/%24ionicConfigProvider/
    $ionicConfigProvider.tabs.position('bottom');
    $ionicConfigProvider.navBar.alignTitle('center');

    $stateProvider.state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: 'AppCtrl'
    })

    .state('app.home', {
        url: "/home",
        views: {
            'menuContent': {
                templateUrl: "templates/home-grid-2.html",
                controller: 'HomeCtrl'
            }
        }
    })

    .state('app.products', {
        url: "/products",
        views: {
            'menuContent': {
                templateUrl: "templates/products-grid-2.html",
                controller: 'ProductsCtrl'
            }
        }
    })

    .state('app.product', {
        url: "/products/:product_id",
        views: {
            'menuContent': {
                templateUrl: "templates/product.html",
                controller: 'ProductCtrl'
            }
        }
    })

    .state('app.categories', {
        url: "/categories",
        views: {
            'menuContent': {
                templateUrl: "templates/categories.html",
                controller: 'CategoriesCtrl'
            }
        }
    })

    .state('app.category', {
        url: "/categories/:category_slug/:category_name",
        views: {
            'menuContent': {
                templateUrl: "templates/products-grid-2.html",
                controller: 'CategoryCtrl'
            }
        }
    })

    .state('app.basket', {
            url: "/basket",
            views: {
                'menuContent': {
                    templateUrl: "templates/basket.html",
                    controller: 'BasketCtrl'
                }
            }
        })
        .state('app.payment', {
            url: "/payment",
            views: {
                'menuContent': {
                    templateUrl: "templates/payment.html",
                    controller: 'PaymentCtrl'
                }
            }
        })

    .state('app.newCustomer', {
        url: "/newCustomer",
        views: {
            'menuContent': {
                templateUrl: "templates/new-customer.html",
                controller: 'NewCustomerCtrl'
            }
        }
    })

    .state('app.about', {
        url: "/about",
        views: {
            'menuContent': {
                templateUrl: "templates/about.html"
            }
        }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/home');
});
