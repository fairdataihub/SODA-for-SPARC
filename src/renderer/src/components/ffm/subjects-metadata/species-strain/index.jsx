import React from "react";
import ReactDOM from "react-dom";
import SodaComponentWrapper from "../../../utils/SodaComponentWrapper";
import Swal from "sweetalert2";
import { Select, Input } from "@mantine/core";
import { create } from "zustand";

while (!window.htmlPagesAdded) {
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Zustand store
const useStore = create((set) => ({
  selectedValue: "",
  inputValue: "",
  updateSelectedValue: (value) => set({ selectedValue: value }),
  updateInputValue: (value) => set({ inputValue: value }),
}));

const TestSwal = () => {
  const { selectedValue, inputValue, updateSelectedValue, updateInputValue } = useStore();

  return (
    <SodaComponentWrapper>
      <Select
        label="Your favorite library"
        placeholder="Pick value"
        data={["React", "Angular", "Vue", "Svelte"]}
      />
      <Input
        value={inputValue}
        onChange={(e) => updateInputValue(e.target.value)}
        placeholder="Type something"
      />
    </SodaComponentWrapper>
  );
};

document.getElementById("test-species-swal").addEventListener("click", async () => {
  await Swal.fire({
    title: "Your SweetAlert2 Title",
    html: '<div id="react-container"></div>',
    icon: "error",
    width: 800,
    heightAuto: false,
    backdrop: "rgba(0,0,0, 0.4)",
    showConfirmButton: true,
    confirmButtonText: "OK",

    preConfirm: () => {
      // Access the updated state values here
      const { selectedValue, inputValue } = useStore.getState();
      console.log("Selected Value:", selectedValue);
      console.log("Input Value:", inputValue);
    },
    didRender: () => {
      ReactDOM.render(<TestSwal />, document.getElementById("react-container"));
    },
    willClose: () => {
      ReactDOM.unmountComponentAtNode(document.getElementById("react-container"));
    },
  });
});
