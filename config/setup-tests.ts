import "@testing-library/jest-dom";
import { wipe } from "../packages/firestore/__test__/helpers";

global.afterAll(async () => {
  await wipe();
});
