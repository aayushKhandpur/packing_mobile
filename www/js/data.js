/// <reference path="../typings/angularjs/angular.d.ts"/>

angular.module('woocommerce-api.data', [])

.factory('Data', function() {
    var data = {};

    data.items = [{
        title: 'Products',
        icon: 'ion-tshirt',
        note: 'Our Products',
        url: '#/app/products'
    }, {
        title: 'Categories',
        icon: 'ion-bag',
        note: 'Our Product Categories',
        url: '#/app/categories'
    }];

    return data;
})

.factory('MenuData', function() {
    var data = {};

    data.items = [{
        title: 'Home',
        icon: 'ion-home',
        url: '#/app/home'
    }, {
        title: 'Products',
        icon: 'ion-tshirt',
        url: '#/app/products'
    }, {
        title: 'Categories',
        icon: 'ion-bag',
        url: '#/app/categories'
    }, {
        title: 'New Customer',
        icon: 'ion-person-add',
        url: '#/app/newCustomer'
    }, {
        title: 'About',
        icon: 'ion-grid',
        url: '#/app/about'
    }];

    return data;
})

.factory('ProductsData', function($http, $q, CONFIG) {

    var data = {};
    var service = {};
    // Number of products fetched in the last query
    // used for hasMore checks, and initially at least 1 full fetch
    var last_fetch = CONFIG.products_per_page;

    var unique = function unique(list) {
        var result = [];
        $.each(list, function(i, e) {
            if ($.inArray(e, result) == -1) result.push(e);
        });
        return result;
    }

    service.getProductsAsync = function(page, params) {
        page = page || 1;
        params = params || {};
        var deferred = $q.defer();

        params['filter[limit]'] = CONFIG.products_per_page;
        if (page - 1)
            params['filter[offset]'] = (page - 1) * CONFIG.products_per_page;

        var url = generateQuery('GET', '/products', CONFIG, params);

        $http({
            method: 'GET',
            url: url,
            timeout: CONFIG.request_timeout
        }).then(
            function(result) {
                //console.log(result)
                // This callback will be called asynchronously when the response is available.
                last_fetch = result.data['products'].length;
                // Get new data and combine with existing ones, remove duplicates (fail-safe)
                data = _.union(data, result.data['products']);
                deferred.resolve();

            },
            function(result) {
                console.log(result)
                deferred.reject();
            }
        );

        return deferred.promise;

    };

    service.getProductAsync = function(productId) {
        var deferred = $q.defer();

        var r = service.getById(productId);
        if (r) {
            deferred.resolve(r);
        } else {
            var url = generateQuery('GET', '/products/' + productId, CONFIG);

            $http({
                method: 'GET',
                url: url,
                timeout: CONFIG.request_timeout
            }).then(
                function(result) {
                    deferred.resolve(result.data['product']);
                },
                function() {

                    deferred.reject();
                }
            );
        }
        return deferred.promise;

    };

    service.clear = function() {
        data = {};
    };

    service.hasMore = function() {
        return last_fetch == CONFIG.products_per_page;
    };

    service.getAll = function() {
        return data;
    };

    service.getById = function(productId) {
        return _.findWhere(data, {
            'id': productId
        });
    };

    return service;
})

.factory('CategoriesData', function($http, $q, CONFIG) {

    var data = {};
    var service = {};

    service.async = function() {

        var deferred = $q.defer();
        var query = generateQuery('GET', '/products/categories', CONFIG);

        $http({
            method: 'GET',
            url: query,
            timeout: CONFIG.request_timeout
        }).then(
            function(result) {

                data = result.data['product_categories'];

                deferred.resolve();
            },
            function() {

                deferred.reject();
            }
        );
        return deferred.promise;
    };

    service.getAll = function() {
        return data;
    };

    service.getByName = function(name) {
        return _.findWhere(data, {
                'name': name
        });
    };

    return service;
})

.factory('ReviewsData', function($http, $q, CONFIG) {
    var data = {};
    var service = {};
    // Number of products fetched in the last query
    // used for hasMore checks, and initially at least 1 full fetch
    var last_fetch = CONFIG.reviews_per_page;

    service.async = function(product_id, page) {
        var deferred = $q.defer();
        var params = {};
        /*
        params['filter[limit]'] = CONFIG.reviews_per_page;
        if (page - 1)
            params['filter[offset]'] = (page - 1) * CONFIG.reviews_per_page;
        //*/
        var url = generateQuery('GET', '/products/' + product_id + '/reviews', CONFIG, params);

        $http({
            method: 'GET',
            url: url,
            timeout: CONFIG.request_timeout
        }).then(
            function(result) {

                last_fetch = result.data['product_reviews'].length;
                data = result.data['product_reviews']; //_.union(data, d['product_reviews']);

                deferred.resolve();

            },
            function() {
                deferred.reject();
            }
        );

        return deferred.promise;

    };

    service.clear = function() {
        data = {};
    }

    service.hasMore = function() {
        return last_fetch == CONFIG.reviews_per_page;
    }

    service.getAll = function() {
        return data;
    };

    return service;
})

.factory("BasketData", function($rootScope, $http, $q, $ionicPopup, UserData, CONFIG) {

    var basket = [];
    var service = {};

 /*
    Payment Options:
        Direct Bank Transfer:   bacs
        Cheque Payment:         cheque
        Cash on Delivery:       cod
        PayPal:                 paypal

    If you run a custom WooCommerce installation you will
    want to update this with the extra choices you implemented.
*/
    var payment_methods = {
        bacs: 'Direct Bank Transfer',
        cheque: 'Cheque Payment',
        cod: 'Cash on Delivery',
        paypal: 'PayPal'
    }

    service.add = function(product) {
        var index = _.indexOf(basket, product);
        // If product is already in the basket, increase quantity
        // ToDo: Handle the multiples of the same product's different variants, as separate orders
        if (index != -1)
            basket[index].quantity += product.quantity;
        else
            basket.push(product);

        var addedToCart = $ionicPopup.show({
            title: 'Added to Cart',
            subTitle: 'Product successfully added to your Cart.',
            buttons: [
                { text: 'OK', type: 'button-positive' }
            ]
        });

        $rootScope.$broadcast('basket');

    }

    service.emptyBasket = function() {
        basket = [];
        $rootScope.$broadcast('basket');
    }

    function formatProducts() {

        var line_items = [];
        angular.forEach(basket, function(product, key) {
            var order_json = {
                'product_id': product.id,
                'quantity': product.quantity
            };
            var variations = {}

            angular.forEach(product['attributes'], function(attr, key) {
                variations['pa_' + attr.name] = attr.options[attr.position];
            });

            if (variations != {})
                order_json['variations'] = variations;
            line_items.push(order_json);
        });
        return line_items;
    };

    service.getBasket = function() {
        return basket;
    }

    service.getTotal = function() {
        var total_price = 0;
        for (var i = basket.length - 1; i >= 0; i--)
            total_price +=
                Number(basket[i].quantity) * Number(basket[i].price);

        return total_price;
    };

    // Sends the order to the server
    service.sendOrder = function(method, paid) {
        var deferred = $q.defer();
        var params = {};

        var url = generateQuery('POST', '/orders', CONFIG, params);

        var customer = UserData.getUserData();

        console.warn("Customer Data:", JSON.stringify(customer));

        var order_data = {
            'order': {
                customer_id: customer.id,
                line_items: formatProducts(),
                // Fetched from customer data if they exist,
                // if they don't and the request is to be completed in-app
                // the user should be prompted.
                shipping_address: customer.shipping_address,
                billing_address: customer.billing_address
            }
        };

        if (method && payment_methods[method]) {
            order_data.order.payment_details = {
                method_id: method,
                method_title: payment_methods[method],
                paid: paid ? paid : false // Handling the case in which the var is undefined/null
            };
        }

        if (method && !payment_methods[method])
            console.warn("Invalid payment method. Setting it as a pending payment.");

        $http({
            method: 'POST',
            url: url,
            timeout: CONFIG.request_timeout,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: order_data

        }).then(
            function(result) {
                console.log("Order request:", result);
                deferred.resolve(result);

            },
            function(result) {
                deferred.reject(result);
            }
        );

        return deferred.promise;

    };

    return service;
})


.factory("UserData", function($http, $q, CONFIG) {
    var service = {};
    var user_data = null;

    service.check = function(email) {
        var deferred = $q.defer();

        var url = generateQuery('GET', '/customers/email/' + email, CONFIG);
        $http({
            method: 'GET',
            url: url,
            timeout: CONFIG.request_timeout
        }).then(
            function(result) {
                if (result.data.customer)
                    user_data = result.data.customer;

                deferred.resolve(result.data);
            },
            function(result) {
                deferred.reject(result.data);
            }
        );

        return deferred.promise;
    };

    service.getUserData = function() {
        return user_data; // May be null.
    };

    // Create Customer
    service.createCustomer = function(customer) {
        var deferred = $q.defer();
        var params = {};

        var url = generateQuery('POST', '/customers', CONFIG, params);

        $http({
            method: 'POST',
            url: url,
            timeout: CONFIG.request_timeout,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: customer

        }).then(
            function(result) {
                deferred.resolve(result);

            },
            function(result) {
                deferred.reject(result);
            }
        );

        return deferred.promise;

    };

    return service;
})

/**
    Alternative implementation for paypal payments, incomplete.
    Can be implemented using in app browser with custom events.
    It's necessary to catch return_url arguments in order to finalize the order.
    You can read more here:
        https://developer.paypal.com/docs/integration/web/accept-paypal-payment/#execute-the-payment
**/
.factory("PaymentFactory", function($http, $q, CONFIG, PAYMENT_CONFIG) {
    var service = {};
    var access_token = {
        token: null,
        access_time: null,
        expiration: null,
        app_id: null
    }

    var getPaypalAccessToken = function() {
        var deferred = $q.defer();
        var url = CONFIG.paypal_api_endpoint + '/oauth2/token';
        var basicAuthString = window.btoa(PAYMENT_CONFIG.paypal.client_id + ':' + PAYMENT_CONFIG.paypal.client_secret);

        $http({
            method: 'POST',
            url: url,
            timeout: CONFIG.request_timeout,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + basicAuthString,
            },
            data: 'grant_type=client_credentials'

        }).then(
            function(result) {
                deferred.resolve(result);
            },
            function(result) {
                deferred.reject(result);
            });

        return deferred.promise;
    };

    getPaypalAccessToken().then(
        function(r) {
            access_token.token = r.data.access_token;
            access_token.access_time = Date.now();
            access_token.expiration = access_token.access_time + r.data.expires_in;
            access_token.app_id = r.data.app_id;
        },
        function(r) {
            console.log("Oooops", r);
        });

    service.makePayment = function() {

        var deferred = $q.defer();
        var url = PAYMENT_CONFIG.paypal.api_endpoint + '/payments/payment';

        $http({
            method: 'POST',
            url: url,
            timeout: CONFIG.request_timeout,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + access_token.token,
            },
            data: {
                "intent": "order",
                "redirect_urls": {
                    "return_url": "http://example.url/return.html",
                    "cancel_url": "http://example.url/cancel.html"
                },
                "payer": {
                    "payment_method": "paypal"
                },
                "transactions": [{
                    "amount": {
                        "total": "7.47",
                        "currency": "USD"
                    },
                    "description": "This is a test payment."
                }]
            }
        }).then(
            function(result) {
                console.log(result);
                deferred.resolve(result);

            },
            function(result) {
                console.log(result);
                deferred.reject(result);
            }
        );

        return deferred.promise;
    };


    return service;
})

.factory('MetaData', function($http, $q, CONFIG) {

    var data = {};
    var service = {};

    service.getProperties = function() {

        // Cache the results.
        if (!_.isEmpty) {
            deferred.resolve(data);
            return deferred.promise;
        }
        // No encrypted query is necessary, you can just concat url+endpoint
        var query = generateQuery('GET', '', CONFIG);
        var deferred = $q.defer();

        $http({
            method: 'GET',
            url: query,
            timeout: CONFIG.request_timeout
        }).then(
            function(result) {
                data = result.data.store;
                deferred.resolve(data);
            },
            function(reason) {
                deferred.reject(reason);
            }
        );
        return deferred.promise;
    };

    return service;
});
