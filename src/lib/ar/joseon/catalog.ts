import type { JoseonPhoto } from './toolkit';

export const JOSEON_RECONSTRUCTION = 'photo-reference-v2' as const;
export interface JoseonModelInfo { id: number; key: string; name: string; file: string; metallic: boolean; photo?: JoseonPhoto }

/**
 * Six Sejong-era science artifacts as photo-reference teaching reconstructions (not scans or measured
 * originals). A model with no `photo` yet shows its shape only and says so; adding the photo and its
 * views is all it takes to texture it.
 */
export const joseonModels: JoseonModelInfo[] = [
  { id: 1, key: 'joseon-cheugugi-v1', name: '측우기', file: 'cheugugi', metallic: true },
  { id: 2, key: 'joseon-jagyeongnu-v1', name: '자격루', file: 'jagyeongnu', metallic: true },
  { id: 3, key: 'joseon-ganui-v1', name: '간의', file: 'ganui', metallic: true },
  { id: 4, key: 'joseon-angbuilgu-v1', name: '앙부일구', file: 'angbuilgu', metallic: true, photo: {
    path: 'images/heritage/joseon/angbuilgu.jpg', source: 'https://commons.wikimedia.org/wiki/File:Seoul-Gyeongbokgung-Sundial-02.jpg',
    author: 'Bernat', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    views: {
      bowl: { elevation: 50, azimuth: 50, frame: [.098, .035, .902, .735] },
      'bowl-inside': { elevation: 52, azimuth: 50, frame: [.183, .075, .814, .612] },
      'bowl-shade': { elevation: 52, azimuth: 50, frame: [.335, .375, .36, .4] },
      gnomon: { elevation: 45, azimuth: 40, frame: [.26, .282, .51, .642] },
      stand: { elevation: 35, azimuth: 55, frame: [.164, .603, .31, .882] },
      'stand-east': { elevation: 30, azimuth: 45, frame: [.694, .622, .825, .905] },
      'stand-north': { elevation: 35, azimuth: 235, frame: [.164, .603, .31, .882] },
      'stand-west': { elevation: 30, azimuth: 225, frame: [.694, .622, .825, .905] },
      'stand-base': { elevation: 35, azimuth: 50, frame: [.3, .76, .325, .785] },
    },
  } },
  { id: 5, key: 'joseon-honcheonui-v1', name: '혼천의', file: 'honcheonui', metallic: true },
  { id: 6, key: 'joseon-nongsajikseol-v1', name: '농사직설', file: 'nongsajikseol', metallic: false },
];
export type JoseonModelKey = string;
export const joseonModel = (key: unknown) => joseonModels.find(item => item.key === key);
export const joseonModelFor = (artifactId: number) => joseonModels.find(item => item.id === artifactId);
export const isJoseonModelKey = (key: unknown): key is JoseonModelKey => !!joseonModel(key);
