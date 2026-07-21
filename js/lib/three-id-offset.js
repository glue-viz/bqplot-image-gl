/*jshint esversion: 6 */

var THREE = require('three');

// bqplot draws GL marks from this package with the figure's shared
// THREE.WebGLRenderer, which caches geometries keyed by the numeric
// geometry.id. Every copy of three.js assigns ids from its own module-level
// counter, so a geometry created here can receive the same id as a bqplot
// geometry and silently claim its slot in the renderer cache, making the
// other mark draw the wrong geometry (seen as a scatter viewer that stays
// empty until its marks are recreated). patches/three+0.97.0.patch offsets
// the counters of the three.js copy bundled with this package, but under
// module federation the "three" this module receives can be another
// extension's unpatched copy of the same version (for example ipyvolume's or
// pythreejs'), so the offset has to be applied at runtime to whichever copy
// is actually in use. geometry.id is defined non-configurable and cannot be
// reassigned per object; creating throwaway geometries is the only way to
// advance the counter (around 30 ms for 50000 of them).
for (var i = 0; i < 50000; i++) {
    new THREE.BufferGeometry();
}
