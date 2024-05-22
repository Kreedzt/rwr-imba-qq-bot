export const ignoreNullChar = (str: string): string => {
    const nullStart = str.indexOf('\x00');

    if (nullStart !== -1) {
        return str.slice(0, nullStart);
    }

    return str;
};
