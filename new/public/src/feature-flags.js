// Feature flags — URL is the single source of truth
// Each flag defaults ON and can be disabled via ?flag=0

const _params = new URLSearchParams(window.location.search);

const riveEnabled = _params.get('rive') !== '0';
function toggleRive() {
    const url = new URL(window.location.href);
    if (riveEnabled) {
        url.searchParams.set('rive', '0');
    } else {
        url.searchParams.delete('rive');
    }
    window.location.href = url.toString();
}

const bgSwapEnabled = _params.get('bgswap') !== '0';
function toggleBgSwap() {
    const url = new URL(window.location.href);
    if (bgSwapEnabled) {
        url.searchParams.set('bgswap', '0');
    } else {
        url.searchParams.delete('bgswap');
    }
    window.location.href = url.toString();
}
