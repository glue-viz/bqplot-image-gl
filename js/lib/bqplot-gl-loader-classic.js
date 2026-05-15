function loadBqplotGL() {
    // Classic widget frontends load nbextensions through RequireJS. Keeping
    // this AMD-only prevents bqplot 0.12 from fetching bqplot-gl eagerly.
    var amdRequire = typeof window !== "undefined" && (window.requirejs || window.require);
    if(!amdRequire) {
        return Promise.reject(new Error("bqplot-image-gl loaded its classic bqplot-gl bridge without a RequireJS loader."));
    }
    return new Promise((resolve, reject) => {
        amdRequire(["bqplot-gl"], resolve, () => {
            reject(new Error("bqplot-image-gl with bqplot 0.13 requires bqplot-gl. Install bqplot-gl and enable its nbextension for classic frontends, or use bqplot 0.12."));
        });
    });
}

export {
    loadBqplotGL
};
