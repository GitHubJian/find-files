const path = require('path');
const find = require('../dist').default;

const filelist = find({
    src: path.resolve(__dirname, 'src'),
    rules: [
        {
            from: '(**)',
            to: '$1',
        },
    ],
});

console.log(filelist);
