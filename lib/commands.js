const config = require('../config');
const commands = [];

function Meta({ command, category, usage, filename }, handler) {
  const syt = [config.PREFIX];
  if (!syt.some(prefix => command.startsWith(prefix))) {
    return;
  }

  commands.push({
    command,
    category,
    usage,
    filename,
    handler,
  });
}

module.exports = {
  Meta,
  commands,
};
