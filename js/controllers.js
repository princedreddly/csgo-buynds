'use strict';

// csgo-buynds angular controllers

var buyndsControllers = angular.module('buyndsControllers', []);

buyndsControllers.controller('SingleKeyGenCtrl', ['$scope', '$route', '$window', 'bindBuilder', 'dataService', function ($scope, $route, $window, bindBuilder, dataService) {

    $scope.bindableKeys = {keyGroups: []};
    dataService.getBindableKeysAsync().then(function(data) {
        $scope.bindableKeys = data;
    });
    $scope.primaryWeapons = {weaponGroups: []};
    dataService.getPrimaryWeaponsAsync().then(function(data) {
        $scope.primaryWeapons = data;
    });
    $scope.secondaryWeapons = {weaponGroups: []};
    dataService.getSecondaryWeaponsAsync().then(function(data) {
        $scope.secondaryWeapons = data;
    });
    $scope.gear = [];
    dataService.getGearAsync().then(function(data) {
        $scope.gear = data;
    });
    $scope.grenades = [];
    dataService.getGrenadesAsync().then(function(data) {
        $scope.grenades = data;
    });

    $scope.bindOptions = new buynds.BindOptions();
    $scope.buyBind = '';
    $scope.submitted = false;

    var findBindableKeyByCode = function (keyCode) {
        for (var i = 0; i < $scope.bindableKeys.keyGroups.length; i++) {
            var keyGroup = $scope.bindableKeys.keyGroups[i];
            for (var j = 0; j < keyGroup.keys.length; j++) {
                var key = keyGroup.keys[j];
                if (key.code === keyCode) {
                    return key;
                }
            }
        }
        return null;
    };

    $scope.setKeyToBindByCode = function (keyCode) {
        var bindableKey = findBindableKeyByCode(keyCode);
        if (bindableKey === null) {
            $window.alert('Unrecognized Key! (keyCode = ' + keyCode + ')');
        } else {
            $scope.bindOptions.keyToBind = bindableKey.bind;
        }
    };

    $scope.toggleGearSelection = function (gearBind) {
        var idx = $scope.bindOptions.gear.indexOf(gearBind);
        if (idx > -1) {
            $scope.bindOptions.gear.splice(idx, 1);
        } else {
            $scope.bindOptions.gear.push(gearBind);
        }
    };

    $scope.toggleGrenadeSelection = function (grenadeBind) {
        var idx = $scope.bindOptions.grenades.indexOf(grenadeBind);
        if (idx > -1) {
            $scope.bindOptions.grenades.splice(idx, 1);
        } else {
            $scope.bindOptions.grenades.push(grenadeBind);
        }
    };

    $scope.allowExtraGrenade = function (grenadeBind) {
        return grenadeBind === 'flashbang';
    };

    $scope.hasExtraGrenadeSelection = function (grenadeBind) {
        var grenadeCount = $.grep($scope.bindOptions.grenades, function (g) { return g === grenadeBind }).length;
        return grenadeCount > 1;
    };

    $scope.toggleExtraGrenadeSelection = function (grenadeBind) {
        var grenadeCount = $.grep($scope.bindOptions.grenades, function (g) { return g === grenadeBind }).length;
        if (grenadeCount === 2) {
            var idx = $scope.bindOptions.grenades.lastIndexOf(grenadeBind);
            $scope.bindOptions.grenades.splice(idx, 1);
        } else if (grenadeCount === 1) {
            $scope.bindOptions.grenades.push(grenadeBind);
        } else {
            $scope.bindOptions.grenades.push(grenadeBind, grenadeBind);
        }
    };

    $scope.generateBind = function () {
        $window.ga('send', 'event', 'button', 'click', 'generate', { page: $route.current.page });
        $scope.submitted = true;
        if ($scope.skgForm.$valid) {
            $scope.buyBind = bindBuilder.build($scope.bindOptions);
            $window.ga('send', 'event', 'bind builder', 'build', 'key bind', 1, { page: $route.current.page });
        }
    };

    $scope.resetBind = function () {
        $window.ga('send', 'event', 'button', 'click', 'reset', { page: $route.current.page });
        $scope.bindOptions = new buynds.BindOptions();
        $scope.buyBind = '';
        $scope.submitted = false;
    };

    $scope.getBuyBindForCopy = function () {
        $window.ga('send', 'event', 'button', 'click', 'copy', { page: $route.current.page });
        return $scope.buyBind;
    };
}]);

buyndsControllers.controller('MultiKeyGenCtrl', ['$scope', '$modal', '$route', '$window', 'bindBuilder', 'bindLoaderAsync', 'dataService', function ($scope, $modal, $route, $window, bindBuilder, bindLoaderAsync, dataService) {

    var bindLoader;
    bindLoaderAsync.then(function(resolvedBindLoader) {
        bindLoader = resolvedBindLoader;
    });

    $scope.bindableKeys = {keyGroups: []};
    dataService.getBindableKeysAsync().then(function(data) {
        $scope.bindableKeys = data;
    });

    $scope.bindOptionsMap = {};
    $scope.buyBinds = [];
    $scope.showNumpadKeypad = true;
    $scope.showNavKeysKeypad = false;
    $scope.showFuncKeysKeypad = false;
    $scope.showMouseButtons = false;

    $scope.generatedBuyBindsComment = '// buy binds generated by csgobuynds.com';

    $scope.hasAnyBindOptions = function () {
        return !jQuery.isEmptyObject($scope.bindOptionsMap);
    };

    $scope.hasKeyBindOptions = function (keyBind) {
        return keyBind in $scope.bindOptionsMap;
    };

    var hasKeyGroupKeypadKeyBindOptions = function (keyGroupName) {
        for (var i = 0; i < $scope.bindableKeys.keyGroups.length; i++) {
            var keyGroup = $scope.bindableKeys.keyGroups[i];
            if (keyGroup.name === keyGroupName) {
                for (var j = 0; j < keyGroup.keys.length; j++) {
                    var key = keyGroup.keys[j];
                    if (key.bind in $scope.bindOptionsMap) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    $scope.hasNumpadKeypadKeyBindOptions = function () {
        return hasKeyGroupKeypadKeyBindOptions('Numeric Keypad');
    };

    $scope.hasNavKeysKeypadKeyBindOptions = function () {
        return hasKeyGroupKeypadKeyBindOptions('Navigation Keys');
    };

    $scope.hasFuncKeysKeypadKeyBindOptions = function () {
        return hasKeyGroupKeypadKeyBindOptions('Function Keys');
    };

    $scope.hasMouseButtonsKeyBindOptions = function () {
        return hasKeyGroupKeypadKeyBindOptions('Mouse Buttons');
    };

    $scope.hasGeneratedBuyBinds = function() {
        return $scope.buyBinds.length > 0;
    };

    $scope.openKeyBindOptionsModal = function (keyBind) {
        var modalInstance = $modal.open({
            templateUrl: 'partials/mkg-key-bind-options.phtml',
            controller: 'MultiKeyGenKeyBindOptionsCtrl',
            resolve: {
                bindOptions: function () {
                    var bindOptions;
                    if (keyBind in $scope.bindOptionsMap) {
                        bindOptions = $scope.bindOptionsMap[keyBind].clone();
                    } else {
                        bindOptions = new buynds.BindOptions();
                        bindOptions.keyToBind = keyBind;
                    }
                    return bindOptions;
                }
            }
        });

        modalInstance.result.then(function (result) {
            if (result instanceof buynds.BindOptions) {
                $scope.bindOptionsMap[result.keyToBind] = result.clone();
            } else if (result.hasOwnProperty('clear')) {
                delete $scope.bindOptionsMap[result.clear]
            }
        });
    };

    $scope.generateBinds = function () {
        $window.ga('send', 'event', 'button', 'click', 'generate', { page: $route.current.page });
        var numBindsGenerated = 0;
        $scope.buyBinds = [];
        for (var keyBind in $scope.bindOptionsMap) {
            if ($scope.bindOptionsMap.hasOwnProperty(keyBind)) {
                var bindOptions = $scope.bindOptionsMap[keyBind];
                var buyBind = bindBuilder.build(bindOptions);
                $scope.buyBinds.push(buyBind);
                numBindsGenerated++;
            }
        }
        $window.ga('send', 'event', 'bind builder', 'build', 'key bind', numBindsGenerated, { page: $route.current.page });
    };

    $scope.resetBinds = function () {
        $window.ga('send', 'event', 'button', 'click', 'reset', { page: $route.current.page });
        $scope.bindOptionsMap = {};
        $scope.buyBinds = [];
    };

    $scope.openLoadBindsModal = function () {
        var modalInstance = $modal.open({
            templateUrl: 'partials/mkg-load-binds.phtml',
            controller: 'MultiKeyGenLoadBindsCtrl'
        });

        modalInstance.result.then(function (bindRecord) {
            if (bindRecord) {
                var numBindsLoaded = 0;
                $scope.bindOptionsMap = {};
                var bindStrings = bindRecord.bindString.split('\n');
                for (var i = 0; i < bindStrings.length; i++) {
                    var bindOptions = bindLoader.load(bindStrings[i]);
                    $scope.bindOptionsMap[bindOptions.keyToBind] = bindOptions;
                    numBindsLoaded++;
                }
                $scope.buyBinds = bindStrings;
                $window.ga('send', 'event', 'bind loader', 'load', 'key bind', numBindsLoaded, { page: $route.current.page });
            }
        });
    };


    $scope.openSaveBindsModal = function (buyBinds) {
        $modal.open({
            templateUrl: 'partials/mkg-save-binds.phtml',
            controller: 'MultiKeyGenSaveBindsCtrl',
            resolve: {
                buyBinds: function () {
                    return buyBinds;
                }
            }
        });
    };

    var getBuyBindsWithNewlines = function () {
        var buyBindsForCopy = '';
        for (var i = 0 ; i < $scope.buyBinds.length; i++) {
            buyBindsForCopy = buyBindsForCopy + $scope.buyBinds[i] + '\n';
        }
        return buyBindsForCopy.trim();
    };

    $scope.getBuyBindsForCopy = function () {
        $window.ga('send', 'event', 'button', 'click', 'copy', { page: $route.current.page });
        var buyBindsForCopy = $scope.generatedBuyBindsComment + '\n';
        buyBindsForCopy = buyBindsForCopy + getBuyBindsWithNewlines() + '\n';
        return buyBindsForCopy;
    };

    $scope.getBuyBindsForSave = function () {
        return getBuyBindsWithNewlines();
    };
}]);

buyndsControllers.controller('MultiKeyGenKeyBindOptionsCtrl', ['$scope', '$modalInstance', 'bindOptions', 'dataService', function ($scope, $modalInstance, bindOptions, dataService) {

    $scope.primaryWeapons = {weaponGroups: []};
    dataService.getPrimaryWeaponsAsync().then(function(data) {
        $scope.primaryWeapons = data;
    });
    $scope.secondaryWeapons = {weaponGroups: []};
    dataService.getSecondaryWeaponsAsync().then(function(data) {
        $scope.secondaryWeapons = data;
    });
    $scope.gear = [];
    dataService.getGearAsync().then(function(data) {
        $scope.gear = data;
    });
    $scope.grenades = [];
    dataService.getGrenadesAsync().then(function(data) {
        $scope.grenades = data;
    });

    $scope.bindOptions = bindOptions;

    $scope.toggleGearSelection = function (gearBind) {
        var idx = $scope.bindOptions.gear.indexOf(gearBind);
        if (idx > -1) {
            $scope.bindOptions.gear.splice(idx, 1);
        } else {
            $scope.bindOptions.gear.push(gearBind);
        }
    };

    $scope.toggleGrenadeSelection = function (grenadeBind) {
        var idx = $scope.bindOptions.grenades.indexOf(grenadeBind);
        if (idx > -1) {
            $scope.bindOptions.grenades.splice(idx, 1);
        } else {
            $scope.bindOptions.grenades.push(grenadeBind);
        }
    };

    $scope.allowExtraGrenade = function (grenadeBind) {
        return grenadeBind === 'flashbang';
    };

    $scope.hasExtraGrenadeSelection = function (grenadeBind) {
        var grenadeCount = $.grep($scope.bindOptions.grenades, function (g) { return g === grenadeBind }).length;
        return grenadeCount > 1;
    };

    $scope.toggleExtraGrenadeSelection = function (grenadeBind) {
        var grenadeCount = $.grep($scope.bindOptions.grenades, function (g) { return g === grenadeBind }).length;
        if (grenadeCount === 2) {
            var idx = $scope.bindOptions.grenades.lastIndexOf(grenadeBind);
            $scope.bindOptions.grenades.splice(idx, 1);
        } else if (grenadeCount === 1) {
            $scope.bindOptions.grenades.push(grenadeBind);
        } else {
            $scope.bindOptions.grenades.push(grenadeBind, grenadeBind);
        }
    };

    $scope.save = function () {
        $modalInstance.close($scope.bindOptions);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.clear = function () {
        $modalInstance.close({ 'clear': $scope.bindOptions.keyToBind });
    };
}]);

buyndsControllers.controller('MultiKeyGenLoadBindsCtrl', ['$scope', '$modalInstance', '$route', '$window', 'bindRepository', 'dataService', function ($scope, $modalInstance, $route, $window, bindRepository, dataService) {

    $scope.buyBindsBindPresets = [];
    dataService.getBindPresetsAsync().then(function(data) {
        $scope.buyBindsBindPresets = data;
    });

    $scope.buyBindsSavedBinds = [];
    $scope.buyBindsLoadBindId = '';
    $scope.submitted = false;

    function init() {
        $scope.getSavedBinds();
    }

    $scope.getSavedBinds = function () {
        var savedBinds = bindRepository.all();
        savedBinds.sort(function(a, b) {
            return a.id - b.id;
        });
        $scope.buyBindsSavedBinds = savedBinds;
    };

    $scope.hasSavedBuyBinds = function () {
        return $scope.buyBindsSavedBinds.length > 0;
    };

    $scope.load = function () {
        $window.ga('send', 'event', 'button', 'click', 'load', { page: $route.current.page });
        if ($scope.mkgLoadBindsForm.$valid) {
            var bindId = $scope.buyBindsLoadBindId;
            var bindRecord;
            if (bindId.startsWith("preset")) {
                for (var i = 0; i < $scope.buyBindsBindPresets.length; i++) {
                    if ($scope.buyBindsBindPresets[i].id === bindId) {
                        bindRecord = $scope.buyBindsBindPresets[i];
                        break;
                    }
                }
                $window.ga('send', 'event', 'bind presets', 'load', bindId, { page: $route.current.page });
            } else {
                bindRecord = bindRepository.get(bindId);
                $window.ga('send', 'event', 'bind repo', 'get by id', bindId, { page: $route.current.page });
            }
            $modalInstance.close(bindRecord);
        }
    };

    $scope.clear = function () {
        $window.ga('send', 'event', 'button', 'click', 'clear', { page: $route.current.page });
        bindRepository.empty();
        $window.ga('send', 'event', 'bind repo', 'delete all', { page: $route.current.page });
        $scope.getSavedBinds();
        $scope.buyBindsLoadBindId = '';
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    init();
}]);

buyndsControllers.controller('MultiKeyGenSaveBindsCtrl', ['$scope', '$modalInstance', '$route', '$window', 'buyBinds', 'bindRepository', function ($scope, $modalInstance, $route, $window, buyBinds, bindRepository) {

    // slots are used as IDs and limit the number of saved binds
    $scope.buyBindsSaveSlots = ['1', '2', '3', '4', '5'];

    $scope.buyBindsSaveAsName = '';
    $scope.buyBindsSaveInSlot = $scope.buyBindsSaveSlots[0];
    $scope.submitted = false;

    $scope.save = function () {
        $window.ga('send', 'event', 'button', 'click', 'save', { page: $route.current.page });
        $scope.submitted = true;
        if ($scope.mkgSaveBindsForm.$valid) {
            var bindId = $scope.buyBindsSaveInSlot;
            var bindName = $scope.buyBindsSaveAsName;
            var bindRecord = new buynds.BindRecord(bindId, bindName, buyBinds);
            bindRepository.save(bindId, bindRecord);
            $window.ga('send', 'event', 'bind repo', 'save', bindId, { page: $route.current.page });
            $modalInstance.close(bindRecord);
        }
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);
