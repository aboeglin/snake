import { curry, pipe } from "ramda";

import { Instance } from "./instance";
import { createElement } from "./create-element";
import { createClock } from "./clock";
import { handleEvent, fromDOMEvent } from "./events";
import constants from "./constants";

// TODO: Get rid of unused config
const defaultConfig = {
  clock: createClock(Date.now),
};

const throttle = curry((delay, fn) => {
  let timeout = null;
  return (...args) => {
    if (!timeout) {
      timeout = setTimeout(() => {
        fn(...args);
        timeout = null;
      }, delay);
    }
  };
});

const updateQueue = [];

export const pushUpdate = instance => {
  instance.makeDirty();
  updateQueue.push(instance);
  processQueue();
};

const processQueue = throttle(constants.BATCH_UPDATE_INTERVAL, () => {
  const dynamicInstances = [];
  let instanceToUpdate;
  while ((instanceToUpdate = updateQueue.shift())) {
    if (instanceToUpdate.isDirty()) {
      reconcile({}, instanceToUpdate.getVNode());
    }

    if (instanceToUpdate.isDynamic()) {
      dynamicInstances.push(instanceToUpdate);
    }
  }
  // When everything is processed and the queue is empty, we already push the dynamic instances for the next iteration
  // We need the timeout to avoid the recursion
  setTimeout(() => dynamicInstances.forEach(pushUpdate), 0);
});

const instanceFromNode = vnode => {
  if (vnode && !vnode._instance) {
    Object.defineProperty(vnode, "_instance", {
      value: Instance(pushUpdate, vnode),
      configurable: false,
      writable: false,
    });
  }

  return vnode._instance;
};

const sanitizeAndCopyChildren = children => {
  if (Array.isArray(children)) {
    return [...children];
  } else if (children) {
    return [children];
  }
  return [];
};

export const reconcile = curry((config, vnode) => {
  // We need that copy for the unmount, otherwise the tree is already mutated and we can't diff it anymore.
  const oldChildren = sanitizeAndCopyChildren(vnode.children);

  let instance = instanceFromNode(vnode);

  // Compute the children of the newNode
  const nextRender = instance.render(vnode) || [];

  // Render will return the same reference if it shouldn't be updated. Which happens if state and props
  // have not changed since the previous render.
  if (nextRender === vnode.children && vnode.type && !vnode.type._system) {
    return vnode;
  }

  vnode.children = nextRender;

  // If it's a core node, we assign what is rendered to the node directly.
  if (vnode.type && vnode.type._system) {
    vnode = reconcile({}, vnode.children);
  }

  // We wrap children that are single objects in arrays for consistency
  // TODO: Should this be just for objects ?
  // Before that should we record the initial children type so that later we
  // can separate between arrays which need keys and other types ?
  // Render could probably do that and set one of:
  // - CHILDREN_OBJECT
  // - CHILDREN_EMPTY
  // - CHILDREN_VALUE
  // - CHILDREN_ARRAY
  if (!Array.isArray(vnode.children) && typeof vnode.children === "object") {
    vnode.children = [vnode.children];
  }

  if (Array.isArray(vnode.children)) {
    vnode.children.forEach((newChild, i) => {
      const oldChild = findVNodeByKey(
        oldChildren,
        oldChildren[i],
        newChild.key
      );

      // Assign children oldChildren to children of new children
      // so that the next recursion can access these to retrive the
      // instance.
      if (oldChild && oldChild.children) {
        newChild.children = oldChild.children;
      }

      // Reassign instances of previous children to new children
      if (oldChild && oldChild._instance && oldChild.type === newChild.type) {
        Object.defineProperty(newChild, "_instance", {
          value: oldChild._instance,
          configurable: false,
          writable: false,
        });
      }
    });
  }

  // Check for unmounted
  oldChildren.forEach((oldChild, i) => {
    const newChild = findVNodeByKey(
      vnode.children,
      vnode.children[i],
      oldChild.key
    );

    if (
      (!newChild || (newChild && newChild.type !== oldChild.type)) &&
      oldChild._instance
    ) {
      oldChild._instance.triggerUnmounted();
    }
  });

  if (Array.isArray(vnode.children) && vnode.children.length > 0) {
    vnode.children = vnode.children.map(reconcile(config));
  }

  return vnode;
});

const findVNodeByKey = curry((children, fallback, key) =>
  key !== undefined ? children.find(x => x.key === key) || fallback : fallback
);

export const initWithRenderer = (container, render, config = defaultConfig) => {
  // We need to closure the vdom, so that event handlers act on what is currently rendered
  let tree = null;

  const wireEvent = pipe(
    fromDOMEvent(container),
    event => handleEvent(event, tree)
  );

  const start = vnode => {
    tree = reconcile(config, vnode);
    renderLoop();
  };

  const renderLoop = () => {
    render(tree);
    requestAnimationFrame(renderLoop);
  };

  container.addEventListener("click", wireEvent);
  document.body.addEventListener("keypress", wireEvent);
  document.body.addEventListener("keydown", wireEvent);

  return start;
};

export const enhance = curry((fn, key, Node) => {
  const enhancer = (props, internals) => {
    const { children, ...rest } = props;
    const computed = fn(internals, props);

    return key === null
      ? createElement(Node, rest, children)
      : createElement(Node, { ...rest, [key]: computed }, children);
  };

  Object.defineProperty(enhancer, "__ENHANCER__", {
    value: true,
    writable: false,
    configurable: false,
  });

  enhancer.displayName = Node.name;

  return enhancer;
});
