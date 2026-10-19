import type { ReconstructionBuilder } from './toolkit';

/** Placeholder until the reconstruction is authored. */
export function build(b: ReconstructionBuilder) {
  b.feature('placeholder');
  b.box([.5, .5, .5], [0, .25, 0], 'stone');
}
