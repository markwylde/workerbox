const generateUniqueId = () => {
  globalThis.incrementor = (globalThis.incrementor || 0) + 1;
  return globalThis.incrementor + '_' + Array(20)
    .fill('!@#$%^&*()_+-=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
    .map(function (x) { return x[Math.floor(Math.random() * x.length)]; }).join('');
};

export default generateUniqueId;
