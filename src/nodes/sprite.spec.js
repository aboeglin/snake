const Sprite = require("./sprite");
const { Node } = require("../node");
const { traverse } = require("../core");
const { createClock } = require("../clock");

const getTime = () => 500;
const clock = createClock(getTime);
const config = { clock };

const configuredTraverse = traverse(config);

describe("Sprite", () => {
  test("It should have a Sprite function", () => {
    expect(typeof Sprite).toBe("function");
  });

  test("The Rect function should build a rect js object", () => {
    const expected = {
      type: "SPRITE",
      x: 0,
      y: 0,
      z: 0,
      width: 5,
      height: 5,
      texture: {
        width: 100,
        height: 100,
        data: []
      },
      children: [],
    };

    const actual = configuredTraverse(Sprite({
      x: 0,
      y: 0,
      z: 0,
      width: 5,
      height: 5,
      children: [],
      // TODO: verify that texture is complete
      texture: {
        width: 100,
        height: 100,
        data: []
      }
    }));

    expect(actual).toEqual(expected);
  });
});
