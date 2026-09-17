import { parse } from '@marcbachmann/cel-js';

// Convert a CEL AST Node to a plain English string
function explainNode(node: any): string {
  if (!node) return '';

  // If it's a primitive value
  if (typeof node === 'string') {
    return `"${node}"`;
  }
  if (typeof node === 'number' || typeof node === 'boolean') {
    return node.toString();
  }

  const { op, args } = node;

  switch (op) {
    case 'value':
      return typeof args === 'string' ? `"${args}"` : args?.toString() || '';

    case 'id':
      // e.g. "variables", "request"
      return typeof args === 'string' ? args : explainNode(args);

    case '.':
      // Property access: args[0] is the object, args[1] is the property name
      if (Array.isArray(args) && args.length === 2) {
        const obj = explainNode(args[0]);
        const prop = typeof args[1] === 'string' ? args[1] : explainNode(args[1]);
        return `${obj}'s ${prop}`;
      }
      break;

    case '==':
    case '!=':
    case '>':
    case '>=':
    case '<':
    case '<=': {
      if (Array.isArray(args) && args.length === 2) {
        const left = explainNode(args[0]);
        const right = explainNode(args[1]);
        const opMap: Record<string, string> = {
          '==': 'is equal to',
          '!=': 'is not equal to',
          '>': 'is greater than',
          '>=': 'is greater than or equal to',
          '<': 'is less than',
          '<=': 'is less than or equal to',
        };
        return `${left} ${opMap[op]} ${right}`;
      }
      break;
    }

    case '&&':
    case '||': {
      if (Array.isArray(args) && args.length === 2) {
        const left = explainNode(args[0]);
        const right = explainNode(args[1]);
        const opStr = op === '&&' ? 'and' : 'or';
        return `(${left} ${opStr} ${right})`;
      }
      break;
    }

    case '!': {
      if (args) {
        return `not (${explainNode(args)})`;
      }
      break;
    }

    case 'in': {
      if (Array.isArray(args) && args.length === 2) {
        const item = explainNode(args[0]);
        const list = explainNode(args[1]);
        return `${item} is in ${list}`;
      }
      break;
    }

    case 'rcall': {
      // Receiver call e.g. variables.any(v, ...)
      // args = [methodName, receiverNode, [arg1, arg2, ...]]
      if (Array.isArray(args) && args.length === 3) {
        const methodName = args[0];
        const receiver = explainNode(args[1]);
        const methodArgs = Array.isArray(args[2]) ? args[2] : [args[2]];

        if (methodName === 'any' && methodArgs.length === 2) {
          const varName = explainNode(methodArgs[0]);
          const condition = explainNode(methodArgs[1]);
          return `any element ${varName} in ${receiver} satisfies: ${condition}`;
        }
        if (methodName === 'all' && methodArgs.length === 2) {
          const varName = explainNode(methodArgs[0]);
          const condition = explainNode(methodArgs[1]);
          return `all elements ${varName} in ${receiver} satisfy: ${condition}`;
        }
        if (methodName === 'exists' && methodArgs.length === 2) {
          const varName = explainNode(methodArgs[0]);
          const condition = explainNode(methodArgs[1]);
          return `there exists an element ${varName} in ${receiver} satisfying: ${condition}`;
        }
        if (methodName === 'has' && methodArgs.length === 1) {
          const prop = explainNode(methodArgs[0]);
          return `${receiver} has property ${prop}`;
        }

        const argsExplained = methodArgs.map((a: any) => explainNode(a)).join(', ');
        return `calling ${methodName} on ${receiver} with (${argsExplained})`;
      }
      break;
    }

    case 'call': {
      // e.g. has(variables.x)
      if (Array.isArray(args) && args.length === 2) {
        const methodName = args[0];
        const methodArgs = Array.isArray(args[1]) ? args[1] : [args[1]];
        if (methodName === 'has' && methodArgs.length === 1) {
          return `has ${explainNode(methodArgs[0])}`;
        }
        const argsExplained = methodArgs.map((a: any) => explainNode(a)).join(', ');
        return `function ${methodName} with (${argsExplained})`;
      }
      break;
    }

    case '[]': {
      // list literal
      if (Array.isArray(args)) {
        return `[${args.map((a: any) => explainNode(a)).join(', ')}]`;
      }
      break;
    }

    case '{}': {
      // map literal
      return 'a map/object';
    }

    default:
      if (typeof args === 'string') {
        return `${op} ${args}`;
      }
      return `[unsupported expression: ${op}]`;
  }

  return `[complex expression]`;
}

/**
 * Parses a CEL expression and translates it to a plain English sentence.
 */
export function explainCEL(celExpression: string): string {
  if (!celExpression) return '';
  try {
    const parsed = parse(celExpression);
    if (parsed && (parsed as any).ast) {
      const explanation = explainNode((parsed as any).ast);
      // capitalize first letter and ensure it makes some sense
      if (explanation) {
        return explanation.charAt(0).toUpperCase() + explanation.slice(1);
      }
    }
    return '';
  } catch (error) {
    console.error('Failed to parse CEL expression', error);
    // If it fails to parse (e.g. invalid syntax), we gracefully fall back
    return 'Could not generate explanation for this expression.';
  }
}
