function loadBqplotGL() {
    // JupyterLab 4 resolves separately installed widget packages through
    // module federation, so the labextension bundle must use dynamic import.
    return import("bqplot-gl").catch(() => {
        throw new Error("bqplot-image-gl with bqplot 0.13 requires bqplot-gl. Install bqplot-gl so JupyterLab can load its labextension, or use bqplot 0.12.");
    });
}

export {
    loadBqplotGL
};
