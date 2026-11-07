/**
 * Useful math methods
 */
export default class MathUtil {

    /**
     * Check whether two numbers are equals, with an epsilon
     * @param x1
     * @param x2
     * @param epsilon
     */
    static equalFloat(x1: number, x2: number, epsilon: number = 1e-7): boolean {
        return Math.abs(x1 - x2) < epsilon;
    }

    /**
     * Checks whether the first number is greater than the second, with an epsilon
     * @param x1
     * @param x2
     * @param epsilon
     */
    static greaterThanFloat(x1: number, x2: number, epsilon: number = 1e-7): boolean {
        return x1 - x2 > -epsilon
    }

    /**
     * Checks whether the first number is less than the second, with an epsilon
     *
     * @param x1
     * @param x2
     * @param epsilon
     */
    static lessThanFloat(x1: number, x2: number, epsilon: number = 1e-7): boolean {
        return x1 - x2 < epsilon
    }
}