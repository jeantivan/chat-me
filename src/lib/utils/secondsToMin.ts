export const secondsToMin = (time: number) => {
  const minutes = Math.floor(time / 60);
  const secondsLeft = time - minutes * 60;

  return `${minutes < 1 ? "00" : minutes}:${
    secondsLeft < 10 ? "0" + secondsLeft : secondsLeft
  }`;
};
