// Authentication & Library Import Service for Steam and Google

const LOCAL_STORAGE_STEAM = 'fps_estimator_steam_user';
const LOCAL_STORAGE_GOOGLE = 'fps_estimator_google_user';

// Sample curated Steam library profiles that users can quick-import or custom import
export const SAMPLE_STEAM_PROFILES = [
  {
    id: 'steam-rpg-action',
    name: 'Gamer_77',
    steamId: '76561198012345678',
    avatar: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
    level: 42,
    games: [
      { title: 'Cyberpunk 2077', id: 5209422, playtime: '142 hrs' },
      { title: 'Elden Ring', id: 5277816, playtime: '210 hrs' },
      { title: "Baldur's Gate 3", id: 5138060, playtime: '185 hrs' },
      { title: 'Black Myth: Wukong', id: 5269886, playtime: '68 hrs' },
      { title: 'Helldivers 2', id: 5403655, playtime: '94 hrs' },
      { title: 'Monster Hunter: World', id: 3374, playtime: '320 hrs' },
      { title: 'Red Dead Redemption 2', id: 5249031, playtime: '115 hrs' },
      { title: 'Hogwarts Legacy', id: 5267354, playtime: '55 hrs' }
    ]
  },
  {
    id: 'steam-competitive',
    name: 'Vortex_Frag',
    steamId: '76561198987654321',
    avatar: 'https://avatars.steamstatic.com/c4ad9b30c3adbb0cf51a87e597c55c7b3ddb2591_full.jpg',
    level: 28,
    games: [
      { title: 'Counter-Strike 2', id: 5363838, playtime: '1,450 hrs' },
      { title: 'Apex Legends', id: 35001, playtime: '620 hrs' },
      { title: 'Call of Duty: Warzone', id: 5257960, playtime: '380 hrs' },
      { title: 'DOOM Eternal', id: 5209479, playtime: '48 hrs' },
      { title: 'Forza Horizon 5', id: 5287648, playtime: '110 hrs' },
      { title: 'Grand Theft Auto V', id: 3674, playtime: '450 hrs' }
    ]
  }
];

export function getStoredSteamUser() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_STEAM) || 'null');
  } catch (e) {
    return null;
  }
}

export function saveSteamUser(user) {
  if (user) {
    localStorage.setItem(LOCAL_STORAGE_STEAM, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_STEAM);
  }
}

export function getStoredGoogleUser() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_GOOGLE) || 'null');
  } catch (e) {
    return null;
  }
}

export function saveGoogleUser(user) {
  if (user) {
    localStorage.setItem(LOCAL_STORAGE_GOOGLE, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_STORAGE_GOOGLE);
  }
}
