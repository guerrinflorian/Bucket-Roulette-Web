export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle(array) {
  const output = [...array];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
}
