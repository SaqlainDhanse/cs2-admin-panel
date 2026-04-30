export class RoleMapper {
  static MAP = {
    '#admin': 'Administrator',
    '#moderator': 'Moderator',
    '#officer': 'Officer'
  };

  // For the Table: "#admin" -> "Administrator"
  static toDisplay(flag) {
    return this.MAP[flag] || flag;
  }

  // For the Form: Returns [{ value: '#admin', label: 'Administrator' }, ...]
  static getOptions() {
    return Object.entries(this.MAP).map(([flag, label]) => ({
      value: flag,
      label: label
    }));
  }
}