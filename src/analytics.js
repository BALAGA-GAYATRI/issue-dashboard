"use strict";
// The data structure that contains the actual analytics information.
// An analytics data structure contains one or more "sections" that
// are available for grouping.  Sections contain one or more "widgets"
// that show data.  For example, the `NumberWidget` shows a number, the
// `GraphWidget` shows a graph.
//
// Some of these widgets are able to be computed from dynamic data:
// for example, the `QueryNumberWidget` can execute a query against the
// items REST endpoint on GitHub.
//
// Each widget has an `evaluate` function; this will run its query,
// capture the output, and then return a static value widget with the
// data.  That is, running `QueryNumberWidget.evaluate` will return a
// `NumberWidget` with the actual value set.  The renderers expect static
// value widgets (the results of `evaluate`).
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
exports.__esModule = true;
exports.Analytics = exports.Section = exports.QueryTableWidget = exports.TableWidget = exports.GraphWidget = exports.ScriptStringWidget = exports.StringWidget = exports.ScriptNumberWidget = exports.QueryNumberWidget = exports.NumberWidget = exports.Widget = exports.queryToUrl = void 0;
var evaluate_1 = require("./evaluate");
function evaluateExpression(expr, context) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(expr != null)) return [3 /*break*/, 2];
                    return [4 /*yield*/, evaluate_1.Evaluate.parseExpression(expr, context)];
                case 1:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _a = null;
                    _b.label = 3;
                case 3: return [2 /*return*/, _a];
            }
        });
    });
}
function evaluateMetadata(md, context, value) {
    return __awaiter(this, void 0, void 0, function () {
        var valuedContext;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (md == null) {
                        return [2 /*return*/, null];
                    }
                    valuedContext = {
                        github: context.github,
                        value: value,
                        userdata: context.userdata
                    };
                    return [4 /*yield*/, evaluate_1.Evaluate.parseExpression(md, valuedContext)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function evaluateQuery(type, query, limit, context) {
    return __awaiter(this, void 0, void 0, function () {
        var FETCH_COUNT, queryFunction, resultCount, totalCount, items, page, parsedQuery, url, cached, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    FETCH_COUNT = 100;
                    resultCount = -1;
                    totalCount = 2147483647;
                    items = new Array();
                    page = 0;
                    if (type == 0 /* Issue */) {
                        queryFunction = context.github.search.issuesAndPullRequests;
                    }
                    else {
                        throw new Error("unknown query type: " + type);
                    }
                    return [4 /*yield*/, evaluate_1.Evaluate.parseExpression(query, context)];
                case 1:
                    parsedQuery = _a.sent();
                    url = queryToUrl(parsedQuery);
                    // start with any data that we've cached for this query.  we may need
                    // to fetch additional pages to supply the requested number of items
                    if (context.querycache != null && context.querycache[parsedQuery] != null) {
                        cached = context.querycache[parsedQuery];
                        totalCount = cached.totalCount;
                        items = cached.items;
                        resultCount = items.length;
                        page = items.length / FETCH_COUNT;
                    }
                    _a.label = 2;
                case 2:
                    if (!(resultCount < limit && resultCount < totalCount)) return [3 /*break*/, 4];
                    return [4 /*yield*/, queryFunction({
                            q: parsedQuery,
                            per_page: FETCH_COUNT,
                            page: ++page
                        })];
                case 3:
                    results = _a.sent();
                    totalCount = results.data.total_count;
                    resultCount += results.data.items.length;
                    items.push.apply(items, results.data.items);
                    if (results.data.items.length == 0) {
                        return [3 /*break*/, 4];
                    }
                    return [3 /*break*/, 2];
                case 4:
                    if (context.querycache != null) {
                        context.querycache[parsedQuery] = {
                            query: parsedQuery,
                            totalCount: totalCount,
                            items: items
                        };
                    }
                    return [2 /*return*/, {
                            totalCount: totalCount,
                            items: items.slice(0, limit),
                            url: url
                        }];
            }
        });
    });
}
function queryToUrl(query) {
    var repo = null;
    query = query.replace(/^(.*\s+)?repo:([^\s]+)(\s+.*)?$/, function (match) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        repo = args[1];
        var replace = '';
        if (args[0] != null) {
            replace += args[0];
        }
        if (args[2] != null) {
            replace += args[2];
        }
        return replace;
    });
    query = query.replace(/\s+/g, ' ').replace(/^ /, '').replace(/ $/, '');
    return repo ?
        "https://github.com/" + repo + "/issues?q=" + encodeURIComponent(query) :
        "https://github.com/search?q=" + encodeURIComponent(query);
}
exports.queryToUrl = queryToUrl;
var Widget = /** @class */ (function () {
    function Widget(title, url) {
        this.title = title;
        this.url = url;
    }
    return Widget;
}());
exports.Widget = Widget;
// A widget that has an expression that will evaluate to a numeric value
var NumberWidget = /** @class */ (function (_super) {
    __extends(NumberWidget, _super);
    function NumberWidget(title, url, value, color) {
        var _this = _super.call(this, title, url) || this;
        _this.value = value;
        _this.color = color;
        return _this;
    }
    NumberWidget.prototype.evaluate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var value, result, title, url, color;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof (this.value) == 'number')) return [3 /*break*/, 1];
                        value = this.value;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, evaluate_1.Evaluate.parseExpression(this.value, context)];
                    case 2:
                        result = _a.sent();
                        if (typeof (result) == 'number') {
                            value = result;
                        }
                        else {
                            value = +result;
                        }
                        _a.label = 3;
                    case 3: return [4 /*yield*/, evaluateMetadata(this.title, context, value)];
                    case 4:
                        title = _a.sent();
                        return [4 /*yield*/, evaluateMetadata(this.url, context, value)];
                    case 5:
                        url = _a.sent();
                        return [4 /*yield*/, evaluateMetadata(this.color, context, value)];
                    case 6:
                        color = _a.sent();
                        return [2 /*return*/, new NumberWidget(title, url, value, color)];
                }
            });
        });
    };
    return NumberWidget;
}(Widget));
exports.NumberWidget = NumberWidget;
// A widget that runs an issue query and displays the number of returned
// items as a numeric value
var QueryNumberWidget = /** @class */ (function (_super) {
    __extends(QueryNumberWidget, _super);
    function QueryNumberWidget(title, url, type, query, color) {
        var _this = _super.call(this, title, url) || this;
        _this.type = type;
        _this.query = query;
        _this.color = color;
        return _this;
    }
    QueryNumberWidget.prototype.evaluate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var results, value, url, _a, title, color;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, evaluateQuery(this.type, this.query, 0, context)];
                    case 1:
                        results = _b.sent();
                        value = results.totalCount;
                        if (!(this.url != null)) return [3 /*break*/, 3];
                        return [4 /*yield*/, evaluateMetadata(this.url, context, value)];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = results.url;
                        _b.label = 4;
                    case 4:
                        url = _a;
                        return [4 /*yield*/, evaluateMetadata(this.title, context, value)];
                    case 5:
                        title = _b.sent();
                        return [4 /*yield*/, evaluateMetadata(this.color, context, value)];
                    case 6:
                        color = _b.sent();
                        return [2 /*return*/, new NumberWidget(title, url, value, color)];
                }
            });
        });
    };
    return QueryNumberWidget;
}(Widget));
exports.QueryNumberWidget = QueryNumberWidget;
// A widget that runs a script and displays the number of returned
// items as a numeric value
var ScriptNumberWidget = /** @class */ (function (_super) {
    __extends(ScriptNumberWidget, _super);
    function ScriptNumberWidget(title, url, script, color) {
        var _this = _super.call(this, title, url) || this;
        _this.script = script;
        _this.color = color;
        return _this;
    }
    ScriptNumberWidget.prototype.evaluate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var result, value, title, url, color;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, evaluate_1.Evaluate.runScript(this.script, context)];
                    case 1:
                        result = _a.sent();
                        title = null;
                        url = null;
                        color = null;
                        if (typeof result == 'object' && result.value) {
                            title = result.title;
                            url = result.url;
                            color = result.color;
                            result = result.value;
                        }
                        if (typeof result != 'number') {
                            result = result.toString();
                            if (result.match(/^\d+$/)) {
                                result = +result;
                            }
                            else {
                                result = Number.NaN;
                            }
                        }
                        value = result;
                        if (!(title == null)) return [3 /*break*/, 3];
                        return [4 /*yield*/, evaluateMetadata(this.title, context, value)];
                    case 2:
                        title = _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!(url == null)) return [3 /*break*/, 5];
                        return [4 /*yield*/, evaluateMetadata(this.url, context, value)];
                    case 4:
                        url = _a.sent();
                        _a.label = 5;
                    case 5:
                        if (!(color == null)) return [3 /*break*/, 7];
                        return [4 /*yield*/, evaluateMetadata(this.color, context, value)];
                    case 6:
                        color = _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/, new NumberWidget(title, url, result, color)];
                }
            });
        });
    };
    return ScriptNumberWidget;
}(Widget));
exports.ScriptNumberWidget = ScriptNumberWidget;
// A widget that has an expression that will evaluate to a string value
var StringWidget = /** @class */ (function (_super) {
    __extends(StringWidget, _super);
    function StringWidget(title, url, value, align, color) {
        var _this = _super.call(this, title, url) || this;
        _this.value = value;
        _this.align = align;
        _this.color = color;
        return _this;
    }
    StringWidget.prototype.evaluate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var value, title, url, align, color;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, evaluate_1.Evaluate.parseExpression(this.value, context)];
                    case 1:
                        value = _a.sent();
                        return [4 /*yield*/, evaluateMetadata(this.title, context, value)];
                    case 2:
                        title = _a.sent();
                        return [4 /*yield*/, evaluateMetadata(this.url, context, value)];
                    case 3:
                        url = _a.sent();
                        return [4 /*yield*/, evaluateMetadata(this.align, context, value)];
                    case 4:
                        align = _a.sent();
                        return [4 /*yield*/, evaluateMetadata(this.color, context, value)];
                    case 5:
                        color = _a.sent();
                        return [2 /*return*/, new StringWidget(title, url, value, align, color)];
                }
            });
        });
    };
    return StringWidget;
}(Widget));
exports.StringWidget = StringWidget;
// A widget that runs a script and displays the string returned
var ScriptStringWidget = /** @class */ (function (_super) {
    __extends(ScriptStringWidget, _super);
    function ScriptStringWidget(title, url, script, align, color) {
        var _this = _super.call(this, title, url) || this;
        _this.script = script;
        _this.align = align;
        _this.color = color;
        return _this;
    }
    ScriptStringWidget.prototype.evaluate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var result, value, title, url, align, color;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, evaluate_1.Evaluate.runScript(this.script, context)];
                    case 1:
                        result = _a.sent();
                        title = null;
                        url = null;
                        align = null;
                        color = null;
                        if (typeof result == 'object' && result.value) {
                            title = result.title;
                            url = result.url;
                            color = result.color;
                            result = result.value;
                        }
                        if (typeof result != 'string') {
                            result = result.toString();
                        }
                        value = result;
                        if (!(title == null)) return [3 /*break*/, 3];
                        return [4 /*yield*/, evaluateMetadata(this.title, context, value)];
                    case 2:
                        title = _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!(url == null)) return [3 /*break*/, 5];
                        return [4 /*yield*/, evaluateMetadata(this.url, context, value)];
                    case 4:
                        url = _a.sent();
                        _a.label = 5;
                    case 5:
                        if (!(align == null)) return [3 /*break*/, 7];
                        return [4 /*yield*/, evaluateMetadata(this.align, context, value)];
                    case 6:
                        align = _a.sent();
                        _a.label = 7;
                    case 7:
                        if (!(color == null)) return [3 /*break*/, 9];
                        return [4 /*yield*/, evaluateMetadata(this.color, context, value)];
                    case 8:
                        color = _a.sent();
                        _a.label = 9;
                    case 9: return [2 /*return*/, new StringWidget(title, url, result, align, color)];
                }
            });
        });
    };
    return ScriptStringWidget;
}(Widget));
exports.ScriptStringWidget = ScriptStringWidget;
// A widget that displays multiple numeric values against each other,
// usually in a bar graph.  This actually is composed of other widgets;
// namely `NumberWidget`s (or things that derive from it, like a
// `QueryNumberWidget`s) to store the data.
var GraphWidget = /** @class */ (function (_super) {
    __extends(GraphWidget, _super);
    function GraphWidget(title, url, elements) {
        var _this = _super.call(this, title, url) || this;
        _this.elements = elements ? elements : new Array();
        return _this;
    }
    GraphWidget.prototype.evaluate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var elements, _i, _a, element, result, title, url;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        elements = new Array();
                        _i = 0, _a = this.elements;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        element = _a[_i];
                        return [4 /*yield*/, element.evaluate(context)];
                    case 2:
                        result = _b.sent();
                        if (!(result instanceof NumberWidget)) {
                            throw new Error('graph widget elements must be number widgets');
                        }
                        elements.push(result);
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, evaluateExpression(this.title, context)];
                    case 5:
                        title = _b.sent();
                        return [4 /*yield*/, evaluateExpression(this.url, context)];
                    case 6:
                        url = _b.sent();
                        return [2 /*return*/, new GraphWidget(title, url, elements)];
                }
            });
        });
    };
    return GraphWidget;
}(Widget));
exports.GraphWidget = GraphWidget;
var TableWidget = /** @class */ (function (_super) {
    __extends(TableWidget, _super);
    function TableWidget(title, url, headers, elements) {
        var _this = _super.call(this, title, url) || this;
        _this.headers = headers;
        _this.elements = elements;
        return _this;
    }
    TableWidget.prototype.evaluate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, elements, _i, _a, header, result, _b, _c, row, cells, _d, row_1, cell, result, title, url;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        headers = new Array();
                        elements = new Array();
                        _i = 0, _a = this.headers;
                        _e.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        header = _a[_i];
                        return [4 /*yield*/, header.evaluate(context)];
                    case 2:
                        result = _e.sent();
                        if (!(result instanceof NumberWidget) && !(result instanceof StringWidget)) {
                            throw new Error('table widget elements must be string or number widgets');
                        }
                        headers.push(result);
                        _e.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        _b = 0, _c = this.elements;
                        _e.label = 5;
                    case 5:
                        if (!(_b < _c.length)) return [3 /*break*/, 11];
                        row = _c[_b];
                        cells = new Array();
                        _d = 0, row_1 = row;
                        _e.label = 6;
                    case 6:
                        if (!(_d < row_1.length)) return [3 /*break*/, 9];
                        cell = row_1[_d];
                        return [4 /*yield*/, cell.evaluate(context)];
                    case 7:
                        result = _e.sent();
                        if (!(result instanceof NumberWidget) && !(result instanceof StringWidget)) {
                            throw new Error('table widget elements must be string or number widgets');
                        }
                        cells.push(result);
                        _e.label = 8;
                    case 8:
                        _d++;
                        return [3 /*break*/, 6];
                    case 9:
                        elements.push(cells);
                        _e.label = 10;
                    case 10:
                        _b++;
                        return [3 /*break*/, 5];
                    case 11: return [4 /*yield*/, evaluateExpression(this.title, context)];
                    case 12:
                        title = _e.sent();
                        return [4 /*yield*/, evaluateExpression(this.url, context)];
                    case 13:
                        url = _e.sent();
                        return [2 /*return*/, new TableWidget(title, url, headers, elements)];
                }
            });
        });
    };
    return TableWidget;
}(Widget));
exports.TableWidget = TableWidget;
var QueryTableWidget = /** @class */ (function (_super) {
    __extends(QueryTableWidget, _super);
    function QueryTableWidget(title, url, type, query, limit, fields) {
        var _this = _super.call(this, title, url) || this;
        _this.type = type;
        _this.query = query;
        _this.limit = limit != null ? limit : QueryTableWidget.DEFAULT_LIMIT;
        _this.fields = fields != null ? fields : QueryTableWidget.DEFAULT_FIELDS[type];
        return _this;
    }
    QueryTableWidget.prototype.getHeaders = function () {
        var headers = new Array();
        for (var _i = 0, _a = this.fields; _i < _a.length; _i++) {
            var field = _a[_i];
            if (field.title != null) {
                headers.push(field.title);
            }
            else if (field.value != null) {
                headers.push(field.value);
            }
            else {
                headers.push(field.toString());
            }
        }
        return headers;
    };
    QueryTableWidget.evaluateItemValue = function (value, context, item) {
        return __awaiter(this, void 0, void 0, function () {
            var valuedContext;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        valuedContext = {
                            github: context.github,
                            item: item,
                            userdata: context.userdata
                        };
                        return [4 /*yield*/, evaluate_1.Evaluate.parseExpression(value, valuedContext)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    QueryTableWidget.prototype.getRow = function (item, context) {
        return __awaiter(this, void 0, void 0, function () {
            var values, _i, _a, field, _b, _c, property;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        values = new Array();
                        _i = 0, _a = this.fields;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        field = _a[_i];
                        if (!(field.value != null)) return [3 /*break*/, 3];
                        _c = (_b = values).push;
                        return [4 /*yield*/, QueryTableWidget.evaluateItemValue(field.value, context, item)];
                    case 2:
                        _c.apply(_b, [_d.sent()]);
                        return [3 /*break*/, 4];
                    case 3:
                        property = (field.property != null) ? field.property : field.toString();
                        values.push(item[property]);
                        _d.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, values];
                }
            });
        });
    };
    QueryTableWidget.prototype.evaluate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, elements, results, _i, _a, header, item, _b, _c, row, _d, _e, value, title, url, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        headers = new Array();
                        elements = new Array();
                        return [4 /*yield*/, evaluateQuery(this.type, this.query, this.limit, context)];
                    case 1:
                        results = _g.sent();
                        for (_i = 0, _a = this.getHeaders(); _i < _a.length; _i++) {
                            header = _a[_i];
                            headers.push(new StringWidget(null, null, header, null, null));
                        }
                        _b = 0, _c = results.items;
                        _g.label = 2;
                    case 2:
                        if (!(_b < _c.length)) return [3 /*break*/, 8];
                        item = _c[_b];
                        row = new Array();
                        _d = 0;
                        return [4 /*yield*/, this.getRow(item, context)];
                    case 3:
                        _e = _g.sent();
                        _g.label = 4;
                    case 4:
                        if (!(_d < _e.length)) return [3 /*break*/, 6];
                        value = _e[_d];
                        row.push(new StringWidget(null, item.html_url, value, null, null));
                        _g.label = 5;
                    case 5:
                        _d++;
                        return [3 /*break*/, 4];
                    case 6:
                        elements.push(row);
                        _g.label = 7;
                    case 7:
                        _b++;
                        return [3 /*break*/, 2];
                    case 8: return [4 /*yield*/, evaluateExpression(this.title, context)];
                    case 9:
                        title = _g.sent();
                        if (!(this.url != null)) return [3 /*break*/, 11];
                        return [4 /*yield*/, evaluateExpression(this.url, context)];
                    case 10:
                        _f = _g.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        _f = results.url;
                        _g.label = 12;
                    case 12:
                        url = _f;
                        return [2 /*return*/, new TableWidget(title, url, headers, elements)];
                }
            });
        });
    };
    QueryTableWidget.DEFAULT_FIELDS = (_a = {},
        _a[0 /* Issue */] = [
            { title: 'Issue', property: 'number' },
            { title: 'Title', property: 'title' }
        ],
        _a);
    QueryTableWidget.DEFAULT_LIMIT = 10;
    return QueryTableWidget;
}(Widget));
exports.QueryTableWidget = QueryTableWidget;
// A `Section` contains one or more widgets
var Section = /** @class */ (function () {
    function Section(title, description, widgets) {
        this.title = title;
        this.description = description;
        this.widgets = widgets;
    }
    Section.prototype.evaluate = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var evaluated, _i, _a, widget, _b, _c, title, _d, description, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        evaluated = new Array();
                        _i = 0, _a = this.widgets;
                        _f.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        widget = _a[_i];
                        _c = (_b = evaluated).push;
                        return [4 /*yield*/, widget.evaluate(context)];
                    case 2:
                        _c.apply(_b, [_f.sent()]);
                        _f.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        if (!this.title) return [3 /*break*/, 6];
                        return [4 /*yield*/, evaluate_1.Evaluate.parseExpression(this.title, context)];
                    case 5:
                        _d = _f.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        _d = null;
                        _f.label = 7;
                    case 7:
                        title = _d;
                        if (!this.description) return [3 /*break*/, 9];
                        return [4 /*yield*/, evaluate_1.Evaluate.parseExpression(this.description, context)];
                    case 8:
                        _e = _f.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        _e = null;
                        _f.label = 10;
                    case 10:
                        description = _e;
                        return [2 /*return*/, new Section(title, description, evaluated)];
                }
            });
        });
    };
    return Section;
}());
exports.Section = Section;
var Analytics = /** @class */ (function () {
    function Analytics(title, description, sections, setup, shutdown) {
        this.title = title;
        this.description = description;
        this.sections = sections;
        this.setup = setup;
        this.shutdown = shutdown;
    }
    Analytics.evaluate = function (config, github) {
        return __awaiter(this, void 0, void 0, function () {
            var context, evaluated, _i, _a, section, _b, _c, title, description;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        context = { 'github': github, 'querycache': {}, 'userdata': {} };
                        evaluated = new Array();
                        if (!(config.setup != null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, evaluate_1.Evaluate.runScript(config.setup, context)];
                    case 1:
                        _d.sent();
                        _d.label = 2;
                    case 2:
                        _i = 0, _a = config.sections;
                        _d.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        section = _a[_i];
                        _c = (_b = evaluated).push;
                        return [4 /*yield*/, section.evaluate(context)];
                    case 4:
                        _c.apply(_b, [_d.sent()]);
                        _d.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [4 /*yield*/, evaluateExpression(config.title, context)];
                    case 7:
                        title = _d.sent();
                        return [4 /*yield*/, evaluateExpression(config.description, context)];
                    case 8:
                        description = _d.sent();
                        if (!(config.shutdown != null)) return [3 /*break*/, 10];
                        return [4 /*yield*/, evaluate_1.Evaluate.runScript(config.shutdown, context)];
                    case 9:
                        _d.sent();
                        _d.label = 10;
                    case 10: return [2 /*return*/, new Analytics(title, description, evaluated, null, null)];
                }
            });
        });
    };
    return Analytics;
}());
exports.Analytics = Analytics;
