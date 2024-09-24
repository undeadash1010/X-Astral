const { PREFIX } = require('../config.js');
const commands = [];

const addCommand = ({ command, category, usage, filename, action }) => {
    if (command.startsWith(PREFIX)) {
        commands.push({
            command: command.replace(PREFIX, ''),  
            category: category,
            usage: usage,
            filename: filename,
            action: action 
        });
    }
};

module.exports = { commands, addCommand };
