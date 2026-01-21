export function tilt(node: HTMLElement, settings = { max: 15, perspective: 1000 }) {
    let width = node.offsetWidth;
    let height = node.offsetHeight;
    let left = node.offsetLeft;
    let top = node.offsetTop;

    function handleMouseMove(e: MouseEvent) {
        const x = e.clientX - node.getBoundingClientRect().left;
        const y = e.clientY - node.getBoundingClientRect().top;

        const centerX = node.offsetWidth / 2;
        const centerY = node.offsetHeight / 2;

        const rotateX = ((y - centerY) / centerY) * -settings.max;
        const rotateY = ((x - centerX) / centerX) * settings.max;

        node.style.transform = `perspective(${settings.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    }

    function handleMouseLeave() {
        node.style.transform = `perspective(${settings.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    }

    node.style.transition = 'transform 0.1s ease-out';
    node.addEventListener('mousemove', handleMouseMove);
    node.addEventListener('mouseleave', handleMouseLeave);

    return {
        destroy() {
            node.removeEventListener('mousemove', handleMouseMove);
            node.removeEventListener('mouseleave', handleMouseLeave);
        }
    };
}
