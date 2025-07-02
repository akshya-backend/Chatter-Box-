export const organizeAlphabetically = (groups) => {
  const organized = {};
  
  groups.forEach(group => {
    const firstLetter = group.name.charAt(0).toUpperCase();
    if (!organized[firstLetter]) {
      organized[firstLetter] = [];
    }
    organized[firstLetter].push(group);
  });
  
  return Object.keys(organized).sort().map(letter => ({
    letter,
    groups: organized[letter].sort((a, b) => a.name.localeCompare(b.name))
  }));
};

export const getInitials = (name) => {
  const letters = name.split(' ')
    .map(part => part[0] || '');

  if (letters.length >= 2) {
    return letters.slice(0, 2).join('').toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const createInitialsAvatar = (name) => {
  const initials = getInitials(name);
  const avatar = document.createElement("div");
  avatar.className = "initials-avatar";
  avatar.textContent = initials;
  return avatar;
};