// Copy for the badge and its settings page, in both languages the shell ships.
// Language detection follows the shell's locale plugin, which rewrites
// `document.documentElement.lang`; a MutationObserver keeps us in step.

const dictionaries = {
  en: {
    settingsLabel: 'Rate period',
    cardTitle: 'API rate period',
    cardSub:
      'DeepSeek prices peak and off-peak windows differently. Peak hours are 01:00–04:00 and 06:00–10:00 UTC, Monday to Friday; every other hour costs half as much.',
    badgeToggleLabel: 'Show the rate badge',
    badgeToggleHintOn: 'The peak/off-peak badge is visible in the session header.',
    badgeToggleHintOff: 'The badge is hidden. Pricing still applies as usual.',
    countdownLabel: 'Count down to the next change',
    countdownHint: 'Show a live timer in the badge popover.',
    peak: 'Peak',
    offPeak: 'Off-peak',
    badgeAria: 'API rate period',
    rateLabel: 'Rate',
    ratePeakValue: 'Full price',
    rateOffPeakValue: '50% of peak',
    nextChangeLabel: 'Next change',
    utcClockLabel: 'UTC now',
    scheduleLabel: 'Peak schedule',
    scheduleValue: 'Mon–Fri 01:00–04:00, 06:00–10:00 UTC',
    allOtherOffPeak: 'All other hours are off-peak.',
    closePopover: 'Close',
    unreachable: 'Could not reach the host half. Restart DSH so the plugin loads on both sides.',
    readingPrefs: 'Reading preferences…',
    saveFailed: 'Saved for this session, but writing the preferences file failed.',
  },
  zh: {
    settingsLabel: '价格时段',
    cardTitle: 'API 价格时段',
    cardSub:
      'DeepSeek 的峰时与闲时价格不同。峰时为 UTC 周一至周五 01:00–04:00 与 06:00–10:00；其余时段价格减半。',
    badgeToggleLabel: '显示价格时段徽标',
    badgeToggleHintOn: '会话标题栏中显示峰时/闲时徽标。',
    badgeToggleHintOff: '徽标已隐藏，计费方式不受影响。',
    countdownLabel: '显示距下次切换的倒计时',
    countdownHint: '在徽标弹层中显示实时倒计时。',
    peak: '峰时',
    offPeak: '闲时',
    badgeAria: 'API 价格时段',
    rateLabel: '价格',
    ratePeakValue: '全价',
    rateOffPeakValue: '峰时价的 50%',
    nextChangeLabel: '下次切换',
    utcClockLabel: '当前 UTC',
    scheduleLabel: '峰时安排',
    scheduleValue: 'UTC 周一至周五 01:00–04:00、06:00–10:00',
    allOtherOffPeak: '其余时段均为闲时。',
    closePopover: '关闭',
    unreachable: '无法连接宿主半边。请重启 DSH，让插件的两半都加载。',
    readingPrefs: '正在读取偏好设置…',
    saveFailed: '本次会话已生效，但写入偏好文件失败。',
  },
};

/** Read the interface language the shell is currently running in. */
export function getUiLocale() {
  if (typeof document !== 'undefined') {
    const tag = (document.documentElement?.lang ?? '').toLowerCase();
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return 'en';
  }
  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }
  return 'en';
}

/** The copy table for one locale. */
export function strings(locale) {
  return dictionaries[locale] ?? dictionaries.en;
}

/**
 * Call `listener` whenever the interface language changes.
 * @returns an unsubscribe function.
 */
export function subscribeUiLocale(listener) {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  return () => observer.disconnect();
}
