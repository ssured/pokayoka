module.exports = {
  api: {
    //async is a normal async function
    hello: 'async',

    //source is a pull-stream (readable)
    stuff: 'source',

    // changesSince ,
    changesSince: 'source',

    log: 'sink',

    merge: 'duplex',
  },
};
