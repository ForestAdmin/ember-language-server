import { Position, SourceLocation } from 'estree';
import { containsPosition } from './estree-utils';

type ScopeValue = [string, ASTPath, number];
const reLines = /(.*?(?:\r\n?|\n|$))/gm;

export function componentNameForPath(astPath: ASTPath) {
  if (isLocalScopedPathExpression(astPath)) {
    const scope = getLocalScope(astPath);
    const pathName = getLocalPathName(astPath.node);
    if (pathName) {
      let declaration = scope.find(([name]) => name === pathName);
      if (!declaration) {
        return;
      }
      if (declaration[1].node.type === 'ElementNode') {
        return declaration[1].node.tag;
      }
    }
  }
}

function getLocalPathName(node: any) {
  if (!node || node.type !== 'PathExpression' || !node.parts.length) {
    return undefined;
  }
  const pathName: string = node.parts[0];
  if (pathName === 'this') {
    return undefined;
  }
  return pathName;
}

export function isLocalScopedPathExpression(astPath: ASTPath) {
  const pathName = getLocalPathName(astPath.node);
  if (!pathName) {
    return false;
  }
  const scope = getLocalScope(astPath);
  const declarations = scope.filter(([name]) => name === pathName);
  if (declarations.length) {
    return true;
  } else {
    return false;
  }
}

export function sourceForNode(node: any, content: string = '') {
  // mostly copy/pasta from ember-template-lint and tildeio/htmlbars with a few tweaks:
  // https://github.com/tildeio/htmlbars/blob/v0.14.17/packages/htmlbars-syntax/lib/parser.js#L59-L90
  // https://github.com/ember-template-lint/ember-template-lint/blob/v2.0.0-beta.3/lib/rules/base.js#L511
  if (!node.loc) {
    return;
  }

  let firstLine = node.loc.start.line - 1;
  let lastLine = node.loc.end.line - 1;
  let currentLine = firstLine - 1;
  let firstColumn = node.loc.start.column;
  let lastColumn = node.loc.end.column;
  let string = [];
  let source = content.match(reLines) as string[];
  if (currentLine > source.length) {
    return;
  }
  let line;

  while (currentLine < lastLine) {
    currentLine++;
    line = source[currentLine];

    if (currentLine === firstLine) {
      if (firstLine === lastLine) {
        string.push(line.slice(firstColumn, lastColumn));
      } else {
        string.push(line.slice(firstColumn));
      }
    } else if (currentLine === lastLine) {
      string.push(line.slice(0, lastColumn));
    } else {
      string.push(line);
    }
  }

  return string.join('');
}

export function getLocalScope(astPath: ASTPath) {
  const scopeValues: ScopeValue[] = [];
  let cursor: ASTPath | undefined = astPath.parentPath;
  while (cursor) {
    const node = cursor.node;
    if (node && (node.type === 'ElementNode' || node.type === 'Block')) {
      const params = node.blockParams;
      params.forEach((param: string) => {
        scopeValues.push([param, cursor as ASTPath, params.indexOf(param)]);
      });
    }
    cursor = cursor.parentPath;
  }
  return scopeValues;
}
export default class ASTPath {
  static toPosition(ast: any, position: Position): ASTPath | undefined {
    let path = _findFocusPath(ast, position);
    if (path) {
      return new ASTPath(path);
    }
  }

  private constructor(private readonly path: any[], private readonly index: number = path.length - 1) {}

  get node(): any {
    return this.path[this.index];
  }

  get parent(): any | undefined {
    return this.path[this.index - 1];
  }

  get parentPath(): ASTPath | undefined {
    if (this.index - 1 < 0) {
      return undefined;
    }
    return new ASTPath(this.path, this.index - 1);
  }
}

function _findFocusPath(node: any, position: Position, seen = new Set()): any {
  seen.add(node);

  let path: any[] = [];
  let range: SourceLocation = node.loc;
  if (range) {
    if (containsPosition(range, position)) {
      path.push(node);
    } else {
      return [];
    }
  }

  for (let key in node) {
    if (!Object.prototype.hasOwnProperty.call(node, key)) {
      continue;
    }

    let value = node[key];
    if (!value || typeof value !== 'object' || seen.has(value)) {
      continue;
    }

    let childPath = _findFocusPath(value, position, seen);
    if (childPath.length > 0) {
      path = path.concat(childPath);
      break;
    }
  }

  return path;
}
