export const awaitTimeout = async (interval: number) => {
    return new Promise((res) => {
        setTimeout(res, interval);
    });
}
