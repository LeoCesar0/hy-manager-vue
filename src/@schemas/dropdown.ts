export type IDropdownItem = {
  label: string; // Label of the menu item
  icon?: any; // Icon component (can be a component or string)
  shortcut?: string; // Optional keyboard shortcut
  action?: () => void; // Function to be called on click
  items?: IDropdownItem[]; // Sub-items for nested dropdown
  disabled?: boolean; // Optional disabled state
  variant?: "danger";
  hidden?: boolean;
};
