document.addEventListener('DOMContentLoaded', () => {
    const cluster = document.querySelector('.content__gear-cluster');
    const moreBtn = document.querySelector('.dev__more-btn');

    if (!cluster || !moreBtn) return;

    let currentAngle = 0;
    let currentSpeed = 0.2;
    let targetSpeed = 0.2;
    const baseSpeed = 0.2;
    const boostSpeed = 1;
    const acceleration = 0.05;

    moreBtn.addEventListener('mouseenter', () => {
        targetSpeed = boostSpeed;
    });

    moreBtn.addEventListener('mouseleave', () => {
        targetSpeed = baseSpeed;
    });

    function animateGears() {
        currentSpeed += (targetSpeed - currentSpeed) * acceleration;
        currentAngle = (currentAngle + currentSpeed) % 360;

        cluster.style.setProperty('--gear-deg', `${currentAngle}deg`);

        requestAnimationFrame(animateGears);
    }

    animateGears();
});