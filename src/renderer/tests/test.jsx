import renderer from "react-test-renderer";
import Link from "./test-link";
import React from "react";

test("adds 1 + 2 to equal 3", () => {
  expect(1 + 2).toBe(3);
});

it("changes the class when hovered", () => {
  const component = renderer.create(<Link page="http://www.facebook.com">Facebook</Link>);
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();

  // manually trigger the callback
  renderer.act(() => {
    tree.props.onMouseEnter();
  });
  // re-rendering
  tree = component.toJSON();
  expect(tree).toMatchSnapshot();

  // manually trigger the callback
  renderer.act(() => {
    tree.props.onMouseLeave();
  });
  // re-rendering
  tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
