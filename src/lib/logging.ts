export const log = (message: string, ...data: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log(message, ...data);
  }
};

export const warn = (message: string, ...data: any[]) => {
  if (process.env.NODE_ENV === "development") {
    console.warn(message, ...data);
  }
};
