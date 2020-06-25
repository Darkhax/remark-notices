const NEWLINE = "\n";
const TAG = ":::";
const NAME = "notice";

export default function attacher(options) {

    const Parser = this.Parser.prototype;
    Parser.blockTokenizers.notice = noticeTokenizer;

    insertAfter(Parser.blockMethods, "fencedCode", ["notice"]);
    insertAfter(Parser.interruptParagraph, "fencedCode", ["notice"]);
    insertAfter(Parser.interruptList, "fencedCode", ["notice"]);
    insertAfter(Parser.interruptBlockquote, "fencedCode", ["notice"]);
};

/**
 * Attempts to read the keyword and title from the first line of an input.
 * @param {String} value The markdown string to parse through.
 * 
 * @returns {Array<String>} Returns null if the input was not valid. Otherwise an array of two strings
 * will be returned. The first string is the keyword used, the second string is the optional user 
 * defined title.
 */
function parseMeta(value) {

    if (value.startsWith(TAG)) {

        // Get the first line of the value.
        const opening = value.substring(TAG.length, value.indexOf(NEWLINE));
        const deliminator = opening.indexOf(' ');
        var keyword = opening.substring(0, deliminator > -1 ? deliminator : opening.length);
        return [keyword, deliminator > -1 ? opening.substring(deliminator) : capitalizeString(keyword)];
    }

    return null;
}

/**
 * A tokenizer for notice blocks.
 * @param {function} eat Used to consume parts of the input as we traverse it.
 * @param {String} value The value to tokenize.
 * @param {Boolean} silent Whether or not we are allowed to act on the input value.
 */
function noticeTokenizer(eat, value, silent) {

    const meta = parseMeta(value);
    if (!meta || !meta[0]) return false; // Meta could not be parsed, this value is not for us.
    if (silent) return true; // Meta can be found but we can't act on it.

    // Get the current position in the document.
    const now = eat.now();

    // Calculate content positions using indexes of known constants.
    const contentStart = value.indexOf(NEWLINE) + NEWLINE.length;
    const contentEnd = value.indexOf(NEWLINE + TAG, contentStart);
    const content = value.substring(contentStart, contentEnd);
    const toConsume = value.substring(0, value.indexOf(NEWLINE, contentEnd + 1));

    // Consumes everything from the start of the document to the closing tag.
    const add = eat(toConsume);

    // Create node for the content.
    const contentNode = makeNode("div", `${NAME}-content`, this.tokenizeBlock(content, now));
    const titleNode = this.tokenizeInline(meta[1], now);

    const noticeNode = makeNode("div", [NAME, `${NAME}-${meta[0]}`],
        [
            makeNode("div", `${NAME}-heading`, [
                makeNode("h5", "", titleNode)
            ]),
            contentNode
        ]
    );

    return add(noticeNode);
}

/**
 * Capitalizes the first character of a string.
 * @param {String} input The input string to capitalize.
 * @returns {String} The capitalized version of the input string.
 */
function capitalizeString(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}

/**
 * Inserts an element after another target element within an array.
 * @param {Array<*>} array The array to insert into.
 * @param {*} target The entry to insert after.
 * @param {*} input The entry to insert.
 */
function insertAfter(array, target, input) {
    return array.splice(array.indexOf(target) + 1, 0, input);
}

/**
 * Creates a new HTML node.
 * @param {String} name The name of the tag.
 * @param {Array<String>} classes An optional array of class names for the element.
 * @param {Array<Node>} children An optional array of child nodes.
 */
function makeNode(name, classes = [], children = []) {
    return {
        type: `${NAME}HTML`,
        data: {
            hName: name,
            hProperties: classes.length ? { className: classes } : {}
        },
        children
    }
}