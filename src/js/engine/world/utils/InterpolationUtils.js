export class InterpolationUtils {
    static smootherstep(t) {
        t = Math.max(0, Math.min(1, t));
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    static sigmoid(x, steepness = 1) {
        return 1 / (1 + Math.exp(-steepness * x));
    }

    static easeIn(x) {
        return x * x;
    }

    static easeOut(x) {
        return 1 - (1 - x) * (1 - x);
    }

    static easeInOut(x) {
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    }

    static lerp(a, b, t) {
        return a + t * (b - a);
    }

    static ridgeNoise(value) {
        value = Math.abs(value);
        value = 1 - value;
        return value * value;
    }
}