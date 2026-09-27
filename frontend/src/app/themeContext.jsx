import { ThemeContext } from './themeContextValue';

export function ThemeProvider({ children, theme, toggleTheme }) {
	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}
