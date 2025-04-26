import { text, image, video } from "@infra/gemini";

console.log(await text("why are there sunsets?"));
console.log(await image("a beautiful sunset"));
console.log(await video("a rising sun"));
