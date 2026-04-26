export const calculateStreak = (logs: any[]) => {
  if (!logs || logs.length === 0) return 0;

  const dates = logs
    .map((log) => log.date)
    .filter(Boolean)
    .sort();

  let streak = 1;

  for (let i = dates.length - 1; i > 0; i--) {
    const curr = new Date(dates[i]);
    const prev = new Date(dates[i - 1]);

    const diff =
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diff === 1) streak++;
    else break;
  }

  return dates.length ? streak : 0;
};