export const getStartOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const getStartOfPreviousMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() - 1, 1);
};

export const getEndOfPreviousMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999);
};
