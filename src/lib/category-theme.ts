export function getCategoryTheme(categoryId: string) {
  let hash = 0;

  for (let index = 0; index < categoryId.length; index += 1) {
    hash = categoryId.charCodeAt(index) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;

  return {
    accent: `hsl(${hue} 72% 48%)`,
    border: `hsl(${hue} 62% 82%)`,
    background: `hsl(${hue} 85% 97%)`,
    headerBackground: `hsl(${hue} 80% 94%)`,
    text: `hsl(${hue} 68% 32%)`,
    softText: `hsl(${hue} 55% 42%)`,
  };
}
