document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const header = document.querySelector('.site-header');

    function updateResponsiveScale() {
        const vw = window.innerWidth;

        const logoScale = Math.min(1, (vw - 24) / 780);
        const devScale = Math.min(1, (vw - 16) / 1340);
        const poetryScale = Math.min(1, vw / 1600);

        root.style.setProperty('--logo-scale', logoScale.toFixed(4));
        root.style.setProperty('--dev-scale', devScale.toFixed(4));
        root.style.setProperty('--poetry-scale', poetryScale.toFixed(4));

        if (header) {
            header.style.height = `${Math.round(345 * logoScale + 48)}px`;
        }
    }

    window.addEventListener('resize', updateResponsiveScale);
    updateResponsiveScale();

    const cluster = document.querySelector('.content__gear-cluster');
    const devMoreBtn = document.querySelector('.dev__more-btn');

    let gearAngle = 0;
    let gearSpeed = 0.2;
    let gearTargetSpeed = 0.2;

    if (devMoreBtn) {
        devMoreBtn.addEventListener('mouseenter', () => { gearTargetSpeed = 1; });
        devMoreBtn.addEventListener('mouseleave', () => { gearTargetSpeed = 0.2; });
    }

    const wheelMesh = document.querySelector('.poetry__wheel-mesh');
    const oilStream = document.querySelector('.poetry__oil-stream');
    const poetryBtn = document.querySelector('.poetry__more-btn');

    let wheelAngle = 0;
    let wheelSpeed = 0.18;
    let wheelTargetSpeed = 0.18;

    let oilPos = 0;
    let oilSpeed = 1.2;
    let oilTargetSpeed = 1.2;

    const viscosity = 0.015;

    if (poetryBtn) {
        poetryBtn.addEventListener('mouseenter', () => {
            wheelTargetSpeed = 0.6;
            oilTargetSpeed = 3.6;
        });
        poetryBtn.addEventListener('mouseleave', () => {
            wheelTargetSpeed = 0.18;
            oilTargetSpeed = 1.2;
        });
    }

    function loop() {
        if (cluster) {
            gearSpeed += (gearTargetSpeed - gearSpeed) * 0.05;
            gearAngle = (gearAngle + gearSpeed) % 360;
            cluster.style.setProperty('--gear-deg', `${gearAngle}deg`);
        }

        if (wheelMesh) {
            wheelSpeed += (wheelTargetSpeed - wheelSpeed) * viscosity;
            wheelAngle = (wheelAngle + wheelSpeed) % 360;
            wheelMesh.style.setProperty('--wheel-deg', `${wheelAngle}deg`);
        }

        if (oilStream) {
            oilSpeed += (oilTargetSpeed - oilSpeed) * viscosity;
            oilPos = (oilPos + oilSpeed) % 280;
            oilStream.style.setProperty('--oil-pos', `${oilPos}px`);
        }

        requestAnimationFrame(loop);
    }

    loop();
});