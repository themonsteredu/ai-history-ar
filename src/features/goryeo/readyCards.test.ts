import { describe, expect, it } from 'vitest';
import { goryeoCard, goryeoCode, goryeoModel, goryeoPhoto, goryeoRoomSafe, GORYEO_TAG } from './readyCards';
import { buildCreationPrompt, emptyParts, isGroupCard, isVerification, newSelfVerification, type Verification } from '../open-class/model';
import { readyJoseonPoints } from '../open-class/ReadyJoseonCards';

describe('prepared open-class cards', () => {
 it('keeps six complete Goryeo cards compatible with existing storage and models', () => {
  for(let id=1;id<=6;id++) { const card=goryeoCard(2,id); expect(isGroupCard(card)).toBe(true);expect(card.points).toHaveLength(3);expect(card.points.every(p=>p.title&&p.text)).toBe(true);expect(goryeoModel(id)?.asset).toBeTruthy();expect(goryeoPhoto(id)?.source).toBeTruthy(); }
  expect(goryeoCode('12345')).toBe('8912345');
 });
 it('uses Goryeo topic in the copied Gemini request', () => {
  const prompt=buildCreationPrompt(emptyParts(),goryeoCard(1,3),true,'팔만대장경');
  expect(prompt).toContain('[주제] 팔만대장경');expect(prompt).toContain('정확히 3개');expect(prompt).toContain('정확히 1문항');expect(prompt).not.toContain('간의');
 });
 it('does not permit replacing a different lesson or old sample records', () => {
  const card=goryeoCard(1,1),check={...newSelfVerification(1),lesson:GORYEO_TAG} as Verification;
  const item=(data:any)=>({key:'1',version:1,updatedAt:'',data});
  expect(isVerification(check)).toBe(true);
  expect(goryeoRoomSafe({cards:[item(card)],checks:[item(check)],teacher:[]})).toBe(true);
  expect(goryeoRoomSafe({cards:[item({...card,lesson:undefined})],checks:[],teacher:[]})).toBe(false);
  expect(goryeoRoomSafe({cards:[],checks:[item({...check,lesson:undefined})],teacher:[]})).toBe(false);
  expect(goryeoRoomSafe({cards:[],checks:[],teacher:[item({})]})).toBe(false);
 });
 it('provides three written, deterministic Joseon descriptions for every artifact', () => {
  for(let id=1;id<=6;id++){const points=readyJoseonPoints(id);expect(points).toHaveLength(3);expect(points.every(p=>p.title&&p.text)).toBe(true);expect(points).toEqual(readyJoseonPoints(id));}
 });
});
