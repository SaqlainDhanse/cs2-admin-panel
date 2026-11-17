import { activeThemeName, fallbackThemeName } from './config';

// Auto-registers every theme folder: themes/<name>/index.js
// Drop in a new theme folder (e.g. unzipped) and it becomes available —
// then set `activeThemeName` in ./config.js to use it.
const modules = import.meta.glob('./*/index.js', { eager: true });

export const themes = Object.fromEntries(
	Object.entries(modules).map(([path, mod]) => [path.split('/')[1], mod.default])
);

export const activeTheme = themes[activeThemeName] ?? themes[fallbackThemeName];

const defaultBrand = {
	title: 'Admin Panel',
	appName: 'Admin Panel',
	logo: null,
	header: null,
};

export const activeBrand = activeTheme?.brand ?? defaultBrand;

const toCssVarName = (name) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const hexToRgbChannels = (hex) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) return null;
	return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
};

// Applies the active theme's colors as CSS custom properties on :root.
// For every `colors` entry `foo: '#aabbcc'` this sets:
//   --theme-foo: #aabbcc
//   --theme-foo-rgb: 170 187 204   (for use in rgb(var(--theme-foo-rgb) / <alpha>))
// The optional `background` entry (image path or URL) is published as
// --theme-bg-image; the body and the login backdrop render it behind the UI.
// Call once at app startup (see main.jsx).
export function applyTheme(theme = activeTheme) {
	if (!theme?.colors) return;
	const root = document.documentElement;

	for (const [name, hex] of Object.entries(theme.colors)) {
		const varName = `--theme-${toCssVarName(name)}`;
		root.style.setProperty(varName, hex);
		const rgb = hexToRgbChannels(hex);
		if (rgb) root.style.setProperty(`${varName}-rgb`, rgb);
	}

	root.style.setProperty('--theme-bg-image', theme.background ? `url(${theme.background})` : 'none');
}

export default activeTheme;
