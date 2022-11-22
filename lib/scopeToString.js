function scopeToString (scope, addCallback, runCallback) {
  const newScope = {};
  for (const key in scope) {
    if (typeof scope[key] === 'function') {
      newScope[key] = ['callback', addCallback(scope[key])];
    } else if (typeof scope[key] === 'object') {
      newScope[key] = ['object', scopeToString(scope[key], addCallback, runCallback)];
    } else {
      newScope[key] = ['literal', scope[key]];
    }
  }
  return JSON.stringify(newScope);
}

export default scopeToString;
