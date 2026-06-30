import { DEFAULT_PROFILE } from '../data/options';

const PROFILE_KEY = 'renge-yizhan-profile';

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.warn('保存档案失败：', error);
    return false;
  }
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (error) {
    console.warn('读取档案失败：', error);
    return DEFAULT_PROFILE;
  }
}
