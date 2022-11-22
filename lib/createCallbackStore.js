import generateUniqueId from './generateUniqueId.js';

function createCallbackStore () {
  const store = {};

  const add = fn => {
    const id = generateUniqueId();
    store[id] = fn;
    return id;
  };

  const get = id => {
    return store[id];
  };

  return {
    store,
    add,
    get
  };
}

export default createCallbackStore;
