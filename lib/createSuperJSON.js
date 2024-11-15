import SuperJSON from 'superjson';

function createSuperJSON (addCallback, runCallback) {
  const superjson = new SuperJSON();
  superjson.registerCustom(
    {
      isApplicable: value => typeof value === 'function',
      serialize: addCallback,
      deserialize: id => (...args) => runCallback(id, superjson.stringify(args)),
    },
    'callback'
  );
  return superjson;
}

export default createSuperJSON
