angular.module('woocommerce-api.filters', [])

.filter('partition', function ($cacheFactory) {
    var arrayCache = $cacheFactory('partition');
    var filter = function (arr, size) {
        if (!arr) {
            return;
        }
        var newArr = [];
        for (var i = 0; i < arr.length; i += size) {
            newArr.push(arr.slice(i, i + size));
        }
        var cachedParts;
        var arrString = JSON.stringify(arr);
        cachedParts = arrayCache.get(arrString + size);
        if (JSON.stringify(cachedParts) === JSON.stringify(newArr)) {
            return cachedParts;
        }
        arrayCache.put(arrString + size, newArr);
        return newArr;
    };
    return filter;
})

.filter('partitionB', function ($cacheFactory) {
    var cache;
    cache = $cacheFactory('partition');
    return function (list, colLimit) {
        var cacheId, cached, groups, i, index, _i, _ref;
        if (!list || list.length < 1) {
            return;
        }
        groups = [];
        index = 0;
        for (i = _i = 0, _ref = Math.ceil(list.length / colLimit) - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
            groups.push(list.slice(index, +(index + (colLimit - 1)) + 1 || 9e9));
            index += colLimit;
        }
        cacheId = JSON.stringify(list) + colLimit;
        cached = cache.get(cacheId);
        if (JSON.stringify(groups) === JSON.stringify(cached)) {
            return cached;
        }
        cache.put(cacheId, groups);
        return groups;
    };
})

.filter('partitionC', function ($cacheFactory) {
    var arrayCache = $cacheFactory('partition')
    return function (arr, size) {
        var parts = [],
            cachedParts,
            jsonArr = JSON.stringify(arr);
        for (var i = 0; i < arr.length; i += size) {
            parts.push(arr.slice(i, i + size));
        }
        cachedParts = arrayCache.get(jsonArr);
        if (JSON.stringify(cachedParts) === JSON.stringify(parts)) {
            return cachedParts;
        }
        arrayCache.put(jsonArr, parts);

        return parts;
    };
});
