import renderer from "react-test-renderer";
import { render } from "@testing-library/react";
import Link from "./test-link";
import React from "react";

test("adds 1 + 2 to equal 3", () => {
  expect(1 + 2).toBe(3);
});

it("is an example of a snapshot test using react-test-renderer", () => {
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

it("is an example of a unit test of the Link component", () => {
  const component = render(<Link page="http://www.facebook.com">Facebook</Link>);
  const linkElement = component.getByText("Facebook");
  expect(linkElement).toBeInTheDocument();
  expect(linkElement).toHaveClass("normal");

  renderer.act(() => {
    component.getByText("Facebook").onMouseEnter();
  });
  expect(linkElement).toHaveClass("hovered");

  renderer.act(() => {
    component.getByText("Facebook").onMouseLeave();
  });
  expect(linkElement).toHaveClass("normal");
});
