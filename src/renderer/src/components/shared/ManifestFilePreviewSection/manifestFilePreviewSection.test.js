import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
// import { handleOrganizeDSGenerateLocalManifestCopyButtonClick } from "./utils";
import ManifestFilePreviewSection from "./index";

// jest.mock("./utils", () => ({
//   handleOrganizeDSGenerateLocalManifestCopyButtonClick: jest.fn(),
// }));

// Mock the global window functions
beforeEach(() => {
  window.guidedOpenManifestEditSwal = jest.fn();
  window.openmanifestEditSwal = jest.fn();
});

const renderWithMantine = (ui) => render(<MantineProvider>{ui}</MantineProvider>);

test("renders the title", () => {
  renderWithMantine(<ManifestFilePreviewSection />);
  expect(screen.getByText(/Manifest File Preview/i)).toBeInTheDocument();
});

// test("calls onClick when button is clicked", () => {
//   const handleClick = jest.fn();
//   render(<MyButton onClick={handleClick} />);
//   fireEvent.click(screen.getByRole("button"));
//   expect(handleClick).toHaveBeenCalled();
// });

// test("calls guidedOpenManifestEditSwal when gm-manifest-file-preview button is clicked", () => {
//   render(<ManifestFilePreviewSection id="gm-manifest-file-preview" />);
//   const button = screen.getByRole("button", { name: /Preview\/Edit Manifest file/i });
//   fireEvent.click(button);
//   expect(window.guidedOpenManifestEditSwal).toHaveBeenCalled();
// });

// test("calls openmanifestEditSwal when ffm-manifest-file-preview button is clicked", () => {
//   render(<ManifestFilePreviewSection id="ffm-manifest-file-preview" />);
//   const button = screen.getByRole("button", { name: /Preview\/Edit Manifest file/i });
//   fireEvent.click(button);
//   expect(window.openmanifestEditSwal).toHaveBeenCalled();
// });
