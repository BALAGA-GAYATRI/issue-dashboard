"use strict";
// An HTML renderer takes an `Analytics` structure and emits the output
// as HTML.
exports.__esModule = true;
exports.HtmlRenderer = void 0;
var analytics_1 = require("./analytics");
var fs = require("fs");
function createAnchor(title) {
    return title.replace(/ /g, '-').replace(/[^A-Za-z0-9_\-]/g, '').toLowerCase();
}
var HtmlRenderer = /** @class */ (function () {
    function HtmlRenderer(config) {
        if (config == null || config.output == null) {
            throw new Error('invalid configuration for html renderer');
        }
        var htmlconfig = config.output;
        if (htmlconfig.format == null || htmlconfig.format != 'html') {
            throw new Error("config: 'output.format' expected as 'html'");
        }
        if (htmlconfig.filename == null) {
            throw new Error("config: 'output.filename' is not defined");
        }
        this.config = htmlconfig;
    }
    HtmlRenderer.renderStartNumberWidgets = function () {
        return "<div class=\"number_widgets\">";
    };
    HtmlRenderer.renderFinishNumberWidgets = function () {
        return "</div> <!-- number_widgets -->";
    };
    HtmlRenderer.renderNumberWidget = function (widget) {
        var out = new Array();
        if (widget.title != null) {
            out.push("<a name=\"" + createAnchor(widget.title) + "\"></a>");
        }
        if (widget.url != null) {
            out.push("<a href=\"" + widget.url + "\">");
        }
        out.push("<div class=\"number_widget" + (widget.color ? ' ' + widget.color : '') + "\">");
        if (widget.title != null) {
            out.push("<span class=\"title\">" + widget.title + "</span>");
        }
        if (widget.value != null) {
            out.push("<span class=\"value\">" + widget.value + "</span>");
        }
        out.push("</div>");
        if (widget.url != null) {
            out.push("</a>");
        }
        return out.join('\n');
    };
    HtmlRenderer.renderStringWidget = function (widget) {
        var out = new Array();
        if (widget.title != null) {
            out.push("<a name=\"" + createAnchor(widget.title) + "\"></a>");
        }
        if (widget.url != null) {
            out.push("<a href=\"" + widget.url + "\">");
        }
        out.push("<div class=\"string_widget" + (widget.color ? ' ' + widget.color : '') + "\">");
        if (widget.title != null) {
            out.push("<h3 class=\"title\">" + widget.title + "</h3>");
        }
        if (widget.value != null) {
            out.push("<span class=\"value\">" + widget.value + "</span>");
        }
        out.push("</div> <!-- string_widget -->");
        if (widget.url != null) {
            out.push("</a>");
        }
        return out.join('\n');
    };
    HtmlRenderer.renderGraphWidget = function (widget) {
        var html = new Array();
        var min = 0;
        var max = 0;
        for (var _i = 0, _a = widget.elements; _i < _a.length; _i++) {
            var element = _a[_i];
            if (!(element instanceof analytics_1.NumberWidget)) {
                throw new Error("GraphWidget element did not evaluate to a NumberWidget (is a " + widget.constructor.name + ")");
            }
            var num = element;
            if (typeof num.value != 'number') {
                throw new Error("GraphWidget element did not evaluate to a static number (is a " + typeof num.value + ")");
            }
            var value = num.value;
            if (value > max) {
                max = num.value;
            }
        }
        html.push("<div class=\"graph_widget\">");
        if (widget.title != null) {
            var linkedTitle = widget.url ? "<a href=\"" + widget.url + "\">" + widget.title + "</a>" : widget.title;
            html.push("<a name=\"" + createAnchor(widget.title) + "\"></a>");
            html.push("<h3 class=\"graph_title\">" + linkedTitle + "</h3>");
        }
        html.push("<div class=\"graph\">");
        for (var _b = 0, _c = widget.elements; _b < _c.length; _b++) {
            var element = _c[_b];
            var num = element;
            var value = num.value;
            var scaled = (max > 0) ? Math.floor((value / max) * 100) : 0;
            html.push("<div class=\"graph_item" + (num.color ? ' ' + num.color : '') + "\">");
            html.push("<span class=\"graph_item_title\">");
            if (num.title != null) {
                if (num.url != null) {
                    html.push("<a href=\"" + num.url + "\">");
                }
                html.push("<span class=\"title\">" + num.title + "</span>");
                if (num.url != null) {
                    html.push("</a>");
                }
            }
            html.push("</span>");
            html.push("<span class=\"graph_item_value\">");
            if (num.url != null) {
                html.push("<a href=\"" + num.url + "\">");
            }
            var value_class = (scaled > 0) ? 'value' : 'value empty_value';
            var value_display = (scaled >= 5) ? value : '';
            html.push("<span class=\"" + value_class + "\" style=\"width: " + scaled + "%;\">" + value_display + "</span>");
            if (num.url != null) {
                html.push("</a>");
            }
            html.push("</span>");
            html.push("</div>");
        }
        html.push("</div>");
        html.push("</div>");
        return html.join('\n');
    };
    HtmlRenderer.renderTableCell = function (type, cell) {
        var html = new Array();
        if (!(cell instanceof analytics_1.NumberWidget) && !(cell instanceof analytics_1.StringWidget)) {
            throw new Error("TableWidget header cell did not evaluate to a static value (is a " + typeof cell + ")");
        }
        var value = cell.value;
        var color = cell.color;
        var url = cell.url;
        var align = null;
        if (cell instanceof analytics_1.StringWidget) {
            align = cell.align;
        }
        align = align != null ? " style=\"text-align: " + align + "\"" : '';
        color = color != null ? " class=\"" + color + "\"" : '';
        html.push("<" + type + color + align + ">");
        if (url != null) {
            html.push("<a href=\"" + url + "\">");
        }
        html.push("" + value);
        if (url != null) {
            html.push("</a>");
        }
        html.push("</" + type + ">");
        return html.join('');
    };
    HtmlRenderer.renderTableWidget = function (widget) {
        var html = new Array();
        html.push("<div class=\"table_widget\">");
        if (widget.title != null) {
            var linkedTitle = widget.url ? "<a href=\"" + widget.url + "\">" + widget.title + "</a>" : widget.title;
            html.push("<a name=\"" + createAnchor(widget.title) + "\"></a>");
            html.push("<h3 class=\"table_title\">" + linkedTitle + "</h3>");
        }
        html.push("<table class=\"table\">");
        if (widget.headers != null && widget.headers.length > 0) {
            html.push("<tr class=\"table_header\">");
            for (var _i = 0, _a = widget.headers; _i < _a.length; _i++) {
                var cell = _a[_i];
                html.push(HtmlRenderer.renderTableCell('th', cell));
            }
            html.push("</tr>");
        }
        for (var _b = 0, _c = widget.elements; _b < _c.length; _b++) {
            var row = _c[_b];
            html.push("<tr class=\"table_element\">");
            for (var _d = 0, row_1 = row; _d < row_1.length; _d++) {
                var cell = row_1[_d];
                html.push(HtmlRenderer.renderTableCell('td', cell));
            }
            html.push("</tr>");
        }
        html.push("</table>");
        html.push("</div>");
        return html.join('\n');
    };
    HtmlRenderer.renderAnalytics = function (analytics) {
        var html = new Array();
        html.push("\n<html>\n<head>\n<title>" + (analytics.title ? analytics.title : 'Dashboard') + "</title>\n<link rel=\"stylesheet\" href=\"dashboard.css\" type=\"text/css\" media=\"all\">\n<script src=\"dashboard.js\"></script>\n</head>\n<body>\n<div id=\"analytics\">\n");
        if (analytics.title != null) {
            html.push("<h1>" + analytics.title + "</h1>");
            html.push('');
        }
        if (analytics.description != null) {
            html.push("<div id=\"main_description\" class=\"description\">");
            html.push(analytics.description);
            html.push("</div>");
            html.push('');
        }
        html.push("<div class=\"sections\">");
        for (var _i = 0, _a = analytics.sections; _i < _a.length; _i++) {
            var section = _a[_i];
            html.push("<div class=\"section\">");
            html.push("<div class=\"section_metadata\">");
            if (section.title != null) {
                html.push("<a name=\"" + createAnchor(section.title) + "\"></a>");
                html.push("<h2 class=\"section_title\">" + section.title + "</h2>");
                html.push('');
            }
            if (section.description != null) {
                html.push("<div class=\"description\">");
                html.push(section.description);
                html.push("</div>");
                html.push('');
            }
            html.push("</div> <!-- section_metadata -->");
            html.push("<div class=\"section_widgets\">");
            var showingNumberWidgets = false;
            for (var _b = 0, _c = section.widgets; _b < _c.length; _b++) {
                var widget = _c[_b];
                if (widget instanceof analytics_1.NumberWidget) {
                    // Group the number widgets together
                    if (!showingNumberWidgets) {
                        html.push(HtmlRenderer.renderStartNumberWidgets());
                        showingNumberWidgets = true;
                    }
                    html.push(HtmlRenderer.renderNumberWidget(widget));
                    continue;
                }
                if (showingNumberWidgets) {
                    html.push(HtmlRenderer.renderFinishNumberWidgets());
                    showingNumberWidgets = false;
                }
                if (widget instanceof analytics_1.StringWidget) {
                    html.push(HtmlRenderer.renderStringWidget(widget));
                }
                else if (widget instanceof analytics_1.GraphWidget) {
                    html.push(HtmlRenderer.renderGraphWidget(widget));
                }
                else if (widget instanceof analytics_1.TableWidget) {
                    html.push(HtmlRenderer.renderTableWidget(widget));
                }
                else {
                    throw new Error("cannot render unknown widget type: " + widget.constructor.name);
                }
            }
            if (showingNumberWidgets) {
                html.push(HtmlRenderer.renderFinishNumberWidgets());
                showingNumberWidgets = false;
            }
            html.push("</div> <!-- section_widgets -->");
            html.push("</div> <!-- section -->");
        }
        html.push("\n</div> <!-- sections -->\n<div id=\"footer\">\nGenerated by <a href=\"https://github.com/ethomson/issue-dashboard\" target=\"_blank\" rel=\"noopener noreferrer\">ethomson/issue-dashboard</a>\n</div>\n</div> <!-- analytics -->\n</body>\n</html>\n");
        return html.join('\n');
    };
    HtmlRenderer.prototype.render = function (analytics) {
        fs.writeFileSync(this.config.filename, HtmlRenderer.renderAnalytics(analytics), 'utf8');
    };
    return HtmlRenderer;
}());
exports.HtmlRenderer = HtmlRenderer;
