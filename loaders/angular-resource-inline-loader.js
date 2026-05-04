const fs = require('fs');
const path = require('path');
const sass = require('sass');

function toTemplateLiteral(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

function readResource(context, resourcePath) {
  const absolutePath = path.resolve(path.dirname(context.resourcePath), resourcePath);
  context.addDependency(absolutePath);

  return fs.readFileSync(absolutePath, 'utf8');
}

function readStyleResource(context, resourcePath) {
  const absolutePath = path.resolve(path.dirname(context.resourcePath), resourcePath);
  context.addDependency(absolutePath);

  if (absolutePath.endsWith('.scss') || absolutePath.endsWith('.sass')) {
    return sass.compile(absolutePath).css;
  }

  return fs.readFileSync(absolutePath, 'utf8');
}

module.exports = function angularResourceInlineLoader(source) {
  let transformed = source.replace(
    /templateUrl\s*:\s*(['"`])(.+?)\1/g,
    (_match, _quote, resourcePath) => {
      const template = toTemplateLiteral(readResource(this, resourcePath));

      return `template: \`${template}\``;
    }
  );

  transformed = transformed.replace(
    /styleUrl\s*:\s*(['"`])(.+?)\1/g,
    (_match, _quote, resourcePath) => {
      const styles = toTemplateLiteral(readStyleResource(this, resourcePath));

      return `styles: [\`${styles}\`]`;
    }
  );

  transformed = transformed.replace(
    /styleUrls\s*:\s*\[([^\]]+)\]/g,
    (_match, styleUrls) => {
      const styles = Array.from(styleUrls.matchAll(/(['"`])(.+?)\1/g)).map(([, , resourcePath]) => {
        const style = toTemplateLiteral(readStyleResource(this, resourcePath));

        return `\`${style}\``;
      });

      return `styles: [${styles.join(', ')}]`;
    }
  );

  return transformed;
};
