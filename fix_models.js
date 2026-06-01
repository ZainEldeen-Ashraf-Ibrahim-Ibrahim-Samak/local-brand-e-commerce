const fs = require('fs');
const path = require('path');
const modelsDir = path.join(process.cwd(), 'src/models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  let content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
  
  content = content.replace(/export const ([A-Za-z0-9_]+)[\s\S]+?(?=;$)/gm, (match, name) => {
    if (!match.includes('mongoose')) return match;
    const schemaName = name.charAt(0).toLowerCase() + name.slice(1) + 'Schema';
    return 'export const ' + name + ': mongoose.Model<' + name + 'Doc> =' + '\n' +
      '  (mongoose.models.' + name + ' as mongoose.Model<' + name + 'Doc>) ?? mongoose.model<' + name + 'Doc>(\"' + name + '\", ' + schemaName + ')';
  });
  
  fs.writeFileSync(path.join(modelsDir, file), content);
});
