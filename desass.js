const stdin = process.stdin;
(() => {
  let ret = '';
  return new Promise(resolve => {
    if (stdin.isTTY) {
      resolve(ret);
      return;
    }

    stdin.setEncoding('utf8');

    stdin.on('readable', () => {
      let chunk;

      while ((chunk = stdin.read())) {
        ret += chunk;
      }
    });

    stdin.on('end', () => {
      resolve(ret.replace(/!default/g, ''));
    });
  });
})().then(content => {
  const variables = content.split(/(\$[\w-]+):/g).filter((_, i) => i % 2 === 1);

  const lines = content.split('\n');
  const leadingSpaces = lines
    .map(line => {
      let count = 0;
      if (line.trim().length > 0) {
        while (line[count] === ' ') count++;
      }
      return count;
    })
    .concat(0);

  const withBrackets = lines
    .map((line, i) =>
      line[0] === '$'
        ? line
        : leadingSpaces[i] < leadingSpaces[i + 1]
        ? line + ' {'
        : leadingSpaces[i - 1] > leadingSpaces[i]
        ? '} ' + line
        : line + (leadingSpaces[i] > 0 ? ';' : '')
    )
    .concat('}'.repeat(leadingSpaces[leadingSpaces.length - 2] / 2))
    .join('\n');

  const kebabToCamel = s =>
    s.replace(/-([a-z])/gi, (_, firstChar) => firstChar.toUpperCase());

  const withExports = variables.reduce((code, v) => {
    const c = '${' + kebabToCamel(v.substr(1)) + '}';
    return code
      .replace(new RegExp('\\' + v, 'g'), c)
      .replace(`${c}:`, `const ${c.substr(2, c.length - 3)} = `);
  }, withBrackets);

  const imports = Array.from(
    new Set(content.split(/(\$\w+-[\w-]+)/g).filter((_, i) => i % 2 === 1))
  ).filter(i => variables.indexOf(i) === -1);

  const withImports =
    `import css from '@emotion/css';\n` +
    `import {${imports
      .sort()
      .map(v => kebabToCamel(v.substr(1)))
      .join(', ')}} from '../variables';\n\n` +
    imports
      .sort((a, b) => b.length - a.length)
      .reduce((code, v) => {
        const c = '${' + kebabToCamel(v.substr(1)) + '}';
        return code
          .replace(
            new RegExp('=\\s+\\' + v, 'g'),
            '= ' + c.substr(2, c.length - 3) + ';'
          )
          .replace(new RegExp('\\' + v, 'g'), c);
      }, withExports);

  console.log(
    //   content.split(/(\$[\w-]+):/g).filter((_, i) => i % 2 === 1)
    // .replace(/ !default$/g, '')
    // .replace(/\$([\w-]+)/g, (_, variable) =>
    //   variable.replace(/-([a-z])/gi, (_, firstChar) => firstChar.toUpperCase())
    // )
    withImports
      .split('\n')
      .map(l => (l.indexOf('const') === 0 ? l.trim() : l))
      .join('\n')
      .replace(/(const .* =\s+)([^\n;]*)\s*\n/g, '$1`$2`;\n')
  );
});
