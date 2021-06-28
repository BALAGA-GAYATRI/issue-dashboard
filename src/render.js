"use strict";
// A renderer takes an `Analytics` structure and emits it as data.
exports.__esModule = true;
exports.Renderer = void 0;
var render_html_1 = require("./render_html");
var render_markdown_1 = require("./render_markdown");
var Renderer = /** @class */ (function () {
    function Renderer() {
    }
    Renderer.fromConfig = function (config) {
        if (config.output == null) {
            throw new Error("config: 'output' is not defined");
        }
        if (config.output.format == null) {
            throw new Error("config: 'output.format' is not defined");
        }
        if (config.output.format == 'markdown') {
            return new render_markdown_1.MarkdownRenderer(config);
        }
        else if (config.output.format == 'html') {
            return new render_html_1.HtmlRenderer(config);
        }
        else {
            throw new Error("config: unknown output format type '" + config.output.format + "'");
        }
    };
    return Renderer;
}());
exports.Renderer = Renderer;
