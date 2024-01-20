export const getFirstCommand = (msg: string) => {
    const fixedMsg = msg.trim().toLowerCase().replace('#', '');
    return fixedMsg.split(' ')[0];
};

export const getCommandParams = (
    msg: string,
    defaultParams?: Record<string, boolean>
): Map<string, boolean> => {
    const fixedMsg = msg.replace('#', '');

    const [firstCommand, ...params] = fixedMsg
        .split(' ')
        .filter((b) => b !== '');

    const resMap = new Map<string, boolean>(
        Object.entries(defaultParams ?? {})
    );

    params.forEach((p) => {
        resMap.set(p, true);
    });

    return resMap;
};
