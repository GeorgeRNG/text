import { StorageScope } from "./src";

const out = StorageScope.parse(await Bun.file('./test.txt').text())

console.log(out?.toString());

StorageScope.parse('game x = 0')