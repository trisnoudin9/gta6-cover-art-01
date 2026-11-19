// Fixed scenes for screenshots: ?shot=editor shows the editor with sample
// photos loaded; ?shot=cover / portrait / square show an exported-style cover
// alone, filling the viewport. window.__shotReady is set once painted.
import { GRADES, LAYOUTS } from './cover.js';

export async function runShot(shot, query, api) {
  const caption = query.get('caption') || 'Sunset Heist';
  const subtitle = query.get('subtitle') || 'Neon Bay Nights';
  if (shot === 'cover' || shot === 'portrait' || shot === 'square') {
    document.body.classList.add('shot-cover');
    const aspect = shot === 'portrait' ? 'portrait' : shot === 'square' ? 'square' : 'landscape';
    const layout = query.get('layout') || (aspect === 'portrait' ? 'triptych' : aspect === 'square' ? 'grid' : 'hero');
    const grade = query.get('grade') || (aspect === 'square' ? 'neon' : 'sunset');
    const style = query.get('style') || (aspect === 'square' ? 'neon' : 'block');
    await api.loadShotScene({
      aspect,
      layout,
      grade,
      letterStyle: style,
      title: caption,
      subtitle,
      photos: ['boulevard', 'pier', 'boulevard'],
    });
  } else {
    // editor scene: hero layout, sunset grade, both samples loaded.
    await api.loadShotScene({
      aspect: 'square',
      layout: 'hero',
      grade: 'sunset',
      letterStyle: 'block',
      title: caption,
      subtitle,
      photos: ['boulevard', 'pier', 'boulevard'],
    });
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}

export { GRADES, LAYOUTS };
