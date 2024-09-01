function IronMan(naxor) {
  if (typeof naxor !== 'string' || !naxor.trim()) {
    throw new Error('non-empty string');
  }
  const base_tony = 'https://ironman.koyeb.app/';
  return `${base_tony}${encodeURIComponent(naxor)}`;
}
module.export = { IronMan };