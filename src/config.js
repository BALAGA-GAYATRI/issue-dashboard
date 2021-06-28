"use strict";
// A configuration is an `Analytics` structure of its own.  It will take
// the YAML configuration and parse it into an `AnalyticsConfig`.  This
// will contain the literal definition from the configuration itself.
// By running the `evaluate` on the `Analytics`, it will take the input,
// including any queries, and execute them to produce a static `Analytics`
// structure with the actual values.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.AnalyticsConfig = void 0;
var analytics_1 = require("./analytics");
var yaml = require("js-yaml");
var fs = require("fs");
function configError(context, message) {
    var location = context ? " for " + context : '';
    throw new Error("config: invalid configuration" + location + ": " + message);
}
function configValue(config, context, key, required) {
    if (required === void 0) { required = false; }
    if (!(key in config) && required) {
        configError(context, "missing required option '" + key + "'");
    }
    var value = config[key];
    delete config[key];
    return value;
}
function ensureConfigEmpty(config, context) {
    var remaining = Object.keys(config);
    if (remaining.length != 0) {
        configError(context, "unexpected option '" + remaining[0] + "'");
    }
}
function keyList(keys, andor) {
    var result = new Array();
    for (var i = 0; i < keys.length; i++) {
        if (i == keys.length - 1) {
            result.push(" " + andor + " ");
        }
        else if (i > 0) {
            result.push(', ');
        }
        result.push("'" + keys[i] + "'");
    }
    return result.join('');
}
function ensureOneConfigKey(config, context, keys) {
    var found = new Array();
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        if (key in config) {
            found.push(key);
        }
    }
    if (found.length == 0) {
        configError(context, "expected one of: " + keyList(keys, 'or'));
    }
    if (found.length > 1) {
        configError(context, "expected only one of: " + keyList(found, 'or'));
    }
}
var AnalyticsConfig = /** @class */ (function (_super) {
    __extends(AnalyticsConfig, _super);
    function AnalyticsConfig(title, description, sections, output, setup, shutdown) {
        var _this = _super.call(this, title, description, sections, setup, shutdown) || this;
        _this.output = output;
        return _this;
    }
    AnalyticsConfig.loadStringWidget = function (config) {
        var widget;
        if (typeof config == 'string') {
            config = { value: config };
        }
        ensureOneConfigKey(config, 'string widget', ['value', 'script']);
        var title = configValue(config, 'string widget', 'title');
        var url = configValue(config, 'string widget', 'url');
        var color = configValue(config, 'string widget', 'color');
        var align = configValue(config, 'string widget', 'align');
        var value = configValue(config, 'string widget', 'value');
        var script = configValue(config, 'string widget', 'script');
        if (script != null) {
            widget = new analytics_1.ScriptStringWidget(title, url, script, align, color);
        }
        else if (value != null) {
            widget = new analytics_1.StringWidget(title, url, value, align, color);
        }
        else {
            throw new Error();
        }
        ensureConfigEmpty(config, 'string widget');
        return widget;
    };
    AnalyticsConfig.loadNumberWidget = function (config) {
        var widget;
        ensureOneConfigKey(config, 'number widget', ['issue_query', 'value', 'script']);
        var title = configValue(config, 'number widget', 'title');
        var url = configValue(config, 'number widget', 'url');
        var color = configValue(config, 'number widget', 'color');
        var value = configValue(config, 'number widget', 'value');
        var script = configValue(config, 'number widget', 'script');
        var query = configValue(config, 'number widget', 'issue_query');
        var query_type = 0 /* Issue */;
        if (query != null) {
            widget = new analytics_1.QueryNumberWidget(title, url, query_type, query, color);
        }
        else if (script != null) {
            widget = new analytics_1.ScriptNumberWidget(title, url, script, color);
        }
        else if (value != null) {
            widget = new analytics_1.NumberWidget(title, url, value, color);
        }
        else {
            throw new Error();
        }
        ensureConfigEmpty(config, 'number widget');
        return widget;
    };
    AnalyticsConfig.loadGraphWidget = function (config) {
        var widgets = new Array();
        var title = configValue(config, 'graph widget', 'title');
        var url = configValue(config, 'graph widget', 'url');
        var elements = configValue(config, 'graph widget', 'elements', true);
        for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
            var element = elements_1[_i];
            ensureOneConfigKey(element, 'graph widget element', ['issue_query', 'value']);
            var title_1 = configValue(element, 'graph widget element', 'title');
            var url_1 = configValue(element, 'graph widget element', 'url');
            var color = configValue(element, 'graph widget element', 'color');
            var query = configValue(element, 'graph widget element', 'issue_query');
            var query_type = 0 /* Issue */;
            var value = configValue(element, 'graph widget element', 'value');
            if (query != null) {
                widgets.push(new analytics_1.QueryNumberWidget(title_1, url_1, query_type, query, color));
            }
            else if (value != null) {
                widgets.push(new analytics_1.NumberWidget(title_1, url_1, value, color));
            }
            ensureConfigEmpty(element, 'graph widget element');
        }
        ensureConfigEmpty(config, 'graph widget');
        return new analytics_1.GraphWidget(title, url, widgets);
    };
    AnalyticsConfig.loadQueryTableWidget = function (config) {
        var title = configValue(config, 'table widget', 'title');
        var url = configValue(config, 'table widget', 'url');
        var fields = configValue(config, 'table widget', 'fields');
        var query = configValue(config, 'table widget', 'issue_query', true);
        var limit = configValue(config, 'table widget', 'limit');
        var query_type = 0 /* Issue */;
        if (fields != null && !Array.isArray(fields)) {
            configError('table widget', "'fields' is not an array");
        }
        return new analytics_1.QueryTableWidget(title, url, query_type, query, limit, fields);
    };
    AnalyticsConfig.loadStaticTableWidget = function (config) {
        var headers = new Array();
        var elements = new Array();
        var title = configValue(config, 'table widget', 'title');
        var url = configValue(config, 'table widget', 'url');
        var headerConfig = configValue(config, 'table widget', 'headers');
        var elementsConfig = configValue(config, 'table widget', 'elements', true);
        if (headerConfig != null && Array.isArray(headerConfig)) {
            for (var _i = 0, headerConfig_1 = headerConfig; _i < headerConfig_1.length; _i++) {
                var header = headerConfig_1[_i];
                headers.push(AnalyticsConfig.loadStringWidget(header));
            }
        }
        else if (headerConfig != null) {
            headers.push(AnalyticsConfig.loadStringWidget(headerConfig));
        }
        if (elementsConfig != null && !Array.isArray(elementsConfig)) {
            configError('table widget', "'elements' is not an array");
        }
        for (var _a = 0, elementsConfig_1 = elementsConfig; _a < elementsConfig_1.length; _a++) {
            var elementList = elementsConfig_1[_a];
            if (Array.isArray(elementList)) {
                var row = new Array();
                for (var _b = 0, elementList_1 = elementList; _b < elementList_1.length; _b++) {
                    var element = elementList_1[_b];
                    row.push(AnalyticsConfig.loadStringWidget(element));
                }
                elements.push(row);
            }
            else {
                elements.push([AnalyticsConfig.loadStringWidget(elementList)]);
            }
        }
        return new analytics_1.TableWidget(title, url, headers, elements);
    };
    AnalyticsConfig.loadTableWidget = function (config) {
        var widget;
        ensureOneConfigKey(config, 'table widget', ['issue_query', 'elements']);
        if (config.issue_query != null) {
            widget = AnalyticsConfig.loadQueryTableWidget(config);
        }
        else {
            widget = AnalyticsConfig.loadStaticTableWidget(config);
        }
        ensureConfigEmpty(config, 'table widget');
        return widget;
    };
    AnalyticsConfig.loadWidget = function (config) {
        var widget;
        var type = configValue(config, 'widget', 'type', true);
        if (type == 'number') {
            widget = AnalyticsConfig.loadNumberWidget(config);
        }
        else if (type == 'string') {
            widget = AnalyticsConfig.loadStringWidget(config);
        }
        else if (type == 'graph') {
            widget = AnalyticsConfig.loadGraphWidget(config);
        }
        else if (type == 'table') {
            widget = AnalyticsConfig.loadTableWidget(config);
        }
        else {
            configError('widget', "invalid type '" + type + "'");
        }
        ensureConfigEmpty(config, 'widget');
        return widget;
    };
    AnalyticsConfig.loadSection = function (config) {
        var widgets = new Array();
        var title = configValue(config, 'section', 'title');
        var description = configValue(config, 'section', 'description');
        var widgetConfig = configValue(config, 'section', 'widgets');
        if (widgetConfig != null) {
            if (!Array.isArray(widgetConfig)) {
                configError('section', "'widgets' is not an array");
            }
            for (var _i = 0, widgetConfig_1 = widgetConfig; _i < widgetConfig_1.length; _i++) {
                var wc = widgetConfig_1[_i];
                widgets.push(AnalyticsConfig.loadWidget(wc));
            }
        }
        ensureConfigEmpty(config, 'section');
        return new analytics_1.Section(title, description, widgets);
    };
    AnalyticsConfig.loadOutput = function (config) {
        var output = {};
        if (!('format' in config)) {
            throw new Error("config: 'output.format' is not defined");
        }
        for (var key in config) {
            output[key] = config[key];
        }
        return output;
    };
    AnalyticsConfig.load = function (config) {
        var sections = new Array();
        var title = configValue(config, null, 'title');
        var description = configValue(config, null, 'description');
        var setup = configValue(config, null, 'setup');
        var shutdown = configValue(config, null, 'shutdown');
        var outputConfig = configValue(config, null, 'output', true);
        var sectionConfig = configValue(config, null, 'sections');
        if (sectionConfig != null) {
            if (!Array.isArray(sectionConfig)) {
                configError(null, "'sections' is not an array");
            }
            for (var _i = 0, sectionConfig_1 = sectionConfig; _i < sectionConfig_1.length; _i++) {
                var section = sectionConfig_1[_i];
                sections.push(AnalyticsConfig.loadSection(section));
            }
        }
        var output = AnalyticsConfig.loadOutput(outputConfig);
        ensureConfigEmpty(config, null);
        return new AnalyticsConfig(title, description, sections, output, setup, shutdown);
    };
    AnalyticsConfig.fromJson = function (config) {
        return AnalyticsConfig.load(JSON.parse(config));
    };
    AnalyticsConfig.fromYaml = function (config) {
        return AnalyticsConfig.load(yaml.safeLoad(config));
    };
    AnalyticsConfig.from = function (config) {
        var ConfigFormat;
        (function (ConfigFormat) {
            ConfigFormat[ConfigFormat["JSON"] = 0] = "JSON";
            ConfigFormat[ConfigFormat["YAML"] = 1] = "YAML";
        })(ConfigFormat || (ConfigFormat = {}));
        var format;
        var input;
        // try {
        //     input = JSON.parse(config)
        //     format = ConfigFormat.JSON
        // }
        // catch (e) {
        //     // input = yaml.safeLoad(config)
        console.log("////////////  loading yaml file //////////////");
        input = yaml.safeLoad(fs.readFileSync(config, 'utf8'));
        console.log(input);
        format = ConfigFormat.YAML;
        // }
        // if (format == ConfigFormat.JSON) {
        //     return AnalyticsConfig.load(input)
        // }
        // else {
        return AnalyticsConfig.load(input);
        // }
    };
    return AnalyticsConfig;
}(analytics_1.Analytics));
exports.AnalyticsConfig = AnalyticsConfig;
