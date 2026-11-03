import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MuseumBoard, museumProgress } from './MuseumBoard';
import { Presentation } from './Presentation';
import { newCard, newSelfVerification, newVerifyItem, selfQuestions } from './model';

function preparedCheck() {
  const check = newSelfVerification(1);
  check.selfQuestions!.forEach((question, index) => { question.statement = `${index + 1}번 유물 문제`; });
  const done = (id: string) => ({ ...newVerifyItem(id, 'student'), solved: 'O' as const, why: '교과서 12쪽', decision: 'adopt' as const, reason: '교과서 확인', explanation: '확인한 내용' });
  check.items = check.selfQuestions!.slice(0, 2).map(question => done(question.id));
  return check;
}

describe('museum verification board', () => {
  it('counts only completed questions linked to drafts, and separates exclusions from presentation', () => {
    const check = preparedCheck();
    check.items.push({...newVerifyItem('orphan','student'), solved:'O', decision:'adopt', why:'자료', reason:'이유', explanation:'설명'});
    expect(museumProgress(check)).toMatchObject({ verified: 2, presentable: 2 });
    check.items[1] = {...check.items[1], decision:'exclude'};
    expect(museumProgress(check)).toMatchObject({ verified: 2, presentable: 1 });
    check.items[0].why = '';
    expect(museumProgress(check)).toMatchObject({ verified: 1, presentable: 0 });
  });
  it('shows each group actual artifact photo, progress and presentation control without answers', () => {
    const card = newCard(1, 1), check = preparedCheck();
    const html = renderToStaticMarkup(<MuseumBoard code="1234" groupCount={2} state={{cards:[{key:'1',version:1,data:card,updatedAt:''}],checks:[{key:'1:1',version:1,data:check,updatedAt:''}],teacher:[]}} updatedAt={1} error="" onClose={()=>{}} onPresent={()=>{}}/>);
    expect(html).toContain('측우기 사진');
    expect(html).toContain('발표 준비 완료');
    expect(html).toContain('2모둠');
    expect(html).toContain('시작 전');
    expect(html).not.toContain('교과서 12쪽');
  });
  it('does not imply zero progress before the first successful load', () => {
    const html = renderToStaticMarkup(<MuseumBoard code="1234" groupCount={2} state={{cards:[],checks:[],teacher:[]}} error="연결 실패" onClose={()=>{}} onPresent={()=>{}}/>);
    expect(html).toContain('수업 기록을 불러오지 못했습니다');
    expect(html).not.toContain('시작 전');
  });
  it('presents at most two verified questions and waits until two are ready', () => {
    const card = newCard(1,1), check = preparedCheck();
    let html = renderToStaticMarkup(<Presentation check={check} card={card} questions={selfQuestions(check)} />);
    expect(html).toContain('1번 유물 문제');
    expect(html).toContain('2번 유물 문제');
    check.items[1].why = '';
    html = renderToStaticMarkup(<Presentation check={check} card={card} questions={selfQuestions(check)} />);
    expect(html).toContain('발표할 문제를 2개 검증해 주세요. (현재 1개)');
    expect(html).not.toContain('<h3>1.');
  });
});
