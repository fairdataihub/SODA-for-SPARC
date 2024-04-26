import { useState } from "react";
import useGlobalStore from "../../../stores/globalStore";
import { setAuthenticatedBioLucidaUserName } from "../../../stores/slices/authSlice";

import GuidedModePage from "../../containers/GuidedModePage";
import GuidedModeSection from "../../containers/GuidedModeSection";

import {
  TextInput,
  Paper,
  Button,
  Group,
  Alert,
  Text,
  PasswordInput,
  Center,
  Stack,
  Avatar,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconInfoCircle, IconUser } from "@tabler/icons-react";

import client from "../../../scripts/client";
import styles from "./BioLucidaLogin.module.css";
const BioLucidaLogin = () => {
  const authenticatedBioLucidaUserName = useGlobalStore(
    (state) => state.authenticatedBioLucidaUserName
  );
  const [errorMessage, setErrorMessage] = useState(null);

  const { getInputProps, formError, onSubmit } = useForm({
    mode: "uncontrolled",
    initialValues: {
      username: "",
      password: "",
    },
    validate: {
      username: (value) => (value ? null : "Username is required"),
      password: (value) => (value ? null : "Password is required"),
    },
  });

  const handleLogin = async (values) => {
    if (formError) return;
    setErrorMessage(null);

    try {
      const res = await client.post("/image_processing/biolucida_login", {
        username: values.username,
        password: values.password,
      });
      console.log(res); // Handle successful login here (e.g., navigate)
      setAuthenticatedBioLucidaUserName(values.username);
    } catch (error) {
      console.error(error);
      setErrorMessage("Invalid username or password");
    }
  };

  return (
    <GuidedModePage
      pageHeader="BioLucida sign in"
      pageDescription="Log in to BioLucida to upload the images you selected to the BioLucida SPARC repository."
    >
      <GuidedModeSection>
        <Center>
          <Paper
            radius="md"
            p="xl"
            withBorder
            style={{
              width: "400px",
            }}
          >
            {authenticatedBioLucidaUserName ? (
              <Stack align="center">
                <Avatar size={100} radius={100} />
                <Text ta="center" fz="lg" fw={500} mt="md">
                  {authenticatedBioLucidaUserName}
                </Text>
                <Text ta="center" c="dimmed" fz="sm">
                  Account connected
                </Text>

                <Button
                  variant="default"
                  fullWidth
                  mt="md"
                  onClick={() => {
                    setAuthenticatedBioLucidaUserName(null);
                  }}
                >
                  Log out
                </Button>
              </Stack>
            ) : (
              <form onSubmit={onSubmit(handleLogin)}>
                <Stack>
                  <TextInput
                    withAsterisk
                    label="BioLucida account username"
                    placeholder="ILoveMiscroscopes123"
                    {...getInputProps("username")}
                  />
                  <PasswordInput
                    withAsterisk
                    label="BioLucida account password"
                    placeholder="fuzzysocks123"
                    {...getInputProps("password")}
                  />
                  <Group justify="center" m="md">
                    <Button type="submit">Log in</Button>
                  </Group>
                </Stack>
              </form>
            )}

            {errorMessage && (
              <Alert variant="light" color="red" icon={<IconInfoCircle />}>
                {errorMessage}
              </Alert>
            )}
          </Paper>
        </Center>
      </GuidedModeSection>
    </GuidedModePage>
  );
};

export default BioLucidaLogin;
