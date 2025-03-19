const fs = require('fs');
const messUp = require('../dist').default;
async () => {
  const inputCode = fs.readFileSync('./input.js', 'utf-8');
  const outputCode = await messUp(inputCode, {
    minifyOptions: {},
  });
  fs.writeFileSync('output.js', outputCode);
  console.log(outputCode);
};
