import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ArCameraView } from './ArCard';

it('keeps the AR view title bar with 닫기 at the top, before the camera picture', () => {
  const html = renderToStaticMarkup(<ArCameraView artifactId={1} points={[]} title="1모둠 · 측우기" onClose={() => undefined} />);
  const bar = html.indexOf('class="oc-ar-top"'), camera = html.indexOf('class="oc-ar-float');
  expect(bar).toBeGreaterThan(-1); expect(camera).toBeGreaterThan(bar);
  expect(html.slice(bar, camera)).toContain('>닫기</button>');
});
