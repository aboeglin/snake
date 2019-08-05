const SRE = require("./index");

describe("render engine", () => {
  test("It should have a render function", () => {
    expect(typeof SRE.render).toBe("function");
  });

  test("It should have a rect function", done => {
    SRE.render(props => {
      expect(typeof SRE.rect).toBe("function");
      done();
    });
  });

  test("The rect function provided by render should build a rect", () => {
    const expected = {
      type: "RECTANGLE",
      position: { x: 0, y: 0, z: 0, width: 5 },
      children: []
    };

    const actual = SRE.render(props =>
      SRE.rect({ x: 0, y: 0, z: 0, width: 5 })
    );

    expect(actual).toEqual(expected);
  });

  test("The rect function should take children", () => {
    const expected = {
      type: "RECTANGLE",
      position: { x: 0, y: 0, z: 0, width: 5 },
      children: [
        {
          type: "RECTANGLE",
          position: { x: 0, y: 0, z: 0, width: 5 },
          children: []
        }
      ]
    };

    const actual = SRE.render(props =>
      SRE.rect({ x: 0, y: 0, z: 0, width: 5 }, [
        SRE.rect({ x: 0, y: 0, z: 0, width: 5 })
      ])
    );

    expect(actual).toEqual(expected);
  });

  test("It should have a circle function", done => {
    SRE.render(props => {
      expect(typeof SRE.circle).toBe("function");
      done();
    });
  });

  test("rect should take a props param that bundles all info about the rect", () => {
    const expected = {
      type: "RECTANGLE",
      position: { x: 2, y: 2, z: 0, width: 5 },
      children: []
    };

    const actual = SRE.render(props =>
      SRE.rect({ x: 2, y: 2, z: 0, width: 5 })
    );

    expect(actual).toEqual(expected);
  });
});
