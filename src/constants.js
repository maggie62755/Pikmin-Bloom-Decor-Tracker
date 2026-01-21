import { COLORS } from './theme/colors';

import decorsData from './data/decors.json';

export const PIKMIN_COLORS = [
  { id: 'red', name: 'Red', name_ch: '紅色', hex: COLORS.pikmin.red },
  { id: 'yellow', name: 'Yellow', name_ch: '黃色', hex: COLORS.pikmin.yellow },
  { id: 'blue', name: 'Blue', name_ch: '藍色', hex: COLORS.pikmin.blue },
  { id: 'white', name: 'White', name_ch: '白色', hex: COLORS.pikmin.white },
  { id: 'purple', name: 'Purple', name_ch: '紫色', hex: COLORS.pikmin.purple },
  { id: 'rock', name: 'Rock', name_ch: '岩石', hex: COLORS.pikmin.rock },
  { id: 'winged', name: 'Winged', name_ch: '羽翅', hex: COLORS.pikmin.winged },
  { id: 'ice', name: 'Ice', name_ch: '冰凍', hex: COLORS.pikmin.ice },
];


export const DECOR_CATEGORIES = decorsData.categories;


export const DECOR_STATUS = {
  NOT_COLLECTED: 0,
  SEEDLING: 1,
  GROWING: 2,
  COLLECTED: 3,
};

export const isStandardCategory = (id) => {
  return !id.startsWith('event_');
};
