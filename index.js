const cheerio = require('cheerio');
const fs = require('fs');
const { once } = require('events');
const readline = require('readline');
const filename = 'bookmarks_8_8_20.html';
const util = require('util');

const rl = readline.createInterface({
  input: fs.createReadStream(filename),
  crlfDelay: Infinity
});

let result = {};
let node = {};
(async () => {
  try {
    rl.on('line', (line) => {
      // console.log(`Line from file: ${line}`);
      if (line.trim().startsWith('<DL><p>')) {
        // node.children = {};
        // node.children['parent'] = node;
        // node = node.children;
      }
      if (line.trim().startsWith('<DT><H3')) {
        const label = cheerio.load(line).text();
        node[label] = label in node ? node[label] : {};
        node[label]['label'] = label;
        node[label]['html'] = line;
        node[label]['parent'] = node;
        node = node[label];
      }
      if (line.trim().startsWith('<DT><A')) {
        const bookmark = cheerio.load(line).text();
        node[bookmark] = {};
        node[bookmark]['label'] = bookmark;
        node[bookmark]['html'] = line;
      }
      if (line.trim().startsWith('</DL><p>')) {
        if (!node.parent) {
          result = node;
        }
        node = node.parent;
      }
    });

    await once(rl, 'close');

    // console.log(`${JSON.stringify(result, (key, value) => {
    //   if (key === 'parent') {
    //     return value.label;
    //   }
    //   return value;
    // })}`);

    const resultfile = `bookmarks-result-${new Date().toISOString()}.html`;

    fs.copyFileSync("bookmarks-result.html", resultfile);

    const stream = fs.createWriteStream(resultfile, { flags: 'a' });

    stream.write(`<DL><p>\n`);
    print(result, stream);
    stream.write(`</DL><p>\n`);

    stream.end();

  } catch (err) {
    console.error(err);
  }
})();

function print(node, stream) {
  Object.entries(node)
    .filter((en, ix, ar) => { return en[0] !== 'label' && en[0] !== 'html' && en[0] !== 'parent' })
    .forEach((entry, index, array) => {
      // console.log(`${entry[0]}`);
      if (entry[1].html.trim().startsWith(`<DT><H3`)) {
        // console.log(`${entry[1].html}`);
        stream.write(`${entry[1].html}\n`);
        stream.write(`<DL><p>\n`);
        Object.entries(entry[1])
          .filter((en, ix, ar) => { return en[0] !== 'label' && en[0] !== 'html' && en[0] !== 'parent' })
          .forEach((en, ix, ar) => {
            print(Object.fromEntries([en]), stream);
        });    
        stream.write(`</DL><p>\n`);
      } else {
        stream.write(`${entry[1].html}\n`);
      }
  });
}
