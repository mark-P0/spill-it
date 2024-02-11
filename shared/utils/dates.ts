import { addDays } from "date-fns";

export const today = () => new Date();
export const tomorrow = () => addDays(today(), 1);
