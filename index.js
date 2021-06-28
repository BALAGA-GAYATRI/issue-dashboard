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
Object.defineProperty(exports, "__esModule", { value: true });
const evaluate_1 = require("./evaluate");
async function evaluateExpression(expr, context) {
    return expr != null ? await evaluate_1.Evaluate.parseExpression(expr, context) : null;
}
async function evaluateMetadata(md, context, value) {
    if (md == null) {
        return null;
    }
    const valuedContext = {
        github: context.github,
        value: value,
        userdata: context.userdata
    };
    return await evaluate_1.Evaluate.parseExpression(md, valuedContext);
}
async function evaluateQuery(type, query, limit, context) {
    // fetch 100 at a time (the GitHub REST API limit) for maximum caching
    const FETCH_COUNT = 100;
    let queryFunction;
    let resultCount = -1;
    let totalCount = 2147483647;
    let items = new Array();
    let page = 0;
    if (type == 0 /* Issue */) {
        queryFunction = context.github.search.issuesAndPullRequests;
    }
    else {
        throw new Error(`unknown query type: ${type}`);
    }
    let parsedQuery = await evaluate_1.Evaluate.parseExpression(query, context);
    let url = queryToUrl(parsedQuery);
    // start with any data that we've cached for this query.  we may need
    // to fetch additional pages to supply the requested number of items
    if (context.querycache != null && context.querycache[parsedQuery] != null) {
        const cached = context.querycache[parsedQuery];
        totalCount = cached.totalCount;
        items = cached.items;
        resultCount = items.length;
        page = items.length / FETCH_COUNT;
    }
    while (resultCount < limit && resultCount < totalCount) {
        let results = await queryFunction({
            q: parsedQuery,
            per_page: FETCH_COUNT,
            page: ++page
        });
        totalCount = results.data.total_count;
        resultCount += results.data.items.length;
        items.push(...results.data.items);
        if (results.data.items.length == 0) {
            break;
        }
    }
    if (context.querycache != null) {
        context.querycache[parsedQuery] = {
            query: parsedQuery,
            totalCount: totalCount,
            items: items
        };
    }
    return {
        totalCount: totalCount,
        items: items.slice(0, limit),
        url: url
    };
}
function queryToUrl(query) {
    let repo = null;
    query = query.replace(/^(.*\s+)?repo:([^\s]+)(\s+.*)?$/, (match, ...args) => {
        repo = args[1];
        let replace = '';
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
        `https://github.com/${repo}/issues?q=${encodeURIComponent(query)}` :
        `https://github.com/search?q=${encodeURIComponent(query)}`;
}
exports.queryToUrl = queryToUrl;
class Widget {
    constructor(title, url) {
        this.title = title;
        this.url = url;
    }
}
exports.Widget = Widget;
// A widget that has an expression that will evaluate to a numeric value
class NumberWidget extends Widget {
    constructor(title, url, value, color) {
        super(title, url);
        this.value = value;
        this.color = color;
    }
    async evaluate(context) {
        let value;
        if (typeof (this.value) == 'number') {
            value = this.value;
        }
        else {
            let result = await evaluate_1.Evaluate.parseExpression(this.value, context);
            if (typeof (result) == 'number') {
                value = result;
            }
            else {
                value = +result;
            }
        }
        const title = await evaluateMetadata(this.title, context, value);
        const url = await evaluateMetadata(this.url, context, value);
        const color = await evaluateMetadata(this.color, context, value);
        return new NumberWidget(title, url, value, color);
    }
}
exports.NumberWidget = NumberWidget;
// A widget that runs an issue query and displays the number of returned
// items as a numeric value
class QueryNumberWidget extends Widget {
    constructor(title, url, type, query, color) {
        super(title, url);
        this.type = type;
        this.query = query;
        this.color = color;
    }
    async evaluate(context) {
        let results = await evaluateQuery(this.type, this.query, 0, context);
        const value = results.totalCount;
        const url = this.url != null ? await evaluateMetadata(this.url, context, value) : results.url;
        const title = await evaluateMetadata(this.title, context, value);
        const color = await evaluateMetadata(this.color, context, value);
        return new NumberWidget(title, url, value, color);
    }
}
exports.QueryNumberWidget = QueryNumberWidget;
// A widget that runs a script and displays the number of returned
// items as a numeric value
class ScriptNumberWidget extends Widget {
    constructor(title, url, script, color) {
        super(title, url);
        this.script = script;
        this.color = color;
    }
    async evaluate(context) {
        let result = await evaluate_1.Evaluate.runScript(this.script, context);
        let value;
        let title = null;
        let url = null;
        let color = null;
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
        if (title == null) {
            title = await evaluateMetadata(this.title, context, value);
        }
        if (url == null) {
            url = await evaluateMetadata(this.url, context, value);
        }
        if (color == null) {
            color = await evaluateMetadata(this.color, context, value);
        }
        return new NumberWidget(title, url, result, color);
    }
}
exports.ScriptNumberWidget = ScriptNumberWidget;
// A widget that has an expression that will evaluate to a string value
class StringWidget extends Widget {
    constructor(title, url, value, align, color) {
        super(title, url);
        this.value = value;
        this.align = align;
        this.color = color;
    }
    async evaluate(context) {
        let value = await evaluate_1.Evaluate.parseExpression(this.value, context);
        const title = await evaluateMetadata(this.title, context, value);
        const url = await evaluateMetadata(this.url, context, value);
        const align = await evaluateMetadata(this.align, context, value);
        const color = await evaluateMetadata(this.color, context, value);
        return new StringWidget(title, url, value, align, color);
    }
}
exports.StringWidget = StringWidget;
// A widget that runs a script and displays the string returned
class ScriptStringWidget extends Widget {
    constructor(title, url, script, align, color) {
        super(title, url);
        this.script = script;
        this.align = align;
        this.color = color;
    }
    async evaluate(context) {
        let result = await evaluate_1.Evaluate.runScript(this.script, context);
        let value;
        let title = null;
        let url = null;
        let align = null;
        let color = null;
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
        if (title == null) {
            title = await evaluateMetadata(this.title, context, value);
        }
        if (url == null) {
            url = await evaluateMetadata(this.url, context, value);
        }
        if (align == null) {
            align = await evaluateMetadata(this.align, context, value);
        }
        if (color == null) {
            color = await evaluateMetadata(this.color, context, value);
        }
        return new StringWidget(title, url, result, align, color);
    }
}
exports.ScriptStringWidget = ScriptStringWidget;
// A widget that displays multiple numeric values against each other,
// usually in a bar graph.  This actually is composed of other widgets;
// namely `NumberWidget`s (or things that derive from it, like a
// `QueryNumberWidget`s) to store the data.
class GraphWidget extends Widget {
    constructor(title, url, elements) {
        super(title, url);
        this.elements = elements ? elements : new Array();
    }
    async evaluate(context) {
        let elements = new Array();
        for (let element of this.elements) {
            let result = await element.evaluate(context);
            if (!(result instanceof NumberWidget)) {
                throw new Error('graph widget elements must be number widgets');
            }
            elements.push(result);
        }
        const title = await evaluateExpression(this.title, context);
        const url = await evaluateExpression(this.url, context);
        return new GraphWidget(title, url, elements);
    }
}
exports.GraphWidget = GraphWidget;
class TableWidget extends Widget {
    constructor(title, url, headers, elements) {
        super(title, url);
        this.headers = headers;
        this.elements = elements;
    }
    async evaluate(context) {
        let headers = new Array();
        let elements = new Array();
        for (let header of this.headers) {
            let result = await header.evaluate(context);
            if (!(result instanceof NumberWidget) && !(result instanceof StringWidget)) {
                throw new Error('table widget elements must be string or number widgets');
            }
            headers.push(result);
        }
        for (let row of this.elements) {
            let cells = new Array();
            for (let cell of row) {
                let result = await cell.evaluate(context);
                if (!(result instanceof NumberWidget) && !(result instanceof StringWidget)) {
                    throw new Error('table widget elements must be string or number widgets');
                }
                cells.push(result);
            }
            elements.push(cells);
        }
        const title = await evaluateExpression(this.title, context);
        const url = await evaluateExpression(this.url, context);
        return new TableWidget(title, url, headers, elements);
    }
}
exports.TableWidget = TableWidget;
class QueryTableWidget extends Widget {
    constructor(title, url, type, query, limit, fields) {
        super(title, url);
        this.type = type;
        this.query = query;
        this.limit = limit != null ? limit : QueryTableWidget.DEFAULT_LIMIT;
        this.fields = fields != null ? fields : QueryTableWidget.DEFAULT_FIELDS[type];
    }
    getHeaders() {
        const headers = new Array();
        for (let field of this.fields) {
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
    }
    static async evaluateItemValue(value, context, item) {
        const valuedContext = {
            github: context.github,
            item: item,
            userdata: context.userdata
        };
        return await evaluate_1.Evaluate.parseExpression(value, valuedContext);
    }
    async getRow(item, context) {
        const values = new Array();
        for (let field of this.fields) {
            if (field.value != null) {
                values.push(await QueryTableWidget.evaluateItemValue(field.value, context, item));
            }
            else {
                let property = (field.property != null) ? field.property : field.toString();
                values.push(item[property]);
            }
        }
        return values;
    }
    async evaluate(context) {
        let headers = new Array();
        let elements = new Array();
        let results = await evaluateQuery(this.type, this.query, this.limit, context);
        for (let header of this.getHeaders()) {
            headers.push(new StringWidget(null, null, header, null, null));
        }
        let item;
        for (item of results.items) {
            let row = new Array();
            for (let value of await this.getRow(item, context)) {
                row.push(new StringWidget(null, item.html_url, value, null, null));
            }
            elements.push(row);
        }
        const title = await evaluateExpression(this.title, context);
        const url = this.url != null ? await evaluateExpression(this.url, context) : results.url;
        return new TableWidget(title, url, headers, elements);
    }
}
exports.QueryTableWidget = QueryTableWidget;
QueryTableWidget.DEFAULT_FIELDS = {
    [0 /* Issue */]: [
        { title: 'Issue', property: 'number' },
        { title: 'Title', property: 'title' }
    ]
};
QueryTableWidget.DEFAULT_LIMIT = 10;
// A `Section` contains one or more widgets
class Section {
    constructor(title, description, widgets) {
        this.title = title;
        this.description = description;
        this.widgets = widgets;
    }
    async evaluate(context) {
        const evaluated = new Array();
        for (let widget of this.widgets) {
            evaluated.push(await widget.evaluate(context));
        }
        const title = this.title ? await evaluate_1.Evaluate.parseExpression(this.title, context) : null;
        const description = this.description ? await evaluate_1.Evaluate.parseExpression(this.description, context) : null;
        return new Section(title, description, evaluated);
    }
}
exports.Section = Section;
class Analytics {
    constructor(title, description, sections, setup, shutdown) {
        this.title = title;
        this.description = description;
        this.sections = sections;
        this.setup = setup;
        this.shutdown = shutdown;
    }
    static async evaluate(config, github) {
        const context = { 'github': github, 'querycache': {}, 'userdata': {} };
        const evaluated = new Array();
        if (config.setup != null) {
            await evaluate_1.Evaluate.runScript(config.setup, context);
        }
        for (let section of config.sections) {
            evaluated.push(await section.evaluate(context));
        }
        const title = await evaluateExpression(config.title, context);
        const description = await evaluateExpression(config.description, context);
        if (config.shutdown != null) {
            await evaluate_1.Evaluate.runScript(config.shutdown, context);
        }
        return new Analytics(title, description, evaluated, null, null);
    }
}
exports.Analytics = Analytics;
"use strict";
// A configuration is an `Analytics` structure of its own.  It will take
// the YAML configuration and parse it into an `AnalyticsConfig`.  This
// will contain the literal definition from the configuration itself.
// By running the `evaluate` on the `Analytics`, it will take the input,
// including any queries, and execute them to produce a static `Analytics`
// structure with the actual values.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const analytics_1 = require("./analytics");
const yaml = __importStar(require("js-yaml"));
const fs = __importStar(require("fs"));
function configError(context, message) {
    const location = context ? ` for ${context}` : '';
    throw new Error(`config: invalid configuration${location}: ${message}`);
}
function configValue(config, context, key, required = false) {
    if (!(key in config) && required) {
        configError(context, `missing required option '${key}'`);
    }
    let value = config[key];
    delete config[key];
    return value;
}
function ensureConfigEmpty(config, context) {
    var remaining = Object.keys(config);
    if (remaining.length != 0) {
        configError(context, `unexpected option '${remaining[0]}'`);
    }
}
function keyList(keys, andor) {
    let result = new Array();
    for (let i = 0; i < keys.length; i++) {
        if (i == keys.length - 1) {
            result.push(` ${andor} `);
        }
        else if (i > 0) {
            result.push(', ');
        }
        result.push(`'${keys[i]}'`);
    }
    return result.join('');
}
function ensureOneConfigKey(config, context, keys) {
    let found = new Array();
    for (let key of keys) {
        if (key in config) {
            found.push(key);
        }
    }
    if (found.length == 0) {
        configError(context, `expected one of: ${keyList(keys, 'or')}`);
    }
    if (found.length > 1) {
        configError(context, `expected only one of: ${keyList(found, 'or')}`);
    }
}
class AnalyticsConfig extends analytics_1.Analytics {
    constructor(title, description, sections, output, setup, shutdown) {
        super(title, description, sections, setup, shutdown);
        this.output = output;
    }
    static loadStringWidget(config) {
        let widget;
        if (typeof config == 'string') {
            config = { value: config };
        }
        ensureOneConfigKey(config, 'string widget', ['value', 'script']);
        let title = configValue(config, 'string widget', 'title');
        let url = configValue(config, 'string widget', 'url');
        let color = configValue(config, 'string widget', 'color');
        let align = configValue(config, 'string widget', 'align');
        let value = configValue(config, 'string widget', 'value');
        let script = configValue(config, 'string widget', 'script');
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
    }
    static loadNumberWidget(config) {
        let widget;
        ensureOneConfigKey(config, 'number widget', ['issue_query', 'value', 'script']);
        let title = configValue(config, 'number widget', 'title');
        let url = configValue(config, 'number widget', 'url');
        let color = configValue(config, 'number widget', 'color');
        let value = configValue(config, 'number widget', 'value');
        let script = configValue(config, 'number widget', 'script');
        let query = configValue(config, 'number widget', 'issue_query');
        let query_type = 0 /* Issue */;
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
    }
    static loadGraphWidget(config) {
        let widgets = new Array();
        let title = configValue(config, 'graph widget', 'title');
        let url = configValue(config, 'graph widget', 'url');
        let elements = configValue(config, 'graph widget', 'elements', true);
        for (let element of elements) {
            ensureOneConfigKey(element, 'graph widget element', ['issue_query', 'value']);
            let title = configValue(element, 'graph widget element', 'title');
            let url = configValue(element, 'graph widget element', 'url');
            let color = configValue(element, 'graph widget element', 'color');
            let query = configValue(element, 'graph widget element', 'issue_query');
            let query_type = 0 /* Issue */;
            let value = configValue(element, 'graph widget element', 'value');
            if (query != null) {
                widgets.push(new analytics_1.QueryNumberWidget(title, url, query_type, query, color));
            }
            else if (value != null) {
                widgets.push(new analytics_1.NumberWidget(title, url, value, color));
            }
            ensureConfigEmpty(element, 'graph widget element');
        }
        ensureConfigEmpty(config, 'graph widget');
        return new analytics_1.GraphWidget(title, url, widgets);
    }
    static loadQueryTableWidget(config) {
        let title = configValue(config, 'table widget', 'title');
        let url = configValue(config, 'table widget', 'url');
        let fields = configValue(config, 'table widget', 'fields');
        let query = configValue(config, 'table widget', 'issue_query', true);
        let limit = configValue(config, 'table widget', 'limit');
        let query_type = 0 /* Issue */;
        if (fields != null && !Array.isArray(fields)) {
            configError('table widget', `'fields' is not an array`);
        }
        return new analytics_1.QueryTableWidget(title, url, query_type, query, limit, fields);
    }
    static loadStaticTableWidget(config) {
        const headers = new Array();
        const elements = new Array();
        let title = configValue(config, 'table widget', 'title');
        let url = configValue(config, 'table widget', 'url');
        let headerConfig = configValue(config, 'table widget', 'headers');
        let elementsConfig = configValue(config, 'table widget', 'elements', true);
        if (headerConfig != null && Array.isArray(headerConfig)) {
            for (let header of headerConfig) {
                headers.push(AnalyticsConfig.loadStringWidget(header));
            }
        }
        else if (headerConfig != null) {
            headers.push(AnalyticsConfig.loadStringWidget(headerConfig));
        }
        if (elementsConfig != null && !Array.isArray(elementsConfig)) {
            configError('table widget', `'elements' is not an array`);
        }
        for (let elementList of elementsConfig) {
            if (Array.isArray(elementList)) {
                let row = new Array();
                for (let element of elementList) {
                    row.push(AnalyticsConfig.loadStringWidget(element));
                }
                elements.push(row);
            }
            else {
                elements.push([AnalyticsConfig.loadStringWidget(elementList)]);
            }
        }
        return new analytics_1.TableWidget(title, url, headers, elements);
    }
    static loadTableWidget(config) {
        let widget;
        ensureOneConfigKey(config, 'table widget', ['issue_query', 'elements']);
        if (config.issue_query != null) {
            widget = AnalyticsConfig.loadQueryTableWidget(config);
        }
        else {
            widget = AnalyticsConfig.loadStaticTableWidget(config);
        }
        ensureConfigEmpty(config, 'table widget');
        return widget;
    }
    static loadWidget(config) {
        let widget;
        let type = configValue(config, 'widget', 'type', true);
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
            configError('widget', `invalid type '${type}'`);
        }
        ensureConfigEmpty(config, 'widget');
        return widget;
    }
    static loadSection(config) {
        const widgets = new Array();
        let title = configValue(config, 'section', 'title');
        let description = configValue(config, 'section', 'description');
        let widgetConfig = configValue(config, 'section', 'widgets');
        if (widgetConfig != null) {
            if (!Array.isArray(widgetConfig)) {
                configError('section', `'widgets' is not an array`);
            }
            for (let wc of widgetConfig) {
                widgets.push(AnalyticsConfig.loadWidget(wc));
            }
        }
        ensureConfigEmpty(config, 'section');
        return new analytics_1.Section(title, description, widgets);
    }
    static loadOutput(config) {
        let output = {};
        if (!('format' in config)) {
            throw new Error(`config: 'output.format' is not defined`);
        }
        for (let key in config) {
            output[key] = config[key];
        }
        return output;
    }
    static load(config) {
        const sections = new Array();
        let title = configValue(config, null, 'title');
        let description = configValue(config, null, 'description');
        let setup = configValue(config, null, 'setup');
        let shutdown = configValue(config, null, 'shutdown');
        let outputConfig = configValue(config, null, 'output', true);
        let sectionConfig = configValue(config, null, 'sections');
        if (sectionConfig != null) {
            if (!Array.isArray(sectionConfig)) {
                configError(null, `'sections' is not an array`);
            }
            for (let section of sectionConfig) {
                sections.push(AnalyticsConfig.loadSection(section));
            }
        }
        let output = AnalyticsConfig.loadOutput(outputConfig);
        ensureConfigEmpty(config, null);
        return new AnalyticsConfig(title, description, sections, output, setup, shutdown);
    }
    static fromJson(config) {
        return AnalyticsConfig.load(JSON.parse(config));
    }
    static fromYaml(config) {
        return AnalyticsConfig.load(yaml.safeLoad(config));
    }
    static from(config) {
        let ConfigFormat;
        (function (ConfigFormat) {
            ConfigFormat[ConfigFormat["JSON"] = 0] = "JSON";
            ConfigFormat[ConfigFormat["YAML"] = 1] = "YAML";
        })(ConfigFormat || (ConfigFormat = {}));
        let format;
        let input;
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
    }
}
exports.AnalyticsConfig = AnalyticsConfig;
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat"));
function parse(input = '') {
    dayjs_1.default.extend(utc_1.default);
    dayjs_1.default.extend(customParseFormat_1.default);
    let value;
    let match;
    let currentDate = false;
    input = input.toString().replace(/^\s+/, '');
    if (match = input.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})Z/)) {
        value = dayjs_1.default(match[0]);
        input = input.substring(match[0].length);
    }
    else if (match = input.match(/^(\d{4}-\d{2}-\d{2})/)) {
        value = dayjs_1.default(`${match[0]} -0000`, 'YYYY-MM-DD Z');
        input = input.substring(match[0].length);
    }
    else if (match = input.match(/^(\d{2}):(\d{2}):(\d{2})/)) {
        value = dayjs_1.default();
        value = value.utc().hour(+match[1]);
        value = value.utc().minute(+match[2]);
        value = value.utc().second(+match[3]);
        input = input.substring(match[0].length);
    }
    else {
        value = dayjs_1.default();
        currentDate = true;
    }
    while (input.length > 0) {
        let operator;
        input = input.replace(/^\s+/, '');
        if (match = input.match(/^([+-])\s*/)) {
            operator = match[1];
            input = input.substring(match[0].length);
        }
        else if (currentDate != null) {
            // if no date was specified, users don't need a starting operator
            operator = '+';
            currentDate = false;
        }
        else {
            throw new Error(`operator expected, got '${input}'`);
        }
        let operation = (operator == '-') ?
            (d, v, u) => d.utc().subtract(v, u) :
            (d, v, u) => d.utc().add(v, u);
        if (match = input.match(/^([\d]+)\s*(year|month|day|hour|minute|second)(s?)\s*/)) {
            input = input.substring(match[0].length);
            value = operation(value, +match[1], match[2]);
        }
        else if (match = input.match(/^(\d{2}):(\d{2}):(\d{2})\s*/)) {
            input = input.substring(match[0].length);
            value = operation(value, +match[1], 'hours');
            value = operation(value, +match[2], 'minutes');
            value = operation(value, +match[3], 'seconds');
        }
        else {
            throw new Error(`date adjustment expected, got '${input}'`);
        }
    }
    return value.utc();
}
function date(input = undefined) {
    return parse(input).format('YYYY-MM-DD');
}
exports.date = date;
function time(input = undefined) {
    return parse(input).format('HH:mm:ss');
}
exports.time = time;
function datetime(input = undefined) {
    return parse(input).format();
}
exports.datetime = datetime;
"use strict";
// A mechanism for evaluating user-provided strings or scripts.  For
// strings, this will take user input and parse anything within
// double curly-braces (`{{ }}`) as eval-able JavaScript.  Several
// helper functions (like `date()`, `time()`, etc) will be provided.
// Users can provide additional data that will be given to the
// functions.
Object.defineProperty(exports, "__esModule", { value: true });
const date_1 = require("./date");
class Evaluate {
    static invokeAsyncFunction(source, args) {
        const asyncFn = Object.getPrototypeOf(async () => { }).constructor;
        const fn = new asyncFn(...Object.keys(args), source);
        return fn(...Object.values(args));
    }
    static createArgs(additional = null) {
        let args = {
            date: date_1.date,
            time: date_1.time,
            datetime: date_1.datetime
        };
        for (let key in additional) {
            if (key in args) {
                throw new Error(`cannot redefine evaluation global '${key}'`);
            }
            args[key] = additional[key];
        }
        return args;
    }
    static async runScript(input, additional = null) {
        const args = Evaluate.createArgs(additional);
        return await Evaluate.invokeAsyncFunction(input, args);
    }
    static async parseExpression(raw, additional = null) {
        const args = Evaluate.createArgs(additional);
        const search = new RegExp('{{(.*?)}}', 'g');
        let match;
        let output = new Array();
        let last = 0;
        while (match = search.exec(raw)) {
            if (match.index > 0) {
                output.push(raw.substring(last, match.index));
            }
            output.push(await Evaluate.invokeAsyncFunction(`return (async () => ${match[1]})()`, args));
            last = search.lastIndex;
        }
        if (last < raw.length) {
            output.push(raw.substring(last, raw.length));
        }
        return output.join('');
    }
}
exports.Evaluate = Evaluate;
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github_1 = require("@actions/github");
const config_1 = require("./config");
const analytics_1 = require("./analytics");
const render_1 = require("./render");
async function run() {
    try {
        const token = core.getInput('token') || process.env.GITHUB_TOKEN || '';
        const github = new github_1.GitHub(token);
        const config = config_1.AnalyticsConfig.from(core.getInput('config', { required: true }));
        const renderer = render_1.Renderer.fromConfig(config);
        const result = await analytics_1.Analytics.evaluate(config, github);
        renderer.render(result);
    }
    catch (err) {
        core.setFailed(err.message);
    }
}
run();
"use strict";
// A renderer takes an `Analytics` structure and emits it as data.
Object.defineProperty(exports, "__esModule", { value: true });
const render_html_1 = require("./render_html");
const render_markdown_1 = require("./render_markdown");
class Renderer {
    static fromConfig(config) {
        if (config.output == null) {
            throw new Error(`config: 'output' is not defined`);
        }
        if (config.output.format == null) {
            throw new Error(`config: 'output.format' is not defined`);
        }
        if (config.output.format == 'markdown') {
            return new render_markdown_1.MarkdownRenderer(config);
        }
        else if (config.output.format == 'html') {
            return new render_html_1.HtmlRenderer(config);
        }
        else {
            throw new Error(`config: unknown output format type '${config.output.format}'`);
        }
    }
}
exports.Renderer = Renderer;
"use strict";
// An HTML renderer takes an `Analytics` structure and emits the output
// as HTML.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const analytics_1 = require("./analytics");
const fs = __importStar(require("fs"));
function createAnchor(title) {
    return title.replace(/ /g, '-').replace(/[^A-Za-z0-9_\-]/g, '').toLowerCase();
}
class HtmlRenderer {
    constructor(config) {
        if (config == null || config.output == null) {
            throw new Error('invalid configuration for html renderer');
        }
        let htmlconfig = config.output;
        if (htmlconfig.format == null || htmlconfig.format != 'html') {
            throw new Error(`config: 'output.format' expected as 'html'`);
        }
        if (htmlconfig.filename == null) {
            throw new Error(`config: 'output.filename' is not defined`);
        }
        this.config = htmlconfig;
    }
    static renderStartNumberWidgets() {
        return `<div class="number_widgets">`;
    }
    static renderFinishNumberWidgets() {
        return `</div> <!-- number_widgets -->`;
    }
    static renderNumberWidget(widget) {
        let out = new Array();
        if (widget.title != null) {
            out.push(`<a name="${createAnchor(widget.title)}"></a>`);
        }
        if (widget.url != null) {
            out.push(`<a href="${widget.url}">`);
        }
        out.push(`<div class="number_widget${widget.color ? ' ' + widget.color : ''}">`);
        if (widget.title != null) {
            out.push(`<span class="title">${widget.title}</span>`);
        }
        if (widget.value != null) {
            out.push(`<span class="value">${widget.value}</span>`);
        }
        out.push(`</div>`);
        if (widget.url != null) {
            out.push(`</a>`);
        }
        return out.join('\n');
    }
    static renderStringWidget(widget) {
        let out = new Array();
        if (widget.title != null) {
            out.push(`<a name="${createAnchor(widget.title)}"></a>`);
        }
        if (widget.url != null) {
            out.push(`<a href="${widget.url}">`);
        }
        out.push(`<div class="string_widget${widget.color ? ' ' + widget.color : ''}">`);
        if (widget.title != null) {
            out.push(`<h3 class="title">${widget.title}</h3>`);
        }
        if (widget.value != null) {
            out.push(`<span class="value">${widget.value}</span>`);
        }
        out.push(`</div> <!-- string_widget -->`);
        if (widget.url != null) {
            out.push(`</a>`);
        }
        return out.join('\n');
    }
    static renderGraphWidget(widget) {
        let html = new Array();
        let min = 0;
        let max = 0;
        for (let element of widget.elements) {
            if (!(element instanceof analytics_1.NumberWidget)) {
                throw new Error(`GraphWidget element did not evaluate to a NumberWidget (is a ${widget.constructor.name})`);
            }
            let num = element;
            if (typeof num.value != 'number') {
                throw new Error(`GraphWidget element did not evaluate to a static number (is a ${typeof num.value})`);
            }
            let value = num.value;
            if (value > max) {
                max = num.value;
            }
        }
        html.push(`<div class="graph_widget">`);
        if (widget.title != null) {
            const linkedTitle = widget.url ? `<a href="${widget.url}">${widget.title}</a>` : widget.title;
            html.push(`<a name="${createAnchor(widget.title)}"></a>`);
            html.push(`<h3 class="graph_title">${linkedTitle}</h3>`);
        }
        html.push(`<div class="graph">`);
        for (let element of widget.elements) {
            let num = element;
            let value = num.value;
            let scaled = (max > 0) ? Math.floor((value / max) * 100) : 0;
            html.push(`<div class="graph_item${num.color ? ' ' + num.color : ''}">`);
            html.push(`<span class="graph_item_title">`);
            if (num.title != null) {
                if (num.url != null) {
                    html.push(`<a href="${num.url}">`);
                }
                html.push(`<span class="title">${num.title}</span>`);
                if (num.url != null) {
                    html.push(`</a>`);
                }
            }
            html.push(`</span>`);
            html.push(`<span class="graph_item_value">`);
            if (num.url != null) {
                html.push(`<a href="${num.url}">`);
            }
            let value_class = (scaled > 0) ? 'value' : 'value empty_value';
            let value_display = (scaled >= 5) ? value : '';
            html.push(`<span class="${value_class}" style="width: ${scaled}%;">${value_display}</span>`);
            if (num.url != null) {
                html.push(`</a>`);
            }
            html.push(`</span>`);
            html.push(`</div>`);
        }
        html.push(`</div>`);
        html.push(`</div>`);
        return html.join('\n');
    }
    static renderTableCell(type, cell) {
        let html = new Array();
        if (!(cell instanceof analytics_1.NumberWidget) && !(cell instanceof analytics_1.StringWidget)) {
            throw new Error(`TableWidget header cell did not evaluate to a static value (is a ${typeof cell})`);
        }
        let value = cell.value;
        let color = cell.color;
        let url = cell.url;
        let align = null;
        if (cell instanceof analytics_1.StringWidget) {
            align = cell.align;
        }
        align = align != null ? ` style="text-align: ${align}"` : '';
        color = color != null ? ` class="${color}"` : '';
        html.push(`<${type}${color}${align}>`);
        if (url != null) {
            html.push(`<a href="${url}">`);
        }
        html.push(`${value}`);
        if (url != null) {
            html.push(`</a>`);
        }
        html.push(`</${type}>`);
        return html.join('');
    }
    static renderTableWidget(widget) {
        let html = new Array();
        html.push(`<div class="table_widget">`);
        if (widget.title != null) {
            const linkedTitle = widget.url ? `<a href="${widget.url}">${widget.title}</a>` : widget.title;
            html.push(`<a name="${createAnchor(widget.title)}"></a>`);
            html.push(`<h3 class="table_title">${linkedTitle}</h3>`);
        }
        html.push(`<table class="table">`);
        if (widget.headers != null && widget.headers.length > 0) {
            html.push(`<tr class="table_header">`);
            for (let cell of widget.headers) {
                html.push(HtmlRenderer.renderTableCell('th', cell));
            }
            html.push(`</tr>`);
        }
        for (let row of widget.elements) {
            html.push(`<tr class="table_element">`);
            for (let cell of row) {
                html.push(HtmlRenderer.renderTableCell('td', cell));
            }
            html.push(`</tr>`);
        }
        html.push(`</table>`);
        html.push(`</div>`);
        return html.join('\n');
    }
    static renderAnalytics(analytics) {
        let html = new Array();
        html.push(`
<html>
<head>
<title>${analytics.title ? analytics.title : 'Dashboard'}</title>
<link rel="stylesheet" href="dashboard.css" type="text/css" media="all">
<script src="dashboard.js"></script>
</head>
<body>
<div id="analytics">
`);
        if (analytics.title != null) {
            html.push(`<h1>${analytics.title}</h1>`);
            html.push('');
        }
        if (analytics.description != null) {
            html.push(`<div id="main_description" class="description">`);
            html.push(analytics.description);
            html.push(`</div>`);
            html.push('');
        }
        html.push(`<div class="sections">`);
        for (let section of analytics.sections) {
            html.push(`<div class="section">`);
            html.push(`<div class="section_metadata">`);
            if (section.title != null) {
                html.push(`<a name="${createAnchor(section.title)}"></a>`);
                html.push(`<h2 class="section_title">${section.title}</h2>`);
                html.push('');
            }
            if (section.description != null) {
                html.push(`<div class="description">`);
                html.push(section.description);
                html.push(`</div>`);
                html.push('');
            }
            html.push(`</div> <!-- section_metadata -->`);
            html.push(`<div class="section_widgets">`);
            let showingNumberWidgets = false;
            for (let widget of section.widgets) {
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
                    throw new Error(`cannot render unknown widget type: ${widget.constructor.name}`);
                }
            }
            if (showingNumberWidgets) {
                html.push(HtmlRenderer.renderFinishNumberWidgets());
                showingNumberWidgets = false;
            }
            html.push(`</div> <!-- section_widgets -->`);
            html.push(`</div> <!-- section -->`);
        }
        html.push(`
</div> <!-- sections -->
<div id="footer">
Generated by <a href="https://github.com/ethomson/issue-dashboard" target="_blank" rel="noopener noreferrer">ethomson/issue-dashboard</a>
</div>
</div> <!-- analytics -->
</body>
</html>
`);
        return html.join('\n');
    }
    render(analytics) {
        fs.writeFileSync(this.config.filename, HtmlRenderer.renderAnalytics(analytics), 'utf8');
    }
}
exports.HtmlRenderer = HtmlRenderer;
"use strict";
// A markdown renderer takes an `Analytics` structure and emits the
// data as markdown.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const analytics_1 = require("./analytics");
const fs = __importStar(require("fs"));
class MarkdownRenderer {
    constructor(config) {
        if (config == null || config.output == null) {
            throw new Error('invalid configuration for markdown renderer');
        }
        let mdconfig = config.output;
        if (mdconfig.format == null || mdconfig.format != 'markdown') {
            throw new Error(`config: 'output.format' expected as 'markdown'`);
        }
        if (mdconfig.filename == null) {
            throw new Error(`config: 'output.filename' is not defined`);
        }
        this.config = mdconfig;
    }
    static renderColor(color) {
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
        throw new Error(`invalid color: ${color}`);
    }
    static renderNumberWidget(widget) {
        let value = widget.value;
        let color = widget.color;
        let out = value.toString();
        if (color != null) {
            out = `${MarkdownRenderer.renderColor(color)} ${out}`;
        }
        if (widget.url != null) {
            out = `[${out}](${widget.url})`;
        }
        return out;
    }
    static renderStringWidget(widget) {
        let value = widget.value;
        let color = widget.color;
        let md = new Array;
        if (widget.title != null) {
            md.push(`#### ${widget.title}\n`);
            md.push('\n');
        }
        if (widget.url != null) {
            md.push('[');
        }
        if (color != null) {
            md.push(`${MarkdownRenderer.renderColor(color)} `);
        }
        md.push(value);
        if (widget.url != null) {
            md.push(`](${widget.url})`);
        }
        md.push('\n');
        return md.join('');
    }
    static renderGraphWidget(widget) {
        // length of the bar (on-screen) at the largest value
        // TODO: account for the length of titles and values
        const BAR_LENGTH = 35;
        let md = new Array();
        let min = 0;
        let max = 0;
        for (let element of widget.elements) {
            if (!(element instanceof analytics_1.NumberWidget)) {
                throw new Error(`GraphWidget element did not evaluate to a NumberWidget (is a ${widget.constructor.name})`);
            }
            let num = element;
            if (typeof num.value != 'number') {
                throw new Error(`GraphWidget element did not evaluate to a static number (is a ${typeof num.value})`);
            }
            let value = num.value;
            if (value > max) {
                max = value;
            }
        }
        // TODO: scale this by accounting for the minimum value, to avoid
        // large numbers with little variance blowing out the graph
        let scale = (BAR_LENGTH / max);
        // To get the numbers left and right-aligned, add non-breaking space
        // between them.  A number is roughly the size of the block unicode
        // glyph, a non-breaking space is roughly n times those glyphs
        let spacerlen = Math.floor((BAR_LENGTH - (min.toString().length - max.toString().length)) * 3.75);
        let spacer = '&nbsp;'.repeat(spacerlen);
        if (widget.title) {
            md.push(`#### ${widget.title}`);
            md.push('');
        }
        md.push(`| ${widget.title ? widget.title : ''} |  | ${min}${spacer}${max} |`);
        md.push(`|:------------------------------------|-:|:-------|`);
        for (let element of widget.elements) {
            let num = element;
            let value = num.value;
            let bar = '█'.repeat(value * scale);
            md.push(`| ${num.title ? num.title : ''} | ${MarkdownRenderer.renderNumberWidget(num)} | ${bar} |`);
        }
        md.push('');
        return md.join('\n');
    }
    static renderTableCell(widget) {
        if (!(widget instanceof analytics_1.NumberWidget) && !(widget instanceof analytics_1.StringWidget)) {
            throw new Error(`TableWidget header cell did not evaluate to a static value (is a ${typeof widget})`);
        }
        let value = widget.value;
        let color = widget.color;
        let out = value.toString();
        if (color != null) {
            out = `${MarkdownRenderer.renderColor(color)} ${out}`;
        }
        if (widget.url != null) {
            out = `[${out}](${widget.url})`;
        }
        return out;
    }
    static renderTableWidget(widget) {
        let md = new Array();
        let line;
        let columns = (widget.headers != null) ? widget.headers.length : 0;
        // Find the maximum number of columns
        for (let row of widget.elements) {
            if (row.length > columns) {
                columns = row.length;
            }
        }
        if (columns == 0) {
            return '';
        }
        if (widget.title) {
            md.push(`#### ${widget.title}`);
            md.push('');
        }
        // Draw header
        line = new Array();
        line.push('|');
        for (let i = 0; i < columns; i++) {
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
        for (let i = 0; i < columns; i++) {
            let align = (widget.headers != null && i < widget.headers.length && widget.headers[i] instanceof analytics_1.StringWidget) ? widget.headers[i].align : null;
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
        for (let row of widget.elements) {
            line = new Array();
            line.push('|');
            for (let i = 0; i < columns; i++) {
                line.push(' ');
                line.push(MarkdownRenderer.renderTableCell(row[i]));
                line.push(' |');
            }
            md.push(line.join(''));
        }
        return md.join('\n');
    }
    static renderAnalytics(analytics) {
        let md = new Array();
        if (analytics.title != null) {
            md.push(`# ${analytics.title}`);
            md.push('');
        }
        if (analytics.description != null) {
            md.push(analytics.description);
            md.push('');
        }
        for (let section of analytics.sections) {
            if (section.title != null) {
                md.push(`## ${section.title}`);
                md.push('');
            }
            if (section.description != null) {
                md.push(section.description);
                md.push('');
            }
            let showingNumberWidgets = false;
            for (let widget of section.widgets) {
                if (widget instanceof analytics_1.NumberWidget) {
                    // Group the number widgets together
                    if (!showingNumberWidgets) {
                        md.push('| Query |  |');
                        md.push('|:------|-:|');
                        showingNumberWidgets = true;
                    }
                    md.push(`| ${widget.title ? widget.title : ''} | ${MarkdownRenderer.renderNumberWidget(widget)} |`);
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
                    throw new Error(`cannot render unknown widget type: ${widget.constructor.name}`);
                }
            }
        }
        md.push('');
        return md.join('\n');
    }
    render(analytics) {
        fs.writeFileSync(this.config.filename, MarkdownRenderer.renderAnalytics(analytics), 'utf8');
    }
}
exports.MarkdownRenderer = MarkdownRenderer;
