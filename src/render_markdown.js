"use strict";
// A markdown renderer takes an `Analytics` structure and emits the
// data as markdown.
exports.__esModule = true;
exports.MarkdownRenderer = void 0;
var analytics_1 = require("./analytics");
var fs = require("fs");
var MarkdownRenderer = /** @class */ (function () {
    function MarkdownRenderer(config) {
        if (config == null || config.output == null) {
            throw new Error('invalid configuration for markdown renderer');
        }
        var mdconfig = config.output;
        if (mdconfig.format == null || mdconfig.format != 'markdown') {
            throw new Error("config: 'output.format' expected as 'markdown'");
        }
        if (mdconfig.filename == null) {
            throw new Error("config: 'output.filename' is not defined");
        }
        this.config = mdconfig;
    }
    MarkdownRenderer.renderColor = function (color) {
        if (color == 'red') {
            return '🔴';
        }
        else if (color == 'yellow') {
            return '💛';
        }
        else if (color == 'green') {
            return '✅';
        }
        else if (color == 'blue') {
            return '🔷';
        }
        else if (color == 'black') {
            return '⬛️';
        }
        throw new Error("invalid color: " + color);
    };
    MarkdownRenderer.renderNumberWidget = function (widget) {
        var value = widget.value;
        var color = widget.color;
        var out = value.toString();
        if (color != null) {
            out = MarkdownRenderer.renderColor(color) + " " + out;
        }
        if (widget.url != null) {
            out = "[" + out + "](" + widget.url + ")";
        }
        return out;
    };
    MarkdownRenderer.renderStringWidget = function (widget) {
        var value = widget.value;
        var color = widget.color;
        var md = new Array;
        if (widget.title != null) {
            md.push("#### " + widget.title + "\n");
            md.push('\n');
        }
        if (widget.url != null) {
            md.push('[');
        }
        if (color != null) {
            md.push(MarkdownRenderer.renderColor(color) + " ");
        }
        md.push(value);
        if (widget.url != null) {
            md.push("](" + widget.url + ")");
        }
        md.push('\n');
        return md.join('');
    };
    MarkdownRenderer.renderGraphWidget = function (widget) {
        // length of the bar (on-screen) at the largest value
        // TODO: account for the length of titles and values
        var BAR_LENGTH = 35;
        var md = new Array();
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
                max = value;
            }
        }
        // TODO: scale this by accounting for the minimum value, to avoid
        // large numbers with little variance blowing out the graph
        var scale = (BAR_LENGTH / max);
        // To get the numbers left and right-aligned, add non-breaking space
        // between them.  A number is roughly the size of the block unicode
        // glyph, a non-breaking space is roughly n times those glyphs
        var spacerlen = Math.floor((BAR_LENGTH - (min.toString().length - max.toString().length)) * 3.75);
        var spacer = '&nbsp;'.repeat(spacerlen);
        if (widget.title) {
            md.push("#### " + widget.title);
            md.push('');
        }
        md.push("| " + (widget.title ? widget.title : '') + " |  | " + min + spacer + max + " |");
        md.push("|:------------------------------------|-:|:-------|");
        for (var _b = 0, _c = widget.elements; _b < _c.length; _b++) {
            var element = _c[_b];
            var num = element;
            var value = num.value;
            var bar = '█'.repeat(value * scale);
            md.push("| " + (num.title ? num.title : '') + " | " + MarkdownRenderer.renderNumberWidget(num) + " | " + bar + " |");
        }
        md.push('');
        return md.join('\n');
    };
    MarkdownRenderer.renderTableCell = function (widget) {
        if (!(widget instanceof analytics_1.NumberWidget) && !(widget instanceof analytics_1.StringWidget)) {
            throw new Error("TableWidget header cell did not evaluate to a static value (is a " + typeof widget + ")");
        }
        var value = widget.value;
        var color = widget.color;
        var out = value.toString();
        if (color != null) {
            out = MarkdownRenderer.renderColor(color) + " " + out;
        }
        if (widget.url != null) {
            out = "[" + out + "](" + widget.url + ")";
        }
        return out;
    };
    MarkdownRenderer.renderTableWidget = function (widget) {
        var md = new Array();
        var line;
        var columns = (widget.headers != null) ? widget.headers.length : 0;
        // Find the maximum number of columns
        for (var _i = 0, _a = widget.elements; _i < _a.length; _i++) {
            var row = _a[_i];
            if (row.length > columns) {
                columns = row.length;
            }
        }
        if (columns == 0) {
            return '';
        }
        if (widget.title) {
            md.push("#### " + widget.title);
            md.push('');
        }
        // Draw header
        line = new Array();
        line.push('|');
        for (var i = 0; i < columns; i++) {
            line.push(' ');
            if (widget.headers != null && i < widget.headers.length) {
                line.push(MarkdownRenderer.renderTableCell(widget.headers[i]));
            }
            line.push(' |');
        }
        md.push(line.join(''));
        // Draw header/element separator lines
        line = new Array();
        line.push('|');
        for (var i = 0; i < columns; i++) {
            var align = (widget.headers != null && i < widget.headers.length && widget.headers[i] instanceof analytics_1.StringWidget) ? widget.headers[i].align : null;
            if (align == 'left') {
                line.push(':--');
            }
            else if (align == 'center') {
                line.push(':-:');
            }
            else if (align == 'right') {
                line.push('--:');
            }
            else {
                line.push('---');
            }
            line.push('|');
        }
        md.push(line.join(''));
        // Draw elements
        for (var _b = 0, _c = widget.elements; _b < _c.length; _b++) {
            var row = _c[_b];
            line = new Array();
            line.push('|');
            for (var i = 0; i < columns; i++) {
                line.push(' ');
                line.push(MarkdownRenderer.renderTableCell(row[i]));
                line.push(' |');
            }
            md.push(line.join(''));
        }
        return md.join('\n');
    };
    MarkdownRenderer.renderAnalytics = function (analytics) {
        var md = new Array();
        if (analytics.title != null) {
            md.push("# " + analytics.title);
            md.push('');
        }
        if (analytics.description != null) {
            md.push(analytics.description);
            md.push('');
        }
        for (var _i = 0, _a = analytics.sections; _i < _a.length; _i++) {
            var section = _a[_i];
            if (section.title != null) {
                md.push("## " + section.title);
                md.push('');
            }
            if (section.description != null) {
                md.push(section.description);
                md.push('');
            }
            var showingNumberWidgets = false;
            for (var _b = 0, _c = section.widgets; _b < _c.length; _b++) {
                var widget = _c[_b];
                if (widget instanceof analytics_1.NumberWidget) {
                    // Group the number widgets together
                    if (!showingNumberWidgets) {
                        md.push('| Query |  |');
                        md.push('|:------|-:|');
                        showingNumberWidgets = true;
                    }
                    md.push("| " + (widget.title ? widget.title : '') + " | " + MarkdownRenderer.renderNumberWidget(widget) + " |");
                    continue;
                }
                if (showingNumberWidgets) {
                    md.push('');
                    showingNumberWidgets = false;
                }
                if (widget instanceof analytics_1.StringWidget) {
                    md.push(MarkdownRenderer.renderStringWidget(widget));
                }
                else if (widget instanceof analytics_1.GraphWidget) {
                    md.push(MarkdownRenderer.renderGraphWidget(widget));
                }
                else if (widget instanceof analytics_1.TableWidget) {
                    md.push(MarkdownRenderer.renderTableWidget(widget));
                }
                else {
                    throw new Error("cannot render unknown widget type: " + widget.constructor.name);
                }
            }
        }
        md.push('');
        return md.join('\n');
    };
    MarkdownRenderer.prototype.render = function (analytics) {
        fs.writeFileSync(this.config.filename, MarkdownRenderer.renderAnalytics(analytics), 'utf8');
    };
    return MarkdownRenderer;
}());
exports.MarkdownRenderer = MarkdownRenderer;
