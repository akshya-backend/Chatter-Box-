function initThemeChanger() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  
  if (!themeToggle || !themeIcon) {
    console.warn('Theme toggle elements not found');
    return;
  }

  // Set initial theme
  applySavedThemePreference();
  
  // Add event listener
  themeToggle.addEventListener('click', handleThemeToggle);
}

function getCurrentThemePreference() {
  const savedPreference = localStorage.getItem('darkMode');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  return savedPreference !== null 
    ? savedPreference === 'true' 
    : systemPrefersDark;
}

function applySavedThemePreference() {
  const isDarkMode = getCurrentThemePreference();
  updateTheme(isDarkMode);
}

function handleThemeToggle() {
  const currentDarkMode = localStorage.getItem('darkMode') === 'true';
  const newDarkMode = !currentDarkMode;
  updateTheme(newDarkMode);
}

function updateTheme(isDarkMode) {
  try {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      updateThemeIcon('sun', 'moon');
    } else {
      document.documentElement.removeAttribute('data-theme');
      updateThemeIcon('moon', 'sun');
    }
    
    localStorage.setItem('darkMode', isDarkMode);
  } catch (error) {
    console.error('Error updating theme:', error);
  }
}

function updateThemeIcon(removeIcon, addIcon) {
  const themeIcon = document.getElementById('theme-icon');
  if (!themeIcon) return;
  
  themeIcon.classList.remove(`ri-${removeIcon}-line`);
  themeIcon.classList.add(`ri-${addIcon}-line`);
}

// Initialize the theme changer when DOM is loaded
 export default initThemeChanger