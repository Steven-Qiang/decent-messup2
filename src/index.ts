import { parse, ParserOptions } from '@babel/parser';
import { default as generate, GeneratorOptions } from '@babel/generator';
import { NodePath, default as traverse } from '@babel/traverse';
import template from '@babel/template';
import * as t from '@babel/types';
import { MinifyOptions, minify } from 'terser';
import { getRandomIndex, shuffle, transformCode } from './utils';

interface Options {
  // The count of string variables in each function scope.
  stringVariableCounts?: number;
  // The options of terser.
  minifyOptions?: MinifyOptions | null;
  // The options of @babel/parser.
  parserOptions?: ParserOptions;
  // The options of @babel/generator.
  generatorOptions?: GeneratorOptions;
}

export default async function messUp(code: string, options: Options = {}) {
  const {
    stringVariableCounts = 3,
    minifyOptions = {},
    generatorOptions,
    parserOptions = {
      sourceType: 'module',
    },
  } = options;

  let _code: string | null | undefined;
  try {
    _code = await transformCode(code);
    if (!_code) throw new Error('Transformed code is empty or undefined.');
  } catch (error: any) {
    throw new Error(`Error during code transformation: ${error.message}`);
  }

  let ast: t.Node;
  try {
    ast = parse(_code, parserOptions);
  } catch (error: any) {
    throw new Error(`Error parsing code: ${error.message}`);
  }

  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const declareKeyword = 'var';

  const headerArray: {
    [x: string]: string;
    value: string;
  }[] = [];

  try {
    traverse(ast, {
      MemberExpression: {
        enter(path) {
          if (t.isIdentifier(path.node.property) && !path.node.computed) {
            path.set('computed', true);
            path.get('property').replaceWith(t.stringLiteral(path.node.property.name));
          } else if (t.isMemberExpression(path.node) && path.node.property && path.node.property.type === 'StringLiteral') {
            // Handle specific case if needed
          }
        },
      },
    });

    traverse(ast, {
      ObjectProperty: {
        enter(path) {
          if (path.node.computed) {
            return;
          }
          path.node.computed = true;
          const key = path.node.key;
          if (key.type === 'StringLiteral') {
            // Handle specific case if needed
          } else if (key.type === 'Identifier') {
            // @ts-ignore
            key.type = 'StringLiteral';
            // @ts-ignore
            key.value = key.name;
          }
        },
      },
    });
  } catch (error: any) {
    throw new Error(`Error traversing AST (Step 1): ${error.message}`);
  }

  // Step 2: Get charset
  const charset: { [key: string]: boolean } = {};

  function addString(str: string) {
    str.split('').forEach(function (char: string) {
      charset[char] = true;
    });
  }

  try {
    traverse(ast, {
      StringLiteral(path) {
        addString(path.node.value);
      },
    });
  } catch (error: any) {
    throw new Error(`Error traversing AST (Step 2): ${error.message}`);
  }

  let charsetArray: string[] = [];
  for (const char in charset) {
    charsetArray.push(char);
  }

  for (let i = 0; i < stringVariableCounts; i++) {
    headerArray.push({
      value: shuffle(charsetArray).join(''),
    });
  }

  try {
    traverse(ast, {
      Program(path) {
        let templateCode = '';
        const decentMap: { [key: string]: string } = {};
        headerArray.forEach(function (header, index) {
          let code = header.value;
          code = code.replace(/\\/g, '\\\\');
          code = code.replace(/\n/g, '\\n');
          code = code.replace(/'/g, "\\'");
          const char = alphabet[index % alphabet.length];
          const name = path.scope.generateUidIdentifier(char).name;
          header.name = name;
          decentMap[name] = name;
          templateCode += `${declareKeyword} ${name}='${code}';`;
        });
        path.unshiftContainer('body', template(templateCode)({}));
        (path.node as any).decentMap = decentMap;
      },
    });
  } catch (error: any) {
    throw new Error(`Error traversing AST (Step 3): ${error.message}`);
  }

  // Step 3: Add declaration
  const functionDeclarationAndExpression = (path: NodePath<t.FunctionDeclaration> | NodePath<t.FunctionExpression>) => {
    let templateCode = '';
    shuffle(headerArray);
    const decentMap: { [key: string]: string } = {};
    headerArray.forEach(function (header, index) {
      const char = alphabet[index % alphabet.length];
      const name = path.scope.generateUidIdentifier(char).name;
      templateCode += `${declareKeyword} ${name}=${header.name};`;
      decentMap[header.name] = name;
    });
    (path.get('body') as NodePath<t.BlockStatement>).unshiftContainer('body', template(templateCode)({}));
    (path.node as any).decentMap = decentMap;
  };

  try {
    traverse(ast, {
      FunctionDeclaration: functionDeclarationAndExpression,
      FunctionExpression: functionDeclarationAndExpression,
    });
  } catch (error: any) {
    throw new Error(`Error traversing AST (Step 4): ${error.message}`);
  }

  // Step 4: Handle string
  let skipCount = stringVariableCounts;

  try {
    traverse(ast, {
      StringLiteral(path) {
        if (path.parent.type === 'ObjectProperty' && path.key === 'key') {
          return;
        }
        if (path.parent.type === 'ImportDeclaration') {
          // Not in import
          return;
        }
        if (path.parent.type === 'CallExpression' && (path.parent.callee as any).name === 'require') {
          // Not in require
          return;
        }
        const parent = path.findParent((path) => path.isFunctionDeclaration() || path.isProgram());
        const text = path.node.value;

        if (!text) {
          return;
        }

        if (skipCount) {
          skipCount--;
          return;
        }

        const decentMap: {
          [name: string]: string;
        } = (parent!.node as any).decentMap;

        const arr = text.split('').map(function (char) {
          const randomIndex = getRandomIndex(stringVariableCounts);
          let name = headerArray[randomIndex].name;
          name = decentMap[name];
          let index = headerArray[randomIndex].value.indexOf(char);
          return `${name}[${index}]`;
        });
        let t: t.Statement | t.Statement[] = template('(' + arr.join('+') + ')')({});
        if (Array.isArray(t)) {
          t = t[0];
        }
        path.replaceWith(t);
      },
    });
  } catch (error: any) {
    throw new Error(`Error traversing AST (Step 5): ${error.message}`);
  }

  let generatedCode = generate(ast, generatorOptions, code).code;
  if (minifyOptions) {
    try {
      generatedCode = (await minify(generatedCode, minifyOptions)).code!;
    } catch (error: any) {
      throw new Error(`Error minifying generated code: ${error.message}`);
    }
  }
  return generatedCode;
}
