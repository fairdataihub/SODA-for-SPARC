import { useState } from "react";
import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";
import client from "../../../scripts/client";

import { TextInput, Checkbox, Button, Group, Box, Text } from "@mantine/core";
import { useForm } from "@mantine/form";

const BioLucidaLogin = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const logInForm = useForm({
    mode: "uncontrolled",
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length >= 0 ? null : "Password is required"),
    },
  });

  const onSubmit = async (values) => {
    console.log("values", values);
    const res = await client.get("/startup/echo?arg=server ready");
    console.log(res);
    setErrorMessage("Invalid email or password");
  };

  return (
    <GuidedModePage pageHeader="BioLucida sign in">
      <GuidedModeSection>
        <form onSubmit={onSubmit}>
          <TextInput
            withAsterisk
            label="Email"
            placeholder="your@email.com"
            key={logInForm.key("email")}
            {...logInForm.getInputProps("email")}
          />
          <TextInput
            withAsterisk
            label="Password"
            placeholder="fuzzysocks123"
            key={logInForm.key("password")}
            {...logInForm.getInputProps("password")}
          />

          <Group justify="flex-end" mt="md">
            <Button type="submit">Submit</Button>
          </Group>
        </form>
        {errorMessage && (
          <Text color="red" mt="sm">
            {errorMessage}
          </Text>
        )}
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default BioLucidaLogin;
