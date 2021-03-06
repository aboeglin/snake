import { handleEvent, fromDOMEvent } from "./events";
import { reconcile } from "./core";
import Rect from "./nodes/rect";
import { createElement } from "./create-element";

/** @jsx createElement */

// TODO: Rewrite tests with reconcile to have a real tree
// TODO: Move global events to instance method instead.
describe("events", () => {
  test("handleEvent should call the click handler of a Rect when clicked in", () => {
    const clickHandler = jest.fn();
    const root = reconcile(
      {},
      <Rect
        onClick={clickHandler}
        x={50}
        y={50}
        z={0}
        width={100}
        height={100}
      />
    );

    const event = {
      type: "click",
      x: 100,
      y: 100,
    };

    handleEvent(event, root);

    expect(clickHandler).toHaveBeenCalled();
  });

  test("handleEvent should not call the click handler of a Rect when clicked outside", () => {
    const clickHandler = jest.fn();
    const root = reconcile(
      {},
      <Rect
        onClick={clickHandler}
        x={50}
        y={50}
        z={0}
        width={100}
        height={100}
      />
    );

    const event = {
      type: "click",
      x: 110,
      y: 100,
    };

    handleEvent(event, root);

    expect(clickHandler).not.toHaveBeenCalled();
  });

  test("handleEvent should not call the click handler of a Rect when y axis is not in the bounds", () => {
    const clickHandler = jest.fn();
    const root = reconcile(
      {},
      <Rect
        onClick={clickHandler}
        x={50}
        y={50}
        z={0}
        width={100}
        height={100}
      />
    );

    const event = {
      type: "click",
      x: 90,
      y: 110,
    };

    handleEvent(event, root);

    expect(clickHandler).not.toHaveBeenCalled();
  });

  test("handleEvent should call the event handler with the event object as parameter", () => {
    const clickHandler = jest.fn();

    const root = reconcile(
      {},
      <Rect
        onClick={clickHandler}
        x={50}
        y={50}
        z={0}
        width={100}
        height={100}
      />
    );

    const event = {
      type: "click",
      x: 90,
      y: 90,
    };

    handleEvent(event, root);

    expect(clickHandler).toHaveBeenCalledWith(event);
  });

  test("handleEvent should call the event handler of a child in the tree that matches if the root node isn't matching", () => {
    const clickHandler = jest.fn();
    const Root = () => (
      <Rect
        onClick={clickHandler}
        x={50}
        y={50}
        z={0}
        width={100}
        height={100}
      />
    );

    const root = reconcile({}, <Root />);

    const event = {
      type: "click",
      x: 90,
      y: 90,
    };

    handleEvent(event, root);

    expect(clickHandler).toHaveBeenCalledWith(event);
  });

  test("handleEvent should not throw if the node does not have a onClick event", () => {
    const Root = () => <Rect x={50} y={50} z={0} width={100} height={100} />;

    const root = reconcile({}, <Root />);

    const event = {
      type: "click",
      x: 90,
      y: 90,
    };

    expect(() => {
      handleEvent(event, root);
    }).not.toThrow();
  });

  // test("handleEvent should call onGlobalKeyPress on node with key event object", () => {
  //   const keyPressHandler = jest.fn();
  //   const Root = () => <KeyPressHandler />;

  //   const KeyPressHandler = withGlobalEventHandler(
  //     keyPressHandler,
  //     "onGlobalKeyPress"
  //   )(null, () => {});

  //   const root = reconcile({}, <Root />);

  //   const event = {
  //     type: "keypress",
  //     modifiers: [],
  //     key: "d",
  //     keyCode: 100,
  //   };

  //   handleEvent(event, root);

  //   expect(keyPressHandler).toHaveBeenCalledWith(event);
  // });

  // test("handleEvent should call onGlobalKeyPress on any node that defines it", () => {
  //   const keyPressHandler1 = jest.fn();
  //   const keyPressHandler2 = jest.fn();

  //   const Root = () => <KeyPressHandler1 />;

  //   const KeyPressHandler1 = withGlobalEventHandler(
  //     keyPressHandler1,
  //     "onGlobalKeyPress"
  //   )(null, () => <KeyPressHandler2 />);

  //   const KeyPressHandler2 = withGlobalEventHandler(
  //     keyPressHandler2,
  //     "onGlobalKeyPress"
  //   )(null, () => {});

  //   const root = reconcile({}, <Root />);

  //   const event = {
  //     type: "keypress",
  //     modifiers: [],
  //     key: "d",
  //     keyCode: 100,
  //   };

  //   handleEvent(event, root);

  //   expect(keyPressHandler1).toHaveBeenCalledWith(event);
  //   expect(keyPressHandler2).toHaveBeenCalledWith(event);
  // });

  // test("handleEvent should call onGlobalKeyDown on node with key event object", () => {
  //   const keyDownHandler = jest.fn();
  //   const Root = () => <KeyDownHandler />;

  //   const KeyDownHandler = withGlobalEventHandler(
  //     keyDownHandler,
  //     "onGlobalKeyDown"
  //   )(null, () => {});

  //   const root = reconcile({}, <Root />);

  //   const event = {
  //     type: "keydown",
  //     modifiers: [],
  //     key: "d",
  //     keyCode: 100,
  //   };

  //   handleEvent(event, root);

  //   expect(keyDownHandler).toHaveBeenCalledWith(event);
  // });

  // test("handleEvent should call onGlobalKeyDown on any node that defines it", () => {
  //   const keyDownHandler1 = jest.fn();
  //   const keyDownHandler2 = jest.fn();

  //   const Root = () => <KeyPressHandler1 />;

  //   const KeyPressHandler1 = withGlobalEventHandler(
  //     keyDownHandler1,
  //     "onGlobalKeyDown"
  //   )(null, () => <KeyPressHandler2 />);

  //   const KeyPressHandler2 = withGlobalEventHandler(
  //     keyDownHandler2,
  //     "onGlobalKeyDown"
  //   )(null, () => {});

  //   const root = reconcile({}, <Root />);

  //   const event = {
  //     type: "keydown",
  //     modifiers: [],
  //     key: "d",
  //     keyCode: 100,
  //   };

  //   handleEvent(event, root);

  //   expect(keyDownHandler1).toHaveBeenCalledWith(event);
  //   expect(keyDownHandler2).toHaveBeenCalledWith(event);
  // });

  test("fromDOMEvent should build an event object with projected coordinates", () => {
    const domEvent = {
      type: "click",
      offsetX: 200,
      offsetY: 200,
    };

    const container = {
      clientHeight: 300,
    };

    const actual = fromDOMEvent(container, domEvent);
    const expected = {
      type: "click",
      x: 200,
      y: 100,
    };

    expect(actual).toEqual(expected);
  });

  test("fromDOMEvent should build an event object for key press events", () => {
    const domEvent = {
      type: "keypress",
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      key: "d",
      keyCode: 100,
      charCode: 100,
      code: "KeyD",
    };

    const container = {};

    const actual = fromDOMEvent(container, domEvent);
    const expected = {
      type: "keypress",
      modifiers: [],
      key: "d",
      keyCode: 100,
    };

    expect(actual).toEqual(expected);
  });

  test("fromDOMEvent should build an event object for key down events", () => {
    const domEvent = {
      type: "keydown",
      altKey: false,
      ctrlKey: false,
      shiftKey: false,
      key: "d",
      keyCode: 100,
      charCode: 100,
      code: "KeyD",
    };

    const container = {};

    const actual = fromDOMEvent(container, domEvent);
    const expected = {
      type: "keydown",
      modifiers: [],
      key: "d",
      keyCode: 100,
    };

    expect(actual).toEqual(expected);
  });

  test("fromDOMEvent should return a default unknown event if type is not handled", () => {
    const domEvent = {
      type: "somethingnothandled",
    };

    const container = {};

    const actual = fromDOMEvent(container, domEvent);
    const expected = {
      type: "unknown",
    };

    expect(actual).toEqual(expected);
  });
});
