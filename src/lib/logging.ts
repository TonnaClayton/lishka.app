export const log = (message: string, ...data: any[]) => {
  if (import.meta.env.DEV) {
    console.log(message, ...data);
  }
};

export const warn = (message: string, ...data: any[]) => {
  if (import.meta.env.DEV) {
    console.warn(message, ...data);
  }
};

export const error = (message: string, ...data: any[]) => {
  if (import.meta.env.DEV) {
    console.error(message, ...data);
  }
};
