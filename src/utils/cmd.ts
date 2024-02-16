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

export const parseIgnoreSpace = (cmdList: string[], raw: string): Map<string, boolean> => {
    let step1Msg = raw;

    cmdList.forEach((cmd) => {
        step1Msg = step1Msg.replace(cmd, '');
    });
    let skipped = true;
    let targetName = '';

    const params = new Map<string, boolean>();

    let hasNameStart = false;
    step1Msg.split(' ').forEach((userInput) => {
        if (userInput === '' && skipped) {
            skipped = false;
        } else if (userInput === '') {
            if (hasNameStart) {
                targetName += ' ';
            }
        } else {
            if (hasNameStart) {
                targetName += ' ' + userInput;
            } else {
                targetName += userInput;
            }
            hasNameStart = true;
        }
    });

    if (targetName) {
        params.set(targetName, true);
    }

    return params;
};
