function loadBqplotGL() {
    // Classic widget frontends load nbextensions through RequireJS. Keeping
    // this AMD-only prevents bqplot 0.12 from fetching bqplot-gl eagerly.
    var amdRequire = typeof window !== "undefined" && (window.requirejs || window.require);
    if(!amdRequire) {
        return Promise.reject(new Error("bqplot-image-gl with bqplot 0.13 requires bqplot-gl. Install and enable bqplot-gl, or use bqplot 0.12."));
    }
    return new Promise((resolve, reject) => {
        amdRequire(["bqplot-gl"], resolve, () => {
            reject(new Error("bqplot-image-gl with bqplot 0.13 requires bqplot-gl. Install and enable bqplot-gl, or use bqplot 0.12."));
        });
    });
}

export {
    loadBqplotGL
};
