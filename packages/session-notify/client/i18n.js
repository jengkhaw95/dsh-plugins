// Copy for the settings page, in both languages the shell ships.
//
// The settings navigation label is read through a function rather than a
// constant, so switching the interface language re-reads it on the next render
// instead of freezing whatever was active when the plugin mounted. Language
// detection follows the shipped client locale plugin, which rewrites
// `document.documentElement.lang`; a MutationObserver keeps us in step with it.
// navigator.language is the fallback, and English the last resort.

const strings_ = {
  en: {
    settingsLabel: 'Notifications',
    cardTitle: 'Session notifications',
    cardSub:
      'Hear when the main session finishes a turn or needs your answer. Subagent sessions stay silent — only the session you are driving makes a sound.',
    masterLabel: 'Play notification sounds',
    masterHintOn: 'Cues are on for the main session.',
    masterHintOff: 'Cues are muted everywhere in this browser.',
    doneLabel: 'Session finished',
    doneHint: 'Played when the main session completes a turn.',
    needsInputLabel: 'Needs your input',
    needsInputHint: 'Played when the main session is waiting on you.',
    volumeLabel: 'Volume',
    hiddenLabel: 'Only when this tab is in the background',
    hiddenHint:
      'Stay quiet while you are watching the session. Recommended if you keep DSH open on a second monitor.',
    preview: 'Preview',
    previewAria: 'Preview the selected sound',
    unavailable: 'Notification sounds are unavailable — this browser exposes no Web Audio.',
    unreachable: 'Could not reach the host half. Restart DSH so the plugin loads on both sides.',
    readingPrefs: 'Reading preferences…',
    saveFailed: 'Saved for this session, but writing the preferences file failed.',
  },
  zh: {
    settingsLabel: '通知',
    cardTitle: '会话通知',
    cardSub:
      '主会话完成一轮或需要你回答时发出提示音。子代理会话保持静音——只有你正在驱动的会话会发声。',
    masterLabel: '播放通知音',
    masterHintOn: '主会话提示音已开启。',
    masterHintOff: '此浏览器中的提示音已静音。',
    doneLabel: '会话已完成',
    doneHint: '主会话完成一轮时播放。',
    needsInputLabel: '需要你输入',
    needsInputHint: '主会话在等待你回应时播放。',
    volumeLabel: '音量',
    hiddenLabel: '仅当此标签页在后台时',
    hiddenHint: '你正盯着会话时保持安静。若把 DSH 常驻副屏，建议开启。',
    preview: '试听',
    previewAria: '试听所选提示音',
    unavailable: '此浏览器不支持 Web Audio，无法播放通知音。',
    unreachable: '无法连接宿主半边。请重启 DSH，让插件的两半都加载。',
    readingPrefs: '正在读取偏好设置…',
    saveFailed: '本次会话已生效，但写入偏好文件失败。',
  },
};

/** Read the interface language the shell is currently running in. */
export function getUiLocale() {
  if (typeof document !== 'undefined') {
    const tag = document.documentElement?.lang ?? '';
    if (tag.toLowerCase().startsWith('zh')) return 'zh';
    if (tag.toLowerCase().startsWith('en')) return 'en';
  }
  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  }
  return 'en';
}

/** The copy table for one locale. */
export function strings(locale) {
  return strings_[locale] ?? strings_.en;
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
