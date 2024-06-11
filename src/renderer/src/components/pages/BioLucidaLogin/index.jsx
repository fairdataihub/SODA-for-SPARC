import { useState } from "react";
import useGlobalStore from "../../../stores/globalStore";
import {
  setBioLucidaCredentials,
  clearBioLucidaCredentials,
} from "../../../stores/slices/authSlice";

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
  const userAuthenticatedToBioLucida = useGlobalStore(
    (state) => state.userAuthenticatedToBioLucida
  );
  const bioLucidaUsername = useGlobalStore((state) => state.bioLucidaUsername);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  const { getInputProps, formError, onSubmit } = useForm({
    mode: "uncontrolled",
    initialValues: {
      username: "jclark",
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
    setIsLoading(true); // Set loading to true before API call

    try {
      const res = await client.post("/image_processing/biolucida_login", {
        username: values.username,
        password: values.password,
      });
      const { data } = res;
      setBioLucidaCredentials(data.username, data.token);
    } catch (error) {
      console.error(error);
      setErrorMessage("Invalid username or password");
    }
    setIsLoading(false); // Set loading to false after API call finishes
  };

  return (
    <GuidedModePage
      pageHeader="BioLucida sign in"
      pageDescriptionArray={[
        "Log in to BioLucida to upload the images you selected to the BioLucida SPARC repository.",
      ]}
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
            {userAuthenticatedToBioLucida ? (
              <Stack align="center">
                <Avatar size={100} radius={100} />
                <Text ta="center" fz="lg" fw={500} mt="md">
                  {bioLucidaUsername}
                </Text>
                <Text ta="center" c="dimmed" fz="sm">
                  BioLucida Account connected
                </Text>

                <Button
                  variant="default"
                  fullWidth
                  mt="md"
                  onClick={() => {
                    clearBioLucidaCredentials();
                  }}
                >
                  Log out
                </Button>
              </Stack>
            ) : (
              <form onSubmit={onSubmit(handleLogin)}>
                <Stack>
                  <TextInput
                    label="BioLucida account username"
                    placeholder="ILoveMiscroscopes123"
                    {...getInputProps("username")}
                    disabled={isLoading} // Disable form while loading
                  />
                  <PasswordInput
                    label="BioLucida account password"
                    placeholder="fuzzysocks123"
                    {...getInputProps("password")}
                    disabled={isLoading} // Disable form while loading
                  />
                  <Group justify="center" m="md">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Connecting account..." : "Connect BioLucida Account"}
                    </Button>
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
