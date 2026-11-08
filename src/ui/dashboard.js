function formatValue(value, format) {
  switch (format) {
    case 'gb':
      return `${Math.round(value)} GB`;
    case 'p':
      return `${value.toFixed(1)}%`;
    case 'k':
      if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
      return `${Math.round(value)}`;
    default:
      return Math.round(value).toLocaleString('en-US');
  }
}

/**
 * Counters, bar charts and sparklines in the phone mockup.
 * Values come from data attributes in the markup: data-to / data-f on counters,
 * data-w (percent) on bars.
 */
export function createDashboard(phoneEl) {
  const counters = [...phoneEl.querySelectorAll('.cnt')];
  const bars = [...phoneEl.querySelectorAll('.bars i')];
  const sparklines = [...phoneEl.querySelectorAll('.sp')];

  // polylines use pathLength="1", so a dash of 1 hides/shows the whole line
  for (const line of sparklines) {
    line.style.strokeDasharray = '1';
    line.style.strokeDashoffset = '1';
  }

  return {
    /** @param {number} amount 0..1 reveal progress */
    update(amount) {
      for (const line of sparklines) line.style.strokeDashoffset = (1 - amount).toFixed(3);
      for (const el of counters)
        el.textContent = formatValue(Number(el.dataset.to) * amount, el.dataset.f);
      for (const el of bars) el.style.width = `${Number(el.dataset.w) * amount}%`;
    },
  };
}
