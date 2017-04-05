module.exports = ModeContextFormFilterDirective;

ModeContextFormFilterDirective.$inject = [];
function ModeContextFormFilterDirective() {
    return {
        restrict: 'E',
        scope: true,
        controller: ModeContextFormFilter,
        template: require('./mode-context-form-filter.html')
    };
}

ModeContextFormFilter.$inject = ['$scope', 'FormEndpoint', 'PostEndpoint', 'TagEndpoint', '$q', '_', '$rootScope', 'PostSurveyService', '$timeout'];
function ModeContextFormFilter($scope, FormEndpoint, PostEndpoint, TagEndpoint, $q, _, $rootScope, PostSurveyService, $timeout) {
    $scope.forms = [];
    $scope.showOnly = showOnly;
    $scope.hide = hide;
    $scope.unknown_post_count = 0;
    $scope.hasManageSettingsPermission = $rootScope.hasManageSettingsPermission;
    $scope.canAddToSurvey = PostSurveyService.canCreatePostInSurvey;
    activate();

    function activate() {
        // Load forms
        $scope.forms = FormEndpoint.queryFresh();
        $scope.tags = TagEndpoint.queryFresh();
        var postCountRequest = PostEndpoint.stats({ group_by: 'form', status: 'all' });
        $q.all([$scope.forms.$promise, postCountRequest.$promise, $scope.tags.$promise]).then(function (responses) {
            if (!responses[1] || !responses[1].totals || !responses[1].totals[0]) {
                return;
            }
            var values = responses[1].totals[0].values;
            var tags = responses[2];
            angular.forEach($scope.forms, function (form) {
                var value = _.findWhere(values, { id: form.id });
                form.post_count = value ? value.total : 0;
            });
            $scope.forms.forEach(function (form, index) {
                // assigning whole tag-object to forms
                $scope.forms[index].tags = _.filter(tags, function (tag) {
                    return _.contains(form.tags, tag.id.toString());
                });
            });
            // Grab the count for form=null
            var unknownValue = _.findWhere(values, { id: null });
            if (unknownValue) {
                $scope.unknown_post_count = unknownValue.total;
            }
        });
    }

    function showOnly(formId) {
        $scope.filters.form.splice(0, $scope.filters.form.length, formId);
    }

    function hide(formId) {
        var index = $scope.filters.form.indexOf(formId);
        if (index !== -1) {
            $scope.filters.form.splice(index, 1);
        }
    }
}
