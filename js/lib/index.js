/*jshint esversion: 6 */

// Export widget models and views, and the npm package version number.
export * from "./imagegl.js";
export * from "./contour.js";
export * from './BrushEllipseSelectorModel';
export * from './BrushEllipseSelector';
export const version = require('../package.json').version;
