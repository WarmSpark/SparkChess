export const calculateElo = (winnerElo: number, loserElo: number, kFactor = 32) => {
  const expectedWin = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoss = 1 - expectedWin;
  return {
    newWinnerElo: Math.round(winnerElo + kFactor * (1 - expectedWin)),
    newLoserElo: Math.round(loserElo + kFactor * (0 - expectedLoss)),
  };
};
