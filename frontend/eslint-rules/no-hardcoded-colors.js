// Keep color choices in globals.css; components should use semantic Tailwind tokens.
const palette = new Set([
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber',
  'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
  'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]);

const colorUtility = /^(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|fill|stroke|from|via|to|outline|decoration|caret|accent|divide(?:-[xy])?|placeholder|shadow)-(.+)$/;
const paletteStep = /^(\w+)-(50|[1-9]00|950)(?:\/.+)?$/;
const literalColor = /^(?:#[\da-f]{3,8}|(?:rgba?|hsla?|hwb|lab|lch|oklch|oklab|color)\()/i;
const cssColorNames = new Set(['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'gray', 'grey', 'transparent']);
const classHelpers = new Set(['cn', 'cva', 'clsx', 'classNames', 'classnames', 'twMerge']);

function classTokens(value) {
  const tokens = [];
  let start = -1;
  let bracketDepth = 0;

  for (let index = 0; index <= value.length; index += 1) {
    const character = value[index];
    if (index === value.length || (/\s/.test(character) && bracketDepth === 0)) {
      if (start !== -1) tokens.push(value.slice(start, index));
      start = -1;
      continue;
    }
    if (start === -1) start = index;
    if (character === '[') bracketDepth += 1;
    if (character === ']') bracketDepth = Math.max(0, bracketDepth - 1);
  }

  return tokens;
}

function utilityWithoutVariants(token) {
  let bracketDepth = 0;
  let lastSeparator = -1;
  for (let index = 0; index < token.length; index += 1) {
    if (token[index] === '[') bracketDepth += 1;
    else if (token[index] === ']') bracketDepth -= 1;
    else if (token[index] === ':' && bracketDepth === 0) lastSeparator = index;
  }
  return token.slice(lastSeparator + 1).replace(/^[-!]/, '').replace(/!$/, '');
}

function isHardcodedColor(token) {
  const match = colorUtility.exec(utilityWithoutVariants(token));
  if (!match) return false;

  const value = match[1];
  if (/^(?:black|white)(?:\/.+)?$/.test(value)) return true;

  const paletteMatch = paletteStep.exec(value);
  if (paletteMatch && palette.has(paletteMatch[1])) return true;

  if (value.startsWith('[')) {
    const closingBracket = value.lastIndexOf(']');
    if (closingBracket === -1) return false;
    const arbitrary = value.slice(1, closingBracket).replace(/^color:/, '').trim();
    return literalColor.test(arbitrary) || (cssColorNames.has(arbitrary) && arbitrary !== 'transparent');
  }

  return false;
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Require semantic Tailwind color utilities in frontend components' },
    messages: {
      hardcodedColor: 'Use a semantic color utility instead of "{{className}}". Define the color in globals.css if needed.',
    },
    schema: [],
  },
  create(context) {
    const reported = new WeakSet();

    function checkString(value, node) {
      if (reported.has(node)) return;
      const violations = classTokens(value).filter(isHardcodedColor);
      if (violations.length === 0) return;
      reported.add(node);
      for (const className of violations) {
        context.report({ node, messageId: 'hardcodedColor', data: { className } });
      }
    }

    function inspect(node, objectKeysAreClasses = false) {
      if (!node) return;
      switch (node.type) {
        case 'Literal':
          if (typeof node.value === 'string') checkString(node.value, node);
          break;
        case 'TemplateLiteral':
          for (const quasi of node.quasis) checkString(quasi.value.cooked ?? quasi.value.raw, quasi);
          for (const expression of node.expressions) inspect(expression, objectKeysAreClasses);
          break;
        case 'ArrayExpression':
          for (const item of node.elements) inspect(item, objectKeysAreClasses);
          break;
        case 'ObjectExpression':
          for (const property of node.properties) {
            if (property.type === 'SpreadElement') {
              inspect(property.argument, objectKeysAreClasses);
              continue;
            }
            if (objectKeysAreClasses && !property.computed) inspect(property.key);
            inspect(property.value, objectKeysAreClasses);
          }
          break;
        case 'ConditionalExpression':
          inspect(node.consequent, objectKeysAreClasses);
          inspect(node.alternate, objectKeysAreClasses);
          break;
        case 'LogicalExpression':
          if (node.operator !== '&&') inspect(node.left, objectKeysAreClasses);
          inspect(node.right, objectKeysAreClasses);
          break;
        case 'CallExpression':
          for (const argument of node.arguments) inspect(argument, objectKeysAreClasses);
          break;
        case 'TSAsExpression':
        case 'TSSatisfiesExpression':
        case 'TSNonNullExpression':
        case 'TSTypeAssertion':
          inspect(node.expression, objectKeysAreClasses);
          break;
        default:
          break;
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;
        inspect(node.value?.type === 'JSXExpressionContainer' ? node.value.expression : node.value, true);
      },
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || !classHelpers.has(node.callee.name)) return;
        const objectKeysAreClasses = node.callee.name !== 'cva';
        for (const argument of node.arguments) inspect(argument, objectKeysAreClasses);
      },
      Property(node) {
        if (!node.computed && (node.key.name === 'className' || node.key.value === 'className')) {
          inspect(node.value, true);
        }
      },
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier' && /^(?:className|classNames|classes|\w+Classes)$/.test(node.id.name)) {
          inspect(node.init, true);
        }
      },
    };
  },
};
